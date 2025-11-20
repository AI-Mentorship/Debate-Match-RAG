import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import debateTranscripts from "../../../debates_metadata.json"

function Transcripts({ onGetStarted, selectedTranscript, setSelectedTranscript }) {
  /* ==================== Page ==================== */
  const [stars, setStars] = useState([])
  const [currentSection, setCurrentSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
  const [hoveredCard, setHoveredCard] = useState(null)
  const isScrolling = useRef(false)
  const transcriptRefs = useRef({})
  const navigate = useNavigate()
  
  /* ==================== Transcripts ==================== */
  const [transcripts, setTranscripts] = useState([])
  const [filteredTranscripts, setFilteredTranscripts] = useState([])
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('date-desc')
  const [filterTypes, setFilterTypes] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  /* ==================== Data from JSON ==================== */
  useEffect(() => {
    if (debateTranscripts && debateTranscripts.length > 0) {
      // Group transcripts by debate_name
      const transcriptsBySource = debateTranscripts.reduce((acc, item) => {
        if (!acc[item.debate_name]) {
          acc[item.debate_name] = [];
        }
        acc[item.debate_name].push(item);
        return acc;
      }, {});

      // Transcript objects for each debate_name
      const transcriptObjects = Object.entries(transcriptsBySource).map(([debate_name, items], index) => {
        const processSpeakerName = (speaker) => {
          if (!speaker) return '';
          
          return speaker
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        
        // Unique speakers
        const uniqueSpeakers = [...new Set(items.map(item => processSpeakerName(item.speaker)))].filter(Boolean);
        
        // Unique topics
        const allTopics = items.flatMap(item => item.topics || []);
        const uniqueTopics = [...new Set(allTopics)];

        // Get date from the first item
        const date = items[0].debate_date || `${new Date().getFullYear()}-01-01`;

        // Calculate total duration and speaker count
        const totalSections = items.length;
        const speakerCount = uniqueSpeakers.length;

        return {
          id: index + 1,
          title: debate_name,
          date: date,
          participants: uniqueSpeakers,
          speakerCount: speakerCount,
          totalSections: totalSections,
          sections: items.map((item, sectionIndex) => ({
            id: `s${sectionIndex + 1}`,
            title: `${processSpeakerName(item.speaker)} - ${item.timestamp.replace(/^00:(\d{2}:\d{2})/, '$1')}`,
            startTime: item.timestamp.replace(/^00:(\d{2}:\d{2})/, '$1'),
            content: item.text,
            speaker: processSpeakerName(item.speaker),
            topics: item.topics || []
          })),
          tags: uniqueTopics.slice(0, 10)
        };
      });

      setTranscripts(transcriptObjects);
      setFilteredTranscripts(transcriptObjects);
      setIsLoading(false);
    } else {
      console.error('No transcript data found');
      setIsLoading(false);
    }
  }, []);

  // Filter by speaker
  const filteredSections = selectedTranscript ? 
    selectedSpeaker ? 
      selectedTranscript.sections.filter(section => section.speaker === selectedSpeaker)
      : selectedTranscript.sections
    : [];

  /* ==================== Search and filter ==================== */
  useEffect(() => {
    let filtered = [...transcripts]

    // Search filter
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(transcript => 
      transcript.title.toLowerCase().includes(query) ||
      transcript.date.toLowerCase().includes(query) ||
      transcript.participants.some(p => p.toLowerCase().includes(query))
    )
  }

    // Type filter
    if (filterTypes.length > 0) {
      filtered = filtered.filter(transcript => {
        const title = transcript.title.toLowerCase()
        return filterTypes.some(filterType => {
          if (filterType === 'presidential') return title.includes('presidential') && !title.includes('vice')
          if (filterType === 'vice-presidential') return title.includes('vice')
          if (filterType === 'republican') return title.includes('republican') || title.includes('gop')
          if (filterType === 'democratic') return title.includes('democratic') || title.includes('democrat')
          return false
        })
      })
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date)
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date)
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title)
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title)
      return 0
    })

    setFilteredTranscripts(filtered)
  }, [searchQuery, transcripts, sortBy, filterTypes])

  // Toggle filter type
    const toggleFilterType = (type) => {
      setFilterTypes(prev => 
        prev.includes(type) 
          ? prev.filter(t => t !== type)
          : [...prev, type]
      )
    }

  // Highlight text
  const highlightText = (text, highlight) => {
    if (!highlight) return text
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">{part}</mark> : 
        part
    )
  }

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
        }, 700);
        
        smoothScrollTo(section, 1200);
      }
    } else {
      // If at last section, scroll back to top smoothly
      setCurrentSection(0);
      smoothScrollToTop(1200);
    }
  };

  /* ==================== Update current section based on scroll position ==================== */
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
      
      {/* ==================== Transcript Modal ==================== */}
      <AnimatePresence>
        {selectedTranscript && (
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
              onClick={() => setSelectedTranscript(null)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative bg-gradient-to-br from-[#1a1029] to-[#0B0219] rounded-2xl border border-white/20 shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex-shrink-0 p-8 border-b border-white/20">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white mb-2 text-left">
                        {selectedTranscript.title}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-dark-silver text-sm mb-4 text-left">
                        <span>Date: {selectedTranscript.date}</span>
                        <span>•</span>
                        <span>{selectedTranscript.speakerCount} Speakers</span>
                        <span>•</span>
                        <span>{selectedTranscript.totalSections} Sections</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-left">
                        {selectedTranscript.tags.slice(0, 8).map(tag => (
                          <span key={tag} className="px-3 py-1 bg-electric-purple/50 text-white rounded-full text-sm">
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setSelectedTranscript(null)
                        setSelectedSpeaker(null)
                      }}
                      className="text-white/70 hover:text-white transition-colors duration-200 cursor-pointer ml-4"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Speakers Navigation */}
                  <div className="mt-6 text-left">
                    <h3 className="text-md font-semibold mb-3 text-left text-white">Speakers</h3>
                    <div className="flex flex-wrap gap-2 text-left">
                      {selectedTranscript.participants.map(speaker => (
                        <button
                          key={speaker}
                          onClick={() => setSelectedSpeaker(selectedSpeaker === speaker ? null : speaker)}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all duration-300 text-left ${
                            selectedSpeaker === speaker
                              ? 'bg-electric-purple/50 text-white border-electric-purple/50'
                              : 'bg-white/10 text-dark-silver border-white/20 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {speaker}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transcript Content */}
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="space-y-6 max-w-6xl mx-auto">
                    {filteredSections.map(section => (
                      <div
                        key={section.id}
                        ref={el => transcriptRefs.current[section.id] = el}
                        className="p-6 rounded-2xl border transition-all duration-300 text-left bg-white/5 border-white/10 hover:border-white/20"
                      >
                        <div className="flex justify-between items-start mb-3 text-left">
                          <h4 className="font-semibold text-white text-left">{section.speaker}</h4>
                          {section.startTime !== "N/A" && (
                            <span className="text-dark-silver text-sm bg-white/10 px-2 py-1 rounded">
                              {section.startTime}
                            </span>
                          )}
                        </div>
                        <p className="text-dark-silver leading-relaxed text-left whitespace-pre-line text-sm">
                          {searchQuery ? highlightText(section.content, searchQuery) : section.content}
                        </p>
                        {section.topics && section.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 text-left">
                            {section.topics.map(topic => (
                              <span key={topic} className="px-3 py-1 bg-white/10 rounded-full text-sm text-dark-silver">
                                {topic.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Scroll Indicator ==================== */}
      {!selectedTranscript && (
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
          <div className="mb-10 text-md md:text-md text-dark-silver max-w-4xl mx-auto leading-relaxed">
            Search through our comprehensive collection of debate transcripts. Find specific arguments, 
            track speaker positions, and uncover valuable insights with our advanced browsing tools.
          </div>
        </motion.div>
      </section>

      {/* ==================== Browse Collection Section ==================== */}
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
          <div className="text-md md:text-md text-dark-silver max-w-4xl mx-auto mb-12">
            Explore our curated collection of debate transcripts. Each transcript is carefully processed 
            for optimal search and analysis with topic categorization and speaker tracking.
          </div>
        </div>
        
        <div className="flex-1 w-full">
          <div className="min-h-175 text-white w-full">
            <div className="container mx-auto px-8">
              <div className="mb-7 justify-center mx-auto">
                <div className="flex gap-4 items-center">
                  {/* Transcript Count */}
                  <div className="px-6 py-3 bg-[#251f2e] backdrop-blur-lg border border-white/20 rounded-2xl text-white transition-all duration-300 whitespace-nowrap">
                    <span className="font-medium">
                      ({filteredTranscripts.length}) {filteredTranscripts.length === 1 ? 'Transcript' : 'Transcripts'}
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search transcripts by title, date, or participant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-3 bg-[#251f2e] backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-dark-silver focus:outline-none focus:border-electric-purple focus:bg-white/5 focus:ring-2 focus:ring-electric-purple/20 border-white/20 hover:border-electric-purple hover:bg-white/5 transition-all duration-300"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-silver">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-6 py-3 bg-[#251f2e] backdrop-blur-lg border rounded-2xl text-white transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        showFilters || filterTypes.length > 0
                          ? 'border-electric-purple bg-electric-purple/10'
                          : 'border-white/20 hover:border-electric-purple hover:bg-white/5'
                      }`}
                    >
                      <span>Filter</span>
                      {filterTypes.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-electric-purple rounded-full text-xs font-bold">
                          {filterTypes.length}
                        </span>
                      )}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showFilters && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowFilters(false)}
                        />
                        
                        {/* Dropdown Panel */}
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-3 w-80 bg-gradient-to-br from-[#1a1029] to-[#0B0219] backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          {/* Header */}
                          <div className="p-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-bold text-base flex items-center gap-2">
                                <svg className="w-5 h-5 text-electric-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                Filters & Sorting
                              </h3>
                              {filterTypes.length > 0 && (
                                <button
                                  onClick={() => setFilterTypes([])}
                                  className="text-xs text-electric-purple hover:text-white transition-colors duration-200"
                                >
                                  Clear All
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Sort By Section */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-electric-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                <h4 className="text-white font-semibold text-sm text-left">Sort By</h4>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { value: 'date-desc', label: 'Newest First', icon: '↓' },
                                  { value: 'date-asc', label: 'Oldest First', icon: '↑' },
                                  { value: 'title-asc', label: 'Title (A-Z)', icon: 'A' },
                                  { value: 'title-desc', label: 'Title (Z-A)', icon: 'Z' },
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    onClick={() => setSortBy(option.value)}
                                    className={`w-full px-4 py-1 rounded-xl text-sm text-left flex items-center justify-between group ${
                                      sortBy === option.value
                                        ? 'bg-gradient-to-r from-electric-purple/30 to-electric-purple/20 text-white border border-electric-purple/50 shadow-lg shadow-electric-purple/20'
                                        : 'bg-white/5 text-dark-silver border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                                    }`}
                                  >
                                    <span>{option.label}</span>
                                    <span className={`text-lg transition-transform ${
                                      sortBy === option.value ? 'scale-110' : 'group-hover:scale-110'
                                    }`}>
                                      {option.icon}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Filter By Type Section */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-electric-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h4 className="text-white font-semibold text-sm text-left">Filter By Type</h4>
                                <span className="text-xs text-dark-silver ml-auto">(Multi-select)</span>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { value: 'presidential', label: 'Presidential' },
                                  { value: 'vice-presidential', label: 'Vice Presidential' },
                                  { value: 'republican', label: 'Republican' },
                                  { value: 'democratic', label: 'Democratic' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    onClick={() => toggleFilterType(option.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm text-left flex items-center justify-between group ${
                                      filterTypes.includes(option.value)
                                        ? `bg-gradient-to-r from-electric-purple/30 to-electric-purple/20 text-white border border-electric-purple/50 shadow-lg shadow-electric-purple/20`
                                        : 'bg-white/5 text-dark-silver border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{option.label}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                                      filterTypes.includes(option.value)
                                        ? `border-purple-500/50 bg-white/20`
                                        : 'border-white/30 group-hover:border-white/50'
                                    }`}>
                                      {filterTypes.includes(option.value) && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="p-4 border-t border-white/10 bg-white/5">
                            <div className="text-xs text-dark-silver text-center">
                              {filteredTranscripts.length} {filteredTranscripts.length === 1 ? 'debate' : 'debates'} found
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Transcripts Grid */}
              <div className="w-full">
                <div className="max-w-7xl mx-auto">
                  <div className="pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
                    {filteredTranscripts.map((transcript, index) => (
                      <motion.div
                        key={transcript.id}
                        className={`relative bg-[#251f2e] backdrop-blur-lg rounded-xl border transition-all duration-500 group min-h-65 flex flex-col ${
                          hoveredCard === transcript.id 
                            ? 'border-white/40 shadow-2xl shadow-electric-purple/20 translate-y-[-8px]' 
                            : 'border-white/10 shadow-lg hover:border-white/30'
                        } bg-gradient-to-br from-[#2B2139]/30 to-[#0B0219]/30`}
                        onMouseEnter={() => setHoveredCard(transcript.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Main Content */}
                        <div className="flex-1 p-6">
                          {/* Title and Date */}
                          <div className="text-center mb-3 pt-2 relative z-10 transform transition-all duration-500 group-hover:-translate-y-1">
                            <h3 className="text-md font-bold text-white mb-2 group-hover:text-[#F786C7] transition-colors duration-500 line-clamp-3">
                              {transcript.title}
                            </h3>
                            <p className="text-dark-silver text-sm">
                              {transcript.date}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="text-center mb-4 relative z-10 transform transition-all duration-500 delay-100 group-hover:-translate-y-1">
                            <div className="flex justify-center space-x-4 text-xs text-dark-silver">
                              <span>{transcript.speakerCount} speakers</span>
                              <span>•</span>
                              <span>{transcript.totalSections} sections</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="text-center relative z-10 transform transition-all duration-500 delay-150 group-hover:-translate-y-1">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {transcript.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white/10 rounded text-xs text-dark-silver">
                                  {tag.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {transcript.tags.length > 3 && (
                                <span className="px-2 py-1 bg-white/10 rounded text-xs text-dark-silver">
                                  +{transcript.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto h-12 flex-shrink-0 flex border-t border-white/20">
                          {/* View Button */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedTranscript(transcript);
                            }}
                            className="flex-1 bg-gradient-to-r from-transparent to-transparent hover:from-[#F786C7]/10 hover:to-[#FFCAE4]/10 text-white text-sm font-semibold hover:border-[#F786C7]/50 transition-all duration-300 rounded-bl-xl cursor-pointer flex items-center justify-center group/btn border-r border-white/10"
                          >
                            <span className="group-hover/btn:tracking-wider transition-all duration-300 inline-block">
                              View
                            </span>
                          </button>
                          
                          {/* Analyze Button */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              sessionStorage.setItem('selectedTranscript', JSON.stringify(transcript));
                              navigate('/analyzer');
                            }}
                            className="flex-1 bg-gradient-to-r from-transparent to-transparent hover:from-[#F786C7]/10 hover:to-[#FFCAE4]/10 text-white text-sm font-semibold hover:border-[#F786C7]/50 transition-all duration-300 rounded-br-xl cursor-pointer flex items-center justify-center group/btn border-r border-white/10"
                          >
                            <span className="group-hover/btn:tracking-wider transition-all duration-300 inline-block">
                              Analyze
                            </span>
                          </button>
                        </div>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F786C7]/0 to-[#FFCAE4]/0 group-hover:from-[#F786C7]/5 group-hover:to-[#FFCAE4]/5 transition-all duration-500 pointer-events-none"></div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                  {/* Empty State */}
                  {filteredTranscripts.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <svg className="w-24 h-24 mx-auto mb-6 text-dark-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-2xl font-bold text-white mb-4">No transcripts found</h3>
                      <p className="text-dark-silver text-lg max-w-md mx-auto">
                        Try adjusting your search terms or browse all available transcripts.
                      </p>
                    </motion.div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Shooting star animation ==================== */}
      <style> {`
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `} </style>
    </div>
  )
}

export default Transcripts