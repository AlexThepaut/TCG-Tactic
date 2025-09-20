/**
 * Server Entry Point
 * Application startup with graceful shutdown handling, database connectivity, and Socket.io
 */
import { createServer } from 'http';
import { app } from './app';
import { env } from './config/environment';
import { logger, loggers } from './utils/logger';
import { DatabaseService } from './lib/database';
import { SocketServer } from './socket/socketServer';

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Server startup function
async function startServer() {
  try {
    // Test database connection before starting server
    logger.info('🔌 Testing database connection...');
    const dbConnected = await DatabaseService.testConnection();

    if (!dbConnected) {
      logger.error('❌ Database connection failed. Server startup aborted.');
      process.exit(1);
    }

    loggers.db.info('Database connection successful');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io server
    logger.info('🔌 Initializing Socket.io server...');
    const socketServer = new SocketServer(httpServer);
    logger.info('✅ Socket.io server initialized successfully');

    // Attach socket server to app for health checks
    (app as any).socketServer = socketServer;

    // Start the HTTP server with Socket.io
    const server = httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📊 Health checks available at:`);
      logger.info(`   - Basic: http://localhost:${env.PORT}/health`);
      logger.info(`   - Database: http://localhost:${env.PORT}/health/db`);
      logger.info(`   - Detailed: http://localhost:${env.PORT}/health/detailed`);
      logger.info(`   - Statistics: http://localhost:${env.PORT}/health/stats`);
      logger.info(`   - Socket.io: http://localhost:${env.PORT}/health/socket`);
      logger.info(`🌐 Socket.io server ready on port ${env.PORT}`);

      if (env.NODE_ENV === 'development') {
        logger.info(`🎮 Frontend URL: ${env.FRONTEND_URL}`);
        logger.info(`📝 API Documentation: http://localhost:${env.PORT}/api`);
      }
    });

    // Server timeout configuration
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 65000; // 65 seconds (should be > load balancer timeout)
    server.headersTimeout = 66000; // 66 seconds (should be > keepAliveTimeout)

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      logger.info(`📡 ${signal} received, starting graceful shutdown...`);

      server.close(async (err) => {
        if (err) {
          logger.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }

        logger.info('✅ HTTP server closed');

        try {
          // Close Socket.io server
          await socketServer.shutdown();
          logger.info('✅ Socket.io server closed');

          // Close database connections
          await DatabaseService.testConnection(); // This will close Prisma connections
          loggers.db.info('Database connections closed');

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during cleanup:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${env.PORT} is already in use`);
        process.exit(1);
      } else {
        logger.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Store socket server reference for health checks
    (server as any).socketServer = socketServer;

    return server;

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Health check for process monitoring
async function healthCheck() {
  try {
    const health = await DatabaseService.getHealthStatus();
    if (!health.connected) {
      logger.error('❌ Health check failed: Database not connected');
      return false;
    }

    // Add more health checks here (Redis, external APIs, etc.)
    return true;
  } catch (error) {
    logger.error('❌ Health check error:', error);
    return false;
  }
}

// Periodic health checks (every 30 seconds in production)
if (env.NODE_ENV === 'production') {
  setInterval(async () => {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      logger.warn('⚠️ Application health check failed');
    }
  }, 30000);
}

// Export server for testing
export { startServer, healthCheck, SocketServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  });
}