import { useState, useEffect } from 'react'

function Mission() {
  const [stars, setStars] = useState([])

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

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* Shooting stars effect */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full shadow-lg"
            style={{
              left: `${star.left}%`,
              top: '-10px',
              animation: `shooting-star ${star.duration}s linear ${star.delay}s forwards`,
              width: `${star.size}px`,
              height: `${star.size}px`
            }}
          ></div>
        ))}
      </div>

      <div className="pt-8 pb-16 px-8 text-center relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Our Mission</h1>
          <p className="text-light-silver max-w-2xl mx-auto text-sm leading-relaxed">
            To democratize political information by providing AI-powered, fact-checked analysis 
            of debate transcripts, empowering citizens to make informed voting decisions based 
            on actual statements rather than political spin.
          </p>
        </div>
      </div>

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

export default Mission