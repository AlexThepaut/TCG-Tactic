import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import GameBoard from '@/components/game/GameBoard';
import GameEndScreen from '@/components/game/GameEndScreen';
import GameWaitingRoom from '@/components/game/GameWaitingRoom';
import { GameSocketProvider, useGameSocketContext } from '@/contexts/GameSocketContext';
import { getSocketService } from '@/services/socketService';
import type { GameState, GameCard, Faction } from '@/types';

// Mock game data for development/testing
const createMockGameState = (gameId: string): GameState => {
  const mockCards: GameCard[] = [
    {
      id: 'card-1',
      name: 'Imperial Warrior',
      cost: 2,
      attack: 2,
      health: 3,
      maxHealth: 3,
      faction: 'humans' as Faction,
      type: 'unit',
      abilities: ['War Formation'],
      rarity: 'common',
    },
    {
      id: 'card-2',
      name: 'Alien Echo',
      cost: 1,
      attack: 1,
      health: 2,
      maxHealth: 2,
      faction: 'aliens' as Faction,
      type: 'unit',
      abilities: ['War Evolution'],
      rarity: 'common',
    },
    {
      id: 'card-3',
      name: 'Machine Guardian',
      cost: 3,
      attack: 3,
      health: 4,
      maxHealth: 4,
      faction: 'robots' as Faction,
      type: 'unit',
      abilities: ['War Protocol'],
      rarity: 'rare',
    },
    {
      id: 'card-4',
      name: 'War Strike',
      cost: 2,
      attack: 0,
      health: 0,
      maxHealth: 0,
      faction: 'humans' as Faction,
      type: 'spell',
      abilities: ['Deal 3 damage'],
      rarity: 'common',
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
        hand: [mockCards[0]!, mockCards[3]!, mockCards[0]!, mockCards[3]!, mockCards[1]!, mockCards[2]!, mockCards[0]!],
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

/**
 * GameContent - Inner component that consumes GameSocketContext
 * Separated to allow wrapping with provider in parent
 */
const GameContent = () => {
  const { gameId } = useParams<{ gameId: string }>();

  // Get all game state from context (single source of truth)
  const {
    gameState,
    isConnected,
    error,
  } = useGameSocketContext();

  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [mockGameState, setMockGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  // Handle game over from gameState
  useEffect(() => {
    if (gameState?.gameOver && gameState.winner) {
      const result = {
        winner: gameState.winner,
        loser: gameState.currentPlayer === gameState.winner
          ? (gameState.players.player1.id === gameState.winner ? gameState.players.player2.id : gameState.players.player1.id)
          : gameState.currentPlayer,
        winCondition: gameState.winCondition || 'Victory achieved',
        gameEndedAt: new Date(),
        gameDuration: Math.floor((new Date().getTime() - new Date(gameState.gameStartedAt).getTime()) / 1000),
        totalTurns: gameState.turn,
        actions: [] // Actions would come from game history if available
      };
      setGameResult(result);
    }
  }, [gameState?.gameOver, gameState?.winner]);

  // Determine if we should use mock data
  useEffect(() => {
    const shouldUseMock = !gameId || gameId === 'test-game-123' || !isConnected;

    if (shouldUseMock && !mockGameState) {
      const testGameId = gameId || 'test-game-123';
      console.log('Using mock data for development/testing', { gameId: testGameId, isConnected });
      setMockGameState(createMockGameState(testGameId));
      setUseMockData(true);
    }

    // Clear loading once we have state (real or mock)
    if (gameState || mockGameState) {
      setIsLoading(false);
    }
  }, [gameId, isConnected, gameState, mockGameState]);

  // Listen for waiting room events
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService) return;

    const handlePlayerJoined = (player: any) => {
      toast.success(`${player.username || 'Player'} joined the game!`);
    };

    const handlePlayerReady = (data: { playerId: string; isReady: boolean }) => {
      const localPlayerId = gameState?.players.player1.id || 'player-1';
      if (data.playerId === localPlayerId.toString()) {
        setIsReady(data.isReady);
      } else {
        setOpponentReady(data.isReady);
      }
    };

    const handleGameStarted = (data: { gameState: GameState }) => {
      toast.success('Game started!');
      // Game state will be updated via the normal game:state_update event
    };

    socketService.on('game:player_joined', handlePlayerJoined);
    socketService.on('game:player_ready', handlePlayerReady);
    socketService.on('game:started', handleGameStarted);

    return () => {
      socketService.off('game:player_joined', handlePlayerJoined);
      socketService.off('game:player_ready', handlePlayerReady);
      socketService.off('game:started', handleGameStarted);
    };
  }, [gameState]);

  // Handle socket errors
  useEffect(() => {
    if (error && !useMockData) {
      console.error('Socket error in Game:', error);
      toast.error(`Connection Error: ${error}`);
    }
  }, [error, useMockData]);

  const handleReady = useCallback(() => {
    const socketService = getSocketService();
    if (!socketService) {
      toast.error('Not connected to game server');
      return;
    }

    socketService.emit('game:ready', (response) => {
      if (response.success) {
        toast.success('You are ready!');
      } else {
        toast.error(response.error || 'Failed to ready up');
      }
    });
  }, []);

  // Use mock data if in testing mode, otherwise use real game state
  const activeGameState = useMockData ? mockGameState : gameState;

  // Show waiting room if game status is 'waiting'
  if (activeGameState?.status === 'waiting' && !useMockData) {
    const localPlayerId = activeGameState?.players.player1.id || 'player-1';
    return (
      <GameWaitingRoom
        gameId={activeGameState.id}
        isHost={activeGameState.players.player1.id.toString() === localPlayerId.toString()}
        opponentJoined={activeGameState.players.player2.id !== 0}
        onReady={handleReady}
        isReady={isReady}
        opponentReady={opponentReady}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center relative overflow-hidden">
        {/* Atmospheric effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent"></div>
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-aliens-600 to-transparent"></div>
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-600 to-transparent"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="mb-6 flex justify-center">
            <div className="text-imperial-400 text-4xl font-gothic icon-glow-imperial animate-pulse">⚔</div>
          </div>

          <div className="text-3xl font-gothic font-bold text-imperial-400 mb-6 gothic-text-shadow tracking-wider animate-hologram">
            INITIALIZING WAR FIELD...
          </div>

          {gameId && (
            <div className="text-imperial-300 font-tech tracking-wide mb-4">WAR ID: {gameId}</div>
          )}

          {!isConnected && (
            <div className="text-blood-400 mt-4 font-tech tracking-wide animate-flicker">
              ⚠ OFFLINE MODE • WAR SIMULATION ACTIVE
            </div>
          )}

          {/* Loading animation */}
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-imperial-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-imperial-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-imperial-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !useMockData) {
    return (
      <div className="h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center relative overflow-hidden">
        {/* Atmospheric effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-600 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-600 to-transparent"></div>
        </div>

        <div className="text-center relative z-10 max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="text-blood-400 text-4xl font-gothic icon-glow-void animate-flicker">⚠</div>
          </div>

          <div className="text-3xl font-gothic font-bold text-blood-400 mb-6 gothic-text-shadow tracking-wider">
            CONNECTION FAILURE
          </div>

          <div className="text-blood-300 mb-8 font-tech tracking-wide bg-gothic-darkest/60 border border-blood-600/30 p-4">
            {error}
          </div>

          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-3" />
            <span className="gothic-text-shadow">RETURN TO WAR ROOM</span>
          </Link>
        </div>
      </div>
    );
  }

  // No game state
  if (!activeGameState) {
    return (
      <div className="h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center relative overflow-hidden">
        {/* Atmospheric effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-600 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-600 to-transparent"></div>
        </div>

        <div className="text-center relative z-10 max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="text-void-400 text-4xl font-gothic icon-glow-void animate-pulse">❌</div>
          </div>

          <div className="text-3xl font-gothic font-bold text-void-400 mb-6 gothic-text-shadow tracking-wider">
            WAR DATA MISSING
          </div>

          <div className="text-void-300 mb-8 font-tech tracking-wide bg-gothic-darkest/60 border border-void-600/30 p-4">
            War intelligence could not be retrieved.
          </div>

          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-3" />
            <span className="gothic-text-shadow">RETURN TO WAR ROOM</span>
          </Link>
        </div>
      </div>
    );
  }

  // Game Over - show end screen
  if (gameResult) {
    const localPlayerId = activeGameState?.players.player1.id || 'player-1'; // TODO: Get actual local player ID

    return (
      <GameEndScreen
        result={gameResult}
        localPlayerId={localPlayerId}
        onRematch={() => {
          setGameResult(null);
          // TODO: Implement rematch logic
          toast.success('Rematch requested');
        }}
      />
    );
  }

  // Main game board with active state
  return (
    <div className="h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex flex-col relative overflow-hidden">
      {/* Atmospheric background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent"></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-aliens-600 to-transparent"></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-600 to-transparent"></div>
      </div>

      {/* Game Board - now gets all state from context */}
      <GameBoard
        gameState={activeGameState}
        useMockData={useMockData}
      />
    </div>
  );
};

/**
 * Game Component - Wraps GameContent with GameSocketProvider
 * This is the entry point that sets up the context
 */
const Game = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();

  // Determine if this is a real game or testing mode
  const isTestMode = !gameId || gameId === 'test-game-123' || gameId.startsWith('test-');
  const effectiveGameId = gameId || 'test-game-123';

  // Callbacks for socket events
  const handleGameOver = useCallback((result: any) => {
    console.log('Game Over:', result);
    toast.success(`Game Over! Winner: ${result.winner}`);
    setTimeout(() => navigate('/'), 3000);
  }, [navigate]);

  const handleGameError = useCallback((error: string) => {
    toast.error(`Game Error: ${error}`);
  }, []);

  // Only provide socket connection for non-test modes
  if (isTestMode) {
    // For test mode, we still wrap with provider but it won't create a real connection
    return (
      <GameSocketProvider
        gameId={effectiveGameId}
        autoJoinGame={false}
        callbacks={{
          onGameError: handleGameError,
        }}
      >
        <GameContent />
      </GameSocketProvider>
    );
  }

  // Real game mode - full socket connection
  return (
    <GameSocketProvider
      gameId={effectiveGameId}
      autoJoinGame={true}
      callbacks={{
        onGameOver: handleGameOver,
        onGameError: handleGameError,
      }}
    >
      <GameContent />
    </GameSocketProvider>
  );
};

export default Game;
