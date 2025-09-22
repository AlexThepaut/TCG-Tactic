import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Collection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<'all' | 'humans' | 'aliens' | 'robots'>('all');


  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-cyber font-black mb-6 gradient-text-cyber tracking-wider uppercase">
            CARD COLLECTION
          </h1>
          <div className="cyber-panel inline-block px-6 py-3 rounded-xl">
            <p className="font-sans tracking-wide neon-text-cyan">
              BROWSE ALL 360 AVAILABLE CARDS IN THE CURRENT ROTATION
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12 cyber-panel rounded-xl p-8 relative overflow-hidden">
          {/* Background tech grid */}
          <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-neon-cyan-400" />
              <input
                type="text"
                placeholder="SEARCH CARDS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 cyber-card-container rounded-xl text-neon-cyan-400 placeholder-cyber-muted font-cyber tracking-wider uppercase text-sm focus:neon-glow-cyan transition-all duration-300"
              />
            </div>

            {/* Faction Filter */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setSelectedFaction('all')}
                className={`neon-button px-6 py-4 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 ${
                  selectedFaction === 'all'
                    ? 'text-neon-cyan-300 border-neon-cyan-300 neon-glow-cyan'
                    : 'text-cyber-muted border-cyber-border hover:text-neon-cyan-400 hover:border-neon-cyan-400'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setSelectedFaction('humans')}
                className={`neon-button px-6 py-4 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 ${
                  selectedFaction === 'humans'
                    ? 'text-humans-300 border-humans-300 neon-glow-blue'
                    : 'text-cyber-muted border-cyber-border hover:text-humans-400 hover:border-humans-400'
                }`}
              >
                ⚡ HUMANS
              </button>
              <button
                onClick={() => setSelectedFaction('aliens')}
                className={`neon-button px-6 py-4 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 ${
                  selectedFaction === 'aliens'
                    ? 'text-aliens-300 border-aliens-300 neon-glow-pink'
                    : 'text-cyber-muted border-cyber-border hover:text-aliens-400 hover:border-aliens-400'
                }`}
              >
                🔥 ALIENS
              </button>
              <button
                onClick={() => setSelectedFaction('robots')}
                className={`neon-button px-6 py-4 rounded-xl font-cyber tracking-wider uppercase text-sm transition-all duration-300 ${
                  selectedFaction === 'robots'
                    ? 'text-robots-300 border-robots-300 neon-glow-green'
                    : 'text-cyber-muted border-cyber-border hover:text-robots-400 hover:border-robots-400'
                }`}
              >
                ⚙️ ROBOTS
              </button>
            </div>
          </div>

          {/* Scanning line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan-400 to-transparent animate-scanline opacity-40" />
        </div>

        {/* Cards Grid Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-16">
          {/* Mock card entries */}
          {Array.from({ length: 24 }).map((_, i) => {
            const mockFactions = ['humans', 'aliens', 'robots'] as const;
            const faction = mockFactions[i % 3];

            const getFactionGlow = (faction: string) => {
              switch (faction) {
                case 'humans': return 'neon-glow-blue';
                case 'aliens': return 'neon-glow-pink';
                case 'robots': return 'neon-glow-green';
                default: return '';
              }
            };

            const getFactionText = (faction: string) => {
              switch (faction) {
                case 'humans': return 'neon-text-blue';
                case 'aliens': return 'neon-text-pink';
                case 'robots': return 'neon-text-green';
                default: return 'neon-text-cyan';
              }
            };

            return (
              <div
                key={i}
                className="cyber-card-container rounded-xl p-4 relative overflow-hidden transition-all duration-500 cursor-pointer group faction-card hover:scale-105"
              >
                {/* Background effects */}
                <div className="absolute inset-0 holographic opacity-10" />
                <div className="absolute inset-0 tech-grid opacity-5" />

                <div className="relative z-10">
                  <div className="aspect-card cyber-panel rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 holographic opacity-20" />
                    <span className="text-cyber-muted text-xs font-cyber tracking-wider uppercase relative z-10">
                      CARD ART
                    </span>
                  </div>

                  <h3 className={`font-cyber font-bold mb-2 text-sm tracking-wider uppercase ${getFactionText(faction)}`}>
                    CARD {String(i + 1).padStart(3, '0')}
                  </h3>

                  <div className="flex justify-between text-xs">
                    <span className="font-cyber text-cyber-muted">COST: {(i % 10) + 1}</span>
                    <span className="font-cyber text-cyber-muted">ATK/HP: {(i % 5) + 1}/{(i % 5) + 2}</span>
                  </div>

                  {/* Faction indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border ${
                    faction === 'humans' ? 'bg-humans-500 border-humans-400' :
                    faction === 'aliens' ? 'bg-aliens-500 border-aliens-400' :
                    'bg-robots-500 border-robots-400'
                  } ${getFactionGlow(faction)} opacity-80`} />
                </div>

                {/* Corner accents */}
                <div className={`absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 opacity-60 ${
                  faction === 'humans' ? 'border-humans-400' :
                  faction === 'aliens' ? 'border-aliens-400' :
                  'border-robots-400'
                }`} />
                <div className={`absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 opacity-60 ${
                  faction === 'humans' ? 'border-humans-400' :
                  faction === 'aliens' ? 'border-aliens-400' :
                  'border-robots-400'
                }`} />
              </div>
            );
          })}
        </div>

        {/* Collection Status */}
        <div className="text-center">
          <div className="cyber-panel rounded-xl p-8 inline-block relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
            <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-2xl font-cyber font-bold mb-4 neon-text-green tracking-wider uppercase">
                ⚡ COLLECTION STATUS
              </h3>
              <p className="neon-text-cyan font-sans mb-3">
                ALL 360 CARDS AVAILABLE • NO COLLECTION SYSTEM REQUIRED
              </p>
              <p className="text-sm text-cyber-muted font-sans">
                TCG TACTIQUE PROVIDES EQUAL ACCESS TO ALL CARDS FOR COMPETITIVE FAIRNESS
              </p>
            </div>

            {/* Corner accent lights */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-green-400 opacity-60" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-green-400 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;