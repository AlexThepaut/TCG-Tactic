/**
 * Connection Event Handlers
 * User session tracking, room management, and reconnection logic
 */
import { Server as SocketIOServer } from 'socket.io';
import { logger, loggers } from '../../utils/logger';
import { getUserInfo } from '../../middleware/socketAuth';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ReconnectResponse,
  BasicResponse
} from '../../types/socket';

// Track active user sessions
const userSessions = new Map<string, {
  socketId: string;
  userId: string;
  gameId?: string;
  lastActivity: Date;
  reconnectData?: any;
}>();

// Track game rooms for reconnection
const gameRooms = new Map<string, {
  gameId: string;
  players: Set<string>;
  spectators: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}>();

/**
 * Setup connection-related event handlers
 */
export function setupConnectionHandlers(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {

  // Handle user authentication success
  handleAuthenticationSuccess(socket, io);

  // Handle ping requests for latency monitoring
  handlePingRequests(socket);

  // Handle reconnection attempts
  handleReconnection(socket, io);

  // Handle graceful disconnection
  handleGracefulDisconnection(socket, io);

  // Track user activity
  trackUserActivity(socket);
}

/**
 * Handle successful authentication
 */
function handleAuthenticationSuccess(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  if (!socket.userData?.isAuthenticated) {
    return;
  }

  const userId = socket.userData.userId;
  const userInfo = getUserInfo(socket);

  // Check for existing session
  const existingSession = userSessions.get(userId);
  if (existingSession) {
    loggers.game.info('User reconnecting - disconnecting previous session', {
      userId,
      previousSocketId: existingSession.socketId,
      newSocketId: socket.id
    });

    // Disconnect previous session
    const previousSocket = io.sockets.sockets.get(existingSession.socketId);
    if (previousSocket) {
      previousSocket.emit('auth:error', 'Session replaced by new connection');
      previousSocket.disconnect();
    }
  }

  // Store new session
  userSessions.set(userId, {
    socketId: socket.id,
    userId: userId,
    ...(socket.gameId && { gameId: socket.gameId }),
    lastActivity: new Date()
  });

  // Join user to their personal room for direct messaging
  socket.join(`user:${userId}`);

  // Emit authentication success
  socket.emit('auth:success', socket.userData);

  loggers.auth.info('User session established', userInfo);
}

/**
 * Handle ping requests for latency monitoring
 */
function handlePingRequests(socket: AuthenticatedSocket): void {
  socket.on('connection:ping', (callback) => {
    const timestamp = Date.now();

    // Update last activity
    updateUserActivity(socket);

    // Respond with pong
    callback({ pong: true, timestamp });

    loggers.game.info('Ping received', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      timestamp
    });
  });
}

/**
 * Handle reconnection attempts
 */
function handleReconnection(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  socket.on('connection:reconnect', (gameId, callback) => {
    try {
      const userInfo = getUserInfo(socket);

      if (!socket.userData?.isAuthenticated) {
        const response: ReconnectResponse = {
          success: false,
          error: 'Authentication required for reconnection'
        };
        return callback(response);
      }

      const userId = socket.userData.userId;
      loggers.game.info('Reconnection attempt', { ...userInfo, gameId });

      // Check if user was in the game
      const gameRoom = gameRooms.get(gameId);
      if (!gameRoom) {
        const response: ReconnectResponse = {
          success: false,
          error: 'Game not found or no longer active'
        };
        return callback(response);
      }

      const wasPlayer = gameRoom.players.has(userId);
      const wasSpectator = gameRoom.spectators.has(userId);

      if (!wasPlayer && !wasSpectator) {
        const response: ReconnectResponse = {
          success: false,
          error: 'User was not part of this game'
        };
        return callback(response);
      }

      // Rejoin the game room
      socket.gameId = gameId;
      socket.join(`game:${gameId}`);

      if (wasPlayer) {
        gameRoom.players.add(userId);
        socket.join(`game:${gameId}:players`);
      } else {
        gameRoom.spectators.add(userId);
        socket.join(`game:${gameId}:spectators`);
      }

      // Update session data
      const session = userSessions.get(userId);
      if (session) {
        session.gameId = gameId;
        session.lastActivity = new Date();
      }

      // Notify other players about reconnection
      socket.to(`game:${gameId}`).emit('connection:player_reconnected', userId);

      // TODO: Get actual game state from game service
      const gameState = undefined; // This will be implemented when game service is available

      const response: ReconnectResponse = {
        success: true,
        message: 'Reconnected successfully',
        playerId: userId,
        timeRemaining: 30 // TODO: Get actual time remaining
      };

      if (gameState) {
        response.gameState = gameState;
      }

      callback(response);

      loggers.game.info('User successfully reconnected to game', {
        ...userInfo,
        gameId,
        wasPlayer,
        wasSpectator
      });

    } catch (error: any) {
      loggers.game.error('Reconnection error', {
        socketId: socket.id,
        userId: socket.userData?.userId || 'unknown',
        gameId,
        error: error.message,
        stack: error.stack
      });

      const response: ReconnectResponse = {
        success: false,
        error: 'Reconnection failed due to server error'
      };
      callback(response);
    }
  });
}

/**
 * Handle graceful disconnection
 */
function handleGracefulDisconnection(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  socket.on('disconnect', (reason) => {
    const userInfo = getUserInfo(socket);

    loggers.game.info('Socket disconnecting', { ...userInfo, reason });

    // Clean up user session if authenticated
    if (socket.userData?.isAuthenticated) {
      const userId = socket.userData.userId;
      const session = userSessions.get(userId);

      if (session && session.socketId === socket.id) {
        // Store reconnection data if user was in a game
        if (socket.gameId) {
          session.reconnectData = {
            gameId: socket.gameId,
            disconnectedAt: new Date(),
            reason: reason
          };

          // Keep session for potential reconnection (5 minutes)
          setTimeout(() => {
            const currentSession = userSessions.get(userId);
            if (currentSession === session) {
              userSessions.delete(userId);
              loggers.game.info('User session expired', { userId });
            }
          }, 300000); // 5 minutes
        } else {
          // Remove session immediately if not in game
          userSessions.delete(userId);
        }
      }

      // Handle game room cleanup
      if (socket.gameId) {
        handleGameRoomDisconnection(socket, io);
      }
    }

    // Leave all rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
  });
}

/**
 * Handle disconnection from game room
 */
function handleGameRoomDisconnection(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  if (!socket.gameId || !socket.userData) {
    return;
  }

  const gameId = socket.gameId;
  const userId = socket.userData.userId;
  const gameRoom = gameRooms.get(gameId);

  if (gameRoom) {
    const wasPlayer = gameRoom.players.has(userId);
    const wasSpectator = gameRoom.spectators.has(userId);

    if (wasPlayer) {
      // Don't remove player immediately - they might reconnect
      loggers.game.info('Player disconnected from game (reconnection possible)', {
        userId,
        gameId,
        playersRemaining: gameRoom.players.size
      });

      // Notify other players about disconnection with timeout
      socket.to(`game:${gameId}`).emit('connection:player_disconnected', userId, 300000); // 5 minutes
    }

    if (wasSpectator) {
      gameRoom.spectators.delete(userId);
      loggers.game.info('Spectator left game', {
        userId,
        gameId,
        spectatorsRemaining: gameRoom.spectators.size
      });
    }

    // Clean up empty game room
    if (gameRoom.players.size === 0 && gameRoom.spectators.size === 0) {
      gameRooms.delete(gameId);
      loggers.game.info('Empty game room cleaned up', { gameId });
    }
  }
}

/**
 * Track user activity for session management
 */
function trackUserActivity(socket: AuthenticatedSocket): void {
  // Update activity on any event
  const originalEmit = socket.emit;
  socket.emit = function(event: any, ...args: any[]) {
    updateUserActivity(socket);
    return originalEmit.apply(socket, [event, ...args]);
  };

  const originalOn = socket.on;
  socket.on = function(event: any, handler: any) {
    const wrappedHandler = function(this: any, ...args: any[]) {
      updateUserActivity(socket);
      return handler.apply(this, args);
    };
    return originalOn.call(socket, event, wrappedHandler);
  };
}

/**
 * Update user's last activity timestamp
 */
function updateUserActivity(socket: AuthenticatedSocket): void {
  if (socket.userData?.isAuthenticated) {
    const session = userSessions.get(socket.userData.userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }
}

/**
 * Add a user to a game room
 */
export function addUserToGameRoom(
  userId: string,
  gameId: string,
  isPlayer: boolean = true
): void {
  let gameRoom = gameRooms.get(gameId);

  if (!gameRoom) {
    gameRoom = {
      gameId,
      players: new Set(),
      spectators: new Set(),
      createdAt: new Date(),
      lastActivity: new Date()
    };
    gameRooms.set(gameId, gameRoom);
  }

  if (isPlayer) {
    gameRoom.players.add(userId);
  } else {
    gameRoom.spectators.add(userId);
  }

  gameRoom.lastActivity = new Date();

  loggers.game.info('User added to game room', {
    userId,
    gameId,
    isPlayer,
    totalPlayers: gameRoom.players.size,
    totalSpectators: gameRoom.spectators.size
  });
}

/**
 * Remove a user from a game room
 */
export function removeUserFromGameRoom(userId: string, gameId: string): void {
  const gameRoom = gameRooms.get(gameId);

  if (gameRoom) {
    gameRoom.players.delete(userId);
    gameRoom.spectators.delete(userId);
    gameRoom.lastActivity = new Date();

    loggers.game.info('User removed from game room', {
      userId,
      gameId,
      totalPlayers: gameRoom.players.size,
      totalSpectators: gameRoom.spectators.size
    });

    // Clean up empty room
    if (gameRoom.players.size === 0 && gameRoom.spectators.size === 0) {
      gameRooms.delete(gameId);
      loggers.game.info('Empty game room cleaned up', { gameId });
    }
  }
}

/**
 * Get active user sessions (for monitoring/debugging)
 */
export function getActiveSessions(): Array<{
  userId: string;
  socketId: string;
  gameId?: string;
  lastActivity: Date;
}> {
  return Array.from(userSessions.values());
}

/**
 * Get active game rooms (for monitoring/debugging)
 */
export function getActiveGameRooms(): Array<{
  gameId: string;
  playerCount: number;
  spectatorCount: number;
  createdAt: Date;
  lastActivity: Date;
}> {
  return Array.from(gameRooms.values()).map(room => ({
    gameId: room.gameId,
    playerCount: room.players.size,
    spectatorCount: room.spectators.size,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity
  }));
}