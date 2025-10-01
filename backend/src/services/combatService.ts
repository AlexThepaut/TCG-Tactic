/**
 * Combat Service - Task 1.3D Combat Logic Engine
 * Comprehensive combat resolution with range validation, tactical positioning, and faction abilities
 */
import {
  GameState,
  PlayerState,
  BoardCard,
  GridPosition,
  AttackActionData,
  ValidationResult,
  ValidationError,
  GAME_CONSTANTS,
  FACTION_FORMATIONS,
  getPlayerState,
  getOpponentState
} from '../types/gameState';
import { Card, Faction } from '../types/database';
import { logger, loggers } from '../utils/logger';

/**
 * Combat result interface for detailed attack resolution
 */
export interface CombatResult {
  success: boolean;
  attacker: {
    unit: BoardCard;
    position: GridPosition;
    damage: number;
    destroyed: boolean;
    newHealth: number;
  };
  target: {
    unit: BoardCard;
    position: GridPosition;
    damage: number;
    destroyed: boolean;
    newHealth: number;
  };
  factionEffects: FactionEffectResult[];
  questProgress?: QuestProgressUpdate[];
}

export interface FactionEffectResult {
  faction: Faction;
  effectName: string;
  description: string;
  unitsAffected: GridPosition[];
  parameters: Record<string, any>;
}

export interface QuestProgressUpdate {
  playerId: number;
  questId: string;
  progressChange: number;
  newProgress: number;
  completed: boolean;
}

/**
 * Range calculation results
 */
export interface RangeValidationResult {
  inRange: boolean;
  distance: number;
  lineOfSight: boolean;
  blockedBy?: GridPosition[];
  validPath: GridPosition[];
}

/**
 * Combat Engine Service
 * Handles all combat mechanics including range, line of sight, and faction abilities
 */
export class CombatService {
  private static instance: CombatService;

  private constructor() {}

  static getInstance(): CombatService {
    if (!CombatService.instance) {
      CombatService.instance = new CombatService();
    }
    return CombatService.instance;
  }

  /**
   * Validate if an attack is legal
   */
  validateAttack(
    gameState: GameState,
    attackerId: number,
    attackerPos: GridPosition,
    targetPos: GridPosition
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      const attackerPlayer = getPlayerState(gameState, attackerId);
      const targetPlayer = getOpponentState(gameState, attackerId);

      if (!attackerPlayer || !targetPlayer) {
        errors.push({
          code: 'INVALID_PLAYER',
          message: 'Invalid player state',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      // Get units
      const attacker = attackerPlayer.board[attackerPos.row]?.[attackerPos.col];
      const target = targetPlayer.board[targetPos.row]?.[targetPos.col];

      if (!attacker) {
        errors.push({
          code: 'NO_ATTACKER',
          message: 'No unit found at attacker position',
          severity: 'error'
        });
      }

      if (!target) {
        errors.push({
          code: 'NO_TARGET',
          message: 'No target unit found',
          severity: 'error'
        });
      }

      if (!attacker || !target) {
        return { isValid: false, errors, warnings };
      }

      // Check if attacker can attack this turn
      if (!attacker.canAttack || attacker.hasAttacked) {
        errors.push({
          code: 'CANNOT_ATTACK',
          message: 'Unit cannot attack this turn',
          severity: 'error'
        });
      }

      // Check summoning sickness
      if (attacker.summonedThisTurn) {
        errors.push({
          code: 'SUMMONING_SICKNESS',
          message: 'Unit has summoning sickness',
          severity: 'error'
        });
      }

      // Validate range and line of sight
      const rangeValidation = this.validateRange(
        attackerPos,
        targetPos,
        attacker.range || 1,
        gameState
      );

      if (!rangeValidation.inRange) {
        errors.push({
          code: 'OUT_OF_RANGE',
          message: `Target is out of range. Distance: ${rangeValidation.distance}, Max range: ${attacker.range || 1}`,
          severity: 'error'
        });
      }

      if (!rangeValidation.lineOfSight) {
        errors.push({
          code: 'NO_LINE_OF_SIGHT',
          message: 'Line of sight blocked by other units',
          severity: 'error'
        });
      }

      // Validate grid positions
      if (!this.isValidPosition(attackerPos) || !this.isValidPosition(targetPos)) {
        errors.push({
          code: 'INVALID_POSITION',
          message: 'Invalid grid position',
          severity: 'error'
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error: any) {
      loggers.game.error('Attack validation failed', {
        gameId: gameState.id,
        attackerId,
        attackerPos,
        targetPos,
        error: error.message
      });

      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Attack validation failed due to system error',
          severity: 'error'
        }],
        warnings
      };
    }
  }

  /**
   * Execute attack and return detailed combat result
   */
  async executeAttack(
    gameState: GameState,
    attackerId: number,
    attackerPos: GridPosition,
    targetPos: GridPosition
  ): Promise<CombatResult> {
    try {
      const attackerPlayer = getPlayerState(gameState, attackerId);
      const targetPlayer = getOpponentState(gameState, attackerId);

      if (!attackerPlayer || !targetPlayer) {
        throw new Error('Invalid player state');
      }

      const attacker = attackerPlayer.board[attackerPos.row]?.[attackerPos.col];
      const target = targetPlayer.board[targetPos.row]?.[targetPos.col];

      if (!attacker || !target) {
        throw new Error('Invalid units for combat');
      }

      // Calculate base damage
      const attackerDamage = this.calculateDamage(attacker, target);
      const counterDamage = this.calculateCounterDamage(target, attacker);

      // Apply damage
      const attackerNewHealth = Math.max(0, attacker.currentHp - counterDamage);
      const targetNewHealth = Math.max(0, target.currentHp - attackerDamage);

      // Determine destruction
      const attackerDestroyed = attackerNewHealth <= 0;
      const targetDestroyed = targetNewHealth <= 0;

      // Update unit states
      attacker.currentHp = attackerNewHealth;
      attacker.hasAttacked = true;
      target.currentHp = targetNewHealth;

      // Handle unit destruction
      if (targetDestroyed) {
        targetPlayer.board[targetPos.row]![targetPos.col] = null;
        targetPlayer.graveyard.push(target);
        attackerPlayer.unitsKilled++;
      }

      if (attackerDestroyed) {
        attackerPlayer.board[attackerPos.row]![attackerPos.col] = null;
        attackerPlayer.graveyard.push(attacker);
      }

      // Update player statistics
      attackerPlayer.damageDealt += attackerDamage;

      // Process faction passive abilities
      const factionEffects = await this.processFactionPassives(
        gameState,
        attackerPlayer,
        targetPlayer,
        { attackerDestroyed, targetDestroyed, attackerPos, targetPos }
      );

      // Calculate quest progress
      const questProgress = await this.calculateQuestProgress(
        gameState,
        attackerId,
        { attackerDestroyed, targetDestroyed }
      );

      const result: CombatResult = {
        success: true,
        attacker: {
          unit: attacker,
          position: attackerPos,
          damage: counterDamage,
          destroyed: attackerDestroyed,
          newHealth: attackerNewHealth
        },
        target: {
          unit: target,
          position: targetPos,
          damage: attackerDamage,
          destroyed: targetDestroyed,
          newHealth: targetNewHealth
        },
        factionEffects,
        questProgress
      };

      loggers.game.info('Combat executed successfully', {
        gameId: gameState.id,
        attackerId,
        attackerName: attacker.name,
        targetName: target.name,
        attackerDamage,
        counterDamage,
        targetDestroyed,
        attackerDestroyed
      });

      return result;

    } catch (error: any) {
      loggers.game.error('Combat execution failed', {
        gameId: gameState.id,
        attackerId,
        attackerPos,
        targetPos,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Calculate damage considering faction abilities and modifiers
   */
  calculateDamage(attacker: BoardCard, target: BoardCard): number {
    let baseDamage = attacker.attack || 0;

    // Apply faction-specific damage modifiers
    baseDamage = this.applyDamageModifiers(attacker, target, baseDamage);

    // Apply temporary effects
    for (const effect of attacker.effects) {
      if (effect.name === 'attack_boost') {
        baseDamage += effect.parameters.bonus || 0;
      }
    }

    // Apply defensive effects on target
    for (const effect of target.effects) {
      if (effect.name === 'damage_reduction') {
        baseDamage = Math.max(0, baseDamage - (effect.parameters.reduction || 0));
      }
    }

    return Math.max(0, baseDamage);
  }

  /**
   * Calculate counter-attack damage
   */
  calculateCounterDamage(defender: BoardCard, attacker: BoardCard): number {
    // Only units can counter-attack, spells cannot
    if (defender.type !== 'unit') return 0;

    let counterDamage = defender.attack || 0;

    // Apply counter-attack modifiers
    counterDamage = this.applyDamageModifiers(defender, attacker, counterDamage);

    return Math.max(0, counterDamage);
  }

  /**
   * Apply faction-specific damage modifiers
   */
  private applyDamageModifiers(attacker: BoardCard, target: BoardCard, baseDamage: number): number {
    let modifiedDamage = baseDamage;

    // Human Ultimate Rampart bonus is applied in faction passives
    // Alien and Robot modifiers would be applied here if they affect damage

    return modifiedDamage;
  }

  /**
   * Validate attack range and line of sight
   */
  validateRange(
    attackerPos: GridPosition,
    targetPos: GridPosition,
    maxRange: number,
    gameState: GameState
  ): RangeValidationResult {
    // Calculate Manhattan distance
    const distance = this.calculateManhattanDistance(attackerPos, targetPos);
    const inRange = distance <= maxRange;

    // Check line of sight using Bresenham's algorithm
    const lineOfSight = this.checkLineOfSight(attackerPos, targetPos, gameState);

    // Get valid path for tactical positioning
    const validPath = this.calculatePath(attackerPos, targetPos);

    return {
      inRange,
      distance,
      lineOfSight: lineOfSight.clear,
      blockedBy: lineOfSight.blockedBy,
      validPath
    };
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  calculateManhattanDistance(pos1: GridPosition, pos2: GridPosition): number {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
  }

  /**
   * Check line of sight using Bresenham's line algorithm
   */
  checkLineOfSight(
    from: GridPosition,
    to: GridPosition,
    gameState: GameState
  ): { clear: boolean; blockedBy: GridPosition[] } {
    const blockedBy: GridPosition[] = [];
    const path = this.bresenhamLine(from, to);

    // Check each position in the path (excluding start and end)
    for (let i = 1; i < path.length - 1; i++) {
      const pos = path[i];

      // Check if position is valid
      if (!pos || !this.isValidPosition(pos)) continue;

      // Check both players' boards for blocking units
      const player1Unit = gameState.players.player1.board[pos.row]?.[pos.col];
      const player2Unit = gameState.players.player2.board[pos.row]?.[pos.col];

      if (player1Unit || player2Unit) {
        blockedBy.push(pos);
      }
    }

    return {
      clear: blockedBy.length === 0,
      blockedBy
    };
  }

  /**
   * Bresenham's line algorithm for line of sight calculation
   */
  private bresenhamLine(from: GridPosition, to: GridPosition): GridPosition[] {
    const path: GridPosition[] = [];

    let x0 = from.col, y0 = from.row;
    let x1 = to.col, y1 = to.row;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      path.push({ row: y0, col: x0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return path;
  }

  /**
   * Calculate tactical movement path
   */
  private calculatePath(from: GridPosition, to: GridPosition): GridPosition[] {
    // Simple direct path calculation
    // In a more advanced implementation, this could use A* pathfinding
    return this.bresenhamLine(from, to);
  }

  /**
   * Process faction passive abilities triggered by combat
   */
  private async processFactionPassives(
    gameState: GameState,
    attackerPlayer: PlayerState,
    targetPlayer: PlayerState,
    combatEvent: {
      attackerDestroyed: boolean;
      targetDestroyed: boolean;
      attackerPos: GridPosition;
      targetPos: GridPosition;
    }
  ): Promise<FactionEffectResult[]> {
    const effects: FactionEffectResult[] = [];

    try {
      // Process attacker's faction passives
      const attackerEffects = await this.processFactionPassive(
        attackerPlayer,
        gameState,
        combatEvent
      );
      effects.push(...attackerEffects);

      // Process target's faction passives
      const targetEffects = await this.processFactionPassive(
        targetPlayer,
        gameState,
        combatEvent
      );
      effects.push(...targetEffects);

      return effects;

    } catch (error: any) {
      loggers.game.error('Faction passive processing failed', {
        gameId: gameState.id,
        error: error.message
      });
      return effects;
    }
  }

  /**
   * Process individual faction passive ability
   */
  private async processFactionPassive(
    player: PlayerState,
    gameState: GameState,
    combatEvent: any
  ): Promise<FactionEffectResult[]> {
    const effects: FactionEffectResult[] = [];

    switch (player.faction) {
      case 'humans':
        const humanEffects = await this.processHumanPassive(player, gameState);
        effects.push(...humanEffects);
        break;

      case 'aliens':
        if (combatEvent.targetDestroyed || combatEvent.attackerDestroyed) {
          const alienEffects = await this.processAlienPassive(player, gameState);
          effects.push(...alienEffects);
        }
        break;

      case 'robots':
        if (combatEvent.targetDestroyed || combatEvent.attackerDestroyed) {
          const robotEffects = await this.processRobotPassive(
            player,
            gameState,
            combatEvent
          );
          effects.push(...robotEffects);
        }
        break;
    }

    return effects;
  }

  /**
   * Process Human faction passive: Ultimate Rampart
   */
  private async processHumanPassive(
    player: PlayerState,
    gameState: GameState
  ): Promise<FactionEffectResult[]> {
    const effects: FactionEffectResult[] = [];
    const completeLines = this.findCompleteLines(player.board);

    if (completeLines.length > 0) {
      const affectedPositions: GridPosition[] = [];

      for (const line of completeLines) {
        for (const position of line) {
          const unit = player.board[position.row]?.[position.col];
          if (unit) {
            // Apply Ultimate Rampart bonus
            unit.attack = (unit.attack || 0) + 2;
            unit.hp = (unit.hp || 0) + 1;
            unit.currentHp += 1;
            affectedPositions.push(position);
          }
        }
      }

      if (affectedPositions.length > 0) {
        effects.push({
          faction: 'humans',
          effectName: 'Ultimate Rampart',
          description: 'Complete lines get +2 ATK/+1 HP',
          unitsAffected: affectedPositions,
          parameters: { attackBonus: 2, healthBonus: 1 }
        });
      }
    }

    return effects;
  }

  /**
   * Process Alien faction passive: Evolutionary Adaptation
   */
  private async processAlienPassive(
    player: PlayerState,
    gameState: GameState
  ): Promise<FactionEffectResult[]> {
    const effects: FactionEffectResult[] = [];

    // Count aliens that died this turn
    const alienDeaths = player.graveyard.filter(
      card => card.faction === 'aliens'
    ).length;

    if (alienDeaths > 0) {
      effects.push({
        faction: 'aliens',
        effectName: 'Evolutionary Adaptation',
        description: 'Dead aliens reduce next summon cost by 1',
        unitsAffected: [],
        parameters: { costReduction: alienDeaths }
      });
    }

    return effects;
  }

  /**
   * Process Robot faction passive: Reanimation Protocols
   */
  private async processRobotPassive(
    player: PlayerState,
    gameState: GameState,
    combatEvent: any
  ): Promise<FactionEffectResult[]> {
    const effects: FactionEffectResult[] = [];

    // Find destroyed robot units
    const destroyedRobots = player.graveyard.filter(
      card => card.faction === 'robots'
    );

    for (const robot of destroyedRobots) {
      if (Math.random() < 0.3) { // 30% chance
        // Find empty position to resurrect
        const resurrectionPos = this.findEmptyPosition(player.board, player.faction);

        if (resurrectionPos) {
          // Resurrect with 1 HP
          const resurrectedUnit: BoardCard = {
            ...robot,
            position: resurrectionPos,
            currentHp: 1,
            canAttack: false,
            canMove: false,
            hasAttacked: false,
            summonedThisTurn: true,
            effects: []
          };

          player.board[resurrectionPos.row]![resurrectionPos.col] = resurrectedUnit;
          player.graveyard = player.graveyard.filter(card => card.id !== robot.id);

          effects.push({
            faction: 'robots',
            effectName: 'Reanimation Protocols',
            description: '30% chance to resurrect with 1 HP',
            unitsAffected: [resurrectionPos],
            parameters: { resurrectedUnit: robot.id, health: 1 }
          });
        }
      }
    }

    return effects;
  }

  /**
   * Find complete lines for Human faction passive
   */
  private findCompleteLines(board: (BoardCard | null)[][]): GridPosition[][] {
    const completeLines: GridPosition[][] = [];

    // Check rows
    for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
      const rowPositions: GridPosition[] = [];
      let isComplete = true;

      for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
        if (board[row]?.[col]) {
          rowPositions.push({ row, col });
        } else {
          isComplete = false;
          break;
        }
      }

      if (isComplete && rowPositions.length > 0) {
        completeLines.push(rowPositions);
      }
    }

    // Check columns
    for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
      const colPositions: GridPosition[] = [];
      let isComplete = true;

      for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
        if (board[row]?.[col]) {
          colPositions.push({ row, col });
        } else {
          isComplete = false;
          break;
        }
      }

      if (isComplete && colPositions.length > 0) {
        completeLines.push(colPositions);
      }
    }

    return completeLines;
  }

  /**
   * Find empty position for unit resurrection
   */
  private findEmptyPosition(
    board: (BoardCard | null)[][],
    faction: Faction
  ): GridPosition | null {
    const formation = FACTION_FORMATIONS[faction];
    if (!formation) return null;

    // Check formation positions for empty spots
    for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
      for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
        if (formation.pattern[row]?.[col] && !board[row]?.[col]) {
          return { row, col };
        }
      }
    }

    return null;
  }

  /**
   * Calculate quest progress from combat actions
   */
  private async calculateQuestProgress(
    gameState: GameState,
    attackerId: number,
    combatEvent: { attackerDestroyed: boolean; targetDestroyed: boolean }
  ): Promise<QuestProgressUpdate[]> {
    const updates: QuestProgressUpdate[] = [];

    try {
      const player = getPlayerState(gameState, attackerId);
      if (!player || player.questProgress.isCompleted) return updates;

      let progressIncrease = 0;

      // Calculate progress based on quest type
      switch (player.questProgress.questId) {
        case 'systematic_elimination':
          if (combatEvent.targetDestroyed) {
            progressIncrease = 1;
          }
          break;

        case 'tactical_superiority':
          // Combat engagement counts toward tactical superiority
          progressIncrease = 1;
          break;

        default:
          break;
      }

      if (progressIncrease > 0) {
        const newProgress = player.questProgress.currentValue + progressIncrease;
        const completed = newProgress >= player.questProgress.targetValue;

        if (completed) {
          player.questProgress.isCompleted = true;
          player.questProgress.completedAt = new Date();
        }
        player.questProgress.currentValue = newProgress;

        updates.push({
          playerId: attackerId,
          questId: player.questProgress.questId,
          progressChange: progressIncrease,
          newProgress,
          completed
        });
      }

      return updates;

    } catch (error: any) {
      loggers.game.error('Quest progress calculation failed', {
        gameId: gameState.id,
        attackerId,
        error: error.message
      });
      return updates;
    }
  }

  /**
   * Validate if a grid position is valid
   */
  private isValidPosition(position: GridPosition): boolean {
    return position.row >= 0 &&
           position.row < GAME_CONSTANTS.BOARD_ROWS &&
           position.col >= 0 &&
           position.col < GAME_CONSTANTS.BOARD_COLS;
  }
}

// Export singleton instance
export const combatService = CombatService.getInstance();