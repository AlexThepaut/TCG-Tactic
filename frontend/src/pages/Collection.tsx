import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Collection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<'all' | 'humans' | 'aliens' | 'robots'>('all');


  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Card Collection</h1>
          <p className="text-gray-300">Browse all 360 available cards in the current rotation</p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Faction Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFaction('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFaction === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFaction('humans')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFaction === 'humans'
                    ? 'bg-humans-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🛡️ Humans
              </button>
              <button
                onClick={() => setSelectedFaction('aliens')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFaction === 'aliens'
                    ? 'bg-aliens-700 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                👽 Aliens
              </button>
              <button
                onClick={() => setSelectedFaction('robots')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFaction === 'robots'
                    ? 'bg-robots-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🤖 Robots
              </button>
            </div>
          </div>
        </div>

        {/* Cards Grid Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Mock card entries */}
          {Array.from({ length: 24 }).map((_, i) => {
            const mockFactions = ['humans', 'aliens', 'robots'] as const;
            const faction = mockFactions[i % 3];
            
            return (
              <div
                key={i}
                className={`bg-${faction}-900/30 backdrop-blur-sm rounded-lg p-4 border border-${faction}-600/30 hover:border-${faction}-500/50 transition-all duration-300 cursor-pointer group`}
              >
                <div className="aspect-card bg-gray-800 rounded-md mb-3 flex items-center justify-center text-gray-500 text-xs">
                  Card Art
                </div>
                <h3 className={`font-semibold text-${faction}-300 mb-1 text-sm`}>
                  Mock Card {i + 1}
                </h3>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Cost: {(i % 10) + 1}</span>
                  <span>ATK/HP: {(i % 5) + 1}/{(i % 5) + 2}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collection Status */}
        <div className="mt-12 text-center">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 inline-block">
            <h3 className="text-lg font-semibold text-white mb-2">Collection Status</h3>
            <p className="text-gray-300">All 360 cards available • No collection system required</p>
            <p className="text-sm text-gray-400 mt-2">
              TCG Tactique provides equal access to all cards for competitive fairness
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;