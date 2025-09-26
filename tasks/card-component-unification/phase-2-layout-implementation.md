# Phase 2: Layout Implementation

## Objective
Implement classic TCG card layout with integrated Gothic theme styling, maintaining visual consistency while enhancing the card's traditional structure.

## Classic TCG Layout Specification

### Card Proportions
- **Aspect Ratio**: 5:7 (~0.714) - following traditional TCG standards
- **Art Area**: 40-45% of total card height
- **Border**: Consistent frame thickness maintaining Gothic aesthetic
- **Content Areas**: Header (15%), Art (45%), Footer (40%)

### Layout Grid Structure

```css
.unified-card {
  aspect-ratio: 5 / 7;
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header"
    "art"
    "stats";

  /* Gothic container styling */
  background: var(--gothic-darkest);
  border: 2px solid var(--faction-border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
```

## Header Area Design

### Cost and Rarity Display
```typescript
// Header layout (top 15% of card)
interface CardHeader {
  cost: {
    position: 'top-left';
    size: 'circular';
    styling: 'faction-colored with Gothic frame';
  };
  rarity: {
    position: 'top-right';
    styling: 'gem or crown icon with glow effect';
  };
  type: {
    position: 'top-center or floating badge';
    styling: 'Gothic typography with backdrop';
  };
}
```

### Gothic Header Styling
```css
.card-header {
  grid-area: header;
  padding: 8px 12px 4px;
  position: relative;
  z-index: 2;

  /* Gothic scanline effect */
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--faction-color-dim) 50%,
    transparent 100%
  );
  background-size: 100% 1px;
  background-position: 0 bottom;
  background-repeat: no-repeat;
}

.card-cost {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;

  /* Gothic cost styling */
  background: var(--gothic-darker);
  border: 2px solid var(--faction-color);
  box-shadow: 0 0 12px var(--faction-color-glow);

  /* Typography */
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-gothic);
  font-weight: bold;
  font-size: 14px;
  color: var(--faction-color);
  text-shadow: 0 0 4px currentColor;
}

.card-rarity {
  position: absolute;
  top: 8px;
  right: 8px;

  /* Rarity gem effect */
  filter: drop-shadow(0 0 6px currentColor);
}
```

## Art Area Design

### Prominent Art Display
```css
.card-art {
  grid-area: art;
  position: relative;
  margin: 0 8px;
  border-radius: 4px;
  overflow: hidden;

  /* Art container with Gothic frame */
  border: 1px solid var(--faction-color-dim);
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.4);
}

.card-art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;

  /* Art enhancement */
  filter: contrast(1.1) saturation(1.1);
}

.card-art-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--faction-color-900) 0%,
    var(--faction-color-800) 50%,
    var(--faction-color-900) 100%
  );

  /* Placeholder content */
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--faction-color-500);

  /* Gothic classified effect */
  &::after {
    content: "CLASSIFIED";
    font-family: var(--font-tech);
    font-size: 10px;
    letter-spacing: 2px;
    text-shadow: 0 0 4px currentColor;
  }
}
```

### Art Frame Effects
```css
.card-art::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-radius: inherit;
  background: linear-gradient(45deg,
    var(--faction-color-dim),
    transparent 25%,
    transparent 75%,
    var(--faction-color-dim)
  ) border-box;
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  opacity: 0.6;
}
```

## Stats Area Design

### Information Layout
```css
.card-stats {
  grid-area: stats;
  padding: 8px 12px 12px;

  /* Stats container styling */
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--gothic-darker) 20%,
    var(--gothic-darker) 100%
  );

  /* Gothic scanlines */
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--faction-color) 50%,
      transparent 100%
    );
  }
}

.card-name {
  font-family: var(--font-gothic);
  font-weight: bold;
  font-size: 14px;
  color: var(--faction-color-200);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: 6px;

  /* Name styling with line clamp */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
}

.card-combat-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.stat-group {
  display: flex;
  align-items: center;
  gap: 4px;

  .stat-icon {
    width: 16px;
    height: 16px;
    color: var(--faction-color);
    filter: drop-shadow(0 0 2px currentColor);
  }

  .stat-value {
    font-family: var(--font-gothic);
    font-weight: bold;
    font-size: 14px;
    color: var(--faction-color-200);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}
```

## Gothic Theme Integration

### Faction Color System
```css
/* Faction CSS Custom Properties */
:root {
  /* Humans */
  --humans-color: #3B82F6;
  --humans-color-dim: #1E40AF;
  --humans-color-glow: rgba(59, 130, 246, 0.5);
  --humans-border: #2563EB;

  /* Aliens */
  --aliens-color: #10B981;
  --aliens-color-dim: #047857;
  --aliens-color-glow: rgba(16, 185, 129, 0.5);
  --aliens-border: #059669;

  /* Robots */
  --robots-color: #F59E0B;
  --robots-color-dim: #D97706;
  --robots-color-glow: rgba(245, 158, 11, 0.5);
  --robots-border: #F59E0B;

  /* Gothic base colors */
  --gothic-darkest: #0F0F0F;
  --gothic-darker: #1A1A1A;
  --gothic-dark: #2A2A2A;
  --void-300: #6B7280;
}

.card-humans {
  --faction-color: var(--humans-color);
  --faction-color-dim: var(--humans-color-dim);
  --faction-color-glow: var(--humans-color-glow);
  --faction-border: var(--humans-border);
}

/* Similar for aliens and robots */
```

### Atmospheric Effects
```css
.card-atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;

  /* Subtle scanning effect */
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 50%,
    transparent 100%
  );

  animation: scan 4s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.unified-card:hover .card-atmosphere {
  opacity: 1;
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Border glow effects */
.unified-card::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    45deg,
    var(--faction-color),
    transparent 25%,
    transparent 75%,
    var(--faction-color)
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.unified-card:hover::after {
  opacity: 0.6;
}
```

## Responsive Scaling System

### Size Variants
```typescript
const CardSizes = {
  xs: 'w-20 h-28',      // 80x112px - Mobile collection
  sm: 'w-24 h-32',      // 96x134px - Mobile game
  md: 'w-28 h-36',      // 112x157px - Desktop collection
  lg: 'w-32 h-44',      // 128x179px - Desktop game
  xl: 'w-36 h-50',      // 144x201px - Large screens
  responsive: 'w-full aspect-[5/7]' // CSS-based responsive
} as const;

const getCardSizeClasses = (size: CardSize, context: CardContext) => {
  // Battlefield constraints
  if (context === 'game' && size === 'responsive') {
    return 'w-full max-w-32 aspect-[5/7]'; // Grid cell constraints
  }

  return CardSizes[size];
};
```

### Typography Scaling
```css
/* Responsive typography */
.unified-card {
  /* Base typography scale */
  --font-scale: 1;

  /* Size-specific scaling */
  &.size-xs { --font-scale: 0.75; }
  &.size-sm { --font-scale: 0.875; }
  &.size-md { --font-scale: 1; }
  &.size-lg { --font-scale: 1.125; }
  &.size-xl { --font-scale: 1.25; }

  /* Apply scaling to text elements */
  .card-name { font-size: calc(14px * var(--font-scale)); }
  .card-cost { font-size: calc(14px * var(--font-scale)); }
  .stat-value { font-size: calc(14px * var(--font-scale)); }
}
```

## Animation System

### Context-Aware Animations
```css
/* Base card animations */
.unified-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Context-specific hover effects */
  &.context-game:hover {
    transform: translateY(-8px) scale(1.05);
  }

  &.context-collection:hover,
  &.context-deck-builder:hover {
    transform: translateY(-4px) scale(1.02);
  }

  /* Selection state */
  &.selected {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 0 20px var(--faction-color-glow);
  }

  /* Dragging state */
  &.dragging {
    transform: scale(1.1) rotate(5deg);
    z-index: 1000;
    opacity: 0.5;
  }
}
```

### Performance Optimizations
```css
.unified-card {
  /* Hardware acceleration */
  will-change: transform;
  transform-style: preserve-3d;

  /* Reduce repaints */
  contain: layout style paint;

  /* Smooth animations */
  backface-visibility: hidden;
}
```

## Implementation Checklist

### Layout Structure
- [ ] CSS Grid layout with classic TCG proportions
- [ ] Header area with cost and rarity positioning
- [ ] Prominent art area (40-45% height)
- [ ] Stats footer with name and combat values
- [ ] Responsive typography scaling

### Gothic Theme Integration
- [ ] Faction-specific color system
- [ ] Atmospheric effects (scanlines, glows)
- [ ] Gothic typography implementation
- [ ] Border and frame effects
- [ ] Hover state enhancements

### Animation System
- [ ] Context-aware hover animations
- [ ] Selection and dragging states
- [ ] Performance optimizations
- [ ] Accessibility motion preferences
- [ ] Smooth transitions between states

## Success Criteria
- [ ] Classic TCG layout maintains proportions across all sizes
- [ ] Gothic theme elements enhance rather than conflict with TCG structure
- [ ] Responsive scaling works from mobile to desktop
- [ ] Animations provide appropriate feedback for each context
- [ ] Performance meets 60fps standard for smooth interactions

## Next Phase
Proceed to Phase 3: Context Integration to implement the component across game, collection, and deck builder contexts.