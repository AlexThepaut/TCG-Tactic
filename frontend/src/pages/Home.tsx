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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative">
      {/* Atmospheric effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating embers */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-robots-500 rounded-full animate-ember opacity-60"></div>
        <div className="absolute top-32 right-32 w-1 h-1 bg-imperial-400 rounded-full animate-ember opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-40 w-1.5 h-1.5 bg-robots-600 rounded-full animate-ember opacity-50" style={{ animationDelay: '2s' }}></div>

        {/* Scanning beams */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-imperial-400 to-transparent opacity-30 animate-flicker"></div>
        <div className="absolute top-0 right-1/3 w-px h-24 bg-gradient-to-b from-robots-500 to-transparent opacity-20 animate-flicker" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="text-center max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="mb-16">
          {/* Gothic decoration */}
          <div className="mb-8 flex justify-center">
            <div className="text-imperial-400 text-4xl font-gothic icon-glow-imperial">⚜</div>
          </div>

          <h1 className="text-7xl md:text-9xl font-display font-black mb-8 gothic-text-shadow relative">
            <span className="bg-gradient-to-r from-imperial-300 via-imperial-400 to-imperial-600 bg-clip-text text-transparent animate-hologram">
              TCG TACTIQUE
            </span>
          </h1>

          <div className="relative mb-8">
            <p className="text-2xl md:text-3xl font-tech font-medium text-imperial-200 gothic-text-shadow tracking-wider">
              TACTICAL WARFARE • REAL-TIME COMBAT • STRATEGIC MASTERY
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          </div>

          <p className="text-lg md:text-xl text-void-300 font-tech font-light tracking-wide opacity-80">
            "Where strategy meets destiny on the digital battlefield..."
          </p>
        </div>

        {/* System Status - Redesigned as Command Console */}
        <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-8 mb-16 relative scanlines">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

          <h2 className="text-3xl font-gothic font-bold mb-6 text-imperial-400 gothic-text-shadow tracking-wider">
            ⚙ SYSTEM STATUS ⚙
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gothic-darker/80 border border-imperial-600/30 p-4 relative group">
              <div className="flex justify-between items-center">
                <span className="text-imperial-200 font-tech font-medium tracking-wide">FRONTEND:</span>
                <span className="text-imperial-400 font-tech font-bold icon-glow-imperial">
                  ◉ ONLINE • PORT 3000
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
            </div>

            <div className="bg-gothic-darker/80 border border-imperial-600/30 p-4 relative group">
              <div className="flex justify-between items-center">
                <span className="text-imperial-200 font-tech font-medium tracking-wide">BACKEND:</span>
                <span className={`font-tech font-bold tracking-wide ${
                  backendStatus.includes('✅')
                    ? 'text-imperial-400 icon-glow-imperial'
                    : 'text-blood-500 animate-flicker'
                }`}>
                  {backendStatus.includes('✅')
                    ? '◉ CONNECTED'
                    : '◯ DISCONNECTED'
                  }
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
            </div>
          </div>
        </div>

        {/* Action Cards - Tactical Operations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            to="/game"
            className="bg-gothic-darkest/60 border-2 border-humans-600/50 hover:border-humans-400 p-8 relative group transition-all duration-500 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-humans-900/20 to-humans-700/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-humans-400 mb-6 text-center">
                <PlayIcon className="w-16 h-16 mx-auto group-hover:icon-glow-humans transition-all" />
              </div>
              <h3 className="text-2xl font-gothic font-bold mb-3 text-humans-300 gothic-text-shadow tracking-wider">
                QUICK DEPLOY
              </h3>
              <p className="text-humans-200 font-tech text-sm tracking-wide opacity-80">
                Jump into battle immediately
              </p>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-humans-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-humans-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </Link>

          <Link
            to="/collection"
            className="bg-gothic-darkest/60 border-2 border-aliens-600/50 hover:border-aliens-400 p-8 relative group transition-all duration-500 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-aliens-900/20 to-aliens-700/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-aliens-400 mb-6 text-center">
                <RectangleStackIcon className="w-16 h-16 mx-auto group-hover:icon-glow-aliens transition-all" />
              </div>
              <h3 className="text-2xl font-gothic font-bold mb-3 text-aliens-300 gothic-text-shadow tracking-wider">
                CARD ARCHIVES
              </h3>
              <p className="text-aliens-200 font-tech text-sm tracking-wide opacity-80">
                Browse all available cards
              </p>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </Link>

          <Link
            to="/deck-builder"
            className="bg-gothic-darkest/60 border-2 border-robots-600/50 hover:border-robots-400 p-8 relative group transition-all duration-500 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-robots-900/20 to-robots-700/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-robots-400 mb-6 text-center">
                <WrenchScrewdriverIcon className="w-16 h-16 mx-auto group-hover:icon-glow-robots transition-all" />
              </div>
              <h3 className="text-2xl font-gothic font-bold mb-3 text-robots-300 gothic-text-shadow tracking-wider">
                DECK FORGE
              </h3>
              <p className="text-robots-200 font-tech text-sm tracking-wide opacity-80">
                Craft strategic configurations
              </p>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </Link>
        </div>

        {/* Footer Quote */}
        <div className="mt-16 text-center">
          <p className="text-imperial-400 font-gothic italic text-lg gothic-text-shadow">
            "Victory Through Strategy"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;