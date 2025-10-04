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
    <>
      {/* Warhammer 40K Grimdark Space Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gothic-black via-gothic-darkest to-gothic-darker z-0">
        {/* Distant stars - cold and merciless - spread across full width */}
        <div className="absolute inset-0">
          {/* Left side stars */}
          <div className="absolute top-1/6" style={{ left: '8%' }}>
            <div className="w-0.5 h-0.5 bg-blood-500 rounded-full animate-twinkle opacity-25"></div>
          </div>
          <div className="absolute bottom-1/4" style={{ left: '15%' }}>
            <div className="w-px h-px bg-gothic-silver rounded-full animate-twinkle-slow opacity-20"></div>
          </div>
          <div className="absolute top-2/3" style={{ left: '25%' }}>
            <div className="w-0.5 h-0.5 bg-imperial-600 rounded-full animate-twinkle opacity-30"></div>
          </div>

          {/* Center stars */}
          <div className="absolute top-1/8" style={{ left: '45%' }}>
            <div className="w-px h-px bg-imperial-500 rounded-full animate-twinkle-delayed opacity-35"></div>
          </div>
          <div className="absolute bottom-1/3" style={{ left: '55%' }}>
            <div className="w-0.5 h-0.5 bg-gothic-chrome rounded-full animate-twinkle-slow opacity-25"></div>
          </div>

          {/* Right side stars */}
          <div className="absolute top-1/3" style={{ left: '75%' }}>
            <div className="w-px h-px bg-imperial-500 rounded-full animate-twinkle-delayed opacity-30"></div>
          </div>
          <div className="absolute bottom-1/6" style={{ left: '85%' }}>
            <div className="w-px h-px bg-blood-600 rounded-full animate-twinkle-delayed opacity-20"></div>
          </div>
          <div className="absolute top-1/8" style={{ left: '92%' }}>
            <div className="w-px h-px bg-gothic-steel rounded-full animate-twinkle-slow opacity-25"></div>
          </div>
        </div>

        {/* Dark Energy Storms - spread across screen */}
        <div className="absolute top-1/5 w-60 h-60 bg-gradient-radial from-gothic-dark/15 via-blood-900/8 to-transparent rounded-full animate-warp-storm opacity-40" style={{ left: '70%' }}></div>
        <div className="absolute bottom-1/4 w-48 h-48 bg-gradient-radial from-blood-800/10 via-gothic-darkest/6 to-transparent rounded-full animate-warp-storm opacity-35" style={{ left: '15%', animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 w-40 h-40 bg-gradient-radial from-imperial-800/6 via-gothic-darker/4 to-transparent rounded-full animate-warp-storm opacity-25" style={{ left: '45%', animationDelay: '6s' }}></div>

        {/* Battle-scarred planets - distributed across entire page */}
        <div className="absolute top-[10%] w-24 h-24" style={{ left: '20%' }}>
          <div className="relative w-full h-full animate-orbit-slow">
            {/* Death world */}
            <div className="w-10 h-10 bg-gradient-to-br from-gothic-darker via-blood-900 to-gothic-black rounded-full animate-imperial-glow border border-blood-800/20"
                 style={{ boxShadow: '0 0 15px #450a0a, inset 0 0 20px rgba(0,0,0,0.9)' }}></div>
          </div>
        </div>

        <div className="absolute bottom-[15%] w-32 h-32" style={{ left: '75%' }}>
          <div className="relative w-full h-full animate-orbit-reverse">
            {/* Forge world */}
            <div className="w-12 h-12 bg-gradient-to-br from-robots-800 via-imperial-800 to-gothic-black rounded-full animate-plasma-glow border border-imperial-700/30"
                 style={{ boxShadow: '0 0 20px #7c4f0d, inset 0 0 25px rgba(0,0,0,0.95)' }}></div>
          </div>
        </div>

        <div className="absolute top-[45%] w-20 h-20" style={{ left: '50%' }}>
          <div className="relative w-full h-full animate-orbit">
            {/* Corrupted world */}
            <div className="w-8 h-8 bg-gradient-to-br from-blood-800 via-gothic-dark to-gothic-black rounded-full animate-chaos-pulse border border-blood-700/30"
                 style={{ boxShadow: '0 0 20px #7f1d1d, inset 0 0 15px rgba(0,0,0,0.95)' }}></div>
          </div>
        </div>

        {/* Additional planets for better vertical distribution */}
        <div className="absolute top-[70%] w-28 h-28" style={{ left: '15%' }}>
          <div className="relative w-full h-full animate-orbit-slow">
            {/* Hive world */}
            <div className="w-11 h-11 bg-gradient-to-br from-gothic-steel via-gothic-dark to-gothic-black rounded-full animate-imperial-glow border border-imperial-600/20"
                 style={{ boxShadow: '0 0 18px #92400e, inset 0 0 22px rgba(0,0,0,0.9)' }}></div>
          </div>
        </div>

        <div className="absolute top-[25%] w-18 h-18" style={{ left: '85%' }}>
          <div className="relative w-full h-full animate-orbit-reverse">
            {/* Dead world */}
            <div className="w-7 h-7 bg-gradient-to-br from-void-800 via-gothic-darker to-gothic-black rounded-full animate-chaos-pulse border border-void-700/20"
                 style={{ boxShadow: '0 0 12px #374151, inset 0 0 18px rgba(0,0,0,0.95)' }}></div>
          </div>
        </div>

        <div className="absolute bottom-[35%] w-22 h-22" style={{ left: '35%' }}>
          <div className="relative w-full h-full animate-orbit">
            {/* Agri world */}
            <div className="w-9 h-9 bg-gradient-to-br from-aliens-800 via-gothic-dark to-gothic-black rounded-full animate-plasma-glow border border-aliens-700/25"
                 style={{ boxShadow: '0 0 16px #5b21b6, inset 0 0 20px rgba(0,0,0,0.92)' }}></div>
          </div>
        </div>

        {/* Space Hulks and debris - across full width */}
        <div className="absolute top-1/4 w-16 h-3 bg-gradient-to-r from-transparent via-gothic-steel/20 to-transparent animate-void-drift opacity-25" style={{ left: '10%' }}></div>
        <div className="absolute bottom-1/3 w-12 h-2 bg-gradient-to-r from-transparent via-imperial-700/15 to-transparent animate-void-drift opacity-20" style={{ left: '80%', animationDelay: '6s' }}></div>
        <div className="absolute top-2/3 w-8 h-1 bg-gradient-to-r from-transparent via-blood-800/15 to-transparent animate-void-drift opacity-18" style={{ left: '35%', animationDelay: '9s' }}></div>
        <div className="absolute bottom-1/5 w-20 h-4 bg-gradient-to-r from-transparent via-gothic-dark/12 to-transparent animate-void-drift opacity-15" style={{ left: '60%', animationDelay: '12s' }}></div>

        {/* Dark energy lightning - spread across screen */}
        <div className="absolute top-1/6 w-px h-16 bg-gradient-to-b from-blood-600 via-blood-700 to-transparent animate-warp-lightning opacity-40" style={{ left: '25%' }}></div>
        <div className="absolute bottom-1/5 w-px h-12 bg-gradient-to-b from-imperial-600 via-blood-700 to-transparent animate-warp-lightning opacity-35" style={{ left: '65%', animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 w-px h-20 bg-gradient-to-b from-imperial-500 via-blood-600 to-transparent animate-warp-lightning opacity-30" style={{ left: '85%', animationDelay: '3s' }}></div>
        <div className="absolute top-3/4 w-px h-14 bg-gradient-to-b from-gothic-chrome via-imperial-600 to-transparent animate-warp-lightning opacity-25" style={{ left: '40%', animationDelay: '4.5s' }}></div>

        {/* Battle sparks and energy discharge - distributed */}
        <div className="absolute top-1/3 w-1 h-1 bg-imperial-600 rounded-full animate-battle-spark opacity-45" style={{ left: '30%' }}></div>
        <div className="absolute bottom-1/4 w-0.5 h-0.5 bg-robots-600 rounded-full animate-battle-spark opacity-40" style={{ left: '70%', animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 w-1 h-1 bg-blood-600 rounded-full animate-battle-spark opacity-35" style={{ left: '90%', animationDelay: '4s' }}></div>
        <div className="absolute bottom-1/3 w-0.5 h-0.5 bg-gothic-chrome rounded-full animate-battle-spark opacity-40" style={{ left: '15%', animationDelay: '6s' }}></div>
        <div className="absolute top-1/5 w-1 h-1 bg-imperial-700 rounded-full animate-battle-spark opacity-45" style={{ left: '55%', animationDelay: '8s' }}></div>

        {/* Void rifts - horizontal across different widths */}
        <div className="absolute top-1/5 w-32 h-1 bg-gradient-to-r from-transparent via-gothic-black via-gothic-darkest to-transparent opacity-50 animate-pulse-slow" style={{ left: '60%' }}></div>
        <div className="absolute bottom-1/6 w-24 h-0.5 bg-gradient-to-r from-transparent via-gothic-darkest via-gothic-darker to-transparent opacity-45 animate-pulse-slow" style={{ left: '25%', animationDelay: '2s' }}></div>
        <div className="absolute top-3/5 w-40 h-1.5 bg-gradient-to-r from-transparent via-blood-900 via-gothic-black to-transparent opacity-40 animate-pulse-slow" style={{ left: '75%', animationDelay: '4s' }}></div>

        {/* Atmospheric haze of war - darker */}
        <div className="absolute inset-0 bg-gradient-to-t from-blood-900/3 via-transparent to-gothic-black/15 opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-imperial-900/2 to-gothic-darker/10 opacity-60"></div>

        {/* Deep grimdark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gothic-black/10 via-gothic-black/25 to-gothic-darkest/40 opacity-85"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gothic-black/5 via-transparent to-gothic-black/5 opacity-75"></div>
      </div>

      {/* Content Container */}
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative z-10">
        <div className="text-center max-w-6xl mx-auto relative">
        {/* Hero Section */}
        <div className="mb-16">
          {/* Gothic decoration */}
          <div className="mb-8 flex justify-center">
            <div className="text-imperial-400 text-4xl font-gothic icon-glow-imperial">⚜</div>
          </div>

          <h1 className="text-7xl md:text-9xl font-display font-black mb-8 gothic-text-shadow relative">
            <span className="bg-gradient-to-r from-imperial-300 via-imperial-400 to-imperial-600 bg-clip-text text-transparent animate-hologram">
              ECHOES OF WAR
            </span>
          </h1>

          <div className="relative mb-8">
            <p className="text-2xl md:text-3xl font-tech font-medium text-imperial-200 gothic-text-shadow tracking-wider">
              ETERNAL WARFARE • ECHOING BATTLEFIELDS • LEGENDARY CONFLICTS
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
          </div>

          <p className="text-lg md:text-xl text-void-300 font-tech font-light tracking-wide opacity-80">
            "When wars end, their echoes shape the fate of worlds..."
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
                WAR COUNCIL
              </h3>
              <p className="text-humans-200 font-tech text-sm tracking-wide opacity-80">
                Enter the eternal battlefields
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
                WAR CHRONICLES
              </h3>
              <p className="text-aliens-200 font-tech text-sm tracking-wide opacity-80">
                Discover legends of ancient wars
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
                LEGION FORGE
              </h3>
              <p className="text-robots-200 font-tech text-sm tracking-wide opacity-80">
                Forge your war legion
              </p>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </Link>
        </div>

        {/* Footer Quote */}
        <div className="mt-16 text-center">
          <p className="text-imperial-400 font-gothic italic text-lg gothic-text-shadow">
            "In War's Echo, Legends Are Born"
          </p>
        </div>
        </div>
      </div>
    </>
  );
};

export default Home;