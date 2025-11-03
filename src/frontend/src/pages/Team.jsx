import { useState, useEffect } from 'react'

function Team() {
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

  const members = [
    {
      id: 1,
      name: "Adya Dhanasekar",
      role: "Project Lead",
      description: "",
      linkedin: "https://www.linkedin.com/in/adyadhanasekar/",
    },
    {
      id: 2,
      name: "Shivam Singh",
      role: "Project Lead",
      description: "",
      linkedin: "https://www.linkedin.com/in/shivam-singh-9935ab305/",
    },
    {
      id: 3,
      name: "Satyank Nadimpalli",
      role: "Full Stack Developer",
      description: "",
      linkedin: "https://www.linkedin.com/in/satyank-nadimpalli/",
    },
    {
      id: 4,
      name: "Khang Doan",
      role: "Full Stack Developer",
      description: "B.S. in Computer Science with focus on AI/ML",
      linkedin: "https://www.linkedin.com/in/khangdoan514/",
    },
    {
      id: 5,
      name: "Pavan Arani",
      role: "Full Stack Developer",
      description: "",
      linkedin: "https://www.linkedin.com/in/pavan-arani-15954426a/",
    },
    {
      id: 6,
      name: "Raisa Reza",
      role: "UX/UI Designer",
      description: "",
      linkedin: "https://www.linkedin.com/in/raisa-reza/",
    },
    {
      id: 7,
      name: "Yakina Azza",
      role: "Back-End Developer",
      description: "",
      linkedin: "https://www.linkedin.com/in/yakina-azza/",
    },
    {
      id: 8,
      name: "Sadwitha Thopucharla",
      role: "QA Pipeline Lead",
      description: "",
      linkedin: "https://www.linkedin.com/in/sadwitha1161/",
    }
  ]

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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Description */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Our Contributors</h1>
          <p className="text-light-silver max-w-2xl mx-auto text-sm leading-relaxed">
            Meet the passionate team behind DebateMatch RAG. We combine expertise in AI research, 
            engineering, and design to create the future of debate analysis.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adya Dhanasekar */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Adya Dhanasekar</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Project Mentor
            </p>
          </div>
        </div>

        {/* Shivam Singh */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Shivam Singh</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Project Mentor
            </p>
          </div>
        </div>

        {/* Satyank Nadimpalli */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Satyank Nadimpalli</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Full Stack Developer
            </p>
          </div>
        </div>

        {/* Khang Doan */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Khang Doan</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Full Stack Developer
            </p>
          </div>
        </div>

        {/* Pavan Arani */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Pavan Arani</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Full Stack Developer
            </p>
          </div>
        </div>

        {/* Raisa Reza */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Raisa Reza</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Back End Developer
            </p>
          </div>
        </div>

        {/* Yakina Azza */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Yakina Azza</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Back End Developer
            </p>
          </div>
        </div>

        {/* Sadwitha Thopucharla */}
        <div className="relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group">
          <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
            <h3 className="text-base font-bold text-white mb-1">Sadwitha Thopucharla</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r text-white font-semibold text-xs`}>
              Back End Developer
            </p>
          </div>
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

export default Team