import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function Home({ onGetStarted }) {
  const [stars, setStars] = useState([])
  const navigate = useNavigate()
  const handleGetStarted = () => {
    navigate('/analyzer')
  }

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

  return (
    <div className="h-screen flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* ==================== Shooting star animation ==================== */}
      <div className="absolute inset-0 pointer-events-none">
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

      {/* ==================== Main Content ==================== */}
      <motion.div 
        className="mt-30 relative z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
      >
        {/* Name */}
        <h1 className="text-7xl md:text-7xl font-bold text-white mb-10 leading-tight">
          D&nbsp;&nbsp;E&nbsp;&nbsp;B&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;E&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;C&nbsp;&nbsp;H
        </h1>
        <h2 className="text-4xl md:text-4xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
          Retrieval-Augmented Generation
        </h2>

        {/* Description */}
        <div className="mb-10 text-md md:text-md text-dark-silver max-w-4xl leading-relaxed">
          An AI-powered debate matcher that allows users to ask political questions and receive factually grounded answers based on political debate transcripts
        </div>
      </motion.div>
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
      >
        {/* Button */}
        <button
          onClick={handleGetStarted}
          className="mb-40 bg-transparent text-gray-200 px-20 py-3 rounded-full font-bold transition-all duration-700 shadow-2xl hover:shadow-silver-glow relative overflow-hidden group border-2 border-gray-300 hover:border-white"
        >
          {/* Silver neon glow effect */}
          <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/30 blur-xl transition-all duration-1000"></div>

          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

          {/* Pulse ring effect */}
          <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/70 transition-all duration-1000"></div>

          {/* Text */}
          <span className="relative z-10 text-gray-200 group-hover:text-white transition-colors duration-300 font-bold">
            Start Analyzing
          </span>
        </button>
      </motion.div>

      {/* ==================== Shooting star animation ==================== */}
      <style> {`
        * {
          cursor: none !important;
        }

        button, a {
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
  )
}

export default Home