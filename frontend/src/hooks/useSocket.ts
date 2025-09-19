import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketReturn {
  socket: SocketType | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

const useSocket = (serverUrl?: string): UseSocketReturn => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<SocketType | null>(null);

  const url = serverUrl || (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const newSocket = io(url, {
        transports: ['websocket'],
        autoConnect: true,
      }) as SocketType;

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(`Connection failed: ${err.message}`);
        setIsConnected(false);
      });

      // Game event handlers
      newSocket.on('error', (errorMessage) => {
        console.error('Socket error:', errorMessage);
        setError(errorMessage);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown socket error';
      setError(errorMessage);
      console.error('Failed to create socket:', err);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Auto-connect on mount
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [url]);

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
  };
};

export default useSocket;