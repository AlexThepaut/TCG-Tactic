/**
 * Professional Socket.io Service
 * Promise-based WebSocket communication with authentication and error handling
 */
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  AuthResponse,
  GameResponse,
  GameActionResponse,
  BasicResponse,
  MatchmakingResponse,
  MatchmakingStatusResponse,
  ReconnectResponse,
  GameCreateConfig,
  PlaceUnitData,
  AttackData,
  CastSpellData,
  MatchmakingJoinData,
  CardSelectedData,
  ValidPositionsResponse
} from '@/types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketConfig {
  url: string;
  auth?: {
    token: string;
  };
  transports?: ('websocket' | 'polling')[];
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  retryCount: number;
  lastConnectedAt: Date | null;
}

export class SocketService {
  private socket: SocketType | null = null;
  private config: SocketConfig;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    isAuthenticated: false,
    error: null,
    retryCount: 0,
    lastConnectedAt: null,
  };
  private eventHandlers = new Map<string, Set<Function>>();
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: SocketConfig) {
    this.config = {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<boolean> {
    if (this.connectionState.isConnected || this.connectionState.isConnecting) {
      return this.connectionState.isConnected;
    }

    this.connectionState.isConnecting = true;
    this.connectionState.error = null;

    try {
      // Create socket with configuration
      this.socket = io(this.config.url, {
        transports: this.config.transports || ['websocket', 'polling'],
        timeout: this.config.timeout || 10000,
        autoConnect: false,
        ...(this.config.auth && { auth: this.config.auth }),
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Connect with timeout
      await this.connectWithTimeout();

      // Authenticate if token provided
      if (this.config.auth?.token) {
        await this.authenticate(this.config.auth.token);
      }

      // Start ping interval for connection health
      this.startPingInterval();

      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.lastConnectedAt = new Date();
      this.connectionState.retryCount = 0;

      return true;
    } catch (error) {
      this.connectionState.isConnecting = false;
      this.connectionState.error = error instanceof Error ? error.message : 'Connection failed';
      console.error('Socket connection failed:', error);

      // Auto-retry if configured
      if (this.connectionState.retryCount < (this.config.retryAttempts || 3)) {
        await this.scheduleRetry();
      }

      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.clearRetryTimeout();
    this.stopPingInterval();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      error: null,
      retryCount: 0,
      lastConnectedAt: null,
    };

    this.eventHandlers.clear();
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connectionState.isConnected && this.socket?.connected === true;
  }

  /**
   * Promise-based event emission with acknowledgment
   */
  private emit<T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Socket emission timeout for event: ${event}`));
      }, this.config.timeout || 10000);

      // Extract callback from args if present
      const lastArg = args[args.length - 1];
      const hasCallback = typeof lastArg === 'function';

      if (hasCallback) {
        // Replace callback with our wrapper
        const originalCallback = lastArg as Function;
        const wrappedCallback = (response: any) => {
          clearTimeout(timeout);
          originalCallback(response);
          resolve(response);
        };
        args[args.length - 1] = wrappedCallback as any;
      } else {
        // Add our callback
        args.push(((response: any) => {
          clearTimeout(timeout);
          resolve(response);
        }) as any);
      }

      this.socket!.emit(event, ...args);
    });
  }

  /**
   * Add event listener
   */
  on<T extends keyof ServerToClientEvents>(
    event: T,
    handler: ServerToClientEvents[T]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    if (this.socket) {
      this.socket.on(event as any, handler as any);
    }
  }

  /**
   * Remove event listener
   */
  off<T extends keyof ServerToClientEvents>(
    event: T,
    handler: ServerToClientEvents[T]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event as any, handler as any);
    }
  }

  /**
   * Authentication
   */
  async authenticate(token: string): Promise<AuthResponse> {
    const response = await this.emit('auth:authenticate', token, (res: AuthResponse) => res);
    if (response.success) {
      this.connectionState.isAuthenticated = true;
    }
    return response;
  }

  /**
   * Game Management Methods
   */
  async createGame(config: GameCreateConfig): Promise<GameResponse> {
    return this.emit('game:create', config, (res: GameResponse) => res);
  }

  async joinGame(gameId: string): Promise<GameResponse> {
    return this.emit('game:join', gameId, (res: GameResponse) => res);
  }

  async leaveGame(): Promise<BasicResponse> {
    return this.emit('game:leave', (res: BasicResponse) => res);
  }

  async readyGame(): Promise<BasicResponse> {
    return this.emit('game:ready', (res: BasicResponse) => res);
  }

  /**
   * Game Action Methods
   */

  /**
   * Select a card (click-based placement Step 1)
   * Returns valid placement positions for the selected card
   */
  async selectCard(data: CardSelectedData): Promise<ValidPositionsResponse> {
    return this.emit('game:card_selected', data, (res: ValidPositionsResponse) => res);
  }

  /**
   * Clear card selection (cancel placement)
   */
  clearSelection(): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('game:selection_cleared');
    }
  }

  async placeUnit(data: PlaceUnitData): Promise<GameActionResponse> {
    return this.emit('game:place_unit', data, (res: GameActionResponse) => res);
  }

  async attack(data: AttackData): Promise<GameActionResponse> {
    return this.emit('game:attack', data, (res: GameActionResponse) => res);
  }

  async castSpell(data: CastSpellData): Promise<GameActionResponse> {
    return this.emit('game:cast_spell', data, (res: GameActionResponse) => res);
  }

  async endTurn(): Promise<GameActionResponse> {
    return this.emit('game:end_turn', (res: GameActionResponse) => res);
  }

  async surrender(): Promise<BasicResponse> {
    return this.emit('game:surrender', (res: BasicResponse) => res);
  }

  /**
   * Matchmaking Methods
   */
  async joinMatchmaking(data: MatchmakingJoinData): Promise<MatchmakingResponse> {
    return this.emit('matchmaking:join', data, (res: MatchmakingResponse) => res);
  }

  async leaveMatchmaking(): Promise<BasicResponse> {
    return this.emit('matchmaking:leave', (res: BasicResponse) => res);
  }

  async getMatchmakingStatus(): Promise<MatchmakingStatusResponse> {
    return this.emit('matchmaking:status', (res: MatchmakingStatusResponse) => res);
  }

  /**
   * Connection Methods
   */
  async ping(): Promise<{ pong: boolean; timestamp: number }> {
    return this.emit('connection:ping', (res: { pong: boolean; timestamp: number }) => res);
  }

  async reconnectToGame(gameId: string): Promise<ReconnectResponse> {
    return this.emit('connection:reconnect', gameId, (res: ReconnectResponse) => res);
  }

  /**
   * Private helper methods
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectionState.isConnected = true;
      this.connectionState.error = null;

      // Trigger 'connection:established' handlers
      const handlers = this.eventHandlers.get('connection:established');
      if (handlers) {
        handlers.forEach((handler) => {
          (handler as any)(this.socket?.id || '');
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectionState.isConnected = false;
      this.connectionState.isAuthenticated = false;

      // Auto-reconnect if not intentional
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect
        return;
      }

      this.scheduleRetry();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionState.error = `Connection failed: ${error.message}`;
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
    });

    // Auth events
    this.socket.on('auth:success', (userData) => {
      console.log('Authentication successful:', userData);
      this.connectionState.isAuthenticated = true;
    });

    this.socket.on('auth:error', (error) => {
      console.error('Authentication failed:', error);
      this.connectionState.isAuthenticated = false;
    });

    // Re-register all existing event handlers
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket!.on(event as any, handler as any);
      });
    });
  }

  private async connectWithTimeout(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      // Check if already connected (fixes race condition)
      if (this.socket.connected) {
        console.log('Socket already connected, resolving immediately');
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.timeout || 10000);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Only connect if not already connecting/connected
      if (!this.socket.connected && !this.connectionState.isConnecting) {
        this.socket.connect();
      }
    });
  }

  private async scheduleRetry(): Promise<void> {
    if (this.connectionState.retryCount >= (this.config.retryAttempts || 3)) {
      console.log('Max retry attempts reached');
      return;
    }

    this.connectionState.retryCount++;
    const delay = (this.config.retryDelay || 1000) * Math.pow(2, this.connectionState.retryCount - 1);

    console.log(`Scheduling reconnection attempt ${this.connectionState.retryCount} in ${delay}ms`);

    this.retryTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(async () => {
      if (this.isConnected()) {
        try {
          await this.ping();
        } catch (error) {
          console.warn('Ping failed:', error);
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton instance for global use
let globalSocketService: SocketService | null = null;

export const createSocketService = (config: SocketConfig): SocketService => {
  if (globalSocketService) {
    globalSocketService.disconnect();
  }
  globalSocketService = new SocketService(config);
  return globalSocketService;
};

export const getSocketService = (): SocketService | null => {
  return globalSocketService;
};

export default SocketService;