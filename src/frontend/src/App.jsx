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

          {/* Navigation Links - Truly Centered */}
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
            
          </div>
        </nav>
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
      `}</style>
    </div>
  )
}

export default App