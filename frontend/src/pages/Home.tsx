import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, RectangleStackIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Connecting...');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5001'}/api/status`);
        const data = await response.json();
        setBackendStatus(`✅ Connected: ${data.message}`);
      } catch (error) {
        setBackendStatus('❌ Backend connection failed');
        console.error('Backend connection error:', error);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="text-center text-white max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            TCG Tactique
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-200">
            Tactical card game with real-time multiplayer combat
          </p>
        </div>

        {/* System Status */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-12 border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 text-green-400">🚀 System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Frontend:</span>
              <span className="text-green-400 font-semibold">✅ Running on port 3000</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Backend:</span>
              <span className={backendStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                {backendStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/game"
            className="bg-green-600/20 hover:bg-green-600/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 transition-all duration-300 hover:scale-105 group"
          >
            <PlayIcon className="w-12 h-12 mx-auto mb-4 text-green-400 group-hover:text-green-300" />
            <h3 className="text-xl font-semibold mb-2 text-green-300">Quick Play</h3>
            <p className="text-green-200 text-sm">Jump into a match immediately</p>
          </Link>

          <Link
            to="/collection"
            className="bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 transition-all duration-300 hover:scale-105 group"
          >
            <RectangleStackIcon className="w-12 h-12 mx-auto mb-4 text-blue-400 group-hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-blue-300">Collection</h3>
            <p className="text-blue-200 text-sm">Browse all available cards</p>
          </Link>

          <Link
            to="/deck-builder"
            className="bg-purple-600/20 hover:bg-purple-600/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 transition-all duration-300 hover:scale-105 group"
          >
            <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-4 text-purple-400 group-hover:text-purple-300" />
            <h3 className="text-xl font-semibold mb-2 text-purple-300">Deck Builder</h3>
            <p className="text-purple-200 text-sm">Create and customize decks</p>
          </Link>
        </div>

        {/* Faction Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-humans-900/30 hover:bg-humans-900/40 backdrop-blur-sm rounded-xl p-6 border border-humans-600/30 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-2 text-humans-400">🛡️ Humans</h3>
            <p className="text-sm text-humans-200 mb-4">Tactical discipline and coordination</p>
            <div className="text-xs font-mono text-humans-300 space-y-1">
              <div>-xxx-</div>
              <div>-xxx-</div>
              <div>-xxx-</div>
            </div>
            <div className="mt-3 text-xs text-humans-300">Formation: Tactical Phalanx</div>
          </div>

          <div className="bg-aliens-900/30 hover:bg-aliens-900/40 backdrop-blur-sm rounded-xl p-6 border border-aliens-700/30 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-2 text-aliens-400">👽 Aliens</h3>
            <p className="text-sm text-aliens-200 mb-4">Evolution and adaptation</p>
            <div className="text-xs font-mono text-aliens-300 space-y-1">
              <div>-xxx-</div>
              <div>xxxxx</div>
              <div>--x--</div>
            </div>
            <div className="mt-3 text-xs text-aliens-300">Formation: Living Swarm</div>
          </div>

          <div className="bg-robots-900/30 hover:bg-robots-900/40 backdrop-blur-sm rounded-xl p-6 border border-robots-600/30 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-2 text-robots-400">🤖 Robots</h3>
            <p className="text-sm text-robots-200 mb-4">Persistence and technology</p>
            <div className="text-xs font-mono text-robots-300 space-y-1">
              <div>xxxxx</div>
              <div>--x--</div>
              <div>-xxx-</div>
            </div>
            <div className="mt-3 text-xs text-robots-300">Formation: Immortal Army</div>
          </div>
        </div>

        {/* Testing Section */}
        <div className="mt-12 bg-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400">🧪 Testing & Development</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/test/drag-drop"
              className="bg-yellow-700/20 hover:bg-yellow-700/30 rounded-lg p-4 border border-yellow-600/30 transition-all duration-300 hover:scale-105 group text-left"
            >
              <h3 className="text-lg font-semibold mb-2 text-yellow-300">🎯 Drag & Drop Test</h3>
              <p className="text-yellow-200 text-sm">Test the tactical grid and card placement with mock data</p>
            </Link>

            <Link
              to="/game/test-humans"
              className="bg-humans-700/20 hover:bg-humans-700/30 rounded-lg p-4 border border-humans-600/30 transition-all duration-300 hover:scale-105 group text-left"
            >
              <h3 className="text-lg font-semibold mb-2 text-humans-300">🛡️ Test Humans Formation</h3>
              <p className="text-humans-200 text-sm">Test with Humans faction (3×3 Tactical Phalanx)</p>
            </Link>
          </div>

          <div className="mt-4 text-center">
            <p className="text-yellow-300 text-sm">
              Access: <code className="bg-black/30 px-2 py-1 rounded">http://localhost:3001/test/drag-drop</code>
            </p>
          </div>
        </div>

        <div className="mt-8 text-sm text-blue-300">
          Ready to test the drag & drop interface!
        </div>
      </div>
    </div>
  );
};

export default Home;