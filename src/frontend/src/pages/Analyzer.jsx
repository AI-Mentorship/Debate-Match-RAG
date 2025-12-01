import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom'
import { Paperclip, Upload, CheckCircle } from "lucide-react";

const SYSTEM_PROMPTS = {
  "Retriever + QA": "You are a debate analysis assistant. Use the retriever to find relevant passages from the debate transcript, then provide accurate, well-sourced answers based on the retrieved context.",
  "Fact Checker": "You are a meticulous fact checker. Verify claims using multiple sources including Wikipedia, news articles, and advanced semantic analysis. Provide evidence-based verdicts with confidence scores.",
};

function Analyzer({ onBackToHome }) {
  const [stars, setStars] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibleSections, setVisibleSections] = useState({})
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [aiMode, setAiMode] = useState("Retriever + QA");
  const [systemPrompt, setSystemPrompt] = useState(
    SYSTEM_PROMPTS["Retriever + QA"]
  );

  const [currentStep, setCurrentStep] = useState("");
  const [stepProgress, setStepProgress] = useState("");

  // Multi-stage state
  const [currentStage, setCurrentStage] = useState(() => {
    // Check sessionStorage
    const storedTranscript = sessionStorage.getItem('selectedTranscript');
    if (storedTranscript) {
      return "qa";
    }
    const transcript = window.history.state?.usr?.transcript;
    return transcript ? "qa" : "choice";
  });

  const [currentMode, setCurrentMode] = useState("qa");
  const [uploadedTranscript, setUploadedTranscript] = useState(null);
  const [debateName, setDebateName] = useState("");
  const [debateDate, setDebateDate] = useState("");
  const [hasUserSent, setHasUserSent] = useState(false);
  const [preSelectedTranscript, setPreSelectedTranscript] = useState(() => {
    // Check sessionStorage
    const storedTranscript = sessionStorage.getItem('selectedTranscript');
    if (storedTranscript) {
      return JSON.parse(storedTranscript);
    }
    return window.history.state?.usr?.transcript || null;
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const transcriptInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate()

  {/* ==================== Typing animation ==================== */}
  const typeText = async (text, onComplete) => {
    setIsTyping(true);
    setTypingMessage("");
    for (let i = 0; i < text.length; i++) {
      setTypingMessage((prev) => prev + text[i]);
      await new Promise((res) => setTimeout(res, 15));
    }
    setIsTyping(false);
    onComplete();
  };

  {/* ==================== Handle transcript upload ==================== */}
  const handleTranscriptUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (!f.name.endsWith(".txt")) {
      alert("Please upload only .txt files.");
      e.target.value = "";
      return;
    }

    setUploadedTranscript(f);
    // Move to metadata
    setCurrentStage("metadata");
  };

  // Drag and drop
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleTranscriptUpload({ target: { files } });
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  {/* ==================== Trigger file input click ==================== */}
  const handleUploadBoxClick = () => {
    transcriptInputRef.current?.click();
  };

  {/* ==================== Transcript was passed via location state ==================== */}
  useEffect(() => {
    if (preSelectedTranscript) {
      setDebateName(preSelectedTranscript.title);
      setDebateDate(preSelectedTranscript.date);
      setMessages([
        {
          role: "assistant",
          content: `Loaded "${preSelectedTranscript.title}"\n\nYou can now ask questions about this debate!`,
        },
      ]);
      // Clear sessionStorage after
      sessionStorage.removeItem('selectedTranscript');
    }
  }, [preSelectedTranscript]);

  {/* ==================== Handle metadata submission ==================== */}
  const handleMetadataSubmit = async () => {
    if (!debateName.trim() || !debateDate.trim()) {
      alert("Please provide both debate name and date.");
      return;
    }

    // YYYY-MM-DD format
    let formattedDate = debateDate;
    
    if (!debateDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        const dateObj = new Date(debateDate);
        formattedDate = dateObj.toISOString().split('T')[0];
      } catch (e) {
        alert("Invalid date format. Please use YYYY-MM-DD format.");
        return;
      }
    }

    setIsProcessingUpload(true);
    setCurrentStep("preprocessing");

    const makeApiCall = async () => {
      try {
        const formData = new FormData();
        formData.append("file", uploadedTranscript);
        formData.append("debate_name", debateName);
        formData.append("debate_date", formattedDate);

        console.log("Uploading debate to backend...");
        setTimeout(() => {
          setCurrentStep("database");
          setTimeout(() => {
            setCurrentStep("faiss");
          }, 25000);
        }, 10000);
        
        const response = await axios.post(
          "http://localhost:3000/api/upload-debate",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          }
        );

        console.log("Upload response:", response.data);

        setTimeout(() => {
          setCurrentStep("completed");
        }, 1000);
        
        setTimeout(() => {
          setCurrentStage("qa");
          setMessages([
            {
              role: "assistant",
              content: `${response.data.message}\n\nYou can now ask questions about this debate!`,
            },
          ]);
        }, 3000);

      } catch (err) {
        console.error("Upload error:", err);
        const errorMsg = err.response?.data?.error || "Error uploading debate. Please ensure backend is running.";
        alert(errorMsg);
      } finally {
        setTimeout(() => {
          setIsProcessingUpload(false);
          setCurrentStep("");
        }, 4000);
      }
    };
    
    makeApiCall();
  };

  {/* ==================== Send message ==================== */}
  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!hasUserSent) {
      setHasUserSent(true);
    }

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_query", input);

      // Choose endpoint based on current mode
      const endpoint = currentMode === "factcheck" 
        ? "http://localhost:3000/api/fact-check"
        : "http://localhost:3000/api/retrieve-response";

      console.log(`Sending to ${currentMode} endpoint:`, endpoint);

      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const aiResponse =
        response.data?.response || 
        response.data?.answer || 
        response.data?.message ||
        (typeof response.data === 'string' ? response.data : null) ||
        response.data?.error || 
        "Unexpected response.";

      console.log("Backend response:", response.data);
      console.log("Parsed AI response:", aiResponse);

      typeText(aiResponse, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      const errorMsg = "Error connecting to backend. Ensure it's running.";
      typeText(errorMsg, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        setLoading(false);
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  {/* ==================== Switch to Fact Checker mode ==================== */}
  const switchToFactChecker = () => {
    setCurrentMode("factcheck");
    setAiMode("Fact Checker");
    setSystemPrompt(SYSTEM_PROMPTS["Fact Checker"]);

    if (!hasUserSent) {
      setHasUserSent(true);
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Switched to Fact Checker mode. I'll now verify claims using Wikipedia, news sources, and advanced analysis. Enter a claim to fact-check.",
      },
    ]);
  };

  {/* ==================== Switch back to Q&A mode ==================== */}
  const switchToQA = () => {
    setCurrentMode("qa");
    setAiMode("Retriever + QA");
    setSystemPrompt(SYSTEM_PROMPTS["Retriever + QA"]);

    if (!hasUserSent) {
      setHasUserSent(true);
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Switched to Retriever + QA mode. Ask me questions about the debate!",
      },
    ]);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith(".txt")) setFile(f);
    else {
      alert("Please upload only .txt files.");
      e.target.value = "";
    }
  };

  {/* ==================== Scroll ==================== */}
  // Scroll to bottom when new messages appear
  useEffect(() => {
    if (hasUserSent && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, typingMessage, hasUserSent]);

  // Fade-in effect for "Upload Your Own" button
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('div[id]');
      
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionMiddle = sectionTop + section.offsetHeight / 3;
        
        // Check if section is in viewport for fade-in effect
        if (window.scrollY + window.innerHeight > sectionMiddle) {
          setVisibleSections(prev => ({ ...prev, [section.id]: true }));
        }
      });
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ==================== Shooting star animation ==================== */
  useEffect(() => {
    const createStar = () => {
      const newStar = {
        id: Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
        size: 1 + Math.random() * 2
      }
      setStars(prev => [...prev, newStar])

      // Animation completes
      setTimeout(() => {
        setStars(prev => prev.filter(star => star.id !== newStar.id))
      }, (newStar.duration + newStar.delay) * 1000)
    }

    // Create stars
    for (let i = 0; i < 8; i++) {
      setTimeout(createStar, i * 300)
    }

    // Continue creating stars
    const interval = setInterval(createStar, 50)

    return () => clearInterval(interval)
  }, [])

  /* ==================== Page transition variants ==================== */
  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
      filter: "blur(20px)"
    },
    in: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    out: {
      opacity: 0,
      scale: 1.02,
      filter: "blur(20px)",
      transition: {
        duration: 0.4,
        ease: [0.55, 0.085, 0.68, 0.53]
      }
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* ==================== Shooting stars animation ==================== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full shadow-lg animate-shooting-star"
            style={{
              left: `${star.left}%`,
              top: '-10px',
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              width: `${star.size}px`,
              height: `${star.size}px`
            }}
          ></div>
        ))}
      </div>

      {/* ==================== Choice ==================== */}
      {currentStage === "choice" && (
        <div
          id="choice-section"
          className={`min-h-screen w-full flex flex-col items-center justify-center relative z-10 transition-all duration-1000 ${
            visibleSections['choice-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center max-w-4xl w-full">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            >
              <h2 className="text-5xl font-bold text-white mb-4">
                Choose Your Path
              </h2>
              <p className="text-md md:text-md text-dark-silver mb-12">
                Upload your own transcript or explore our curated collection
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              {/* Upload Option */}
              <button
                onClick={() => setCurrentStage("upload")}
                className="group relative bg-[#2c2c30] backdrop-blur-lg rounded-2xl border-2 border-white/20 p-12 hover:border-electric-purple transition-all duration-300 hover:scale-105"
              >
                <Upload 
                  className="mx-auto mb-6 text-electric-purple group-hover:scale-110 transition-transform duration-300" 
                  size={64} 
                />
                <h3 className="text-2xl font-bold text-white mb-3">
                  Upload Your Own
                </h3>
                <p className="text-dark-silver">
                  Upload a custom debate transcript and analyze it with our AI tools
                </p>
              </button>

              {/* Browse Collection Option */}
              <button
                onClick={() => navigate('/transcripts')}
                className="group relative bg-[#2c2c30] backdrop-blur-lg rounded-2xl border-2 border-white/20 p-12 hover:border-electric-purple transition-all duration-300 hover:scale-105"
              >
                <svg 
                  className="mx-auto mb-6 text-electric-purple group-hover:scale-110 transition-transform duration-300" 
                  width="64" 
                  height="64" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Browse Collection
                </h3>
                <p className="text-dark-silver">
                  Explore our curated collection of debate transcripts
                </p>
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ==================== Upload Transcript ==================== */}
      {currentStage === "upload" && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="h-screen w-full flex flex-col items-center justify-center relative z-10"
        >
          <div className="text-center max-w-2xl w-full">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Upload Debate Transcript
              </h2>
              <p className="text-md md:text-md text-dark-silver mb-12">
                Start by uploading a debate transcript (.txt file)
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.6 }}
              className="w-full max-w-xl mx-auto"
            >
              <input
                ref={transcriptInputRef}
                type="file"
                accept=".txt"
                onChange={handleTranscriptUpload}
                style={{ 
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0,0,0,0)',
                  whiteSpace: 'nowrap',
                  border: 0
                }}
              />
              
              <button
                type="button"
                onClick={handleUploadBoxClick}
                style={{
                  all: 'unset',
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#2c2c30',
                    border: '2px dashed rgba(139, 92, 246, 0.5)',
                    borderRadius: '16px',
                    padding: '48px',
                    transition: 'border-color 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
                >
                  <Upload 
                    style={{ 
                      margin: '0 auto 16px',
                      color: '#8b5cf6',
                      display: 'block'
                    }} 
                    size={64} 
                  />
                  <p style={{ 
                    color: 'white',
                    fontSize: '18px',
                    marginBottom: '8px',
                    fontWeight: 500
                  }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ 
                    color: '#a0aec0',
                    fontSize: '14px'
                  }}>
                    Accepted format: .txt
                  </p>
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ==================== Enter Metadata ==================== */}
      {currentStage === "metadata" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="min-h-screen w-full flex flex-col items-center justify-center relative z-20"
        >
          {isProcessingUpload ? (
            /* ==================== Processing UI ==================== */
            <div className="text-center max-w-2xl w-full">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
              >
                <h2 className="text-4xl font-bold text-white mb-4 pt-20">
                  Processing Your Debate
                </h2>
                <p className="text-md md:text-md text-dark-silver mb-12">
                  We're analyzing your transcript and building the search index...
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="bg-[#1e1e23] rounded-2xl p-8 border border-[#47475b]">
                  <h3 className="text-lg font-semibold text-white mb-6 text-center">
                    Processing Pipeline
                  </h3>
                  
                  {/* Progress Steps */}
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                      currentStep === "preprocessing" ? "bg-electric-purple/20 border-2 border-electric-purple/50" : 
                      currentStep === "database" || currentStep === "faiss" || currentStep === "completed" ? "bg-green-500/10 border border-green-500/30" : 
                      "bg-[#2c2c30] border border-[#32324a]"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        currentStep === "preprocessing" ? "bg-electric-purple text-white scale-110" : 
                        currentStep === "database" || currentStep === "faiss" || currentStep === "completed" ? "bg-green-500 text-white" : 
                        "bg-gray-600 text-gray-300"
                      }`}>
                        {currentStep === "database" || currentStep === "faiss" || currentStep === "completed" ? "✓" : "1"}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">Processing Transcript</p>
                        <p className="text-light-silver text-sm">
                          Cleaning and analyzing transcript content...
                        </p>
                      </div>
                      {currentStep === "preprocessing" && (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      )}
                    </div>

                    {/* Step 2 */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                      currentStep === "database" ? "bg-electric-purple/20 border-2 border-electric-purple/50" : 
                      currentStep === "faiss" || currentStep === "completed" ? "bg-green-500/10 border border-green-500/30" : 
                      "bg-[#2c2c30] border border-[#32324a]"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        currentStep === "database" ? "bg-electric-purple text-white scale-110" : 
                        currentStep === "faiss" || currentStep === "completed" ? "bg-green-500 text-white" : 
                        "bg-gray-600 text-gray-300"
                      }`}>
                        {currentStep === "faiss" || currentStep === "completed" ? "✓" : "2"}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">Building Knowledge Base</p>
                        <p className="text-light-silver text-sm">
                          Storing transcript data in database...
                        </p>
                      </div>
                      {currentStep === "database" && (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      )}
                    </div>

                    {/* Step 3 */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                      currentStep === "faiss" ? "bg-electric-purple/20 border-2 border-electric-purple/50" : 
                      currentStep === "completed" ? "bg-green-500/20 border-2 border-green-500/50" : 
                      "bg-[#2c2c30] border border-[#32324a]"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        currentStep === "faiss" ? "bg-electric-purple text-white scale-110" : 
                        currentStep === "completed" ? "bg-green-500 text-white scale-110" : 
                        "bg-gray-600 text-gray-300"
                      }`}>
                        {currentStep === "completed" ? "✓" : "3"}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">Building Search Index</p>
                        <p className="text-light-silver text-sm">
                          {currentStep === "completed" ? "Search index completed!" : "Creating semantic search capabilities..."}
                        </p>
                      </div>
                      {currentStep === "faiss" && (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      )}
                      {currentStep === "completed" && (
                        <div className="text-green-500 font-medium">
                          Complete!
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#32324a] text-center">
                    <p className="text-sm text-light-silver">
                      {currentStep === "completed" ? 
                        "All steps completed! Moving to Q&A..." : 
                        currentStep === "faiss" ?
                        "Finalizing search index... Almost done!" :
                        "This may take a minute depending on the transcript size..."
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* ==================== Original Form UI ==================== */
            <div className="text-center max-w-2xl w-full">
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
              >
                <div className="mb-6 flex items-center justify-center gap-2">
                  <CheckCircle className="text-green-500" size={32} />
                  <h2 className="text-3xl font-bold text-white">
                    Transcript Uploaded!
                  </h2>
                </div>
                <p className="text-lg text-light-silver mb-2">
                  File: {uploadedTranscript?.name}
                </p>
                <p className="text-md text-light-silver mb-8">
                  Now, please provide the debate details
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.6 }}
              >
                <div className="bg-[#2c2c30] rounded-2xl p-8 border border-[#47475b] space-y-6">
                  <div className="text-left">
                    <label className="block text-sm text-light-silver mb-2">
                      Debate Name
                    </label>
                    <input
                      type="text"
                      value={debateName}
                      onChange={(e) => setDebateName(e.target.value)}
                      placeholder="e.g., 2024 Presidential Debate"
                      className="w-full bg-[#1e1e23] text-white px-4 py-3 rounded-lg border border-[#32324a] focus:outline-none focus:border-electric-purple"
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-sm text-light-silver mb-2">
                      Debate Date
                    </label>
                    <input
                      type="date"
                      value={debateDate}
                      onChange={(e) => setDebateDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full bg-[#1e1e23] text-white px-4 py-3 rounded-lg border border-[#32324a] focus:outline-none focus:border-electric-purple [color-scheme:dark]"
                    />
                  </div>

                  <button
                    onClick={handleMetadataSubmit}
                    disabled={isProcessingUpload || !debateName.trim() || !debateDate.trim()}
                    className={`w-full py-3 rounded-lg text-white font-medium transition ${
                      isProcessingUpload || !debateName.trim() || !debateDate.trim()
                        ? "bg-gray-600 cursor-not-allowed opacity-60"
                        : "bg-electric-purple hover:bg-purple-700 active:scale-95"
                    }`}
                  >
                    {isProcessingUpload ? "Processing..." : "Submit & Continue"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== Q&A Mode ==================== */}
      {currentStage === "qa" && (
        <div className="h-screen w-full flex flex-col relative">
          {/* Back button */}
          <div className="absolute top-4 left-4 z-30">
            <button
              onClick={onBackToHome}
              className="bg-[#2c2c30] hover:bg-[#3c3c40] text-white px-4 py-2 rounded-lg transition"
            >
              ← Back to Home
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-6 pt-6 space-y-6 relative z-20"
            style={{ 
              height: hasUserSent ? 'calc(100vh - 140px)' : 'calc(100vh - 200px)',
              maxHeight: hasUserSent ? 'calc(100vh - 140px)' : 'calc(100vh - 200px)'
            }}
          >
            {/* Messages */}
            <div className="flex flex-col space-y-6 mt-40">
              {messages.map((m, i) => (
                <div key={i} className="flex justify-center">
                  <div
                    className={`w-full max-w-5xl rounded-2xl p-6 text-base leading-relaxed border ${
                      m.role === "user"
                        ? "bg-electric-purple/10 border-electric-purple/30 text-white"
                        : "bg-white/10 border-white/20 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-center">{m.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-center">
                  <div className="w-full max-w-5xl rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md">
                    <p className="whitespace-pre-wrap text-center">
                      {typingMessage}
                      <span className="animate-pulse">▊</span>
                    </p>
                  </div>
                </div>
              )}
              {loading && !isTyping && (
                <div className="flex justify-center">
                  <div className="w-full max-w-5xl rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md flex items-center justify-center space-x-4">
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
                      {currentMode === "factcheck" ? "Fact-checking claim..." : "Analyzing arguments..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* ==================== Input Bar ==================== */}
          <motion.div
            initial={!hasUserSent ? { y: -300, opacity: 1 } : false}
            animate={hasUserSent ? { 
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              y: 0,
              opacity: 1 
            } : { y: -300, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", damping: 20 }}
            className="px-6 py-6 z-30"
            style={hasUserSent ? { 
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
            } : {}}
          >
            <div className="max-w-5xl mx-auto space-y-2">
              <div className="flex items-center bg-[#2c2c30] rounded-2xl px-2 py-1 shadow-xl border border-[#47475b]">
                <textarea
                  className="flex-1 resize-none bg-transparent text-white px-4 py-2 focus:outline-none"
                  placeholder={
                    currentMode === "factcheck"
                      ? "Enter a claim to fact-check..."
                      : "Ask a question about the debate..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />

                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className={`ml-2 px-4 py-2 rounded-2xl text-white font-medium transition ${
                    loading || !input.trim()
                      ? "bg-gray-600 cursor-not-allowed opacity-60"
                      : "bg-electric-purple hover:bg-purple-700 active:scale-95"
                  }`}
                >
                  Send
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-4 justify-center pt-1">
                {currentMode === "qa" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-light-silver">Mode:</span>
                      <span className="text-sm text-light-silver font-medium"> Retriever + QA</span>
                    </div>
                    <button
                      onClick={switchToFactChecker}
                      className="bg-[#1e1e23] hover:bg-[#2c2c30] text-white text-sm px-4 py-1 rounded-lg transition active:scale-95"
                    >
                      Switch to Fact Checker
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-light-silver">Mode:</span>
                      <span className="text-sm text-light-silver font-medium">
                        Fact Checker Mode
                      </span>
                    </div>
                    <button
                      onClick={switchToQA}
                      className="bg-[#1e1e23] hover:bg-[#2c2c30] text-white text-sm px-3 py-1 rounded-lg border border-[#32324a] transition"
                    >
                      Switch to Q&A
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==================== Shooting star animation ==================== */}
      <style> {`
        * {
          cursor: none !important;
        }

        body, html {
          cursor: none !important;
        }

        button, a, input, textarea, select {
          cursor: none !important;
        }
          
        @keyframes shooting-star {
          0% {
            transform: translateY(0) translateX(0) rotate(45deg);
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100px) rotate(45deg);
            opacity: 0;
          }
        }
        .animate-shooting-star {
          animation: shooting-star linear forwards;
        }
      `} </style>
    </div>
  );
}

export default Analyzer