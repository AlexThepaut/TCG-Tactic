/**
 * Socket.io Module Exports
 * Centralized exports for Socket.io infrastructure
 */

// Main Socket.io server
export { SocketServer } from './socketServer';

// Type definitions
export * from '../types/socket';

// Handler utilities
export { getActiveSessions, getActiveGameRooms } from './handlers/connectionHandlers';
export { getQueueStatistics } from './handlers/matchmakingHandlers';

// Authentication utilities
export {
  socketAuthMiddleware,
  socketGuestMiddleware,
  validateGamePermission,
  getUserInfo,
  createRateLimitMiddleware
} from '../middleware/socketAuth';