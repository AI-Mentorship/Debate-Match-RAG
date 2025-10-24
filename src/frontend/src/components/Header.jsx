function Header({ currentPage, onPageChange, onGetStarted }) {
  return (
    <nav className="px-8 py-6 flex items-center justify-between">
      {/* Logo - Top Left */}
      <div className="flex items-center space-x-3 flex-1">
        <button
          onClick={() => onPageChange('home')}
          className="text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <span className="text-electric-purple">DebateMatch</span>
          <span className="text-white">.RAG</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex flex-1 justify-center">
        {/* <div className="bg-white/10 backdrop-blur-md rounded-full px-8 py-3 border border-white/20"> */}
          <div className="flex items-center space-x-10">
            {['Home', 'About', 'Team', 'Contact'].map((item) => (
              <button
                key={item}
                className={`${currentPage === item.toLowerCase()
                    ? 'text-white'
                    : 'text-dark-silver'
                  } hover:text-white transition-colors duration-200 font-medium text-base relative group`}
                onClick={() => onPageChange(item.toLowerCase())}
              >
                {item}
                {/* Underline effect */}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ${currentPage === item.toLowerCase() ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </button>
            ))}
          </div>
        {/* </div> */}
      </div>

      {/* Get Started Button - Top Right */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onGetStarted}
          className="bg-transparent border-2 border-electric-purple text-white px-4 py-1 rounded-full font-semibold hover:bg-electric-purple/20 hover:border-lavender hover:shadow-glow transition-all duration-300 shadow-lg text-sm relative overflow-hidden group"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          Get Started
        </button>
      </div>
    </nav>
  )
}

export default Header