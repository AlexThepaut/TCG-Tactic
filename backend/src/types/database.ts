/**
 * Database Types for TCG Tactique
 * Type-safe interfaces matching PostgreSQL schema
 */

// Base enums matching database constraints
export type Faction = 'humans' | 'aliens' | 'robots';
export type CardType = 'unit' | 'spell';
export type GamePhase = 'resources' | 'draw' | 'actions';
export type EndReason = 'quest_completed' | 'surrender' | 'deck_empty' | 'timeout';

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// Card interface with strict typing
export interface Card {
  id: number;
  name: string;
  faction: Faction;
  type: CardType;
  cost: number; // 1-10 Void Echoes
  attack?: number; // Units only (1-20)
  hp?: number; // Units only (1-30)
  range?: string; // Units only, e.g. "1-2", "3", "1-5"
  effects: string[]; // Array of effect keywords
  set_id: string; // Rotation set identifier
  created_at: Date;
}

// Deck interface with validation constraints
export interface Deck {
  id: number;
  user_id: number;
  name: string;
  faction: Faction;
  is_valid: boolean; // True if exactly 40 cards
  created_at: Date;
  updated_at: Date;
  cards?: DeckCard[]; // Optional populated cards
}

// Deck card junction table
export interface DeckCard {
  deck_id: number;
  card_id: number;
  quantity: number; // 1-4 per card
  card?: Card; // Optional populated card data
}

// Game session interface
export interface Game {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_deck_id: number;
  player2_deck_id: number;
  winner_id?: number;
  duration_seconds?: number;
  end_reason?: EndReason;
  created_at: Date;
  ended_at?: Date;
}

// Game state snapshot for real-time gameplay
export interface GameState {
  id: number;
  game_id: number;
  player1_id: number;
  player2_id: number;
  current_player: number;
  turn: number;
  phase: GamePhase;
  board_state_json: BoardState;
  created_at: Date;
}

// Board state for real-time game synchronization
export interface BoardState {
  player1: PlayerState;
  player2: PlayerState;
  currentPlayer: number;
  turn: number;
  phase: GamePhase;
  gameOver: boolean;
  winner?: number;
}

// Individual player state within a game
export interface PlayerState {
  id: number;
  faction: Faction;
  hand: Card[]; // Cards in hand (max 7)
  board: (Card | null)[][]; // 3x5 grid with faction-specific formations
  resources: number; // Void Echoes 0-10
  deck_remaining: number; // Cards left in deck
  graveyard: Card[]; // Dead cards
  quest_id?: string; // Secret victory condition
  quest_progress?: number; // Progress toward quest completion
}

// User statistics for performance tracking
export interface UserStats {
  user_id: number;
  total_games: number;
  total_wins: number;
  humans_games: number;
  humans_wins: number;
  aliens_games: number;
  aliens_wins: number;
  robots_games: number;
  robots_wins: number;
  updated_at: Date;
}

// Formation patterns for each faction
export interface FormationPattern {
  faction: Faction;
  name: string;
  pattern: boolean[][]; // 3x5 grid, true = playable position
  passive_ability: string;
}

// Quest definitions for victory conditions
export interface Quest {
  id: string;
  faction: Faction;
  name: string;
  description: string;
  condition_type: 'elimination' | 'territory' | 'synergy' | 'survival';
  target_value: number;
  completion_check: string; // JSON condition for validation
}

// Card effect definitions
export interface CardEffect {
  keyword: string;
  description: string;
  faction?: Faction; // Some effects are faction-specific
  triggers: string[]; // When effect activates
  parameters?: Record<string, any>; // Effect-specific parameters
}

// Database query result types for common operations
export interface DeckWithCards extends Deck {
  cards: (DeckCard & { card: Card })[];
  total_cards: number;
}

export interface GameWithPlayers extends Game {
  player1: Pick<User, 'id' | 'username'>;
  player2: Pick<User, 'id' | 'username'>;
  winner?: Pick<User, 'id' | 'username'>;
}

export interface UserStatsWithWinRate extends UserStats {
  total_win_rate: number;
  humans_win_rate: number;
  aliens_win_rate: number;
  robots_win_rate: number;
  favorite_faction: Faction;
}

// Validation constraints as constants
export const CONSTRAINTS = {
  DECK_SIZE: 40,
  MAX_CARD_COPIES: 4,
  MIN_COST: 1,
  MAX_COST: 10,
  MIN_RESOURCES: 0,
  MAX_RESOURCES: 10,
  MAX_HAND_SIZE: 7,
  BOARD_WIDTH: 5,
  BOARD_HEIGHT: 3,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  DECK_NAME_MAX_LENGTH: 50,
  CARD_NAME_MAX_LENGTH: 100,
} as const;

// Formation patterns for each faction
export const FORMATION_PATTERNS: Record<Faction, boolean[][]> = {
  humans: [
    // "Tactical Phalanx" - disciplined formation
    [false, true, true, true, false],
    [false, true, true, true, false],
    [false, true, true, true, false],
  ],
  aliens: [
    // "Living Swarm" - adaptive formation
    [false, true, true, true, false],
    [true, true, true, true, true],
    [false, false, true, false, false],
  ],
  robots: [
    // "Immortal Army" - persistent formation
    [true, true, true, true, true],
    [false, false, true, false, false],
    [false, true, true, true, false],
  ],
} as const;

// Type guards for runtime validation
export function isValidFaction(value: string): value is Faction {
  return ['humans', 'aliens', 'robots'].includes(value);
}

export function isValidCardType(value: string): value is CardType {
  return ['unit', 'spell'].includes(value);
}

export function isValidGamePhase(value: string): value is GamePhase {
  return ['resources', 'draw', 'actions'].includes(value);
}

export function isValidEndReason(value: string): value is EndReason {
  return ['quest_completed', 'surrender', 'deck_empty', 'timeout'].includes(value);
}

// Utility types for API responses
export type CreateUserRequest = Pick<User, 'username' | 'email'> & { password: string };
export type CreateDeckRequest = Pick<Deck, 'name' | 'faction'> & { cards: { card_id: number; quantity: number }[] };
export type UpdateDeckRequest = Partial<Pick<Deck, 'name'>> & { cards?: { card_id: number; quantity: number }[] };

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
};