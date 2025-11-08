import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Mission({ onGetStarted }) {
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const isScrolling = useRef(false)

  const smoothScrollTo = (element, duration = 1000) => {
    isScrolling.current = true
    const start = window.pageYOffset;
    const to = element.offsetTop - 30;
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
      } else {
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
      } else {
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
    } else {
      // If at last section, scroll back to top smoothly
      setCurrentSection(0);
      smoothScrollToTop(1200);
    }
  }

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

      setTimeout(() => {
        setStars(prev => prev.filter(star => star.id !== newStar.id))
      }, (newStar.duration + newStar.delay) * 1000)
    }

    for (let i = 0; i < 8; i++) {
      setTimeout(createStar, i * 300)
    }

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
          <span className="text-dark-silver text-sm mb-2">
            {currentSection < 3 ? 'Scroll down' : 'Back to top'}
          </span>
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
            From complexity to clarity.
          </h1>
          <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
            From question to insight.
          </h2>

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
          <button
            onClick={onGetStarted}
            className="mb-10 bg-transparent text-gray-200 px-20 py-3 rounded-full font-bold transition-all duration-700 shadow-2xl hover:shadow-silver-glow relative overflow-hidden group border-2 border-gray-300 hover:border-white cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/30 blur-xl transition-all duration-1000"></div>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/70 transition-all duration-1000"></div>
            <span className="relative z-10 text-gray-200 group-hover:text-white transition-colors duration-300 font-bold">
              Explore
            </span>
          </button>
        </motion.p>
      </section>

      {/* Why We Build DebateMatch.RAG Section */}
      <section
        id="why-we-build"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why We Build&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
            <span className="text-white">.RAG</span>
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-8">
            We're building a platform that transforms complex political discourse into accessible, 
            factual information to empower voters and strengthen democratic engagement.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { number: '1', title: 'Factual Accuracy', description: 'Grounding responses in actual debate transcripts' },
                { number: '2', title: 'Transparency', description: 'Making political discourse more accessible and understandable' },
                { number: '3', title: 'Voter Empowerment', description: 'Helping citizens make informed decisions' }
              ].map((item, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 shadow-xl">
                  <div className="text-5xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-4">
                    {item.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-dark-silver">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section
        id="our-vision"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Vision
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-8">
          Creating a future where political discourse is transparent, accessible, 
          and grounded in factual information for all citizens.
        </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-dark-silver leading-relaxed">
                We envision a world where every voter can easily access factual information from political debates, 
                enabling more informed democratic participation and holding public figures accountable for their statements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section
        id="core-values"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Core Values
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-8">
            The principles that guide our mission and shape every aspect of our platform's development.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { number: '1', title: 'Neutrality', description: 'Presenting information without political bias' },
                { number: '2', title: 'Accuracy', description: 'Ensuring responses are factually grounded' },
                { number: '3', title: 'Accessibility', description: 'Making complex information understandable' },
                { number: '4', title: 'Innovation', description: 'Leveraging AI for public good' }
              ].map((item, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 shadow-xl">
                  <div className="text-5xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-3">
                    {item.number}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-dark-silver text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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