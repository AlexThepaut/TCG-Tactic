/**
 * Game Validation Service
 * Comprehensive validation for game actions and state transitions
 */
import {
  GameState,
  PlayerState,
  GameAction,
  GameActionType,
  ValidationResult,
  GridPosition,
  PlaceUnitActionData,
  AttackActionData,
  CastSpellActionData,
  GAME_CONSTANTS,
  FACTION_FORMATIONS,
  isValidGridPosition,
  isCurrentPlayer,
  canPerformAction,
  getPlayerState,
  getOpponentState
} from '../types/gameState';
import { Card, Faction } from '../types/database';
import { logger, loggers } from '../utils/logger';

/**
 * Game Validation Service
 * Validates all game actions and state transitions
 */
export class GameValidationService {
  private static instance: GameValidationService;

  private constructor() {}

  static getInstance(): GameValidationService {
    if (!GameValidationService.instance) {
      GameValidationService.instance = new GameValidationService();
    }
    return GameValidationService.instance;
  }

  /**
   * Validate a game action before execution
   */
  validateAction(gameState: GameState, action: GameAction): ValidationResult {
    try {
      const errors: any[] = [];

      // Basic action validation
      const basicValidation = this.validateBasicAction(gameState, action);
      errors.push(...basicValidation.errors);

      // Turn order validation
      const turnValidation = this.validateTurnOrder(gameState, action.playerId);
      errors.push(...turnValidation.errors);

      // Phase validation
      const phaseValidation = this.validateActionPhase(gameState, action);
      errors.push(...phaseValidation.errors);

      // Action-specific validation
      const actionValidation = this.validateSpecificAction(gameState, action);
      errors.push(...actionValidation.errors);

      return {
        isValid: errors.length === 0,
        errors,
        warnings: []
      };

    } catch (error: any) {
      loggers.game.error('Action validation failed', {
        gameId: gameState.id,
        actionId: action.id,
        error: error.message
      });

      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error.message}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate turn order and player permissions
   */
  validateTurnOrder(gameState: GameState, playerId: number): ValidationResult {
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
        code: 'NOT_PLAYER_TURN',
        message: 'It is not your turn',
        severity: 'error'
      });
    }

    // Check if player exists in game
    const playerState = getPlayerState(gameState, playerId);
    if (!playerState) {
      errors.push({
        code: 'PLAYER_NOT_IN_GAME',
        message: 'Player is not part of this game',
        severity: 'error'
      });
    }

    // Check if player can act in current phase
    if (playerState && !playerState.canAct) {
      errors.push({
        code: 'PLAYER_CANNOT_ACT',
        message: 'Player cannot perform actions in current state',
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
   * Validate faction formation enforcement
   */
  validateFormation(gameState: GameState, playerId: number, position: GridPosition): ValidationResult {
    const errors: any[] = [];

    const playerState = getPlayerState(gameState, playerId);
    if (!playerState) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found in game',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Get faction formation
    const formation = FACTION_FORMATIONS[playerState.faction];
    if (!formation) {
      errors.push({
        code: 'INVALID_FACTION',
        message: 'Invalid faction configuration',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Check if position is valid for faction
    if (!isValidGridPosition(position)) {
      errors.push({
        code: 'INVALID_POSITION',
        message: 'Position is outside valid grid boundaries',
        severity: 'error'
      });
    } else if (!formation.pattern[position.row]?.[position.col]) {
      errors.push({
        code: 'INVALID_FORMATION_POSITION',
        message: `Position (${position.row}, ${position.col}) is not valid for ${playerState.faction} formation`,
        severity: 'error'
      });
    }

    // Check if position is already occupied
    const existingCard = playerState.board[position.row]?.[position.col];
    if (existingCard) {
      errors.push({
        code: 'POSITION_OCCUPIED',
        message: 'Position is already occupied by another unit',
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
   * Validate resource availability
   */
  validateResources(gameState: GameState, playerId: number, requiredResources: number): ValidationResult {
    const errors: any[] = [];

    const playerState = getPlayerState(gameState, playerId);
    if (!playerState) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found in game',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Check if player has enough resources
    const availableResources = playerState.resources - playerState.resourcesSpent;
    if (availableResources < requiredResources) {
      errors.push({
        code: 'INSUFFICIENT_RESOURCES',
        message: `Insufficient resources. Required: ${requiredResources}, Available: ${availableResources}`,
        severity: 'error'
      });
    }

    // Check resource bounds
    if (requiredResources < 0) {
      errors.push({
        code: 'NEGATIVE_RESOURCE_COST',
        message: 'Resource cost cannot be negative',
        severity: 'error'
      });
    }

    if (requiredResources > GAME_CONSTANTS.MAX_RESOURCES) {
      errors.push({
        code: 'EXCESSIVE_RESOURCE_COST',
        message: `Resource cost exceeds maximum (${GAME_CONSTANTS.MAX_RESOURCES})`,
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
   * Validate move legality (unit placement, attacks, spells)
   */
  validateMove(gameState: GameState, action: GameAction): ValidationResult {
    const errors: any[] = [];

    switch (action.type) {
      case 'place_unit':
        const placeValidation = this.validateUnitPlacement(gameState, action);
        errors.push(...placeValidation.errors);
        break;

      case 'attack':
        const attackValidation = this.validateAttack(gameState, action);
        errors.push(...attackValidation.errors);
        break;

      case 'cast_spell':
        const spellValidation = this.validateSpellCast(gameState, action);
        errors.push(...spellValidation.errors);
        break;

      default:
        // Other action types handled elsewhere
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate win condition detection
   */
  validateWinCondition(gameState: GameState): { hasWinner: boolean; winnerId?: number; condition?: string } {
    try {
      // Check quest completion
      for (const [playerKey, playerState] of Object.entries(gameState.players)) {
        if (playerState.questProgress.isCompleted) {
          return {
            hasWinner: true,
            winnerId: playerState.id,
            condition: 'quest_completed'
          };
        }
      }

      // Check deck empty condition
      for (const [playerKey, playerState] of Object.entries(gameState.players)) {
        if (playerState.deck.length === 0 && playerState.hand.length === 0) {
          const opponentState = getOpponentState(gameState, playerState.id);
          return {
            hasWinner: true,
            winnerId: opponentState?.id || 0,
            condition: 'deck_empty'
          };
        }
      }

      // Check turn limit
      if (gameState.turn >= GAME_CONSTANTS.MAX_TURNS) {
        // Determine winner by quest progress or other criteria
        const player1Progress = gameState.players.player1.questProgress.currentValue;
        const player2Progress = gameState.players.player2.questProgress.currentValue;

        if (player1Progress > player2Progress) {
          return {
            hasWinner: true,
            winnerId: gameState.player1Id,
            condition: 'timeout'
          };
        } else if (player2Progress > player1Progress) {
          return {
            hasWinner: true,
            winnerId: gameState.player2Id,
            condition: 'timeout'
          };
        }
        // Draw condition - could be handled differently
      }

      return { hasWinner: false };

    } catch (error: any) {
      loggers.game.error('Win condition validation failed', {
        gameId: gameState.id,
        error: error.message
      });
      return { hasWinner: false };
    }
  }

  // Private validation methods

  private validateBasicAction(gameState: GameState, action: GameAction): ValidationResult {
    const errors: any[] = [];

    // Validate action structure
    if (!action.id || !action.playerId || !action.type) {
      errors.push({
        code: 'INVALID_ACTION_STRUCTURE',
        message: 'Action must have valid ID, player ID, and type',
        severity: 'error'
      });
    }

    // Validate player exists
    const playerState = getPlayerState(gameState, action.playerId);
    if (!playerState) {
      errors.push({
        code: 'INVALID_PLAYER',
        message: 'Action player is not part of this game',
        severity: 'error'
      });
    }

    // Validate turn and phase consistency
    if (action.turn !== gameState.turn) {
      errors.push({
        code: 'TURN_MISMATCH',
        message: `Action turn ${action.turn} does not match game turn ${gameState.turn}`,
        severity: 'error'
      });
    }

    if (action.phase !== gameState.phase) {
      errors.push({
        code: 'PHASE_MISMATCH',
        message: `Action phase ${action.phase} does not match game phase ${gameState.phase}`,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private validateActionPhase(gameState: GameState, action: GameAction): ValidationResult {
    const errors: any[] = [];

    if (!canPerformAction(gameState, action.playerId, action.type)) {
      errors.push({
        code: 'INVALID_ACTION_FOR_PHASE',
        message: `Action ${action.type} cannot be performed during ${gameState.phase} phase`,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private validateSpecificAction(gameState: GameState, action: GameAction): ValidationResult {
    switch (action.type) {
      case 'place_unit':
        return this.validateUnitPlacement(gameState, action);
      case 'attack':
        return this.validateAttack(gameState, action);
      case 'cast_spell':
        return this.validateSpellCast(gameState, action);
      case 'end_turn':
        return this.validateEndTurn(gameState, action);
      case 'surrender':
        return this.validateSurrender(gameState, action);
      default:
        return {
          isValid: true,
          errors: [],
          warnings: []
        };
    }
  }

  private validateUnitPlacement(gameState: GameState, action: GameAction): ValidationResult {
    const errors: any[] = [];
    const data = action.data as PlaceUnitActionData;

    if (!data) {
      errors.push({
        code: 'MISSING_ACTION_DATA',
        message: 'Unit placement action missing required data',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    const playerState = getPlayerState(gameState, action.playerId);
    if (!playerState) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Validate hand index
    if (data.handIndex < 0 || data.handIndex >= playerState.hand.length) {
      errors.push({
        code: 'INVALID_HAND_INDEX',
        message: 'Invalid hand index',
        severity: 'error'
      });
    } else {
      const card = playerState.hand[data.handIndex];

      // Validate card type
      if (card?.type !== 'unit') {
        errors.push({
          code: 'INVALID_CARD_TYPE',
          message: 'Only unit cards can be placed on the board',
          severity: 'error'
        });
      }

      // Validate resource cost
      const resourceValidation = this.validateResources(gameState, action.playerId, card?.cost || 0);
      errors.push(...resourceValidation.errors);
    }

    // Validate position and formation
    const formationValidation = this.validateFormation(gameState, action.playerId, data.position);
    errors.push(...formationValidation.errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private validateAttack(gameState: GameState, action: GameAction): ValidationResult {
    const errors: any[] = [];
    const data = action.data as AttackActionData;

    if (!data) {
      errors.push({
        code: 'MISSING_ACTION_DATA',
        message: 'Attack action missing required data',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    const playerState = getPlayerState(gameState, action.playerId);
    const opponentState = getOpponentState(gameState, action.playerId);

    if (!playerState || !opponentState) {
      errors.push({
        code: 'PLAYERS_NOT_FOUND',
        message: 'Could not find player states',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Validate attacker exists and belongs to player
    const attacker = playerState.board[data.attackerPosition.row]?.[data.attackerPosition.col];
    if (!attacker) {
      errors.push({
        code: 'NO_ATTACKER',
        message: 'No unit found at attacker position',
        severity: 'error'
      });
    } else {
      // Validate attacker can attack
      if (!attacker.canAttack || attacker.hasAttacked) {
        errors.push({
          code: 'ATTACKER_CANNOT_ATTACK',
          message: 'Unit cannot attack this turn',
          severity: 'error'
        });
      }

      // Validate summoning sickness
      if (attacker.summonedThisTurn) {
        errors.push({
          code: 'SUMMONING_SICKNESS',
          message: 'Unit cannot attack on the turn it was summoned',
          severity: 'error'
        });
      }
    }

    // Validate target exists and belongs to opponent
    const target = opponentState.board[data.targetPosition.row]?.[data.targetPosition.col];
    if (!target) {
      errors.push({
        code: 'NO_TARGET',
        message: 'No valid target found at target position',
        severity: 'error'
      });
    }

    // Validate attack range if both units exist
    if (attacker && target) {
      const isInRange = this.validateAttackRange(attacker, data.attackerPosition, data.targetPosition);
      if (!isInRange) {
        errors.push({
          code: 'TARGET_OUT_OF_RANGE',
          message: 'Target is out of attack range',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private validateSpellCast(gameState: GameState, action: GameAction): ValidationResult {
    const errors: any[] = [];
    const data = action.data as CastSpellActionData;

    if (!data) {
      errors.push({
        code: 'MISSING_ACTION_DATA',
        message: 'Spell cast action missing required data',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    const playerState = getPlayerState(gameState, action.playerId);
    if (!playerState) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found',
        severity: 'error'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Validate hand index
    if (data.handIndex < 0 || data.handIndex >= playerState.hand.length) {
      errors.push({
        code: 'INVALID_HAND_INDEX',
        message: 'Invalid hand index',
        severity: 'error'
      });
    } else {
      const card = playerState.hand[data.handIndex];

      // Validate card type
      if (card?.type !== 'spell') {
        errors.push({
          code: 'INVALID_CARD_TYPE',
          message: 'Only spell cards can be cast',
          severity: 'error'
        });
      }

      // Validate resource cost
      const resourceValidation = this.validateResources(gameState, action.playerId, card?.cost || 0);
      errors.push(...resourceValidation.errors);
    }

    // Validate targets
    for (const target of (data.targets || [])) {
      if (!isValidGridPosition(target)) {
        errors.push({
          code: 'INVALID_TARGET_POSITION',
          message: `Invalid target position (${(target as GridPosition).row}, ${(target as GridPosition).col})`,
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private validateEndTurn(gameState: GameState, action: GameAction): ValidationResult {
    // End turn is generally always valid if it's the player's turn
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  private validateSurrender(gameState: GameState, action: GameAction): ValidationResult {
    // Surrender is generally always valid if it's the player's turn
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  private validateAttackRange(attacker: any, attackerPos: GridPosition, targetPos: GridPosition): boolean {
    if (!attacker.range) return false;

    // Parse range (e.g., "1", "1-2", "1-3")
    const range = attacker.range.toString();
    const [minRange, maxRange] = range.includes('-')
      ? range.split('-').map(Number)
      : [1, Number(range)];

    // Calculate distance
    const distance = Math.max(
      Math.abs(attackerPos.row - targetPos.row),
      Math.abs(attackerPos.col - targetPos.col)
    );

    return distance >= minRange && distance <= maxRange;
  }
}

// Export singleton instance
export const gameValidationService = GameValidationService.getInstance();