import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function Home({ onGetStarted }) {
  const [stars, setStars] = useState([])

  // Shooting star animation
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
    const interval = setInterval(createStar, 100)

    return () => clearInterval(interval)
  }, [])

  // Animation variants
  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* Shooting stars effect */}
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

      <motion.div 
        className="mt-30 relative z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
      >
        {/* Name */}
        <h1 className="text-5xl md:text-5xl text-white mb-5 leading-tight">
          From complexity to clarity.
        </h1>
        <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
          From question to insight.
        </h2>

        {/* Description */}
        <p className="mb-10 text-md md:text-md text-dark-silver max-w-2xl mx-auto leading-relaxed">
          To assist voters, we offer thoughtful, AI-powered analysis of debate transcripts,
          helping the public discern factual statements from political rhetoric.
        </p>
      </motion.div>
        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        >
          {/* Button */}
          <button
            onClick={onGetStarted}
            className="mb-10 bg-transparent text-gray-200 px-20 py-3 rounded-full font-bold transition-all duration-700 shadow-2xl hover:shadow-silver-glow relative overflow-hidden group border-2 border-gray-300 hover:border-white"
          >
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/30 blur-xl transition-all duration-1000"></div>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/70 transition-all duration-1000"></div>
            <span className="relative z-10 text-gray-200 group-hover:text-white transition-colors duration-300 font-bold">
              Explore
            </span>
          </button>
        </motion.p>

      {/* Scroll down indicator */}
      <motion.div
        className="flex flex-col items-center justify-center mt-25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className="text-dark-silver text-sm mb-2">Scroll down</span>
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-gray-400 rounded-full mt-2"
            animate={{
              y: [0, 12, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        </div>
      </motion.div>

      {/* Shooting star animation */}
      <style jsx global>{`
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
      `}</style>
    </div>
  )
}

export default Home