import { useState, useEffect } from 'react'

function Team() {
  const [hoveredCard, setHoveredCard] = useState(null)
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
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/adyadhanasekar/",
      color: "from-red-400 to-pink-500",
      background: "bg-gradient-to-br from-red-400/20 to-pink-500/20"
    },
    {
      id: 2,
      name: "Shivam Singh",
      role: "Project Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/shivam-singh-9935ab305/",
      color: "from-yellow-400 to-orange-500",
      background: "bg-gradient-to-br from-yellow-400/20 to-orange-500/20"
    },
    {
      id: 3,
      name: "Satyank Nadimpalli",
      role: "Full Stack Developer",
      description: "M.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/satyank-nadimpalli/",
      color: "from-green-400 to-emerald-500",
      background: "bg-gradient-to-br from-green-400/20 to-emerald-500/20"
    },
    {
      id: 4,
      name: "Khang Doan",
      role: "Full Stack Developer",
      description: "B.S. in Computer Science with focus on AI/ML",
      linkedin: "https://www.linkedin.com/in/khangdoan514/",
      color: "from-pink-400 to-purple-500",
      background: "bg-gradient-to-br from-pink-400/20 to-purple-500/20",
      image: "src/assets/img/Sample_PFP.jpeg"
    },
    {
      id: 5,
      name: "Pavan Arani",
      role: "Full Stack Developer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/pavan-arani-15954426a/",
      color: "from-cyan-400 to-blue-500",
      background: "bg-gradient-to-br from-cyan-400/20 to-blue-500/20"
    },
    {
      id: 6,
      name: "Raisa Reza",
      role: "UX/UI Designer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/raisa-reza/",
      color: "from-indigo-400 to-purple-500",
      background: "bg-gradient-to-br from-indigo-400/20 to-purple-500/20"
    },
    {
      id: 7,
      name: "Yakina Azza",
      role: "Back-End Developer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/yakina-azza/",
      color: "from-teal-400 to-cyan-500",
      background: "bg-gradient-to-br from-teal-400/20 to-cyan-500/20"
    },
    {
      id: 8,
      name: "Sadwitha Thopucharla",
      role: "QA Pipeline Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/sadwitha1161/",
      color: "from-amber-400 to-yellow-500",
      background: "bg-gradient-to-br from-amber-400/20 to-yellow-500/20"
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className={`relative rounded-xl p-4 border border-white/20 transition-all duration-500 transform group ${
                hoveredCard === member.id 
                  ? 'scale-105 rotate-1 shadow-2xl' 
                  : 'scale-100 rotate-0 hover:scale-102'
              } ${member.background}`}
              onMouseEnter={() => setHoveredCard(member.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Profile Image */}
              <div className={`relative z-10 w-16 h-16 ${member.color} rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-lg`}>
                {member.image ? (
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
                
                {/* Pulsing Ring */}
                <div className={`absolute inset-0 ${member.color} rounded-full animate-ping opacity-20 group-hover:animate-none`}></div>
              </div>

              {/* Name and Role */}
              <div className="text-center mb-3 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                <h3 className="text-base font-bold text-white mb-1">{member.name}</h3>
                <p className={`text-transparent bg-clip-text bg-gradient-to-r ${member.color} font-semibold text-xs`}>
                  {member.role}
                </p>
              </div>

              {/* Description */}
              <p className="text-light-silver text-xs leading-relaxed mb-3 text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                {member.description}
              </p>

              {/* LinkedIn Button */}
              <div className="text-center relative z-10">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 ${member.bgColor} border border-white/20 hover:border-white/40`}
                >
                  <svg 
                    className="w-4 h-4 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
              
              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-xl ${member.color} opacity-0 group-hover:opacity-5 blur-md transition-opacity duration-500`}></div>
            </div>
          ))}
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