function Header({ currentPage, onPageChange, onGetStarted }) {
  return (
    <nav className="px-8 py-6 flex items-center justify-between">
      {/* Logo - Left Side */}
      <div className="flex items-center space-x-3 flex-1">
        <button
          onClick={() => onPageChange('home')}
          className="text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <span className="text-electric-purple">DebateMatch</span>
          <span className="text-white">.RAG</span>
        </button>
      </div>

      {/* Navigation Links - Right Side */}
      <div className="flex-1 flex justify-end">
        <div className="hidden md:flex items-center space-x-5">
          {['Home', 'Mission', 'Contribution', 'Contact'].map((item) => {
            const isActive = currentPage === item.toLowerCase()
            return (
              <button
                key={item}
                className={`${isActive
                  ? 'text-white'
                  : 'text-dark-silver'
                  } hover:text-white transition-colors duration-200 font-medium text-base relative group px-6 py-2`}
                onClick={() => onPageChange(item.toLowerCase())}
              >
                {item}

                {/* Corner Arrow Animation */}
                <span className="absolute inset-0">
                  {/* Top Left Corner */}
                  <span className={`absolute top-0 left-0 h-0.5 bg-white transition-all duration-300 ${isActive ? 'w-3 opacity-100' : 'w-0 opacity-0 group-hover:opacity-100 group-hover:w-3'
                    }`}></span>
                  <span className={`absolute top-0 left-0 w-0.5 bg-white transition-all duration-300 ${isActive ? 'h-3 opacity-100' : 'h-0 opacity-0 group-hover:opacity-100 group-hover:h-3'
                    }`}></span>

                  {/* Top Right Corner */}
                  <span className={`absolute top-0 right-0 h-0.5 bg-white transition-all duration-300 delay-100 ${isActive ? 'w-3 opacity-100' : 'w-0 opacity-0 group-hover:opacity-100 group-hover:w-3'
                    }`}></span>
                  <span className={`absolute top-0 right-0 w-0.5 bg-white transition-all duration-300 delay-100 ${isActive ? 'h-3 opacity-100' : 'h-0 opacity-0 group-hover:opacity-100 group-hover:h-3'
                    }`}></span>

                  {/* Bottom Left Corner */}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 delay-200 ${isActive ? 'w-3 opacity-100' : 'w-0 opacity-0 group-hover:opacity-100 group-hover:w-3'
                    }`}></span>
                  <span className={`absolute bottom-0 left-0 w-0.5 bg-white transition-all duration-300 delay-200 ${isActive ? 'h-3 opacity-100' : 'h-0 opacity-0 group-hover:opacity-100 group-hover:h-3'
                    }`}></span>

                  {/* Bottom Right Corner */}
                  <span className={`absolute bottom-0 right-0 h-0.5 bg-white transition-all duration-300 delay-300 ${isActive ? 'w-3 opacity-100' : 'w-0 opacity-0 group-hover:opacity-100 group-hover:w-3'
                    }`}></span>
                  <span className={`absolute bottom-0 right-0 w-0.5 bg-white transition-all duration-300 delay-300 ${isActive ? 'h-3 opacity-100' : 'h-0 opacity-0 group-hover:opacity-100 group-hover:h-3'
                    }`}></span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Header