import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';

/**
 * Middleware to authenticate HTTP requests using JWT
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = TokenService.verifyAccessToken(token);

    (req as any).user = {
      id: decoded.userId,
      username: decoded.username,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error: any) {
    console.error('HTTP authentication failed', {
      error: error.message,
      path: req.path,
      ip: req.ip,
    });

    if (error.message.includes('expired')) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }
}
