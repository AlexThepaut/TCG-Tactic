/**
 * Enhanced Game State Types for TCG Tactique
 * Comprehensive interfaces for turn-based mechanics and game state management
 */
import { Faction, Card, GamePhase, EndReason } from './database';

// Enhanced Game State interface with versioning and turn management
export interface GameState {
  id: string;
  gameId: number; // Reference to persistent Game record
  player1Id: number;
  player2Id: number;
  currentPlayer: number;
  turn: number;
  phase: GamePhase;
  status: GameStatus;
  timeLimit: number; // seconds per turn
  timeRemaining: number;
  gameStartedAt: Date;
  lastActionAt: Date;
  gameOver: boolean;
  winner?: number;
  winCondition?: WinCondition;
  version: number; // For optimistic locking

  // Game state data
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };

  // Action history for this game
  actionHistory: GameAction[];

  // Spectator support
  spectators: string[];
}

// Game status enumeration
export type GameStatus =
  | 'waiting'     // Waiting for second player
  | 'starting'    // Both players ready, initializing
  | 'active'      // Game in progress
  | 'paused'      // Temporarily paused
  | 'completed'   // Game finished
  | 'abandoned';  // Game abandoned by players

// Win condition types
export type WinCondition =
  | 'quest_completed'       // Player completed their secret quest
  | 'opponent_surrender'    // Opponent surrendered
  | 'opponent_disconnected' // Opponent disconnected and timed out
  | 'deck_empty'           // Opponent ran out of cards
  | 'timeout'              // Game timeout reached
  | 'quest_timeout';       // Quest completion timeout

// Enhanced Player State with faction-specific formations
export interface PlayerState {
  id: number;
  username: string;
  faction: Faction;

  // Card management
  hand: Card[];              // Cards in hand (max 7)
  deck: Card[];              // Remaining cards in deck
  graveyard: Card[];         // Dead/discarded cards

  // Board state - 3x5 grid with faction formations
  board: (BoardCard | null)[][]; // 3x5 grid respecting faction formation

  // Resource management
  resources: number;         // Current Void Echoes (0-10)
  maxResources: number;      // Maximum Void Echoes this turn
  resourcesSpent: number;    // Resources spent this turn

  // Quest system
  questId: string;           // Secret victory condition
  questProgress: QuestProgress; // Progress tracking

  // Turn state
  isReady: boolean;          // Ready to start game
  actionsThisTurn: GameAction[]; // Actions taken this turn
  canAct: boolean;           // Can perform actions this phase

  // Statistics
  unitsPlaced: number;       // Units placed this game
  spellsCast: number;        // Spells cast this game
  unitsKilled: number;       // Enemy units killed
  damageDealt: number;       // Total damage dealt
}

// Card on board with position and state
export interface BoardCard extends Card {
  position: GridPosition;
  currentHp: number;        // Current HP (may be less than max)
  canAttack: boolean;       // Can attack this turn
  canMove: boolean;         // Can move this turn (if applicable)
  hasAttacked: boolean;     // Already attacked this turn
  summonedThisTurn: boolean; // Summoned this turn (summoning sickness)
  effects: ActiveEffect[];   // Active effects on this card (temporary effects)
}

// Grid position interface
export interface GridPosition {
  row: number;  // 0-2 (3 rows)
  col: number;  // 0-4 (5 columns)
}

// Active effect on a card
export interface ActiveEffect {
  effectId: string;
  name: string;
  description: string;
  duration: number;        // Turns remaining (-1 = permanent)
  source: string;         // Card that applied this effect
  parameters: Record<string, any>;
}

// Quest progress tracking
export interface QuestProgress {
  questId: string;
  currentValue: number;    // Current progress value
  targetValue: number;     // Required value for completion
  isCompleted: boolean;    // Quest completion status
  completedAt?: Date;      // When quest was completed
  milestones: QuestMilestone[]; // Progress milestones
}

// Quest milestone for progress tracking
export interface QuestMilestone {
  value: number;
  description: string;
  achievedAt?: Date | undefined;
}

// Game action interface with comprehensive data
export interface GameAction {
  id: string;
  gameId: number;
  playerId: number;
  actionType: GameActionType;
  turn: number;
  phase: GamePhase;
  timestamp: Date;

  // Action-specific data
  actionData: any;

  // State tracking
  stateBefore?: GameState;
  stateAfter?: GameState;

  // Validation and results
  success?: boolean;
  error?: string | undefined;
  isValid: boolean;
  validationErrors?: string[];

  // Resource cost
  resourceCost: number;

  // Correlation tracking
  correlationId?: string;
  duration?: number;
  metadata?: any;
}

// Game action types
export type GameActionType =
  | 'place_unit'     // Place unit card on board
  | 'cast_spell'     // Cast spell card
  | 'attack'         // Attack with unit
  | 'move_unit'      // Move unit (if applicable)
  | 'end_turn'       // End current turn
  | 'surrender'      // Surrender game
  | 'activate_ability'; // Activate card ability

// Action data union type
export type GameActionData =
  | PlaceUnitActionData
  | CastSpellActionData
  | AttackActionData
  | MoveUnitActionData
  | EndTurnActionData
  | SurrenderActionData
  | ActivateAbilityActionData;

// Specific action data interfaces
export interface PlaceUnitActionData {
  cardId: number;
  handIndex: number;
  position: GridPosition;
  resourceCost: number;
}

export interface CastSpellActionData {
  cardId: number;
  handIndex: number;
  targets: GridPosition[];
  resourceCost: number;
  spellParameters?: Record<string, any>;
}

export interface AttackActionData {
  attackerPosition: GridPosition;
  targetPosition: GridPosition;
  attackType: 'normal' | 'ability' | 'counter';
}

export interface MoveUnitActionData {
  fromPosition: GridPosition;
  toPosition: GridPosition;
}

export interface EndTurnActionData {
  phase: GamePhase;
  voluntaryEnd: boolean;
}

export interface SurrenderActionData {
  reason?: string;
}

export interface ActivateAbilityActionData {
  cardPosition: GridPosition;
  abilityId: string;
  targets?: GridPosition[];
  parameters?: Record<string, any>;
}

// Action result interfaces
export interface GameActionResult {
  type: GameActionResultType;
  description: string;
  involvedCards: string[];
  data?: any;
}

export type GameActionResultType =
  | 'card_placed'
  | 'card_destroyed'
  | 'damage_dealt'
  | 'health_restored'
  | 'effect_applied'
  | 'effect_removed'
  | 'resources_changed'
  | 'quest_progress'
  | 'turn_ended'
  | 'game_ended';

// Formation validation interface
export interface FormationInfo {
  faction: Faction;
  name: string;
  pattern: boolean[][]; // 3x5 grid, true = valid placement
  passiveAbility: FactionPassive;
}

// Faction passive abilities
export interface FactionPassive {
  name: string;
  description: string;
  type: 'humans' | 'aliens' | 'robots';
  effects: PassiveEffect[];
}

export interface PassiveEffect {
  trigger: PassiveTrigger;
  condition: string;
  effect: string;
  parameters: Record<string, any>;
}

export type PassiveTrigger =
  | 'on_line_complete'    // Humans: complete line bonus
  | 'on_unit_death'       // Aliens: evolution adaptation
  | 'on_unit_destroyed'   // Robots: resurrection chance
  | 'turn_start'
  | 'turn_end'
  | 'card_played'
  | 'damage_taken';

// Game configuration for initialization
export interface GameConfig {
  timeLimit: number;        // Seconds per turn
  maxTurns: number;         // Maximum turns before draw
  questTimeout: number;     // Maximum time to complete quest
  spectatorMode: boolean;   // Allow spectators
  ranked: boolean;          // Ranked match

  // Player configurations
  player1Config: PlayerConfig;
  player2Config: PlayerConfig;
}

export interface PlayerConfig {
  userId: number;
  faction: Faction;
  deckId: number;
  questPreference?: string | undefined; // Preferred quest if available
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// State update interface for real-time synchronization
export interface GameStateUpdate {
  gameId: string;
  updateType: GameUpdateType;
  timestamp: Date;
  data: any;
  playersAffected: number[];
}

export type GameUpdateType =
  | 'full_state'       // Complete state update
  | 'player_state'     // Player-specific state update
  | 'board_update'     // Board state change
  | 'action_performed' // Action was performed
  | 'turn_changed'     // Turn/phase changed
  | 'game_ended'       // Game ended
  | 'spectator_update'; // Spectator list update

// Helper types for type safety
export type ValidPosition = GridPosition & { isValid: true };
export type PlayerNumber = 1 | 2;
export type TurnPhase = GamePhase;

// Constants for game rules
export const GAME_CONSTANTS = {
  BOARD_ROWS: 3,
  BOARD_COLS: 5,
  MAX_HAND_SIZE: 7,
  MIN_RESOURCES: 0,
  MAX_RESOURCES: 10,
  DEFAULT_TIME_LIMIT: 120, // 2 minutes
  MAX_TIME_LIMIT: 300,     // 5 minutes
  MIN_TIME_LIMIT: 30,      // 30 seconds
  QUEST_TIMEOUT: 1800,     // 30 minutes
  MAX_TURNS: 50,           // Maximum turns before draw
  SUMMONING_SICKNESS_TURNS: 1,
} as const;

// Faction formation patterns (exported from database types for consistency)
export const FACTION_FORMATIONS: Record<Faction, FormationInfo> = {
  humans: {
    faction: 'humans',
    name: 'Tactical Phalanx',
    pattern: [
      [false, true, true, true, false],
      [false, true, true, true, false],
      [false, true, true, true, false],
    ],
    passiveAbility: {
      name: 'Ultimate Rampart',
      description: 'Complete lines get +2 ATK/+1 HP',
      type: 'humans',
      effects: [{
        trigger: 'on_line_complete',
        condition: 'full_row_or_column',
        effect: 'buff_units',
        parameters: { attack: 2, health: 1 }
      }]
    }
  },
  aliens: {
    faction: 'aliens',
    name: 'Living Swarm',
    pattern: [
      [false, true, true, true, false],
      [true, true, true, true, true],
      [false, false, true, false, false],
    ],
    passiveAbility: {
      name: 'Evolutionary Adaptation',
      description: 'Dead aliens reduce next summon cost by 1',
      type: 'aliens',
      effects: [{
        trigger: 'on_unit_death',
        condition: 'alien_unit_dies',
        effect: 'reduce_summon_cost',
        parameters: { reduction: 1, duration: 'permanent' }
      }]
    }
  },
  robots: {
    faction: 'robots',
    name: 'Immortal Army',
    pattern: [
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, true, true, true, false],
    ],
    passiveAbility: {
      name: 'Reanimation Protocols',
      description: '30% chance to resurrect with 1 HP',
      type: 'robots',
      effects: [{
        trigger: 'on_unit_destroyed',
        condition: 'robot_unit_destroyed',
        effect: 'resurrection_chance',
        parameters: { chance: 0.3, health: 1 }
      }]
    }
  }
} as const;

// Type guards for runtime validation
export function isValidGridPosition(pos: any): pos is GridPosition {
  return typeof pos === 'object' &&
         typeof pos.row === 'number' &&
         typeof pos.col === 'number' &&
         pos.row >= 0 && pos.row < GAME_CONSTANTS.BOARD_ROWS &&
         pos.col >= 0 && pos.col < GAME_CONSTANTS.BOARD_COLS;
}

export function isValidGameAction(action: any): action is GameAction {
  return typeof action === 'object' &&
         typeof action.id === 'string' &&
         typeof action.playerId === 'number' &&
         typeof action.type === 'string' &&
         typeof action.turn === 'number' &&
         typeof action.timestamp === 'object';
}

export function isValidGameState(state: any): state is GameState {
  return typeof state === 'object' &&
         typeof state.id === 'string' &&
         typeof state.gameId === 'number' &&
         typeof state.turn === 'number' &&
         typeof state.version === 'number' &&
         typeof state.players === 'object';
}

// Utility functions for game state management
export function createEmptyBoard(): (BoardCard | null)[][] {
  return Array(GAME_CONSTANTS.BOARD_ROWS)
    .fill(null)
    .map(() => Array(GAME_CONSTANTS.BOARD_COLS).fill(null));
}

export function isValidPlacement(position: GridPosition, faction: Faction): boolean {
  const formation = FACTION_FORMATIONS[faction];
  return formation.pattern[position.row]?.[position.col] === true;
}

export function getOpponentId(gameState: GameState, playerId: number): number {
  return gameState.player1Id === playerId ? gameState.player2Id : gameState.player1Id;
}

export function getPlayerState(gameState: GameState, playerId: number): PlayerState | null {
  if (gameState.player1Id === playerId) return gameState.players.player1;
  if (gameState.player2Id === playerId) return gameState.players.player2;
  return null;
}

export function getOpponentState(gameState: GameState, playerId: number): PlayerState | null {
  const opponentId = getOpponentId(gameState, playerId);
  return getPlayerState(gameState, opponentId);
}

export function isCurrentPlayer(gameState: GameState, playerId: number): boolean {
  return gameState.currentPlayer === playerId;
}

export function canPerformAction(gameState: GameState, playerId: number, actionType: GameActionType): boolean {
  if (!isCurrentPlayer(gameState, playerId)) return false;
  if (gameState.gameOver) return false;
  if (gameState.status !== 'active') return false;

  // Phase-specific action validation
  switch (gameState.phase) {
    case 'resources':
      return actionType === 'end_turn';
    case 'draw':
      return actionType === 'end_turn';
    case 'actions':
      return ['place_unit', 'cast_spell', 'attack', 'activate_ability', 'end_turn', 'surrender'].includes(actionType);
    default:
      return false;
  }
}

// Export interfaces for external use (no conflicts with direct exports)
export {
  type GameState as EnhancedGameState,
  type PlayerState as EnhancedPlayerState,
  type BoardCard as EnhancedBoardCard,
  type GameAction as EnhancedGameAction,
  type GameActionData as EnhancedGameActionData,
  type GameActionResult as EnhancedGameActionResult,
  type FormationInfo as EnhancedFormationInfo,
  type ValidationResult as EnhancedValidationResult,
  type GameStateUpdate as EnhancedGameStateUpdate,
  type GameConfig as EnhancedGameConfig,
  type PlayerConfig as EnhancedPlayerConfig
};