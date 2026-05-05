import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState('Connecting to backend...')

  useEffect(() => {
    axios.get('http://localhost:8080/api/ping')
      .then(response => {
        setMessage(response.data.message)
      })
      .catch(error => {
        setMessage('Failed to connect to backend.')
        console.error(error)
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Exam Timetable Scheduler</h1>
        <p className="text-gray-600 mb-6">Phase 1: Project Setup</p>
        
        <div className={`p-4 rounded-lg font-medium ${message.includes('running') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          Backend Status: {message}
        </div>
      </div>
    </div>
  )
}

export default App
