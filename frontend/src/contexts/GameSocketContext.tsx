/**
 * GameSocketContext - Centralized WebSocket and game state management
 * Provides single source of truth for all game-related socket operations
 */
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import useGameSocket from '@/hooks/useGameSocket';
import { useCardSelection } from '@/hooks/useCardSelection';
import type {
  GameState,
  GameCard,
  GamePosition,
  SelectionState,
  PlayerData,
  GameCreateConfig,
  MatchmakingJoinData,
  GameResponse,
  GameActionResponse,
  BasicResponse,
  MatchmakingResponse
} from '@/types';
import type { GameSocketCallbacks } from '@/hooks/useGameSocket';

/**
 * Complete context value interface combining socket and card selection state
 */
export interface GameSocketContextValue {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  isInGame: boolean;
  socketService: any; // SocketService instance

  // Game state
  gameState: GameState | null;
  error: string | null;

  // Player utilities
  getCurrentPlayer: () => PlayerData | null;
  getOpponent: () => PlayerData | null;
  isMyTurn: () => boolean;
  getTimeRemaining: () => number;

  // Game management
  createGame: (config: GameCreateConfig) => Promise<GameResponse>;
  joinGame: (gameId: string) => Promise<GameResponse>;
  leaveGame: () => Promise<BasicResponse>;
  readyGame: () => Promise<BasicResponse>;
  reconnectToGame: (gameId: string) => Promise<void>;

  // Game actions
  placeUnit: (cardId: string, position: GamePosition, handIndex: number) => Promise<GameActionResponse>;
  attack: (from: GamePosition, to: GamePosition) => Promise<GameActionResponse>;
  castSpell: (cardId: string, handIndex: number, target?: GamePosition, targets?: GamePosition[]) => Promise<GameActionResponse>;
  endTurn: () => Promise<GameActionResponse>;
  surrender: () => Promise<BasicResponse>;

  // Matchmaking
  joinMatchmaking: (data: MatchmakingJoinData) => Promise<MatchmakingResponse>;
  leaveMatchmaking: () => Promise<BasicResponse>;

  // Card selection state (from useCardSelection)
  selectionState: SelectionState;
  selectCard: (card: GameCard, handIndex: number) => Promise<void>;
  placeCard: (position: GamePosition) => Promise<void>;
  clearSelection: () => void;
  isPositionValid: (position: GamePosition) => boolean;
  isCardSelected: (card: GameCard) => boolean;
  isSelectionLoading: boolean;
  selectionError: string | null;

  // Validation utilities
  getValidMoves: (position: GamePosition) => GamePosition[];
}

/**
 * Context instance
 */
const GameSocketContext = createContext<GameSocketContextValue | null>(null);

/**
 * Provider Props
 */
export interface GameSocketProviderProps {
  gameId: string;
  autoJoinGame?: boolean;
  callbacks?: GameSocketCallbacks;
  children: ReactNode;
}

/**
 * GameSocketProvider - Combines useGameSocket and useCardSelection into single provider
 * This ensures only ONE WebSocket connection per game
 */
export const GameSocketProvider: React.FC<GameSocketProviderProps> = ({
  gameId,
  autoJoinGame = false,
  callbacks,
  children
}) => {
  // Single useGameSocket instance - this is the ONLY socket connection
  const socket = useGameSocket({
    gameId,
    autoJoinGame,
    ...(callbacks && { callbacks })
  });

  // Card selection state - integrated with the socket
  const cardSelection = useCardSelection({
    gameId,
    currentPlayer: socket.getCurrentPlayer()?.id || '',
    isMyTurn: socket.isMyTurn(),
    socketService: socket.socketService,
    ...(callbacks?.onGameError && { onError: callbacks.onGameError }),
  });

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GameSocketContextValue>(() => ({
    // Socket connection state
    isConnected: socket.isConnected,
    isAuthenticated: socket.isAuthenticated,
    isInGame: socket.isInGame,
    socketService: socket.socketService,

    // Game state
    gameState: socket.gameState,
    error: socket.error,

    // Player utilities
    getCurrentPlayer: socket.getCurrentPlayer,
    getOpponent: socket.getOpponent,
    isMyTurn: socket.isMyTurn,
    getTimeRemaining: socket.getTimeRemaining,

    // Game management
    createGame: socket.createGame,
    joinGame: socket.joinGame,
    leaveGame: socket.leaveGame,
    readyGame: socket.readyGame,
    reconnectToGame: socket.reconnectToGame,

    // Game actions
    placeUnit: socket.placeUnit,
    attack: socket.attack,
    castSpell: socket.castSpell,
    endTurn: socket.endTurn,
    surrender: socket.surrender,

    // Matchmaking
    joinMatchmaking: socket.joinMatchmaking,
    leaveMatchmaking: socket.leaveMatchmaking,

    // Card selection state
    selectionState: cardSelection.selectionState,
    selectCard: cardSelection.selectCard,
    placeCard: cardSelection.placeCard,
    clearSelection: cardSelection.clearSelection,
    isPositionValid: cardSelection.isPositionValid,
    isCardSelected: cardSelection.isCardSelected,
    isSelectionLoading: cardSelection.isLoading,
    selectionError: cardSelection.error,

    // Validation utilities
    getValidMoves: socket.getValidMoves,
  }), [socket, cardSelection]);

  return (
    <GameSocketContext.Provider value={contextValue}>
      {children}
    </GameSocketContext.Provider>
  );
};

/**
 * Hook to consume GameSocketContext
 * Throws error if used outside provider
 */
export const useGameSocketContext = (): GameSocketContextValue => {
  const context = useContext(GameSocketContext);

  if (!context) {
    throw new Error(
      'useGameSocketContext must be used within GameSocketProvider. ' +
      'Make sure your component is wrapped with <GameSocketProvider>.'
    );
  }

  return context;
};

/**
 * Optional: Hook to check if context is available (for conditional usage)
 */
export const useGameSocketContextOptional = (): GameSocketContextValue | null => {
  return useContext(GameSocketContext);
};

export default GameSocketContext;
