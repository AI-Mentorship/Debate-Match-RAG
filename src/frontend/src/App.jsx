import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Home from './pages/Home'
import Mission from './pages/Mission'
import Team from './pages/Team'
import ChatInterface from './pages/ChatInterface'

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [trailingPosition, setTrailingPosition] = useState({ x: 0, y: 0 })
  const [currentPage, setCurrentPage] = useState('home')
  const trailingRef = useRef({ x: 0, y: 0 })

  // Mouse follower effect
  useEffect(() => {
    let animationFrameId
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // Smooth follow effect
    const updateTrailingPosition = () => {
      setTrailingPosition(prev => {
        // New position
        const newX = prev.x + (mousePosition.x - prev.x) * 0.1 // Slow follow-through
        const newY = prev.y + (mousePosition.y - prev.y) * 0.1
        trailingRef.current = { x: newX, y: newY }
        
        return { x: newX, y: newY }
      })
      animationFrameId = requestAnimationFrame(updateTrailingPosition)
    }

    // Start animation immediately
    animationFrameId = requestAnimationFrame(updateTrailingPosition)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [mousePosition])

  const handleGetStarted = () => {
    console.log('Navigating to chat interface')
    setCurrentPage('chat')
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <Home onGetStarted={handleGetStarted} />
      case 'mission':
        return <Mission />
      case 'team':
        return <Team />
      case 'chat':
        return <ChatInterface onBackToHome={() => setCurrentPage('home')} />
      default:
        return <Home onGetStarted={handleGetStarted} />
    }
  }

  // Page transition variants
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
  }

  return (
    <div className="min-h-screen font-noto-sans">
      {/* Mouse Follower */}
      <div 
        className="fixed pointer-events-none z-50"
        style={{
          left: `${trailingPosition.x}px`,
          top: `${trailingPosition.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'none'
        }}
      >
        {/* Outer Circle and Dot */}
        <div className="w-14 h-14 border-1 border-white/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("/src/assets/img/background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
          onGetStarted={handleGetStarted}
        />

        {/* Animated Page Content */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                className="absolute inset-0"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
      </div>

      {/* Custom glow and neon effects */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
        
        .shadow-glow {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3);
        }
        
        .hover\\:shadow-glow:hover {
          box-shadow: 
            0 0 30px rgba(124, 58, 237, 0.7),
            0 0 60px rgba(124, 58, 237, 0.4),
            0 0 90px rgba(124, 58, 237, 0.2),
            inset 0 0 20px rgba(124, 58, 237, 0.1);
        }
        
        .hover\\:shadow-silver-glow {
          transition: box-shadow 2s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default App