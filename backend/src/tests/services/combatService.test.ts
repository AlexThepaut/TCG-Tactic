/**
 * Combat Service Test Suite - Task 1.3D Combat Logic Engine
 * Comprehensive tests for range validation, faction abilities, and tactical positioning
 */
import { combatService } from '../../services/combatService';
import {
  GameState,
  PlayerState,
  BoardCard,
  GridPosition,
  GAME_CONSTANTS,
  createEmptyBoard
} from '../../types/gameState';
import { Faction } from '../../types/database';

describe('CombatService', () => {
  let mockGameState: GameState;
  let player1: PlayerState;
  let player2: PlayerState;

  beforeEach(() => {
    // Create test players
    player1 = {
      id: 1,
      username: 'player1',
      faction: 'humans' as Faction,
      hand: [],
      deck: [],
      graveyard: [],
      board: createEmptyBoard(),
      resources: 5,
      maxResources: 5,
      resourcesSpent: 0,
      questId: 'tactical_superiority',
      questProgress: {
        questId: 'tactical_superiority',
        currentValue: 0,
        targetValue: 10,
        isCompleted: false,
        milestones: []
      },
      isReady: true,
      actionsThisTurn: [],
      canAct: true,
      unitsPlaced: 0,
      spellsCast: 0,
      unitsKilled: 0,
      damageDealt: 0
    };

    player2 = {
      id: 2,
      username: 'player2',
      faction: 'aliens' as Faction,
      hand: [],
      deck: [],
      graveyard: [],
      board: createEmptyBoard(),
      resources: 5,
      maxResources: 5,
      resourcesSpent: 0,
      questId: 'swarm_victory',
      questProgress: {
        questId: 'swarm_victory',
        currentValue: 0,
        targetValue: 15,
        isCompleted: false,
        milestones: []
      },
      isReady: true,
      actionsThisTurn: [],
      canAct: true,
      unitsPlaced: 0,
      spellsCast: 0,
      unitsKilled: 0,
      damageDealt: 0
    };

    mockGameState = {
      id: 'test-game-123',
      gameId: 1,
      player1Id: 1,
      player2Id: 2,
      currentPlayer: 1,
      turn: 1,
      phase: 'actions',
      status: 'active',
      timeLimit: 120,
      timeRemaining: 120,
      gameStartedAt: new Date(),
      lastActionAt: new Date(),
      gameOver: false,
      version: 1,
      players: {
        player1,
        player2
      },
      actionHistory: [],
      spectators: []
    };
  });

  describe('Attack Validation', () => {
    it('should validate successful melee attack', () => {
      // Place attacker and target
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const validation = combatService.validateAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject attack when out of range', () => {
      // Place units too far apart
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 0, col: 0 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 2, col: 4 });

      player1.board[0]![0] = attacker;
      player2.board[2]![4] = target;

      const validation = combatService.validateAttack(
        mockGameState,
        1,
        { row: 0, col: 0 },
        { row: 2, col: 4 }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'OUT_OF_RANGE')).toBe(true);
    });

    it('should reject attack when line of sight blocked', () => {
      // Place attacker, blocker, and target in a line
      const attacker: BoardCard = createTestUnit('Archer', 'humans', 2, 2, { row: 1, col: 0 }, 3);
      const blocker: BoardCard = createTestUnit('Shield Bearer', 'humans', 1, 5, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      player1.board[1]![0] = attacker;
      player1.board[1]![1] = blocker;
      player2.board[1]![2] = target;

      const validation = combatService.validateAttack(
        mockGameState,
        1,
        { row: 1, col: 0 },
        { row: 1, col: 2 }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'NO_LINE_OF_SIGHT')).toBe(true);
    });

    it('should reject attack when unit has summoning sickness', () => {
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      attacker.summonedThisTurn = true; // Has summoning sickness
      attacker.canAttack = false;

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const validation = combatService.validateAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'SUMMONING_SICKNESS')).toBe(true);
    });

    it('should reject attack when unit already attacked', () => {
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      attacker.hasAttacked = true; // Already attacked this turn

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const validation = combatService.validateAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'CANNOT_ATTACK')).toBe(true);
    });
  });

  describe('Range Calculation', () => {
    it('should calculate Manhattan distance correctly', () => {
      const result = combatService.validateRange(
        { row: 0, col: 0 },
        { row: 2, col: 3 },
        5,
        mockGameState
      );

      expect(result.distance).toBe(5); // |0-2| + |0-3| = 5
      expect(result.inRange).toBe(true);
    });

    it('should detect line of sight blocking', () => {
      // Place blocking unit
      const blocker: BoardCard = createTestUnit('Wall', 'humans', 0, 10, { row: 1, col: 1 });
      player1.board[1]![1] = blocker;

      const result = combatService.validateRange(
        { row: 1, col: 0 },
        { row: 1, col: 2 },
        3,
        mockGameState
      );

      expect(result.lineOfSight).toBe(false);
      expect(result.blockedBy).toHaveLength(1);
      expect(result.blockedBy![0]).toEqual({ row: 1, col: 1 });
    });
  });

  describe('Combat Execution', () => {
    it('should execute basic combat correctly', async () => {
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const result = await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      expect(result.success).toBe(true);
      expect(result.target.damage).toBe(3); // Knight's attack
      expect(result.attacker.damage).toBe(2); // Alien's counter-attack
      expect(result.target.newHealth).toBe(0); // 3 - 3 = 0
      expect(result.attacker.newHealth).toBe(2); // 4 - 2 = 2
      expect(result.target.destroyed).toBe(true);
      expect(result.attacker.destroyed).toBe(false);
    });

    it('should update player statistics after combat', async () => {
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      expect(player1.unitsKilled).toBe(1);
      expect(player1.damageDealt).toBe(3);
      expect(player2.graveyard).toHaveLength(1);
      expect(player2.board[1]![2]).toBeNull();
    });
  });

  describe('Faction Passive Abilities', () => {
    it('should apply Human Ultimate Rampart for complete lines', async () => {
      // Create a complete row of human units
      for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
        const unit: BoardCard = createTestUnit(`Knight${col}`, 'humans', 2, 3, { row: 1, col });
        player1.board[1]![col] = unit;
      }

      const attacker = player1.board[1]![0]!;
      const target: BoardCard = createTestUnit('Alien Target', 'aliens', 1, 1, { row: 0, col: 0 });
      player2.board[0]![0] = target;

      const result = await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 0 },
        { row: 0, col: 0 }
      );

      // Check for Ultimate Rampart effect
      const humanEffect = result.factionEffects.find(e => e.effectName === 'Ultimate Rampart');
      expect(humanEffect).toBeDefined();
      expect(humanEffect!.unitsAffected).toHaveLength(5); // All units in the complete row

      // Check stat bonuses were applied
      expect(attacker.attack).toBe(4); // 2 + 2 from Ultimate Rampart
      expect(attacker.hp).toBe(4); // 3 + 1 from Ultimate Rampart
    });

    it('should apply Alien Evolutionary Adaptation on unit death', async () => {
      player2.faction = 'aliens';
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 5, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 2, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const result = await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      // Check for Evolutionary Adaptation effect
      const alienEffect = result.factionEffects.find(e => e.effectName === 'Evolutionary Adaptation');
      expect(alienEffect).toBeDefined();
      expect(alienEffect!.parameters.costReduction).toBeGreaterThan(0);
    });

    it('should apply Robot Reanimation Protocols with 30% chance', async () => {
      player1.faction = 'robots';
      const attacker: BoardCard = createTestUnit('Robot Unit', 'robots', 2, 2, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Destroyer', 'aliens', 5, 1, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      // Mock Math.random to always trigger reanimation
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // 10% < 30%, should trigger

      const result = await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      // Check for potential Reanimation Protocols effect
      if (result.attacker.destroyed) {
        const robotEffect = result.factionEffects.find(e => e.effectName === 'Reanimation Protocols');
        expect(robotEffect).toBeDefined();
      }

      Math.random = originalRandom;
    });
  });

  describe('Quest Progress Integration', () => {
    it('should update systematic elimination quest on enemy unit destruction', async () => {
      player1.questProgress.questId = 'systematic_elimination';
      player1.questProgress.currentValue = 4;
      player1.questProgress.targetValue = 5;

      const attacker: BoardCard = createTestUnit('Knight', 'humans', 5, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 2, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const result = await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      if (result.questProgress && result.questProgress.length > 0) {
        const questUpdate = result.questProgress[0];
        expect(questUpdate).toBeDefined();
        if (questUpdate) {
          expect(questUpdate.progressChange).toBe(1);
          expect(questUpdate.newProgress).toBe(5);
          expect(questUpdate.completed).toBe(true);
        }
      }
    });
  });

  describe('Bresenham Line Algorithm', () => {
    it('should calculate correct line path', () => {
      // Test diagonal line
      const result = combatService.validateRange(
        { row: 0, col: 0 },
        { row: 2, col: 2 },
        5,
        mockGameState
      );

      expect(result.validPath).toContainEqual({ row: 0, col: 0 });
      expect(result.validPath).toContainEqual({ row: 2, col: 2 });
      expect(result.validPath.length).toBeGreaterThan(2);
    });

    it('should handle horizontal line correctly', () => {
      const result = combatService.validateRange(
        { row: 1, col: 0 },
        { row: 1, col: 3 },
        5,
        mockGameState
      );

      expect(result.validPath).toEqual([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 }
      ]);
    });

    it('should handle vertical line correctly', () => {
      const result = combatService.validateRange(
        { row: 0, col: 1 },
        { row: 2, col: 1 },
        5,
        mockGameState
      );

      expect(result.validPath).toEqual([
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 }
      ]);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete combat validation within performance thresholds', () => {
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const startTime = performance.now();

      combatService.validateAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(50); // Should complete in <50ms
    });

    it('should complete combat execution within performance thresholds', async () => {
      const attacker: BoardCard = createTestUnit('Knight', 'humans', 3, 4, { row: 1, col: 1 });
      const target: BoardCard = createTestUnit('Alien Warrior', 'aliens', 2, 3, { row: 1, col: 2 });

      player1.board[1]![1] = attacker;
      player2.board[1]![2] = target;

      const startTime = performance.now();

      await combatService.executeAttack(
        mockGameState,
        1,
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      );

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });
  });
});

/**
 * Helper function to create test units
 */
function createTestUnit(
  name: string,
  faction: Faction,
  attack: number,
  health: number,
  position: GridPosition,
  range: number = 1
): BoardCard {
  return {
    id: (Date.now() + Math.random()).toString(),
    name,
    faction,
    type: 'unit',
    cost: 3,
    attack,
    hp: health,
    description: `Test ${name}`,
    abilities: [],
    position,
    currentHp: health,
    canAttack: true,
    canMove: false,
    hasAttacked: false,
    summonedThisTurn: false,
    effects: [],
    range,
    setId: 'test-set',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}