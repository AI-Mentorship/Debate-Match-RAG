function Header({ currentPage, onPageChange }) {
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
        <div className="hidden md:flex items-center space-x-10">
          {['Home', 'Mission', 'Contribution'].map((item) => {
            const isActive = currentPage === item.toLowerCase()
            return (
              <button
                key={item}
                className={`${isActive
                  ? 'text-white'
                  : 'text-dark-silver'
                  } hover:text-white transition-colors duration-200 font-medium text-base relative group px-1 py-2`}
                onClick={() => onPageChange(item.toLowerCase())}
              >
                {item}

                {/* Underline effect */}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ${currentPage === item.toLowerCase() ? 'w-full' : 'w-0 group-hover:w-full'
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