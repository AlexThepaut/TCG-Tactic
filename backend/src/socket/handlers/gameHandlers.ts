/**
 * Game Event Handlers - Enhanced for Task 1.3B
 * Integrated with comprehensive game state management services
 *
 * Enhancements:
 * - Performance monitoring for <100ms Socket.io synchronization
 * - Enhanced error handling with Task 1.3B error codes
 * - Real-time state broadcasting optimization
 * - Comprehensive placement validation integration
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
  GamePosition,
  CardSelectedData,
  ValidPositionsResponse
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
import { placementService } from '../../services/placementService';
import { gameStateRepository } from '../../repositories/GameStateRepository';
import { gameActionLogger } from '../../services/GameActionLogger';
import { combatService } from '../../services/combatService';
import {
  PLACEMENT_ERROR_CODES,
  formatErrorForClient,
  createDetailedError
} from '../../utils/errorCodes';
import { performanceMonitor } from '../../utils/performanceMonitor';

// Game timeout management
const gameTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Optimized broadcasting helper functions for Task 1.3B requirements
 */

/**
 * Broadcast message to all players in game room with performance monitoring
 */
async function broadcastToGameRoom(
  io: SocketIOServer,
  gameId: string,
  event: string,
  data: any
): Promise<void> {
  const startTime = performance.now();

  try {
    io.to(`game:${gameId}`).emit(event, data);

    const duration = performance.now() - startTime;
    if (duration > 10) { // Log if broadcast takes >10ms
      loggers.game.warn('Slow game room broadcast', {
        gameId,
        event,
        duration: `${duration.toFixed(2)}ms`
      });
    }
  } catch (error) {
    loggers.game.error('Game room broadcast failed', {
      gameId,
      event,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Broadcast to spectators with optimized delivery
 */
async function broadcastToSpectators(
  io: SocketIOServer,
  gameId: string,
  event: string,
  data: any
): Promise<void> {
  try {
    io.to(`spectator:${gameId}`).emit(event, data);
  } catch (error) {
    loggers.game.debug('Spectator broadcast failed (non-critical)', {
      gameId,
      event,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Convert new GameState format to legacy format for backward compatibility
 */
function convertToLegacyFormat(gameState: GameState): any {
  return {
    id: gameState.id,
    gameId: gameState.gameId,
    player1: gameState.players.player1,
    player2: gameState.players.player2,
    currentPlayer: gameState.currentPlayer,
    turn: gameState.turn,
    phase: gameState.phase,
    gameOver: gameState.gameOver,
    winner: gameState.winner,
    timeRemaining: gameState.timeRemaining
  };
}

/**
 * Convert GameAction to legacy format
 */
function convertActionToLegacy(action: any): any {
  return {
    id: action.id,
    playerId: action.playerId,
    type: action.actionType,
    data: action.actionData,
    timestamp: action.timestamp,
    resourceCost: action.resourceCost
  };
}

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

  // Game actions - Card selection (click-based placement)
  socket.on('game:card_selected', (data, callback) => {
    handleCardSelected(socket, io, data, callback);
  });

  socket.on('game:selection_cleared', () => {
    handleSelectionCleared(socket, io);
  });

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
 * Handle card selection - Click-based placement Step 1
 * Returns valid placement positions for the selected card
 */
async function handleCardSelected(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: CardSelectedData,
  callback: (response: ValidPositionsResponse) => void
): Promise<void> {
  const startTime = performance.now();

  try {
    // Validate game permission
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'place_unit')) {
      return callback({
        success: false,
        error: 'Invalid game permission or not your turn'
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

    // Get player state
    const isPlayer1 = gameState.player1Id === userId;
    const playerState = isPlayer1 ? gameState.players.player1 : gameState.players.player2;

    // Validate card exists in hand
    if (data.handIndex < 0 || data.handIndex >= playerState.hand.length) {
      return callback({
        success: false,
        error: 'Invalid card index'
      });
    }

    const selectedCard = playerState.hand[data.handIndex];
    if (!selectedCard || selectedCard.id.toString() !== data.cardId) {
      return callback({
        success: false,
        error: 'Card not found in hand'
      });
    }

    // Validate player has sufficient resources
    if (selectedCard.cost > playerState.resources) {
      return callback({
        success: false,
        error: `Insufficient resources. Need ${selectedCard.cost}, have ${playerState.resources}`
      });
    }

    // Get valid placement positions based on faction formation
    const factionPositions = placementService.getValidPositions(playerState.faction);

    // Filter out occupied positions on player's board
    const board = isPlayer1 ? gameState.players.player1.board : gameState.players.player2.board;
    const availablePositions = factionPositions.filter(pos => {
      // Check if position is not occupied
      const row = board[pos.row];
      return !row || !row[pos.col];
    });

    if (availablePositions.length === 0) {
      return callback({
        success: false,
        error: 'No valid placement positions available'
      });
    }

    // Convert positions to Socket format
    const validPositions: GamePosition[] = availablePositions.map((pos) => ({
      x: pos.row,
      y: pos.col
    }));

    const duration = performance.now() - startTime;

    loggers.game.info('Card selection validated', {
      gameId: socket.gameId,
      userId,
      cardId: data.cardId,
      cardName: selectedCard.name,
      validPositionCount: validPositions.length,
      duration: `${duration.toFixed(2)}ms`
    });

    // Emit valid positions event to client
    socket.emit('game:valid_positions', {
      success: true,
      validPositions,
      cardId: data.cardId
    });

    callback({
      success: true,
      validPositions,
      cardId: data.cardId
    });

  } catch (error: any) {
    loggers.game.error('Card selection handler failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      data,
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to process card selection due to server error'
    });
  }
}

/**
 * Handle selection cleared - Click-based placement cancellation
 */
async function handleSelectionCleared(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): Promise<void> {
  try {
    const userInfo = getUserInfo(socket);

    loggers.game.debug('Card selection cleared', {
      ...userInfo,
      gameId: socket.gameId
    });

    // No server-side state to clear for selection
    // This is mainly for logging and potential future state management
  } catch (error: any) {
    loggers.game.debug('Selection cleared handler error (non-critical)', {
      socketId: socket.id,
      error: error.message
    });
  }
}

/**
 * Handle unit placement - Enhanced for Task 1.3B
 * Performance requirement: <100ms for Socket.io synchronization
 */
async function handlePlaceUnit(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: PlaceUnitData,
  callback: (response: GameActionResponse) => void
): Promise<void> {
  const startTime = performance.now();

  try {
    // Enhanced permission and game validation
    if (!socket.gameId || !validateGamePermission(socket, socket.gameId, 'place_unit')) {
      const error = createDetailedError('not_your_turn', {
        socketId: socket.id,
        gameId: socket.gameId
      });
      return callback(formatErrorForClient(error));
    }

    const userId = parseInt(socket.userData?.userId || '0');
    const position = { row: data.position.x, col: data.position.y };

    loggers.game.info('Processing unit placement request', {
      gameId: socket.gameId,
      userId,
      cardId: data.cardId,
      position,
      handIndex: data.handIndex
    });

    // Use enhanced PlacementService with performance monitoring
    const placementResult = await performanceMonitor.monitorSocketOperation(
      () => placementService.executePlacement(
        socket.gameId!,
        userId,
        data.cardId,
        position
      ),
      'placement_execution'
    );

    if (!placementResult.success) {
      loggers.game.warn('Unit placement failed', {
        gameId: socket.gameId,
        userId,
        cardId: data.cardId,
        position,
        error: placementResult.error,
        errorCode: placementResult.errorCode
      });

      // Return standardized error response per Task 1.3B
      return callback({
        success: false,
        error: placementResult.error || 'Unit placement failed'
      });
    }

    // Optimized real-time state broadcasting with performance monitoring
    await performanceMonitor.monitorSocketOperation(
      async () => {
        // Convert to legacy format for backward compatibility
        const legacyState = convertToLegacyFormat(placementResult.gameState!);
        const legacyAction = placementResult.action ? convertActionToLegacy(placementResult.action) : null;

        // Broadcast updates to all players in game room (Task 1.3B requirement)
        await Promise.all([
          // Broadcast action performed
          broadcastToGameRoom(io, socket.gameId!, 'game:action_performed', legacyAction),
          // Broadcast state update
          broadcastToGameRoom(io, socket.gameId!, 'game:state_update', legacyState),
          // Broadcast to spectators if any
          broadcastToSpectators(io, socket.gameId!, 'game:placement_result', {
            success: true,
            action: legacyAction
          })
        ]);

        return legacyState;
      },
      'state_broadcast'
    );

    // Send detailed response to placing player
    const duration = performance.now() - startTime;
    callback({
      success: true,
      message: 'Unit placed successfully',
      gameState: convertToLegacyFormat(placementResult.gameState!) as any,
      action: placementResult.action ? convertActionToLegacy(placementResult.action) : null
    });

    loggers.game.info('Unit placement completed successfully', {
      gameId: socket.gameId,
      userId,
      cardId: data.cardId,
      position,
      resourceCost: placementResult.action?.resourceCost || 0,
      duration: `${duration.toFixed(2)}ms`
    });

  } catch (error: any) {
    loggers.game.error('Unit placement handler failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      data,
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to place unit due to server error'
    });
  }
}

/**
 * Handle attack action - Enhanced with Task 1.3D Combat Logic Engine
 * Performance requirement: <100ms for Socket.io synchronization
 */
async function handleAttack(
  socket: AuthenticatedSocket,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: AttackData,
  callback: (response: GameActionResponse) => void
): Promise<void> {
  const startTime = performance.now();

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
    const attackerPos = { row: data.attackerPosition.x, col: data.attackerPosition.y };
    const targetPos = { row: data.targetPosition.x, col: data.targetPosition.y };

    loggers.game.info('Processing attack request', {
      gameId: socket.gameId,
      userId,
      attackerPos,
      targetPos
    });

    // Enhanced attack validation using CombatService
    const validation = combatService.validateAttack(
      gameState,
      userId,
      attackerPos,
      targetPos
    );

    if (!validation.isValid) {
      loggers.game.warn('Attack validation failed', {
        gameId: socket.gameId,
        userId,
        attackerPos,
        targetPos,
        errors: validation.errors.map(e => e.message)
      });

      return callback({
        success: false,
        error: `Attack failed: ${validation.errors.map(e => e.message).join(', ')}`
      });
    }

    // Execute enhanced combat logic
    const combatResult = await performanceMonitor.monitorSocketOperation(
      () => combatService.executeAttack(gameState, userId, attackerPos, targetPos),
      'combat_execution'
    );

    if (!combatResult.success) {
      return callback({
        success: false,
        error: 'Combat execution failed'
      });
    }

    // Update game state with combat results
    const updatedState = await gameStateService.updateGameState(
      socket.gameId,
      gameState,
      gameState.version
    );

    // Optimized real-time broadcasting with detailed combat events
    await performanceMonitor.monitorSocketOperation(
      async () => {
        const legacyState = convertToLegacyFormat(updatedState);

        // Prepare detailed combat event data
        const combatEventData = {
          attackerId: userId,
          attacker: {
            name: combatResult.attacker.unit.name,
            position: combatResult.attacker.position,
            damage: combatResult.attacker.damage,
            destroyed: combatResult.attacker.destroyed,
            newHealth: combatResult.attacker.newHealth
          },
          target: {
            name: combatResult.target.unit.name,
            position: combatResult.target.position,
            damage: combatResult.target.damage,
            destroyed: combatResult.target.destroyed,
            newHealth: combatResult.target.newHealth
          },
          factionEffects: combatResult.factionEffects,
          questProgress: combatResult.questProgress
        };

        // Broadcast combat events to all players in game room
        await Promise.all([
          // Broadcast detailed combat result
          broadcastToGameRoom(io, socket.gameId!, 'game:combat_result', combatEventData),
          // Broadcast state update
          broadcastToGameRoom(io, socket.gameId!, 'game:state_update', legacyState),
          // Broadcast to spectators
          broadcastToSpectators(io, socket.gameId!, 'game:combat_spectator', combatEventData)
        ]);

        return legacyState;
      },
      'combat_broadcast'
    );

    // Create legacy action for backward compatibility
    const action = {
      id: uuidv4(),
      playerId: userId.toString(),
      type: 'attack' as const,
      data: {
        attackerPosition: data.attackerPosition,
        targetPosition: data.targetPosition
      },
      timestamp: new Date(),
      turn: gameState.turn,
      phase: gameState.phase,
      resourceCost: 0
    };

    const duration = performance.now() - startTime;
    callback({
      success: true,
      message: 'Attack executed successfully',
      gameState: convertToLegacyFormat(updatedState) as any,
      action: action,
      validMoves: [] // Could include valid attack targets for next action
    });

    loggers.game.info('Combat completed successfully', {
      gameId: socket.gameId,
      userId,
      attackerName: combatResult.attacker.unit.name,
      targetName: combatResult.target.unit.name,
      attackerDamage: combatResult.attacker.damage,
      targetDamage: combatResult.target.damage,
      factionEffects: combatResult.factionEffects.length,
      duration: `${duration.toFixed(2)}ms`
    });

  } catch (error: any) {
    loggers.game.error('Attack handler failed', {
      socketId: socket.id,
      userId: socket.userData?.userId || 'unknown',
      gameId: socket.gameId,
      data,
      error: error.message,
      stack: error.stack
    });

    callback({
      success: false,
      error: 'Failed to execute attack due to server error'
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
      gameId: parseInt(socket.gameId!),
      playerId: userId,
      actionType: 'cast_spell',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      actionData: actionData,
      isValid: false,
      resourceCost: 0
    };

    // Validate and execute action
    const validation = gameValidationService.validateAction(gameState, action);
    if (!validation.isValid) {
      return callback({
        success: false,
        error: `Action validation failed: ${validation.errors.map(e => e.message).join(', ')}`
      });
    }

    const { newState, results } = await gameMechanicsService.executeAction(gameState, action);
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
      gameId: parseInt(socket.gameId!),
      playerId: userId,
      actionType: 'end_turn',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      actionData: {
        phase: gameState.phase,
        voluntaryEnd: true
      },
      isValid: false,
      resourceCost: 0
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
    const { newState, results } = await gameMechanicsService.executeAction(gameState, action);

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
      gameId: parseInt(socket.gameId!),
      playerId: userId,
      actionType: 'surrender',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      actionData: { reason: 'voluntary_surrender' },
      isValid: true,
      resourceCost: 0
    };

    // Execute surrender
    const { newState } = await gameMechanicsService.executeAction(gameState, action);
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
      gameId: parseInt(gameId),
      playerId: playerId,
      actionType: 'end_turn',
      turn: gameState.turn,
      phase: gameState.phase,
      timestamp: new Date(),
      actionData: { phase: gameState.phase, voluntaryEnd: false },
      isValid: true,
      resourceCost: 0
    };

    // Execute end turn
    const { newState } = await gameMechanicsService.executeAction(gameState, action);
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

