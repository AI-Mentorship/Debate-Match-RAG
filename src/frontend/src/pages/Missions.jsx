import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Missions({ onGetStarted }) {
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
  const [currentVisionStep, setCurrentVisionStep] = useState(0)
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

    // Separate handler for saving scroll position
    const saveScrollPosition = () => {
      sessionStorage.setItem('missionsScrollPosition', window.scrollY.toString());
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', saveScrollPosition);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, []);

  // Restore scroll position on component mount
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('missionsScrollPosition');
    
    if (savedScrollPosition) {
      const scrollPos = parseInt(savedScrollPosition, 10);
      console.log('Restoring scroll position:', scrollPos); // Debug log
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
      });
    }
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
            {currentSection == 0 ? 'Information Crisis' : ''}
            {currentSection == 1 ? 'Why We Build DebateMatch.RAG' : ''}
            {currentSection == 2 ? 'How It Works' : ''}
            {currentSection == 3 ? 'Our Tech Stack' : ''}
            {currentSection == 4 ? 'Why We Stand Out' : ''}
            {currentSection == 5 ? 'Our Core Values' : ''}
            {currentSection == 6 ? 'Who Benefits' : ''}
            {currentSection < 7 ? ' ↓' : 'Scroll up ↑'}
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
            We provide intelligent analysis of political debates, helping voters understand what candidates 
            actually said and separating verifiable facts from political messaging.
          </div>
        </motion.div>
      </section>

      {/* ==================== Information Crisis Section ==================== */}
      <section
        id="information-crisis"
        className={`min-h-screen w-full flex flex-col items-center justify-center relative z-10 transition-all duration-1000 ${
          visibleSections['information-crisis'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center max-w-6xl mx-auto px-8">
          <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Information&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Crisis</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-8">
            Voters often face an overwhelming flood of information, misinformation, and complex
            rhetoric. Traditional debate formats often leave citizens confused about what candidates
            actually stand for and which claims hold factual merit.
          </div>
        </div>
          {/* Main Container */}
          <motion.div
            className="relative mx-auto w-full max-w-6xl"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="group relative p-12 overflow-hidden">              
              {/* Subtle glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="relative z-10">
                {/* Section Label */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20"></div>
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-300">Dual Challenge Analysis</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20"></div>
                </div>

                {/* Two Crisis Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-12">
                  {/* Democracy Under Attack */}
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="relative group/crisis"
                  >
                    <div className="relative overflow-hidden h-full">
                      <div className="relative z-10">
                        {/* Number badge */}
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 mb-6">
                          <span className="text-red-400 font-bold text-lg">01</span>
                        </div>

                        {/* Title */}
                        <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">
                          Democracy Under Attack
                        </h4>
                        
                        {/* Description */}
                        <p className="text-gray-400 text-base leading-relaxed mb-6 group-hover/crisis:text-gray-300 transition-colors duration-500">
                          As voters abandon traditional news, debates are being cut, clipped, and distorted 
                          before the public ever sees the truth.
                        </p>

                        {/* Metrics */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t border-red-500/10">
                          {['High Risk', 'Urgent', 'Critical'].map((tag, i) => (
                            <span 
                              key={i}
                              className="text-xs font-medium text-red-400/80 uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* The Access Gap */}
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="relative group/crisis"
                  >
                    <div className="relative overflow-hidden h-full">
                      <div className="relative z-10">
                        {/* Number badge */}
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-6">
                          <span className="text-blue-400 font-bold text-lg">02</span>
                        </div>

                        {/* Title */}
                        <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">
                          The Access Gap
                        </h4>
                        
                        {/* Description */}
                        <p className="text-gray-400 text-base leading-relaxed mb-6 group-hover/crisis:text-gray-300 transition-colors duration-500">
                          Americans struggle to find reliable debate analysis, leaving them dependent on soundbites rather than full context.
                        </p>

                        {/* Metrics */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t border-blue-500/10">
                          {['Limited Access', 'Overload', 'Trust Crisis'].map((tag, i) => (
                            <span 
                              key={i}
                              className="text-xs font-medium text-blue-400/80 uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Divider */}
                <div className="relative h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-electric-purple rounded-full shadow-lg shadow-electric-purple/50"></div>
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-8">
                  {[
                    { value: '2×', label: 'Compounding Crises', sublabel: 'Dual threat amplification' },
                    { value: '∞', label: 'Information Flood', sublabel: 'Overwhelming volume' },
                    { value: '0', label: 'Clarity Without Tools', sublabel: 'Current state baseline' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="relative text-center group/stat"
                    >
                      {/* Metric value */}
                      <div className="text-6xl font-bold text-white mb-3">
                        {stat.value}
                      </div>
                      
                      {/* Label */}
                      <div className="text-sm font-semibold text-white/90 mb-1 tracking-wide">
                        {stat.label}
                      </div>
                      <div className="text-xs text-gray-500 tracking-wider uppercase">
                        {stat.sublabel}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
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
            Unlike general AI that generates answers from broad training data, DebateMatch.RAG retrieves 
            exact quotes from verified debate transcripts with timestamps you can verify yourself.
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
                <div className="relative h-90">
                  {/* Orbiting Elements */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-electric-purple/30 rounded-full"></div>
                    
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="text-center text-md font-bold">
                        <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
                        <span className="text-white">.RAG</span>
                      </div>
                    </div>

                    {/* Data Points */}
                    <div className="relative w-60 h-60 animate-spin-slow">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-3 h-3 bg-white rounded-full opacity-80"
                          style={{
                            top: `${47.5 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                            left: `${47.5 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                          }}
                        ></div>
                      ))}
                    </div>                                    
                  </div>
                  
                  {/* Text Elements */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative text-xs w-96 h-96 animate-spin-slow">
                      <div className="absolute top-10 left-50 transform -translate-x-1/2 -translate-y-full animate-spin-slow-reverse">
                        <div className="text-red-400 font-mono opacity-70 whitespace-nowrap">VERIFY</div>
                      </div>
                      <div className="absolute top-85 left-50 transform -translate-x-1/2 translate-y-0 animate-spin-slow-reverse">
                        <div className="text-cyan-400 font-mono opacity-70 whitespace-nowrap">CLARITY</div>
                      </div>
                      <div className="absolute top-50 left-15 transform -translate-x-full -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-yellow-400 font-mono opacity-70 whitespace-nowrap">CONTEXT</div>
                      </div>
                      <div className="absolute top-50 left-80 transform translate-x-0 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-purple-400 font-mono opacity-70 whitespace-nowrap">INSIGHT</div>
                      </div>                      
                      <div className="absolute top-[20%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-electric-purple font-mono opacity-70 whitespace-nowrap">RAG</div>
                      </div>
                      <div className="absolute top-[20%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-blue-400 font-mono opacity-70 whitespace-nowrap">ANALYSIS</div>
                      </div>
                      <div className="absolute top-[80%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-green-400 font-mono opacity-70 whitespace-nowrap">FACTS</div>
                      </div>
                      <div className="absolute top-[80%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                        <div className="text-white font-mono whitespace-nowrap">TRUTH</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div className="text-center mt-8">
                  <h3 className="text-lg font-semibold text-white mb-2">Advanced Political Intelligence</h3>
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
                  <h3 className="text-lg font-semibold text-white mb-2">Our Solution</h3>
                  <p className="text-dark-silver text-sm leading-relaxed">
                    DebateMatchRAG turns messy political debates into clear, factual answers grounded directly in
                    verified transcripts. A RAG pipeline retrieves the exact debate moments you need and summarizes
                    them with trusted fact-checking support. Every answer is transparent, traceable, and tied to
                    candidates’ actual words, restoring clarity and accountability to political discourse.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">The Impact</h3>
                  <p className="text-dark-silver text-sm leading-relaxed">
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
            Our retrieval-augmented generation pipeline processes your questions through four stages, 
            ensuring every answer traces back to actual debate transcripts with complete source verification.
          </div>
        </div>
        <div className="flex-1 flex items-start justify-center px-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  number: '1', 
                  title: 'User Query', 
                  description: 'User queries are parsed and semantically analyzed to identify key political concepts, candidate names, policy areas, and temporal references, enabling precise retrieval from debate transcripts.',
                  technical: 'Natural language processing extracts entities and intent before database queries are constructed.'
                },
                { 
                  number: '2', 
                  title: 'Semantic Retrieval', 
                  description: 'Our vector database performs semantic search across indexed debate transcripts, retrieving passages with contextual relevance to the query rather than simple keyword matching.',
                  technical: 'Embedding models encode both query and transcript passages into high-dimensional space for similarity matching.'
                },
                { 
                  number: '3', 
                  title: 'Source Verification', 
                  description: 'Retrieved passages are cross-referenced with metadata—timestamps, speaker identification, debate context—ensuring complete provenance and enabling independent verification.',
                  technical: 'Each retrieved segment includes debate name, speaker, timestamp, and surrounding context for validation.'
                },
                { 
                  number: '4', 
                  title: 'Response Generation', 
                  description: 'AI models synthesize answers using only the retrieved transcript passages, maintaining strict grounding in source material. All claims are directly attributed to specific debate moments.',
                  technical: 'Generation is constrained to retrieved context, preventing hallucination while maintaining coherent, informative responses.'
                }
              ].map((item, index) => (
                <div key={index} className="perspective-1000">
                  <div className="relative backdrop-blur-2xl rounded-3xl border-2 border-indigo-400/30 hover:border-indigo-400/80 transition-all duration-700 overflow-hidden group transform-style-3d hover:rotate-y-5 hover:translate-z-10">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
                    {/* Content */}
                    <div className="relative text-left z-10 p-6">
                      <div className="flex items-start gap-6 mb-4">
                        <div className="text-6xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent group-hover:scale-115 transition-transform duration-500">
                          {item.number}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2 relative inline-block">
                            <span className="relative z-10 group-hover:text-transparent transition-all duration-500">
                              {item.title}
                            </span>
                            <span className="absolute inset-0 bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                              {item.title}
                            </span>
                          </h3>
                          <p className="text-white/70 text-left leading-relaxed text-sm mb-4 group-hover:text-white transition-colors duration-500">
                            {item.description}
                          </p>
                          <div className="pl-4 text-center border-l-3 border-electric-purple/30 group-hover:border-electric-purple/80 transition-all duration-500">
                            <p className="text-dark-silver/80 text-xs leading-relaxed italic">
                              {item.technical}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Our Tech Stack Section ==================== */}
      <section 
        id="tech-stack"
        className={`min-h-screen w-full flex flex-col items-center justify-center px-8 text-center relative z-10 transition-all duration-1000 ${
          visibleSections['tech-stack'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Tech Stack</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-20">
            Built with cutting-edge technologies to deliver fast, accurate, and verifiable political analysis
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Rotating Circle Visualization */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex justify-center items-center"
            >
              <div className="relative w-[450px] h-[450px]">
                {/* Central hub */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <span className="text-2xl md:text-1xl font-bold bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">
                      Tech Stack
                    </span>
                </div>

                {/* Orbiting dots */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="relative w-56 h-56 animate-spin-slow">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full opacity"
                        style={{
                          top: `${50 + 45 * Math.sin((i * Math.PI) / 4)}%`,
                          left: `${50 + 45 * Math.cos((i * Math.PI) / 4)}%`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Rotating container for tech items */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full animate-spin-slow">
                  {/* React - Top */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-cyan-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/react.png" 
                        alt="React" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* Flask - Right */}
                  <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-white-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/flask.png" 
                        alt="Flask" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* MongoDB - Bottom */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-green-500/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/mongodb.png" 
                        alt="MongoDB" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* OpenAI - Left */}
                  <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-green-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/openai.png" 
                        alt="OpenAI" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* ChromaDB - Top Right */}
                  <div className="absolute top-[15%] right-[15%] transform translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-sky-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/tailwind.png" 
                        alt="Tailwind" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* Ollama - Bottom Right */}
                  <div className="absolute bottom-[15%] right-[15%] transform translate-x-1/2 translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-yellow-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/python.png" 
                        alt="Python" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* Tailwind - Bottom Left */}
                  <div className="absolute bottom-[15%] left-[15%] transform -translate-x-1/2 translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-orange-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/chroma.png" 
                        alt="ChromaDB" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>

                  {/* Python - Top Left */}
                  <div className="absolute top-[15%] left-[15%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-blue-400/50 hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <img 
                        src="/src/assets/img/ollama.png" 
                        alt="Ollama" 
                        className="w-full h-full object-cover animate-spin-slow-reverse"
                      />
                    </div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/0 rounded-full blur-3xl"></div>
              </div>
            </motion.div>

            {/* Right side - Tech Stack Details */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-left space-y-6"
            >
              {/* Frontend */}
              <div className="group">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  Frontend
                </h3>
                <p className="text-dark-silver text-sm leading-relaxed ml-4">
                  <span className="text-cyan-400 font-semibold">React</span> with <span className="text-sky-400 font-semibold">Tailwind CSS</span> for a responsive, modern interface that makes complex political data accessible and beautiful.
                </p>
              </div>

              {/* Backend */}
              <div className="group">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  Backend
                </h3>
                <p className="text-dark-silver text-sm leading-relaxed ml-4">
                  <span className="text-red-400 font-semibold">Flask</span> API with <span className="text-yellow-400 font-semibold">Python</span> powers our RAG pipeline, handling complex queries with optimized caching and GPU acceleration.
                </p>
              </div>

              {/* Database & Vector Storage */}
              <div className="group">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  Data Layer
                </h3>
                <p className="text-dark-silver text-sm leading-relaxed ml-4">
                  <span className="text-green-500 font-semibold">MongoDB</span> for structured data with <span className="text-orange-400 font-semibold">ChromaDB</span> and <span className="text-orange-400 font-semibold">FAISS</span> for lightning-fast semantic search across debate transcripts.
                </p>
              </div>

              {/* AI & ML */}
              <div className="group">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  AI Engine
                </h3>
                <p className="text-dark-silver text-sm leading-relaxed ml-4">
                  <span className="text-purple-400 font-semibold">OpenAI API</span> and <span className="text-purple-400 font-semibold">Ollama</span>  integration for intelligent analysis, topic classification, and fact-checking while maintaining transparency and verifiability.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* ==================== Why We Stand Out Section ==================== */}
      <section
        id="our-vision"
        className={`min-h-screen w-full flex flex-col relative z-10 transition-all duration-1000 ${
          visibleSections['our-vision'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full pt-30">
          {/* Title */}
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Why We&nbsp;
            <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">Stand Out</span>
          </h2>
          {/* Description */}
          <div className="text-md md:text-md text-dark-silver max-w-6xl mx-auto mb-16">
            Moving beyond traditional AI limitations through architectural innovation: from statistical synthesis to
            precise retrieval, from approximation to verification, building verifiable political intelligence.
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center px-8 pb-20">
          <div className="max-w-6xl mx-auto w-full relative">
            <div className="space-y-12">
              {[
                {
                  title: "Zero Hallucination Architecture",
                  limitation: "Generic AI mixes facts with fabricated claims",
                  limitationDetail: "Statistical models confidently generate quotes that were never spoken and cannot track contradictions across debates",
                  capability: "Retrieval-constrained system eliminates fabrication",
                  capabilityDetail: "Our system architecturally cannot generate content beyond retrieved transcripts, every answer retrieves exact quotes with complete citations, making fabrication structurally impossible",
                },
                {
                  title: "Truth You Can Verify Yourself",
                  limitation: "AI-generated content appears authoritative with no verification",
                  limitationDetail: "Sophisticated disinformation spreads unchecked because AI output mimics authentic reporting with no way to confirm accuracy",
                  capability: "Transparent verification empowers universal fact-checking",
                  capabilityDetail: "Every answer links to fact-checking reports and primary sources—journalists, fact-checkers, and voters can verify any claim themselves with complete confidence",
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 50
                  }}
                  viewport={{ once: true, margin: "-300px" }}
                  className="group relative"
                >

                  {/* Arrow Line */}
                  {index >= 1 && (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full flex flex-col items-center z-10 w-full">
                      <div className="w-px h-12 bg-gradient-to-b from-indigo-400/40 via-indigo-400/20 to-indigo-400/40"></div>
                      <div className="absolute top-1/2 -translate-y-1/2 text-indigo-400/60 bg-gray-900/80 rounded-full p-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14m0 0l-7-7m7 7l7-7"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  <div className="relative">
                    <div className={`relative backdrop-blur-2xl rounded-3xl border-2 border-indigo-400/30 hover:border-indigo-400/80 transition-all duration-700 overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-700`}></div>
                      <div className="relative z-10 p-8">
                        {/* Header */}
                        <div className="flex items-start gap-8 mb-4">
                          <div className="flex-1 text-left">
                            <h3 className="text-2xl font-bold text-white mb-2 relative inline-block">
                              <span className="relative z-10 group-hover:text-transparent transition-all duration-500">
                                {item.title}
                              </span>
                              <span className="absolute inset-0 bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                                {item.title}
                              </span>
                            </h3>
                            <div className="h-0.5 w-10 bg-gradient-to-r from-indigo-500 to-electric-purple group-hover:w-full transition-all duration-700 mb-3"></div>
                          </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Limitation */}
                          <div className="relative group/limit">                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                                  <span className="text-red-400 text-xs font-bold">✕</span>
                                </div>
                                <span className="text-red-400 text-sm font-bold tracking-wider">Limitation</span>
                              </div>
                              
                              <h4 className="text-lg font-semibold text-white/90">
                                {item.limitation}
                              </h4>
                              
                              <div className="pl-4 border-l-2 border-red-500">
                                <p className="text-dark-silver/80 text-sm leading-relaxed italic">
                                  {item.limitationDetail}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Capability */}
                          <div className="relative group/cap">                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center border border-green-400/50">
                                  <span className="text-green-400 text-xs font-bold">✓</span>
                                </div>
                                <span className="text-green-400 text-sm font-bold tracking-wider">Capability</span>
                              </div>
                              
                              <h4 className="text-lg font-semibold text-white">
                                {item.capability}
                              </h4>
                              
                              <div className="pl-4 border-l-2 border-green-400">
                                <p className="text-white/80 text-sm leading-relaxed italic">
                                  {item.capabilityDetail}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
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
            Six foundational principles that define our mission and guide every decision in building transparent, verifiable
            political analysis tools. These values ensure our architecture democracy through factual accuracy and complete accountability.
          </p>
        </div>
        <div className="flex-1 flex justify-center px-8 pb-20">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { number: '1', title: 'Factual Accuracy', description: 'Grounding responses in actual debate transcripts and verified sources' },
                { number: '2', title: 'Citation Integrity', description: 'Making political discourse more accessible and understandable for all' },
                { number: '3', title: 'Accountability', description: 'Tracking candidate statements against factual records and past positions' },
                { number: '4', title: 'Zero Hallucination', description: 'Providing verified context against misleading claims and rhetoric' },
                { number: '5', title: 'Primary Source Access', description: 'Making political analysis accessible to all voters regardless of background' },
                { number: '6', title: 'Source Verification', description: 'Helping citizens make informed decisions based on verified information' }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  className="group relative perspective-1000"
                >
                  <div className="relative backdrop-blur-2xl rounded-2xl border-2 border-indigo-400/30 hover:border-indigo-400/80 transition-all duration-700 overflow-hidden transform-style-3d hover:scale-105">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    {/* Border */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 via-violet-400/20 to-indigo-500/20 blur-xl"></div>
                    </div>

                    <div className="relative z-10 p-6">
                      {/* Number */}
                      <div className="relative mb-4 flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-indigo-400/30 group-hover:border-indigo-400/60 transition-all duration-500 group-hover:scale-110">
                          <span className="text-3xl text-white/80 group-hover:text-white transition-colors duration-500">{item.number}</span>
                          
                          {/* Glow effect */}
                          <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-md opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-3 relative inline-block">
                        <span className="relative z-10 group-hover:text-transparent transition-all duration-500">
                          {item.title}
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                          {item.title}
                        </span>
                      </h3>

                      {/* Divider line */}
                      <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent mb-3 group-hover:w-24 transition-all duration-500"></div>
                      
                      {/* Description */}
                      <p className="text-dark-silver text-sm leading-relaxed group-hover:text-white/90 transition-colors duration-500">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/0 to-transparent group-hover:via-indigo-400/60 transition-all duration-700"></div>
                  </div>
                </motion.div>
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
            Three communities we serve with verified political intelligence: voters seeking truth, professionals
            requiring primary source evidence, and educators teaching critical analysis of political discourse.
          </p>
        </div>
        <div className="flex-1 flex justify-center px-8 pb-20">
          <div className="max-w-6xl mx-auto text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: 'Voters & Citizens',
                  gradient: 'from-blue-500 to-cyan-500',
                  description: 'Get verifiable answers about what candidates actually said, with direct quotes and timestamps you can check—no more AI guesswork or hallucinations.',
                  features: ['Direct transcript access', 'Timestamp verification', 'Zero AI hallucination']
                },
                { 
                  title: 'Journalists & Researchers',
                  gradient: 'from-violet-500 to-purple-500',
                  description: 'Quickly verify political claims with primary source evidence from debates. Cite exact moments instead of relying on AI summaries that may be inaccurate.',
                  features: ['Primary source citations', 'Fact-checking tools', 'Complete attribution chain']
                },
                { 
                  title: 'Educators & Students',
                  gradient: 'from-indigo-500 to-blue-500',
                  description: 'Teach critical thinking using actual debate transcripts. Show students how to distinguish between AI-generated summaries and verifiable primary sources.',
                  features: ['Original transcripts', 'Critical analysis', 'Media literacy']
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ y: 60, opacity: 0, scale: 0.9 }}
                  whileInView={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.7, 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 80
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="relative backdrop-blur-2xl rounded-3xl border-2 border-indigo-400/30 hover:border-indigo-400/80 transition-all duration-700 overflow-hidden h-full">
                    {/* Animated background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`}></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br ${item.gradient} blur-3xl opacity-20`}></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8 h-full flex flex-col">
                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white mb-4 relative inline-block mx-auto">
                        <span className="relative z-10 group-hover:text-transparent transition-all duration-500">
                          {item.title}
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                          {item.title}
                        </span>
                      </h3>

                      {/* Divider line */}
                      <div className={`h-px w-16 mx-auto bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent mb-4 group-hover:w-32 transition-all duration-500`}></div>
                      
                      {/* Description */}
                      <p className="text-dark-silver text-sm leading-relaxed mb-6 group-hover:text-white/90 transition-colors duration-500 flex-grow">
                        {item.description}
                      </p>

                      {/* Feature list */}
                      <div className="space-y-2 mt-auto">
                        {item.features.map((feature, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-2 text-left"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${item.gradient} group-hover:scale-150 transition-transform duration-300`}></div>
                            <span className="text-xs text-dark-silver/80 group-hover:text-white/70 transition-colors duration-500">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/0 to-transparent group-hover:via-indigo-400/60 transition-all duration-700`}></div>
                    
                    {/* Corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl ${item.gradient} opacity-10 rounded-bl-3xl`}></div>
                    </div>
                  </div>
                </motion.div>
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

        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
          transition: all 0.5s ease;
        }

        .hover\:rotate-y-5:hover {
          transform: rotateY(5deg);
        }

        .hover\:translate-z-10:hover {
          transform: translateZ(10px);
        }

        .group {
          transform-style: preserve-3d;
        }
      `} </style>
    </div>
  )
}

export default Missions