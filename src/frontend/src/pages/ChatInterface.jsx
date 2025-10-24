import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function ChatInterface({ onBackToHome }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingMessage])

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
    }, 30) // Adjust typing speed here (lower = faster)
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    // Reset conversation and start fresh with user message
    const userMessage = { role: 'user', content: input }
    setMessages([userMessage]) // Reset to only this message
    setInput('')
    setLoading(true)

    try {
      const response = await axios.get('http://localhost:3000/api/message')
      
      // Start typing animation for AI response
      const aiResponse = `Analysis for "${input}": ${response.data.message.join(', ')}`
      typeText(aiResponse, () => {
        // When typing is complete, add the final message
        const aiMessage = { 
          role: 'assistant', 
          content: aiResponse
        }
        setMessages(prev => [...prev, aiMessage])
        setLoading(false)
      })
      
    } catch (error) {
      const errorResponse = 'Error connecting to debate analysis service. Please try again.'
      typeText(errorResponse, () => {
        const errorMessage = { 
          role: 'assistant', 
          content: errorResponse
        }
        setMessages(prev => [...prev, errorMessage])
        setLoading(false)
      })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex-1 flex flex-col">
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
            {/* Display existing messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-6 ${
                    message.role === 'user'
                      ? 'bg-white/10 backdrop-blur-md text-white border border-white/20'
                      : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Display typing animation */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-2xl rounded-2xl p-6 bg-white/10 backdrop-blur-md text-white border border-white/20">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {typingMessage}
                    <span className="animate-pulse">▊</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Display loading indicator when not typing */}
            {loading && !isTyping && (
              <div className="flex justify-start">
                <div className="max-w-2xl rounded-2xl p-6 bg-white/10 backdrop-blur-md text-white border border-white/20">
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
                onChange={(e) => setInput(e.target.value)}
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