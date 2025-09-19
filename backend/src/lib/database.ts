/**
 * Database connection and utilities using Prisma
 */
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with logging in development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };

// Database utilities
export class DatabaseService {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$connect();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Test connection with timeout for development
   */
  static async testConnectionWithTimeout(timeoutMs: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), timeoutMs);

      this.testConnection()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(() => {
          clearTimeout(timeout);
          resolve(false);
        });
    });
  }

  /**
   * Get database health status
   */
  static async getHealthStatus(): Promise<{
    connected: boolean;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return { connected: true, latency };
    } catch (error) {
      return { connected: false };
    }
  }

  /**
   * Run database migrations (wrapper for CLI command)
   */
  static async runMigrations(): Promise<void> {
    console.log('Use "npm run db:migrate" to run Prisma migrations');
  }

  /**
   * Reset database (wrapper for CLI command)
   */
  static async resetDatabase(): Promise<void> {
    console.log('Use "npm run db:reset" to reset database with Prisma');
  }
}

export default prisma;