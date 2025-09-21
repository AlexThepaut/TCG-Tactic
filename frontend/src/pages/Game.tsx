import { useCallback, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import GameBoard from '@/components/game/GameBoard';
import useGameSocket from '@/hooks/useGameSocket';
import { useGameState, useGameLoading, useGameActions, useConnectionState, useGameStore } from '@/stores';
import type { GameState, GameCard, Faction } from '@/types';

// Mock game data for development/testing
const createMockGameState = (gameId: string): GameState => {
  const mockCards: GameCard[] = [
    {
      id: 'card-1',
      name: 'Human Soldier',
      cost: 2,
      attack: 2,
      health: 3,
      maxHealth: 3,
      faction: 'humans' as Faction,
      type: 'unit',
      abilities: ['Tactical Formation'],
    },
    {
      id: 'card-2',
      name: 'Alien Scout',
      cost: 1,
      attack: 1,
      health: 2,
      maxHealth: 2,
      faction: 'aliens' as Faction,
      type: 'unit',
      abilities: ['Adaptive Evolution'],
    },
    {
      id: 'card-3',
      name: 'Robot Guardian',
      cost: 3,
      attack: 3,
      health: 4,
      maxHealth: 4,
      faction: 'robots' as Faction,
      type: 'unit',
      abilities: ['Reanimation Protocol'],
    },
    {
      id: 'card-4',
      name: 'Lightning Bolt',
      cost: 2,
      attack: 0,
      health: 0,
      maxHealth: 0,
      faction: 'humans' as Faction,
      type: 'spell',
      abilities: ['Deal 3 damage'],
    }
  ];

  return {
    id: gameId,
    status: 'active',
    players: {
      player1: {
        id: 'player-1',
        username: 'Player 1',
        faction: 'humans',
        hand: [mockCards[0]!, mockCards[3]!, mockCards[0]!, mockCards[3]!],
        board: Array(3).fill(null).map(() => Array(5).fill(null)),
        resources: 5,
        questId: 'quest-humans-1',
        isReady: true,
        lastActionAt: new Date()
      },
      player2: {
        id: 'player-2',
        username: 'Player 2',
        faction: 'aliens',
        hand: [mockCards[1]!, mockCards[1]!, mockCards[1]!],
        board: Array(3).fill(null).map(() => Array(5).fill(null)),
        resources: 4,
        questId: 'quest-aliens-1',
        isReady: true,
        lastActionAt: new Date()
      }
    },
    currentPlayer: 'player-1',
    turn: 1,
    phase: 'actions',
    timeLimit: 90,
    timeRemaining: 75,
    gameStartedAt: new Date(),
    lastActionAt: new Date(),
    gameOver: false,
    spectators: []
  };
};

const Game = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();

  // Zustand store state
  const gameState = useGameState();
  const isLoading = useGameLoading();
  const { isConnected } = useConnectionState();
  const useMockData = useGameStore((state) => state.useMockData);
  const {
    setGameState,
    setLoading,
    setUseMockData,
    setConnectionState,
    handleGameOver,
    handlePlayerJoined,
    handlePlayerLeft,
    handleActionPerformed,
    handleTurnChanged,
    handleCombatResult,
    setError,
  } = useGameActions();

  // Socket connection - pass gameId for testing mode user ID detection
  const {
    isConnected: socketConnected,
    isAuthenticated,
    isInGame,
    gameState: socketGameState,
    leaveGame,
    error: socketError,
  } = useGameSocket(
    gameId && gameId !== 'test-game-123'
      ? {
          gameId,
          autoJoinGame: true,
          callbacks: {
            onGameStateUpdate: (newState) => {
              setGameState(newState);
              setLoading(false);
            },
            onGameOver: (result) => {
              handleGameOver(result);
              toast.success(`Game Over! Winner: ${result.winner}`);
              setTimeout(() => navigate('/'), 3000);
            },
            onGameError: (error) => {
              setError(error);
              toast.error(`Game Error: ${error}`);
            },
            onPlayerJoined: handlePlayerJoined,
            onPlayerLeft: handlePlayerLeft,
            onActionPerformed: handleActionPerformed,
            onTurnChanged: handleTurnChanged,
            onCombatResult: handleCombatResult,
          },
        }
      : {
          // Pass gameId even for testing mode to enable user ID detection
          gameId: gameId || 'test-game-123',
        }
  );

  // Sync connection state with store
  useEffect(() => {
    setConnectionState(socketConnected, isAuthenticated, isInGame);
  }, [socketConnected, isAuthenticated, isInGame, setConnectionState]);

  // Initialize game state
  useEffect(() => {
    if (socketGameState) {
      setGameState(socketGameState);
      setLoading(false);
    } else if (!gameId || gameId === 'test-game-123' || !isConnected) {
      // Use mock data for development/testing
      const testGameId = gameId || 'test-game-123';
      console.log('Using mock data for development/testing', { gameId: testGameId, isConnected });
      setGameState(createMockGameState(testGameId));
      setUseMockData(true);
      setLoading(false);
    }
  }, [socketGameState, gameId, isConnected, setGameState, setLoading, setUseMockData]);

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      console.error('Socket error in Game:', socketError);
      setError(socketError);
      toast.error(`Connection Error: ${socketError}`);
    }
  }, [socketError, setError]);

  // Handle game actions
  const handleGameAction = useCallback((action: string, data: any) => {
    console.log('Game action:', action, data);
    // Additional action handling can be added here
  }, []);

  const handleTurnEnd = useCallback(() => {
    console.log('Turn ended');
    toast.success('Turn ended');
  }, []);

  const handleSurrender = useCallback(async () => {
    if (useMockData) {
      toast.error('Surrendered (mock mode)');
      navigate('/');
      return;
    }

    try {
      await leaveGame();
      navigate('/');
    } catch (error) {
      console.error('Failed to leave game:', error);
      toast.error('Failed to leave game');
    }
  }, [useMockData, leaveGame, navigate]);

  const handleExitGame = useCallback(async () => {
    const confirmed = window.confirm('Are you sure you want to exit the game?');
    if (!confirmed) return;

    if (useMockData) {
      navigate('/');
      return;
    }

    try {
      await leaveGame();
      navigate('/');
    } catch (error) {
      console.error('Failed to exit game:', error);
      navigate('/'); // Exit anyway
    }
  }, [useMockData, leaveGame, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-semibold mb-4">Loading Game...</div>
          {gameId && (
            <div className="text-gray-400">Game ID: {gameId}</div>
          )}
          {!isConnected && (
            <div className="text-yellow-400 mt-2">
              No connection - using mock data
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (socketError && !useMockData) {
    console.log("Error on socket and don't use mock");
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-2xl font-semibold mb-4 text-red-400">
            Connection Error
          </div>
          <div className="text-gray-300 mb-6">
            {socketError}
          </div>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // No game state
  if (!gameState) {
    console.log("No game state")
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-2xl font-semibold mb-4">
            Game Not Found
          </div>
          <div className="text-gray-300 mb-6">
            The requested game could not be loaded.
          </div>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  console.log("Normal way")
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Connection Status */}
      {!isConnected && !useMockData && (
        <div className="absolute top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Connection Lost
        </div>
      )}

      {/* Game Board */}
      <GameBoard
        gameState={gameState}
        onGameAction={handleGameAction}
        onTurnEnd={handleTurnEnd}
        onSurrender={handleSurrender}
      />
    </div>
  );
};

export default Game;