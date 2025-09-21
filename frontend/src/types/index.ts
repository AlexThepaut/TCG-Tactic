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

// Enhanced Game Types aligned with backend
export interface GamePosition {
  x: number;
  y: number;
}

export interface GameCard {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  maxHealth: number;
  faction: Faction;
  type: 'unit' | 'spell';
  abilities: string[];
  imageUrl?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PlayerData {
  id: string;
  username: string;
  faction: Faction;
  hand: GameCard[];
  board: (GameCard | null)[][];  // 3x5 grid
  resources: number;         // Void Echoes (0-10)
  questId: string;          // Secret victory condition
  isReady: boolean;
  lastActionAt: Date;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'starting' | 'active' | 'paused' | 'completed' | 'abandoned';
  players: {
    player1: PlayerData;
    player2: PlayerData;
  };
  currentPlayer: string;
  turn: number;
  phase: 'resources' | 'draw' | 'actions' | 'end';
  timeLimit: number; // seconds per turn
  timeRemaining: number;
  gameStartedAt: Date;
  lastActionAt: Date;
  gameOver: boolean;
  winner?: string;
  winCondition?: string;
  spectators: string[];
}

export interface GameAction {
  id: string;
  playerId: string;
  type: 'place_unit' | 'attack' | 'cast_spell' | 'end_turn' | 'surrender';
  data: any;
  timestamp: Date;
  turn: number;
  phase: string;
}

export interface GameResult {
  winner: string;
  loser: string;
  winCondition: string;
  gameEndedAt: Date;
  gameDuration: number; // seconds
  totalTurns: number;
  actions: GameAction[];
}

export interface CombatResult {
  attacker: GamePosition;
  target: GamePosition;
  damage: number;
  destroyed: boolean;
  counterAttack?: {
    damage: number;
    destroyed: boolean;
  };
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

// Socket Response Types aligned with backend
export interface BasicResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AuthResponse extends BasicResponse {
  userData?: SocketUserData;
  sessionId?: string;
}

export interface GameResponse extends BasicResponse {
  gameId?: string;
  gameState?: GameState;
  playerId?: string;
}

export interface GameActionResponse extends BasicResponse {
  gameState?: GameState;
  action?: GameAction;
  validMoves?: GamePosition[];
}

export interface MatchmakingResponse extends BasicResponse {
  queuePosition?: number;
  estimatedWait?: number;
  matchmakingId?: string;
}

export interface MatchmakingStatusResponse extends BasicResponse {
  inQueue: boolean;
  queuePosition?: number;
  estimatedWait?: number;
  queueSize?: number;
}

export interface ReconnectResponse extends BasicResponse {
  gameState?: GameState;
  playerId?: string;
  timeRemaining?: number;
}

// Socket User Data
export interface SocketUserData {
  userId: string;
  username: string;
  isAuthenticated: boolean;
  sessionId: string;
  connectedAt: Date;
}

// Drag & Drop Types
export interface DragItem {
  type: 'CARD';
  id: string;
  cardId: string;
  handIndex: number;
  card: GameCard;
}

export interface DropResult {
  position: GamePosition;
  isValid: boolean;
  faction?: Faction;
}

export interface DragPreview {
  card: GameCard;
  isDragging: boolean;
  canDrop: boolean;
}

// Formation definitions for each faction
export interface Formation {
  name: string;
  positions: GamePosition[];
  description: string;
}

export const FORMATIONS = {
  humans: {
    name: "Tactical Phalanx",
    positions: [
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
    ],
    description: "3×3 center formation focused on discipline and coordination"
  },
  aliens: {
    name: "Living Swarm",
    positions: [
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
      { x: 2, y: 2 }
    ],
    description: "Adaptive spread formation for evolution and adaptation"
  },
  robots: {
    name: "Immortal Army",
    positions: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
    ],
    description: "Full top row with strategic support positions"
  }
};

// Game Action Data Types
export interface GameCreateConfig {
  timeLimit: number; // seconds per turn
  ranked: boolean;
  spectatorMode: boolean;
  faction: Faction;
  deck: string[]; // Card IDs
}

export interface PlaceUnitData {
  cardId: string;
  position: GamePosition;
  handIndex: number;
}

export interface AttackData {
  attackerPosition: GamePosition;
  targetPosition: GamePosition;
}

export interface CastSpellData {
  cardId: string;
  handIndex: number;
  target?: GamePosition;
  targets?: GamePosition[];
}

export interface MatchmakingJoinData {
  faction: Faction;
  deck: string[];
  preferences: {
    timeLimit: number;
    ranked: boolean;
  };
}

// Enhanced Socket.io Event Types aligned with backend
export interface ServerToClientEvents {
  // Authentication
  'auth:success': (userData: SocketUserData) => void;
  'auth:error': (error: string) => void;

  // Game State Updates
  'game:state_update': (gameState: GameState) => void;
  'game:player_joined': (player: PlayerData) => void;
  'game:player_left': (playerId: string) => void;
  'game:action_performed': (action: GameAction) => void;
  'game:turn_changed': (currentPlayer: string, timeRemaining: number) => void;
  'game:game_over': (result: GameResult) => void;
  'game:error': (error: string) => void;

  // Matchmaking Updates
  'matchmaking:queue_update': (position: number, estimatedWait: number) => void;
  'matchmaking:match_found': (gameId: string, opponent: PlayerData) => void;
  'matchmaking:cancelled': (reason: string) => void;

  // Connection Events
  'connection:established': (sessionId: string) => void;
  'connection:player_reconnected': (playerId: string) => void;
  'connection:player_disconnected': (playerId: string, timeout: number) => void;

  // System Events
  'system:maintenance': (message: string, scheduledAt: Date) => void;
  'system:error': (error: string) => void;
}

export interface ClientToServerEvents {
  // Authentication
  'auth:authenticate': (token: string, callback: (response: AuthResponse) => void) => void;

  // Game Management
  'game:create': (gameConfig: GameCreateConfig, callback: (response: GameResponse) => void) => void;
  'game:join': (gameId: string, callback: (response: GameResponse) => void) => void;
  'game:leave': (callback: (response: BasicResponse) => void) => void;
  'game:ready': (callback: (response: BasicResponse) => void) => void;

  // Game Actions
  'game:place_unit': (data: PlaceUnitData, callback: (response: GameActionResponse) => void) => void;
  'game:attack': (data: AttackData, callback: (response: GameActionResponse) => void) => void;
  'game:cast_spell': (data: CastSpellData, callback: (response: GameActionResponse) => void) => void;
  'game:end_turn': (callback: (response: GameActionResponse) => void) => void;
  'game:surrender': (callback: (response: BasicResponse) => void) => void;

  // Matchmaking
  'matchmaking:join': (data: MatchmakingJoinData, callback: (response: MatchmakingResponse) => void) => void;
  'matchmaking:leave': (callback: (response: BasicResponse) => void) => void;
  'matchmaking:status': (callback: (response: MatchmakingStatusResponse) => void) => void;

  // Connection Management
  'connection:ping': (callback: (response: { pong: boolean; timestamp: number }) => void) => void;
  'connection:reconnect': (gameId: string, callback: (response: ReconnectResponse) => void) => void;
}