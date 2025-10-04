/**
 * Turn Timer Service
 * Manages turn timers for TCG Tactique games with automatic turn ending
 *
 * Features:
 * - Per-game timer management with deadline tracking
 * - Automatic turn ending on timeout
 * - Pause/resume capabilities for disconnections
 * - Event emission for real-time updates
 */
import { Server as SocketIOServer } from 'socket.io';
import { logger, loggers } from '../utils/logger';
import { GameState, GameAction } from '../types/gameState';
import { gameStateService } from './gameStateService';
import { gameMechanicsService } from './gameMechanicsService';
import { gameStateRepository } from '../repositories/GameStateRepository';
import { v4 as uuidv4 } from 'uuid';

interface TimerData {
  gameId: string;
  playerId: string;
  timer: NodeJS.Timeout;
  deadline: number; // Unix timestamp
  duration: number; // Original duration in seconds
  isPaused: boolean;
  pausedAt?: number; // Timestamp when paused
  remainingTime?: number; // Time remaining when paused
}

export class TurnTimerService {
  private static instance: TurnTimerService;
  private timers: Map<string, TimerData> = new Map();
  private io: SocketIOServer | null = null;

  private constructor() {}

  static getInstance(): TurnTimerService {
    if (!TurnTimerService.instance) {
      TurnTimerService.instance = new TurnTimerService();
    }
    return TurnTimerService.instance;
  }

  /**
   * Set Socket.io server instance for event emission
   */
  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    loggers.game.info('TurnTimerService initialized with Socket.io server');
  }

  /**
   * Start a turn timer for a game
   */
  startTurnTimer(gameId: string, playerId: string, durationSeconds: number = 300): void {
    try {
      // Clear any existing timer for this game
      this.clearTimer(gameId);

      const deadline = Date.now() + (durationSeconds * 1000);

      const timer = setTimeout(async () => {
        await this.handleTurnTimeout(gameId, playerId);
      }, durationSeconds * 1000);

      this.timers.set(gameId, {
        gameId,
        playerId,
        timer,
        deadline,
        duration: durationSeconds,
        isPaused: false
      });

      // Emit timer started event
      if (this.io) {
        this.io.to(`game:${gameId}`).emit('turn:timer_started', {
          duration: durationSeconds,
          deadline,
          playerId
        });
      }

      loggers.game.debug('Turn timer started', {
        gameId,
        playerId,
        duration: `${durationSeconds}s`,
        deadline: new Date(deadline).toISOString()
      });

    } catch (error: any) {
      loggers.game.error('Failed to start turn timer', {
        gameId,
        playerId,
        error: error.message
      });
    }
  }

  /**
   * Pause turn timer (e.g., when player disconnects)
   */
  pauseTurnTimer(gameId: string): void {
    try {
      const timerData = this.timers.get(gameId);
      if (!timerData || timerData.isPaused) {
        return;
      }

      const remainingTime = Math.max(0, timerData.deadline - Date.now());

      clearTimeout(timerData.timer);

      timerData.isPaused = true;
      timerData.pausedAt = Date.now();
      timerData.remainingTime = remainingTime;

      loggers.game.debug('Turn timer paused', {
        gameId,
        remainingTime: `${(remainingTime / 1000).toFixed(1)}s`
      });

    } catch (error: any) {
      loggers.game.error('Failed to pause turn timer', {
        gameId,
        error: error.message
      });
    }
  }

  /**
   * Resume a paused turn timer
   */
  resumeTurnTimer(gameId: string): void {
    try {
      const timerData = this.timers.get(gameId);
      if (!timerData || !timerData.isPaused || !timerData.remainingTime) {
        return;
      }

      const remainingSeconds = Math.floor(timerData.remainingTime / 1000);

      // Restart timer with remaining time
      this.clearTimer(gameId);
      this.startTurnTimer(gameId, timerData.playerId, remainingSeconds);

      loggers.game.debug('Turn timer resumed', {
        gameId,
        remainingTime: `${remainingSeconds}s`
      });

    } catch (error: any) {
      loggers.game.error('Failed to resume turn timer', {
        gameId,
        error: error.message
      });
    }
  }

  /**
   * Get remaining time for a game's turn timer
   */
  getRemainingTime(gameId: string): number {
    try {
      const timerData = this.timers.get(gameId);
      if (!timerData) {
        return 0;
      }

      if (timerData.isPaused && timerData.remainingTime) {
        return Math.floor(timerData.remainingTime / 1000);
      }

      const remaining = Math.max(0, timerData.deadline - Date.now());
      return Math.floor(remaining / 1000);

    } catch (error: any) {
      loggers.game.error('Failed to get remaining time', {
        gameId,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Clear timer for a game
   */
  clearTimer(gameId: string): void {
    try {
      const timerData = this.timers.get(gameId);
      if (timerData) {
        clearTimeout(timerData.timer);
        this.timers.delete(gameId);

        loggers.game.debug('Turn timer cleared', { gameId });
      }
    } catch (error: any) {
      loggers.game.error('Failed to clear turn timer', {
        gameId,
        error: error.message
      });
    }
  }

  /**
   * Handle turn timeout - automatically end turn
   */
  private async handleTurnTimeout(gameId: string, playerId: string): Promise<void> {
    try {
      loggers.game.info('Turn timeout - auto-ending turn', {
        gameId,
        playerId
      });

      // Get current game state
      const gameState = await gameStateService.getGameState(gameId);
      if (!gameState || gameState.gameOver) {
        this.clearTimer(gameId);
        return;
      }

      // Verify it's still this player's turn
      if (gameState.currentPlayer.toString() !== playerId.toString()) {
        loggers.game.warn('Turn timeout for wrong player - ignoring', {
          gameId,
          timedOutPlayer: playerId,
          currentPlayer: gameState.currentPlayer
        });
        this.clearTimer(gameId);
        return;
      }

      // Create end turn action
      const endTurnAction: GameAction = {
        id: uuidv4(),
        gameId: gameState.gameId,
        playerId: typeof playerId === 'string' ? parseInt(playerId) : playerId,
        actionType: 'end_turn',
        turn: gameState.turn,
        phase: gameState.phase,
        timestamp: new Date(),
        actionData: {
          autoEnded: true,
          reason: 'timeout'
        },
        isValid: false,
        resourceCost: 0
      };

      // Execute end turn
      const { newState, results } = await gameMechanicsService.executeAction(gameState, endTurnAction);

      // Save updated state (use updateGameState instead of saveGameState)
      await gameStateService.updateGameState(gameId, newState, gameState.version);

      // Emit timeout event to players
      if (this.io) {
        this.io.to(`game:${gameId}`).emit('turn:timeout', {
          playerId,
          newState: {
            currentPlayer: newState.currentPlayer,
            turn: newState.turn,
            phase: newState.phase,
            timeRemaining: newState.timeRemaining
          }
        });

        // Emit turn changed event
        this.io.to(`game:${gameId}`).emit('turn:changed', {
          currentPlayer: newState.currentPlayer,
          turn: newState.turn,
          phase: newState.phase,
          timeRemaining: newState.timeRemaining
        });

        // Check for game end
        if (newState.gameOver && newState.winner) {
          this.io.to(`game:${gameId}`).emit('game:ended', {
            winner: newState.winner,
            condition: newState.winCondition || 'unknown'
          });
        }
      }

      // Clear this timer and start new one for next player
      this.clearTimer(gameId);

      if (!newState.gameOver) {
        this.startTurnTimer(gameId, newState.currentPlayer.toString(), newState.timeLimit);
      }

      loggers.game.info('Turn auto-ended due to timeout', {
        gameId,
        timedOutPlayer: playerId,
        newCurrentPlayer: newState.currentPlayer,
        newTurn: newState.turn
      });

    } catch (error: any) {
      loggers.game.error('Turn timeout handling failed', {
        gameId,
        playerId,
        error: error.message,
        stack: error.stack
      });
    } finally {
      this.clearTimer(gameId);
    }
  }

  /**
   * Reset timer on player action (restart countdown)
   */
  resetTimerOnAction(gameId: string, playerId: string, durationSeconds: number = 300): void {
    try {
      const timerData = this.timers.get(gameId);

      // Only reset if timer exists and it's for the same player
      if (timerData && timerData.playerId === playerId && !timerData.isPaused) {
        this.startTurnTimer(gameId, playerId, durationSeconds);

        loggers.game.debug('Turn timer reset on player action', {
          gameId,
          playerId
        });
      }
    } catch (error: any) {
      loggers.game.error('Failed to reset timer on action', {
        gameId,
        playerId,
        error: error.message
      });
    }
  }

  /**
   * Get all active timers (for debugging/monitoring)
   */
  getActiveTimers(): Array<{ gameId: string; playerId: string; remainingTime: number; isPaused: boolean }> {
    const activeTimers: Array<{ gameId: string; playerId: string; remainingTime: number; isPaused: boolean }> = [];

    for (const [gameId, timerData] of this.timers.entries()) {
      activeTimers.push({
        gameId,
        playerId: timerData.playerId,
        remainingTime: this.getRemainingTime(gameId),
        isPaused: timerData.isPaused
      });
    }

    return activeTimers;
  }

  /**
   * Cleanup all timers (for server shutdown)
   */
  cleanup(): void {
    loggers.game.info('Cleaning up all turn timers', {
      activeTimers: this.timers.size
    });

    for (const gameId of this.timers.keys()) {
      this.clearTimer(gameId);
    }
  }
}

// Export singleton instance
export const turnTimerService = TurnTimerService.getInstance();
