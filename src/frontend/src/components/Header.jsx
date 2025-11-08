function Header({ currentPage, onPageChange, onGetStarted, className = '' }) {
  return (
    <nav className="px-20 py-8 flex items-center justify-between">
      {/* Logo - Left Side */}
      <div className="flex items-center space-x-3 flex-1">
        <button
          onClick={() => onPageChange('home')}
          className="text-xl font-bold hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
          <span className="text-white">.RAG</span>
        </button>
      </div>

      {/* Navigation Links - Right Side */}
      <div className="flex-1 flex justify-end">
        <div className="hidden md:flex items-center space-x-10">
          {['Home', 'Mission', 'Team'].map((item) => {
            const isActive = currentPage === item.toLowerCase()
            return (
              <button
                key={item}
                className={`${isActive
                  ? 'text-white'
                  : 'text-dark-silver'
                  } hover:text-white transition-colors duration-200 font-medium text-base relative group px-1 py-2 cursor-pointer`}
                onClick={() => onPageChange(item.toLowerCase())}
              >
                {item}

                {/* Underline effect */}
                <span className={`absolute bottom-0 left-1/2 h-0.5 bg-white transition-all duration-300 transform -translate-x-1/2 ${
                  currentPage === item.toLowerCase() 
                    ? 'w-full' 
                    : 'w-0 group-hover:w-full'
                }`}></span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Header