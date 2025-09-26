import { useCallback, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import GameBoard from '@/components/game/GameBoard';
import HearthstoneHand from '@/components/game/HearthstoneHand';
import useGameSocket from '@/hooks/useGameSocket';
import { useGameState, useGameLoading, useGameActions, useConnectionState, useGameStore } from '@/stores';
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

  // Hand interaction handlers
  const handleCardSelect = useCallback((card: GameCard, index: number) => {
    console.log('Card selected from hand:', card.name, 'at index', index);
    // TODO: Implement card selection logic
    toast.info(`Selected: ${card.name}`);
  }, []);

  const handleCardDragStart = useCallback((card: GameCard, index: number) => {
    console.log('Card drag started:', card.name, 'from index', index);
    // TODO: Implement drag start logic (e.g., highlight valid drop zones)
  }, []);

  const handleCardDragEnd = useCallback((card: GameCard, index: number, didDrop: boolean) => {
    console.log('Card drag ended:', card.name, 'dropped:', didDrop);
    // TODO: Implement card play logic if dropped successfully
    if (didDrop) {
      toast.success(`Played: ${card.name}`);
    }
  }, []);

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
  if (socketError && !useMockData) {
    console.log("Error on socket and don't use mock");
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
            {socketError}
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
  if (!gameState) {
    console.log("No game state")
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

  console.log("Normal way")
  return (
    <div className="h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex flex-col relative overflow-hidden">
      {/* Atmospheric background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent"></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-aliens-600 to-transparent"></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-600 to-transparent"></div>
      </div>

      {/* Connection Status */}
      {!isConnected && !useMockData && (
        <div className="absolute top-4 right-4 z-50 bg-blood-600/90 border border-blood-500/50 text-blood-100 px-6 py-3 backdrop-blur-sm font-tech font-bold tracking-wide shadow-lg shadow-blood-500/30">
          <span className="gothic-text-shadow">⚠ CONNECTION LOST</span>
        </div>
      )}

      {/* Game Board */}
      <GameBoard
        gameState={gameState}
        onGameAction={handleGameAction}
        onTurnEnd={handleTurnEnd}
        onSurrender={handleSurrender}
      />

      {/* Player Hand */}
      {gameState.players.player1 && (
        <HearthstoneHand
          cards={gameState.players.player1.hand}
          faction={gameState.players.player1.faction}
          resources={gameState.players.player1.resources}
          onCardSelect={handleCardSelect}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
        />
      )}
    </div>
  );
};

export default Game;