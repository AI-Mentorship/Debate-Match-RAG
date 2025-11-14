import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Transcripts({ onGetStarted, onModalStateChange }) {
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
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

  const smoothScrollToTop = (duration = 1200) => {
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
    const interval = setInterval(createStar, 50)

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

  return (
    <div className="flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
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
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={scrollToNextSection}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-dark-silver text-sm mb-2 font-medium">
            {currentSection == 0 ? 'Browse Collection' : ''}
            {currentSection < 1 ? ' ↓' : 'Scroll up ↑'}
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
          <h1 className="text-5xl md:text-5xl text-white mb-5 leading-tight">
            Across debates find guidance.
          </h1>
          <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
            Through transcripts make decisions.
          </h2>
        </motion.div>

        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        >
          <div className="mb-10 text-md md:text-md text-dark-silver max-w-2xl mx-auto leading-relaxed">
            Search through our comprehensive collection of debate transcripts. Find specific arguments, 
            track speaker positions, and uncover valuable insights with our advanced browsing tools.
          </div>
        </motion.div>
      </section>

      {/* Browse Collection Section */}
      <section
        id="browse"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['browse'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Collection&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Browser</span>
          </h2>
          {/* Description */}
          <div className="text-lg text-dark-silver max-w-4xl mx-auto mb-16">
            Explore our curated collection of debate transcripts. Each transcript is carefully processed 
            for optimal search and analysis with topic categorization and speaker tracking.
          </div>
        </div>
        
        <div className="flex-1 w-full">
          <div className="min-h-screen text-white w-full">
            <div className="container mx-auto px-8">
              {/* Search Bar */}
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={visibleSections['browse'] ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="max-w-4xl mb-12 justify-center mx-auto"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search transcripts by title, participant, tags, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-dark-silver focus:outline-none focus:border-electric-purple focus:ring-2 focus:ring-electric-purple/20 transition-all duration-300"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-silver">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Main Content */}
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transcript List */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={visibleSections['browse'] ? { x: 0, opacity: 1 } : { x: -100, opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="lg:col-span-1"
                >
                  <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-left">
                    <h2 className="text-2xl font-bold mb-6 text-white text-left">Transcripts (1)</h2>
                  </div>
                </motion.div>

                {/* Transcript Viewer */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={visibleSections['browse'] ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="lg:col-span-2"
                >
                  <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-6 h-full text-left">
                    <div className="h-full flex items-center justify-center text-dark-silver">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-dark-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg">Select a transcript to view its content</p>
                        <p className="text-sm mt-2">Use the search bar to find specific topics or speakers</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shooting star animation */}
      <style>
        {`
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
        `}
      </style>
    </div>
  )
}

export default Transcripts