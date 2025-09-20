/**
 * Matchmaking Event Handlers
 * Queue management, player pairing, and match creation
 */
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { logger, loggers } from '../../utils/logger';
import { getUserInfo } from '../../middleware/socketAuth';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  MatchmakingPlayer,
  MatchmakingQueue,
  MatchmakingJoinData,
  MatchmakingResponse,
  MatchmakingStatusResponse,
  BasicResponse
} from '../../types/socket';

// Matchmaking queues by type
const matchmakingQueues: Map<string, MatchmakingQueue> = new Map();
const playerQueues: Map<string, string> = new Map(); // userId -> queueType
const queueTimers: Map<string, NodeJS.Timeout> = new Map(); // userId -> timeout

// Queue types
const QUEUE_TYPES = {
  CASUAL_30: 'casual_30s',
  CASUAL_60: 'casual_60s',
  RANKED_30: 'ranked_30s',
  RANKED_60: 'ranked_60s'
};

// Initialize queues
Object.values(QUEUE_TYPES).forEach(queueType => {
  matchmakingQueues.set(queueType, {
    players: [],
    averageWaitTime: 0,
    activeMatches: 0
  });
});

/**
 * Setup matchmaking-related event handlers
 */
export function setupMatchmakingHandlers(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {

  socket.on('matchmaking:join', (data, callback) => {
    handleMatchmakingJoin(socket, io, data, callback);
  });

  socket.on('matchmaking:leave', (callback) => {
    handleMatchmakingLeave(socket, io, callback);
  });

  socket.on('matchmaking:status', (callback) => {
    handleMatchmakingStatus(socket, io, callback);
  });

  // Handle disconnect from matchmaking
  socket.on('disconnect', () => {
    handleMatchmakingDisconnect(socket, io);
  });
}

/**
 * Handle joining matchmaking queue
 */
function handleMatchmakingJoin(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: MatchmakingJoinData,
  callback: (response: MatchmakingResponse) => void
): void {
  try {
    const userInfo = getUserInfo(socket);

    if (!socket.userData?.isAuthenticated) {
      return callback({
        success: false,
        error: 'Authentication required for matchmaking'
      });
    }

    // Check if user is already in a game
    if (socket.gameId) {
      return callback({
        success: false,
        error: 'Already in a game. Leave current game first.'
      });
    }

    const userId = socket.userData.userId;

    // Check if user is already in queue
    if (playerQueues.has(userId)) {
      return callback({
        success: false,
        error: 'Already in matchmaking queue'
      });
    }

    // Validate matchmaking data
    const validationError = validateMatchmakingData(data);
    if (validationError) {
      return callback({
        success: false,
        error: validationError
      });
    }

    // Determine queue type
    const queueType = getQueueType(data.preferences);
    const queue = matchmakingQueues.get(queueType);

    if (!queue) {
      return callback({
        success: false,
        error: 'Invalid queue type'
      });
    }

    // Create matchmaking player
    const matchmakingPlayer: MatchmakingPlayer = {
      id: userId,
      username: socket.userData.username,
      socketId: socket.id,
      faction: data.faction,
      rating: 1000, // TODO: Get actual rating from database
      deck: data.deck,
      queuedAt: new Date(),
      preferences: data.preferences
    };

    // Add to queue
    queue.players.push(matchmakingPlayer);
    playerQueues.set(userId, queueType);

    // Set queue timeout (5 minutes max)
    const timeout = setTimeout(() => {
      handleQueueTimeout(userId, queueType, io);
    }, 300000);
    queueTimers.set(userId, timeout);

    // Join matchmaking room for updates
    socket.join(`matchmaking:${queueType}`);

    loggers.game.info('Player joined matchmaking queue', {
      ...userInfo,
      queueType,
      faction: data.faction,
      preferences: data.preferences,
      queueSize: queue.players.length
    });

    // Try to find a match
    const matchFound = tryFindMatch(queueType, io);

    if (!matchFound) {
      // Send queue position update
      const position = queue.players.findIndex(p => p.id === userId) + 1;
      const estimatedWait = calculateEstimatedWaitTime(queueType);

      callback({
        success: true,
        message: 'Joined matchmaking queue',
        queuePosition: position,
        estimatedWait,
        matchmakingId: userId
      });

      // Notify all players in queue about new player
      updateQueueStatus(queueType, io);
    }

  } catch (error: any) {
    loggers.game.error('Matchmaking join failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to join matchmaking queue'
    });
  }
}

/**
 * Handle leaving matchmaking queue
 */
function handleMatchmakingLeave(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): void {
  try {
    const userInfo = getUserInfo(socket);
    const userId = socket.userData?.userId || socket.id;

    const queueType = playerQueues.get(userId);
    if (!queueType) {
      return callback({
        success: false,
        error: 'Not in matchmaking queue'
      });
    }

    // Remove from queue
    removeFromQueue(userId, queueType);

    // Leave matchmaking room
    socket.leave(`matchmaking:${queueType}`);

    loggers.game.info('Player left matchmaking queue', {
      ...userInfo,
      queueType
    });

    // Update queue status for remaining players
    updateQueueStatus(queueType, io);

    callback({
      success: true,
      message: 'Left matchmaking queue'
    });

  } catch (error: any) {
    loggers.game.error('Matchmaking leave failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to leave matchmaking queue'
    });
  }
}

/**
 * Handle matchmaking status request
 */
function handleMatchmakingStatus(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: MatchmakingStatusResponse) => void
): void {
  try {
    const userId = socket.userData?.userId || socket.id;
    const queueType = playerQueues.get(userId);

    if (!queueType) {
      return callback({
        success: true,
        inQueue: false
      });
    }

    const queue = matchmakingQueues.get(queueType);
    if (!queue) {
      return callback({
        success: true,
        inQueue: false
      });
    }

    const position = queue.players.findIndex(p => p.id === userId) + 1;
    const estimatedWait = calculateEstimatedWaitTime(queueType);

    callback({
      success: true,
      inQueue: true,
      queuePosition: position,
      estimatedWait,
      queueSize: queue.players.length
    });

  } catch (error: any) {
    loggers.game.error('Matchmaking status failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to get matchmaking status',
      inQueue: false
    });
  }
}

/**
 * Handle disconnect from matchmaking
 */
function handleMatchmakingDisconnect(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const userId = socket.userData?.userId || socket.id;
  const queueType = playerQueues.get(userId);

  if (queueType) {
    removeFromQueue(userId, queueType);
    updateQueueStatus(queueType, io);

    loggers.game.info('Player disconnected from matchmaking', {
      socketId: socket.id,
      userId,
      queueType
    });
  }
}

/**
 * Try to find a match in the specified queue
 */
function tryFindMatch(
  queueType: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): boolean {
  const queue = matchmakingQueues.get(queueType);
  if (!queue || queue.players.length < 2) {
    return false;
  }

  // Simple FIFO matching for now
  // TODO: Implement rating-based matchmaking
  const player1 = queue.players.shift()!;
  const player2 = queue.players.shift()!;

  // Create game
  createMatchGame(player1, player2, io);

  // Update queue status
  updateQueueStatus(queueType, io);

  return true;
}

/**
 * Create a game from matched players
 */
async function createMatchGame(
  player1: MatchmakingPlayer,
  player2: MatchmakingPlayer,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): Promise<void> {
  try {
    const gameId = uuidv4();

    // Remove players from queues
    removeFromQueue(player1.id, playerQueues.get(player1.id)!);
    removeFromQueue(player2.id, playerQueues.get(player2.id)!);

    // Get player sockets
    const socket1 = io.sockets.sockets.get(player1.socketId);
    const socket2 = io.sockets.sockets.get(player2.socketId);

    if (!socket1 || !socket2) {
      loggers.game.error('Failed to create match: One or both players disconnected', {
        gameId,
        player1: player1.id,
        player2: player2.id,
        socket1Available: !!socket1,
        socket2Available: !!socket2
      });

      // Re-queue available players
      if (socket1) reQueuePlayer(player1, io);
      if (socket2) reQueuePlayer(player2, io);
      return;
    }

    // TODO: Create actual game using game service
    // For now, just notify players

    // Notify players about match found
    socket1.emit('matchmaking:match_found', gameId, {
      id: player2.id,
      username: player2.username,
      faction: player2.faction,
      hand: [],
      board: [],
      resources: 0,
      questId: '',
      isReady: false,
      lastActionAt: new Date()
    });

    socket2.emit('matchmaking:match_found', gameId, {
      id: player1.id,
      username: player1.username,
      faction: player1.faction,
      hand: [],
      board: [],
      resources: 0,
      questId: '',
      isReady: false,
      lastActionAt: new Date()
    });

    // Update statistics
    const queue1Type = getQueueType(player1.preferences);
    const queue2Type = getQueueType(player2.preferences);

    if (queue1Type === queue2Type) {
      const queue = matchmakingQueues.get(queue1Type);
      if (queue) {
        queue.activeMatches++;
      }
    }

    loggers.game.info('Match created from matchmaking', {
      gameId,
      player1: { id: player1.id, username: player1.username, faction: player1.faction },
      player2: { id: player2.id, username: player2.username, faction: player2.faction },
      queue: queue1Type
    });

  } catch (error: any) {
    loggers.game.error('Failed to create match game', {
      player1: player1.id,
      player2: player2.id,
      error: error.message,
      stack: error.stack
    });

    // Re-queue both players
    reQueuePlayer(player1, io);
    reQueuePlayer(player2, io);
  }
}

/**
 * Re-queue a player after failed match
 */
function reQueuePlayer(
  player: MatchmakingPlayer,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const queueType = getQueueType(player.preferences);
  const queue = matchmakingQueues.get(queueType);

  if (queue) {
    queue.players.unshift(player); // Add back to front of queue
    playerQueues.set(player.id, queueType);

    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) {
      socket.emit('matchmaking:cancelled', 'Match creation failed, re-queued');
    }

    loggers.game.info('Player re-queued after failed match', {
      playerId: player.id,
      queueType
    });
  }
}

/**
 * Remove player from queue
 */
function removeFromQueue(userId: string, queueType: string): void {
  const queue = matchmakingQueues.get(queueType);
  if (queue) {
    const index = queue.players.findIndex(p => p.id === userId);
    if (index !== -1) {
      queue.players.splice(index, 1);
    }
  }

  playerQueues.delete(userId);

  // Clear timeout
  const timeout = queueTimers.get(userId);
  if (timeout) {
    clearTimeout(timeout);
    queueTimers.delete(userId);
  }
}

/**
 * Handle queue timeout
 */
function handleQueueTimeout(
  userId: string,
  queueType: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const queue = matchmakingQueues.get(queueType);
  if (!queue) return;

  const player = queue.players.find(p => p.id === userId);
  if (!player) return;

  // Remove from queue
  removeFromQueue(userId, queueType);

  // Notify player
  const socket = io.sockets.sockets.get(player.socketId);
  if (socket) {
    socket.emit('matchmaking:cancelled', 'Queue timeout - please try again');
    socket.leave(`matchmaking:${queueType}`);
  }

  loggers.game.info('Matchmaking queue timeout', {
    userId,
    queueType,
    waitTime: Date.now() - player.queuedAt.getTime()
  });

  // Update queue status
  updateQueueStatus(queueType, io);
}

/**
 * Update queue status for all players in queue
 */
function updateQueueStatus(
  queueType: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const queue = matchmakingQueues.get(queueType);
  if (!queue) return;

  const estimatedWait = calculateEstimatedWaitTime(queueType);

  queue.players.forEach((player, index) => {
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) {
      socket.emit('matchmaking:queue_update', index + 1, estimatedWait);
    }
  });
}

/**
 * Calculate estimated wait time for queue
 */
function calculateEstimatedWaitTime(queueType: string): number {
  const queue = matchmakingQueues.get(queueType);
  if (!queue) return 0;

  // Simple calculation based on queue size
  // TODO: Implement more sophisticated estimation based on historical data
  const baseWait = 30; // 30 seconds base
  const queueMultiplier = Math.max(0, queue.players.length - 1) * 15; // 15 seconds per player ahead

  return Math.min(baseWait + queueMultiplier, 300); // Max 5 minutes
}

/**
 * Get queue type from preferences
 */
function getQueueType(preferences: { timeLimit: number; ranked: boolean }): string {
  const { timeLimit, ranked } = preferences;

  if (ranked) {
    return timeLimit <= 30 ? QUEUE_TYPES.RANKED_30 : QUEUE_TYPES.RANKED_60;
  } else {
    return timeLimit <= 30 ? QUEUE_TYPES.CASUAL_30 : QUEUE_TYPES.CASUAL_60;
  }
}

/**
 * Validate matchmaking data
 */
function validateMatchmakingData(data: MatchmakingJoinData): string | null {
  if (!['humans', 'aliens', 'robots'].includes(data.faction)) {
    return 'Invalid faction';
  }

  if (!data.deck || data.deck.length !== 40) {
    return 'Deck must contain exactly 40 cards';
  }

  if (data.preferences.timeLimit < 30 || data.preferences.timeLimit > 300) {
    return 'Time limit must be between 30 and 300 seconds';
  }

  return null;
}

/**
 * Get queue statistics (for monitoring)
 */
export function getQueueStatistics(): Record<string, {
  playerCount: number;
  averageWaitTime: number;
  activeMatches: number;
}> {
  const stats: Record<string, any> = {};

  for (const [queueType, queue] of matchmakingQueues.entries()) {
    stats[queueType] = {
      playerCount: queue.players.length,
      averageWaitTime: queue.averageWaitTime,
      activeMatches: queue.activeMatches
    };
  }

  return stats;
}

/**
 * Periodic cleanup and statistics update
 */
setInterval(() => {
  // Update average wait times
  for (const [queueType, queue] of matchmakingQueues.entries()) {
    if (queue.players.length > 0) {
      const now = Date.now();
      const totalWaitTime = queue.players.reduce((sum, player) => {
        return sum + (now - player.queuedAt.getTime());
      }, 0);
      queue.averageWaitTime = Math.round(totalWaitTime / queue.players.length / 1000); // Convert to seconds
    } else {
      queue.averageWaitTime = 0;
    }
  }

  // Log queue statistics in development
  if (process.env.NODE_ENV === 'development') {
    const stats = getQueueStatistics();
    const totalPlayers = Object.values(stats).reduce((sum, queue) => sum + queue.playerCount, 0);

    if (totalPlayers > 0) {
      loggers.game.info('Matchmaking queue statistics', stats);
    }
  }
}, 30000); // Every 30 seconds