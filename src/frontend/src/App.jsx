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