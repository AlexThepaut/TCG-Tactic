/**
 * Game Action Logger
 * High-performance action logging with batch processing for Task 1.3B requirements
 * Handles comprehensive action tracking, debugging, and audit trails
 */

import { prisma } from '../lib/database';
import { logger } from '../utils/logger';
import { GameAction, GameActionType, GameState } from '../types/gameState';
import { GameAction as PrismaGameAction } from '@prisma/client';

/**
 * Performance metrics for action logging
 */
export interface ActionLogMetrics {
  totalActions: number;
  batchSize: number;
  avgBatchTime: number;
  errorRate: number;
  lastFlushTime: Date;
}

/**
 * Action statistics for player analysis
 */
export interface ActionStats {
  playerId: number;
  totalActions: number;
  actionsByType: Record<GameActionType, number>;
  avgActionTime: number;
  errorCount: number;
  lastActionTime: Date;
}

/**
 * Logger for game actions with batch processing and performance optimization
 */
export class GameActionLogger {
  private static instance: GameActionLogger;
  private batchQueue: GameAction[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private metrics: ActionLogMetrics = {
    totalActions: 0,
    batchSize: 0,
    avgBatchTime: 0,
    errorRate: 0,
    lastFlushTime: new Date()
  };

  public static getInstance(): GameActionLogger {
    if (!GameActionLogger.instance) {
      GameActionLogger.instance = new GameActionLogger();
    }
    return GameActionLogger.instance;
  }

  private constructor() {
    // Start the flush timer
    this.scheduleFlush();

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.forceFlush());
    process.on('SIGINT', () => this.forceFlush());
  }

  /**
   * Log a single game action with batching
   */
  async logAction(gameAction: GameAction): Promise<void> {
    const startTime = performance.now();

    try {
      // Add correlation ID if not present
      if (!gameAction.correlationId) {
        gameAction.correlationId = this.generateCorrelationId();
      }

      // Add to batch queue
      this.batchQueue.push({
        ...gameAction,
        timestamp: gameAction.timestamp || new Date()
      });

      // Update metrics
      this.metrics.totalActions++;

      // Force flush if queue is full
      if (this.batchQueue.length >= this.MAX_QUEUE_SIZE) {
        logger.warn('Action queue full, forcing flush', {
          queueSize: this.batchQueue.length,
          maxSize: this.MAX_QUEUE_SIZE
        });
        await this.flushBatch();
      } else if (this.batchQueue.length >= this.BATCH_SIZE) {
        // Schedule immediate flush for full batch
        await this.flushBatch();
      }

      const duration = performance.now() - startTime;
      logger.debug('Action logged successfully', {
        actionType: gameAction.actionType,
        gameId: gameAction.gameId,
        duration: `${duration.toFixed(2)}ms`
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to log action', {
        actionType: gameAction.actionType,
        gameId: gameAction.gameId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update error metrics
      this.metrics.errorRate = (this.metrics.errorRate * 0.9) + 0.1;
      throw error;
    }
  }

  /**
   * Log placement action with context
   */
  async logPlacementAction(
    gameId: string,
    playerId: number,
    actionData: any,
    stateBefore: GameState,
    stateAfter: GameState,
    success: boolean,
    error?: string
  ): Promise<void> {
    const action: GameAction = {
      id: this.generateActionId(),
      gameId: parseInt(gameId),
      playerId,
      actionType: 'place_unit',
      turn: 1, // Default turn
      phase: 'actions', // Default phase
      timestamp: new Date(),
      actionData,
      stateBefore,
      stateAfter: success ? stateAfter : undefined as any,
      success,
      error,
      isValid: success,
      resourceCost: 0,
      correlationId: this.generateCorrelationId(),
      duration: 0 // Will be calculated by caller
    };

    await this.logAction(action);
  }

  /**
   * Log validation failure with context
   */
  async logValidationFailure(
    gameId: string,
    playerId: number,
    actionType: GameActionType,
    actionData: any,
    validationErrors: string[],
    context?: any
  ): Promise<void> {
    const action: GameAction = {
      id: this.generateActionId(),
      gameId: parseInt(gameId),
      playerId,
      actionType,
      turn: 1, // Default turn
      phase: 'actions', // Default phase
      timestamp: new Date(),
      actionData,
      success: false,
      error: `Validation failed: ${validationErrors.join(', ')}`,
      isValid: false,
      resourceCost: 0,
      correlationId: this.generateCorrelationId(),
      duration: 0,
      metadata: {
        validationErrors,
        context
      }
    };

    await this.logAction(action);
  }

  /**
   * Batch log multiple actions
   */
  async logBatch(actions: GameAction[]): Promise<void> {
    const startTime = performance.now();

    try {
      // Add correlation IDs and timestamps
      const processedActions = actions.map(action => ({
        ...action,
        correlationId: action.correlationId || this.generateCorrelationId(),
        timestamp: action.timestamp || new Date()
      }));

      // Add to queue
      this.batchQueue.push(...processedActions);

      // Update metrics
      this.metrics.totalActions += actions.length;

      // Force flush if needed
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.flushBatch();
      }

      const duration = performance.now() - startTime;
      logger.debug('Action batch logged successfully', {
        count: actions.length,
        duration: `${duration.toFixed(2)}ms`
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to log action batch', {
        count: actions.length,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get game action history
   */
  async getGameHistory(gameId: string, limit: number = 100): Promise<GameAction[]> {
    const startTime = performance.now();

    try {
      const prismaActions = await prisma.gameAction.findMany({
        where: { gameId: parseInt(gameId) },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      const actions = prismaActions.map(this.convertFromPrisma);

      const duration = performance.now() - startTime;
      logger.debug('Game history retrieved', {
        gameId,
        count: actions.length,
        duration: `${duration.toFixed(2)}ms`
      });

      return actions;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to retrieve game history', {
        gameId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get player action statistics
   */
  async getPlayerActionStats(playerId: number): Promise<ActionStats> {
    const startTime = performance.now();

    try {
      const actions = await prisma.gameAction.findMany({
        where: { playerId },
        select: {
          actionType: true,
          timestamp: true,
          isValid: true
        }
      });

      const stats: ActionStats = {
        playerId,
        totalActions: actions.length,
        actionsByType: {} as Record<GameActionType, number>,
        avgActionTime: 0,
        errorCount: actions.filter(a => !a.isValid).length,
        lastActionTime: actions.length > 0 ? new Date(Math.max(...actions.map(a => a.timestamp.getTime()))) : new Date()
      };

      // Calculate action type distribution
      for (const action of actions) {
        const type = action.actionType as GameActionType;
        stats.actionsByType[type] = (stats.actionsByType[type] || 0) + 1;
      }

      const duration = performance.now() - startTime;
      logger.debug('Player action stats retrieved', {
        playerId,
        totalActions: stats.totalActions,
        duration: `${duration.toFixed(2)}ms`
      });

      return stats;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to retrieve player action stats', {
        playerId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ActionLogMetrics {
    return { ...this.metrics };
  }

  /**
   * Track operation timing
   */
  async trackOperationTime(operation: string, duration: number): Promise<void> {
    logger.debug('Operation timing tracked', {
      operation,
      duration: `${duration.toFixed(2)}ms`
    });

    // Could store in metrics or separate performance table
    // For now, just log for monitoring
  }

  /**
   * Force flush all queued actions
   */
  async forceFlush(): Promise<void> {
    if (this.batchQueue.length > 0) {
      logger.info('Force flushing action queue', {
        queueSize: this.batchQueue.length
      });
      await this.flushBatch();
    }
  }

  /**
   * Flush batch to database
   */
  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const startTime = performance.now();
    const actionsToFlush = [...this.batchQueue];
    this.batchQueue = [];

    try {
      // Convert to Prisma format
      const prismaActions = actionsToFlush.map(this.convertToPrisma);

      // Batch insert
      await prisma.gameAction.createMany({
        data: prismaActions,
        skipDuplicates: true
      });

      // Update metrics
      const duration = performance.now() - startTime;
      this.metrics.batchSize = actionsToFlush.length;
      this.metrics.avgBatchTime = (this.metrics.avgBatchTime * 0.9) + (duration * 0.1);
      this.metrics.lastFlushTime = new Date();
      this.metrics.errorRate = this.metrics.errorRate * 0.95; // Decay error rate on success

      logger.info('Action batch flushed successfully', {
        count: actionsToFlush.length,
        duration: `${duration.toFixed(2)}ms`,
        avgBatchTime: `${this.metrics.avgBatchTime.toFixed(2)}ms`
      });

    } catch (error) {
      // Put actions back in queue if flush failed
      this.batchQueue = [...actionsToFlush, ...this.batchQueue];

      const duration = performance.now() - startTime;
      this.metrics.errorRate = (this.metrics.errorRate * 0.9) + 0.1;

      logger.error('Failed to flush action batch', {
        count: actionsToFlush.length,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Schedule batch flush
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(async () => {
      try {
        await this.flushBatch();
      } catch (error) {
        logger.error('Scheduled flush failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Schedule next flush
      this.scheduleFlush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert domain model to Prisma format
   */
  private convertToPrisma(action: GameAction): any {
    return {
      id: action.id || this.generateActionId(),
      gameId: action.gameId,
      playerId: action.playerId,
      actionType: action.actionType,
      actionData: action.actionData || {},
      gameStateBefore: action.stateBefore ? JSON.stringify(action.stateBefore) : null,
      gameStateAfter: action.stateAfter ? JSON.stringify(action.stateAfter) : null,
      turn: action.turn || 1,
      phase: 'actions', // Default phase
      resourceCost: action.resourceCost || 0,
      isValid: action.success !== false,
      validationErrors: action.error ? { error: action.error } : null,
      timestamp: action.timestamp || new Date()
    };
  }

  /**
   * Convert Prisma model to domain format
   */
  private convertFromPrisma(prismaAction: PrismaGameAction): GameAction {
    return {
      id: prismaAction.id,
      gameId: prismaAction.gameId,
      playerId: prismaAction.playerId,
      actionType: prismaAction.actionType as GameActionType,
      turn: prismaAction.turn,
      phase: prismaAction.phase as any,
      timestamp: prismaAction.timestamp,
      actionData: prismaAction.actionData as any,
      stateBefore: prismaAction.gameStateBefore ? JSON.parse(prismaAction.gameStateBefore as string) : undefined,
      stateAfter: prismaAction.gameStateAfter ? JSON.parse(prismaAction.gameStateAfter as string) : undefined,
      success: prismaAction.isValid,
      error: prismaAction.validationErrors ? (prismaAction.validationErrors as any).error : undefined,
      isValid: prismaAction.isValid,
      resourceCost: prismaAction.resourceCost
    };
  }
}

// Export singleton instance
export const gameActionLogger = GameActionLogger.getInstance();