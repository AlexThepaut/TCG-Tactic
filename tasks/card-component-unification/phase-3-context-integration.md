# Phase 3: Context Integration

## Objective
Integrate the unified card component across all application contexts (game, collection, deck builder) while maintaining consistent visual design and context-appropriate functionality.

## Context Analysis

### Game Context Integration
**Location**: `/frontend/src/components/game/Card.tsx` → `/frontend/src/components/shared/UnifiedCard.tsx`
**Requirements**:
- Battlefield grid compatibility
- Drag-and-drop functionality
- Resource/affordability checking
- Turn-based interaction states
- Hand position management

### Collection Context Integration
**Location**: `/frontend/src/pages/Collection.tsx`
**Requirements**:
- Replace inline mock cards with unified component
- Grid layout compatibility (2-6 columns responsive)
- Search/filter integration
- Browse and selection functionality

### Deck Builder Context Integration
**Location**: `/frontend/src/pages/DeckBuilder.tsx`
**Requirements**:
- Replace inline mock cards with unified component
- Add/remove deck functionality
- Quantity tracking and limits
- Faction filtering integration

## Component Implementation Strategy

### Core UnifiedCard Component

```typescript
// /frontend/src/components/shared/UnifiedCard.tsx
import React, { memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/solid';

import { useDragCard } from '@/hooks/useDragDrop';
import type { GameCard, Faction, CardContext } from '@/types';

interface UnifiedCardProps {
  // Core data
  card: GameCard;
  context: CardContext;

  // Sizing and layout
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
  className?: string;

  // Context-specific props
  // Game context
  handIndex?: number;
  resources?: number;
  faction?: Faction;
  isPlayable?: boolean;
  isSelected?: boolean;

  // Collection/Deck builder context
  quantity?: number;
  isInDeck?: boolean;
  canAddToDeck?: boolean;
  deckLimit?: number;

  // Interaction handlers
  onClick?: (card: GameCard, context?: any) => void;
  onDragStart?: (card: GameCard, handIndex?: number) => void;
  onDragEnd?: (card: GameCard, handIndex?: number, didDrop?: boolean) => void;
  onTouch?: (e: React.TouchEvent, card: GameCard) => void;
  onAddToDeck?: (card: GameCard) => void;
  onRemoveFromDeck?: (card: GameCard) => void;
}

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  card,
  context,
  size = 'md',
  className,

  // Game context props
  handIndex,
  resources = 0,
  faction,
  isPlayable = true,
  isSelected = false,

  // Collection/deck context props
  quantity = 0,
  isInDeck = false,
  canAddToDeck = true,
  deckLimit = 2,

  // Handlers
  onClick,
  onDragStart,
  onDragEnd,
  onTouch,
  onAddToDeck,
  onRemoveFromDeck
}) => {
  // Context-aware calculations
  const canAfford = useMemo(() => {
    return context === 'game' ? card.cost <= resources : true;
  }, [context, card.cost, resources]);

  const canPlay = useMemo(() => {
    return context === 'game' ? isPlayable && canAfford : true;
  }, [context, isPlayable, canAfford]);

  // Drag & drop (game context only)
  const dragConfig = useMemo(() => {
    if (context !== 'game') return null;
    return {
      faction,
      resources,
      onDragStart: (item: any) => onDragStart?.(item.card, item.handIndex),
      onDragEnd: (item: any, didDrop: boolean) =>
        onDragEnd?.(item.card, item.handIndex, didDrop)
    };
  }, [context, faction, resources, onDragStart, onDragEnd]);

  const { isDragging, canDrag, drag } = useDragCard(
    context === 'game' ? card : null,
    handIndex || 0,
    dragConfig
  );

  // Context-aware styling
  const cardStyles = useMemo(() => {
    const cardFaction = faction || card.faction;

    const sizeClasses = {
      xs: 'w-20 h-28',
      sm: 'w-24 h-32',
      md: 'w-28 h-36',
      lg: 'w-32 h-44',
      xl: 'w-36 h-50',
      responsive: context === 'game'
        ? 'w-full max-w-32 aspect-[5/7]'
        : 'w-full aspect-[5/7]'
    };

    const factionStyles = {
      border: canPlay ? `border-${cardFaction}-600` : `border-${cardFaction}-800/50`,
      bg: canPlay
        ? `bg-gradient-to-br from-${cardFaction}-900/10 to-${cardFaction}-800/5`
        : `bg-${cardFaction}-900/20`,
      text: canPlay ? `text-${cardFaction}-200` : `text-${cardFaction}-400`,
      accent: `text-${cardFaction}-400`,
      glow: isDragging ? `shadow-lg shadow-${cardFaction}-500/30` : ''
    };

    const contextClasses = {
      game: 'cursor-grab hover:transform hover:scale-105 hover:-translate-y-2',
      collection: 'cursor-pointer hover:transform hover:scale-102 hover:-translate-y-1',
      'deck-builder': 'cursor-pointer hover:transform hover:scale-102 hover:-translate-y-1'
    };

    return {
      ...factionStyles,
      sizeClass: sizeClasses[size],
      contextClass: contextClasses[context],
      canInteract: canPlay || context !== 'game'
    };
  }, [faction, card.faction, canPlay, isDragging, size, context]);

  // Event handlers
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick && cardStyles.canInteract) {
      onClick(card, { handIndex, context });
    }
  }, [onClick, card, handIndex, context, cardStyles.canInteract]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (onTouch) {
      onTouch(e, card);
    }
  }, [onTouch, card]);

  const handleAddToDeck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToDeck && canAddToDeck && quantity < deckLimit) {
      onAddToDeck(card);
    }
  }, [onAddToDeck, canAddToDeck, quantity, deckLimit, card]);

  const handleRemoveFromDeck = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromDeck && quantity > 0) {
      onRemoveFromDeck(card);
    }
  }, [onRemoveFromDeck, quantity, card]);

  // Animation variants
  const cardVariants = {
    idle: { scale: 1, y: 0, rotateY: 0 },
    hover: { scale: context === 'game' ? 1.05 : 1.02, y: context === 'game' ? -8 : -4 },
    selected: { scale: 1.02, y: -4 },
    dragging: { scale: 1.1, rotateY: 5, zIndex: 1000 }
  };

  const getVariant = () => {
    if (context === 'game' && isDragging) return 'dragging';
    if (isSelected) return 'selected';
    return 'idle';
  };

  return (
    <motion.div
      ref={context === 'game' ? drag : undefined}
      variants={cardVariants}
      initial="idle"
      animate={getVariant()}
      whileHover={cardStyles.canInteract ? "hover" : "idle"}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      className={clsx(
        // Base classes
        "relative rounded-lg overflow-hidden border-2 transition-all duration-200",
        "select-none touch-manipulation backdrop-blur-sm",

        // Size and layout
        cardStyles.sizeClass,
        "aspect-[5/7]",

        // Context-specific styling
        cardStyles.contextClass,
        cardStyles.border,
        cardStyles.bg,
        cardStyles.glow,

        // States
        cardStyles.canInteract ? "hover:shadow-lg" : "opacity-60 cursor-not-allowed",
        isSelected && "ring-2 ring-offset-2 ring-blue-500",

        // Performance
        "transform-gpu will-change-transform",

        className
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: context === 'game' && canDrag ? 'grab' : undefined
      }}
      data-testid={`card-${card.id}`}
    >
      {/* Atmospheric effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gothic-darkest opacity-90" />
        <div className={clsx(
          "absolute inset-0 opacity-20",
          "bg-gradient-to-br from-transparent via-current to-transparent",
          cardStyles.accent
        )} />
      </div>

      {/* Content container */}
      <div className="relative z-10 h-full grid grid-rows-[auto_1fr_auto]">
        {/* Header */}
        <div className="p-3 pb-2">
          <div className="flex justify-between items-start">
            {/* Cost */}
            <div className={clsx(
              "w-7 h-7 rounded-full flex items-center justify-center",
              "text-sm font-bold border-2",
              canAfford
                ? `bg-${card.faction}-600 border-${card.faction}-400 text-white`
                : 'bg-red-600 border-red-400 text-white',
              "shadow-lg"
            )}>
              {card.cost}
            </div>

            {/* Rarity */}
            {card.rarity && card.rarity !== 'common' && (
              <SparklesIcon className={clsx(
                "w-5 h-5",
                card.rarity === 'legendary' && "text-yellow-500",
                card.rarity === 'epic' && "text-purple-500",
                card.rarity === 'rare' && "text-blue-500",
                "filter drop-shadow-sm"
              )} />
            )}
          </div>
        </div>

        {/* Art area */}
        <div className="px-3 pb-2 flex-1">
          <div className={clsx(
            "w-full h-full rounded border overflow-hidden relative",
            `border-${card.faction}-600/50`
          )}>
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={clsx(
                "w-full h-full flex items-center justify-center",
                `bg-gradient-to-br from-${card.faction}-900 to-${card.faction}-800`,
                `text-${card.faction}-500`
              )}>
                <div className="text-center">
                  {card.type === 'unit' ? (
                    <ShieldCheckIcon className="w-8 h-8 mx-auto mb-1 opacity-70" />
                  ) : (
                    <BoltIcon className="w-8 h-8 mx-auto mb-1 opacity-70" />
                  )}
                  <div className="text-xs font-tech tracking-wider opacity-60">
                    CLASSIFIED
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats/Footer */}
        <div className="p-3 pt-1">
          {/* Name */}
          <h3 className={clsx(
            "text-sm font-gothic font-bold mb-2 line-clamp-2 leading-tight",
            cardStyles.text,
            "text-shadow-sm"
          )}>
            {card.name}
          </h3>

          {/* Stats or actions */}
          <div className="flex justify-between items-center">
            {card.type === 'unit' && (
              <>
                {/* Attack */}
                <div className="flex items-center gap-1">
                  <BoltIcon className={clsx("w-4 h-4", cardStyles.accent)} />
                  <span className={clsx("text-sm font-bold", cardStyles.text)}>
                    {card.attack}
                  </span>
                </div>

                {/* Health */}
                <div className="flex items-center gap-1">
                  <HeartIcon className={clsx("w-4 h-4", cardStyles.accent)} />
                  <span className={clsx("text-sm font-bold", cardStyles.text)}>
                    {card.health}
                  </span>
                </div>
              </>
            )}

            {/* Deck builder actions */}
            {context === 'deck-builder' && (
              <div className="flex items-center gap-2 ml-auto">
                {quantity > 0 && (
                  <span className={clsx("text-sm font-bold", cardStyles.text)}>
                    {quantity}x
                  </span>
                )}
                <button
                  onClick={handleAddToDeck}
                  disabled={!canAddToDeck || quantity >= deckLimit}
                  className={clsx(
                    "p-1 rounded border transition-all",
                    canAddToDeck && quantity < deckLimit
                      ? `bg-${card.faction}-600 border-${card.faction}-500 text-white hover:bg-${card.faction}-500`
                      : 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed',
                    "text-xs"
                  )}
                >
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Type badge */}
      <div className="absolute top-2 right-2 z-20">
        <div className="px-2 py-1 bg-black/60 text-white text-xs font-bold uppercase rounded">
          {card.type}
        </div>
      </div>

      {/* Dragging indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-500/10 rounded-lg"
          />
        )}
      </AnimatePresence>

      {/* Unaffordable overlay (game context) */}
      {context === 'game' && !canAfford && (
        <div className="absolute inset-0 bg-red-900/40 rounded-lg backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-white text-xs font-bold bg-red-600 px-2 py-1 rounded">
            Need {card.cost - resources}
          </div>
        </div>
      )}

      {/* Quantity indicator (deck builder) */}
      {context === 'deck-builder' && quantity > 0 && (
        <div className="absolute -top-2 -right-2 z-30">
          <div className={clsx(
            "w-6 h-6 rounded-full flex items-center justify-center",
            "text-xs font-bold text-white",
            `bg-${card.faction}-600 border-2 border-${card.faction}-400`
          )}>
            {quantity}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(UnifiedCard);
```

## Context-Specific Integration

### Game Context Integration

```typescript
// /frontend/src/components/game/GameBoard.tsx
import UnifiedCard from '@/components/shared/UnifiedCard';

const GameBoard = ({ gameState, onCardPlay, onCardSelect }) => {
  return (
    <div className="game-hand grid grid-cols-5 gap-2">
      {gameState.currentPlayer.hand.map((card, index) => (
        <UnifiedCard
          key={`${card.id}-${index}`}
          card={card}
          context="game"
          size="responsive"
          handIndex={index}
          resources={gameState.currentPlayer.resources}
          faction={gameState.currentPlayer.faction}
          isPlayable={gameState.canPlayCard(card)}
          isSelected={gameState.selectedCard?.id === card.id}
          onDragStart={onCardPlay}
          onSelect={onCardSelect}
          className="max-h-44" // Battlefield constraint
        />
      ))}
    </div>
  );
};
```

### Collection Context Integration

```typescript
// /frontend/src/pages/Collection.tsx (updated)
import UnifiedCard from '@/components/shared/UnifiedCard';

const Collection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('all');
  const [cards, setCards] = useState([]); // Real card data

  // Filter cards based on search and faction
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFaction = selectedFaction === 'all' || card.faction === selectedFaction;
      return matchesSearch && matchesFaction;
    });
  }, [cards, searchTerm, selectedFaction]);

  const handleCardClick = (card) => {
    // Handle card selection/preview
    console.log('Card selected:', card);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Existing atmospheric effects and header */}

      {/* Cards Grid - Updated */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredCards.map((card) => (
          <UnifiedCard
            key={card.id}
            card={card}
            context="collection"
            size="responsive"
            onClick={handleCardClick}
            className="hover:z-10" // Lift on hover
          />
        ))}
      </div>
    </div>
  );
};
```

### Deck Builder Context Integration

```typescript
// /frontend/src/pages/DeckBuilder.tsx (updated)
import UnifiedCard from '@/components/shared/UnifiedCard';

const DeckBuilder = () => {
  const [selectedFaction, setSelectedFaction] = useState('humans');
  const [deck, setDeck] = useState(new Map()); // Map<cardId, quantity>
  const [availableCards, setAvailableCards] = useState([]);

  const handleAddToDeck = (card) => {
    setDeck(prev => {
      const newDeck = new Map(prev);
      const currentQuantity = newDeck.get(card.id) || 0;
      if (currentQuantity < 2 && getTotalDeckSize() < 40) {
        newDeck.set(card.id, currentQuantity + 1);
      }
      return newDeck;
    });
  };

  const handleRemoveFromDeck = (card) => {
    setDeck(prev => {
      const newDeck = new Map(prev);
      const currentQuantity = newDeck.get(card.id) || 0;
      if (currentQuantity > 1) {
        newDeck.set(card.id, currentQuantity - 1);
      } else {
        newDeck.delete(card.id);
      }
      return newDeck;
    });
  };

  const getTotalDeckSize = () => {
    return Array.from(deck.values()).reduce((sum, quantity) => sum + quantity, 0);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deck configuration sidebar */}
        <div className="lg:col-span-1">
          {/* Existing deck stats and configuration */}
        </div>

        {/* Available cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableCards
              .filter(card => card.faction === selectedFaction)
              .map((card) => (
                <UnifiedCard
                  key={card.id}
                  card={card}
                  context="deck-builder"
                  size="responsive"
                  quantity={deck.get(card.id) || 0}
                  isInDeck={deck.has(card.id)}
                  canAddToDeck={getTotalDeckSize() < 40}
                  deckLimit={2}
                  onAddToDeck={handleAddToDeck}
                  onRemoveFromDeck={handleRemoveFromDeck}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Migration Strategy

### Phase 3.1: Component Creation
1. Create `/frontend/src/components/shared/UnifiedCard.tsx`
2. Update type definitions in `/frontend/src/types/index.ts`
3. Test component in isolation (Storybook/component tests)

### Phase 3.2: Game Context Migration
1. Update existing game Card.tsx to use UnifiedCard
2. Maintain all existing drag-and-drop functionality
3. Test battlefield grid compatibility
4. Verify performance with multiple cards

### Phase 3.3: Collection Integration
1. Replace mock cards with real card data
2. Integrate UnifiedCard with search/filter functionality
3. Update responsive grid layout
4. Test with large card sets (360 cards)

### Phase 3.4: Deck Builder Integration
1. Replace mock cards with UnifiedCard
2. Implement add/remove deck functionality
3. Add quantity tracking and limits
4. Test deck validation and constraints

## Testing Strategy

### Component Testing
```typescript
// __tests__/UnifiedCard.test.tsx
describe('UnifiedCard', () => {
  it('renders correctly in game context', () => {
    render(
      <UnifiedCard
        card={mockCard}
        context="game"
        resources={5}
        faction="humans"
      />
    );
    // Test game-specific features
  });

  it('renders correctly in collection context', () => {
    render(<UnifiedCard card={mockCard} context="collection" />);
    // Test collection-specific features
  });

  it('renders correctly in deck-builder context', () => {
    render(
      <UnifiedCard
        card={mockCard}
        context="deck-builder"
        quantity={1}
        canAddToDeck={true}
      />
    );
    // Test deck builder features
  });
});
```

### Integration Testing
- Battlefield grid layout verification
- Collection responsive grid testing
- Deck builder state management testing
- Cross-context styling consistency
- Performance testing with many cards

## Success Criteria

### Functional Requirements
- [ ] Single component works across all three contexts
- [ ] Game drag-and-drop functionality preserved
- [ ] Collection search/filter integration complete
- [ ] Deck builder add/remove functionality working
- [ ] Responsive design works across all screen sizes

### Visual Requirements
- [ ] Classic TCG layout maintained across contexts
- [ ] Gothic theme preserved and enhanced
- [ ] Faction colors consistent across contexts
- [ ] Atmospheric effects work in all contexts
- [ ] Animations appropriate for each context

### Performance Requirements
- [ ] Component renders smoothly with 40+ cards
- [ ] Animations maintain 60fps
- [ ] Memory usage acceptable with large card sets
- [ ] No visual regressions from current implementations

## Next Phase
Proceed to Phase 4: Testing & Validation to ensure quality and performance across all contexts.