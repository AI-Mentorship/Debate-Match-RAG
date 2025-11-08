import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function Team() {
  const [hoveredCard, setHoveredCard] = useState(null)
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

  const members = [
    {
      id: 1,
      name: "Adya Dhanasekar",
      role: "Project Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/adyadhanasekar/",
      instagram: "",
      image: "src/assets/img/Adya_Dhanasekar.png"
    },
    {
      id: 2,
      name: "Raisa Reza",
      role: "UX/UI Designer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/raisa-reza/",
      instagram: "",
      image: ""
    },
    {
      id: 3,
      name: "Yakina Azza",
      role: "Back-End Developer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/yakina-azza/",
      instagram: "",
      image: ""
    },
    {
      id: 4,
      name: "Sadwitha Thopucharla",
      role: "QA Pipeline Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/sadwitha1161/",
      instagram: "",
      image: ""
    },
    {
      id: 5,
      name: "Shivam Singh",
      role: "Project Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/shivam-singh-9935ab305/",
      instagram: "",
      image: ""
    },
    {
      id: 6,
      name: "Khang Doan",
      role: "Full Stack Developer",
      description: "B.S. in Computer Science with focus on AI/ML",
      linkedin: "https://www.linkedin.com/in/khangdoan514/",
      instagram: "https://www.instagram.com/itsmekhangdoan/",
      image: "src/assets/img/Khang_Doan.png"
    },
    {
      id: 7,
      name: "Pavan Arani",
      role: "Full Stack Developer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/pavan-arani-15954426a/",
      instagram: "",
      image: "src/assets/img/Pavan_Arani.png"
    },
    {
      id: 8,
      name: "Satyank Nadimpalli",
      role: "Full Stack Developer",
      description: "M.S. in Computer Science studying AI & Intelligent Systems",
      linkedin: "https://www.linkedin.com/in/satyank-nadimpalli/",
      instagram: "",
      image: "src/assets/img/Satyank_Nadimpalli.jpg"
    }
  ]

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

      {/* Title */}
      <motion.div 
        className="pt-8 pb-8 px-8 text-center relative z-10"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h1 
            className="text-4xl font-bold text-white mb-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            Our Contributors
          </motion.h1>
          <motion.p 
            className="text-dark-silver max-w-2xl mx-auto text-sm leading-relaxed"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
          >
            Meet the passionate team behind DebateMatch RAG. We combine expertise in AI research, 
            engineering, and design to create the future of debate analysis.
          </motion.p>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div 
        className="flex-1 flex items-start justify-center px-8 pb-8 relative z-10"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, type: 'spring', delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0, delay: 0.4 + (member.id * 0.1) }}
                className={`relative rounded-xl p-4 border border-white/20 transition-all transform group ${
                  hoveredCard === member.id 
                    ? 'scale-105 rotate-1 shadow-xl' 
                    : 'scale-100 rotate-0 hover:scale-102'
                } bg-gradient-to-br from-[#2B2139]/20 to-[#0B0219]/20`}
                onMouseEnter={() => setHoveredCard(member.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Profile Image */}
                <div className="relative z-10 w-16 h-16 mx-auto mb-4 transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-1">
                  {/* Gradient Border */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#F786C7] to-[#FFCAE4] animate-gradient-rotate opacity-0 group-hover:opacity-65 transition-opacity duration-500"></div>
                  
                  {/* Inner Container with Clip Path */}
                  <div className="relative w-full h-full rounded-full bg-transparent">
                    <div className="w-full h-full rounded-full">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover relative z-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                  <h3 className="text-base font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#F786C7] to-[#FFCAE4] font-semibold text-xs">
                    {member.role}
                  </p>
                </div>

                {/* Description */}
                <p className="text-light-silver text-xs leading-relaxed mb-3 text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                  {member.description}
                </p>

                {/* Social Media */}
                <div className="text-center relative z-10 flex justify-center space-x-2">
                  {/* LinkedIn */}
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 bg-gradient-to-r ${member.color} border border-white/20 hover:border-white/40`}
                  >
                    <svg 
                      className="w-4 h-4 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  
                  {/* Instagram */}
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-12 bg-gradient-to-r ${member.color} border border-white/20 hover:border-white/40`}
                  >
                    <svg 
                      className="w-4 h-4 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-xl from-[#FFCAE4] to-[#FFCAE4] opacity-0 group-hover:opacity-5 blur-md transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
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

export default Team