import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Team({ onGetStarted, onModalStateChange }) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
  const [selectedMember, setSelectedMember] = useState(null)
  const scrollPositionRef = useRef(0);
  const isScrolling = useRef(false)
  
  /* ==================== Scroll ==================== */
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
    // Modal is open
    if (selectedMember) return;

    const sections = document.querySelectorAll('section[id]');
    const nextSection = currentSection + 1;
    
    if (nextSection < sections.length) {
      setCurrentSection(nextSection);
      const section = sections[nextSection];
      
      if (section) {
        setTimeout(() => {
          const sectionId = section.id;
          setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
        }, 700);
        
        smoothScrollTo(section, 1200);
      }
    }
    
    else {
      // If at last section, scroll back to top smoothly
      setCurrentSection(0);
      smoothScrollToTop(1200);
    }
  };

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

        // Check if section is in viewport for fade-in effect
        const sectionMiddle = sectionTop + section.offsetHeight / 9;
        if (window.scrollY + window.innerHeight > sectionMiddle) {
          setVisibleSections(prev => ({ ...prev, [section.id]: true }));
        }
      });
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ==================== Modal ==================== */
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedMember) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
    }
    
    else {
      document.body.style.overflow = 'unset';
      window.scrollTo(0, scrollPositionRef.current);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMember]);

  // Modal state change
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(selectedMember !== null);
    }
  }, [selectedMember, onModalStateChange]);

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

  const members = [
    {
      id: 1,
      name: "Adya Dhanasekar",
      role: "Project Lead - Mentor",
      description: "B.S. in Computer Science",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/adyadhanasekar/",
      instagram: "https://www.instagram.com/adya.d08/",
      image: "src/assets/img/Adya_Dhanasekar.png"
    },
    {
      id: 2,
      name: "Yakina Azza",
      role: "Transcript Preprocessing",
      description: "B.S. in Computer Science. She is an ML/AI Researcher",
      paragraph: "Yakina is a senior majoring in Computer Science and works in labs that blend machine learning, AI, and psychology. She has taught coding through CS outreach and previously taught math and English to underserved students in Dhaka. She enjoys using technology to help people and likes approaching problems creatively.",
      linkedin: "https://www.linkedin.com/in/yakina-azza/",
      instagram: "https://www.instagram.com/yakkk114/",
      image: "src/assets/img/Yakina_Azza.png"
    },
    {
      id: 3,
      name: "Sadwitha Thopucharla",
      role: "Q & A Pipeline",
      description: "B.S. in Computer Science",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/sadwitha1161/",
      instagram: "https://www.instagram.com/sadwitha_11/",
      image: "src/assets/img/Sadwitha_Thopucharla.jpg"
    },
    {
      id: 4,
      name: "Raisa Reza",
      role: "Data Retrieval",
      description: "B.S. in Computer Science",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/raisa-reza/",
      instagram: "",
      image: "src/assets/img/Raisa_Reza.jpeg"
    },
    {
      id: 5,
      name: "Shivam Singh",
      role: "Project Lead - Mentor",
      description: "B.S. in Computer Science",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/shivam-singh-9935ab305/",
      instagram: "https://www.instagram.com/singh.shivam7/",
      image: "src/assets/img/Shivam_Singh.png"
    },
    {
      id: 6,
      name: "Satyank Nadimpalli",
      role: "Full-stack Developer",
      description: "M.S. in Computer Science studying AI & Intelligent Systems",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/satyank-nadimpalli/",
      instagram: "https://www.instagram.com/satyank.varma/",
      image: "src/assets/img/Satyank_Nadimpalli.jpg"
    },
    {
      id: 7,
      name: "Khang Doan",
      role: "Full-stack Developer",
      description: "B.S. in Computer Science with focus on AI & Machine Learning",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/khangdoan514/",
      instagram: "https://www.instagram.com/itsmekhangdoan/",
      image: "src/assets/img/Khang_Doan.png"
    },
    {
      id: 8,
      name: "Pavan Arani",
      role: "Full-stack Developer",
      description: "B.S. in Computer Science with focus on Cybersecurity and AI/ML",
      paragraph: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis deserunt distinctio modi omnis dignissimos, quidem consequatur saepe quam, delectus pariatur aperiam perspiciatis laboriosam dolorem et exercitationem! Cum totam beatae repellendus. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid, et, sequi veniam quas nesciunt dignissimos excepturi tempora cupiditate, unde sed ipsa ducimus. Tenetur corrupti illo ea laborum dolorum consequuntur! Tempore!",
      linkedin: "https://www.linkedin.com/in/pavan-arani-15954426a/",
      instagram: "https://www.instagram.com/botiq00/",
      image: "src/assets/img/Pavan_Arani.jpeg"
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* ==================== Shooting star animation ==================== */}
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

      {/* ==================== Profile Modal ==================== */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/80 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedMember(null)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative bg-gradient-to-br from-[#251f2e] via-[#1a1029] to-[#0B0219] rounded-2xl border border-white/20 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Left Side - Profile Image */}
                <div className="md:w-2/5 flex items-center justify-center p-8 md:p-12 relative">
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors duration-200 z-10"
                    style={{ cursor: 'none' }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div className="relative w-80 h-80">                  
                    {/* Profile Image */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                      <img 
                        src={selectedMember.image} 
                        alt={selectedMember.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Content */}
                <div className="md:w-3/5 p-8 md:p-12 flex flex-col">
                  {/* Content */}
                  <div className="flex-1 flex flex-col text-left">
                    <div className="flex justify-between items-start">
                      {/* Name and Role */}
                      <div className="flex-1">
                        <h2 className="text-4xl font-bold text-white mb-2 text-left">
                          {selectedMember.name}
                        </h2>
                        <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-xl mb-4 text-left">
                          {selectedMember.role}
                        </p>
                      </div>

                      {/* Social Media */}
                      <div className="flex space-x-2">
                        {/* LinkedIn */}
                        <a
                          href={selectedMember.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110"
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
                        {selectedMember.instagram !== "#" && (
                          <a
                            href={selectedMember.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110"
                          >
                            <svg 
                              className="w-4 h-4 text-white" 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                      <p className="text-dark-silver text-base leading-relaxed text-left">
                        {selectedMember.description}
                      </p>
                    </div>

                    {/* About Me Section */}
                    <div className="border-t border-white/20 pt-8">
                      <h3 className="text-2xl font-bold text-white mb-4 text-left">About Me</h3>
                      <p className="text-dark-silver text-base leading-relaxed text-left">
                        {selectedMember.paragraph}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Scroll Indicator ==================== */}
      {!selectedMember && (
        <motion.div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={scrollToNextSection}
        >
          <div className="flex flex-col items-center justify-center">
            <span className="text-dark-silver text-sm mb-2 font-medium">
              {currentSection == 0 ? 'Project Leadership' : ''}
              {currentSection == 1 ? 'Technical Excellence' : ''}
              {currentSection == 2 ? 'Development Team' : ''}
              {currentSection < 3 ? ' ↓' : 'Scroll up ↑'}
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
      )}

      {/* ==================== Hero Section ==================== */}
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
            From concepts to creation.
          </h1>
          <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
            From ideas to implementation.
          </h2>
        </motion.div>

        {/* Description */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        >
          <div className="mb-10 text-md md:text-md text-dark-silver max-w-4xl mx-auto leading-relaxed">
            Meet the passionate team behind DebateMatch.RAG project. We combine expertise in AI research, 
            engineering, and design to create the future of debate analysis.
          </div>
        </motion.div>
      </section>

      {/* ==================== Leadership Section ==================== */}
      <section
        id="leadership"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['leadership'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Project&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Leadership</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-18">
            Guiding our vision with strategic direction and technical expertise, our project leads 
            ensure we deliver innovative solutions that transform political discourse through AI-powered analysis.
          </div>
        </div>
        
        <div className="flex-1 flex items-start justify-center px-8 pb-8">
          <div className="max-w-3xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {members.filter(member => member.role.includes("Project Lead")).map((member) => (
                <motion.div
                  key={member.id}
                  className={`relative backdrop-blur-lg rounded-2xl border transition-all duration-500 group min-h-96 flex flex-col ${
                    hoveredCard === member.id 
                      ? 'border-[#F786C7] shadow-2xl shadow-electric-purple/20 translate-y-[-8px]' 
                      : 'border-white/10 shadow-lg'
                  } bg-gradient-to-br from-[#2B2139]/30 to-[#0B0219]/30`}
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Main Content */}
                  <div className="flex-1 p-8">
                    {/* Profile Image */}
                    <div className="relative z-10 w-32 h-32 mx-auto mb-6 transition-all duration-500 group-hover:scale-105">
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#F786C7] to-[#FFCAE4] opacity-0 group-hover:opacity-50 transition-all duration-500 blur-sm"></div>
                      <div className="relative w-full h-full rounded-2xl bg-transparent overflow-hidden border-2 border-white/10 group-hover:border-white/20 transition-all duration-500">
                        <div className="w-full h-full rounded-2xl">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-2xl object-cover relative z-10 group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-2 pt-2 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F786C7] transition-colors duration-500">
                        {member.name}
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-sm">
                        {member.role}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="text-dark-silver text-sm leading-relaxed text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                      {member.description}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-auto h-16 flex-shrink-0">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedMember(member);
                      }}
                      className="w-full h-full bg-gradient-to-r from-transparent to-transparent hover:from-[#F786C7]/10 hover:to-[#FFCAE4]/10 text-white text-sm font-semibold border-t border-white/20 hover:border-[#F786C7]/50 transition-all duration-300 rounded-b-2xl flex items-center justify-center group/btn"
                    >
                      <span className="group-hover/btn:tracking-wider transition-all duration-300 inline-block">
                        View Profile →
                      </span>
                    </button>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F786C7]/0 to-[#FFCAE4]/0 group-hover:from-[#F786C7]/5 group-hover:to-[#FFCAE4]/5 transition-all duration-500 pointer-events-none"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Technical Excellence Section ==================== */}
      <section
        id="technical-excellence"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['technical-excellence'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Technical&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Excellence</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-18">
            Driving quality and innovation across design, backend infrastructure, and testing pipelines.
            Our technical specialists ensure every aspect of DebateMatch.RAG meets the highest standards of excellence.
          </div>
        </div>
        
        <div className="flex-1 flex items-start justify-center px-8 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {members.filter(member => 
                member.name === "Raisa Reza" || 
                member.name === "Yakina Azza" ||
                member.name === "Sadwitha Thopucharla"
              ).map((member) => (
                <motion.div
                  key={member.id}
                  className={`relative backdrop-blur-lg rounded-2xl border transition-all duration-500 group min-h-96 flex flex-col ${
                    hoveredCard === member.id 
                      ? 'border-[#F786C7] shadow-2xl shadow-electric-purple/20 translate-y-[-8px]' 
                      : 'border-white/10 shadow-lg'
                  } bg-gradient-to-br from-[#2B2139]/30 to-[#0B0219]/30`}
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Main Content */}
                  <div className="flex-1 p-8">
                    {/* Profile Image */}
                    <div className="relative z-10 w-32 h-32 mx-auto mb-6 transition-all duration-500 group-hover:scale-105">
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#F786C7] to-[#FFCAE4] opacity-0 group-hover:opacity-50 transition-all duration-500 blur-sm"></div>
                      <div className="relative w-full h-full rounded-2xl bg-transparent overflow-hidden border-2 border-white/10 group-hover:border-white/20 transition-all duration-500">
                        <div className="w-full h-full rounded-2xl">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-2xl object-cover relative z-10 group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-2 pt-2 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F786C7] transition-colors duration-500">
                        {member.name}
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-sm">
                        {member.role}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="text-dark-silver text-sm leading-relaxed text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                      {member.description}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-auto h-16 flex-shrink-0">
                    <button 
                      onClick={() => setSelectedMember(member)}
                      className="w-full h-full bg-gradient-to-r from-transparent to-transparent hover:from-[#F786C7]/10 hover:to-[#FFCAE4]/10 text-white text-sm font-semibold border-t border-white/20 hover:border-[#F786C7]/50 transition-all duration-300 rounded-b-2xl flex items-center justify-center group/btn"
                    >
                      <span className="group-hover/btn:tracking-wider transition-all duration-300 inline-block">
                        View Profile →
                      </span>
                    </button>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F786C7]/0 to-[#FFCAE4]/0 group-hover:from-[#F786C7]/5 group-hover:to-[#FFCAE4]/5 transition-all duration-500 pointer-events-none"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Development Team Section ==================== */}
      <section
        id="development-team"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['development-team'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Development&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Team</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-18">
            Building the core technology behind DebateMatch.RAG, our development team combines 
            cutting-edge AI research with robust engineering to deliver reliable, scalable solutions.
          </div>
        </div>
        
        <div className="flex-1 flex items-start justify-center px-8 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {members.filter(member => 
                member.name === "Khang Doan" || 
                member.name === "Pavan Arani" || 
                member.name === "Satyank Nadimpalli"
              ).map((member) => (
                <motion.div
                  key={member.id}
                  className={`relative backdrop-blur-lg rounded-2xl border transition-all duration-500 group min-h-96 flex flex-col ${
                    hoveredCard === member.id 
                      ? 'border-[#F786C7] shadow-2xl shadow-electric-purple/20 translate-y-[-8px]' 
                      : 'border-white/10 shadow-lg hover:border-white/30'
                  } bg-gradient-to-br from-[#2B2139]/30 to-[#0B0219]/30`}
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Main Content */}
                  <div className="flex-1 p-8">
                    {/* Profile Image */}
                    <div className="relative z-10 w-32 h-32 mx-auto mb-6 transition-all duration-500 group-hover:scale-105">
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#F786C7] to-[#FFCAE4] opacity-0 group-hover:opacity-50 transition-all duration-500 blur-sm"></div>
                      <div className="relative w-full h-full rounded-2xl bg-transparent overflow-hidden border-2 border-white/10 group-hover:border-white/20 transition-all duration-500">
                        <div className="w-full h-full rounded-2xl">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-2xl object-cover relative z-10 group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name and Role */}
                    <div className="text-center mb-2 pt-2 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F786C7] transition-colors duration-500">
                        {member.name}
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#F786C7] to-[#FFCAE4] font-semibold text-sm">
                        {member.role}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="text-dark-silver text-sm leading-relaxed text-center relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                      {member.description}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-auto h-16 flex-shrink-0">
                    <button 
                      onClick={() => setSelectedMember(member)}
                      className="w-full h-full bg-gradient-to-r from-transparent to-transparent hover:from-[#F786C7]/10 hover:to-[#FFCAE4]/10 text-white text-sm font-semibold border-t border-white/20 hover:border-[#F786C7]/50 transition-all duration-300 rounded-b-2xl flex items-center justify-center group/btn"
                    >
                      <span className="group-hover/btn:tracking-wider transition-all duration-300 inline-block">
                        View Profile →
                      </span>
                    </button>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F786C7]/0 to-[#FFCAE4]/0 group-hover:from-[#F786C7]/5 group-hover:to-[#FFCAE4]/5 transition-all duration-500 pointer-events-none"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Shooting star animation ==================== */}
      <style> {`
        * {
          cursor: none !important;
        }

        button, a, input, textarea {
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

export default Team