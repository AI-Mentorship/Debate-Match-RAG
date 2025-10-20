import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMessage = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:3000/api/message')
      setMessage(response.data.message)
    }
    
    catch (error) {
      setMessage(['Error connecting to backend'])
    }
    
    finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMessage() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-indigo to-misty-plum flex flex-col">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-pale-fog mb-3">Debate Match RAG</h1>
        <p className="text-lg text-sea-mist">Testing</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-deep-ocean-fog rounded-2xl shadow-lg p-8 border border-sea-mist">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-pale-fog">Backend Message</h2>
            <button
              onClick={fetchMessage}
              disabled={loading}
              className="bg-sea-mist hover:bg-deep-ocean-fog text-pale-fog px-4 py-2 rounded-lg border border-pale-fog transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Refresh'}
            </button>
          </div>

          <div className="bg-misty-plum rounded-lg p-4 border border-sea-mist">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pale-fog"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {message.map((item, index) => (
                  <div key={index} className="bg-deep-indigo text-pale-fog px-3 py-2 rounded border border-sea-mist">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-sea-mist text-sm mt-4">
            <p>Database Connected</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App