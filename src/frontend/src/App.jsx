import { useState } from 'react'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleGetStarted = () => {
    console.log('Get Started clicked')
    alert('Wassup Gangs :D')
  }

  return (
    <div className="min-h-screen font-noto-sans overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("/src/assets/img/background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="px-8 py-6 flex items-center justify-between">
          {/* Logo - Top Left */}
          <div className="flex items-center space-x-3 flex-1">
            <h1 className="text-xl font-bold">
              <span className="text-electric-purple">DebateMatch</span>
              <span className="text-white">.RAG</span>
            </h1>
          </div>

          {/* Navigation Links*/}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="bg-white/10 backdrop-blur-md rounded-full px-8 py-3 border border-white/20">
              <div className="flex items-center space-x-10">
                {['Home', 'About Us', 'Team', 'Contact'].map((item) => (
                  <button
                    key={item}
                    className="text-light-silver hover:text-white transition-colors duration-200 font-medium text-base"
                    onClick={() => setCurrentPage(item.toLowerCase())}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Get Started Button - Top Right */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleGetStarted}
              className="bg-transparent border-2 border-electric-purple text-white px-4 py-1 rounded-full font-semibold hover:bg-electric-purple/20 hover:border-lavender hover:shadow-glow transition-all duration-300 shadow-lg text-sm relative overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              Get Started
            </button>
          </div>
        </nav>

        {/* Main Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* Name */}
          <div className="mb-10">
            <h1 className="text-6xl md:text-6xl font-bold text-white mb-10 leading-tight">
              D&nbsp;&nbsp;E&nbsp;&nbsp;B&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;E&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;C&nbsp;&nbsp;H
            </h1>
            <h2 className="text-3xl md:text-3xl font-bold bg-gradient-to-r from-electric-purple via-lavender to-soft-lavender bg-clip-text text-transparent mb-5 leading-tight">
              Retrieval-Augmented Generation
            </h2>
          </div>

          {/* Description and Button */}
          <div className="mb-40">
            <p className="mb-15 text-md md:text-md text-dark-silver max-w-5xl leading-relaxed">
              An AI-powered debate matcher that allows users to ask political questions and receive factually grounded answers based on political debate transcripts
            </p>

            {/* Get Stated Button */}
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500 text-gray-200 px-20 py-3 rounded-full font-bold hover:from-gray-300 hover:via-gray-200 hover:to-gray-400 transition-all duration-700 shadow-2xl hover:shadow-silver-glow relative overflow-hidden group border-2 border-gray-300 hover:border-white"
            >
              {/* Silver neon glow effect - slower appearance */}
              <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/30 blur-xl transition-all duration-1000"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              
              {/* Pulse ring effect - slower */}
              <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/70 transition-all duration-1000"></div>
              
              {/* Text - no shadow, no size change */}
              <span className="relative z-10 text-gray-800 group-hover:text-gray-900 transition-colors duration-300 font-bold">
                Get Started
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hide scrollbar */}
      <style jsx global>{`
        body {
          overflow: hidden;
        }

        ::-webkit-scrollbar {
          display: none;
        }

        -ms-overflow-style: none;
        scrollbar-width: none;

        .shadow-glow {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3);
        }
        
        .hover\\:shadow-glow:hover {
          box-shadow: 
            0 0 30px rgba(124, 58, 237, 0.7),
            0 0 60px rgba(124, 58, 237, 0.4),
            0 0 90px rgba(124, 58, 237, 0.2),
            inset 0 0 20px rgba(124, 58, 237, 0.1);
        }
        
        .hover\\:shadow-silver-glow {
          transition: box-shadow 2s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default App