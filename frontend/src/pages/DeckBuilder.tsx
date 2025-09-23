import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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
    <div className="min-h-screen p-4 md:p-8 relative">
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          {/* Gothic decoration */}
          <div className="mb-6 flex justify-center">
            <div className="text-robots-400 text-3xl font-gothic icon-glow-robots">⚒</div>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black mb-4 gothic-text-shadow">
            <span className="bg-gradient-to-r from-robots-300 via-robots-400 to-robots-600 bg-clip-text text-transparent animate-hologram">
              LEGION FORGE
            </span>
          </h1>

          <div className="relative mb-6">
            <p className="text-xl md:text-2xl font-tech font-medium text-robots-200 gothic-text-shadow tracking-wider">
              WAR CONFIGURATION • 40 ECHO DEPLOYMENT • LEGION ASSEMBLY
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>
          </div>

          <p className="text-lg text-void-300 font-tech font-light tracking-wide opacity-80">
            "Forge your war legion with precision and purpose..."
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deck Configuration */}
          <div className="lg:col-span-1">
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-robots-700/50 p-6 relative scanlines mb-6">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>

              <h2 className="text-2xl font-gothic font-bold mb-6 text-robots-400 gothic-text-shadow tracking-wider">
                ⚙ FORGE CONFIG ⚙
              </h2>
              
              {/* Deck Name */}
              <div className="mb-6">
                <label className="block text-sm font-tech font-medium text-robots-300 mb-3 tracking-wider">
                  LEGION DESIGNATION
                </label>
                <div className="bg-gothic-darker/80 border border-robots-600/30 p-3 relative group">
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full bg-transparent border-0 text-robots-200 placeholder-robots-500 focus:outline-none focus:ring-0 font-tech tracking-wide"
                  />
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent group-hover:via-robots-400 transition-colors"></div>
                </div>
              </div>

              {/* Faction Selection */}
              <div className="mb-6">
                <label className="block text-sm font-tech font-medium text-robots-300 mb-3 tracking-wider">
                  WAR PROTOCOLS
                </label>
                <div className="space-y-2">
                  {(Object.entries(factionConfigs) as [Faction, typeof factionConfigs.humans][]).map(([faction, config]) => {
                    const factionNames = {
                      humans: 'IMPERIAL',
                      aliens: 'ALIEN',
                      robots: 'MACHINE'
                    };

                    return (
                      <button
                        key={faction}
                        onClick={() => setSelectedFaction(faction)}
                        className={`w-full p-4 border transition-all duration-300 text-left relative group overflow-hidden ${
                          selectedFaction === faction
                            ? `bg-${config.colors}-600/80 border-${config.colors}-400/50 text-${config.colors}-100 box-glow-${config.colors}`
                            : `bg-gothic-darker/80 border-${config.colors}-700/30 text-${config.colors}-300 hover:bg-${config.colors}-800/30 hover:border-${config.colors}-600/50`
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br from-${config.colors}-900/20 to-${config.colors}-700/10 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="relative z-10 flex items-center">
                          <span className={`text-xl mr-4 ${selectedFaction === faction ? `icon-glow-${config.colors}` : ''}`}>{config.icon}</span>
                          <div>
                            <div className="font-gothic font-bold gothic-text-shadow tracking-wider">{factionNames[faction as keyof typeof factionNames]}</div>
                            <div className="text-xs opacity-80 font-tech">{config.description}</div>
                          </div>
                        </div>
                        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${config.colors}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${config.colors}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deck Stats */}
              <div className={`p-4 border relative scanlines ${
                isValidDeck
                  ? 'bg-imperial-600/20 border-imperial-500/50 text-imperial-300'
                  : 'bg-blood-600/20 border-blood-500/50 text-blood-300'
              }`}>
                <div className="text-sm font-tech font-medium mb-3 tracking-wider">
                  FORGE STATUS: {totalCards}/40 ECHOES
                </div>
                <div className="w-full bg-gothic-darker rounded-full h-3 mb-3 border border-gothic-medium/30">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isValidDeck ? 'bg-imperial-500 shadow-lg shadow-imperial-500/50' : 'bg-blood-500 shadow-lg shadow-blood-500/50'
                    }`}
                    style={{ width: `${Math.min((totalCards / 40) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs font-tech tracking-wide">
                  {isValidDeck ? '◉ LEGION DEPLOYMENT READY' : `◯ REQUIRE ${40 - totalCards} ADDITIONAL ECHOES`}
                </div>
              </div>
            </div>

            {/* Current Deck */}
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-robots-700/50 p-6 relative scanlines">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>

              <h3 className="text-xl font-gothic font-bold mb-4 text-robots-400 gothic-text-shadow tracking-wider">
                ⚔ ACTIVE LEGION ⚔
              </h3>
              
              {deckCards.length === 0 ? (
                <p className="text-robots-500 text-sm font-tech italic tracking-wide">No echoes deployed • Begin legion assembly</p>
              ) : (
                <div className="space-y-3">
                  {deckCards.map((card) => (
                    <div key={card.id} className="bg-gothic-darker/80 border border-robots-600/30 p-3 relative group hover:border-robots-500/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-gothic font-bold text-robots-200 gothic-text-shadow">{card.name}</div>
                          <div className="text-xs text-robots-400 font-tech tracking-wide">VOID: {card.cost} • WAR ECHO</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-robots-300 font-tech font-bold">{card.count}x</span>
                          <button className="text-blood-400 hover:text-blood-300 transition-colors p-1 hover:bg-blood-900/20 rounded">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent group-hover:via-robots-400 transition-colors"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Library */}
          <div className="lg:col-span-2">
            <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-robots-700/50 p-6 relative scanlines">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-500 to-transparent"></div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-gothic font-bold text-robots-400 gothic-text-shadow tracking-wider">
                  {factionConfigs[selectedFaction].icon} {factionConfigs[selectedFaction].name.toUpperCase()} ARSENAL
                </h2>
                <div className="text-sm font-tech text-robots-500 tracking-wide">
                  120 WAR ECHOES AVAILABLE
                </div>
              </div>

              {/* Mock Card Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 16 }).map((_, i) => {
                  const config = factionConfigs[selectedFaction];
                  const factionNames = {
                    humans: 'IMPERIAL',
                    aliens: 'ALIEN',
                    robots: 'MACHINE'
                  };

                  return (
                    <div
                      key={i}
                      className={`bg-gothic-darkest/60 border-2 border-${config.colors}-600/50 hover:border-${config.colors}-400 p-3 relative group transition-all duration-500 hover:scale-105 overflow-hidden cursor-pointer`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-${config.colors}-900/20 to-${config.colors}-700/10 opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                      <div className="relative z-10">
                        <div className="aspect-card bg-gothic-darker rounded-md mb-3 flex items-center justify-center text-void-500 text-xs font-tech border border-gothic-medium/30">
                          <span className="gothic-text-shadow">CLASSIFIED</span>
                        </div>

                        <h3 className={`font-gothic font-bold text-${config.colors}-300 mb-1 text-sm gothic-text-shadow tracking-wider`}>
                          {factionNames[selectedFaction as keyof typeof factionNames]} {i + 1}
                        </h3>

                        <div className={`flex justify-between text-xs text-${config.colors}-400 font-tech tracking-wide mb-3`}>
                          <span>VOID: {(i % 10) + 1}</span>
                          <span>WAR: {(i % 5) + 1}/{(i % 5) + 2}</span>
                        </div>

                        {/* Add to deck button */}
                        <button className={`w-full py-2 text-xs font-tech font-bold tracking-wide bg-${config.colors}-600 hover:bg-${config.colors}-500 text-white transition-all flex items-center justify-center gap-2 border border-${config.colors}-500/50 hover:border-${config.colors}-400 hover:box-glow-${config.colors.slice(0, -1)} group/btn`}>
                          <PlusIcon className={`w-3 h-3 group-hover/btn:icon-glow-${config.colors}`} />
                          <span className="gothic-text-shadow">DEPLOY</span>
                        </button>
                      </div>

                      {/* Border glow effects */}
                      <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${config.colors}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <div className={`absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${config.colors}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;