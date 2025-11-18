import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Analyzer from './pages/Analyzer'
import Transcripts from './pages/Transcripts'
import Missions from './pages/Missions'
import Team from './pages/Team'

function AppContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [trailingPosition, setTrailingPosition] = useState({ x: 0, y: 0 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState(null)
  const trailingRef = useRef({ x: 0, y: 0 })
  const location = useLocation()
  const animationControlsRef = useRef()

  /* ==================== Mouse follower effect ==================== */
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

  /* ==================== Scroll ==================== */
  useEffect(() => {
    const scrollPositionRef = { current: window.scrollY };
    
    if (isModalOpen || selectedTranscript) {
      // Store scroll position and prevent scrolling
      scrollPositionRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      document.body.style.overflow = 'unset';
      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, selectedTranscript]);

  const handleGetStarted = () => {
    window.location.href = '/analyzer'
  }

  const handlePageChange = (page) => {
    window.location.href = `/${page}`
  }

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
  }

  /* ==================== Get current page ==================== */
  const currentPage = location.pathname.substring(1) || 'home'

  return (
    <div className="min-h-screen font-noto-sans">
      {/* ==================== Mouse Follower ==================== */}
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
      
      {/* ==================== Content ==================== */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {!(isModalOpen || selectedTranscript) && (
          <div className="fixed top-0 left-0 right-0 z-20">
            <Header 
              currentPage={currentPage} 
              onPageChange={handlePageChange}
              onGetStarted={handleGetStarted}
              isModalOpen={isModalOpen || selectedTranscript}
            />
          </div>
        )}

        {/* Animated Page Content */}
        <div className={`flex-1 relative ${!(isModalOpen || selectedTranscript) ? 'pt-20' : 'pt-0'}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              className="absolute inset-0 w-full h-full"
              transition={{
                type: "tween",
                ease: "easeInOut"
              }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home onGetStarted={handleGetStarted} />} />
                <Route path="/home" element={<Home onGetStarted={handleGetStarted} />} />
                <Route path="/analyzer" element={<Analyzer />} />
                <Route path="/transcripts" element={<Transcripts onGetStarted={handleGetStarted} selectedTranscript={selectedTranscript} setSelectedTranscript={setSelectedTranscript} />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/team" element={<Team onModalStateChange={setIsModalOpen} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ==================== Styles ==================== */}
      <style> {`
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
      `} </style>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App