import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Connecting...')

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/status`)
        const data = await response.json()
        setBackendStatus(`✅ Connected: ${data.message}`)
      } catch (error) {
        setBackendStatus('❌ Backend connection failed')
        console.error('Backend connection error:', error)
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          TCG Tactique
        </h1>
        <p className="text-xl mb-8 text-blue-200">
          Tactical card game with real-time multiplayer
        </p>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-green-400">🚀 Development Environment</h2>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span>Frontend:</span>
              <span className="text-green-400">✅ Running on port 3000</span>
            </div>
            <div className="flex justify-between">
              <span>Backend:</span>
              <span className={backendStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                {backendStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-human-900/30 backdrop-blur-sm rounded-lg p-6 border border-human-500/30">
            <h3 className="text-xl font-semibold mb-2 text-human-400">🛡️ Humans</h3>
            <p className="text-sm text-human-200">Tactical discipline and coordination</p>
            <div className="mt-4 text-xs font-mono">
              <div>-xxx-</div>
              <div>-xxx-</div>
              <div>-xxx-</div>
            </div>
          </div>

          <div className="bg-alien-900/30 backdrop-blur-sm rounded-lg p-6 border border-alien-500/30">
            <h3 className="text-xl font-semibold mb-2 text-alien-400">👽 Aliens</h3>
            <p className="text-sm text-alien-200">Evolution and adaptation</p>
            <div className="mt-4 text-xs font-mono">
              <div>-xxx-</div>
              <div>xxxxx</div>
              <div>--x--</div>
            </div>
          </div>

          <div className="bg-robot-900/30 backdrop-blur-sm rounded-lg p-6 border border-robot-500/30">
            <h3 className="text-xl font-semibold mb-2 text-robot-400">🤖 Robots</h3>
            <p className="text-sm text-robot-200">Persistence and technology</p>
            <div className="mt-4 text-xs font-mono">
              <div>xxxxx</div>
              <div>--x--</div>
              <div>-xxx-</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-blue-300">
          Ready to implement the core game engine!
        </div>
      </div>
    </div>
  )
}

export default App