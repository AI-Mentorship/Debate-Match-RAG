import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip } from "lucide-react";

const SYSTEM_PROMPTS = {
  "Debate Opponent":
    "You are a skilled debate opponent. Engage directly with the user's arguments by presenting thoughtful counterarguments, acknowledging valid points, and challenging weak reasoning. Be respectful but intellectually rigorous.",
  "Debate Analyst":
    "You are an expert debate analyst. Analyze both sides' arguments objectively, highlight logical strengths and fallacies, and provide a reasoned conclusion.",
  "Friendly Coach":
    "You are a friendly debate coach. Offer constructive feedback, encouragement, and tips for improving argumentation and delivery.",
  "Fact Checker":
    "You are a meticulous fact checker. Identify any factual inaccuracies, verify data or claims, and cite credible sources when possible.",
  "Neutral Moderator":
    "You are a neutral debate moderator. Keep the discussion balanced, clarify misunderstandings, and ensure both perspectives are heard.",
  "Critical Thinking Teacher":
    "You are a teacher of critical thinking. Guide the user to question assumptions, identify biases, and think logically about arguments.",
  "Socratic Questioner":
    "You are a Socratic questioner. Respond to the user's arguments with probing questions that stimulate deeper reasoning and reflection.",
};

function ChatInterface({ onBackToHome }) {
  const [stars, setStars] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [aiMode, setAiMode] = useState("Debate Opponent");
  const [systemPrompt, setSystemPrompt] = useState(
    SYSTEM_PROMPTS["Debate Opponent"]
  );

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 🌌 Animated stars
  useEffect(() => {
    const createStar = () => {
      const newStar = {
        id: Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
        size: 1 + Math.random() * 2,
      };
      setStars((prev) => [...prev, newStar]);
      setTimeout(
        () => setStars((prev) => prev.filter((s) => s.id !== newStar.id)),
        (newStar.duration + newStar.delay) * 1000
      );
    };
    for (let i = 0; i < 20; i++) setTimeout(createStar, i * 300);
    const interval = setInterval(createStar, 800);
    return () => clearInterval(interval);
  }, []);

  // ✍️ Typing animation
  const typeText = async (text, onComplete) => {
    setIsTyping(true);
    setTypingMessage("");
    const baseDelay = 40,
      minDelay = 15,
      maxDelay = 50;
    const adaptiveDelay = Math.max(
      minDelay,
      maxDelay - Math.min(text.length / 5, maxDelay - minDelay)
    );
    for (let i = 0; i < text.length; i++) {
      setTypingMessage((prev) => prev + text[i]);
      await new Promise((res) => setTimeout(res, 10));
    }
    setIsTyping(false);
    onComplete();
  };

  // 🚀 Send message
  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    const userMessage = { role: "user", content: input || `📎 ${file?.name}` };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare context if a file is uploaded
      const contextText = file ? await file.text() : "";

      // Construct payload for latest backend
      const payload = {
        query: input || "", // user prompt
        context: contextText, // optional file content
        system_prompt: systemPrompt, // selected AI mode prompt
        conversation_history: messages.slice(-8), // last 8 messages
        max_completion_tokens: 5000, // use supported parameter
        // Note: temperature is omitted, as it's unsupported
      };

      const res = await axios.post("http://localhost:3000/query", payload, {
        headers: { "Content-Type": "application/json" },
      });

      const aiResponse =
        res.data?.response || res.data?.error || "Unexpected response.";

      typeText(aiResponse, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      const errorMsg = "⚠️ Error connecting to backend. Ensure it's running.";
      typeText(errorMsg, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        setLoading(false);
      });
    } finally {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith(".txt")) setFile(f);
    else {
      alert("Please upload only .txt files.");
      e.target.value = "";
    }
  };

  useEffect(
    () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages, typingMessage]
  );

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-[#0a0a0a] via-[#141414] to-[#1e1e20] text-white overflow-hidden">
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute bg-white rounded-full opacity-70"
            style={{ left: `${s.left}%`, width: s.size, height: s.size }}
            animate={{ y: ["0%", "-120vh"], opacity: [1, 0] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Start a Debate
              </h2>
              <p className="text-lg text-light-silver mb-8">
                Ask me anything, upload transcripts, or analyze arguments.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className="flex justify-center">
                <div
                  className={`max-w-2xl w-full rounded-2xl p-6 text-base leading-relaxed border backdrop-blur-md ${
                    m.role === "user"
                      ? "bg-electric-purple/10 border-electric-purple/30 text-white"
                      : "bg-white/10 border-white/20 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-center">
                <div className="max-w-2xl w-full rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  <p className="whitespace-pre-wrap">
                    {typingMessage}
                    <span className="animate-pulse">▊</span>
                  </p>
                </div>
              </div>
            )}
            {loading && !isTyping && (
              <div className="flex justify-center">
                <div className="max-w-2xl w-full rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md flex items-center space-x-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-light-silver text-sm">
                    Analyzing arguments...
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar with drop animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key="inputBar"
          initial={{ y: messages.length === 0 ? -275 : -325, opacity: 1 }}
          animate={{ y: messages.length === 0 ? -275 : -70, opacity: 1 }}
          transition={{ duration: 1.0, type: "spring" }}
          className="px-6 py-6"
        >
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="flex items-center bg-[#2c2c30] rounded-2xl px-2 py-1 shadow-xl border border-[#47475b]">
              <label className="cursor-pointer px-3" title="Upload transcript">
                <Paperclip
                  className="text-light-silver hover:text-white"
                  size={22}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

              <textarea
                className="flex-1 resize-none bg-transparent text-white px-4 py-2 focus:outline-none"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />

              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !file)}
                className={`ml-2 px-4 py-2 rounded-2xl text-white font-medium transition ${
                  loading || (!input.trim() && !file)
                    ? "bg-gray-600 cursor-not-allowed opacity-60"
                    : "bg-electric-purple hover:bg-purple-700 active:scale-95"
                }`}
              >
                Send
              </button>
            </div>

            {file && (
              <p className="text-sm text-light-silver mt-2 ml-2 flex items-center">
                📎 {file.name}
                <button
                  onClick={() => setFile(null)}
                  className="ml-2 text-red-400 hover:text-red-500"
                >
                  ✕
                </button>
              </p>
            )}

            {/* AI Mode Dropdown */}
            <div className="flex items-center gap-2 justify-center pt-1">
              <label className="text-sm text-light-silver">AI Mode:</label>
              <select
                value={aiMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setAiMode(mode);
                  setSystemPrompt(SYSTEM_PROMPTS[mode]);
                }}
                className="bg-[#1e1e23] text-white text-sm px-3 py-1 rounded-lg border border-[#32324a] focus:outline-none focus:border-electric-purple"
              >
                {Object.keys(SYSTEM_PROMPTS).map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ChatInterface;
