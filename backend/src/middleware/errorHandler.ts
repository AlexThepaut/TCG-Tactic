/**
 * Error Handling Middleware
 * Centralized error processing with logging and appropriate HTTP responses
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { isDevelopment } from '../config/environment';

// Custom error interface extending the standard Error
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// Create a custom error class for application errors
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const createError = {
  badRequest: (message: string = 'Bad Request') => new CustomError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => new CustomError(message, 401),
  forbidden: (message: string = 'Forbidden') => new CustomError(message, 403),
  notFound: (message: string = 'Not Found') => new CustomError(message, 404),
  conflict: (message: string = 'Conflict') => new CustomError(message, 409),
  validationError: (message: string = 'Validation Error') => new CustomError(message, 422),
  internal: (message: string = 'Internal Server Error') => new CustomError(message, 500)
};

// Handle different types of errors
function handleZodError(error: ZodError): { statusCode: number; message: string; details?: any } {
  const details = error.errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.input
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    details
  };
}

function handlePrismaError(error: any): { statusCode: number; message: string } {
  // Handle common Prisma errors
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'A record with this data already exists'
      };
    case 'P2025':
      return {
        statusCode: 404,
        message: 'Record not found'
      };
    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint failed'
      };
    case 'P2014':
      return {
        statusCode: 400,
        message: 'Invalid ID provided'
      };
    default:
      return {
        statusCode: 500,
        message: 'Database error occurred'
      };
  }
}

// Main error handling middleware
export function errorHandler(
  err: AppError | ZodError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle different error types
  if (err instanceof ZodError) {
    const zodError = handleZodError(err);
    statusCode = zodError.statusCode;
    message = zodError.message;
    details = zodError.details;
  } else if (err.code && err.code.startsWith('P')) {
    // Prisma error
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
  } else if (err instanceof CustomError || err.statusCode) {
    // Custom application error
    statusCode = err.statusCode || 500;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log the error with appropriate level
  const logData = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode
  };

  if (statusCode >= 500) {
    logger.error('Server error occurred:', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error occurred:', logData);
  }

  // Prepare response
  const errorResponse: any = {
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Add details in development or for validation errors
  if (details || (isDevelopment && err.stack)) {
    if (details) errorResponse.error.details = details;
    if (isDevelopment && err.stack) errorResponse.error.stack = err.stack;
  }

  // Add request ID if available (for future correlation)
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = createError.notFound(`Route ${req.method} ${req.path} not found`);
  next(error);
}