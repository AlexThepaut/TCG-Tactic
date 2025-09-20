/**
 * Game Event Handlers
 * Integrated with comprehensive game state management services
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

// Import new game state management services
import {
  GameState,
  PlayerState,
  GameConfig,
  PlaceUnitActionData,
  AttackActionData,
  CastSpellActionData,
  GameActionType,
  GAME_CONSTANTS
} from '../../types/gameState';
import { gameStateService } from '../../services/gameStateService';
import { gameValidationService } from '../../services/gameValidationService';
import { gameMechanicsService } from '../../services/gameMechanicsService';
import { questService } from '../../services/questService';

// Game timeout management
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
async function handleGameCreate(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  gameConfig: any, // Legacy type, will convert to new format
  callback: (response: GameResponse) => void
): Promise<void> {
  try {
    const userInfo = getUserInfo(socket);

    if (!socket.userData?.isAuthenticated) {
      return callback({
        success: false,
        error: 'Authentication required to create game'
      });
    }

    // Check if user is already in a game
    if (socket.gameId) {
      return callback({
        success: false,
        error: 'Already in a game. Leave current game first.'
      });
    }

    const userId = parseInt(socket.userData.userId);

    // Convert legacy config to new format
    const newGameConfig: GameConfig = {
      timeLimit: gameConfig.timeLimit || GAME_CONSTANTS.DEFAULT_TIME_LIMIT,
      maxTurns: GAME_CONSTANTS.MAX_TURNS,
      questTimeout: GAME_CONSTANTS.QUEST_TIMEOUT,
      spectatorMode: gameConfig.spectatorMode || false,
      ranked: gameConfig.ranked || false,
      player1Config: {
        userId: userId,
        faction: gameConfig.faction,
        deckId: 1 // TODO: Get from actual deck selection
      },
      player2Config: {
        userId: 0, // Will be set when player 2 joins
        faction: 'humans', // Will be set when player 2 joins
        deckId: 1
      }
    };

    // Create game state using service
    const gameState = await gameStateService.createGameState(newGameConfig);

    // Join socket to game room
    socket.gameId = gameState.id;
    socket.playerId = userId.toString();
    socket.join(`game:${gameState.id}`);
    socket.join(`game:${gameState.id}:players`);

    // Add to game room tracking
    addUserToGameRoom(userId.toString(), gameState.id, true);

    loggers.game.info('Game created successfully', {
      ...userInfo,
      gameId: gameState.id,
      gameConfig: newGameConfig
    });

    // Convert to legacy format for response
    const legacyGameState = convertToLegacyFormat(gameState);

    callback({
      success: true,
      message: 'Game created successfully',
      gameId: gameState.id,
      gameState: legacyGameState as any,
      playerId: userId.toString()
    });

    // Broadcast game creation (for matchmaking service)
    io.emit('game:created' as any, { gameId: gameState.id, creator: userId });

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
async function handleGameJoin(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  gameId: string,
  callback: (response: GameResponse) => void
): Promise<void> {
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

    const gameState = await gameStateService.getGameState(gameId);
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

    const userId = parseInt(socket.userData.userId);

    // Check if game is full (both players assigned)
    if (gameState.player2Id !== 0) {
      return callback({
        success: false,
        error: 'Game is full'
      });
    }

    // Check if user is trying to join their own game
    if (gameState.player1Id === userId) {
      return callback({
        success: false,
        error: 'Cannot join your own game'
      });
    }

    // Update game config for player 2
    const updatedState = await gameStateService.updateGameState(gameId, {
      player2Id: userId,
      players: {
        ...gameState.players,
        player2: {
          ...gameState.players.player2,
          id: userId,
          username: socket.userData.username,
          faction: 'aliens' // TODO: Get from user's deck selection
        }
      }
    }, gameState.version);

    // Join socket to game room
    socket.gameId = gameId;
    socket.playerId = userId.toString();
    socket.join(`game:${gameId}`);
    socket.join(`game:${gameId}:players`);

    // Add to game room tracking
    addUserToGameRoom(userId.toString(), gameId, true);

    // Notify other players
    socket.to(`game:${gameId}`).emit('game:player_joined', convertPlayerToLegacy(updatedState.players.player2));

    loggers.game.info('Player joined game', {
      ...userInfo,
      gameId
    });

    const legacyState = convertToLegacyFormat(updatedState);

    callback({
      success: true,
      message: 'Joined game successfully',
      gameId,
      gameState: legacyState as any,
      playerId: userId.toString()
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
async function handleGameLeave(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): Promise<void> {
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
    const gameState = await gameStateService.getGameState(gameId);
    if (gameState) {
      if (gameState.status === 'active') {
        // End game if it was active
        await gameStateService.updateGameState(gameId, {
          gameOver: true,
          winner: gameState.currentPlayer === parseInt(userId) ?
            (gameState.player1Id === parseInt(userId) ? gameState.player2Id : gameState.player1Id) :
            gameState.currentPlayer,
          winCondition: 'opponent_disconnected',
          status: 'completed'
        });
      } else {
        // Remove game if it was waiting
        await gameStateService.deleteGameState(gameId);
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
async function handleGameReady(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'ready')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    if (!gameState) {
      return callback({
        success: false,
        error: 'Game not found'
      });
    }

    const userId = parseInt(socket.userData?.userId || '0');

    // Update player ready status
    const updatedPlayers = { ...gameState.players };
    if (gameState.player1Id === userId) {
      updatedPlayers.player1.isReady = true;
    } else if (gameState.player2Id === userId) {
      updatedPlayers.player2.isReady = true;
    } else {
      return callback({
        success: false,
        error: 'Player not found in game'
      });
    }

    const updatedState = await gameStateService.updateGameState(socket.gameId, {
      players: updatedPlayers
    }, gameState.version);

    // Check if both players are ready
    if (updatedState.players.player1.isReady && updatedState.players.player2.isReady) {
      // Start the game
      const startedState = await gameStateService.updateGameState(socket.gameId, {
        status: 'active',
        turn: 1,
        phase: 'resources'
      }, updatedState.version);

      // Set turn timeout
      setTurnTimeout(socket.gameId, io);

      // Broadcast game start
      const legacyState = convertToLegacyFormat(startedState);
      io.to(`game:${socket.gameId}`).emit('game:state_update', legacyState as any);
    } else {
      // Broadcast updated ready state
      const legacyState = convertToLegacyFormat(updatedState);
      io.to(`game:${socket.gameId}`).emit('game:state_update', legacyState as any);
    }

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
async function handlePlaceUnit(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: PlaceUnitData,
  callback: (response: GameActionResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'place_unit')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = parseInt(socket.userData?.userId || '0');

    // Create action object
    const actionData: PlaceUnitActionData = {
      cardId: parseInt(data.cardId),
      handIndex: data.handIndex,
      position: { row: data.position.x, col: data.position.y },
      resourceCost: 0 // Will be calculated by validation
    };

    const action: import('../../types/gameState').GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'place_unit',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: actionData,
      isValid: false,
      resourceCost: 0,
      involvedCards: []
    };

    // Validate action
    const validation = gameValidationService.validateAction(gameState, action);
    if (!validation.isValid) {
      return callback({
        success: false,
        error: `Action validation failed: ${validation.errors.map(e => e.message).join(', ')}`
      });
    }

    // Execute action
    const { newState, results } = gameMechanicsService.executeAction(gameState, action);

    // Update game state
    const updatedState = await gameStateService.updateGameState(
      socket.gameId,
      newState,
      gameState.version
    );

    // Convert to legacy format for broadcast
    const legacyState = convertToLegacyFormat(updatedState);

    // Broadcast action to all players
    io.to(`game:${socket.gameId}`).emit('game:action_performed', convertActionToLegacy(action));
    io.to(`game:${socket.gameId}`).emit('game:state_update', legacyState as any);

    callback({
      success: true,
      message: 'Unit placed successfully',
      gameState: legacyState as any,
      action: convertActionToLegacy(action)
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
async function handleAttack(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: AttackData,
  callback: (response: GameActionResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'attack')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = parseInt(socket.userData?.userId || '0');

    // Create attack action
    const actionData: AttackActionData = {
      attackerPosition: { row: data.attackerPosition.x, col: data.attackerPosition.y },
      targetPosition: { row: data.targetPosition.x, col: data.targetPosition.y },
      attackType: 'normal'
    };

    const action: import('../../types/gameState').GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'attack',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: actionData,
      isValid: false,
      resourceCost: 0,
      involvedCards: []
    };

    // Validate action
    const validation = gameValidationService.validateAction(gameState, action);
    if (!validation.isValid) {
      return callback({
        success: false,
        error: `Action validation failed: ${validation.errors.map(e => e.message).join(', ')}`
      });
    }

    // Execute action
    const { newState, results } = gameMechanicsService.executeAction(gameState, action);

    // Update game state
    const updatedState = await gameStateService.updateGameState(
      socket.gameId,
      newState,
      gameState.version
    );

    // Convert to legacy format
    const legacyState = convertToLegacyFormat(updatedState);

    // Broadcast action to all players
    io.to(`game:${socket.gameId}`).emit('game:action_performed', convertActionToLegacy(action));
    io.to(`game:${socket.gameId}`).emit('game:state_update', legacyState as any);

    callback({
      success: true,
      message: 'Attack executed successfully',
      gameState: legacyState as any,
      action: convertActionToLegacy(action)
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
async function handleCastSpell(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: CastSpellData,
  callback: (response: GameActionResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'cast_spell')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = parseInt(socket.userData?.userId || '0');

    // Create spell action
    const actionData: CastSpellActionData = {
      cardId: parseInt(data.cardId),
      handIndex: data.handIndex,
      targets: data.targets ? data.targets.map(t => ({ row: t.x, col: t.y })) : [],
      resourceCost: 0 // Will be calculated by validation
    };

    const action: import('../../types/gameState').GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'cast_spell',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: actionData,
      isValid: false,
      resourceCost: 0,
      involvedCards: []
    };

    // Validate and execute action
    const validation = gameValidationService.validateAction(gameState, action);
    if (!validation.isValid) {
      return callback({
        success: false,
        error: `Action validation failed: ${validation.errors.map(e => e.message).join(', ')}`
      });
    }

    const { newState, results } = gameMechanicsService.executeAction(gameState, action);
    const updatedState = await gameStateService.updateGameState(socket.gameId, newState, gameState.version);

    const legacyState = convertToLegacyFormat(updatedState);
    io.to(`game:${socket.gameId}`).emit('game:action_performed', convertActionToLegacy(action));
    io.to(`game:${socket.gameId}`).emit('game:state_update', legacyState as any);

    callback({
      success: true,
      message: 'Spell cast successfully',
      gameState: legacyState as any,
      action: convertActionToLegacy(action)
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
async function handleEndTurn(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: GameActionResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'end_turn')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = parseInt(socket.userData?.userId || '0');

    // Create end turn action
    const action: import('../../types/gameState').GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'end_turn',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: {
        phase: gameState.phase,
        voluntaryEnd: true
      },
      isValid: false,
      resourceCost: 0,
      involvedCards: []
    };

    // Validate action
    const validation = gameValidationService.validateAction(gameState, action);
    if (!validation.isValid) {
      return callback({
        success: false,
        error: `Action validation failed: ${validation.errors.map(e => e.message).join(', ')}`
      });
    }

    // Execute action
    const { newState, results } = gameMechanicsService.executeAction(gameState, action);

    // Progress to next phase if needed
    const progressedState = gameMechanicsService.progressPhase(newState);

    // Update game state
    const updatedState = await gameStateService.updateGameState(
      socket.gameId,
      progressedState,
      gameState.version
    );

    // Clear any existing turn timeout
    clearGameTimeout(socket.gameId);

    // Set new turn timeout
    setTurnTimeout(socket.gameId, io);

    // Convert to legacy format
    const legacyState = convertToLegacyFormat(updatedState);

    // Broadcast turn change
    io.to(`game:${socket.gameId}`).emit('game:turn_changed', updatedState.currentPlayer.toString(), updatedState.timeRemaining);
    io.to(`game:${socket.gameId}`).emit('game:action_performed', convertActionToLegacy(action));
    io.to(`game:${socket.gameId}`).emit('game:state_update', legacyState as any);

    callback({
      success: true,
      message: 'Turn ended successfully',
      gameState: legacyState as any,
      action: convertActionToLegacy(action)
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
async function handleSurrender(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  callback: (response: BasicResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'surrender')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not in game'
      });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    if (!gameState || gameState.status !== 'active') {
      return callback({
        success: false,
        error: 'Game not active'
      });
    }

    const userId = parseInt(socket.userData?.userId || '0');

    // Create surrender action
    const action: import('../../types/gameState').GameAction = {
      id: uuidv4(),
      playerId: userId,
      type: 'surrender',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: { reason: 'voluntary_surrender' },
      isValid: true,
      resourceCost: 0,
      involvedCards: []
    };

    // Execute surrender
    const { newState } = gameMechanicsService.executeAction(gameState, action);
    const updatedState = await gameStateService.updateGameState(socket.gameId, newState, gameState.version);

    // Broadcast game end
    const legacyState = convertToLegacyFormat(updatedState);
    io.to(`game:${socket.gameId}`).emit('game:game_over', {
      winner: updatedState.winner?.toString() || '',
      loser: userId.toString(),
      winCondition: 'opponent_surrender',
      gameEndedAt: new Date(),
      gameDuration: Date.now() - updatedState.gameStartedAt.getTime(),
      totalTurns: updatedState.turn,
      actions: []
    });

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

// Legacy functions removed - using new service-based architecture

/**
 * Set turn timeout
 */
function setTurnTimeout(
  gameId: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  const timeout = setTimeout(async () => {
    const gameState = await gameStateService.getGameState(gameId);
    if (gameState && gameState.status === 'active') {
      // Auto-end turn for current player
      await autoEndTurn(gameId, io, gameState.currentPlayer);
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
 * Auto end turn (timeout handler)
 */
async function autoEndTurn(
  gameId: string,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  playerId: number
): Promise<void> {
  try {
    const gameState = await gameStateService.getGameState(gameId);
    if (!gameState || gameState.currentPlayer !== playerId) return;

    // Create automatic end turn action
    const action: import('../../types/gameState').GameAction = {
      id: uuidv4(),
      playerId: playerId,
      type: 'end_turn',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      data: { phase: gameState.phase, voluntaryEnd: false },
      isValid: true,
      resourceCost: 0,
      involvedCards: []
    };

    // Execute end turn
    const { newState } = gameMechanicsService.executeAction(gameState, action);
    const progressedState = gameMechanicsService.progressPhase(newState);
    const updatedState = await gameStateService.updateGameState(gameId, progressedState, gameState.version);

    // Set new timeout for next player
    setTurnTimeout(gameId, io);

    // Broadcast turn change
    const legacyState = convertToLegacyFormat(updatedState);
    io.to(`game:${gameId}`).emit('game:turn_changed', updatedState.currentPlayer.toString(), updatedState.timeRemaining);
    io.to(`game:${gameId}`).emit('game:state_update', legacyState as any);

  } catch (error: any) {
    loggers.game.error('Auto end turn failed', { gameId, playerId, error: error.message });
  }
}

// Conversion functions for legacy compatibility

/**
 * Convert new GameState to legacy format for Socket.io compatibility
 */
function convertToLegacyFormat(gameState: GameState): any {
  return {
    id: gameState.id,
    status: gameState.status,
    players: {
      player1: convertPlayerToLegacy(gameState.players.player1),
      player2: convertPlayerToLegacy(gameState.players.player2)
    },
    currentPlayer: gameState.currentPlayer.toString(),
    turn: gameState.turn,
    phase: gameState.phase,
    timeLimit: gameState.timeLimit,
    timeRemaining: gameState.timeRemaining,
    gameStartedAt: gameState.gameStartedAt,
    lastActionAt: gameState.lastActionAt,
    gameOver: gameState.gameOver,
    winner: gameState.winner?.toString(),
    winCondition: gameState.winCondition,
    spectators: gameState.spectators
  };
}

/**
 * Convert PlayerState to legacy format
 */
function convertPlayerToLegacy(playerState: PlayerState): any {
  return {
    id: playerState.id.toString(),
    username: playerState.username,
    faction: playerState.faction,
    hand: playerState.hand,
    board: playerState.board,
    resources: playerState.resources,
    questId: playerState.questId,
    isReady: playerState.isReady,
    lastActionAt: new Date()
  };
}

/**
 * Convert GameAction to legacy format
 */
function convertActionToLegacy(action: import('../../types/gameState').GameAction): any {
  return {
    id: action.id,
    playerId: action.playerId.toString(),
    type: action.type,
    data: action.data,
    timestamp: action.timestamp,
    turn: action.turn,
    phase: action.phase
  };
}