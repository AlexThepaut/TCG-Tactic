/**
 * HandDemo Component
 * Demonstration of the HearthstoneHand component with sample data
 */
import React, { useState } from 'react';
import HearthstoneHand from './HearthstoneHand';
import type { GameCard, Faction } from '@/types';

// Sample cards for testing
const sampleCards: GameCard[] = [
  {
    id: 'imperial-guard-1',
    name: 'Imperial Guardsman',
    cost: 2,
    attack: 2,
    health: 3,
    maxHealth: 3,
    faction: 'humans',
    type: 'unit',
    abilities: ['Disciplined: +1 attack when adjacent to another Imperial unit'],
    rarity: 'common'
  },
  {
    id: 'chaos-cultist-1',
    name: 'Chaos Cultist',
    cost: 1,
    attack: 1,
    health: 1,
    maxHealth: 1,
    faction: 'humans',
    type: 'unit',
    abilities: ['Fanatic: Deal 1 damage to self to deal 2 damage to enemy'],
    rarity: 'common'
  },
  {
    id: 'plasma-rifle-1',
    name: 'Plasma Rifle',
    cost: 3,
    attack: 0,
    health: 0,
    maxHealth: 0,
    faction: 'robots',
    type: 'spell',
    abilities: ['Deal 4 damage to target unit. Overcharge: Deal 6 damage instead.'],
    rarity: 'rare'
  },
  {
    id: 'space-marine-1',
    name: 'Space Marine Veteran',
    cost: 4,
    attack: 3,
    health: 4,
    maxHealth: 4,
    faction: 'humans',
    type: 'unit',
    abilities: ['Power Armor: Reduce all damage taken by 1', 'Bolter: Can attack twice per turn'],
    rarity: 'epic'
  },
  {
    id: 'warp-lightning-1',
    name: 'Warp Lightning',
    cost: 2,
    attack: 0,
    health: 0,
    maxHealth: 0,
    faction: 'aliens',
    type: 'spell',
    abilities: ['Deal 3 damage to target unit and 1 damage to adjacent units'],
    rarity: 'common'
  },
  {
    id: 'terminator-1',
    name: 'Terminator Squad',
    cost: 6,
    attack: 4,
    health: 6,
    maxHealth: 6,
    faction: 'humans',
    type: 'unit',
    abilities: ['Teleport Strike: Can be placed anywhere on the battlefield', 'Storm Bolters: Deal damage to multiple targets'],
    rarity: 'legendary'
  },
  {
    id: 'ork-boyz-1',
    name: 'Ork Boyz Mob',
    cost: 3,
    attack: 3,
    health: 2,
    maxHealth: 2,
    faction: 'aliens',
    type: 'unit',
    abilities: ['WAAAGH!: +1 attack for each other Ork unit on the battlefield'],
    rarity: 'common'
  },
  {
    id: 'tech-priest-1',
    name: 'Tech-Priest Enginseer',
    cost: 4,
    attack: 2,
    health: 4,
    maxHealth: 4,
    faction: 'robots',
    type: 'unit',
    abilities: ['Repair Protocol: Restore 2 health to target mechanical unit', 'Sacred Oil: +1 attack to adjacent robots'],
    rarity: 'rare'
  }
];

const HandDemo: React.FC = () => {
  const [faction] = useState<Faction>('humans');
  const [resources] = useState(5);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleCardSelect = (card: GameCard, index: number) => {
    setSelectedCard(card.id);
    console.log('Card selected:', card.name, 'at index', index);
  };

  const handleCardDragStart = (card: GameCard, index: number) => {
    console.log('Drag started:', card.name, 'from index', index);
  };

  const handleCardDragEnd = (card: GameCard, index: number, didDrop: boolean) => {
    console.log('Drag ended:', card.name, 'dropped:', didDrop);
  };

  return (
    <div className="relative w-full h-screen bg-gothic-black">
      {/* Demo content area */}
      <div className="p-8">
        <h1 className="text-4xl font-gothic font-bold text-imperial-400 mb-4 gothic-text-shadow">
          Hearthstone-Style Hand Demo
        </h1>
        <div className="text-imperial-200 space-y-2">
          <p>🎮 <strong>Current Faction:</strong> {faction.charAt(0).toUpperCase() + faction.slice(1)}</p>
          <p>💎 <strong>Void Echoes:</strong> {resources}/10</p>
          <p>🃏 <strong>Cards in Hand:</strong> {sampleCards.length}</p>
          {selectedCard && (
            <p>⚡ <strong>Selected Card:</strong> {sampleCards.find(c => c.id === selectedCard)?.name}</p>
          )}
        </div>

        <div className="mt-8 p-4 border border-imperial-600 rounded bg-gothic-darkest/50">
          <h2 className="text-xl font-gothic font-semibold text-imperial-300 mb-2">Features:</h2>
          <ul className="text-imperial-200 space-y-1 text-sm">
            <li>• <strong>Hover to expand:</strong> Hover over cards to see full details</li>
            <li>• <strong>Smart overlap:</strong> Cards overlap when there are more than 7</li>
            <li>• <strong>Drag & Drop:</strong> Drag cards that you can afford</li>
            <li>• <strong>Gothic theme:</strong> Warhammer 40K inspired styling</li>
            <li>• <strong>Bottom positioned:</strong> Fixed at bottom with z-index priority</li>
            <li>• <strong>Faction colors:</strong> Adapts to player faction</li>
          </ul>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 border border-blood-600 rounded bg-blood-900/20">
          <h3 className="text-lg font-gothic font-semibold text-blood-300 mb-2">Instructions:</h3>
          <div className="text-blood-200 space-y-1 text-sm">
            <p>• Move your mouse to the bottom of the screen to see the hand</p>
            <p>• Hover over cards to see them expand with full details</p>
            <p>• Try dragging affordable cards (cost ≤ {resources})</p>
            <p>• Check the console for interaction events</p>
          </div>
        </div>
      </div>

      {/* The HearthstoneHand component */}
      <HearthstoneHand
        cards={sampleCards}
        faction={faction}
        resources={resources}
        onCardSelect={handleCardSelect}
        onCardDragStart={handleCardDragStart}
        onCardDragEnd={handleCardDragEnd}
      />
    </div>
  );
};

export default HandDemo;