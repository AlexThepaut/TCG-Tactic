/**
 * Placement Service Tests
 * Comprehensive test suite for unit placement logic
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { placementService } from '../../services/placementService';
import { gameStateService } from '../../services/gameStateService';
import { prisma } from '../../lib/database';
import {
  GameState,
  PlayerState,
  GridPosition,
  GAME_CONSTANTS,
  FACTION_FORMATIONS,
  createEmptyBoard
} from '../../types/gameState';
import { Card, Faction } from '../../types/database';

// Mock dependencies
jest.mock('../../services/gameStateService');
jest.mock('../../lib/database');

const mockGameStateService = gameStateService as jest.Mocked<typeof gameStateService>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Test data
const createTestCard = (id: string, cost: number = 3, type: 'unit' | 'spell' = 'unit'): Card => ({
  id,
  name: `Test Card ${id}`,
  faction: 'humans',
  type,
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
  resources: number = 5,
  resourcesSpent: number = 0
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
  resourcesSpent,
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
    player1: createTestPlayerState(1, 'humans', 5, 0),
    player2: createTestPlayerState(2, 'aliens', 5, 0)
  },
  actionHistory: [],
  spectators: []
});

describe('PlacementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Formation Validation', () => {
    test('should validate correct positions for humans faction', () => {
      const humanPositions: GridPosition[] = [
        { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
        { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
        { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }
      ];

      humanPositions.forEach(position => {
        expect(placementService.isValidPosition('humans', position)).toBe(true);
      });
    });

    test('should reject invalid positions for humans faction', () => {
      const invalidPositions: GridPosition[] = [
        { row: 0, col: 0 }, { row: 0, col: 4 },
        { row: 1, col: 0 }, { row: 1, col: 4 },
        { row: 2, col: 0 }, { row: 2, col: 4 }
      ];

      invalidPositions.forEach(position => {
        expect(placementService.isValidPosition('humans', position)).toBe(false);
      });
    });

    test('should validate correct positions for aliens faction', () => {
      const alienPositions: GridPosition[] = [
        { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
        { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }
      ];

      alienPositions.forEach(position => {
        expect(placementService.isValidPosition('aliens', position)).toBe(true);
      });
    });

    test('should validate correct positions for robots faction', () => {
      const robotPositions: GridPosition[] = [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 },
        { row: 1, col: 2 },
        { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }
      ];

      robotPositions.forEach(position => {
        expect(placementService.isValidPosition('robots', position)).toBe(true);
      });
    });

    test('should get valid positions for each faction', () => {
      const humanPositions = placementService.getValidPositions('humans');
      const alienPositions = placementService.getValidPositions('aliens');
      const robotPositions = placementService.getValidPositions('robots');

      expect(humanPositions).toHaveLength(9); // 3x3 center formation
      expect(alienPositions).toHaveLength(9); // Living swarm formation
      expect(robotPositions).toHaveLength(9); // Immortal army formation
    });
  });

  describe('Resource Management', () => {
    test('should correctly check if player can afford card', () => {
      const playerState = createTestPlayerState(1, 'humans', 5, 2);
      const affordableCard = createTestCard('1', 3);
      const expensiveCard = createTestCard('2', 5);

      expect(placementService.canAffordCard(playerState, affordableCard)).toBe(true);
      expect(placementService.canAffordCard(playerState, expensiveCard)).toBe(false);
    });

    test('should deduct resources correctly', () => {
      const playerState = createTestPlayerState(1, 'humans', 5, 1);
      const updatedState = placementService.deductResources(playerState, 2);

      expect(updatedState.resourcesSpent).toBe(3);
      expect(updatedState.resources).toBe(5); // Max resources unchanged
    });
  });

  describe('Placement Validation', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createTestGameState();
      mockGameStateService.getGameState.mockResolvedValue(gameState);
    });

    test('should validate successful placement', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(validation.canPlace).toBe(true);
      expect(validation.isValid).toBe(true);
      expect(validation.resourceCost).toBe(2);
      expect(validation.formationValid).toBe(true);
      expect(validation.positionOccupied).toBe(false);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject placement on invalid formation position', async () => {
      const position: GridPosition = { row: 0, col: 0 }; // Invalid for humans
      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.formationValid).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'INVALID_FORMATION_POSITION'
        })
      );
    });

    test('should reject placement with insufficient resources', async () => {
      gameState.players.player1.resourcesSpent = 4; // Only 1 resource remaining
      const position: GridPosition = { row: 0, col: 1 };
      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '2', // Card with cost 3
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'INSUFFICIENT_RESOURCES'
        })
      );
    });

    test('should reject placement on occupied position', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      // Place a card first
      gameState.players.player1.board[0]![1] = {
        ...createTestCard('existing'),
        position,
        currentHp: 3,
        canAttack: false,
        canMove: false,
        hasAttacked: false,
        summonedThisTurn: false,
        effects: [],
        abilities: []
      };

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.positionOccupied).toBe(true);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'POSITION_OCCUPIED'
        })
      );
    });

    test('should reject placement when not players turn', async () => {
      gameState.currentPlayer = 2; // Player 2's turn
      const position: GridPosition = { row: 0, col: 1 };

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1, // Player 1 trying to place
        '1',
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'NOT_YOUR_TURN'
        })
      );
    });

    test('should reject placement during wrong phase', async () => {
      gameState.phase = 'resources';
      const position: GridPosition = { row: 0, col: 1 };

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'INVALID_PHASE'
        })
      );
    });

    test('should reject placement of spell cards', async () => {
      const spellCard = createTestCard('spell1', 2, 'spell');
      gameState.players.player1.hand[0] = spellCard;
      const position: GridPosition = { row: 0, col: 1 };

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        'spell1',
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'NOT_UNIT_CARD'
        })
      );
    });

    test('should reject placement when card not in hand', async () => {
      const position: GridPosition = { row: 0, col: 1 };

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        'nonexistent_card',
        position
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'CARD_NOT_IN_HAND'
        })
      );
    });
  });

  describe('Placement Execution', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createTestGameState();
      mockGameStateService.getGameState.mockResolvedValue(gameState);
      mockGameStateService.updateGameState.mockResolvedValue({
        ...gameState,
        version: gameState.version + 1
      });
      (mockPrisma as any).gameAction = {
        create: jest.fn() as any
      };
    });

    test('should execute successful placement', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      const result = await placementService.executePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.action?.type).toBe('place_unit');
      expect(result.action?.resourceCost).toBe(2);
    });

    test('should fail execution with validation errors', async () => {
      const position: GridPosition = { row: 0, col: 0 }; // Invalid position
      const result = await placementService.executePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('INVALID_FORMATION_POSITION');
    });

    test('should update game state correctly', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      await placementService.executePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect(mockGameStateService.updateGameState).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          players: expect.objectContaining({
            player1: expect.objectContaining({
              hand: expect.arrayContaining([
                expect.objectContaining({ id: '2' }),
                expect.objectContaining({ id: '3' })
              ]),
              resourcesSpent: 2,
              unitsPlaced: 1
            })
          }),
          actionHistory: expect.arrayContaining([
            expect.objectContaining({
              type: 'place_unit',
              playerId: 1
            })
          ])
        }),
        gameState.version
      );
    });

    test('should log action to database', async () => {
      const position: GridPosition = { row: 0, col: 1 };
      await placementService.executePlacement(
        'test_game_123',
        1,
        '1',
        position
      );

      expect((mockPrisma as any).gameAction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gameId: 123,
          playerId: 1,
          actionType: 'place_unit',
          actionData: expect.objectContaining({
            cardId: '1',
            position,
            resourceCost: 2
          }),
          turn: 1,
          phase: 'actions',
          resourceCost: 2,
          isValid: true
        })
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle nonexistent game state', async () => {
      mockGameStateService.getGameState.mockResolvedValue(null);

      const validation = await placementService.validatePlacement(
        'nonexistent_game',
        1,
        '1',
        { row: 0, col: 1 }
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'GAME_NOT_FOUND'
        })
      );
    });

    test('should handle service errors gracefully', async () => {
      mockGameStateService.getGameState.mockRejectedValue(new Error('Database error'));

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1',
        { row: 0, col: 1 }
      );

      expect(validation.canPlace).toBe(false);
      expect(validation.errors).toContain(
        expect.objectContaining({
          code: 'PLACEMENT_SERVICE_ERROR'
        })
      );
    });

    test('should handle boundary positions correctly', async () => {
      const gameState = createTestGameState();
      mockGameStateService.getGameState.mockResolvedValue(gameState);

      // Test all corner positions
      const cornerPositions: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 4 },
        { row: 2, col: 0 },
        { row: 2, col: 4 }
      ];

      for (const position of cornerPositions) {
        const validation = await placementService.validatePlacement(
          'test_game_123',
          1,
          '1',
          position
        );
        // Humans can't place in corners
        expect(validation.formationValid).toBe(false);
      }
    });

    test('should provide helpful warnings for resource efficiency', async () => {
      const gameState = createTestGameState();
      gameState.players.player1.resources = 8; // High resources
      gameState.players.player1.resourcesSpent = 0;
      mockGameStateService.getGameState.mockResolvedValue(gameState);

      const validation = await placementService.validatePlacement(
        'test_game_123',
        1,
        '1', // Low cost card (2)
        { row: 0, col: 1 }
      );

      expect(validation.warnings).toContain(
        expect.objectContaining({
          code: 'RESOURCE_EFFICIENCY'
        })
      );
    });
  });
});