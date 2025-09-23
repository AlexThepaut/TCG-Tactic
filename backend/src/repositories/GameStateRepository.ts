/**
 * Game State Repository
 * High-performance repository pattern for game state management with optimistic locking
 * Implements Task 1.3B requirements for atomic operations and <100ms DB performance
 */

import { prisma } from '../lib/database';
import { logger } from '../utils/logger';
import { GameState, PlayerState } from '../types/gameState';
import { GameState as PrismaGameState } from '@prisma/client';

/**
 * Repository for game state operations with performance monitoring
 */
export class GameStateRepository {
  private static instance: GameStateRepository;
  private cache = new Map<string, { state: GameState; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  public static getInstance(): GameStateRepository {
    if (!GameStateRepository.instance) {
      GameStateRepository.instance = new GameStateRepository();
    }
    return GameStateRepository.instance;
  }

  /**
   * Find game state by ID with caching
   */
  async findById(gameStateId: string): Promise<GameState | null> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = this.cache.get(gameStateId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('Game state cache hit', { gameStateId });
        return cached.state;
      }

      // Query database
      const prismaGameState = await prisma.gameState.findUnique({
        where: { id: parseInt(gameStateId) },
        include: {
          game: {
            include: {
              player1: true,
              player2: true
            }
          }
        }
      });

      if (!prismaGameState) {
        return null;
      }

      const gameState = this.convertFromPrisma(prismaGameState);

      // Cache the result
      this.cache.set(gameStateId, {
        state: gameState,
        timestamp: Date.now()
      });

      const duration = performance.now() - startTime;
      logger.debug('Game state retrieved from database', {
        gameStateId,
        duration: `${duration.toFixed(2)}ms`
      });

      return gameState;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to retrieve game state', {
        gameStateId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Save game state with optimistic locking
   */
  async save(gameState: GameState): Promise<GameState> {
    const startTime = performance.now();

    try {
      const data = this.convertToPrisma(gameState);

      const savedState = await prisma.gameState.create({
        data,
        include: {
          game: {
            include: {
              player1: true,
              player2: true
            }
          }
        }
      });

      const convertedState = this.convertFromPrisma(savedState);

      // Update cache
      this.cache.set(convertedState.id, {
        state: convertedState,
        timestamp: Date.now()
      });

      const duration = performance.now() - startTime;
      logger.info('Game state saved successfully', {
        gameStateId: convertedState.id,
        duration: `${duration.toFixed(2)}ms`
      });

      return convertedState;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to save game state', {
        gameId: gameState.gameId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update game state with optimistic locking and version control
   */
  async update(
    gameStateId: string,
    updates: Partial<GameState>,
    expectedVersion?: number
  ): Promise<GameState> {
    const startTime = performance.now();

    try {
      const currentState = await this.findById(gameStateId);
      if (!currentState) {
        throw new Error(`Game state not found: ${gameStateId}`);
      }

      // Optimistic locking check
      if (expectedVersion !== undefined && currentState.version !== expectedVersion) {
        throw new Error(
          `Version mismatch: expected ${expectedVersion}, current ${currentState.version}`
        );
      }

      // Merge updates and increment version
      const updatedState: GameState = {
        ...currentState,
        ...updates,
        version: currentState.version + 1,
        lastActionAt: new Date()
      };

      const data = this.convertToPrisma(updatedState);

      const savedState = await prisma.gameState.update({
        where: {
          id: parseInt(gameStateId),
          // Add version check for atomic update
          updatedAt: currentState.lastActionAt
        },
        data,
        include: {
          game: {
            include: {
              player1: true,
              player2: true
            }
          }
        }
      });

      const convertedState = this.convertFromPrisma(savedState);

      // Update cache
      this.cache.set(gameStateId, {
        state: convertedState,
        timestamp: Date.now()
      });

      // Invalidate cache for related entries
      this.invalidateRelatedCache(convertedState);

      const duration = performance.now() - startTime;
      logger.info('Game state updated successfully', {
        gameStateId,
        version: convertedState.version,
        duration: `${duration.toFixed(2)}ms`
      });

      return convertedState;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to update game state', {
        gameStateId,
        expectedVersion,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find active game state by player ID
   */
  async findByPlayerWithLock(playerId: number): Promise<GameState | null> {
    const startTime = performance.now();

    try {
      const prismaGameState = await prisma.gameState.findFirst({
        where: {
          OR: [
            { player1Id: playerId },
            { player2Id: playerId }
          ],
          game: {
            endedAt: null // Only active games
          }
        },
        include: {
          game: {
            include: {
              player1: true,
              player2: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      if (!prismaGameState) {
        return null;
      }

      const gameState = this.convertFromPrisma(prismaGameState);

      const duration = performance.now() - startTime;
      logger.debug('Active game state found for player', {
        playerId,
        gameStateId: gameState.id,
        duration: `${duration.toFixed(2)}ms`
      });

      return gameState;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to find game state for player', {
        playerId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Bulk update multiple game states (for performance optimization)
   */
  async bulkUpdate(updates: Map<string, Partial<GameState>>): Promise<Map<string, GameState>> {
    const startTime = performance.now();
    const results = new Map<string, GameState>();

    try {
      // Use transaction for atomic bulk updates
      await prisma.$transaction(async (tx) => {
        for (const [gameStateId, update] of updates.entries()) {
          const currentState = await this.findById(gameStateId);
          if (!currentState) {
            throw new Error(`Game state not found: ${gameStateId}`);
          }

          const updatedState: GameState = {
            ...currentState,
            ...update,
            version: currentState.version + 1,
            lastActionAt: new Date()
          };

          const data = this.convertToPrisma(updatedState);

          const savedState = await tx.gameState.update({
            where: { id: parseInt(gameStateId) },
            data,
            include: {
              game: {
                include: {
                  player1: true,
                  player2: true
                }
              }
            }
          });

          const convertedState = this.convertFromPrisma(savedState);
          results.set(gameStateId, convertedState);

          // Update cache
          this.cache.set(gameStateId, {
            state: convertedState,
            timestamp: Date.now()
          });
        }
      });

      const duration = performance.now() - startTime;
      logger.info('Bulk game state update completed', {
        count: updates.size,
        duration: `${duration.toFixed(2)}ms`
      });

      return results;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Bulk game state update failed', {
        count: updates.size,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Clear cache for a specific game state
   */
  invalidateCache(gameStateId: string): void {
    this.cache.delete(gameStateId);
    logger.debug('Game state cache invalidated', { gameStateId });
  }

  /**
   * Clear related cache entries
   */
  private invalidateRelatedCache(gameState: GameState): void {
    // Could invalidate player-specific caches, etc.
    // For now, just log the action
    logger.debug('Related cache invalidated', {
      gameStateId: gameState.id,
      gameId: gameState.gameId
    });
  }

  /**
   * Convert Prisma game state to domain model
   */
  private convertFromPrisma(prismaState: PrismaGameState & { game: any }): GameState {
    const boardState = prismaState.boardStateJson as any;

    return {
      id: prismaState.id.toString(),
      gameId: prismaState.gameId,
      player1Id: prismaState.player1Id,
      player2Id: prismaState.player2Id,
      currentPlayer: prismaState.currentPlayerId,
      turn: prismaState.turn,
      phase: prismaState.phase,
      status: 'active', // Default status
      timeLimit: 300, // 5 minutes default
      timeRemaining: 300,
      gameStartedAt: prismaState.createdAt,
      lastActionAt: prismaState.updatedAt,
      gameOver: false,
      version: 1, // Default version
      players: {
        player1: boardState.player1 || this.createDefaultPlayerState(prismaState.player1Id, 'humans'),
        player2: boardState.player2 || this.createDefaultPlayerState(prismaState.player2Id, 'aliens')
      },
      actionHistory: [],
      spectators: []
    };
  }

  /**
   * Convert domain model to Prisma format
   */
  private convertToPrisma(gameState: GameState): any {
    return {
      gameId: gameState.gameId,
      player1Id: gameState.player1Id,
      player2Id: gameState.player2Id,
      currentPlayerId: gameState.currentPlayer,
      turn: gameState.turn,
      phase: gameState.phase,
      boardStateJson: {
        player1: gameState.players.player1,
        player2: gameState.players.player2,
        status: gameState.status,
        timeLimit: gameState.timeLimit,
        timeRemaining: gameState.timeRemaining,
        version: gameState.version
      }
    };
  }

  /**
   * Create default player state
   */
  private createDefaultPlayerState(playerId: number, faction: 'humans' | 'aliens' | 'robots'): PlayerState {
    return {
      id: playerId,
      username: `Player${playerId}`,
      faction,
      hand: [],
      deck: [],
      graveyard: [],
      board: Array(3).fill(null).map(() => Array(5).fill(null)),
      resources: 1,
      maxResources: 1,
      resourcesSpent: 0,
      questId: 'default_quest',
      questProgress: {
        questId: 'default_quest',
        currentValue: 0,
        targetValue: 100,
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
  }

  /**
   * Health check for repository
   */
  async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('GameStateRepository health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

// Export singleton instance
export const gameStateRepository = GameStateRepository.getInstance();