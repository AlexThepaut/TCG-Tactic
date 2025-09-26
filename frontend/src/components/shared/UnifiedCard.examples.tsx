/**
 * UnifiedCard Component Usage Examples
 * Demonstrates different contexts and configurations
 */
import React from 'react';
import UnifiedCard from './UnifiedCard';
import type { GameCard, Faction } from '@/types';

// Example card data
const createMockCard = (
  id: string,
  name: string,
  faction: Faction,
  cost: number = 3,
  attack: number = 2,
  health: number = 3
): GameCard => ({
  id,
  name,
  cost,
  attack,
  health,
  maxHealth: health,
  faction,
  type: 'unit',
  abilities: [],
  rarity: 'common'
});

const ExampleCards = {
  human: createMockCard('example-1', 'Imperial Guard', 'humans', 2, 1, 3),
  alien: createMockCard('example-2', 'Void Crawler', 'aliens', 4, 3, 2),
  robot: createMockCard('example-3', 'War Machine', 'robots', 6, 4, 5)
};

/**
 * Game Context Examples
 * Shows cards as they appear in the game with drag-and-drop functionality
 */
export const GameContextExamples: React.FC = () => (
  <div className="grid grid-cols-3 gap-4 p-4 bg-gothic-darkest">
    <div className="text-center">
      <h3 className="text-humans-400 font-gothic mb-4">Humans - Game Context</h3>
      <UnifiedCard
        card={ExampleCards.human}
        context="game"
        faction="humans"
        resources={10}
        handIndex={0}
        isPlayable={true}
        showDetails={true}
        onClick={() => console.log('Game card clicked')}
        onDragStart={() => console.log('Drag started')}
        onDragEnd={() => console.log('Drag ended')}
      />
    </div>

    <div className="text-center">
      <h3 className="text-aliens-400 font-gothic mb-4">Aliens - Game Context</h3>
      <UnifiedCard
        card={ExampleCards.alien}
        context="game"
        faction="aliens"
        resources={3}
        handIndex={1}
        isPlayable={false}
        showDetails={true}
        className="opacity-60"
      />
    </div>

    <div className="text-center">
      <h3 className="text-robots-400 font-gothic mb-4">Robots - Game Context</h3>
      <UnifiedCard
        card={ExampleCards.robot}
        context="game"
        faction="robots"
        resources={10}
        handIndex={2}
        isSelected={true}
        showDetails={true}
      />
    </div>
  </div>
);

/**
 * Collection Context Examples
 * Shows cards as they appear in the collection browser
 */
export const CollectionContextExamples: React.FC = () => (
  <div className="grid grid-cols-4 gap-4 p-4 bg-gothic-darkest">
    {[ExampleCards.human, ExampleCards.alien, ExampleCards.robot, ExampleCards.human].map((card, i) => (
      <div key={i} className="text-center">
        <UnifiedCard
          card={card}
          context="collection"
          size="md"
          onClick={() => console.log(`Collection card ${card.name} clicked`)}
          className="hover:scale-105 transition-transform"
        />
      </div>
    ))}
  </div>
);

/**
 * Deck Builder Context Examples
 * Shows cards as they appear in the deck builder with add functionality
 */
export const DeckBuilderContextExamples: React.FC = () => (
  <div className="grid grid-cols-3 gap-4 p-4 bg-gothic-darkest">
    <div className="text-center">
      <h3 className="text-humans-400 font-gothic mb-4">Available Cards</h3>
      <UnifiedCard
        card={ExampleCards.human}
        context="deck-builder"
        size="md"
        canAddToDeck={true}
        onClick={() => console.log('Adding card to deck')}
      />
    </div>

    <div className="text-center">
      <h3 className="text-aliens-400 font-gothic mb-4">In Deck (2x)</h3>
      <UnifiedCard
        card={ExampleCards.alien}
        context="deck-builder"
        size="md"
        quantity={2}
        isInDeck={true}
        onClick={() => console.log('Managing deck card')}
      />
    </div>

    <div className="text-center">
      <h3 className="text-robots-400 font-gothic mb-4">Max Copies</h3>
      <UnifiedCard
        card={ExampleCards.robot}
        context="deck-builder"
        size="md"
        quantity={2}
        isInDeck={true}
        canAddToDeck={false}
        className="opacity-60"
      />
    </div>
  </div>
);

/**
 * Responsive Size Examples
 * Demonstrates different size variants
 */
export const ResponsiveSizeExamples: React.FC = () => (
  <div className="flex items-end gap-4 p-4 bg-gothic-darkest">
    <div className="text-center">
      <h4 className="text-imperial-400 font-tech mb-2">XS (Mobile)</h4>
      <UnifiedCard
        card={ExampleCards.human}
        context="collection"
        size="xs"
      />
    </div>

    <div className="text-center">
      <h4 className="text-imperial-400 font-tech mb-2">SM</h4>
      <UnifiedCard
        card={ExampleCards.human}
        context="collection"
        size="sm"
      />
    </div>

    <div className="text-center">
      <h4 className="text-imperial-400 font-tech mb-2">MD (Default)</h4>
      <UnifiedCard
        card={ExampleCards.human}
        context="collection"
        size="md"
      />
    </div>

    <div className="text-center">
      <h4 className="text-imperial-400 font-tech mb-2">LG (Game)</h4>
      <UnifiedCard
        card={ExampleCards.human}
        context="game"
        size="lg"
        faction="humans"
        resources={10}
      />
    </div>

    <div className="text-center">
      <h4 className="text-imperial-400 font-tech mb-2">XL (Large Screen)</h4>
      <UnifiedCard
        card={ExampleCards.human}
        context="collection"
        size="xl"
      />
    </div>
  </div>
);

/**
 * Animation State Examples
 * Shows different interaction states
 */
export const AnimationStateExamples: React.FC = () => (
  <div className="grid grid-cols-3 gap-4 p-4 bg-gothic-darkest">
    <div className="text-center">
      <h3 className="text-imperial-400 font-gothic mb-4">Default State</h3>
      <UnifiedCard
        card={ExampleCards.human}
        context="collection"
        size="md"
      />
    </div>

    <div className="text-center">
      <h3 className="text-imperial-400 font-gothic mb-4">Selected State</h3>
      <UnifiedCard
        card={ExampleCards.alien}
        context="game"
        size="md"
        faction="aliens"
        resources={10}
        isSelected={true}
      />
    </div>

    <div className="text-center">
      <h3 className="text-imperial-400 font-gothic mb-4">Disabled State</h3>
      <UnifiedCard
        card={ExampleCards.robot}
        context="game"
        size="md"
        faction="robots"
        resources={2}
        isPlayable={false}
      />
    </div>
  </div>
);

/**
 * Complete Example Gallery
 * All examples in one component for testing
 */
export const UnifiedCardGallery: React.FC = () => (
  <div className="space-y-8 p-8 bg-gothic-black min-h-screen">
    <div>
      <h1 className="text-4xl font-display font-black text-imperial-400 mb-2">UnifiedCard Component Gallery</h1>
      <p className="text-void-300 font-tech">Demonstrating unified card component across all contexts</p>
    </div>

    <section>
      <h2 className="text-2xl font-gothic text-imperial-300 mb-4">Game Context</h2>
      <GameContextExamples />
    </section>

    <section>
      <h2 className="text-2xl font-gothic text-imperial-300 mb-4">Collection Context</h2>
      <CollectionContextExamples />
    </section>

    <section>
      <h2 className="text-2xl font-gothic text-imperial-300 mb-4">Deck Builder Context</h2>
      <DeckBuilderContextExamples />
    </section>

    <section>
      <h2 className="text-2xl font-gothic text-imperial-300 mb-4">Size Variants</h2>
      <ResponsiveSizeExamples />
    </section>

    <section>
      <h2 className="text-2xl font-gothic text-imperial-300 mb-4">Animation States</h2>
      <AnimationStateExamples />
    </section>
  </div>
);

export default UnifiedCardGallery;