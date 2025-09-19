// TCG Tactique - Utility Functions

import type { Faction } from '@/types';

/**
 * Combines CSS classes safely
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats time duration (seconds to readable format)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculates win rate percentage
 */
export function calculateWinRate(wins: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Gets faction color classes
 */
export function getFactionColors(faction: Faction) {
  const colors = {
    humans: {
      primary: 'humans-600',
      secondary: 'humans-700',
      text: 'humans-300',
      bg: 'humans-900/30',
      border: 'humans-600/30',
    },
    aliens: {
      primary: 'aliens-700',
      secondary: 'aliens-800',
      text: 'aliens-300',
      bg: 'aliens-900/30',
      border: 'aliens-700/30',
    },
    robots: {
      primary: 'robots-600',
      secondary: 'robots-700',
      text: 'robots-300',
      bg: 'robots-900/30',
      border: 'robots-600/30',
    },
  };

  return colors[faction];
}

/**
 * Gets faction display information
 */
export function getFactionInfo(faction: Faction) {
  const info = {
    humans: {
      name: 'Humans',
      icon: '🛡️',
      description: 'Tactical discipline and coordination',
      formation: ['-xxx-', '-xxx-', '-xxx-'],
      passive: 'Complete lines get +2 ATK/+1 HP',
    },
    aliens: {
      name: 'Aliens',
      icon: '👽',
      description: 'Evolution and adaptation',
      formation: ['-xxx-', 'xxxxx', '--x--'],
      passive: 'Dead aliens reduce next summon cost by 1',
    },
    robots: {
      name: 'Robots',
      icon: '🤖',
      description: 'Persistence and technology',
      formation: ['xxxxx', '--x--', '-xxx-'],
      passive: '30% chance to resurrect with 1 HP',
    },
  };

  return info[faction];
}

/**
 * Validates deck composition
 */
export function validateDeck(cards: Array<{ id: string; count: number; faction: Faction }>, faction: Faction) {
  const totalCards = cards.reduce((sum, card) => sum + card.count, 0);
  const errors: string[] = [];

  // Check total card count
  if (totalCards !== 40) {
    errors.push(`Deck must have exactly 40 cards (currently ${totalCards})`);
  }

  // Check faction consistency
  const invalidFactionCards = cards.filter(card => card.faction !== faction);
  if (invalidFactionCards.length > 0) {
    errors.push('All cards must be from the same faction');
  }

  // Check card count limits
  const excessCards = cards.filter(card => card.count > 2);
  if (excessCards.length > 0) {
    errors.push('Maximum 2 copies of each card allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats resource cost for display
 */
export function formatCost(cost: number): string {
  return `${cost} Void Echo${cost !== 1 ? 's' : ''}`;
}

/**
 * Generates a random game ID
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if device is mobile
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < 768;
}

/**
 * Checks if device is in landscape orientation
 */
export function isLandscapeOrientation(): boolean {
  return window.innerWidth > window.innerHeight;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};