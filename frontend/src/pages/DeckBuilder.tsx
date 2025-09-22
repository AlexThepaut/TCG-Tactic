import { useState } from 'react';
import { PlusIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import type { Faction } from '@/types';

const DeckBuilder = () => {
  const [selectedFaction, setSelectedFaction] = useState<Faction>('humans');
  const [deckName, setDeckName] = useState('My Deck');
  const [deckCards] = useState<Array<{ id: string; name: string; cost: number; count: number }>>([
    // Mock deck cards
    { id: '1', name: 'Infantry Squad', cost: 2, count: 2 },
    { id: '2', name: 'Shield Wall', cost: 3, count: 1 },
    { id: '3', name: 'Commander', cost: 5, count: 1 },
  ]);

  const totalCards = deckCards.reduce((sum, card) => sum + card.count, 0);
  const isValidDeck = totalCards === 40;

  const factionConfigs = {
    humans: {
      name: 'Humans',
      icon: '🛡️',
      colors: 'humans',
      description: 'Tactical discipline and coordination'
    },
    aliens: {
      name: 'Aliens',
      icon: '👽',
      colors: 'aliens',
      description: 'Evolution and adaptation'
    },
    robots: {
      name: 'Robots',
      icon: '🤖',
      colors: 'robots',
      description: 'Persistence and technology'
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-cyber font-black mb-6 gradient-text-cyber tracking-wider uppercase">
            ⚙️ DECK FORGE
          </h1>
          <div className="cyber-panel inline-block px-6 py-3 rounded-xl">
            <p className="font-sans tracking-wide neon-text-cyan">
              CONSTRUCT TACTICAL ARMAMENTS WITH 40 FACTION-SPECIFIC CARDS
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deck Configuration */}
          <div className="lg:col-span-1">
            <div className="cyber-panel rounded-xl p-8 mb-8 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
              <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

              <h2 className="text-2xl font-cyber font-bold mb-6 neon-text-pink tracking-wider uppercase flex items-center relative z-10">
                <WrenchScrewdriverIcon className="w-8 h-8 mr-3" />
                DECK FORGE
              </h2>
              
              {/* Deck Name */}
              <div className="mb-6 relative z-10">
                <label className="block text-sm font-cyber tracking-wider uppercase text-cyber-muted mb-3">
                  TACTICAL DESIGNATION
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="w-full px-4 py-3 cyber-card-container rounded-xl text-neon-cyan-400 placeholder-cyber-muted font-cyber tracking-wider uppercase text-sm focus:neon-glow-cyan transition-all duration-300"
                  placeholder="ENTER DECK NAME..."
                />
              </div>

              {/* Faction Selection */}
              <div className="mb-8 relative z-10">
                <label className="block text-sm font-cyber tracking-wider uppercase text-cyber-muted mb-4">
                  FACTION PROTOCOL
                </label>
                <div className="space-y-3">
                  {(Object.entries(factionConfigs) as [Faction, typeof factionConfigs.humans][]).map(([faction, config]) => {
                    const isSelected = selectedFaction === faction;
                    const getFactionGlow = () => {
                      switch (faction) {
                        case 'humans': return 'neon-glow-blue';
                        case 'aliens': return 'neon-glow-pink';
                        case 'robots': return 'neon-glow-green';
                        default: return '';
                      }
                    };
                    const getFactionText = () => {
                      switch (faction) {
                        case 'humans': return 'neon-text-blue';
                        case 'aliens': return 'neon-text-pink';
                        case 'robots': return 'neon-text-green';
                        default: return 'neon-text-cyan';
                      }
                    };

                    return (
                      <button
                        key={faction}
                        onClick={() => setSelectedFaction(faction)}
                        className={`w-full p-4 rounded-xl border transition-all duration-300 text-left cyber-card-container relative overflow-hidden group ${
                          isSelected
                            ? `border-neon-cyan-300 ${getFactionGlow()}`
                            : 'border-cyber-border hover:border-neon-cyan-400 hover:neon-glow-cyan'
                        }`}
                      >
                        {/* Background effects */}
                        <div className="absolute inset-0 holographic opacity-10" />

                        <div className="flex items-center relative z-10">
                          <span className="text-2xl mr-4">{config.icon}</span>
                          <div>
                            <div className={`font-cyber font-bold tracking-wider uppercase ${isSelected ? getFactionText() : 'text-neon-cyan-300'}`}>
                              {config.name}
                            </div>
                            <div className="text-xs text-cyber-muted font-sans">
                              {config.description}
                            </div>
                          </div>
                        </div>

                        {/* Corner accents */}
                        {isSelected && (
                          <>
                            <div className="absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-neon-cyan-400 opacity-60" />
                            <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-neon-cyan-400 opacity-60" />
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deck Stats */}
              <div className={`p-6 rounded-xl border relative overflow-hidden ${
                isValidDeck
                  ? 'cyber-panel border-neon-green-300 neon-glow-green'
                  : 'cyber-panel border-neon-red-300 neon-glow-red'
              }`}>
                {/* Background effects */}
                <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

                <div className="relative z-10">
                  <div className="text-sm font-cyber tracking-wider uppercase mb-3">
                    <span className="text-cyber-muted">DECK STATUS:</span>
                    <span className={`ml-2 font-bold ${
                      isValidDeck ? 'neon-text-green' : 'neon-text-red'
                    }`}>
                      {totalCards}/40 CARDS
                    </span>
                  </div>

                  <div className="w-full cyber-card-container rounded-full h-3 mb-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isValidDeck ? 'bg-gradient-to-r from-neon-green-500 to-neon-cyan-400' : 'bg-gradient-to-r from-neon-red-500 to-neon-pink-400'
                      }`}
                      style={{ width: `${Math.min((totalCards / 40) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="text-xs font-cyber tracking-wider uppercase">
                    {isValidDeck ? (
                      <span className="neon-text-green">⚡ COMBAT READY</span>
                    ) : (
                      <span className="neon-text-red">⚠️ NEED {40 - totalCards} MORE CARDS</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scanning line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-pink-400 to-transparent animate-scanline opacity-40" />
            </div>

            {/* Current Deck */}
            <div className="cyber-panel rounded-xl p-6 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

              <h3 className="text-lg font-cyber font-bold mb-6 neon-text-cyan tracking-wider uppercase relative z-10">
                🎯 CURRENT ARMAMENT
              </h3>
              
              <div className="relative z-10">
                {deckCards.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl cyber-panel flex items-center justify-center">
                      <span className="text-cyber-muted text-2xl">📦</span>
                    </div>
                    <p className="text-cyber-muted font-cyber tracking-wider uppercase text-sm">NO ARMAMENTS LOADED</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deckCards.map((card) => (
                      <div key={card.id} className="cyber-card-container rounded-lg p-4 relative overflow-hidden group">
                        {/* Background effects */}
                        <div className="absolute inset-0 holographic opacity-5" />

                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex-1">
                            <div className="text-sm font-cyber font-bold text-neon-cyan-300 tracking-wider uppercase">
                              {card.name}
                            </div>
                            <div className="text-xs text-cyber-muted font-sans">
                              COST: {card.cost} • VOID ECHOES
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-cyber text-neon-cyan-400">{card.count}x</span>
                            <button className="text-neon-red-400 hover:text-neon-red-300 transition-all duration-300 hover:neon-glow-red p-1 rounded">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Library */}
          <div className="lg:col-span-2">
            <div className="cyber-panel rounded-xl p-8 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
              <div className="absolute inset-0 holographic opacity-5 pointer-events-none" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-2xl font-cyber font-bold neon-text-green tracking-wider uppercase">
                  {factionConfigs[selectedFaction].icon} {factionConfigs[selectedFaction].name} ARSENAL
                </h2>
                <div className="cyber-panel px-4 py-2 rounded-xl">
                  <span className="text-sm font-cyber tracking-wider uppercase text-neon-cyan-400">
                    120 UNITS AVAILABLE
                  </span>
                </div>
              </div>

              {/* Mock Card Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
                {Array.from({ length: 16 }).map((_, i) => {
                  const config = factionConfigs[selectedFaction];

                  const getFactionGlow = () => {
                    switch (selectedFaction) {
                      case 'humans': return 'neon-glow-blue';
                      case 'aliens': return 'neon-glow-pink';
                      case 'robots': return 'neon-glow-green';
                      default: return '';
                    }
                  };

                  const getFactionText = () => {
                    switch (selectedFaction) {
                      case 'humans': return 'neon-text-blue';
                      case 'aliens': return 'neon-text-pink';
                      case 'robots': return 'neon-text-green';
                      default: return 'neon-text-cyan';
                    }
                  };

                  const getFactionBorder = () => {
                    switch (selectedFaction) {
                      case 'humans': return 'border-humans-400';
                      case 'aliens': return 'border-aliens-400';
                      case 'robots': return 'border-robots-400';
                      default: return 'border-neon-cyan-400';
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
                            UNIT ART
                          </span>
                        </div>

                        <h3 className={`font-cyber font-bold mb-2 text-sm tracking-wider uppercase ${getFactionText()}`}>
                          {config.name} UNIT {String(i + 1).padStart(3, '0')}
                        </h3>

                        <div className="flex justify-between text-xs mb-3">
                          <span className="font-cyber text-cyber-muted">COST: {(i % 10) + 1}</span>
                          <span className="font-cyber text-cyber-muted">ATK/HP: {(i % 5) + 1}/{(i % 5) + 2}</span>
                        </div>

                        {/* Add to deck button */}
                        <button className={`w-full py-2 text-xs rounded-lg font-cyber tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 neon-button border-2 ${
                          selectedFaction === 'humans' ? 'text-humans-300 border-humans-300 hover:neon-glow-blue' :
                          selectedFaction === 'aliens' ? 'text-aliens-300 border-aliens-300 hover:neon-glow-pink' :
                          'text-robots-300 border-robots-300 hover:neon-glow-green'
                        }`}>
                          <PlusIcon className="w-4 h-4" />
                          ADD UNIT
                        </button>

                        {/* Faction indicator */}
                        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border ${
                          selectedFaction === 'humans' ? 'bg-humans-500 border-humans-400' :
                          selectedFaction === 'aliens' ? 'bg-aliens-500 border-aliens-400' :
                          'bg-robots-500 border-robots-400'
                        } ${getFactionGlow()} opacity-80`} />
                      </div>

                      {/* Corner accents */}
                      <div className={`absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 opacity-60 ${getFactionBorder()}`} />
                      <div className={`absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 opacity-60 ${getFactionBorder()}`} />
                    </div>
                  );
                })}
              </div>

              {/* Scanning line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green-400 to-transparent animate-scanline opacity-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;