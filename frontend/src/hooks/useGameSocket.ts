/**
 * Game-specific Socket.io Hook
 * Provides game actions and real-time state management for TCG Tactique
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useSocket from './useSocket';
import type {
  GameState,
  GameAction,
  GameResult,
  PlayerData,
  GameCreateConfig,
  MatchmakingJoinData,
  GameResponse,
  GameActionResponse,
  BasicResponse,
  MatchmakingResponse,
  GamePosition,
  CombatResult
} from '@/types';

export interface GameSocketCallbacks {
  onGameStateUpdate?: (gameState: GameState) => void;
  onPlayerJoined?: (player: PlayerData) => void;
  onPlayerLeft?: (playerId: string) => void;
  onActionPerformed?: (action: GameAction) => void;
  onTurnChanged?: (currentPlayer: string, timeRemaining: number) => void;
  onGameOver?: (result: GameResult) => void;
  onGameError?: (error: string) => void;
  onCombatResult?: (result: CombatResult) => void;
  onMatchFound?: (gameId: string, opponent: PlayerData) => void;
  onQueueUpdate?: (position: number, estimatedWait: number) => void;
  onMatchmakingCancelled?: (reason: string) => void;
}

export interface UseGameSocketOptions {
  gameId?: string;
  autoJoinGame?: boolean;
  callbacks?: GameSocketCallbacks;
}

interface UseGameSocketReturn {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  isInGame: boolean;
  gameState: GameState | null;
  error: string | null;
  socketService: any; // SocketService instance for direct access

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

  // Utility
  getCurrentPlayer: () => PlayerData | null;
  getOpponent: () => PlayerData | null;
  isMyTurn: () => boolean;
  getTimeRemaining: () => number;
  getValidMoves: (position: GamePosition) => GamePosition[];
}

const useGameSocket = (options: UseGameSocketOptions = {}): UseGameSocketReturn => {
  const { gameId, autoJoinGame = false, callbacks = {} } = options;

  // Socket connection
  const {
    socketService,
    isConnected,
    isAuthenticated,
    error: socketError,
    on,
    off
  } = useSocket({
    autoConnect: true,
    onConnect: () => {
      console.log('Game socket connected');
      if (gameId && autoJoinGame) {
        joinGame(gameId).catch(console.error);
      }
    },
    onDisconnect: (reason) => {
      console.log('Game socket disconnected:', reason);
      setIsInGame(false);
      setGameState(null);
    },
    onError: (error) => {
      console.error('Game socket error:', error);
      toast.error(`Connection error: ${error}`);
    }
  });

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isInGame, setIsInGame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<GamePosition[]>([]);

  // Player session data
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Refs for cleanup
  const eventHandlersRef = useRef<(() => void)[]>([]);

  // Get current user ID from auth or provide fallback for testing
  useEffect(() => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        // Assuming the auth data contains user info
        setCurrentUserId(parsed.userId || parsed.id);
      } else {
        // In testing mode (no auth), use fallback user ID to match mock data
        // Check if we're in testing mode (no gameId or test gameId)
        const isTestingMode = !gameId || gameId === 'test-game-123' || gameId.startsWith('test-');
        if (isTestingMode) {
          console.log('Testing mode detected - using fallback user ID: player-1');
          setCurrentUserId('player-1'); // Matches mock data player ID
        }
      }
    } catch (error) {
      console.warn('Failed to get current user ID:', error);
      // Fallback for testing even if auth parsing fails
      const isTestingMode = !gameId || gameId === 'test-game-123' || gameId.startsWith('test-');
      if (isTestingMode) {
        console.log('Auth failed in testing mode - using fallback user ID: player-1');
        setCurrentUserId('player-1');
      }
    }
  }, [isAuthenticated, gameId]);

  // Set up game event listeners
  useEffect(() => {
    if (!isConnected || !socketService) return;

    const setupEventHandlers = () => {
      // Game state updates
      const handleGameStateUpdate = (newGameState: GameState) => {
        console.log('Game state updated:', newGameState);
        setGameState(newGameState);
        setIsInGame(true);
        setError(null);
        callbacks.onGameStateUpdate?.(newGameState);
      };

      const handlePlayerJoined = (player: PlayerData) => {
        console.log('Player joined:', player);
        callbacks.onPlayerJoined?.(player);
        toast.success(`${player.username} joined the game`);
      };

      const handlePlayerLeft = (playerId: string) => {
        console.log('Player left:', playerId);
        callbacks.onPlayerLeft?.(playerId);
        toast('Player left the game');
      };

      const handleActionPerformed = (action: GameAction) => {
        console.log('Action performed:', action);
        callbacks.onActionPerformed?.(action);
      };

      const handleTurnChanged = (currentPlayer: string, timeRemaining: number) => {
        console.log('Turn changed:', currentPlayer, timeRemaining);
        callbacks.onTurnChanged?.(currentPlayer, timeRemaining);

        // Show turn notification
        if (currentPlayer === currentUserId) {
          toast.success('Your turn!', { duration: 2000 });
        } else {
          toast("Opponent's turn", { duration: 2000 });
        }
      };

      const handleGameOver = (result: GameResult) => {
        console.log('Game over:', result);
        setIsInGame(false);
        callbacks.onGameOver?.(result);

        // Show game result
        if (result.winner === currentUserId) {
          toast.success(`You won! ${result.winCondition}`, { duration: 5000 });
        } else {
          toast.error(`You lost. ${result.winCondition}`, { duration: 5000 });
        }
      };

      const handleGameError = (errorMsg: string) => {
        console.error('Game error:', errorMsg);
        setError(errorMsg);
        callbacks.onGameError?.(errorMsg);
        toast.error(`Game error: ${errorMsg}`);
      };

      // Matchmaking events
      const handleMatchFound = (gameId: string, opponent: PlayerData) => {
        console.log('Match found:', gameId, opponent);
        callbacks.onMatchFound?.(gameId, opponent);
        toast.success(`Match found! Playing against ${opponent.username}`);
      };

      const handleQueueUpdate = (position: number, estimatedWait: number) => {
        console.log('Queue update:', position, estimatedWait);
        callbacks.onQueueUpdate?.(position, estimatedWait);
      };

      const handleMatchmakingCancelled = (reason: string) => {
        console.log('Matchmaking cancelled:', reason);
        callbacks.onMatchmakingCancelled?.(reason);
        toast(`Matchmaking cancelled: ${reason}`);
      };

      // Connection events
      const handlePlayerReconnected = (playerId: string) => {
        console.log('Player reconnected:', playerId);
        toast('Player reconnected');
      };

      const handlePlayerDisconnected = (playerId: string, timeout: number) => {
        console.log('Player disconnected:', playerId, timeout);
        toast(`Player disconnected. Waiting ${timeout}s for reconnection...`);
      };

      // Register all event handlers
      on('game:state_update', handleGameStateUpdate);
      on('game:player_joined', handlePlayerJoined);
      on('game:player_left', handlePlayerLeft);
      on('game:action_performed', handleActionPerformed);
      on('game:turn_changed', handleTurnChanged);
      on('game:game_over', handleGameOver);
      on('game:error', handleGameError);
      on('matchmaking:match_found', handleMatchFound);
      on('matchmaking:queue_update', handleQueueUpdate);
      on('matchmaking:cancelled', handleMatchmakingCancelled);
      on('connection:player_reconnected', handlePlayerReconnected);
      on('connection:player_disconnected', handlePlayerDisconnected);

      // Store cleanup functions
      eventHandlersRef.current = [
        () => off('game:state_update', handleGameStateUpdate),
        () => off('game:player_joined', handlePlayerJoined),
        () => off('game:player_left', handlePlayerLeft),
        () => off('game:action_performed', handleActionPerformed),
        () => off('game:turn_changed', handleTurnChanged),
        () => off('game:game_over', handleGameOver),
        () => off('game:error', handleGameError),
        () => off('matchmaking:match_found', handleMatchFound),
        () => off('matchmaking:queue_update', handleQueueUpdate),
        () => off('matchmaking:cancelled', handleMatchmakingCancelled),
        () => off('connection:player_reconnected', handlePlayerReconnected),
        () => off('connection:player_disconnected', handlePlayerDisconnected),
      ];
    };

    setupEventHandlers();

    return () => {
      // Clean up event handlers
      eventHandlersRef.current.forEach(cleanup => cleanup());
      eventHandlersRef.current = [];
    };
  }, [isConnected, socketService, callbacks, currentUserId, on, off]);

  // Game management methods
  const createGame = useCallback(async (config: GameCreateConfig): Promise<GameResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.createGame(config);

      if (response.success && response.gameState) {
        setGameState(response.gameState);
        setIsInGame(true);
        toast.success('Game created successfully');
      } else {
        toast.error(response.error || 'Failed to create game');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create game';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const joinGame = useCallback(async (gameId: string): Promise<GameResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.joinGame(gameId);

      if (response.success && response.gameState) {
        setGameState(response.gameState);
        setIsInGame(true);
        toast.success('Joined game successfully');
      } else {
        toast.error(response.error || 'Failed to join game');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to join game';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const leaveGame = useCallback(async (): Promise<BasicResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.leaveGame();

      if (response.success) {
        setGameState(null);
        setIsInGame(false);
        toast('Left game');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to leave game';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const readyGame = useCallback(async (): Promise<BasicResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.readyGame();

      if (response.success) {
        toast.success('Ready for game');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to ready game';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const reconnectToGame = useCallback(async (gameId: string): Promise<void> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.reconnectToGame(gameId);

      if (response.success && response.gameState) {
        setGameState(response.gameState);
        setIsInGame(true);
        toast.success('Reconnected to game');
      } else {
        toast.error(response.error || 'Failed to reconnect');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reconnect';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  // Game action methods
  const placeUnit = useCallback(async (
    cardId: string,
    position: GamePosition,
    handIndex: number
  ): Promise<GameActionResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.placeUnit({
        cardId,
        position,
        handIndex
      });

      if (response.success && response.gameState) {
        setGameState(response.gameState);
        if (response.validMoves) {
          setValidMoves(response.validMoves);
        }
      } else {
        toast.error(response.error || 'Failed to place unit');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to place unit';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const attack = useCallback(async (
    from: GamePosition,
    to: GamePosition
  ): Promise<GameActionResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.attack({
        attackerPosition: from,
        targetPosition: to
      });

      if (response.success && response.gameState) {
        setGameState(response.gameState);
      } else {
        toast.error(response.error || 'Attack failed');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Attack failed';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const castSpell = useCallback(async (
    cardId: string,
    handIndex: number,
    target?: GamePosition,
    targets?: GamePosition[]
  ): Promise<GameActionResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.castSpell({
        cardId,
        handIndex,
        ...(target && { target }),
        ...(targets && { targets })
      });

      if (response.success && response.gameState) {
        setGameState(response.gameState);
      } else {
        toast.error(response.error || 'Failed to cast spell');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to cast spell';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const endTurn = useCallback(async (): Promise<GameActionResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.endTurn();

      if (response.success && response.gameState) {
        setGameState(response.gameState);
        toast('Turn ended');
      } else {
        toast.error(response.error || 'Failed to end turn');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to end turn';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const surrender = useCallback(async (): Promise<BasicResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.surrender();

      if (response.success) {
        setIsInGame(false);
        setGameState(null);
        toast('Game surrendered');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to surrender';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  // Matchmaking methods
  const joinMatchmaking = useCallback(async (data: MatchmakingJoinData): Promise<MatchmakingResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.joinMatchmaking(data);

      if (response.success) {
        toast.success('Joined matchmaking queue');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to join matchmaking';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  const leaveMatchmaking = useCallback(async (): Promise<BasicResponse> => {
    if (!socketService) throw new Error('Socket not connected');

    try {
      const response = await socketService.leaveMatchmaking();

      if (response.success) {
        toast('Left matchmaking queue');
      }

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to leave matchmaking';
      toast.error(errorMsg);
      throw error;
    }
  }, [socketService]);

  // Utility methods
  const getCurrentPlayer = useCallback((): PlayerData | null => {
    if (!gameState || !currentUserId) {
      console.log('getCurrentPlayer: Missing data', { hasGameState: !!gameState, currentUserId });
      return null;
    }

    if (gameState.players.player1.id === currentUserId) {
      console.log('getCurrentPlayer: Found player1', gameState.players.player1);
      return gameState.players.player1;
    }
    if (gameState.players.player2.id === currentUserId) {
      console.log('getCurrentPlayer: Found player2', gameState.players.player2);
      return gameState.players.player2;
    }

    console.log('getCurrentPlayer: No match found', {
      currentUserId,
      player1Id: gameState.players.player1.id,
      player2Id: gameState.players.player2.id
    });
    return null;
  }, [gameState, currentUserId]);

  const getOpponent = useCallback((): PlayerData | null => {
    if (!gameState || !currentUserId) return null;

    if (gameState.players.player1.id === currentUserId) {
      return gameState.players.player2;
    }
    if (gameState.players.player2.id === currentUserId) {
      return gameState.players.player1;
    }

    return null;
  }, [gameState, currentUserId]);

  const isMyTurn = useCallback((): boolean => {
    return gameState?.currentPlayer === currentUserId;
  }, [gameState, currentUserId]);

  const getTimeRemaining = useCallback((): number => {
    return gameState?.timeRemaining || 0;
  }, [gameState]);

  const getValidMoves = useCallback((position: GamePosition): GamePosition[] => {
    // This would be enhanced with actual game logic
    return validMoves.filter(move =>
      Math.abs(move.x - position.x) <= 1 && Math.abs(move.y - position.y) <= 1
    );
  }, [validMoves]);

  return {
    // Connection state
    isConnected,
    isAuthenticated,
    isInGame,
    gameState,
    error: error || socketError,
    socketService,

    // Game management
    createGame,
    joinGame,
    leaveGame,
    readyGame,
    reconnectToGame,

    // Game actions
    placeUnit,
    attack,
    castSpell,
    endTurn,
    surrender,

    // Matchmaking
    joinMatchmaking,
    leaveMatchmaking,

    // Utility
    getCurrentPlayer,
    getOpponent,
    isMyTurn,
    getTimeRemaining,
    getValidMoves,
  };
};

export default useGameSocket;