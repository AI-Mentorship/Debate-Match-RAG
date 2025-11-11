import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Team({ onGetStarted }) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const isScrolling = useRef(false)
  
  // Scroll
  const smoothScrollTo = (element, duration = 1000) => {
    isScrolling.current = true
    const start = window.pageYOffset;
    const to = element.offsetTop;
    const change = to - start;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeInOut = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, start + change * easeInOut);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
      
      else {
        isScrolling.current = false
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const smoothScrollToTop = (duration = 1000) => {
    isScrolling.current = true
    const start = window.pageYOffset;
    const change = -start;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeInOut = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, start + change * easeInOut);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
      
      else {
        isScrolling.current = false
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const scrollToNextSection = () => {
    const sections = document.querySelectorAll('section[id]');
    const nextSection = currentSection + 1;
    
    if (nextSection < sections.length) {
      setCurrentSection(nextSection);
      const section = sections[nextSection];
      if (section) {
        smoothScrollTo(section, 1200);
      }
    }
    
    else {
      // If at last section, scroll back to top smoothly
      setCurrentSection(0);
      smoothScrollToTop(1200);
    }
  }

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

  // Update current section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling.current) return;
      
      const scrollPosition = window.scrollY + 100;
      const sections = document.querySelectorAll('section[id]');
      
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          setCurrentSection(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const members = [
    {
      id: 1,
      name: "Adya Dhanasekar",
      role: "Project Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/adyadhanasekar/",
      instagram: "#",
      image: "src/assets/img/Adya_Dhanasekar.png"
    },
    {
      id: 2,
      name: "Raisa Reza",
      role: "UX/UI Designer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/raisa-reza/",
      instagram: "#",
      image: ""
    },
    {
      id: 3,
      name: "Yakina Azza",
      role: "Back-End Developer",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/yakina-azza/",
      instagram: "#",
      image: ""
    },
    {
      id: 4,
      name: "Sadwitha Thopucharla",
      role: "QA Pipeline Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/sadwitha1161/",
      instagram: "#",
      image: ""
    },
    {
      id: 5,
      name: "Shivam Singh",
      role: "Project Lead",
      description: "B.S. in Computer Science",
      linkedin: "https://www.linkedin.com/in/shivam-singh-9935ab305/",
      instagram: "#",
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
      instagram: "#",
      image: "src/assets/img/Pavan_Arani.png"
    },
    {
      id: 8,
      name: "Satyank Nadimpalli",
      role: "Full Stack Developer",
      description: "M.S. in Computer Science studying AI & Intelligent Systems",
      linkedin: "https://www.linkedin.com/in/satyank-nadimpalli/",
      instagram: "#",
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
      <div className="fixed inset-0 pointer-events-none z-0">
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

      {/* Scroll Indicator */}
      <motion.div
        className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={scrollToNextSection}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-dark-silver text-sm mb-2 font-medium">
            {currentSection < 3 ? 'Scroll down ↓' : 'Scroll up ↑'}
          </span>
          <div className="w-6 h-10 border-2 border-dark-silver rounded-full flex justify-center relative">
            <motion.div
              className="w-1.5 h-3 bg-dark-silver rounded-full mt-2"
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
        </div>
      </motion.div>

      {/* Hero Section */}
      <section 
        id="hero"
        className="min-h-screen w-full flex flex-col items-center justify-center px-8 text-center relative z-10"
      >
        <motion.div 
          className="relative z-10"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
        >
          {/* Title */}
          <h1 className="text-5xl md:text-5xl text-white mb-5 leading-tight">
            From concept to creation.
          </h1>
          <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
            From idea to implementation.
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        >
          <p className="mb-10 text-md md:text-md text-dark-silver max-w-2xl mx-auto leading-relaxed">
            Meet the passionate team behind DebateMatch.RAG project. We combine expertise in AI research, 
            engineering, and design to create the future of debate analysis.
          </p>
        </motion.p>
      </section>

      {/* Leadership Section */}
      <section
        id="leadership"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Project&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Leadership</span>
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-16">
            Guiding our vision with strategic direction and technical expertise, our project leads 
            ensure we deliver innovative solutions that transform political discourse through AI-powered analysis.
          </p>
        </div>
        
        <div className="flex-1 flex items-start justify-center px-8 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-10"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, type: 'spring', delay: 0.2 }}
            >
              {members.filter(member => member.role.includes("Project Lead")).map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0, delay: 0.4 + (member.id * 0.1) }}
                  className={`relative bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl transition-all transform group ${
                    hoveredCard === member.id 
                      ? 'scale-105 rotate-1 shadow-xl' 
                      : 'scale-100 rotate-0 hover:scale-102'
                  } bg-gradient-to-br from-[#2B2139]/20 to-[#0B0219]/20 min-h-96 flex flex-col`}
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Main Content */}
                  <div className="flex-1 p-8">
                    {/* Profile Image */}
                    <div className="relative z-10 w-45 h-45 mx-auto mb-6 transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-1">
                      {/* Gradient Border */}
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#F786C7] to-[#FFCAE4] animate-gradient-rotate opacity-0 group-hover:opacity-65 transition-opacity duration-500"></div>
                      
                      {/* Square Image Container */}
                      <div className="relative w-full h-full rounded-xl bg-transparent overflow-hidden">
                        <div className="w-full h-full rounded-xl">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-xl object-cover relative z-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-4 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                      <h3 className="text-lg font-bold text-white mb-2">
                        {member.name}
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-sm">
                        {member.role}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-light-silver text-sm leading-relaxed text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                      {member.description}
                    </p>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => setHoveredCard(member.id)}
                      className="w-full py-4 bg-transparent text-white text-sm font-medium border-t border-white/30 hover:border-white/60 hover:bg-white/5 transition-all duration-300 rounded-b-xl"
                    >
                      View Profile
                    </button>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-xl from-[#FFCAE4] to-[#FFCAE4] opacity-0 group-hover:opacity-5 blur-md transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Women in Tech Section */}
      <section
        id="women-in-tech"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Women in&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Tech</span>
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-16">
            Driving innovation and excellence in technology, our women engineers and designers bring 
            diverse perspectives to create inclusive and impactful solutions for political transparency.
          </p>
        </div>
        
        <div className="flex-1 flex items-start justify-center px-8 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, type: 'spring', delay: 0.2 }}
            >
              {members.filter(member => 
                member.name === "Raisa Reza" || 
                member.name === "Yakina Azza" ||
                member.name === "Sadwitha Thopucharla"
              ).map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0, delay: 0.4 + (member.id * 0.1) }}
                  className={`relative bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl transition-all transform group ${
                    hoveredCard === member.id 
                      ? 'scale-105 rotate-1 shadow-xl' 
                      : 'scale-100 rotate-0 hover:scale-102'
                  } bg-gradient-to-br from-[#2B2139]/20 to-[#0B0219]/20 min-h-96 flex flex-col`}
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Main Content */}
                  <div className="flex-1 p-8">
                    {/* Profile Image */}
                    <div className="relative z-10 w-45 h-45 mx-auto mb-6 transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-1">
                      {/* Gradient Border */}
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#F786C7] to-[#FFCAE4] animate-gradient-rotate opacity-0 group-hover:opacity-65 transition-opacity duration-500"></div>
                      
                      {/* Square Image Container */}
                      <div className="relative w-full h-full rounded-xl bg-transparent overflow-hidden">
                        <div className="w-full h-full rounded-xl">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-xl object-cover relative z-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-4 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                      <h3 className="text-lg font-bold text-white mb-2">
                        {member.name}
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-sm">
                        {member.role}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-light-silver text-sm leading-relaxed text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                      {member.description}
                    </p>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => setHoveredCard(member.id)}
                      className="w-full py-4 bg-transparent text-white text-sm font-medium border-t border-white/30 hover:border-white/60 hover:bg-white/5 transition-all duration-300 rounded-b-xl"
                    >
                      View Profile
                    </button>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-xl from-[#FFCAE4] to-[#FFCAE4] opacity-0 group-hover:opacity-5 blur-md transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Development Team Section */}
      <section
        id="development-team"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Development&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Team</span>
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-16">
            Building the core technology behind DebateMatch.RAG, our development team combines 
            cutting-edge AI research with robust engineering to deliver reliable, scalable solutions.
          </p>
        </div>
        
        <div className="flex-1 flex items-start justify-center px-8 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, type: 'spring', delay: 0.2 }}
            >
              {members.filter(member => 
                member.name === "Khang Doan" || 
                member.name === "Pavan Arani" || 
                member.name === "Satyank Nadimpalli"
              ).map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0, delay: 0.4 + (member.id * 0.1) }}
                  className={`relative bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl transition-all transform group ${
                    hoveredCard === member.id 
                      ? 'scale-105 rotate-1 shadow-xl' 
                      : 'scale-100 rotate-0 hover:scale-102'
                  } bg-gradient-to-br from-[#2B2139]/20 to-[#0B0219]/20 min-h-96 flex flex-col`}
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Main Content */}
                  <div className="flex-1 p-8">
                    {/* Profile Image */}
                    <div className="relative z-10 w-45 h-45 mx-auto mb-6 transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-1">
                      {/* Gradient Border */}
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#F786C7] to-[#FFCAE4] animate-gradient-rotate opacity-0 group-hover:opacity-65 transition-opacity duration-500"></div>
                      
                      {/* Square Image Container */}
                      <div className="relative w-full h-full rounded-xl bg-transparent overflow-hidden">
                        <div className="w-full h-full rounded-xl">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-xl object-cover relative z-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-4 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                      <h3 className="text-lg font-bold text-white mb-2">
                        {member.name}
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-sm">
                        {member.role}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-light-silver text-sm leading-relaxed text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                      {member.description}
                    </p>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => setHoveredCard(member.id)}
                      className="w-full py-4 bg-transparent text-white text-sm font-medium border-t border-white/30 hover:border-white/60 hover:bg-white/5 transition-all duration-300 rounded-b-xl"
                    >
                      View Profile
                    </button>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-xl from-[#FFCAE4] to-[#FFCAE4] opacity-0 group-hover:opacity-5 blur-md transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

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