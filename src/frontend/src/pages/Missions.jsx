import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Missions({ onGetStarted }) {
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
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
        setTimeout(() => {
          const sectionId = section.id;
          setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
        }, 600);
        
        smoothScrollTo(section, 1200);
      }
    } else {
      // If at last section, scroll back to top smoothly
      setCurrentSection(0);
      smoothScrollToTop(1200);
    }
  }

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

  return (
    <div className="flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* ==================== Shooting stars animation ==================== */}
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

      {/* ==================== Scroll Indicator ==================== */}
      <motion.div
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={scrollToNextSection}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-dark-silver text-sm mb-2 font-medium">
            {currentSection == 0 ? 'Why We Build DebateMatch.RAG' : ''}
            {currentSection == 1 ? 'How It Works' : ''}
            {currentSection == 2 ? 'Our Vision' : ''}
            {currentSection == 3 ? 'Our Core Values' : ''}
            {currentSection == 4 ? 'Who Benefits' : ''}
            {currentSection < 5 ? ' ↓' : 'Scroll up ↑'}
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
            Where complexities find clarity.
          </h1>
          <h2 className="text-6xl md:text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent mb-10 leading-tight">
            Where questions yield transparency.
          </h2>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
        >
          <div className="mb-10 text-md md:text-md text-dark-silver max-w-4xl mx-auto leading-relaxed">
            To assist voters, we offer thoughtful, AI-powered analysis of debate transcripts,
            helping the public discern factual statements from political rhetoric.
          </div>
        </motion.div>
      </section>

      {/* ==================== Why We Build DebateMatch.RAG Section ==================== */}
      <section
        id="why-we-build"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['why-we-build'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Why We Build&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
            <span className="text-white">.RAG</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-12">
            While general AI synthesizes from millions of sources, DebateMatch.RAG retrieves exclusively
            from verified debate transcripts, transforming AI from encyclopedia to forensic analyst.
          </div>
        </div>
        <div className="flex-1 flex items-start justify-center">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-30 items-center">
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
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-57.5 h-57.5 border border-electric-purple/30 rounded-full"></div>
                    
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="text-center text-md font-bold">
                        <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
                        <span className="text-white">.RAG</span>
                      </div>
                    </div>

                    {/* Outer Ring - Data Points */}
                    <div className="relative w-72 h-72 animate-spin-slow">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-3 h-3 bg-white rounded-full opacity-60"
                          style={{
                            top: `${47.5 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                            left: `${47.5 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                          }}
                        ></div>
                      ))}
                    </div>                                    
                  </div>
                  
                  {/* Floating Text Elements */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative w-96 h-96 animate-spin-slow">
                      <div className="absolute top-0 left-50 transform -translate-x-1/2 -translate-y-full animate-spin-slow-reverse">
                        <div className="text-xs text-red-400 font-mono opacity-70 whitespace-nowrap">VERIFY</div>
                      </div>
                      <div className="absolute top-full left-50 transform -translate-x-1/2 translate-y-0 animate-spin-slow-reverse">
                        <div className="text-xs text-cyan-400 font-mono opacity-70 whitespace-nowrap">CLARITY</div>
                      </div>
                      <div className="absolute top-1/2 left-5 transform -translate-x-full -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-xs text-yellow-400 font-mono opacity-70 whitespace-nowrap">CONTEXT</div>
                      </div>
                      <div className="absolute top-1/2 left-90 transform translate-x-0 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-xs text-purple-400 font-mono opacity-70 whitespace-nowrap">INSIGHT</div>
                      </div>                      
                      <div className="absolute top-[15%] left-[15%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-xs text-electric-purple font-mono opacity-70 whitespace-nowrap">RAG</div>
                      </div>
                      <div className="absolute top-[15%] left-[85%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-xs text-blue-400 font-mono opacity-70 whitespace-nowrap">ANALYSIS</div>
                      </div>
                      <div className="absolute top-[85%] left-[15%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-xs text-green-400 font-mono opacity-70 whitespace-nowrap">FACTS</div>
                      </div>
                      <div className="absolute top-[85%] left-[85%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-xs text-gray-400 font-mono opacity-70 whitespace-nowrap">TRUTH</div>
                      </div>
                    </div>
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
                  <h3 className="text-xl font-semibold text-white mb-2">The Information Crisis in Politics</h3>
                  <p className="text-dark-silver leading-relaxed">
                    In today's political landscape, voters face an overwhelming flood of information, 
                    misinformation, and complex rhetoric. Traditional debate formats often leave citizens 
                    confused about what candidates actually stand for and which claims hold factual merit.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Our Solution</h3>
                  <p className="text-dark-silver leading-relaxed">
                    DebateMatch.RAG addresses this challenge by leveraging cutting-edge AI technology 
                    to analyze debate transcripts, verify factual accuracy, and present clear, accessible 
                    insights. We transform hours of political discourse into actionable information that 
                    empowers democratic participation.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">The Impact</h3>
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

      {/* ==================== How It Works Section ==================== */}
      <section
        id="how-it-works"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            How&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">It Works</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-12">
            Our system implements a four-stage retrieval-augmented generation pipeline, ensuring 
            every response is grounded in verified transcript data with complete source attribution.
          </div>
        </div>
        <div className="flex-1 flex items-start justify-center px-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  number: '01', 
                  title: 'Query Processing', 
                  description: 'User queries are parsed and semantically analyzed to identify key political concepts, candidate names, policy areas, and temporal references, enabling precise retrieval from debate transcripts.',
                  technical: 'Natural language processing extracts entities and intent before database queries are constructed.'
                },
                { 
                  number: '02', 
                  title: 'Semantic Retrieval', 
                  description: 'Our vector database performs semantic search across indexed debate transcripts, retrieving passages with contextual relevance to the query rather than simple keyword matching.',
                  technical: 'Embedding models encode both query and transcript passages into high-dimensional space for similarity matching.'
                },
                { 
                  number: '03', 
                  title: 'Source Verification', 
                  description: 'Retrieved passages are cross-referenced with metadata—timestamps, speaker identification, debate context—ensuring complete provenance and enabling independent verification.',
                  technical: 'Each retrieved segment includes debate name, speaker, timestamp, and surrounding context for validation.'
                },
                { 
                  number: '04', 
                  title: 'Response Generation', 
                  description: 'AI models synthesize answers using only the retrieved transcript passages, maintaining strict grounding in source material. All claims are directly attributed to specific debate moments.',
                  technical: 'Generation is constrained to retrieved context, preventing hallucination while maintaining coherent, informative responses.'
                }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="backdrop-blur-sm rounded-xl p-4 border border-dark-silver hover:border-electric-purple hover:bg-white/5 transition-all duration-500 group"
                >
                  <div className="flex items-start gap-6 mb-4">
                    <div className="text-4xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">
                      {item.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                      <p className="text-dark-silver leading-relaxed text-sm mb-4">{item.description}</p>
                      <div className="pl-4 border-l-3 border-electric-purple/50">
                        <p className="text-dark-silver/80 text-xs leading-relaxed italic">{item.technical}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Our Vision Section ==================== */}
      <section
        id="our-vision"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['our-vision'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Vision</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-12">
            Reimagining political discourse through verifiable intelligence—where every claim is grounded in primary sources, 
            not probabilistic generation.
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            {/* Interactive Comparison Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {/* General AI */}
              <div className="group perspective-1000">
                <div className="relative bg-gradient-to-br from-red-500/5 to-red-600/10 backdrop-blur-xl rounded-2xl p-8 border border-red-400/20 hover:border-red-400/40 transition-all duration-500 transform-style-3d group-hover:rotate-x-2 group-hover:rotate-y-2 h-full">
                  <h3 className="text-2xl font-bold text-white mb-6 text-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                    Other AI Tools
                  </h3>
                  
                  <div className="space-y-4 text-left relative z-10">
                    {[
                      {
                        title: "Pattern-Based Generation",
                        description: "Synthesizes answers from statistical correlations across training data"
                      },
                      {
                        title: "Unconstrained Fabrication", 
                        description: "Generates plausible statements with no relation to actual spoken words"
                      },
                      {
                        title: "Opaque Provenance",
                        description: "No mechanism for source attribution or independent verification"
                      }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-red-400/10 hover:border-red-400/30 bg-red-500/5 backdrop-blur-sm transition-all duration-300 group/item hover:translate-x-2 hover:bg-red-500/10"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-3 group-hover/item:scale-150 transition-transform duration-300"></span>
                          {item.title}
                        </h4>
                        <p className="text-dark-silver text-sm leading-relaxed pl-5">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>

              {/* DebateMatch.RAG */}
              <div className="group perspective-1000">
                <div className="relative bg-gradient-to-br from-electric-purple/10 to-purple-600/15 backdrop-blur-xl rounded-2xl p-8 border border-electric-purple/30 hover:border-electric-purple/60 transition-all duration-500 transform-style-3d group-hover:rotate-x-2 group-hover:rotate-y-2 h-full">
                  <div className="text-2xl font-bold text-white mb-6 text-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                    <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
                    <span className="text-white">.RAG</span>
                  </div>
                  
                  <div className="space-y-4 text-left relative z-10">
                    {[
                      {
                        title: "Retrieval-Constrained Generation",
                        description: "Every response derives from specific, timestamped debate transcripts"
                      },
                      {
                        title: "Anti-Hallucination Framework", 
                        description: "Technical safeguards prevent fabrication, outputs tethered to evidence"
                      },
                      {
                        title: "Transparent Audit Trail",
                        description: "Complete source attribution for independent verification"
                      }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-electric-purple/20 hover:border-electric-purple/50 bg-electric-purple/10 backdrop-blur-sm transition-all duration-300 group/item hover:translate-x-2 hover:bg-electric-purple/15"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                          <span className="w-2 h-2 bg-electric-purple rounded-full mr-3 group-hover/item:scale-150 transition-transform duration-300"></span>
                          {item.title}
                        </h4>
                        <p className="text-dark-silver text-sm leading-relaxed pl-5">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-electric-purple to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Core Values Section ==================== */}
      <section
        id="core-values"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['core-values'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Core Values</span>
          </h2>
          {/* Description */}
          <p className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-12">
            The principles that guide our mission and shape every aspect of our platform's development.
          </p>
        </div>
        <div className="flex-1 flex justify-center">
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

      {/* ==================== Who Benefits Section ==================== */}
      <section
        id="who-benefits"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['who-benefits'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Who&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Benefits</span>
          </h2>
          {/* Description */}
          <p className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-12">
            Empowering diverse stakeholders with actionable political intelligence and verified information.
          </p>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: 'Voters & Citizens', 
                  description: 'Get verifiable answers about what candidates actually said, with direct quotes and timestamps you can check—no more AI guesswork or hallucinations.' 
                },
                { 
                  title: 'Journalists & Researchers', 
                  description: 'Quickly verify political claims with primary source evidence from debates. Cite exact moments instead of relying on AI summaries that may be inaccurate.' 
                },
                { 
                  title: 'Educators & Students', 
                  description: 'Teach critical thinking using actual debate transcripts. Show students how to distinguish between AI-generated summaries and verifiable primary sources.' 
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

      {/* ==================== Styles ==================== */}
      <style> {`
        * {
          cursor: none !important;
        }

        button, a {
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

        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-slow-reverse {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .group-hover\:rotate-x-2:hover {
          transform: rotateX(2deg);
        }

        .group-hover\:rotate-y-2:hover {
          transform: rotateY(2deg);
        }
      `} </style>
    </div>
  )
}

export default Missions