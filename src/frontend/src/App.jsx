import { useState } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import About from './pages/About'
import Team from './pages/Team'
import Contact from './pages/Contact'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleGetStarted = () => {
    console.log('Get Started clicked')
    alert('Wassup Gangs :D')
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <Home onGetStarted={handleGetStarted} />
      case 'about':
        return <About />
      case 'team':
        return <Team />
      case 'contact':
        return <Contact />
      default:
        return <Home onGetStarted={handleGetStarted} />
    }
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
        <Header 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
          onGetStarted={handleGetStarted}
        />
        {renderPage()}
      </div>

      {/* Custom glow and neon effects */}
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