/**
 * Socket.io Type Definitions
 * Comprehensive TypeScript interfaces for real-time communication
 */
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

// User session data attached to socket
export interface SocketUserData {
  userId: string;
  username: string;
  isAuthenticated: boolean;
  sessionId: string;
  connectedAt: Date;
}

// Extended socket interface with user data
export interface AuthenticatedSocket extends Socket {
  userData?: SocketUserData;
  gameId?: string;
  playerId?: string;
}

// Game state interfaces
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
  faction: 'humans' | 'aliens' | 'robots';
  type: 'unit' | 'spell';
  abilities: string[];
  imageUrl?: string;
}

export interface PlayerData {
  id: string;
  username: string;
  faction: 'humans' | 'aliens' | 'robots';
  hand: GameCard[];
  board: (GameCard | null)[][]; // 3x5 grid
  resources: number; // Void Echoes (0-10)
  questId: string; // Secret victory condition
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

// Matchmaking interfaces
export interface MatchmakingPlayer {
  id: string;
  username: string;
  socketId: string;
  faction: 'humans' | 'aliens' | 'robots';
  rating: number;
  deck: string[]; // Card IDs
  queuedAt: Date;
  preferences: {
    timeLimit: number;
    ranked: boolean;
  };
}

export interface MatchmakingQueue {
  players: MatchmakingPlayer[];
  averageWaitTime: number;
  activeMatches: number;
}

// Client to Server Events
export interface ClientToServerEvents {
  // Authentication
  'auth:authenticate': (token: string, callback: (response: AuthResponse) => void) => void;

  // Game Management
  'game:create': (gameConfig: GameCreateConfig, callback: (response: GameResponse) => void) => void;
  'game:join': (gameId: string, callback: (response: GameResponse) => void) => void;
  'game:leave': (callback: (response: BasicResponse) => void) => void;
  'game:ready': (callback: (response: BasicResponse) => void) => void;

  // Game Actions
  'game:card_selected': (data: CardSelectedData, callback: (response: ValidPositionsResponse) => void) => void;
  'game:selection_cleared': () => void;
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

// Server to Client Events
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
  'game:valid_positions': (response: ValidPositionsResponse) => void;

  // Turn Management Events (Task 1.3F)
  'turn:changed': (turnData: TurnUpdateData) => void;
  'turn:timer_started': (timerData: TurnTimerData) => void;
  'turn:timeout': (timeoutData: TurnTimeoutData) => void;
  'phase:transition': (phaseData: PhaseTransitionData) => void;

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

// Turn Management Event Data (Task 1.3F)
export interface TurnUpdateData {
  currentPlayer: string;
  turn: number;
  phase: 'resources' | 'draw' | 'actions' | 'end';
  timeRemaining: number;
  timeLimit: number;
  phaseStartedAt: Date;
}

export interface TurnTimerData {
  duration: number;
  deadline: number;
  playerId: string;
}

export interface TurnTimeoutData {
  playerId: string;
  newState: {
    currentPlayer: string;
    turn: number;
    phase: string;
    timeRemaining: number;
  };
}

export interface PhaseTransitionData {
  from: 'resources' | 'draw' | 'actions' | 'end';
  to: 'resources' | 'draw' | 'actions' | 'end';
  auto: boolean;
}

// Inter-server Events (for future scaling)
export interface InterServerEvents {
  'server:game_created': (gameId: string, serverId: string) => void;
  'server:game_completed': (gameId: string, result: GameResult) => void;
  'server:player_moved': (playerId: string, fromServer: string, toServer: string) => void;
}

// Socket Data Interface
export interface SocketData {
  userData?: SocketUserData;
  gameId?: string;
  playerId?: string;
  roomId?: string;
  lastPing?: Date;
}

// Request/Response Interfaces
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

// Game Action Data Interfaces
export interface GameCreateConfig {
  timeLimit: number; // seconds per turn
  ranked: boolean;
  spectatorMode: boolean;
  faction: 'humans' | 'aliens' | 'robots';
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
  faction: 'humans' | 'aliens' | 'robots';
  deck: string[];
  preferences: {
    timeLimit: number;
    ranked: boolean;
  };
}

// Card Selection Data (for click-based placement)
export interface CardSelectedData {
  cardId: string;
  handIndex: number;
}

export interface ValidPositionsResponse extends BasicResponse {
  validPositions?: GamePosition[];
  cardId?: string;
}

// Game Action History
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

// Socket Authentication Middleware Types
export interface SocketAuthData {
  token: string;
  timestamp: number;
}

export interface AuthSocketMiddleware {
  (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void): void;
}

// Room Management Types
export interface GameRoom {
  id: string;
  gameId: string;
  players: Set<string>;
  spectators: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}

// Error Types for Socket Events
export interface SocketError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Connection Statistics
export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  authenticatedConnections: number;
  gamesInProgress: number;
  playersInQueue: number;
  averageLatency: number;
  uptime: number;
}

// Health Check Interface for Socket.io
export interface SocketHealthStatus {
  connected: boolean;
  activeConnections: number;
  totalRooms: number;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}