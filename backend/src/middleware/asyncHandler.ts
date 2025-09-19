/**
 * Async Handler Middleware
 * Wraps async route handlers to catch Promise rejections
 */
import { Request, Response, NextFunction } from 'express';

// Type for async route handlers
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps async route handlers to automatically catch and forward errors
 * @param fn - Async route handler function
 * @returns Express middleware that handles Promise rejections
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Higher-order function to create async middleware with error handling
 * @param fn - Async middleware function
 * @returns Express middleware with automatic error catching
 */
export function asyncMiddleware(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}