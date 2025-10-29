import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function ChatInterface({ onBackToHome }) {
  const [stars, setStars] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // 🌌 Star background animation (unchanged)
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

  // ⌨️ Typing animation handler
  const typeText = (text, onComplete) => {
    setIsTyping(true)
    setTypingMessage('')
    let index = 0
    const typingInterval = setInterval(() => {
      if (index < text.length) {
        setTypingMessage(prev => prev + text.charAt(index))
        index++
      } else {
        clearInterval(typingInterval)
        setIsTyping(false)
        onComplete()
      }
    }, 30)
  }

  // 🚀 Send message — now appends properly instead of resetting
  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage]) // ✅ append instead of reset
    setInput('')
    setLoading(true)

    try {
      const response = await axios.get('http://localhost:3000/api/message')
      const aiResponse = `Analysis for "${input}": ${response.data.message.join(', ')}`

      typeText(aiResponse, () => {
        const aiMessage = { role: 'assistant', content: aiResponse }
        setMessages(prev => [...prev, aiMessage]) // ✅ append AI message
        setLoading(false)
      })
    } catch (error) {
      const errorResponse = 'Error connecting to debate analysis service. Please try again.'
      typeText(errorResponse, () => {
        const errorMessage = { role: 'assistant', content: errorResponse }
        setMessages(prev => [...prev, errorMessage])
        setLoading(false)
      })
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingMessage])

  // 🧠 Render
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
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your debate topic, argument, or analysis request..."
                className="w-full bg-white/10 backdrop-blur-md text-white rounded-2xl px-6 py-4 border border-white/20 resize-none focus:outline-none focus:border-white placeholder-light-silver transition-all duration-200"
                rows="2"
                disabled={loading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-transparent border-2 border-electric-purple text-white px-8 py-4 rounded-2xl hover:bg-electric-purple/20 hover:border-lavender transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
