/**
 * UnifiedCard Component Type Definitions
 * Classic TCG layout with Gothic theme preservation across all contexts
 */
import type { GameCard, Faction } from '@/types';

export type CardContext = 'game' | 'collection' | 'deck-builder';
export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'responsive';

export interface CardDimensions {
  width: number;
  height: number;
}

export interface CardSizeConfig {
  xs: CardDimensions;    // Extra small: 96x134
  sm: CardDimensions;    // Small: 128x179
  md: CardDimensions;    // Medium: 160x224
  lg: CardDimensions;    // Large: 192x269
  xl: CardDimensions;    // Extra large: 224x314
  xxl: CardDimensions;   // Extra extra large: 256x358
  responsive: 'auto';    // CSS-based responsive
}

export interface UnifiedCardProps {
  // Core card data
  card: GameCard;

  // Context and sizing
  context?: CardContext;
  size?: CardSize;
  cardSize?: CardSize; // Alias for size - easier to use
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

  // Animation and interaction overrides
  disableAnimations?: boolean;
  customAnimations?: CardAnimationVariants;
}

export interface CardAnimationVariants {
  [key: string]: any; // Index signature for Framer Motion Variants
  idle?: any;
  hover?: any;
  dragging?: any;
  selected?: any;
  disabled?: any;
}

export interface ContextStyles {
  cursor: string;
  hover: string;
  interactions: string[];
  animations?: CardAnimationVariants;
}

export interface FactionStyles {
  border: string;
  bg: string;
  text: string;
  accent: string;
  glow: string;
  gradient: string;
}

export interface CardLayoutConfig {
  // Header area (cost, rarity, type indicators)
  header: {
    height: string;
    padding: string;
  };

  // Art area (prominent center placement)
  art: {
    aspectRatio: string;
    height: string; // 40-50% of card height
  };

  // Footer area (name, stats, abilities)
  footer: {
    height: string;
    padding: string;
  };
}

export interface CardThemeConfig {
  // Gothic theme elements
  gothic?: {
    borderRadius?: string;
    backdropBlur?: string;
    scanlines?: boolean;
    textShadow?: boolean;
    borderGradient?: boolean;
  };

  // Faction-specific theming
  faction?: {
    colorScheme?: FactionStyles;
    glowEffects?: boolean;
    atmosphericEffects?: boolean;
  };
}

export interface CardInteractionConfig {
  // Drag and drop
  dragDrop: {
    enabled: boolean;
    customPreview?: boolean;
    touchSupport?: boolean;
  };

  // Selection states
  selection: {
    enabled: boolean;
    multiSelect?: boolean;
    visualFeedback: boolean;
  };

  // Click interactions
  click: {
    enabled: boolean;
    doubleClick?: boolean;
    longPress?: boolean;
  };
}

// Pre-defined size configurations
export const CARD_SIZES: CardSizeConfig = {
  xs: { width: 96, height: 134 },    // Extra small
  sm: { width: 128, height: 179 },   // Small
  md: { width: 160, height: 224 },   // Medium (new default)
  lg: { width: 192, height: 269 },   // Large
  xl: { width: 224, height: 314 },   // Extra large
  xxl: { width: 256, height: 358 },  // Extra extra large
  responsive: 'auto'                 // CSS-based responsive
};

// Context-specific default configurations
export const CONTEXT_CONFIGS: Record<CardContext, {
  defaultSize: CardSize;
  interactions: CardInteractionConfig;
  theme: Partial<CardThemeConfig>;
  layout: Partial<CardLayoutConfig>;
}> = {
  game: {
    defaultSize: 'lg',
    interactions: {
      dragDrop: { enabled: true, customPreview: true, touchSupport: true },
      selection: { enabled: true, visualFeedback: true },
      click: { enabled: true, longPress: true }
    },
    theme: {
      gothic: { scanlines: true, textShadow: true, borderGradient: true },
      faction: { glowEffects: true, atmosphericEffects: false }
    },
    layout: {
      header: { height: '18%', padding: 'p-2' },
      art: { aspectRatio: '16/9', height: '52%' },
      footer: { height: '30%', padding: 'px-2 pb-2' }
    }
  },

  collection: {
    defaultSize: 'lg',
    interactions: {
      dragDrop: { enabled: false },
      selection: { enabled: false, visualFeedback: true },
      click: { enabled: true }
    },
    theme: {
      gothic: { scanlines: true, textShadow: true, borderGradient: true },
      faction: { glowEffects: true, atmosphericEffects: false }
    },
    layout: {
      header: { height: '18%', padding: 'p-2' },
      art: { aspectRatio: '16/9', height: '52%' },
      footer: { height: '30%', padding: 'px-2 pb-2' }
    }
  },

  'deck-builder': {
    defaultSize: 'lg',
    interactions: {
      dragDrop: { enabled: false },
      selection: { enabled: false, visualFeedback: true },
      click: { enabled: true, doubleClick: true }
    },
    theme: {
      gothic: { scanlines: true, textShadow: true, borderGradient: true },
      faction: { glowEffects: true, atmosphericEffects: false }
    },
    layout: {
      header: { height: '18%', padding: 'p-2' },
      art: { aspectRatio: '16/9', height: '52%' },
      footer: { height: '30%', padding: 'px-2 pb-2' }
    }
  }
};

// Animation variants for different contexts and states
export const DEFAULT_CARD_ANIMATIONS: CardAnimationVariants = {
  idle: {
    scale: 1,
    rotateY: 0,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  hover: {
    scale: 1.05,
    y: -8,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  dragging: {
    scale: 1.1,
    rotateY: 5,
    zIndex: 1000,
    transition: { duration: 0.1, ease: "easeOut" }
  },
  selected: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  disabled: {
    scale: 0.98,
    opacity: 0.6,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Faction-specific style configurations
export const FACTION_STYLE_CONFIGS: Record<Faction, (canPlay: boolean, isDragging: boolean) => FactionStyles> = {
  humans: (canPlay: boolean, isDragging: boolean) => ({
    border: canPlay ? 'border-humans-600' : 'border-humans-800/50',
    bg: canPlay ? 'bg-gradient-to-br from-humans-50 to-humans-100' : 'bg-humans-900/20',
    text: canPlay ? 'text-humans-900' : 'text-humans-400',
    accent: 'text-humans-600',
    glow: isDragging ? 'card-glow-humans animate-pulse' : 'card-glow-humans',
    gradient: 'from-humans-200 to-humans-300'
  }),

  aliens: (canPlay: boolean, isDragging: boolean) => ({
    border: canPlay ? 'border-aliens-700' : 'border-aliens-800/50',
    bg: canPlay ? 'bg-gradient-to-br from-aliens-50 to-aliens-100' : 'bg-aliens-900/20',
    text: canPlay ? 'text-aliens-900' : 'text-aliens-400',
    accent: 'text-aliens-700',
    glow: isDragging ? 'card-glow-aliens animate-pulse' : 'card-glow-aliens',
    gradient: 'from-aliens-200 to-aliens-300'
  }),

  robots: (canPlay: boolean, isDragging: boolean) => ({
    border: canPlay ? 'border-robots-600' : 'border-robots-800/50',
    bg: canPlay ? 'bg-gradient-to-br from-robots-50 to-robots-100' : 'bg-robots-900/20',
    text: canPlay ? 'text-robots-900' : 'text-robots-400',
    accent: 'text-robots-600',
    glow: isDragging ? 'card-glow-robots animate-pulse' : 'card-glow-robots',
    gradient: 'from-robots-200 to-robots-300'
  })
};