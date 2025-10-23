import { useState } from 'react'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleGetStarted = () => {
    console.log('Get Started clicked')
    alert('Wassup Gangs :D')
  }

  return (
    <div className="min-h-screen font-noto-sans overflow-hidden">
      
    </div>
  )
}

export default App