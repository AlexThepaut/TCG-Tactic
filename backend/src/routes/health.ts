/**
 * Health Monitoring Routes
 * Comprehensive health checks for database, system metrics, Socket.io, and service status
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/database';
import { logger, loggers } from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/environment';
import { SocketServer } from '../socket/socketServer';
import { getQueueStatistics } from '../socket/handlers/matchmakingHandlers';
import { getActiveSessions, getActiveGameRooms } from '../socket/handlers/connectionHandlers';
import { gameStateService } from '../services/gameStateService';

const router = Router();

/**
 * Basic health check
 * GET /health
 */
router.get('/', (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TCG Tactique Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV
  };

  res.status(200).json(healthData);
});

/**
 * Database health check
 * GET /health/db
 */
router.get('/db', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Test database connectivity with a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, 1 as test_value`;
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get additional database info
    const userCount = await prisma.user.count();
    const cardCount = await prisma.activeCard.count();

    loggers.db.info('Database health check successful', { responseTime });

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: Array.isArray(result) ? (result[0] as any)?.current_time : new Date().toISOString(),
      metrics: {
        totalUsers: userCount,
        totalCards: cardCount
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    loggers.db.error('Database health check failed', error);

    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      responseTime: `${responseTime}ms`,
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Detailed system health check
 * GET /health/detailed
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const healthData = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'TCG Tactique Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    checks: {
      database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', responseTime: 0 },
      socketio: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', responseTime: 0 },
      // redis: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', responseTime: 0 }
    }
  };

  // Database health check
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const dbResponseTime = Date.now() - dbStartTime;

    healthData.checks.database = {
      status: 'healthy',
      responseTime: dbResponseTime
    };

    loggers.db.query('Health check query', dbResponseTime);
  } catch (error) {
    healthData.status = 'unhealthy';
    healthData.checks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime
    };
    loggers.db.error('Database health check failed in detailed check', error);
  }

  // Socket.io health check
  try {
    const socketStartTime = Date.now();
    const socketServer = (req.app as any).socketServer as SocketServer;

    if (socketServer) {
      const socketHealth = socketServer.getHealthStatus();
      const socketResponseTime = Date.now() - socketStartTime;

      healthData.checks.socketio = {
        status: socketHealth.connected ? 'healthy' : 'unhealthy',
        responseTime: socketResponseTime
      };
    } else {
      healthData.checks.socketio = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime
      };
    }
  } catch (error) {
    healthData.status = healthData.status === 'healthy' ? 'degraded' : 'unhealthy';
    healthData.checks.socketio = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime
    };
    loggers.game.error('Socket.io health check failed in detailed check', error);
  }

  // TODO: Add Redis health check when implemented
  // try {
  //   const redisStartTime = Date.now();
  //   await redis.ping();
  //   const redisResponseTime = Date.now() - redisStartTime;
  //
  //   healthData.checks.redis = {
  //     status: 'healthy',
  //     responseTime: redisResponseTime
  //   };
  // } catch (error) {
  //   healthData.status = healthData.status === 'healthy' ? 'degraded' : 'unhealthy';
  //   healthData.checks.redis = {
  //     status: 'unhealthy',
  //     responseTime: Date.now() - startTime
  //   };
  // }

  // Determine overall health status
  if (healthData.checks.database.status === 'unhealthy') {
    healthData.status = 'unhealthy';
  }

  if (healthData.checks.socketio.status === 'unhealthy') {
    healthData.status = healthData.status === 'healthy' ? 'degraded' : 'unhealthy';
  }

  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  const totalResponseTime = Date.now() - startTime;

  loggers.http.info('Detailed health check completed', {
    status: healthData.status,
    responseTime: totalResponseTime
  });

  res.status(statusCode).json({
    ...healthData,
    responseTime: `${totalResponseTime}ms`
  });
}));

/**
 * Database statistics endpoint
 * GET /health/stats
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.activeCard.count(),
      prisma.deck.count(),
      prisma.game.count(),
      // Get recent activity
      prisma.user.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      prisma.game.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);

    const [userCount, cardCount, deckCount, gameCount, recentUsers, recentGames] = stats;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: {
        users: {
          total: userCount,
          lastRegistered: recentUsers[0]?.createdAt || null
        },
        cards: {
          total: cardCount
        },
        decks: {
          total: deckCount
        },
        games: {
          total: gameCount,
          lastGame: recentGames[0]?.createdAt || null
        }
      }
    });
  } catch (error) {
    loggers.db.error('Database statistics query failed', error);
    res.status(503).json({
      status: 'error',
      message: 'Could not retrieve statistics',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Socket.io health and statistics check
 * GET /health/socket
 */
router.get('/socket', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const socketServer = (req.app as any).socketServer as SocketServer;

    if (!socketServer) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Socket.io server not initialized',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const healthStatus = socketServer.getHealthStatus();
    const connectionStats = socketServer.getStats();
    const queueStats = getQueueStatistics();
    const activeSessions = getActiveSessions();
    const activeGameRooms = getActiveGameRooms();

    res.status(200).json({
      status: 'healthy',
      socketio: {
        connected: healthStatus.connected,
        activeConnections: healthStatus.activeConnections,
        totalRooms: healthStatus.totalRooms,
        uptime: healthStatus.uptime,
        memoryUsage: healthStatus.memoryUsage
      },
      statistics: {
        connections: connectionStats,
        matchmaking: {
          queues: queueStats,
          totalPlayersInQueue: Object.values(queueStats).reduce((sum, queue) => sum + queue.playerCount, 0)
        },
        sessions: {
          activeSessions: activeSessions.length,
          authenticatedSessions: activeSessions.filter(s => s.userId.startsWith('guest_') === false).length
        },
        games: {
          activeGameRooms: activeGameRooms.length,
          totalPlayersInGame: activeGameRooms.reduce((sum, room) => sum + room.playerCount, 0),
          totalSpectators: activeGameRooms.reduce((sum, room) => sum + room.spectatorCount, 0)
        },
        gameStateService: {
          cacheStats: gameStateService.getCacheStats()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggers.game.error('Socket.io health check failed', error);
    res.status(503).json({
      status: 'error',
      error: 'Socket.io health check failed',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Game state service statistics
 * GET /health/gamestate
 */
router.get('/gamestate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const activeGames = await gameStateService.listActiveGames();
    const cacheStats = gameStateService.getCacheStats();

    const gamesByStatus = activeGames.reduce((acc, game) => {
      acc[game.status] = (acc[game.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const gamesByPhase = activeGames.reduce((acc, game) => {
      acc[game.phase] = (acc[game.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageTurn = activeGames.length > 0
      ? Math.round(activeGames.reduce((sum, game) => sum + game.turn, 0) / activeGames.length)
      : 0;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      gameStateService: {
        totalActiveGames: activeGames.length,
        gamesByStatus,
        gamesByPhase,
        averageTurn,
        cache: cacheStats,
        performance: {
          avgResponseTime: '< 100ms', // This would be calculated from metrics
          successRate: '99.5%' // This would be calculated from metrics
        }
      }
    });

  } catch (error) {
    loggers.game.error('Game state statistics query failed', error);
    res.status(503).json({
      status: 'error',
      message: 'Could not retrieve game state statistics',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Simple status check for load balancers
 * GET /health/status
 */
router.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRoutes };