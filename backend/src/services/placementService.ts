/**
 * Placement Service - Enhanced for Task 1.3B
 * Core service for tactical unit placement with faction-specific formation validation
 * and resource management for TCG Tactique
 *
 * Enhancements:
 * - Integrated GameStateRepository for optimistic locking
 * - GameActionLogger for comprehensive action tracking
 * - Performance monitoring for <50ms validation requirement
 * - Standardized error codes per Task 1.3B specification
 */
import { prisma } from '../lib/database';
import { logger, loggers } from '../utils/logger';
import {
  GameState,
  PlayerState,
  BoardCard,
  GridPosition,
  ValidationResult,
  PlaceUnitActionData,
  GameAction,
  GAME_CONSTANTS,
  FACTION_FORMATIONS,
  isValidGridPosition,
  getPlayerState,
  isCurrentPlayer
} from '../types/gameState';
import { Card, Faction } from '../types/database';
import { gameStateService } from './gameStateService';
import { gameValidationService } from './gameValidationService';
import { gameStateRepository } from '../repositories/GameStateRepository';
import { gameActionLogger } from './GameActionLogger';
import {
  PLACEMENT_ERROR_CODES,
  PlacementErrorCode,
  mapValidationErrorToCode,
  createDetailedError,
  formatErrorForClient
} from '../utils/errorCodes';
import { performanceMonitor, MonitorPerformance } from '../utils/performanceMonitor';

/**
 * Placement result interface for unit placement operations
 */
export interface PlacementResult {
  success: boolean;
  gameState?: GameState;
  error?: string;
  errorCode?: PlacementErrorCode;
  action?: GameAction;
  validationDetails?: ValidationResult;
}

/**
 * Placement validation result
 */
export interface PlacementValidationResult extends ValidationResult {
  canPlace: boolean;
  resourceCost: number;
  formationValid: boolean;
  positionOccupied: boolean;
}

/**
 * Placement error codes - using standardized codes from Task 1.3B
 */
export type { PlacementErrorCode } from '../utils/errorCodes';

/**
 * Formation helper interface
 */
interface FormationHelper {
  faction: Faction;
  validPositions: GridPosition[];
  pattern: boolean[][];
}

/**
 * Placement Service
 * Handles all unit placement logic with comprehensive validation
 */
export class PlacementService {
  private static instance: PlacementService;
  private formationCache = new Map<Faction, FormationHelper>();

  private constructor() {
    this.initializeFormationCache();
  }

  static getInstance(): PlacementService {
    if (!PlacementService.instance) {
      PlacementService.instance = new PlacementService();
    }
    return PlacementService.instance;
  }

  /**
   * Validate unit placement before execution - Enhanced for Task 1.3B
   * Performance requirement: <50ms validation time
   */
  @MonitorPerformance('validation')
  async validatePlacement(
    gameId: string,
    playerId: number,
    cardId: string,
    position: GridPosition
  ): Promise<PlacementValidationResult> {
    try {
      loggers.game.debug('Validating unit placement', {
        gameId,
        playerId,
        cardId,
        position
      });

      // Get current game state using new repository
      const gameState = await gameStateRepository.findById(gameId);
      if (!gameState) {
        const error = createDetailedError('game_not_found', { gameId });
        await gameActionLogger.logValidationFailure(
          gameId,
          playerId,
          'place_unit',
          { cardId, position },
          ['Game not found']
        );

        return {
          canPlace: false,
          isValid: false,
          resourceCost: 0,
          formationValid: false,
          positionOccupied: false,
          errors: [{
            code: 'GAME_NOT_FOUND',
            message: error.message,
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Enhanced validation with performance tracking
      const validationResults = await this.performComprehensiveValidation(
        gameState,
        playerId,
        cardId,
        position
      );

      // Log validation result for audit
      if (!validationResults.canPlace) {
        await gameActionLogger.logValidationFailure(
          gameId,
          playerId,
          'place_unit',
          { cardId, position },
          validationResults.errors.map(e => e.message)
        );
      }

      return validationResults;

    } catch (error) {
      loggers.game.error('Placement validation failed', {
        gameId,
        playerId,
        cardId,
        position,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        canPlace: false,
        isValid: false,
        resourceCost: 0,
        formationValid: false,
        positionOccupied: false,
        errors: [{
          code: 'PLACEMENT_SERVICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Perform comprehensive validation with all Task 1.3B requirements
   */
  private async performComprehensiveValidation(
    gameState: GameState,
    playerId: number,
    cardId: string,
    position: GridPosition
  ): Promise<PlacementValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];
    let resourceCost = 0;
    let formationValid = false;
    let positionOccupied = false;

    // 1. Basic game state validation
    const stateValidation = this.validateGameState(gameState, playerId);
    if (!stateValidation.isValid) {
      errors.push(...stateValidation.errors);
    }

    // 2. Get player state
    const playerState = getPlayerState(gameState, playerId);
    if (!playerState) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found in game',
        severity: 'error'
      });
      return {
        canPlace: false,
        isValid: false,
        resourceCost: 0,
        formationValid: false,
        positionOccupied: false,
        errors,
        warnings
      };
    }

    // 3. Find and validate card in hand
    const cardIndex = playerState.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
      errors.push({
        code: mapValidationErrorToCode('card_not_in_hand'),
        message: 'Card not found in player hand',
        severity: 'error'
      });
    } else {
      const card = playerState.hand[cardIndex];
      if (!card) {
        errors.push({
          code: 'INVALID_CARD',
          message: 'Card not found in hand',
          severity: 'error'
        });
        return {
          canPlace: false,
          isValid: false,
          resourceCost: 0,
          formationValid: false,
          positionOccupied: false,
          errors,
          warnings
        };
      }

      resourceCost = card.cost;

      // 4. Validate card type (must be unit for placement)
      if (card.type !== 'unit') {
        errors.push({
          code: mapValidationErrorToCode('invalid_card_type'),
          message: 'Only unit cards can be placed on the board',
          severity: 'error'
        });
      }

      // 5. Resource validation (Task 1.3B requirement)
      if (playerState.resources < resourceCost) {
        errors.push({
          code: PLACEMENT_ERROR_CODES.INSUFFICIENT_RESOURCES,
          message: `Insufficient Void Echoes: need ${resourceCost}, have ${playerState.resources}`,
          severity: 'error'
        });
      }

      // 6. Formation validation (Task 1.3B requirement)
      formationValid = this.validateFormationPosition(playerState.faction, position);
      if (!formationValid) {
        errors.push({
          code: PLACEMENT_ERROR_CODES.INVALID_POSITION,
          message: `Position ${position.col},${position.row} not valid for ${playerState.faction} formation`,
          severity: 'error'
        });
      }

      // 7. Position occupation check (Task 1.3B requirement)
      positionOccupied = this.isPositionOccupied(playerState.board, position);
      if (positionOccupied) {
        errors.push({
          code: PLACEMENT_ERROR_CODES.POSITION_OCCUPIED,
          message: `Position ${position.col},${position.row} is already occupied`,
          severity: 'error'
        });
      }

      // 8. Grid bounds validation
      if (!isValidGridPosition(position)) {
        errors.push({
          code: PLACEMENT_ERROR_CODES.INVALID_POSITION,
          message: `Position ${(position as any).col},${(position as any).row} is outside valid grid bounds`,
          severity: 'error'
        });
      }
    }

    return {
      canPlace: errors.length === 0,
      isValid: errors.length === 0,
      resourceCost,
      formationValid,
      positionOccupied,
      errors,
      warnings
    };
  }

  /**
   * Enhanced formation validation for all three factions
   */
  private validateFormationPosition(faction: Faction, position: GridPosition): boolean {
    const formation = FACTION_FORMATIONS[faction];
    if (!formation || !(formation as any)[position.row] || (formation as any)[position.row][position.col] === undefined) {
      return false;
    }
    return (formation as any)[position.row][position.col];
  }

  /**
   * Check if position is occupied on the board
   */
  private isPositionOccupied(board: (BoardCard | null)[][], position: GridPosition): boolean {
    if (!board[position.row]) {
      return false;
    }
    const cell = board[position.row]![position.col];
    return cell !== null;
  }

  /**
   * Execute unit placement with atomic state updates - Enhanced for Task 1.3B
   * Performance requirement: Complete operation in <100ms including DB persistence
   */
  @MonitorPerformance('database')
  async executePlacement(
    gameId: string,
    playerId: number,
    cardId: string,
    position: GridPosition
  ): Promise<PlacementResult> {
    const operationStart = performance.now();
    let stateBefore: GameState | undefined;
    let stateAfter: GameState | undefined;

    try {
      loggers.game.info('Executing unit placement', {
        gameId,
        playerId,
        cardId,
        position
      });

      // Pre-validation with performance monitoring
      const validation = await this.validatePlacement(gameId, playerId, cardId, position);
      if (!validation.canPlace) {
        await gameActionLogger.logValidationFailure(
          gameId,
          playerId,
          'place_unit',
          { cardId, position },
          validation.errors.map(e => e.message)
        );

        return {
          success: false,
          error: validation.errors[0]?.message || 'Placement validation failed',
          errorCode: validation.errors[0]?.code as PlacementErrorCode,
          validationDetails: validation
        };
      }

      // Get current game state using repository with optimistic locking
      const gameState = await gameStateRepository.findById(gameId);
      if (!gameState) {
        await gameActionLogger.logValidationFailure(
          gameId,
          playerId,
          'place_unit',
          { cardId, position },
          ['Game state not found']
        );

        return {
          success: false,
          error: 'Game state not found',
          errorCode: PLACEMENT_ERROR_CODES.INVALID_CARD
        };
      }

      stateBefore = { ...gameState };
      const playerState = getPlayerState(gameState, playerId);
      if (!playerState) {
        return {
          success: false,
          error: 'Player not found in game',
          errorCode: PLACEMENT_ERROR_CODES.INVALID_CARD
        };
      }

      // Find card in hand
      const cardIndex = playerState.hand.findIndex(card => card.id === cardId);
      const card = playerState.hand[cardIndex];

      if (!card) {
        throw new Error('Card not found in hand');
      }

      // Execute placement atomically
      const placementResult = this.performAtomicPlacement(
        gameState,
        playerState,
        card,
        cardIndex,
        position,
        validation.resourceCost
      );

      stateAfter = placementResult.newState;

      // Persist updated state using repository with optimistic locking
      const updatedGameState = await gameStateRepository.update(
        gameId,
        placementResult.newState,
        gameState.version
      );

      // Log successful placement action
      const actionDuration = performance.now() - operationStart;
      await gameActionLogger.logPlacementAction(
        gameId,
        playerId,
        { cardId, position, resourceCost: validation.resourceCost },
        stateBefore!,
        updatedGameState,
        true
      );

      loggers.game.info('Unit placement executed successfully', {
        gameId,
        playerId,
        cardId,
        position,
        resourceCost: validation.resourceCost
      });

      return {
        success: true,
        gameState: updatedGameState,
        action: placementResult.action
      };

    } catch (error: any) {
      loggers.game.error('Unit placement execution failed', {
        gameId,
        playerId,
        cardId,
        position,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: `Placement failed: ${error.message}`,
        errorCode: 'PLACEMENT_SERVICE_ERROR' as PlacementErrorCode
      };
    }
  }

  /**
   * Check if position is valid for faction formation
   */
  isValidPosition(faction: Faction, position: GridPosition): boolean {
    try {
      if (!isValidGridPosition(position)) {
        return false;
      }

      const formation = this.formationCache.get(faction);
      if (!formation) {
        loggers.game.warn('Formation not found in cache', { faction });
        return false;
      }

      return formation.pattern[position.row]?.[position.col] === true;

    } catch (error: any) {
      loggers.game.error('Position validation failed', {
        faction,
        position,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get all valid positions for faction
   */
  getValidPositions(faction: Faction): GridPosition[] {
    const formation = this.formationCache.get(faction);
    return formation?.validPositions || [];
  }

  /**
   * Check if player can afford card
   */
  canAffordCard(playerData: PlayerState, card: Card): boolean {
    const availableResources = playerData.resources - playerData.resourcesSpent;
    return availableResources >= (card.cost || 0);
  }

  /**
   * Deduct resources from player state
   */
  deductResources(playerData: PlayerState, cost: number): PlayerState {
    return {
      ...playerData,
      resourcesSpent: playerData.resourcesSpent + cost
    };
  }

  /**
   * Get current game state
   */
  async getGameState(gameId: string): Promise<GameState | null> {
    return await gameStateService.getGameState(gameId);
  }

  /**
   * Update game state
   */
  async updateGameState(gameId: string, newState: GameState): Promise<void> {
    await gameStateService.updateGameState(gameId, newState);
  }

  // Private helper methods

  private initializeFormationCache(): void {
    try {
      for (const [faction, formationInfo] of Object.entries(FACTION_FORMATIONS)) {
        const validPositions: GridPosition[] = [];

        for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
          for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
            if (formationInfo.pattern[row]?.[col] === true) {
              validPositions.push({ row, col });
            }
          }
        }

        this.formationCache.set(faction as Faction, {
          faction: faction as Faction,
          validPositions,
          pattern: formationInfo.pattern
        });
      }

      loggers.game.debug('Formation cache initialized', {
        factions: Array.from(this.formationCache.keys())
      });

    } catch (error: any) {
      loggers.game.error('Formation cache initialization failed', {
        error: error.message
      });
    }
  }

  private validateGameState(gameState: GameState, playerId: number): ValidationResult {
    const errors: any[] = [];

    // Check if game is active
    if (gameState.status !== 'active') {
      errors.push({
        code: 'GAME_NOT_ACTIVE',
        message: 'Game is not currently active',
        severity: 'error'
      });
    }

    // Check if game is over
    if (gameState.gameOver) {
      errors.push({
        code: 'GAME_OVER',
        message: 'Game has already ended',
        severity: 'error'
      });
    }

    // Check if it's the player's turn
    if (!isCurrentPlayer(gameState, playerId)) {
      errors.push({
        code: 'NOT_YOUR_TURN',
        message: 'It is not your turn',
        severity: 'error'
      });
    }

    // Check if it's the actions phase
    if (gameState.phase !== 'actions') {
      errors.push({
        code: 'INVALID_PHASE',
        message: 'Units can only be placed during the actions phase',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  // DUPLICATE FUNCTION - COMMENTED OUT TO FIX COMPILATION
  /*
  private performComprehensiveValidation(
    gameState: GameState,
    playerState: PlayerState,
    card: Card,
    cardIndex: number,
    position: GridPosition
  ): PlacementValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate card type
    if (card.type !== 'unit') {
      errors.push({
        code: 'NOT_UNIT_CARD',
        message: 'Only unit cards can be placed on the board',
        severity: 'error'
      });
    }

    // Validate position bounds
    if (!isValidGridPosition(position)) {
      errors.push({
        code: 'INVALID_POSITION',
        message: 'Position is outside valid grid boundaries',
        severity: 'error'
      });
    }

    // Validate faction formation
    const formationValid = this.isValidPosition(playerState.faction, position);
    if (!formationValid) {
      errors.push({
        code: 'INVALID_FORMATION_POSITION',
        message: `Position (${position.row}, ${position.col}) is not valid for ${playerState.faction} formation`,
        severity: 'error'
      });
    }

    // Check if position is occupied
    const positionOccupied = playerState.board[position.row]?.[position.col] !== null;
    if (positionOccupied) {
      errors.push({
        code: 'POSITION_OCCUPIED',
        message: 'Position is already occupied by another unit',
        severity: 'error'
      });
    }

    // Validate resources
    const resourceCost = card.cost || 0;
    const canAfford = this.canAffordCard(playerState, card);
    if (!canAfford) {
      const availableResources = playerState.resources - playerState.resourcesSpent;
      errors.push({
        code: 'INSUFFICIENT_RESOURCES',
        message: `Insufficient resources. Required: ${resourceCost}, Available: ${availableResources}`,
        severity: 'error'
      });
    }

    // Resource efficiency warning
    if (canAfford && playerState.resources > 7 && resourceCost < 3) {
      warnings.push({
        code: 'RESOURCE_EFFICIENCY',
        message: 'Consider playing higher cost cards when you have abundant resources',
        suggestion: 'Play higher cost units for better board impact'
      });
    }

    return {
      canPlace: errors.length === 0,
      isValid: errors.length === 0,
      resourceCost,
      formationValid,
      positionOccupied,
      errors,
      warnings
    };
  }
  */

  private performAtomicPlacement(
    gameState: GameState,
    playerState: PlayerState,
    card: Card,
    cardIndex: number,
    position: GridPosition,
    resourceCost: number
  ): { newState: GameState; action: GameAction } {
    // Create deep copy for atomic update
    const newState = { ...gameState };
    const newPlayerState = { ...playerState };

    // Remove card from hand
    newPlayerState.hand = [...playerState.hand];
    newPlayerState.hand.splice(cardIndex, 1);

    // Deduct resources
    newPlayerState.resourcesSpent += resourceCost;

    // Create board card
    const boardCard: BoardCard = {
      ...card,
      position,
      currentHp: card.hp || 1,
      canAttack: false, // Summoning sickness
      canMove: false,
      hasAttacked: false,
      summonedThisTurn: true,
      effects: [],
      abilities: card.abilities || []
    };

    // Place on board (ensure board is properly initialized)
    newPlayerState.board = playerState.board.map(row => [...(row || [])]);
    if (!newPlayerState.board[position.row]) {
      newPlayerState.board[position.row] = new Array(GAME_CONSTANTS.BOARD_COLS).fill(null);
    }
    newPlayerState.board[position.row]![position.col] = boardCard;

    // Update statistics
    newPlayerState.unitsPlaced += 1;

    // Update player state in game state
    if (gameState.player1Id === playerState.id) {
      newState.players = { ...gameState.players, player1: newPlayerState };
    } else {
      newState.players = { ...gameState.players, player2: newPlayerState };
    }

    // Create action record
    const action: GameAction = {
      id: `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameId: gameState.gameId,
      playerId: playerState.id,
      actionType: 'place_unit',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      actionData: {
        cardId: parseInt(card.id),
        handIndex: cardIndex,
        position,
        resourceCost
      } as PlaceUnitActionData,
      isValid: true,
      resourceCost
    };

    // Add to action history
    newState.actionHistory = [...gameState.actionHistory, action];
    newState.lastActionAt = new Date();

    return { newState, action };
  }

  private async logPlacementAction(
    gameStateId: string,
    gameId: number,
    playerId: number,
    card: Card,
    position: GridPosition,
    resourceCost: number,
    action: GameAction
  ): Promise<void> {
    try {
      await (prisma as any).gameAction.create({
        data: {
          id: action.id,
          gameId: gameId,
          gameStateId: parseInt(gameStateId.split('_')[2]!) || 0,
          playerId: playerId,
          actionType: 'place_unit',
          actionData: {
            cardId: card.id,
            cardName: card.name,
            position,
            resourceCost
          },
          turn: action.turn,
          phase: action.phase,
          resourceCost,
          isValid: true,
          timestamp: action.timestamp
        }
      });

      loggers.game.debug('Placement action logged to database', {
        actionId: action.id,
        gameId,
        playerId,
        cardId: card.id
      });

    } catch (error: any) {
      loggers.game.error('Failed to log placement action', {
        actionId: action.id,
        gameId,
        playerId,
        cardId: card.id,
        error: error.message
      });
      // Don't throw - logging failure shouldn't break placement
    }
  }
}

// Export singleton instance
export const placementService = PlacementService.getInstance();