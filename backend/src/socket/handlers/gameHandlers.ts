/**
 * Game Event Handlers
 * Core game mechanics: create, join, place units, attack, turn management
 */
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { logger, loggers } from '../../utils/logger';
import { getUserInfo, validateGamePermission } from '../../middleware/socketAuth';
import { addUserToGameRoom, removeUserFromGameRoom } from './connectionHandlers';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  GameState,
  PlayerData,
  GameCreateConfig,
  GameResponse,
  GameActionResponse,
  BasicResponse,
  PlaceUnitData,
  AttackData,
  CastSpellData,
  GameAction,
  GameResult,
  GameCard,
  GamePosition
} from '../../types/socket';

// In-memory game storage (will be replaced with database service later)
const activeGames = new Map<string, GameState>();
const gameTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Setup game-related event handlers
 */
export function setupGameHandlers(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {

  // Game management
  socket.on('game:create', (gameConfig, callback) => {
    handleGameCreate(socket, io, gameConfig, callback);
  });

  socket.on('game:join', (gameId, callback) => {
    handleGameJoin(socket, io, gameId, callback);
  });

  socket.on('game:leave', (callback) => {
    handleGameLeave(socket, io, callback);
  });

  socket.on('game:ready', (callback) => {
    handleGameReady(socket, io, callback);
  });

  // Game actions
  socket.on('game:place_unit', (data, callback) => {
    handlePlaceUnit(socket, io, data, callback);
  });

  socket.on('game:attack', (data, callback) => {
    handleAttack(socket, io, data, callback);
  });

  socket.on('game:cast_spell', (data, callback) => {
    handleCastSpell(socket, io, data, callback);
  });

  socket.on('game:end_turn', (callback) => {
    handleEndTurn(socket, io, callback);
  });

  socket.on('game:surrender', (callback) => {
    handleSurrender(socket, io, callback);
  });
}

/**
 * Handle game creation
 */
function handleGameCreate(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  gameConfig: GameCreateConfig,
  callback: (response: GameResponse) => void
): void {
  try {
    const userInfo = getUserInfo(socket);

    if (!socket.userData?.isAuthenticated) {
      return callback({
        success: false,
        error: 'Authentication required to create game'
      });
    }

    // Validate game configuration
    const validationError = validateGameConfig(gameConfig);
    if (validationError) {
      return callback({
        success: false,
        error: validationError
      });
    }

    // Check if user is already in a game
    if (socket.gameId) {
      return callback({
        success: false,
        error: 'Already in a game. Leave current game first.'
      });
    }

    const gameId = uuidv4();
    const userId = socket.userData.userId;

    // Create player data
    const playerData: PlayerData = {
      id: userId,
      username: socket.userData.username,
      faction: gameConfig.faction,
      hand: [], // Will be populated when game starts
      board: Array(3).fill(null).map(() => Array(5).fill(null)), // 3x5 grid
      resources: 0,
      questId: generateRandomQuest(gameConfig.faction),
      isReady: false,
      lastActionAt: new Date()
    };

    // Create game state
    const gameState: GameState = {
      id: gameId,
      status: 'waiting',
      players: {
        player1: playerData,
        player2: null as any // Will be set when second player joins
      },
      currentPlayer: userId,
      turn: 0,
      phase: 'resources',
      timeLimit: gameConfig.timeLimit,
      timeRemaining: gameConfig.timeLimit,
      gameStartedAt: new Date(),
      lastActionAt: new Date(),
      gameOver: false,
      spectators: gameConfig.spectatorMode ? [] : []
    };

    // Store game
    activeGames.set(gameId, gameState);

    // Join socket to game room
    socket.gameId = gameId;
    socket.playerId = userId;
    socket.join(`game:${gameId}`);
    socket.join(`game:${gameId}:players`);

    // Add to game room tracking
    addUserToGameRoom(userId, gameId, true);

    loggers.game.info('Game created successfully', {
      ...userInfo,
      gameId,
      gameConfig
    });

    callback({
      success: true,
      message: 'Game created successfully',
      gameId,
      gameState,
      playerId: userId
    });

    // Broadcast game creation (for matchmaking service)
    io.emit('game:created' as any, { gameId, creator: userId });

  } catch (error: any) {
    loggers.game.error('Game creation failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to create game due to server error'
    });
  }
}

/**
 * Handle joining a game
 */
function handleGameJoin(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  gameId: string,
  callback: (response: GameResponse) => void
): void {
  try {
    const userInfo = getUserInfo(socket);

    if (!socket.userData?.isAuthenticated) {
      return callback({
        success: false,
        error: 'Authentication required to join game'
      });
    }

    // Check if user is already in a game
    if (socket.gameId) {
      return callback({
        success: false,
        error: 'Already in a game. Leave current game first.'
      });
    }

    const gameState = activeGames.get(gameId);
    if (!gameState) {
      return callback({
        success: false,
        error: 'Game not found or no longer active'
      });
    }

    if (gameState.status !== 'waiting') {
      return callback({
        success: false,
        error: 'Game is not accepting new players'
      });
    }

    const userId = socket.userData.userId;

    // Check if game is full
    if (gameState.players.player2) {
      return callback({
        success: false,
        error: 'Game is full'
      });
    }

    // Check if user is trying to join their own game
    if (gameState.players.player1.id === userId) {
      return callback({
        success: false,
        error: 'Cannot join your own game'
      });
    }

    // TODO: Validate deck and faction when deck system is implemented
    const playerData: PlayerData = {
      id: userId,
      username: socket.userData.username,
      faction: 'humans', // TODO: Get from user's deck selection
      hand: [],
      board: Array(3).fill(null).map(() => Array(5).fill(null)),
      resources: 0,
      questId: generateRandomQuest('humans'), // TODO: Use actual faction
      isReady: false,
      lastActionAt: new Date()
    };

    // Add player to game
    gameState.players.player2 = playerData;
    gameState.lastActionAt = new Date();

    // Join socket to game room
    socket.gameId = gameId;
    socket.playerId = userId;
    socket.join(`game:${gameId}`);
    socket.join(`game:${gameId}:players`);

    // Add to game room tracking
    addUserToGameRoom(userId, gameId, true);

    // Notify other players
    socket.to(`game:${gameId}`).emit('game:player_joined', playerData);

    loggers.game.info('Player joined game', {
      ...userInfo,
      gameId
    });

    callback({
      success: true,
      message: 'Joined game successfully',
      gameId,
      gameState,
      playerId: userId
    });

  } catch (error: any) {
    loggers.game.error('Game join failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId,
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to join game due to server error'
    });
  }
}

/**
 * Handle leaving a game
 */
function handleGameLeave(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): void {
  try {
    const userInfo = getUserInfo(socket);

    if (!socket.gameId) {
      return callback({
        success: false,
        error: 'Not currently in a game'
      });
    }

    const gameId = socket.gameId;
    const userId = socket.userData?.userId || socket.id;

    // Remove from game room tracking
    removeUserFromGameRoom(userId, gameId);

    // Leave socket rooms
    socket.leave(`game:${gameId}`);
    socket.leave(`game:${gameId}:players`);
    socket.leave(`game:${gameId}:spectators`);

    // Notify other players
    socket.to(`game:${gameId}`).emit('game:player_left', userId);

    // Clean up socket data
    delete socket.gameId;
    delete socket.playerId;

    // Handle game cleanup
    const gameState = activeGames.get(gameId);
    if (gameState) {
      if (gameState.status === 'active') {
        // End game if it was active
        endGame(gameId, io, 'player_left');
      } else {
        // Remove game if it was waiting
        activeGames.delete(gameId);
        clearGameTimeout(gameId);
      }
    }

    loggers.game.info('Player left game', { ...userInfo, gameId });

    callback({
      success: true,
      message: 'Left game successfully'
    });

  } catch (error: any) {
    loggers.game.error('Game leave failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to leave game due to server error'
    });
  }
}

/**
 * Handle player ready status
 */
function handleGameReady(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): void {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'ready')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = activeGames.get(socket.gameId);
    if (!gameState) {
      return callback({
        success: false,
        error: 'Game not found'
      });
    }

    const userId = socket.userData?.userId || socket.id;

    // Set player ready
    if (gameState.players.player1.id === userId) {
      gameState.players.player1.isReady = true;
    } else if (gameState.players.player2?.id === userId) {
      gameState.players.player2.isReady = true;
    } else {
      return callback({
        success: false,
        error: 'Player not found in game'
      });
    }

    // Check if both players are ready
    if (gameState.players.player1.isReady &&
        gameState.players.player2?.isReady) {
      startGame(socket.gameId, io);
    }

    // Broadcast updated game state
    io.to(`game:${socket.gameId}`).emit('game:state_update', gameState);

    callback({
      success: true,
      message: 'Ready status updated'
    });

  } catch (error: any) {
    loggers.game.error('Game ready failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to update ready status'
    });
  }
}

/**
 * Handle unit placement
 */
function handlePlaceUnit(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: PlaceUnitData,
  callback: (response: GameActionResponse) => void
): void {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'place_unit')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = activeGames.get(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = socket.userData?.userId || socket.id;

    // Validate it's player's turn
    if (gameState.currentPlayer !== userId) {
      return callback({
        success: false,
        error: 'Not your turn'
      });
    }

    // Validate game phase
    if (gameState.phase !== 'actions') {
      return callback({
        success: false,
        error: 'Cannot place units during this phase'
      });
    }

    // TODO: Implement actual unit placement logic
    // This is a placeholder that will be replaced with actual game logic

    const action: GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'place_unit',
      data: data,
      timestamp: new Date(),
      turn: gameState.turn,
      phase: gameState.phase
    };

    // Broadcast action to all players
    io.to(`game:${socket.gameId}`).emit('game:action_performed', action);
    io.to(`game:${socket.gameId}`).emit('game:state_update', gameState);

    callback({
      success: true,
      message: 'Unit placed successfully',
      gameState,
      action
    });

  } catch (error: any) {
    loggers.game.error('Place unit failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      data,
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to place unit'
    });
  }
}

/**
 * Handle attack action
 */
function handleAttack(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: AttackData,
  callback: (response: GameActionResponse) => void
): void {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'attack')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = activeGames.get(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = socket.userData?.userId || socket.id;

    // Validate it's player's turn
    if (gameState.currentPlayer !== userId) {
      return callback({
        success: false,
        error: 'Not your turn'
      });
    }

    // TODO: Implement actual attack logic
    // This is a placeholder that will be replaced with actual game logic

    const action: GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'attack',
      data: data,
      timestamp: new Date(),
      turn: gameState.turn,
      phase: gameState.phase
    };

    // Broadcast action to all players
    io.to(`game:${socket.gameId}`).emit('game:action_performed', action);
    io.to(`game:${socket.gameId}`).emit('game:state_update', gameState);

    callback({
      success: true,
      message: 'Attack executed successfully',
      gameState,
      action
    });

  } catch (error: any) {
    loggers.game.error('Attack failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      data,
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to execute attack'
    });
  }
}

/**
 * Handle spell casting
 */
function handleCastSpell(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: CastSpellData,
  callback: (response: GameActionResponse) => void
): void {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'cast_spell')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = activeGames.get(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = socket.userData?.userId || socket.id;

    // Validate it's player's turn
    if (gameState.currentPlayer !== userId) {
      return callback({
        success: false,
        error: 'Not your turn'
      });
    }

    // TODO: Implement actual spell casting logic
    // This is a placeholder that will be replaced with actual game logic

    const action: GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'cast_spell',
      data: data,
      timestamp: new Date(),
      turn: gameState.turn,
      phase: gameState.phase
    };

    // Broadcast action to all players
    io.to(`game:${socket.gameId}`).emit('game:action_performed', action);
    io.to(`game:${socket.gameId}`).emit('game:state_update', gameState);

    callback({
      success: true,
      message: 'Spell cast successfully',
      gameState,
      action
    });

  } catch (error: any) {
    loggers.game.error('Cast spell failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      data,
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to cast spell'
    });
  }
}

/**
 * Handle end turn
 */
function handleEndTurn(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: GameActionResponse) => void
): void {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'end_turn')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = activeGames.get(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = socket.userData?.userId || socket.id;

    // Validate it's player's turn
    if (gameState.currentPlayer !== userId) {
      return callback({
        success: false,
        error: 'Not your turn'
      });
    }

    // Switch to next player
    const nextPlayer = gameState.currentPlayer === gameState.players.player1.id
      ? gameState.players.player2.id
      : gameState.players.player1.id;

    gameState.currentPlayer = nextPlayer;
    gameState.turn++;
    gameState.phase = 'resources'; // Reset to resources phase
    gameState.timeRemaining = gameState.timeLimit;
    gameState.lastActionAt = new Date();

    // Clear any existing turn timeout
    clearGameTimeout(socket.gameId);

    // Set new turn timeout
    setTurnTimeout(socket.gameId, io);

    const action: GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'end_turn',
      data: {},
      timestamp: new Date(),
      turn: gameState.turn - 1, // Previous turn
      phase: 'end'
    };

    // Broadcast turn change
    io.to(`game:${socket.gameId}`).emit('game:turn_changed', nextPlayer, gameState.timeRemaining);
    io.to(`game:${socket.gameId}`).emit('game:action_performed', action);
    io.to(`game:${socket.gameId}`).emit('game:state_update', gameState);

    callback({
      success: true,
      message: 'Turn ended successfully',
      gameState,
      action
    });

  } catch (error: any) {
    loggers.game.error('End turn failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to end turn'
    });
  }
}

/**
 * Handle surrender
 */
function handleSurrender(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): void {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'surrender')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = activeGames.get(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = socket.userData?.userId || socket.id;

    // End game with surrender
    endGame(socket.gameId!, io, 'surrender', userId);

    callback({
      success: true,
      message: 'Game surrendered'
    });

  } catch (error: any) {
    loggers.game.error('Surrender failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      error: error.message
    });

    callback({
      success: false,
      error: 'Failed to surrender'
    });
  }
}

/**
 * Validate game configuration
 */
function validateGameConfig(config: GameCreateConfig): string | null {
  if (config.timeLimit < 30 || config.timeLimit > 300) {
    return 'Time limit must be between 30 and 300 seconds';
  }

  if (!['humans', 'aliens', 'robots'].includes(config.faction)) {
    return 'Invalid faction';
  }

  if (!config.deck || config.deck.length !== 40) {
    return 'Deck must contain exactly 40 cards';
  }

  return null;
}

/**
 * Generate random quest for faction
 */
function generateRandomQuest(faction: string): string {
  const quests = {
    humans: ['tactical_superiority', 'defensive_mastery', 'coordinated_strike'],
    aliens: ['evolutionary_dominance', 'adaptive_survival', 'swarm_victory'],
    robots: ['technological_supremacy', 'persistent_advance', 'systematic_elimination']
  };

  const factionQuests = quests[faction as keyof typeof quests] || quests.humans;
  const randomIndex = Math.floor(Math.random() * factionQuests.length);
  return factionQuests[randomIndex]!;
}

/**
 * Start the game
 */
function startGame(
  gameId: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const gameState = activeGames.get(gameId);
  if (!gameState) return;

  gameState.status = 'active';
  gameState.turn = 1;
  gameState.phase = 'resources';
  gameState.gameStartedAt = new Date();
  gameState.lastActionAt = new Date();

  // TODO: Deal initial cards, set starting resources, etc.

  // Set turn timeout
  setTurnTimeout(gameId, io);

  // Broadcast game start
  io.to(`game:${gameId}`).emit('game:state_update', gameState);

  loggers.game.info('Game started', { gameId });
}

/**
 * Set turn timeout
 */
function setTurnTimeout(
  gameId: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const timeout = setTimeout(() => {
    const gameState = activeGames.get(gameId);
    if (gameState && gameState.status === 'active') {
      // Auto-end turn for current player
      endTurn(gameId, io, gameState.currentPlayer);
    }
  }, 30000); // 30 second timeout for now

  gameTimeouts.set(gameId, timeout);
}

/**
 * Clear game timeout
 */
function clearGameTimeout(gameId: string): void {
  const timeout = gameTimeouts.get(gameId);
  if (timeout) {
    clearTimeout(timeout);
    gameTimeouts.delete(gameId);
  }
}

/**
 * Auto end turn
 */
function endTurn(
  gameId: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  playerId: string
): void {
  const gameState = activeGames.get(gameId);
  if (!gameState) return;

  // Switch to next player
  const nextPlayer = gameState.currentPlayer === gameState.players.player1.id
    ? gameState.players.player2.id
    : gameState.players.player1.id;

  gameState.currentPlayer = nextPlayer;
  gameState.turn++;
  gameState.timeRemaining = gameState.timeLimit;

  // Set new timeout
  setTurnTimeout(gameId, io);

  // Broadcast turn change
  io.to(`game:${gameId}`).emit('game:turn_changed', nextPlayer, gameState.timeRemaining);
  io.to(`game:${gameId}`).emit('game:state_update', gameState);
}

/**
 * End game
 */
function endGame(
  gameId: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  reason: string,
  surrenderingPlayer?: string
): void {
  const gameState = activeGames.get(gameId);
  if (!gameState) return;

  let winner: string;
  let winCondition: string;

  if (reason === 'surrender' && surrenderingPlayer) {
    winner = surrenderingPlayer === gameState.players.player1.id
      ? gameState.players.player2.id
      : gameState.players.player1.id;
    winCondition = 'opponent_surrender';
  } else if (reason === 'player_left') {
    // TODO: Determine winner based on who left
    winner = gameState.players.player1.id;
    winCondition = 'opponent_disconnected';
  } else {
    // TODO: Implement actual win condition checking
    winner = gameState.players.player1.id;
    winCondition = 'quest_completed';
  }

  gameState.gameOver = true;
  gameState.winner = winner;
  gameState.winCondition = winCondition;
  gameState.status = 'completed';

  const result: GameResult = {
    winner,
    loser: winner === gameState.players.player1.id ? gameState.players.player2.id : gameState.players.player1.id,
    winCondition,
    gameEndedAt: new Date(),
    gameDuration: Date.now() - gameState.gameStartedAt.getTime(),
    totalTurns: gameState.turn,
    actions: [] // TODO: Store action history
  };

  // Clear timeout
  clearGameTimeout(gameId);

  // Broadcast game end
  io.to(`game:${gameId}`).emit('game:game_over', result);

  // Clean up game
  setTimeout(() => {
    activeGames.delete(gameId);
  }, 300000); // Keep for 5 minutes for reconnection

  loggers.game.info('Game ended', { gameId, winner, winCondition, reason });
}