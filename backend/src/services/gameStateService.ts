/**
 * Game State Service
 * Core service for managing game states with database persistence and in-memory caching
 */
import { prisma } from '../lib/database';
import { logger, loggers } from '../utils/logger';
import {
  GameState,
  PlayerState,
  GameConfig,
  GameStateUpdate,
  ValidationResult,
  GAME_CONSTANTS,
  createEmptyBoard,
  FACTION_FORMATIONS,
  QuestProgress
} from '../types/gameState';
import { Faction, Card, BoardState, FORMATION_PATTERNS } from '../types/database';

// In-memory cache for active games (Redis alternative for development)
class GameStateCache {
  private cache = new Map<string, GameState>();
  private lastAccessed = new Map<string, Date>();
  private readonly maxSize = 1000;
  private readonly ttl = 3600000; // 1 hour TTL

  set(gameId: string, state: GameState): void {
    this.cache.set(gameId, state);
    this.lastAccessed.set(gameId, new Date());
    this.cleanup();
  }

  get(gameId: string): GameState | null {
    const state = this.cache.get(gameId);
    if (state) {
      this.lastAccessed.set(gameId, new Date());
      return state;
    }
    return null;
  }

  delete(gameId: string): boolean {
    this.lastAccessed.delete(gameId);
    return this.cache.delete(gameId);
  }

  has(gameId: string): boolean {
    return this.cache.has(gameId);
  }

  clear(): void {
    this.cache.clear();
    this.lastAccessed.clear();
  }

  private cleanup(): void {
    if (this.cache.size <= this.maxSize) return;

    const now = Date.now();
    const entriesToRemove: string[] = [];

    // Remove expired entries
    for (const [gameId, lastAccess] of this.lastAccessed) {
      if (now - lastAccess.getTime() > this.ttl) {
        entriesToRemove.push(gameId);
      }
    }

    // Remove oldest entries if still over limit
    if (this.cache.size - entriesToRemove.length > this.maxSize) {
      const sortedEntries = Array.from(this.lastAccessed.entries())
        .sort(([,a], [,b]) => a.getTime() - b.getTime());

      const additional = this.cache.size - entriesToRemove.length - this.maxSize;
      entriesToRemove.push(...sortedEntries.slice(0, additional).map(([id]) => id));
    }

    // Remove selected entries
    for (const gameId of entriesToRemove) {
      this.cache.delete(gameId);
      this.lastAccessed.delete(gameId);
    }

    loggers.game.debug('Cache cleanup completed', {
      removed: entriesToRemove.length,
      remaining: this.cache.size
    });
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      oldestEntry: this.lastAccessed.size > 0
        ? Math.min(...Array.from(this.lastAccessed.values()).map(d => d.getTime()))
        : null
    };
  }
}

// Optimistic locking error
export class OptimisticLockError extends Error {
  constructor(gameId: string, expectedVersion: number, actualVersion: number) {
    super(`Optimistic lock failed for game ${gameId}. Expected version ${expectedVersion}, got ${actualVersion}`);
    this.name = 'OptimisticLockError';
  }
}

// Game state validation error
export class GameStateValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'GameStateValidationError';
  }
}

/**
 * Game State Service
 * Manages game states with database persistence and caching
 */
export class GameStateService {
  private static instance: GameStateService;
  private cache = new GameStateCache();

  private constructor() {}

  static getInstance(): GameStateService {
    if (!GameStateService.instance) {
      GameStateService.instance = new GameStateService();
    }
    return GameStateService.instance;
  }

  /**
   * Create a new game state
   */
  async createGameState(config: GameConfig): Promise<GameState> {
    try {
      loggers.game.info('Creating new game state', { config });

      // Validate configuration
      const validation = this.validateGameConfig(config);
      if (!validation.isValid) {
        throw new GameStateValidationError(
          'Invalid game configuration',
          validation.errors.map(e => e.message)
        );
      }

      // Create persistent game record first
      const gameRecord = await prisma.game.create({
        data: {
          player1Id: config.player1Config.userId,
          player2Id: config.player2Config.userId,
          player1DeckId: config.player1Config.deckId,
          player2DeckId: config.player2Config.deckId,
        }
      });

      // Generate unique game state ID
      const gameStateId = `game_${gameRecord.id}_${Date.now()}`;

      // Initialize player states
      const { questPreference: qp1, ...p1Config } = config.player1Config;
      const player1State = await this.createPlayerState({
        ...p1Config,
        ...(qp1 && { questPreference: qp1 })
      });
      const { questPreference: qp2, ...p2Config } = config.player2Config;
      const player2State = await this.createPlayerState({
        ...p2Config,
        ...(qp2 && { questPreference: qp2 })
      });

      // Create game state
      const gameState: GameState = {
        id: gameStateId,
        gameId: gameRecord.id,
        player1Id: config.player1Config.userId,
        player2Id: config.player2Config.userId,
        currentPlayer: config.player1Config.userId, // Player 1 starts
        turn: 0,
        phase: 'resources',
        status: 'waiting',
        timeLimit: config.timeLimit,
        timeRemaining: config.timeLimit,
        gameStartedAt: new Date(),
        lastActionAt: new Date(),
        gameOver: false,
        version: 1,
        players: {
          player1: player1State,
          player2: player2State
        },
        actionHistory: [],
        spectators: []
      };

      // Persist initial state to database
      await this.persistGameState(gameState);

      // Cache the state
      this.cache.set(gameStateId, gameState);

      loggers.game.info('Game state created successfully', {
        gameStateId,
        gameId: gameRecord.id,
        players: [player1State.id, player2State.id]
      });

      return gameState;

    } catch (error: any) {
      loggers.game.error('Failed to create game state', {
        config,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get game state by ID with caching
   */
  async getGameState(gameStateId: string): Promise<GameState | null> {
    try {
      // Check cache first
      const cached = this.cache.get(gameStateId);
      if (cached) {
        loggers.game.debug('Game state retrieved from cache', { gameStateId });
        return cached;
      }

      // Fallback to database
      const gameState = await this.loadGameStateFromDatabase(gameStateId);
      if (gameState) {
        this.cache.set(gameStateId, gameState);
        loggers.game.debug('Game state loaded from database', { gameStateId });
      }

      return gameState;

    } catch (error: any) {
      loggers.game.error('Failed to get game state', {
        gameStateId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Update game state with optimistic locking
   */
  async updateGameState(
    gameStateId: string,
    updates: Partial<GameState>,
    expectedVersion?: number
  ): Promise<GameState> {
    try {
      loggers.game.debug('Updating game state', { gameStateId, updates });

      // Get current state
      const currentState = await this.getGameState(gameStateId);
      if (!currentState) {
        throw new Error(`Game state ${gameStateId} not found`);
      }

      // Check optimistic lock if version provided
      if (expectedVersion !== undefined && currentState.version !== expectedVersion) {
        throw new OptimisticLockError(gameStateId, expectedVersion, currentState.version);
      }

      // Apply updates
      const updatedState: GameState = {
        ...currentState,
        ...updates,
        version: currentState.version + 1,
        lastActionAt: new Date()
      };

      // Validate updated state
      const validation = this.validateGameState(updatedState);
      if (!validation.isValid) {
        throw new GameStateValidationError(
          'Updated game state is invalid',
          validation.errors.map(e => e.message)
        );
      }

      // Persist to database
      await this.persistGameState(updatedState);

      // Update cache
      this.cache.set(gameStateId, updatedState);

      loggers.game.info('Game state updated successfully', {
        gameStateId,
        version: updatedState.version,
        status: updatedState.status,
        turn: updatedState.turn,
        phase: updatedState.phase
      });

      return updatedState;

    } catch (error: any) {
      loggers.game.error('Failed to update game state', {
        gameStateId,
        updates,
        expectedVersion,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete game state
   */
  async deleteGameState(gameStateId: string): Promise<boolean> {
    try {
      loggers.game.info('Deleting game state', { gameStateId });

      // Remove from cache
      this.cache.delete(gameStateId);

      // Extract game ID for database cleanup
      const gameIdMatch = gameStateId.match(/^game_(\d+)_/);
      if (gameIdMatch) {
        const gameId = parseInt(gameIdMatch[1]!);

        // Delete game state records
        await prisma.gameState.deleteMany({
          where: { gameId: gameId }
        });

        loggers.game.info('Game state deleted successfully', { gameStateId, gameId });
        return true;
      }

      loggers.game.warn('Could not extract game ID from state ID', { gameStateId });
      return false;

    } catch (error: any) {
      loggers.game.error('Failed to delete game state', {
        gameStateId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * List active game states
   */
  async listActiveGames(): Promise<GameState[]> {
    try {
      // Get from cache first
      const cachedGames: GameState[] = [];
      for (const [gameId, state] of this.cache['cache']) {
        if (state.status === 'active' || state.status === 'waiting') {
          cachedGames.push(state);
        }
      }

      // Also check database for games not in cache
      const dbGames = await prisma.gameState.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const dbGameStates: GameState[] = [];
      for (const dbGame of dbGames) {
        try {
          const boardState = dbGame.boardStateJson as any;
          if (boardState && (boardState.status === 'active' || boardState.status === 'waiting')) {
            const gameState = this.dbRecordToGameState(dbGame);
            if (gameState && !this.cache.has(gameState.id)) {
              dbGameStates.push(gameState);
            }
          }
        } catch (error) {
          loggers.game.warn('Skipping invalid game state from database', {
            gameStateId: dbGame.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const allGames = [...cachedGames, ...dbGameStates];

      loggers.game.debug('Listed active games', {
        cached: cachedGames.length,
        fromDb: dbGameStates.length,
        total: allGames.length
      });

      return allGames;

    } catch (error: any) {
      loggers.game.error('Failed to list active games', { error: error.message });
      return [];
    }
  }

  /**
   * Handle concurrent update conflict resolution
   */
  async handleConcurrentUpdate(
    gameStateId: string,
    clientState: GameState,
    conflictResolution: 'server_wins' | 'client_wins' | 'merge' = 'server_wins'
  ): Promise<GameState> {
    try {
      const serverState = await this.getGameState(gameStateId);
      if (!serverState) {
        throw new Error(`Game state ${gameStateId} not found on server`);
      }

      switch (conflictResolution) {
        case 'server_wins':
          loggers.game.info('Conflict resolved: server state wins', { gameStateId });
          return serverState;

        case 'client_wins':
          loggers.game.info('Conflict resolved: client state wins', { gameStateId });
          return await this.updateGameState(gameStateId, clientState);

        case 'merge':
          // Intelligent merge logic
          const mergedState = this.mergeGameStates(serverState, clientState);
          loggers.game.info('Conflict resolved: states merged', { gameStateId });
          return await this.updateGameState(gameStateId, mergedState);

        default:
          return serverState;
      }

    } catch (error: any) {
      loggers.game.error('Failed to handle concurrent update', {
        gameStateId,
        conflictResolution,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache (for testing/maintenance)
   */
  clearCache(): void {
    this.cache.clear();
    loggers.game.info('Game state cache cleared');
  }

  // Private helper methods

  async createPlayerState(config: { userId: number; faction: Faction; deckId: number; questPreference?: string }): Promise<PlayerState> {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: config.userId }
    });
    if (!user) {
      throw new Error(`User ${config.userId} not found`);
    }

    // Get deck with cards
    const deck = await prisma.deck.findUnique({
      where: { id: config.deckId },
      include: {
        deckCards: {
          include: { card: true }
        }
      }
    });
    if (!deck) {
      throw new Error(`Deck ${config.deckId} not found`);
    }

    // Validate deck faction matches
    if (deck.faction !== config.faction) {
      throw new Error(`Deck faction ${deck.faction} does not match player faction ${config.faction}`);
    }

    // Create shuffled deck
    const deckCards: Card[] = [];
    if (deck.deckCards) {
      for (const deckCard of deck.deckCards) {
        for (let i = 0; i < deckCard.quantity; i++) {
          deckCards.push(deckCard.card as any as Card);
        }
      }
    }

    // Shuffle deck
    for (let i = deckCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckCards[i], deckCards[j]] = [deckCards[j]!, deckCards[i]!];
    }

    // Generate quest
    const questId = this.generateQuest(config.faction, config.questPreference);
    const questProgress: QuestProgress = {
      questId,
      currentValue: 0,
      targetValue: this.getQuestTargetValue(questId),
      isCompleted: false,
      milestones: []
    };

    return {
      id: config.userId,
      username: user.username,
      faction: config.faction,
      hand: [],
      deck: deckCards,
      graveyard: [],
      board: createEmptyBoard(),
      resources: 0,
      maxResources: 0,
      resourcesSpent: 0,
      questId,
      questProgress,
      isReady: false,
      actionsThisTurn: [],
      canAct: false,
      unitsPlaced: 0,
      spellsCast: 0,
      unitsKilled: 0,
      damageDealt: 0
    };
  }

  private async persistGameState(gameState: GameState): Promise<void> {
    const boardStateJson: BoardState = {
      player1: gameState.players.player1 as any,
      player2: gameState.players.player2 as any,
      currentPlayer: gameState.currentPlayer,
      turn: gameState.turn,
      phase: gameState.phase,
      gameOver: gameState.gameOver,
      winner: gameState.winner || 0
    };

    await prisma.gameState.upsert({
      where: {
        id: parseInt(gameState.id.split('_')[2]!) || 0
      },
      create: {
        gameId: gameState.gameId,
        player1Id: gameState.player1Id,
        player2Id: gameState.player2Id,
        currentPlayerId: gameState.currentPlayer,
        turn: gameState.turn,
        phase: gameState.phase,
        boardStateJson: boardStateJson as any,
        createdAt: gameState.gameStartedAt
      },
      update: {
        currentPlayerId: gameState.currentPlayer,
        turn: gameState.turn,
        phase: gameState.phase,
        boardStateJson: boardStateJson as any
      }
    });
  }

  private async loadGameStateFromDatabase(gameStateId: string): Promise<GameState | null> {
    const gameIdMatch = gameStateId.match(/^game_(\d+)_/);
    if (!gameIdMatch) return null;

    const gameId = parseInt(gameIdMatch[1]!);

    const dbRecord = await prisma.gameState.findFirst({
      where: { gameId: gameId },
      orderBy: { createdAt: 'desc' }
    });

    if (!dbRecord) return null;

    return this.dbRecordToGameState(dbRecord);
  }

  private dbRecordToGameState(dbRecord: any): GameState | null {
    try {
      const boardState = dbRecord.boardStateJson as BoardState;

      return {
        id: `game_${dbRecord.gameId}_${dbRecord.createdAt.getTime()}`,
        gameId: dbRecord.gameId,
        player1Id: dbRecord.player1Id,
        player2Id: dbRecord.player2Id,
        currentPlayer: dbRecord.currentPlayerId,
        turn: dbRecord.turn,
        phase: dbRecord.phase,
        status: boardState.gameOver ? 'completed' : 'active',
        timeLimit: GAME_CONSTANTS.DEFAULT_TIME_LIMIT,
        timeRemaining: GAME_CONSTANTS.DEFAULT_TIME_LIMIT,
        gameStartedAt: dbRecord.createdAt,
        lastActionAt: new Date(),
        gameOver: boardState.gameOver,
        ...(boardState.winner !== undefined && boardState.winner !== 0 && { winner: boardState.winner }),
        version: 1,
        players: {
          player1: boardState.player1 as any,
          player2: boardState.player2 as any
        },
        actionHistory: [],
        spectators: []
      };
    } catch (error) {
      loggers.game.error('Failed to parse game state from database', {
        gameId: dbRecord.gameId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private validateGameConfig(config: GameConfig): ValidationResult {
    const errors: any[] = [];

    // Validate time limit
    if (config.timeLimit < GAME_CONSTANTS.MIN_TIME_LIMIT || config.timeLimit > GAME_CONSTANTS.MAX_TIME_LIMIT) {
      errors.push({
        code: 'INVALID_TIME_LIMIT',
        message: `Time limit must be between ${GAME_CONSTANTS.MIN_TIME_LIMIT} and ${GAME_CONSTANTS.MAX_TIME_LIMIT} seconds`,
        severity: 'error'
      });
    }

    // Validate player configs
    if (!config.player1Config.userId || !config.player2Config.userId) {
      errors.push({
        code: 'INVALID_PLAYERS',
        message: 'Both players must be specified',
        severity: 'error'
      });
    }

    if (config.player1Config.userId === config.player2Config.userId) {
      errors.push({
        code: 'SAME_PLAYER',
        message: 'Players cannot be the same user',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private validateGameState(gameState: GameState): ValidationResult {
    const errors: any[] = [];

    // Validate basic structure
    if (!gameState.id || !gameState.gameId) {
      errors.push({
        code: 'MISSING_IDS',
        message: 'Game state must have valid ID and game ID',
        severity: 'error'
      });
    }

    // Validate players
    if (!gameState.players.player1 || !gameState.players.player2) {
      errors.push({
        code: 'MISSING_PLAYERS',
        message: 'Game state must have both players',
        severity: 'error'
      });
    }

    // Validate turn consistency
    if (gameState.turn < 0) {
      errors.push({
        code: 'INVALID_TURN',
        message: 'Turn number cannot be negative',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private mergeGameStates(serverState: GameState, clientState: GameState): GameState {
    // Intelligent merge prioritizing server state for critical fields
    return {
      ...clientState,
      version: serverState.version + 1,
      gameId: serverState.gameId,
      player1Id: serverState.player1Id,
      player2Id: serverState.player2Id,
      gameStartedAt: serverState.gameStartedAt,
      // Keep server's action history and critical game state
      actionHistory: serverState.actionHistory,
      turn: Math.max(serverState.turn, clientState.turn),
      lastActionAt: new Date()
    };
  }

  private generateQuest(faction: Faction, preference?: string): string {
    const quests = {
      humans: ['tactical_superiority', 'defensive_mastery', 'coordinated_strike'],
      aliens: ['evolutionary_dominance', 'adaptive_survival', 'swarm_victory'],
      robots: ['technological_supremacy', 'persistent_advance', 'systematic_elimination']
    };

    const factionQuests = quests[faction];

    if (preference && factionQuests.includes(preference)) {
      return preference;
    }

    const randomIndex = Math.floor(Math.random() * factionQuests.length);
    return factionQuests[randomIndex]!;
  }

  private getQuestTargetValue(questId: string): number {
    // Quest target values based on quest type
    const questTargets: Record<string, number> = {
      tactical_superiority: 15,    // Control 15 grid positions
      defensive_mastery: 10,       // Prevent 10 attacks
      coordinated_strike: 20,      // Deal 20 coordinated damage
      evolutionary_dominance: 8,   // Evolve 8 units
      adaptive_survival: 12,       // Survive 12 attacks
      swarm_victory: 25,           // Summon 25 units
      technological_supremacy: 5,  // Deploy 5 advanced units
      persistent_advance: 15,      // Resurrect 15 units
      systematic_elimination: 10   // Eliminate 10 enemy units
    };

    return questTargets[questId] || 10;
  }
}

// Export singleton instance
export const gameStateService = GameStateService.getInstance();