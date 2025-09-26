# Phase 1: Component Architecture Design

## Objective
Design a unified card component architecture that supports classic TCG layout with Gothic theme preservation across all application contexts.

## Current State Analysis

### Existing Components
1. **Game Card** (`/frontend/src/components/game/Card.tsx`)
   - Complex component with drag-and-drop functionality
   - Responsive sizing (w-24 h-32 to w-32 h-44)
   - Faction-specific styling and animations
   - Rich interaction states (hover, dragging, selected)

2. **Collection Page** (`/frontend/src/pages/Collection.tsx`)
   - Mock cards with inline div implementations
   - Gothic theme with faction colors
   - Simple grid layout (2-6 columns responsive)

3. **Deck Builder Page** (`/frontend/src/pages/DeckBuilder.tsx`)
   - Similar mock implementation to collection
   - Add/remove functionality with basic buttons

## Requirements Specification

### Functional Requirements

**FR-1: Single Component Architecture**
- One unified component serving all three contexts
- Context-aware behavior without changing core design
- Grid-compatible dimensions for battlefield placement

**FR-2: Classic TCG Layout**
- Art-prominent center placement (following Magic: The Gathering proportions ~2.5:3.5)
- Traditional information hierarchy:
  - Top: Cost and rarity indicators
  - Center: Large art area (~40-50% of card height)
  - Bottom: Name, stats, abilities

**FR-3: Gothic Theme Preservation**
- Maintain all existing Gothic styling elements
- Preserve faction-specific color systems
- Keep atmospheric effects and border treatments
- Maintain scanlines, glows, and text shadows

**FR-4: Responsive Design**
- Scale proportionally across screen sizes
- Maintain classic TCG aspect ratio at all sizes
- Grid-compatible for battlefield constraints

### Non-Functional Requirements

**NFR-1: Performance**
- Smooth animations and transitions
- Efficient rendering for grid displays (24+ cards)
- Hardware acceleration for transforms

**NFR-2: Accessibility**
- Keyboard navigation support
- Screen reader compatibility
- High contrast faction color schemes

**NFR-3: Maintainability**
- Single source of truth for card styling
- Modular design for easy theme updates
- Clear separation between layout and behavior

## Technical Architecture

### Component Interface Design

```typescript
interface UnifiedCardProps {
  // Core card data
  card: GameCard;

  // Context and sizing
  context: 'game' | 'collection' | 'deck-builder';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
  className?: string;

  // Interaction handlers (context-specific)
  onClick?: (card: GameCard) => void;
  onDragStart?: (card: GameCard, handIndex?: number) => void;
  onDragEnd?: (card: GameCard, handIndex?: number, didDrop?: boolean) => void;
  onTouch?: (e: React.TouchEvent, card: GameCard) => void;

  // Display states
  isPlayable?: boolean;
  isSelected?: boolean;
  isAffordable?: boolean;
  showDetails?: boolean;
  showInteractions?: boolean;

  // Game-specific props
  handIndex?: number;
  resources?: number;
  faction?: Faction;

  // Collection/Deck builder specific
  quantity?: number;
  isInDeck?: boolean;
  canAddToDeck?: boolean;
}

interface CardSizes {
  xs: { width: 80, height: 112 };    // Mobile collection
  sm: { width: 96, height: 134 };    // Mobile game
  md: { width: 112, height: 157 };   // Desktop collection
  lg: { width: 128, height: 179 };   // Desktop game
  xl: { width: 144, height: 201 };   // Large screens
  responsive: 'auto';                 // CSS-based responsive
}
```

### Layout System Architecture

```css
.card-container {
  /* Classic TCG aspect ratio: ~0.714 (2.5:3.5) */
  aspect-ratio: 5 / 7;

  /* CSS Grid for internal layout */
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header"
    "art"
    "footer";
}

.card-header {
  grid-area: header;
  /* Cost, rarity, type indicators */
}

.card-art {
  grid-area: art;
  /* Prominent art area - 40-50% of card height */
  aspect-ratio: 16 / 9; /* or card-specific ratio */
}

.card-footer {
  grid-area: footer;
  /* Name, stats, abilities */
}
```

### Context Adaptation Strategy

```typescript
const getContextStyles = (context: CardContext, size: CardSize) => {
  const baseStyles = {
    game: {
      cursor: 'grab',
      hover: 'transform scale-105',
      interactions: ['drag', 'click', 'touch']
    },
    collection: {
      cursor: 'pointer',
      hover: 'transform scale-102',
      interactions: ['click']
    },
    'deck-builder': {
      cursor: 'pointer',
      hover: 'transform scale-102',
      interactions: ['click', 'add-to-deck']
    }
  };

  return baseStyles[context];
};
```

## Implementation Strategy

### Phase 1.1: Core Component Structure
1. Create base UnifiedCard component with classic TCG grid layout
2. Implement responsive sizing system
3. Establish Gothic theme system with CSS custom properties
4. Create faction-specific styling variants

### Phase 1.2: Interaction System
1. Implement context-aware interaction handlers
2. Add drag-and-drop functionality (game context)
3. Add selection states and visual feedback
4. Implement touch/mobile interactions

### Phase 1.3: Animation System
1. Preserve existing animation variants from game card
2. Add context-specific animations
3. Implement hardware-accelerated transforms
4. Add accessibility-conscious reduced motion support

### Phase 1.4: Theme Integration
1. Port Gothic theme elements from collection pages
2. Integrate faction color systems
3. Add atmospheric effects (scanlines, glows, shadows)
4. Ensure theme consistency across contexts

## Success Criteria

### Acceptance Criteria
- [ ] Single component renders correctly in all three contexts
- [ ] Classic TCG proportions maintained across all screen sizes
- [ ] Gothic theme elements preserved and enhanced
- [ ] Drag-and-drop functionality works in game context
- [ ] Click interactions work in collection/deck-builder contexts
- [ ] Responsive design scales appropriately
- [ ] Performance meets standards (smooth 60fps animations)
- [ ] Accessibility requirements met

### Quality Gates
- [ ] Component passes all unit tests
- [ ] Visual regression tests pass for all contexts
- [ ] Performance benchmarks met
- [ ] Code review approval
- [ ] Documentation complete

## Dependencies and Constraints

### Technical Dependencies
- Framer Motion (existing animation library)
- TailwindCSS (existing styling system)
- React DnD or existing drag-drop implementation
- TypeScript definitions for GameCard interface

### Design Constraints
- Must fit in existing battlefield grid cells
- Must maintain Gothic aesthetic established in collection
- Must support existing faction color system
- Must work across existing responsive breakpoints

### Timeline Constraints
- Phase 1 completion: Architecture and base implementation
- Integration with existing codebase without breaking changes
- Gradual migration strategy to minimize disruption

## Next Phase
Proceed to Phase 2: Layout Implementation to create the detailed classic TCG layout with Gothic theme integration.