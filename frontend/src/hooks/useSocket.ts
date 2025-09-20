import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { SocketService, createSocketService } from '@/services/socketService';
import type {
  ServerToClientEvents,
  SocketUserData,
  AuthResponse
} from '@/types';

export interface UseSocketOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
  onAuthSuccess?: (userData: SocketUserData) => void;
  onAuthError?: (error: string) => void;
}

interface UseSocketReturn {
  socketService: SocketService | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  authenticate: (token: string) => Promise<AuthResponse>;
  on: <T extends keyof ServerToClientEvents>(
    event: T,
    handler: ServerToClientEvents[T]
  ) => void;
  off: <T extends keyof ServerToClientEvents>(
    event: T,
    handler: ServerToClientEvents[T]
  ) => void;
}

const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const {
    serverUrl,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
    onAuthSuccess,
    onAuthError,
  } = options;

  const [socketService, setSocketService] = useState<SocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<SocketService | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Get WebSocket URL from environment
  const getSocketUrl = useCallback(() => {
    if (serverUrl) return serverUrl;

    const wsUrl = import.meta.env.VITE_WS_URL;
    const apiUrl = import.meta.env.VITE_API_URL;

    if (wsUrl) {
      // Convert ws:// to http:// for socket.io
      return wsUrl.replace(/^ws:\/\//, 'http://').replace(/^wss:\/\//, 'https://');
    }

    return apiUrl || 'http://localhost:5001';
  }, [serverUrl]);

  // Get auth token from localStorage
  const getAuthToken = useCallback(() => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return null;
  }, []);

  // Connect to socket
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const url = getSocketUrl();
      const token = getAuthToken();

      console.log('Connecting to socket:', url);

      // Create new socket service
      const service = createSocketService({
        url,
        ...(token && { auth: { token } }),
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
      });

      // Set up connection state listeners
      const updateConnectionState = () => {
        const state = service.getConnectionState();
        setIsConnected(state.isConnected);
        setIsAuthenticated(state.isAuthenticated);
        setError(state.error);
      };

      // Set up event handlers for connection management
      service.on('auth:success', (userData) => {
        console.log('Authentication successful:', userData);
        setIsAuthenticated(true);
        onAuthSuccess?.(userData);
        toast.success('Connected successfully');
      });

      service.on('auth:error', (errorMsg) => {
        console.error('Authentication failed:', errorMsg);
        setIsAuthenticated(false);
        onAuthError?.(errorMsg);
        toast.error(`Authentication failed: ${errorMsg}`);
      });

      service.on('connection:established', (sessionId) => {
        console.log('Connection established:', sessionId);
        setIsConnected(true);
        setError(null);
        onConnect?.();
      });

      service.on('system:error', (errorMsg) => {
        console.error('System error:', errorMsg);
        setError(errorMsg);
        onError?.(errorMsg);
        toast.error(`System error: ${errorMsg}`);
      });

      // Store service and set up periodic state updates
      serviceRef.current = service;
      setSocketService(service);

      // Connect to server
      const success = await service.connect();

      // Update state after connection attempt
      updateConnectionState();

      // Set up periodic state sync
      const stateInterval = setInterval(updateConnectionState, 1000);
      cleanupFunctionsRef.current.push(() => clearInterval(stateInterval));

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('Socket connection failed:', error);
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(`Connection failed: ${errorMessage}`);
      return false;
    }
  }, [getSocketUrl, getAuthToken, onConnect, onDisconnect, onError, onAuthSuccess, onAuthError]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    console.log('Disconnecting socket');

    // Clean up all intervals and listeners
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];

    if (serviceRef.current) {
      serviceRef.current.disconnect();
      serviceRef.current = null;
    }

    setSocketService(null);
    setIsConnected(false);
    setIsAuthenticated(false);
    setError(null);

    onDisconnect?.('Manual disconnect');
  }, [onDisconnect]);

  // Authenticate with token
  const authenticate = useCallback(async (token: string): Promise<AuthResponse> => {
    if (!serviceRef.current) {
      throw new Error('Socket not connected');
    }

    try {
      const response = await serviceRef.current.authenticate(token);

      if (response.success) {
        setIsAuthenticated(true);
        // Store token for reconnections
        localStorage.setItem('auth', JSON.stringify({ token }));
        toast.success('Authentication successful');
      } else {
        setIsAuthenticated(false);
        toast.error(response.error || 'Authentication failed');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      toast.error(`Authentication failed: ${errorMessage}`);
      throw error;
    }
  }, []);

  // Event listener management
  const on = useCallback(<T extends keyof ServerToClientEvents>(
    event: T,
    handler: ServerToClientEvents[T]
  ) => {
    if (serviceRef.current) {
      serviceRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback(<T extends keyof ServerToClientEvents>(
    event: T,
    handler: ServerToClientEvents[T]
  ) => {
    if (serviceRef.current) {
      serviceRef.current.off(event, handler);
    }
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Listen for auth changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth') {
        if (e.newValue) {
          // New auth token - reconnect if needed
          if (!isAuthenticated && isConnected) {
            const authData = JSON.parse(e.newValue);
            authenticate(authData.token).catch(console.error);
          }
        } else {
          // Auth removed - disconnect
          if (isAuthenticated) {
            setIsAuthenticated(false);
            toast('Session expired');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, isConnected, authenticate]);

  return {
    socketService,
    isConnected,
    isAuthenticated,
    error,
    connect,
    disconnect,
    authenticate,
    on,
    off,
  };
};

export default useSocket;