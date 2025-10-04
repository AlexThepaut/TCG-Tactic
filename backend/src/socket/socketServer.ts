/**
 * Socket.io Server Configuration
 * Main Socket.io server setup with CORS, authentication, and event handling
 */
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { env, isDevelopment } from '../config/environment';
import { logger, loggers } from '../utils/logger';
import { socketAuthMiddleware, socketGuestMiddleware, createRateLimitMiddleware } from '../middleware/socketAuth';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  AuthenticatedSocket,
  ConnectionStats,
  SocketHealthStatus
} from '../types/socket';

// Import event handlers
import { setupConnectionHandlers } from './handlers/connectionHandlers';
import { setupGameHandlers } from './handlers/gameHandlers';
import { setupMatchmakingHandlers } from './handlers/matchmakingHandlers';

// Import turn timer service (Task 1.3F)
import { turnTimerService } from '../services/turnTimerService';

export class SocketServer {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private stats: ConnectionStats;
  private startTime: Date;

  constructor(httpServer: HTTPServer) {
    this.startTime = new Date();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      authenticatedConnections: 0,
      gamesInProgress: 0,
      playersInQueue: 0,
      averageLatency: 0,
      uptime: 0
    };

    // Initialize Socket.io server
    this.io = new SocketIOServer(httpServer, {
      // CORS configuration
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, testing, etc.)
          if (!origin) return callback(null, true);

          // In development, allow localhost with any port
          if (isDevelopment && origin.includes('localhost')) {
            return callback(null, true);
          }

          // Check against allowed origins
          const allowedOrigins = [env.FRONTEND_URL];
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST']
      },

      // Transport configuration
      transports: ['websocket', 'polling'],

      // Performance settings
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds

      // Connection settings
      connectTimeout: 45000, // 45 seconds
      maxHttpBufferSize: 1e6, // 1MB max buffer

      // Note: compression is handled at HTTP level

      // Cleanup settings
      allowEIO3: false, // Only allow Engine.IO v4+

      // Path configuration
      path: '/socket.io/',

      // Server-side timeout
      serveClient: false, // Don't serve client files

      // Adapter configuration (for future Redis adapter)
      // adapter will be configured when Redis is implemented
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupHealthChecks();
    this.setupCleanupTasks();

    // Initialize turn timer service with Socket.io server (Task 1.3F)
    turnTimerService.setSocketServer(this.io);

    loggers.game.info('Socket.io server configured successfully', {
      cors: env.FRONTEND_URL,
      transports: ['websocket', 'polling'],
      environment: env.NODE_ENV,
      turnTimerService: 'initialized'
    });
  }

  /**
   * Setup middleware stack for Socket.io
   */
  private setupMiddleware(): void {
    // Rate limiting middleware
    this.io.use(createRateLimitMiddleware({
      windowMs: 1000, // 1 second
      maxRequests: isDevelopment ? 100 : 30 // Higher limit in development
    }));

    // Authentication middleware - use guest middleware in development for testing without auth
    this.io.use(isDevelopment ? socketGuestMiddleware : socketAuthMiddleware);

    // Connection logging middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const userInfo = socket.userData ? {
        userId: socket.userData.userId,
        username: socket.userData.username,
        isAuthenticated: socket.userData.isAuthenticated
      } : { guest: true };

      loggers.game.info('Socket connection attempt', {
        socketId: socket.id,
        remoteAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        ...userInfo
      });

      next();
    });

    // Error handling middleware
    this.io.engine.on('connection_error', (err) => {
      loggers.game.error('Socket.io connection error', {
        code: err.code,
        message: err.message,
        context: err.context,
        type: err.type
      });
    });
  }

  /**
   * Setup main event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleNewConnection(socket);

      // Setup domain-specific handlers
      setupConnectionHandlers(socket, this.io);
      setupGameHandlers(socket, this.io);
      setupMatchmakingHandlers(socket, this.io);

      // Track connection statistics
      this.updateStats();
    });
  }

  /**
   * Handle new socket connection
   */
  private handleNewConnection(socket: AuthenticatedSocket): void {
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    if (socket.userData?.isAuthenticated) {
      this.stats.authenticatedConnections++;
    }

    const userInfo = socket.userData ? {
      userId: socket.userData.userId,
      username: socket.userData.username,
      isAuthenticated: socket.userData.isAuthenticated
    } : { guest: true };

    loggers.game.info('New socket connection established', {
      socketId: socket.id,
      totalConnections: this.stats.totalConnections,
      activeConnections: this.stats.activeConnections,
      authenticatedConnections: this.stats.authenticatedConnections,
      ...userInfo
    });

    // Send connection confirmation
    socket.emit('connection:established', socket.userData?.sessionId || 'guest_session');

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      loggers.game.error('Socket error occurred', {
        socketId: socket.id,
        userId: socket.userData?.userId || 'unknown',
        error: error.message,
        stack: error.stack
      });
    });

    // Setup ping/pong for latency tracking
    socket.on('connection:ping', (callback) => {
      const timestamp = Date.now();
      callback({ pong: true, timestamp });
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);

    if (socket.userData?.isAuthenticated) {
      this.stats.authenticatedConnections = Math.max(0, this.stats.authenticatedConnections - 1);
    }

    const userInfo = socket.userData ? {
      userId: socket.userData.userId,
      username: socket.userData.username,
      sessionDuration: Date.now() - socket.userData.connectedAt.getTime()
    } : { guest: true };

    loggers.game.info('Socket disconnected', {
      socketId: socket.id,
      reason,
      activeConnections: this.stats.activeConnections,
      authenticatedConnections: this.stats.authenticatedConnections,
      ...userInfo
    });

    // Notify game rooms about player disconnection
    if (socket.gameId) {
      socket.to(socket.gameId).emit('connection:player_disconnected',
        socket.userData?.userId || socket.id, 30000); // 30 second timeout
    }

    this.updateStats();
  }

  /**
   * Setup health check endpoints and monitoring
   */
  private setupHealthChecks(): void {
    // Periodic health status updates
    setInterval(() => {
      this.updateStats();

      // Log health status in development
      if (isDevelopment) {
        loggers.game.info('Socket.io health status', this.getHealthStatus());
      }
    }, 30000); // Every 30 seconds

    // Memory usage monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        loggers.game.info('High memory usage detected', {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          activeConnections: this.stats.activeConnections
        });
      }
    }, 60000); // Every minute
  }

  /**
   * Setup cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up disconnected sockets periodically
    setInterval(() => {
      this.cleanupDisconnectedSockets();
    }, 300000); // Every 5 minutes

    // Update room statistics
    setInterval(() => {
      this.updateRoomStatistics();
    }, 60000); // Every minute
  }

  /**
   * Clean up disconnected sockets and empty rooms
   */
  private cleanupDisconnectedSockets(): void {
    try {
      const rooms = this.io.sockets.adapter.rooms;
      let cleanedRooms = 0;

      for (const [roomId, room] of rooms) {
        // Skip default socket rooms (socket.id rooms)
        if (room.size === 1 && this.io.sockets.sockets.has(roomId)) {
          continue;
        }

        // Check if room is empty or has only disconnected sockets
        if (room.size === 0) {
          rooms.delete(roomId);
          cleanedRooms++;
        }
      }

      if (cleanedRooms > 0) {
        loggers.game.info('Cleaned up empty rooms', { cleanedRooms });
      }
    } catch (error: any) {
      loggers.game.error('Error during socket cleanup', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Update room statistics
   */
  private updateRoomStatistics(): void {
    try {
      const rooms = this.io.sockets.adapter.rooms;
      let gameRooms = 0;
      let spectatorRooms = 0;

      for (const [roomId, room] of rooms) {
        // Skip default socket rooms
        if (this.io.sockets.sockets.has(roomId)) {
          continue;
        }

        if (roomId.startsWith('game:')) {
          gameRooms++;
        } else if (roomId.startsWith('spectate:')) {
          spectatorRooms++;
        }
      }

      this.stats.gamesInProgress = gameRooms;

      loggers.game.info('Room statistics updated', {
        gameRooms,
        spectatorRooms,
        totalRooms: rooms.size
      });
    } catch (error: any) {
      loggers.game.error('Error updating room statistics', {
        error: error.message
      });
    }
  }

  /**
   * Update connection statistics
   */
  private updateStats(): void {
    this.stats.uptime = Date.now() - this.startTime.getTime();
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): SocketHealthStatus {
    return {
      connected: true,
      activeConnections: this.stats.activeConnections,
      totalRooms: this.io.sockets.adapter.rooms.size,
      memoryUsage: process.memoryUsage(),
      uptime: this.stats.uptime
    };
  }

  /**
   * Get connection statistics
   */
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Broadcast system message to all connected sockets
   */
  public broadcastSystemMessage(message: string, data?: any): void {
    this.io.emit('system:message' as any, { message, data, timestamp: new Date() });
    loggers.game.info('System message broadcasted', { message, data });
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      loggers.game.info('Starting Socket.io server shutdown');

      // Notify all connected clients
      this.io.emit('system:maintenance' as any, 'Server is shutting down', new Date());

      // Close all connections
      this.io.close(() => {
        loggers.game.info('Socket.io server shutdown completed');
        resolve();
      });

      // Force close after 5 seconds
      setTimeout(() => {
        loggers.game.info('Forced Socket.io server shutdown');
        resolve();
      }, 5000);
    });
  }

  /**
   * Get the Socket.io instance
   */
  public getIO(): SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > {
    return this.io;
  }
}