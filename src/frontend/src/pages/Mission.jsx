import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Mission({ onGetStarted }) {
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
            {currentSection === 0}
            {currentSection === 1}
            {currentSection === 2}
            {currentSection === 3}
            {currentSection === 4}
            {currentSection === 5}
            {currentSection < 5 ? 'Scroll down ↓' : 'Scroll up ↑'}
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
            From complexity to clarity.
          </h1>
          <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
            From question to transparency.
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        >
          <p className="mb-10 text-md md:text-md text-dark-silver max-w-2xl mx-auto leading-relaxed">
            To assist voters, we offer thoughtful, AI-powered analysis of debate transcripts,
            helping the public discern factual statements from political rhetoric.
          </p>
        </motion.p>
      </section>

      {/* Why We Build DebateMatch.RAG Section */}
      <section
        id="why-we-build"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        
        <div className="w-full pt-30">
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Why We Build&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
            <span className="text-white">.RAG</span>
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-50 items-center">
              {/* Left Side */}
              <motion.div 
                className="relative"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                {/* Data Visualization */}
                <div className="relative h-96">
                  {/* Orbiting Elements */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-electric-purple/30 rounded-full"></div>
                    
                    {/* Outer Ring - Data Points */}
                    <div className="relative w-60 h-60">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-3 h-3 bg-white rounded-full opacity-60"
                          style={{
                            top: `${47 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                            left: `${47 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                          }}
                        ></div>
                      ))}
                    </div>                                    
                  </div>
                  
                  {/* Floating Text Elements - Increased spacing */}
                  <div className="absolute top-1/5 left-1/5 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-electric-purple font-mono opacity-70">RAG</div>
                  </div>
                  <div className="absolute top-1/5 left-4/5 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-blue-400 font-mono opacity-70">ANALYSIS</div>
                  </div>
                  <div className="absolute top-4/5 left-1/5 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-green-400 font-mono opacity-70">FACTS</div>
                  </div>
                  <div className="absolute top-4/5 left-4/5 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-gray-400 font-mono opacity-70">TRUTH</div>
                  </div>
                  <div className="absolute top-1/2 left-1/10 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-yellow-400 font-mono opacity-70">CONTEXT</div>
                  </div>
                  <div className="absolute top-1/2 left-9/10 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-purple-400 font-mono opacity-70">INSIGHT</div>
                  </div>
                  <div className="absolute top-1/10 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-red-400 font-mono opacity-70">VERIFY</div>
                  </div>
                  <div className="absolute top-9/10 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs text-cyan-400 font-mono opacity-70">CLARITY</div>
                  </div>
                </div>
                
                {/* Description Text */}
                <div className="text-center mt-8">
                  <h3 className="text-xl font-semibold text-white mb-2">Advanced Political Intelligence</h3>
                  <p className="text-dark-silver text-sm leading-relaxed">
                    Our system processes political discourse through multiple layers of analysis, 
                    connecting debate transcripts with verified factual data to deliver accurate insights.
                  </p>
                </div>
              </motion.div>

              {/* Right Side */}
              <motion.div 
                className="space-y-8 text-left"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">The Information Crisis in Politics</h3>
                  <p className="text-dark-silver leading-relaxed">
                    In today's political landscape, voters face an overwhelming flood of information, 
                    misinformation, and complex rhetoric. Traditional debate formats often leave citizens 
                    confused about what candidates actually stand for and which claims hold factual merit.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Our Solution</h3>
                  <p className="text-dark-silver leading-relaxed">
                    DebateMatch.RAG addresses this challenge by leveraging cutting-edge AI technology 
                    to analyze debate transcripts, verify factual accuracy, and present clear, accessible 
                    insights. We transform hours of political discourse into actionable information that 
                    empowers democratic participation.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">The Impact</h3>
                  <p className="text-dark-silver leading-relaxed">
                    By making political analysis accessible to everyone, we're working toward a more 
                    informed electorate, greater political accountability, and ultimately, a stronger 
                    democracy where decisions are based on facts rather than rhetoric.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        {/* Title */}
        <div className="w-full pt-30">
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            How&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">It Works</span>
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { number: '1', title: 'Question Input', description: 'Users submit political questions about candidate positions or debate topics' },
                { number: '2', title: 'Transcript Retrieval', description: 'AI searches through comprehensive debate transcripts to find relevant statements' },
                { number: '3', title: 'Fact Verification', description: 'Retrieved statements are cross-referenced with trusted fact-checking databases' },
                { number: '4', title: 'Synthesized Response', description: 'System generates clear, cited answers with context and accuracy ratings' }
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

      {/* Our Vision Section */}
      <section
        id="our-vision"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Vision</span>
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
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Core Values</span>
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-8">
            The principles that guide our mission and shape every aspect of our platform's development.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { number: '1', title: 'Factual Accuracy', description: 'Grounding responses in actual debate transcripts and verified sources' },
                { number: '2', title: 'Transparency', description: 'Making political discourse more accessible and understandable for all' },
                { number: '3', title: 'Voter Empowerment', description: 'Helping citizens make informed decisions based on verified information' },
                { number: '4', title: 'Combatting Misinformation', description: 'Providing verified context against misleading claims and rhetoric' },
                { number: '5', title: 'Democratizing Information', description: 'Making political analysis accessible to all voters regardless of background' },
                { number: '6', title: 'Accountability', description: 'Tracking candidate statements against factual records and past positions' }
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

      {/* Who Benefits Section */}
      <section
        id="who-benefits"
        className="min-h-screen w-full flex flex-col relative z-10"
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Who&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Benefits</span>
          </h2>
          {/* Description */}
          <p className="text-lg text-dark-silver max-w-3xl mx-auto mb-8">
            Empowering diverse stakeholders with actionable political intelligence and verified information.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: 'Voters & Citizens', 
                  description: 'Make informed decisions based on verified candidate statements and track records across multiple debates and elections.' 
                },
                { 
                  title: 'Journalists & Researchers', 
                  description: 'Quickly verify political claims and access comprehensive analysis of candidate positions with proper source attribution.' 
                },
                { 
                  title: 'Educators & Students', 
                  description: 'Provide students with primary source analysis tools for civics education and critical thinking development.' 
                }
              ].map((item, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 shadow-xl hover:border-electric-purple/30 transition-all duration-300">
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-dark-silver">{item.description}</p>
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
        
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        .animate-shooting-star {
          animation: shooting-star linear forwards;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default Mission