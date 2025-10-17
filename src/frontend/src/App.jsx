import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import axios from "axios"

function App() {
  const [count, setCount] = useState(0);
  const [array, setArray] = useState([]);

  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:3000/api/message");
    setArray(response.data.message);
  }

  useEffect(() => {
    fetchAPI()
  }, [])

  return (
    <>
      <div className="max-w-1280px mx-auto p-8 text-center">
        <div>
          <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
            <img
              src={viteLogo}
              className="h-24 p-6 transition-filter duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
              alt="Vite logo"
            />
          </a>
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
            <img
              src={reactLogo}
              className="h-24 p-6 transition-filter duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-spin"
              style={{ animationDuration: '20s' }}
              alt="React logo"
            />
          </a>
        </div>
        <h1>Vite + React</h1>

        <div className="p-8">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            count is {count}
          </button>
          {array.map((user, index) => (
            <div key={index}>
              <span>{user}</span>
              <br />
            </div>
          ))}
        </div>

        <p className="text-gray-500">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </>
  )
}

export default App