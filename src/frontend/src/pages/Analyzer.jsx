import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip } from "lucide-react";

function Analyzer({ onBackToHome }) {
  const [stars, setStars] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Star background animation (unchanged)
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
      setTimeout(() => {
        setStars((prev) => prev.filter((star) => star.id !== newStar.id));
      }, (newStar.duration + newStar.delay) * 1000);
    };

    for (let i = 0; i < 20; i++) setTimeout(createStar, i * 300);
    const interval = setInterval(createStar, 800);
    return () => clearInterval(interval);
  }, [messages, typingMessage]);

  // Typing animation
  const typeText = async (text, onComplete) => {
    setIsTyping(true);
    setTypingMessage("");

    const baseDelay = 40;
    const minDelay = 15;
    const maxDelay = 50;

    const adaptiveDelay = Math.max(
      minDelay,
      maxDelay - Math.min(text.length / 5, maxDelay - minDelay)
    );

    for (let i = 0; i < text.length; i++) {
      setTypingMessage((prev) => prev + text[i]);
      await new Promise((res) => setTimeout(res, adaptiveDelay));
    }

    setIsTyping(false);
    onComplete();
  };

  // Send message or file
  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    const userMessage = {
      role: "user",
      content: input || (file && `📎 ${file.name}`),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_query", input || "");
      if (file) formData.append("file", file);

      const response = await axios.post(
        "http://localhost:3000/api/retrieve-response",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const aiResponse =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);

      typeText(aiResponse, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setLoading(false);
      });
    } catch (error) {
      const errorResponse =
        "Error connecting to debate analysis service. Please try again.";
      typeText(errorResponse, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorResponse },
        ]);
        setLoading(false);
      });
    } finally {
      // Reset both file state and input field
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
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".txt")) {
      setFile(selectedFile);
    } else {
      alert("Please upload only .txt files.");
      e.target.value = ""; // reset input
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  // Render
  return (
    <div className="min-h-screen flex-1 flex flex-col text-center overflow-hidden">
      {/* Messages Area */}
      <div className="mt-40 flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Start a Debate Analysis
              </h2>
              <p className="text-lg text-dark-silver mb-8">
                Ask me anything about political debates, argument analysis, or
                find matching debate topics.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className="flex justify-center">
                <div
                  className={`max-w-2xl w-full rounded-2xl p-6 text-base leading-relaxed border backdrop-blur-md ${
                    message.role === "user"
                      ? "bg-electric-purple/10 border-electric-purple/30 text-white"
                      : "bg-white/10 border-white/20 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-center">
                <div className="max-w-2xl w-full rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {typingMessage}
                    <span className="animate-pulse">▊</span>
                  </p>
                </div>
              </div>
            )}

            {loading && !isTyping && (
              <div className="flex justify-center">
                <div className="max-w-2xl w-full rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  <div className="flex items-center space-x-4">
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
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key="inputBar"
          initial={{ y: messages.length === 0 ? -275 : -325, opacity: 1 }}
          animate={{ y: messages.length === 0 ? -275 : -70, opacity: 1 }}
          transition={{ duration: 1.0, type: "spring" }}
          className="px-6 py-6"
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-[#2c2c30] rounded-2xl px-2 py-1 shadow-xl border border-[#47475b]">
              <label
                className="cursor-pointer px-3"
                title="Upload a transcript (.txt file)"
              >
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

              {/* Text Input */}
              <textarea
                className="flex-1 resize-none bg-transparent text-white px-4 py-2 focus:outline-none"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !file)}
                className={`ml-2 px-4 py-2 rounded-2xl text-white font-medium transition 
                  ${
                    loading || (!input.trim() && !file)
                      ? "bg-gray-600 cursor-not-allowed opacity-60"
                      : "bg-electric-purple hover:bg-purple-700 active:scale-95"
                  }`}
              >
                Send
              </button>
            </div>

            {/* File name preview */}
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
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Analyzer;
