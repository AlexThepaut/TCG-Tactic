/**
 * Placement Service
 * Core service for tactical unit placement with faction-specific formation validation
 * and resource management for TCG Tactique
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
 * Placement error codes for specific error handling
 */
export type PlacementErrorCode =
  | 'INVALID_POSITION'
  | 'INSUFFICIENT_RESOURCES'
  | 'NOT_YOUR_TURN'
  | 'INVALID_CARD'
  | 'POSITION_OCCUPIED'
  | 'INVALID_FORMATION_POSITION'
  | 'GAME_NOT_ACTIVE'
  | 'PLAYER_NOT_FOUND'
  | 'CARD_NOT_IN_HAND'
  | 'NOT_UNIT_CARD'
  | 'PLACEMENT_SERVICE_ERROR';

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
   * Validate unit placement before execution
   */
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

      // Get current game state
      const gameState = await gameStateService.getGameState(gameId);
      if (!gameState) {
        return {
          canPlace: false,
          isValid: false,
          resourceCost: 0,
          formationValid: false,
          positionOccupied: false,
          errors: [{
            code: 'GAME_NOT_FOUND',
            message: 'Game state not found',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Basic game state validation
      const stateValidation = this.validateGameState(gameState, playerId);
      if (!stateValidation.isValid) {
        return {
          canPlace: false,
          resourceCost: 0,
          formationValid: false,
          positionOccupied: false,
          ...stateValidation
        };
      }

      const playerState = getPlayerState(gameState, playerId);
      if (!playerState) {
        return {
          canPlace: false,
          isValid: false,
          resourceCost: 0,
          formationValid: false,
          positionOccupied: false,
          errors: [{
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found in game',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Find card in player's hand
      const cardIndex = playerState.hand.findIndex(card => card.id === cardId);
      if (cardIndex === -1) {
        return {
          canPlace: false,
          isValid: false,
          resourceCost: 0,
          formationValid: false,
          positionOccupied: false,
          errors: [{
            code: 'CARD_NOT_IN_HAND',
            message: 'Card not found in player hand',
            severity: 'error'
          }],
          warnings: []
        };
      }

      const card = playerState.hand[cardIndex]!;

      // Comprehensive placement validation
      const validation = this.performComprehensiveValidation(
        gameState,
        playerState,
        card,
        cardIndex,
        position
      );

      loggers.game.debug('Placement validation completed', {
        gameId,
        playerId,
        cardId,
        position,
        canPlace: validation.canPlace,
        errors: validation.errors.length
      });

      return validation;

    } catch (error: any) {
      loggers.game.error('Placement validation failed', {
        gameId,
        playerId,
        cardId,
        position,
        error: error.message,
        stack: error.stack
      });

      return {
        canPlace: false,
        isValid: false,
        resourceCost: 0,
        formationValid: false,
        positionOccupied: false,
        errors: [{
          code: 'PLACEMENT_SERVICE_ERROR',
          message: `Validation failed: ${error.message}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Execute unit placement with atomic state updates
   */
  async executePlacement(
    gameId: string,
    playerId: number,
    cardId: string,
    position: GridPosition
  ): Promise<PlacementResult> {
    try {
      loggers.game.info('Executing unit placement', {
        gameId,
        playerId,
        cardId,
        position
      });

      // Pre-validation
      const validation = await this.validatePlacement(gameId, playerId, cardId, position);
      if (!validation.canPlace) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Placement validation failed',
          errorCode: validation.errors[0]?.code as PlacementErrorCode,
          validationDetails: validation
        };
      }

      // Get current game state with optimistic locking
      const gameState = await gameStateService.getGameState(gameId);
      if (!gameState) {
        return {
          success: false,
          error: 'Game state not found',
          errorCode: 'GAME_NOT_ACTIVE'
        };
      }

      const playerState = getPlayerState(gameState, playerId);
      if (!playerState) {
        return {
          success: false,
          error: 'Player not found in game',
          errorCode: 'PLAYER_NOT_FOUND'
        };
      }

      // Find card in hand
      const cardIndex = playerState.hand.findIndex(card => card.id === cardId);
      const card = playerState.hand[cardIndex]!;

      // Execute placement atomically
      const placementResult = this.performAtomicPlacement(
        gameState,
        playerState,
        card,
        cardIndex,
        position,
        validation.resourceCost
      );

      // Persist updated state to database
      const updatedGameState = await gameStateService.updateGameState(
        gameId,
        placementResult.newState,
        gameState.version
      );

      // Log action to database
      await this.logPlacementAction(
        gameId,
        updatedGameState.gameId,
        playerId,
        card,
        position,
        validation.resourceCost,
        placementResult.action
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
        errorCode: 'PLACEMENT_SERVICE_ERROR'
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
      playerId: playerState.id,
      type: 'place_unit',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: {
        cardId: parseInt(card.id),
        handIndex: cardIndex,
        position,
        resourceCost
      } as PlaceUnitActionData,
      isValid: true,
      resourceCost,
      involvedCards: [card.id]
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