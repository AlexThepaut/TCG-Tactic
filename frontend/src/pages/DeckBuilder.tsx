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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Deck Builder</h1>
          <p className="text-gray-300">Create tactical decks with exactly 40 cards from a single faction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deck Configuration */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Deck Configuration</h2>
              
              {/* Deck Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Faction Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Choose Faction
                </label>
                <div className="space-y-2">
                  {(Object.entries(factionConfigs) as [Faction, typeof factionConfigs.humans][]).map(([faction, config]) => (
                    <button
                      key={faction}
                      onClick={() => setSelectedFaction(faction)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                        selectedFaction === faction
                          ? `bg-${config.colors}-600/20 border-${config.colors}-500 text-white`
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{config.icon}</span>
                        <div>
                          <div className="font-semibold">{config.name}</div>
                          <div className="text-xs opacity-80">{config.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deck Stats */}
              <div className={`p-4 rounded-lg border ${
                isValidDeck 
                  ? 'bg-green-600/20 border-green-500 text-green-300'
                  : 'bg-red-600/20 border-red-500 text-red-300'
              }`}>
                <div className="text-sm font-medium mb-2">
                  Deck Status: {totalCards}/40 cards
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isValidDeck ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((totalCards / 40) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs opacity-80">
                  {isValidDeck ? '✓ Ready to play' : `Need ${40 - totalCards} more cards`}
                </div>
              </div>
            </div>

            {/* Current Deck */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Current Deck</h3>
              
              {deckCards.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No cards added yet</p>
              ) : (
                <div className="space-y-2">
                  {deckCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{card.name}</div>
                        <div className="text-xs text-gray-400">Cost: {card.cost}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">{card.count}x</span>
                        <button className="text-red-400 hover:text-red-300 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Library */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {factionConfigs[selectedFaction].icon} {factionConfigs[selectedFaction].name} Cards
                </h2>
                <div className="text-sm text-gray-400">
                  120 cards available
                </div>
              </div>

              {/* Mock Card Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 16 }).map((_, i) => {
                  const config = factionConfigs[selectedFaction];
                  
                  return (
                    <div
                      key={i}
                      className={`bg-${config.colors}-900/30 backdrop-blur-sm rounded-lg p-3 border border-${config.colors}-600/30 hover:border-${config.colors}-500/50 transition-all duration-300 cursor-pointer group relative`}
                    >
                      <div className="aspect-card bg-gray-800 rounded-md mb-2 flex items-center justify-center text-gray-500 text-xs">
                        Card Art
                      </div>
                      
                      <h3 className={`font-semibold text-${config.colors}-300 mb-1 text-sm`}>
                        {config.name} Card {i + 1}
                      </h3>
                      
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Cost: {(i % 10) + 1}</span>
                        <span>ATK/HP: {(i % 5) + 1}/{(i % 5) + 2}</span>
                      </div>

                      {/* Add to deck button */}
                      <button className={`w-full py-1 text-xs rounded-md bg-${config.colors}-600 hover:bg-${config.colors}-500 text-white transition-colors flex items-center justify-center gap-1`}>
                        <PlusIcon className="w-3 h-3" />
                        Add
                      </button>
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