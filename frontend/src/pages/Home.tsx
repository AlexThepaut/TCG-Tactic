import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, RectangleStackIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Central tech grid effect */}
      <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />

      <div className="text-center text-white max-w-5xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="mb-16 relative">
          {/* Glitch text effect */}
          <div className="relative">
            <h1
              className="text-6xl md:text-9xl font-cyber font-black mb-8 gradient-text-cyber energy-pulse"
              data-text="TCG TACTIQUE"
            >
              TCG TACTIQUE
            </h1>
            {/* Scanning line overlay */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan-400 to-transparent animate-scanline opacity-60" />
          </div>

          <div className="cyber-panel inline-block px-8 py-4 rounded-xl backdrop-blur-md">
            <p className="text-lg md:text-xl font-sans tracking-wide neon-text-cyan">
              TACTICAL CARD GAME WITH REAL-TIME MULTIPLAYER COMBAT
            </p>
          </div>

          {/* Floating accent elements */}
          <div className="absolute -top-10 -left-10 w-20 h-20 border-2 border-neon-cyan-400 rounded-full animate-neon-pulse opacity-30" />
          <div className="absolute -bottom-10 -right-10 w-16 h-16 border-2 border-neon-pink-400 rounded-full animate-neon-pulse opacity-30" />
        </div>

        {/* System Status */}
        <div className="cyber-panel rounded-xl p-8 mb-16 relative overflow-hidden">
          {/* Background tech grid */}
          <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />

          <h2 className="text-3xl font-cyber font-bold mb-6 neon-text-green tracking-wider uppercase relative z-10">
            ⚡ SYSTEM STATUS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left relative z-10">
            <div className="cyber-card-container p-5 rounded-lg holographic-border">
              <div className="flex justify-between items-center">
                <span className="font-cyber text-sm tracking-wider uppercase text-cyber-muted">FRONTEND:</span>
                <span className="neon-text-green font-bold font-cyber">
                  ⚡ ACTIVE PORT 3000
                </span>
              </div>
            </div>

            <div className="cyber-card-container p-5 rounded-lg holographic-border">
              <div className="flex justify-between items-center">
                <span className="font-cyber text-sm tracking-wider uppercase text-cyber-muted">BACKEND:</span>
                <span className={clsx(
                  'font-bold font-cyber',
                  backendStatus.includes('✅') ? 'neon-text-green' : 'neon-text-red'
                )}>
                  {backendStatus.includes('✅') ? '⚡ ONLINE' : '❌ OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Scanning line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green-400 to-transparent animate-scanline opacity-40" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Link
            to="/game"
            className="cyber-card-container rounded-xl p-8 relative overflow-hidden transition-all duration-500 hover:scale-110 group transform-gpu faction-card"
          >
            {/* Background effects */}
            <div className="absolute inset-0 holographic opacity-20" />
            <div className="absolute inset-0 tech-grid opacity-10" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl cyber-panel flex items-center justify-center neon-glow-green group-hover:animate-neon-pulse">
                <PlayIcon className="w-10 h-10 neon-text-green" />
              </div>
              <h3 className="text-2xl font-cyber font-bold mb-3 neon-text-green tracking-wider uppercase">
                QUICK PLAY
              </h3>
              <p className="text-cyber-muted font-sans text-sm tracking-wide">
                JUMP INTO A MATCH IMMEDIATELY
              </p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-green-400 opacity-60" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-green-400 opacity-60" />
          </Link>

          <Link
            to="/collection"
            className="cyber-card-container rounded-xl p-8 relative overflow-hidden transition-all duration-500 hover:scale-110 group transform-gpu faction-card"
          >
            {/* Background effects */}
            <div className="absolute inset-0 holographic opacity-20" />
            <div className="absolute inset-0 tech-grid opacity-10" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl cyber-panel flex items-center justify-center neon-glow-blue group-hover:animate-neon-pulse">
                <RectangleStackIcon className="w-10 h-10 neon-text-blue" />
              </div>
              <h3 className="text-2xl font-cyber font-bold mb-3 neon-text-blue tracking-wider uppercase">
                COLLECTION
              </h3>
              <p className="text-cyber-muted font-sans text-sm tracking-wide">
                BROWSE ALL AVAILABLE CARDS
              </p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-blue-400 opacity-60" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-blue-400 opacity-60" />
          </Link>

          <Link
            to="/deck-builder"
            className="cyber-card-container rounded-xl p-8 relative overflow-hidden transition-all duration-500 hover:scale-110 group transform-gpu faction-card"
          >
            {/* Background effects */}
            <div className="absolute inset-0 holographic opacity-20" />
            <div className="absolute inset-0 tech-grid opacity-10" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl cyber-panel flex items-center justify-center neon-glow-pink group-hover:animate-neon-pulse">
                <WrenchScrewdriverIcon className="w-10 h-10 neon-text-pink" />
              </div>
              <h3 className="text-2xl font-cyber font-bold mb-3 neon-text-pink tracking-wider uppercase">
                DECK BUILDER
              </h3>
              <p className="text-cyber-muted font-sans text-sm tracking-wide">
                CREATE AND CUSTOMIZE DECKS
              </p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink-400 opacity-60" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink-400 opacity-60" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;