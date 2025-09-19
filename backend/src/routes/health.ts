/**
 * Health Monitoring Routes
 * Comprehensive health checks for database, system metrics, and service status
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/database';
import { logger, loggers } from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/environment';

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

export { router as healthRoutes };