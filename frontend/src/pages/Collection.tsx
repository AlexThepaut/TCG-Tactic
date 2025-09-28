import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UnifiedCard from '@/components/shared/UnifiedCard';
import type { GameCard, Faction } from '@/types';

const Collection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<'all' | 'humans' | 'aliens' | 'robots'>('all');

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Atmospheric effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating embers */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-robots-500 rounded-full animate-ember opacity-60"></div>
        <div className="absolute top-32 right-32 w-1 h-1 bg-imperial-400 rounded-full animate-ember opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-40 w-1.5 h-1.5 bg-aliens-600 rounded-full animate-ember opacity-50" style={{ animationDelay: '2s' }}></div>

        {/* Scanning beams */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-imperial-400 to-transparent opacity-30 animate-flicker"></div>
        <div className="absolute top-0 right-1/3 w-px h-24 bg-gradient-to-b from-aliens-500 to-transparent opacity-20 animate-flicker" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          {/* Gothic decoration */}
          <div className="mb-6 flex justify-center">
            <div className="text-aliens-400 text-3xl font-gothic icon-glow-aliens">📚</div>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black mb-4 gothic-text-shadow">
            <span className="bg-gradient-to-r from-aliens-300 via-aliens-400 to-aliens-600 bg-clip-text text-transparent animate-hologram">
              WAR CHRONICLES
            </span>
          </h1>

          <div className="relative mb-6">
            <p className="text-xl md:text-2xl font-tech font-medium text-aliens-200 gothic-text-shadow tracking-wider">
              BATTLEFIELD ARCHIVES • 360 WAR ECHOES • LEGENDARY CONFLICTS
            </p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent"></div>
          </div>

          <p className="text-lg text-void-300 font-tech font-light tracking-wide opacity-80">
            "Every echo tells a tale of glory and sacrifice..."
          </p>
        </div>

        {/* Filters - Command Console */}
        <div className="mb-8 bg-gothic-darkest/90 backdrop-blur-sm border-2 border-aliens-700/50 p-8 relative scanlines">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-500 to-transparent"></div>

          <h2 className="text-2xl font-gothic font-bold mb-6 text-aliens-400 gothic-text-shadow tracking-wider text-center">
            ⚙ WAR ARCHIVES ⚙
          </h2>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Search Console */}
            <div className="flex-1 relative">
              <div className="bg-gothic-darker/80 border border-aliens-600/30 p-4 relative group">
                <MagnifyingGlassIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-aliens-400 icon-glow-aliens" />
                <input
                  type="text"
                  placeholder="Search war chronicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 bg-transparent border-0 text-aliens-200 placeholder-aliens-500 focus:outline-none focus:ring-0 font-tech tracking-wide"
                />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aliens-600 to-transparent group-hover:via-aliens-400 transition-colors"></div>
              </div>
            </div>

            {/* Faction Selection Console */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFaction('all')}
                className={`px-6 py-3 border font-tech font-medium text-sm tracking-wide transition-all duration-300 relative group ${
                  selectedFaction === 'all'
                    ? 'bg-imperial-600/80 text-imperial-100 border-imperial-400/50 box-glow-imperial'
                    : 'text-imperial-300 hover:text-imperial-200 hover:bg-imperial-800/30 border-imperial-700/30 bg-gothic-darker/80'
                }`}
              >
                <span className="gothic-text-shadow">ALL ECHOES</span>
              </button>
              <button
                onClick={() => setSelectedFaction('humans')}
                className={`px-6 py-3 border font-tech font-medium text-sm tracking-wide transition-all duration-300 relative group ${
                  selectedFaction === 'humans'
                    ? 'bg-humans-600/80 text-humans-100 border-humans-400/50 box-glow-humans'
                    : 'text-humans-300 hover:text-humans-200 hover:bg-humans-800/30 border-humans-700/30 bg-gothic-darker/80'
                }`}
              >
                <span className="gothic-text-shadow">🛡️ IMPERIAL</span>
              </button>
              <button
                onClick={() => setSelectedFaction('aliens')}
                className={`px-6 py-3 border font-tech font-medium text-sm tracking-wide transition-all duration-300 relative group ${
                  selectedFaction === 'aliens'
                    ? 'bg-aliens-600/80 text-aliens-100 border-aliens-400/50 box-glow-aliens'
                    : 'text-aliens-300 hover:text-aliens-200 hover:bg-aliens-800/30 border-aliens-700/30 bg-gothic-darker/80'
                }`}
              >
                <span className="gothic-text-shadow">👽 ALIEN</span>
              </button>
              <button
                onClick={() => setSelectedFaction('robots')}
                className={`px-6 py-3 border font-tech font-medium text-sm tracking-wide transition-all duration-300 relative group ${
                  selectedFaction === 'robots'
                    ? 'bg-robots-600/80 text-robots-100 border-robots-400/50 box-glow-robots'
                    : 'text-robots-300 hover:text-robots-200 hover:bg-robots-800/30 border-robots-700/30 bg-gothic-darker/80'
                }`}
              >
                <span className="gothic-text-shadow">🤖 MACHINE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards Grid - Tactical Display */}
        <div className="flex flex-wrap justify-center gap-4">
          {/* Mock card entries using UnifiedCard */}
          {Array.from({ length: 24 }).map((_, i) => {
            const mockFactions: Faction[] = ['humans', 'aliens', 'robots'];
            const faction = mockFactions[i % 3];
            const factionNames = {
              humans: 'IMPERIAL',
              aliens: 'ALIEN',
              robots: 'MACHINE'
            };

            // Create mock card data
            const mockCard: GameCard = {
              id: `collection-mock-${i}`,
              name: `${factionNames[faction as keyof typeof factionNames]} ECHO ${i + 1}`,
              cost: (i % 10) + 1,
              attack: (i % 5) + 1,
              health: (i % 5) + 2,
              maxHealth: (i % 5) + 2,
              faction: faction as Faction,
              type: i % 2 === 0 ? 'unit' : 'spell',
              abilities: i % 3 === 0 ? [`${factionNames[faction as keyof typeof factionNames]} tactical ability`, 'Enhanced combat protocols'] : [],
              range: i % 2 === 0 ? (i % 3) + 1 : undefined, // Units have range 1-3, spells don't
              rarity: (['common', 'rare', 'epic', 'legendary'] as const)[i % 4]
            };

            return (
              <UnifiedCard
                key={i}
                card={mockCard}
                cardSize="xl"
                onClick={() => console.log(`Clicked card: ${mockCard.name}`)}
                className="group"
              />
            );
          })}
        </div>

        {/* Tactical Intelligence Summary */}
        <div className="mt-16 text-center">
          <div className="bg-gothic-darkest/90 backdrop-blur-sm border-2 border-imperial-700/50 p-8 relative scanlines inline-block">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

            <div className="mb-4 flex justify-center">
              <div className="text-imperial-400 text-2xl font-gothic icon-glow-imperial">⚡</div>
            </div>

            <h3 className="text-2xl font-gothic font-bold text-imperial-400 mb-4 gothic-text-shadow tracking-wider">
              WAR ARCHIVES STATUS
            </h3>

            <div className="space-y-3">
              <p className="text-imperial-200 font-tech font-medium tracking-wide">
                ◉ ALL 360 ECHOES ACCESSIBLE • EQUAL WAR CONDITIONS
              </p>
              <p className="text-imperial-300 font-tech text-sm opacity-80">
                No collection barriers • Pure tactical warfare
              </p>
              <div className="mt-4 pt-4 border-t border-imperial-600/30">
                <p className="text-void-400 font-tech italic text-sm gothic-text-shadow">
                  "Victory is earned through warfare, not through wealth..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;