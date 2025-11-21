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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState(null)
  const [isHitting, setIsHitting] = useState(false)
  const location = useLocation()

  /* ==================== Mouse tracking ==================== */
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  /* ==================== Click handler for gavel animation ==================== */
  useEffect(() => {
    const handleClick = (e) => {
      setIsHitting(true)
      setTimeout(() => setIsHitting(false), 200)
    }

    window.addEventListener('click', handleClick, true)
    return () => window.removeEventListener('click', handleClick, true)
  }, [])

  /* ==================== Hide default cursor ==================== */
  useEffect(() => {
    document.body.style.cursor = 'none'
    
    // Also hide cursor on mousedown (click start)
    const handleMouseDown = () => {
      document.body.style.cursor = 'none'
    }
    
    window.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      document.body.style.cursor = 'default'
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  /* ==================== Scroll ==================== */
  useEffect(() => {
    const scrollPositionRef = { current: window.scrollY };
    
    if (isModalOpen || selectedTranscript) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
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

  /* ==================== Gavel animation variants ==================== */
  const gavelVariants = {
    normal: {
      rotate: -45,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    hitting: {
      rotate: -90,
      scale: 1.1,
      y: 10,
      transition: { 
        type: "spring", 
        stiffness: 600, 
        damping: 15,
        duration: 0.1
      }
    }
  }

  /* ==================== Get current page ==================== */
  const currentPage = location.pathname.substring(1) || 'home'

  return (
    <div className="min-h-screen font-noto-sans">
      {/* ==================== Gavel Cursor ==================== */}
      <motion.div 
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -25%)',
        }}
      >
        <motion.div
          variants={gavelVariants}
          animate={isHitting ? "hitting" : "normal"}
        >
          <div className="relative">
            {/* Gavel head */}
            <div className="w-6 h-4 bg-white rounded-sm shadow-lg mb-1"></div>
            {/* Gavel handle */}
            <div className="w-2 h-8 bg-white rounded-full mx-auto shadow-lg"></div>            
          </div>
        </motion.div>
      </motion.div>

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
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              className="absolute inset-0 w-full h-full"
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
        html, body, * {
          cursor: none !important;
        }
        
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