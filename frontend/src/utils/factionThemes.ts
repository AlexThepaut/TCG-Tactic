/**
 * Faction Theme Utilities
 * Provides consistent color schemes and styling for each faction
 */

export type Faction = 'humans' | 'aliens' | 'robots';

export interface FactionTheme {
  // Base colors
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  dark: string;

  // Text colors
  text: {
    primary: string;
    secondary: string;
    accent: string;
    onPrimary: string;
    onSecondary: string;
  };

  // Background variations
  background: {
    primary: string;
    secondary: string;
    subtle: string;
    hover: string;
    active: string;
  };

  // Border styles
  border: {
    primary: string;
    secondary: string;
    accent: string;
    subtle: string;
  };

  // UI state colors
  states: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Gradients
  gradients: {
    primary: string;
    secondary: string;
    subtle: string;
  };
}

export const factionThemes: Record<Faction, FactionTheme> = {
  humans: {
    // Humans: Blue-based theme representing discipline and coordination
    primary: 'bg-humans-600',
    secondary: 'bg-humans-700',
    accent: 'bg-humans-500',
    light: 'bg-humans-100',
    dark: 'bg-humans-900',

    text: {
      primary: 'text-humans-700',
      secondary: 'text-humans-600',
      accent: 'text-humans-500',
      onPrimary: 'text-white',
      onSecondary: 'text-humans-100',
    },

    background: {
      primary: 'bg-humans-600',
      secondary: 'bg-humans-700',
      subtle: 'bg-humans-50',
      hover: 'hover:bg-humans-700',
      active: 'active:bg-humans-800',
    },

    border: {
      primary: 'border-humans-600',
      secondary: 'border-humans-700',
      accent: 'border-humans-500',
      subtle: 'border-humans-200',
    },

    states: {
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      info: 'bg-humans-600',
    },

    gradients: {
      primary: 'bg-gradient-to-r from-humans-600 to-humans-700',
      secondary: 'bg-gradient-to-br from-humans-500 to-humans-800',
      subtle: 'bg-gradient-to-t from-humans-50 to-humans-100',
    },
  },

  aliens: {
    // Aliens: Purple-based theme representing evolution and adaptation
    primary: 'bg-aliens-700',
    secondary: 'bg-aliens-800',
    accent: 'bg-aliens-600',
    light: 'bg-aliens-100',
    dark: 'bg-aliens-900',

    text: {
      primary: 'text-aliens-700',
      secondary: 'text-aliens-600',
      accent: 'text-aliens-500',
      onPrimary: 'text-white',
      onSecondary: 'text-aliens-100',
    },

    background: {
      primary: 'bg-aliens-700',
      secondary: 'bg-aliens-800',
      subtle: 'bg-aliens-50',
      hover: 'hover:bg-aliens-800',
      active: 'active:bg-aliens-900',
    },

    border: {
      primary: 'border-aliens-700',
      secondary: 'border-aliens-800',
      accent: 'border-aliens-600',
      subtle: 'border-aliens-200',
    },

    states: {
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      info: 'bg-aliens-700',
    },

    gradients: {
      primary: 'bg-gradient-to-r from-aliens-700 to-aliens-800',
      secondary: 'bg-gradient-to-br from-aliens-600 to-aliens-900',
      subtle: 'bg-gradient-to-t from-aliens-50 to-aliens-100',
    },
  },

  robots: {
    // Robots: Red-based theme representing persistence and technology
    primary: 'bg-robots-600',
    secondary: 'bg-robots-700',
    accent: 'bg-robots-500',
    light: 'bg-robots-100',
    dark: 'bg-robots-900',

    text: {
      primary: 'text-robots-700',
      secondary: 'text-robots-600',
      accent: 'text-robots-500',
      onPrimary: 'text-white',
      onSecondary: 'text-robots-100',
    },

    background: {
      primary: 'bg-robots-600',
      secondary: 'bg-robots-700',
      subtle: 'bg-robots-50',
      hover: 'hover:bg-robots-700',
      active: 'active:bg-robots-800',
    },

    border: {
      primary: 'border-robots-600',
      secondary: 'border-robots-700',
      accent: 'border-robots-500',
      subtle: 'border-robots-200',
    },

    states: {
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      info: 'bg-robots-600',
    },

    gradients: {
      primary: 'bg-gradient-to-r from-robots-600 to-robots-700',
      secondary: 'bg-gradient-to-br from-robots-500 to-robots-800',
      subtle: 'bg-gradient-to-t from-robots-50 to-robots-100',
    },
  },
};

/**
 * Get theme configuration for a specific faction
 */
export const getFactionTheme = (faction: Faction): FactionTheme => {
  return factionThemes[faction];
};

/**
 * Generate CSS classes for faction-specific styling
 */
export const getFactionClasses = (
  faction: Faction,
  variant: 'primary' | 'secondary' | 'accent' | 'subtle' = 'primary'
) => {
  const theme = getFactionTheme(faction);

  switch (variant) {
    case 'primary':
      return {
        background: theme.background.primary,
        text: theme.text.onPrimary,
        border: theme.border.primary,
        hover: theme.background.hover,
        active: theme.background.active,
      };
    case 'secondary':
      return {
        background: theme.background.secondary,
        text: theme.text.onSecondary,
        border: theme.border.secondary,
        hover: theme.background.hover,
        active: theme.background.active,
      };
    case 'accent':
      return {
        background: theme.accent,
        text: theme.text.onPrimary,
        border: theme.border.accent,
        hover: theme.background.hover,
        active: theme.background.active,
      };
    case 'subtle':
      return {
        background: theme.background.subtle,
        text: theme.text.primary,
        border: theme.border.subtle,
        hover: 'hover:bg-gray-100',
        active: 'active:bg-gray-200',
      };
    default:
      return getFactionClasses(faction, 'primary');
  }
};

/**
 * Get faction color indicator (small colored dot/badge)
 */
export const getFactionIndicator = (faction: Faction): string => {
  const baseClasses = 'w-3 h-3 rounded-full';
  const theme = getFactionTheme(faction);
  return `${baseClasses} ${theme.primary}`;
};

/**
 * Get faction gradient classes
 */
export const getFactionGradient = (
  faction: Faction,
  variant: 'primary' | 'secondary' | 'subtle' = 'primary'
): string => {
  const theme = getFactionTheme(faction);
  return theme.gradients[variant];
};

/**
 * Format faction name with proper capitalization
 */
export const formatFactionName = (faction: Faction): string => {
  return faction.charAt(0).toUpperCase() + faction.slice(1);
};

/**
 * Get faction formation description
 */
export const getFactionFormation = (faction: Faction): string => {
  switch (faction) {
    case 'humans':
      return 'Tactical Phalanx';
    case 'aliens':
      return 'Living Swarm';
    case 'robots':
      return 'Immortal Army';
    default:
      return 'Unknown Formation';
  }
};

/**
 * Get faction ability description
 */
export const getFactionAbility = (faction: Faction): string => {
  switch (faction) {
    case 'humans':
      return 'Ultimate Rampart: Complete lines get +2 ATK/+1 HP';
    case 'aliens':
      return 'Evolutionary Adaptation: Dead aliens reduce next summon cost by 1';
    case 'robots':
      return 'Reanimation Protocols: 30% chance to resurrect with 1 HP';
    default:
      return 'No special ability';
  }
};

/**
 * Utility class generator for consistent faction styling
 */
export class FactionStyleBuilder {
  private faction: Faction;
  private classes: string[] = [];

  constructor(faction: Faction) {
    this.faction = faction;
  }

  background(variant: 'primary' | 'secondary' | 'subtle' = 'primary'): this {
    const theme = getFactionTheme(this.faction);
    this.classes.push(theme.background[variant]);
    return this;
  }

  text(variant: 'primary' | 'secondary' | 'accent' | 'onPrimary' | 'onSecondary' = 'primary'): this {
    const theme = getFactionTheme(this.faction);
    this.classes.push(theme.text[variant]);
    return this;
  }

  border(variant: 'primary' | 'secondary' | 'accent' | 'subtle' = 'primary'): this {
    const theme = getFactionTheme(this.faction);
    this.classes.push(theme.border[variant]);
    return this;
  }

  gradient(variant: 'primary' | 'secondary' | 'subtle' = 'primary'): this {
    const theme = getFactionTheme(this.faction);
    this.classes.push(theme.gradients[variant]);
    return this;
  }

  hover(): this {
    const theme = getFactionTheme(this.faction);
    this.classes.push(theme.background.hover);
    return this;
  }

  active(): this {
    const theme = getFactionTheme(this.faction);
    this.classes.push(theme.background.active);
    return this;
  }

  build(): string {
    return this.classes.join(' ');
  }
}

/**
 * Create a faction style builder
 */
export const factionStyle = (faction: Faction): FactionStyleBuilder => {
  return new FactionStyleBuilder(faction);
};