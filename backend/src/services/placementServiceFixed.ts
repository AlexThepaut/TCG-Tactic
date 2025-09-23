/**
 * Placement Service - Enhanced for Task 1.3B (Fixed Version)
 * Core service for tactical unit placement with faction-specific formation validation
 * and resource management for TCG Tactique
 */

import { logger, loggers } from '../utils/logger';
import {
  GameState,
  PlayerState,
  BoardCard,
  GridPosition,
  ValidationResult,
  GameAction,
  FACTION_FORMATIONS,
  isValidGridPosition,
  getPlayerState,
  isCurrentPlayer
} from '../types/gameState';
import { Card, Faction } from '../types/database';
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
 * Formation helper interface
 */
interface FormationHelper {
  faction: Faction;
  validPositions: GridPosition[];
  pattern: boolean[][];
}

/**
 * Placement Service - Enhanced for Task 1.3B
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
   * Initialize formation cache for performance
   */
  private initializeFormationCache(): void {
    Object.entries(FACTION_FORMATIONS).forEach(([faction, formationInfo]) => {
      const validPositions: GridPosition[] = [];

      for (let row = 0; row < formationInfo.pattern.length; row++) {
        for (let col = 0; col < formationInfo.pattern[row]!.length; col++) {
          if (formationInfo.pattern[row]![col]) {
            validPositions.push({ row, col });
          }
        }
      }

      this.formationCache.set(faction as Faction, {
        faction: faction as Faction,
        validPositions,
        pattern: formationInfo.pattern
      });
    });
  }

  /**
   * Validate unit placement - Enhanced for Task 1.3B
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

      // Get current game state using repository
      const gameState = await gameStateRepository.findById(gameId);
      if (!gameState) {
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
            message: 'Game state not found',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Perform comprehensive validation
      const validationResult = await this.performComprehensiveValidation(
        gameState,
        playerId,
        cardId,
        position
      );

      // Log validation failures for audit
      if (!validationResult.canPlace) {
        await gameActionLogger.logValidationFailure(
          gameId,
          playerId,
          'place_unit',
          { cardId, position },
          validationResult.errors.map(e => e.message)
        );
      }

      return validationResult;

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
   * Execute unit placement - Enhanced for Task 1.3B
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

    try {
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

      // Get current game state
      const gameState = await gameStateRepository.findById(gameId);
      if (!gameState) {
        return {
          success: false,
          error: 'Game state not found',
          errorCode: PLACEMENT_ERROR_CODES.INVALID_CARD
        };
      }

      stateBefore = { ...gameState };

      // Execute placement (simplified for demo)
      const updatedGameState = await this.performAtomicPlacement(
        gameState,
        playerId,
        cardId,
        position,
        validation.resourceCost
      );

      // Persist state
      const finalState = await gameStateRepository.update(
        gameId,
        updatedGameState,
        gameState.version
      );

      // Log successful action
      await gameActionLogger.logPlacementAction(
        gameId,
        playerId,
        { cardId, position, resourceCost: validation.resourceCost },
        stateBefore,
        finalState,
        true
      );

      const duration = performance.now() - operationStart;
      loggers.game.info('Unit placement completed successfully', {
        gameId,
        playerId,
        cardId,
        position,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        gameState: finalState
      };

    } catch (error) {
      loggers.game.error('Unit placement execution failed', {
        gameId,
        playerId,
        cardId,
        position,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: `Placement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'PLACEMENT_SERVICE_ERROR' as PlacementErrorCode
      };
    }
  }

  /**
   * Comprehensive validation implementation
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
    } else {
      // 3. Find and validate card
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
            code: PLACEMENT_ERROR_CODES.INVALID_CARD,
            message: 'Card not found at specified index',
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

        // 4. Resource validation
        if (playerState.resources < resourceCost) {
          errors.push({
            code: PLACEMENT_ERROR_CODES.INSUFFICIENT_RESOURCES,
            message: `Insufficient Void Echoes: need ${resourceCost}, have ${playerState.resources}`,
            severity: 'error'
          });
        }

        // 5. Formation validation
        formationValid = this.validateFormationPosition(playerState.faction, position);
        if (!formationValid) {
          errors.push({
            code: PLACEMENT_ERROR_CODES.INVALID_POSITION,
            message: `Position ${position.row},${position.col} not valid for ${playerState.faction} formation`,
            severity: 'error'
          });
        }

        // 6. Position occupation check
        positionOccupied = this.isPositionOccupied(playerState.board, position);
        if (positionOccupied) {
          errors.push({
            code: PLACEMENT_ERROR_CODES.POSITION_OCCUPIED,
            message: `Position ${position.row},${position.col} is already occupied`,
            severity: 'error'
          });
        }

        // 7. Grid bounds validation
        if (!isValidGridPosition(position)) {
          errors.push({
            code: PLACEMENT_ERROR_CODES.INVALID_POSITION,
            message: `Position ${(position as GridPosition).row},${(position as GridPosition).col} is outside valid grid bounds`,
            severity: 'error'
          });
        }
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
   * Validate game state and turn
   */
  private validateGameState(gameState: GameState, playerId: number): ValidationResult {
    const errors: any[] = [];

    // Check if it's player's turn
    if (!isCurrentPlayer(gameState, playerId)) {
      errors.push({
        code: PLACEMENT_ERROR_CODES.NOT_YOUR_TURN,
        message: 'It is not your turn',
        severity: 'error'
      });
    }

    // Check if in correct phase
    if (gameState.phase !== 'actions') {
      errors.push({
        code: PLACEMENT_ERROR_CODES.NOT_YOUR_TURN,
        message: 'Unit placement only allowed during actions phase',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Formation validation
   */
  private validateFormationPosition(faction: Faction, position: GridPosition): boolean {
    const formation = FACTION_FORMATIONS[faction];
    if (!formation || !formation.pattern[position.row] || formation.pattern[position.row]![position.col] === undefined) {
      return false;
    }
    return formation.pattern[position.row]![position.col] === true;
  }

  /**
   * Check position occupation
   */
  private isPositionOccupied(board: (BoardCard | null)[][], position: GridPosition): boolean {
    if (!board[position.row] || board[position.row]![position.col] === undefined) {
      return false;
    }
    return board[position.row]![position.col] !== null;
  }

  /**
   * Perform atomic placement (simplified)
   */
  private async performAtomicPlacement(
    gameState: GameState,
    playerId: number,
    cardId: string,
    position: GridPosition,
    resourceCost: number
  ): Promise<GameState> {
    const playerState = getPlayerState(gameState, playerId);
    if (!playerState) {
      throw new Error('Player state not found');
    }

    // Find and remove card from hand
    const cardIndex = playerState.hand.findIndex(card => card.id === cardId);
    const card = playerState.hand[cardIndex];
    if (!card) {
      throw new Error('Card not found in hand');
    }
    playerState.hand.splice(cardIndex, 1);

    // Place card on board
    const boardCard: BoardCard = {
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost,
      attack: card.attack || 0,
      hp: card.hp || 1,
      faction: card.faction,
      abilities: card.abilities,
      setId: card.setId,
      isActive: card.isActive,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      position,
      currentHp: card.hp || 1,
      canAttack: false,
      canMove: false,
      hasAttacked: false,
      summonedThisTurn: true,
      effects: []
    };
    if (playerState.board[position.row]) {
      playerState.board[position.row]![position.col] = boardCard;
    }

    // Deduct resources
    playerState.resources -= resourceCost;
    playerState.resourcesSpent += resourceCost;
    playerState.unitsPlaced += 1;

    return {
      ...gameState,
      lastActionAt: new Date(),
      version: gameState.version + 1
    };
  }

  /**
   * Check if position is valid for faction
   */
  isValidPosition(faction: Faction, position: GridPosition): boolean {
    return this.validateFormationPosition(faction, position);
  }

  /**
   * Get all valid positions for faction
   */
  getValidPositions(faction: Faction): GridPosition[] {
    const formation = this.formationCache.get(faction);
    return formation?.validPositions || [];
  }
}

// Export singleton instance
export const placementService = PlacementService.getInstance();