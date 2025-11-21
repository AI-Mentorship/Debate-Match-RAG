import { Link, useLocation } from 'react-router-dom'

function Header({ onGetStarted, isModalOpen, className = '' }) {
  const location = useLocation()
  
  const handlePageChange = (page) => {
    if (isModalOpen) return;
  };

  return (
    <nav className={`bg-[#010102] px-20 py-8 flex items-center justify-between transition-all duration-300 ${
      isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* ==================== Logo ==================== */}
      <div className="flex items-center space-x-3 flex-1">
        <Link
          to="/"
          className="text-xl font-bold hover:opacity-80 transition-opacity cursor-none"
          style={{ cursor: 'none' }}
        >
          <span className="bg-gradient-to-b from-white to-electric-purple bg-clip-text text-transparent">DebateMatch</span>
          <span className="text-white">.RAG</span>
        </Link>
      </div>

      {/* ==================== Navigation Links ==================== */}
      <div className="flex-1 flex justify-end">
        <div className="hidden md:flex items-center space-x-10">
          {[
            { path: '/', label: 'Home' },
            { path: '/analyzer', label: 'Analyzer' },
            { path: '/transcripts', label: 'Transcripts' },
            { path: '/missions', label: 'Missions' },
            { path: '/team', label: 'Team' }
          ].map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/home')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${isActive
                  ? 'text-white'
                  : 'text-dark-silver'
                  } hover:text-white transition-colors duration-200 font-medium text-base relative group px-1 py-2 cursor-none`}
                style={{ cursor: 'none' }}
              >
                {item.label}

                {/* Underline effect */}
                <span className={`absolute bottom-0 left-1/2 h-0.5 bg-white transition-all duration-300 transform -translate-x-1/2 ${
                  isActive 
                    ? 'w-full' 
                    : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Header