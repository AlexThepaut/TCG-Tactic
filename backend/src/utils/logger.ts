/**
 * Winston Logger Configuration
 * Structured logging with file rotation and development-friendly console output
 */
import winston from 'winston';
import { env, isDevelopment } from '../config/environment';

// Custom log format for development
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Production format with structured JSON
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: isDevelopment ? developmentFormat : productionFormat,
  defaultMeta: {
    service: 'tcg-tactique-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add console transport for non-production environments
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true
  }));
}

// Create stream for Morgan HTTP logging
export const logStream = {
  write: (message: string) => {
    // Remove trailing newline from Morgan
    logger.info(message.trim());
  }
};

// Helper functions for common logging patterns
export const loggers = {
  // Database operations
  db: {
    info: (message: string, meta?: any) => logger.info(`[DB] ${message}`, meta),
    error: (message: string, error?: any) => logger.error(`[DB] ${message}`, { error: error?.message || error }),
    warn: (message: string, meta?: any) => logger.warn(`[DB] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[DB] ${message}`, meta),
    query: (query: string, duration?: number) =>
      logger.debug(`[DB] Query executed`, { query, duration: duration ? `${duration}ms` : undefined })
  },

  // HTTP requests
  http: {
    info: (message: string, meta?: any) => logger.info(`[HTTP] ${message}`, meta),
    error: (message: string, error?: any) => logger.error(`[HTTP] ${message}`, { error: error?.message || error }),
    warn: (message: string, meta?: any) => logger.warn(`[HTTP] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[HTTP] ${message}`, meta)
  },

  // Game events (for future use)
  game: {
    info: (message: string, meta?: any) => logger.info(`[GAME] ${message}`, meta),
    error: (message: string, error?: any) => logger.error(`[GAME] ${message}`, { error: error?.message || error }),
    warn: (message: string, meta?: any) => logger.warn(`[GAME] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[GAME] ${message}`, meta),
    event: (event: string, data?: any) => logger.info(`[GAME EVENT] ${event}`, data)
  },

  // Authentication (for future use)
  auth: {
    info: (message: string, meta?: any) => logger.info(`[AUTH] ${message}`, meta),
    error: (message: string, error?: any) => logger.error(`[AUTH] ${message}`, { error: error?.message || error }),
    warn: (message: string, meta?: any) => logger.warn(`[AUTH] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[AUTH] ${message}`, meta),
    login: (userId: string, success: boolean) =>
      logger.info(`[AUTH] Login ${success ? 'successful' : 'failed'}`, { userId, success })
  }
};

// Export default logger
export default logger;