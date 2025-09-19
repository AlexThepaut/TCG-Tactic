// TCG Tactique - Core Type Definitions

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  stats: UserStats;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  favoriteFaction: Faction | null;
}

export type Faction = 'humans' | 'aliens' | 'robots';

export interface Card {
  id: string;
  name: string;
  faction: Faction;
  type: 'unit' | 'spell';
  cost: number;
  attack?: number;
  health?: number;
  description: string;
  imageUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Deck {
  id: string;
  name: string;
  faction: Faction;
  cards: Card[];
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GameState {
  id: string;
  players: {
    player1: PlayerData;
    player2: PlayerData;
  };
  currentPlayer: string;
  turn: number;
  phase: 'resources' | 'draw' | 'actions';
  gameOver: boolean;
  winner?: string;
  createdAt: string;
}

export interface PlayerData {
  id: string;
  username: string;
  faction: Faction;
  hand: Card[];
  board: (Card | null)[][];  // 3x5 grid
  resources: number;         // Void Echoes (0-10)
  questId: string;          // Secret victory condition
  health: number;
}

export interface GameAction {
  type: 'place_unit' | 'attack' | 'end_turn' | 'surrender';
  playerId: string;
  cardId?: string;
  position?: { row: number; col: number };
  target?: { row: number; col: number };
  timestamp: string;
}

// UI State Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  isActive?: boolean;
}

export interface DeviceOrientation {
  isLandscape: boolean;
  isMobile: boolean;
  shouldShowRotationPrompt: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Socket.io Event Types
export interface ServerToClientEvents {
  'game:state_update': (gameState: GameState) => void;
  'game:action': (action: GameAction) => void;
  'game:ended': (result: { winner: string; reason: string }) => void;
  'matchmaking:found': (gameId: string) => void;
  'error': (error: string) => void;
}

export interface ClientToServerEvents {
  'game:create': (deckId: string) => void;
  'game:join': (gameId: string) => void;
  'game:place_unit': (cardId: string, position: { row: number; col: number }) => void;
  'game:attack': (from: { row: number; col: number }, to: { row: number; col: number }) => void;
  'game:end_turn': () => void;
  'matchmaking:join': (deckId: string) => void;
  'matchmaking:cancel': () => void;
}