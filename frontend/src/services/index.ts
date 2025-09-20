// TCG Tactique - Service Layer

export { default as api } from './api';
export { default as gameService } from './gameService';
export {
  SocketService,
  createSocketService,
  getSocketService
} from './socketService';

// Export socket service types
export type { SocketConfig, ConnectionState } from './socketService';