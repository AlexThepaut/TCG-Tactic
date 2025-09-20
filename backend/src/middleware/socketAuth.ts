/**
 * Socket.io Authentication Middleware
 * JWT token validation and user session management for WebSocket connections
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { logger, loggers } from '../utils/logger';
import { AuthenticatedSocket, SocketUserData, AuthSocketMiddleware } from '../types/socket';
import { ExtendedError } from 'socket.io/dist/namespace';

// JWT payload interface
interface JWTPayload {
  userId: string;
  username: string;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Socket.io authentication middleware
 * Validates JWT tokens and attaches user data to socket
 */
export const socketAuthMiddleware: AuthSocketMiddleware = (socket, next) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth?.token ||
                  socket.handshake.query?.token as string;

    if (!token) {
      loggers.auth.error('Socket authentication failed: No token provided', {
        socketId: socket.id,
        remoteAddress: socket.handshake.address
      });
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    if (!decoded.userId || !decoded.username) {
      loggers.auth.error('Socket authentication failed: Invalid token payload', {
        socketId: socket.id,
        tokenData: { userId: decoded.userId, username: decoded.username }
      });
      return next(new Error('Invalid token payload'));
    }

    // Create user data object
    const userData: SocketUserData = {
      userId: decoded.userId,
      username: decoded.username,
      isAuthenticated: true,
      sessionId: decoded.sessionId,
      connectedAt: new Date()
    };

    // Attach user data to socket
    socket.userData = userData;

    loggers.auth.info('Socket authentication successful', {
      socketId: socket.id,
      userId: decoded.userId,
      username: decoded.username,
      sessionId: decoded.sessionId
    });

    next();

  } catch (error: any) {
    // Handle different JWT errors
    let errorMessage = 'Authentication failed';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
      loggers.auth.info('Socket authentication failed: Token expired', {
        socketId: socket.id,
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
      loggers.auth.error('Socket authentication failed: Invalid token', {
        socketId: socket.id,
        error: error.message
      });
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token not active';
      loggers.auth.error('Socket authentication failed: Token not yet active', {
        socketId: socket.id,
        date: error.date
      });
    } else {
      loggers.auth.error('Socket authentication failed: Unexpected error', {
        socketId: socket.id,
        error: error.message,
        stack: error.stack
      });
    }

    next(new Error(errorMessage));
  }
};

/**
 * Optional authentication middleware for guest connections
 * Allows unauthenticated connections with limited functionality
 */
export const socketGuestMiddleware: AuthSocketMiddleware = (socket, next) => {
  try {
    // Check if token is provided
    const token = socket.handshake.auth?.token ||
                  socket.handshake.query?.token as string;

    if (token) {
      // If token provided, use regular auth middleware
      return socketAuthMiddleware(socket, next);
    }

    // Allow guest connection with limited data
    const guestData: SocketUserData = {
      userId: `guest_${socket.id}`,
      username: `Guest_${socket.id.substring(0, 8)}`,
      isAuthenticated: false,
      sessionId: `guest_session_${Date.now()}`,
      connectedAt: new Date()
    };

    socket.userData = guestData;

    loggers.auth.info('Guest socket connection established', {
      socketId: socket.id,
      userId: guestData.userId,
      remoteAddress: socket.handshake.address
    });

    next();

  } catch (error: any) {
    loggers.auth.error('Guest socket middleware error', {
      socketId: socket.id,
      error: error.message,
      stack: error.stack
    });

    next(new Error('Connection failed'));
  }
};

/**
 * Validate if user has permission for specific game actions
 */
export const validateGamePermission = (
  socket: AuthenticatedSocket,
  gameId: string,
  action: string
): boolean => {
  try {
    // Check if user is authenticated
    if (!socket.userData?.isAuthenticated) {
      loggers.auth.error('Game permission denied: User not authenticated', {
        socketId: socket.id,
        gameId,
        action
      });
      return false;
    }

    // Check if user is in the game
    if (socket.gameId !== gameId) {
      loggers.auth.error('Game permission denied: User not in game', {
        socketId: socket.id,
        userId: socket.userData.userId,
        requestedGameId: gameId,
        currentGameId: socket.gameId,
        action
      });
      return false;
    }

    // Additional action-specific validations can be added here
    // For example: spectator restrictions, turn-based permissions, etc.

    return true;
  } catch (error: any) {
    loggers.auth.error('Game permission validation error', {
      socketId: socket.id,
      gameId,
      action,
      error: error.message
    });
    return false;
  }
};

/**
 * Extract user information from socket for logging and tracking
 */
export const getUserInfo = (socket: AuthenticatedSocket) => {
  if (!socket.userData) {
    return {
      socketId: socket.id,
      userId: 'unknown',
      username: 'unknown',
      isAuthenticated: false
    };
  }

  return {
    socketId: socket.id,
    userId: socket.userData.userId,
    username: socket.userData.username,
    isAuthenticated: socket.userData.isAuthenticated,
    sessionId: socket.userData.sessionId
  };
};

/**
 * Middleware to rate limit socket events
 * Prevents spam and abuse of the realtime system
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

const defaultRateLimit: RateLimitConfig = {
  windowMs: 1000, // 1 second
  maxRequests: 10, // 10 requests per second per socket
  skipSuccessfulRequests: false
};

// Store rate limit data per socket
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const createRateLimitMiddleware = (config: RateLimitConfig = defaultRateLimit) => {
  return (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void) => {
    const now = Date.now();
    const socketId = socket.id;

    // Get or create rate limit data for this socket
    let limitData = rateLimitStore.get(socketId);

    if (!limitData || now > limitData.resetTime) {
      // Reset the counter
      limitData = {
        count: 1,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(socketId, limitData);
      return next();
    }

    // Increment counter
    limitData.count++;

    if (limitData.count > config.maxRequests) {
      loggers.auth.error('Rate limit exceeded for socket', {
        socketId,
        userId: socket.userData?.userId || 'unknown',
        count: limitData.count,
        limit: config.maxRequests,
        windowMs: config.windowMs
      });

      return next(new Error('Rate limit exceeded'));
    }

    next();
  };
};

/**
 * Cleanup rate limit store periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [socketId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(socketId);
    }
  }
}, 60000); // Clean up every minute