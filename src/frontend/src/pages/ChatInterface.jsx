import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from "framer-motion";

function ChatInterface({ onBackToHome }) {
  const [stars, setStars] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Star background animation (unchanged)
  useEffect(() => {
    const createStar = () => {
      const newStar = {
        id: Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
        size: 1 + Math.random() * 2,
      }
      setStars(prev => [...prev, newStar])
      setTimeout(() => {
        setStars(prev => prev.filter(star => star.id !== newStar.id))
      }, (newStar.duration + newStar.delay) * 1000)
    }

    for (let i = 0; i < 20; i++) setTimeout(createStar, i * 300)
    const interval = setInterval(createStar, 800)
    return () => clearInterval(interval)
  }, [messages, typingMessage])

  // Typing animation handler
  const typeText = async (text, onComplete) => {
  setIsTyping(true);
  setTypingMessage('');

  // Adjust typing speed dynamically
  // Short messages = slower typing; long = faster
  const baseDelay = 40; // average human typing speed
  const minDelay = 15;  // cap for long responses
  const maxDelay = 50;  // cap for very short responses

  // Calculate adaptive delay based on length
  const adaptiveDelay = Math.max(
    minDelay,
    maxDelay - Math.min(text.length / 5, maxDelay - minDelay)
  );

  for (let i = 0; i < text.length; i++) {
    setTypingMessage(prev => prev + text[i]);
    await new Promise(res => setTimeout(res, adaptiveDelay));
  }

  setIsTyping(false);
  onComplete();
  };



  // Send message — now appends properly instead of resetting
const sendMessage = async () => {
  if (!input.trim()) return;

  const userMessage = { role: 'user', content: input };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setLoading(true);

  try {
    const response = await axios.post('http://localhost:3000/api/retrieve-response', {
      user_query: input
    });

    const aiResponse = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    typeText(aiResponse, () => {
      const aiMessage = { role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    });
  } catch (error) {
    const errorResponse = 'Error connecting to debate analysis service. Please try again.';
    typeText(errorResponse, () => {
      const errorMessage = { role: 'assistant', content: errorResponse };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    });
  }
};

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingMessage])

  // Render
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <h2 className="text-4xl font-bold text-white mb-4">Start a Debate Analysis</h2>
              <p className="text-lg text-light-silver mb-8">
                Ask me anything about political debates, argument analysis, or find matching debate topics.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            {messages.map((message, index) => (
              <div key={index} className="flex justify-center">
                <div
                  className={`max-w-2xl w-full rounded-2xl p-6 text-base leading-relaxed border backdrop-blur-md ${
                    message.role === 'user'
                      ? 'bg-electric-purple/10 border-electric-purple/30 text-white'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Typing animation */}
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

            {/* Loading indicator */}
            {loading && !isTyping && (
              <div className="flex justify-center">
                <div className="max-w-2xl w-full rounded-2xl p-6 bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-light-silver text-sm">Analyzing arguments...</span>
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
        {messages.length === 0 ? (
          <motion.div
            key="centerInput"
            initial={{opacity: 0 }}
            animate={{ y: -275, opacity: 1 }}
            // exit={{opacity: 0 }}
            transition={{ duration: 1.2, type: 'spring' }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="w-full max-w-2xl">
              {/* Your merged input+send code here */}
              <div className="flex items-center bg-[#2c2c30] rounded-2xl px-2 py-1 shadow-xl border border-[#47475b]">
                <textarea
                  className="flex-1 resize-none bg-transparent text-white px-4 py-2 focus:outline-none"
                  placeholder="Ask something..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className={`ml-2 px-4 py-2 rounded-2xl text-white font-medium transition 
                            ${loading || !input.trim()
                              ? 'bg-gray-600 cursor-not-allowed opacity-60'
                              : 'bg-electric-purple hover:bg-purple-700 active:scale-95'
                            }`}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="bottomInput"
            initial={{ y: -325, opacity: 1 }}
            animate={{ y: -70, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 1.0, type: "spring" }}
            className="px-6 py-6"
          >
            <div className="max-w-2xl mx-auto">
              {/* Your merged input+send code here */}
              <div className="flex items-center bg-[#2c2c30] rounded-2xl px-2 py-1 shadow-xl border border-[#47475b]">
                <textarea
                  className="flex-1 resize-none bg-transparent text-white px-4 py-2 focus:outline-none"
                  placeholder="Ask something..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className={`ml-2 px-4 py-2 rounded-2xl text-white font-medium transition 
                            ${loading || !input.trim()
                              ? 'bg-gray-600 cursor-not-allowed opacity-60'
                              : 'bg-electric-purple hover:bg-purple-700 active:scale-95'
                            }`}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default ChatInterface