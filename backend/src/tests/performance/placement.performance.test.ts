/**
 * Placement Performance Tests
 * Verify that placement operations meet performance requirements
 */
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { placementService } from '../../services/placementService';
import { gameStateService } from '../../services/gameStateService';
import {
  GameState,
  PlayerState,
  GridPosition,
  createEmptyBoard
} from '../../types/gameState';
import { Card, Faction } from '../../types/database';

// Mock dependencies
jest.mock('../../services/gameStateService');
jest.mock('../../lib/database');

const mockGameStateService = gameStateService as jest.Mocked<typeof gameStateService>;

// Test data setup
const createTestCard = (id: string, cost: number = 3): Card => ({
  id,
  name: `Test Card ${id}`,
  faction: 'humans',
  type: 'unit',
  cost,
  attack: 2,
  hp: 3,
  range: 1,
  abilities: [],
  description: 'Test card for placement',
  flavorText: 'Test flavor',
  setId: 'test_set',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

const createTestPlayerState = (
  id: number,
  faction: Faction,
  resources: number = 5
): PlayerState => ({
  id,
  username: `Player${id}`,
  faction,
  hand: [
    createTestCard('1', 2),
    createTestCard('2', 3),
    createTestCard('3', 5)
  ],
  deck: [],
  graveyard: [],
  board: createEmptyBoard(),
  resources,
  maxResources: resources,
  resourcesSpent: 0,
  questId: 'test_quest',
  questProgress: {
    questId: 'test_quest',
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
});

const createTestGameState = (): GameState => ({
  id: 'test_game_123',
  gameId: 123,
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
    player1: createTestPlayerState(1, 'humans', 10),
    player2: createTestPlayerState(2, 'aliens', 10)
  },
  actionHistory: [],
  spectators: []
});

describe('Placement Performance Tests', () => {
  let gameState: GameState;

  beforeEach(() => {
    jest.clearAllMocks();
    gameState = createTestGameState();
    mockGameStateService.getGameState.mockResolvedValue(gameState);
    mockGameStateService.updateGameState.mockResolvedValue({
      ...gameState,
      version: gameState.version + 1
    });
  });

  describe('Validation Performance', () => {
    test('should validate placement in under 50ms', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      const startTime = performance.now();

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      const duration = performance.now() - startTime;

      expect(validation.canPlace).toBe(true);
      expect(duration).toBeLessThan(50); // Performance requirement: <50ms
    });

    test('should handle multiple rapid validations efficiently', async () => {
      const positions: GridPosition[] = [
        { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
        { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
        { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }
      ];

      const startTime = performance.now();

      const validations = await Promise.all(
        positions.map(position =>
          placementService.validatePlacement('test_game_123', 1, '1', position)
        )
      );

      const duration = performance.now() - startTime;
      const averageTime = duration / positions.length;

      // All validations should succeed for humans faction
      validations.forEach(validation => {
        expect(validation.canPlace).toBe(true);
      });

      // Average time per validation should be under 10ms
      expect(averageTime).toBeLessThan(10);
      // Total time for 9 validations should be under 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should validate different factions efficiently', async () => {
      const factionStates = {
        humans: createTestGameState(),
        aliens: createTestGameState(),
        robots: createTestGameState()
      };

      // Set up different faction states
      factionStates.aliens.players.player1.faction = 'aliens';
      factionStates.robots.players.player1.faction = 'robots';

      const position: GridPosition = { row: 1, col: 2 }; // Valid for all factions

      const startTime = performance.now();

      for (const [faction, state] of Object.entries(factionStates)) {
        mockGameStateService.getGameState.mockResolvedValue(state);

        const validation = await placementService.validatePlacement(
          'test_game_123',
          1,
          '1',
          position
        );

        expect(validation.canPlace).toBe(true);
      }

      const duration = performance.now() - startTime;
      const averageTime = duration / 3;

      // Each faction validation should average under 20ms
      expect(averageTime).toBeLessThan(20);
    });
  });

  describe('Execution Performance', () => {
    test('should execute placement in under 100ms', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      const startTime = performance.now();

      const result = await placementService.executePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Performance requirement: <100ms
    });

    test('should handle rapid sequential placements efficiently', async () => {
      // Set up game with sufficient resources
      gameState.players.player1.resources = 15;
      gameState.players.player1.resourcesSpent = 0;

      const placements = [
        { position: { row: 0, col: 1 }, cardId: '1' },
        { position: { row: 0, col: 2 }, cardId: '2' },
        { position: { row: 0, col: 3 }, cardId: '3' }
      ];

      const startTime = performance.now();

      for (let i = 0; i < placements.length; i++) {
        const placement = placements[i]!;
        const result = await placementService.executePlacement(
          'test_game_123',
          1,
          placement.cardId,
          placement.position
        );
        expect(result.success).toBe(true);

        // Update mock to reflect state changes
        gameState.players.player1.hand = gameState.players.player1.hand.slice(1);
        gameState.players.player1.resourcesSpent += 2; // Assuming cost of 2
        gameState.version++;
        mockGameStateService.getGameState.mockResolvedValue(gameState);
      }

      const duration = performance.now() - startTime;
      const averageTime = duration / placements.length;

      // Each placement should average under 50ms
      expect(averageTime).toBeLessThan(50);
      // Total time for 3 placements should be under 200ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Formation Validation Performance', () => {
    test('should validate faction formations efficiently', async () => {
      const factions: Faction[] = ['humans', 'aliens', 'robots'];
      const testPositions: GridPosition[] = [
        { row: 0, col: 0 }, { row: 0, col: 2 }, { row: 0, col: 4 },
        { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 1, col: 4 },
        { row: 2, col: 0 }, { row: 2, col: 2 }, { row: 2, col: 4 }
      ];

      const startTime = performance.now();

      let validations = 0;
      for (const faction of factions) {
        for (const position of testPositions) {
          const isValid = placementService.isValidPosition(faction, position);
          validations++;
          // Result doesn't matter for performance test, just that it completes
          expect(typeof isValid).toBe('boolean');
        }
      }

      const duration = performance.now() - startTime;
      const averageTime = duration / validations;

      // Each formation validation should be under 1ms
      expect(averageTime).toBeLessThan(1);
      // Total time for 27 validations should be under 10ms
      expect(duration).toBeLessThan(10);
    });

    test('should get valid positions efficiently', async () => {
      const factions: Faction[] = ['humans', 'aliens', 'robots'];

      const startTime = performance.now();

      for (const faction of factions) {
        const validPositions = placementService.getValidPositions(faction);
        expect(validPositions.length).toBeGreaterThan(0);
        expect(validPositions.length).toBeLessThanOrEqual(15); // Max grid size
      }

      const duration = performance.now() - startTime;

      // Getting valid positions for all factions should be under 5ms
      expect(duration).toBeLessThan(5);
    });
  });

  describe('Resource Calculation Performance', () => {
    test('should calculate resource affordability efficiently', async () => {
      const player = createTestPlayerState(1, 'humans', 10);
      const cards = Array.from({ length: 100 }, (_, i) =>
        createTestCard(`card_${i}`, Math.floor(Math.random() * 10) + 1)
      );

      const startTime = performance.now();

      const affordableCards = cards.filter(card =>
        placementService.canAffordCard(player, card)
      );

      const duration = performance.now() - startTime;

      // Should process 100 cards in under 5ms
      expect(duration).toBeLessThan(5);
      expect(affordableCards.length).toBeGreaterThan(0);
    });

    test('should deduct resources efficiently', async () => {
      const player = createTestPlayerState(1, 'humans', 10);
      const costs = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 5) + 1);

      const startTime = performance.now();

      let currentPlayer = player;
      for (const cost of costs) {
        currentPlayer = placementService.deductResources(currentPlayer, cost);
      }

      const duration = performance.now() - startTime;

      // Should process 1000 resource deductions in under 10ms
      expect(duration).toBeLessThan(10);
      expect(currentPlayer.resourcesSpent).toBeGreaterThan(player.resourcesSpent);
    });
  });

  describe('Memory Usage Performance', () => {
    test('should not leak memory during repeated operations', async () => {
      const position: GridPosition = { row: 0, col: 1 };

      // Measure memory before
      const memBefore = process.memoryUsage().heapUsed;

      // Perform 1000 validations
      for (let i = 0; i < 1000; i++) {
        await placementService.validatePlacement(
          'test_game_123',
          1,
          '1',
          position
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Measure memory after
      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;

      // Memory increase should be minimal (under 10MB for 1000 operations)
      expect(memIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent validations efficiently', async () => {
      const positions: GridPosition[] = Array.from({ length: 50 }, (_, i) => ({
        row: i % 3,
        col: (i % 5)
      }));

      const startTime = performance.now();

      // Run 50 concurrent validations
      const validations = await Promise.all(
        positions.map(position =>
          placementService.validatePlacement('test_game_123', 1, '1', position)
        )
      );

      const duration = performance.now() - startTime;

      // 50 concurrent validations should complete in under 100ms
      expect(duration).toBeLessThan(100);
      expect(validations).toHaveLength(50);
    });
  });
});