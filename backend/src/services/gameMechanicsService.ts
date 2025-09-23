/**
 * Game Mechanics Service
 * Core game logic for turn progression, combat, card effects, and faction abilities
 */
import {
  GameState,
  PlayerState,
  BoardCard,
  GameAction,
  GameActionType,
  GameActionResult,
  GameActionResultType,
  GridPosition,
  PlaceUnitActionData,
  AttackActionData,
  CastSpellActionData,
  GAME_CONSTANTS,
  FACTION_FORMATIONS,
  getPlayerState,
  getOpponentState,
  isCurrentPlayer
} from '../types/gameState';
import { Card, Faction } from '../types/database';
import { logger, loggers } from '../utils/logger';

/**
 * Game Mechanics Service
 * Handles core game mechanics and state transitions
 */
export class GameMechanicsService {
  private static instance: GameMechanicsService;

  private constructor() {}

  static getInstance(): GameMechanicsService {
    if (!GameMechanicsService.instance) {
      GameMechanicsService.instance = new GameMechanicsService();
    }
    return GameMechanicsService.instance;
  }

  /**
   * Progress game phase (resources → draw → actions → end turn)
   */
  progressPhase(gameState: GameState): GameState {
    try {
      const newState = { ...gameState };

      switch (gameState.phase) {
        case 'resources':
          return this.handleResourcePhase(newState);
        case 'draw':
          return this.handleDrawPhase(newState);
        case 'actions':
          // Actions phase doesn't auto-progress
          return newState;
        default:
          loggers.game.warn('Unknown game phase', { gameId: gameState.id, phase: gameState.phase });
          return newState;
      }
    } catch (error: any) {
      loggers.game.error('Phase progression failed', {
        gameId: gameState.id,
        phase: gameState.phase,
        error: error.message
      });
      return gameState;
    }
  }

  /**
   * Execute a game action and return updated state with results
   */
  executeAction(gameState: GameState, action: GameAction): { newState: GameState; results: GameActionResult[] } {
    try {
      loggers.game.info('Executing game action', {
        gameId: gameState.id,
        actionId: action.id,
        type: action.actionType,
        playerId: action.playerId
      });

      const newState = { ...gameState };
      let results: GameActionResult[] = [];

      // Add action to history
      newState.actionHistory = [...gameState.actionHistory, action];
      newState.lastActionAt = new Date();

      // Execute action based on type
      switch (action.actionType) {
        case 'place_unit':
          const placeResults = this.executePlaceUnit(newState, action);
          newState.players = placeResults.newState.players;
          results = placeResults.results;
          break;

        case 'attack':
          const attackResults = this.executeAttack(newState, action);
          newState.players = attackResults.newState.players;
          results = attackResults.results;
          break;

        case 'cast_spell':
          const spellResults = this.executeCastSpell(newState, action);
          newState.players = spellResults.newState.players;
          results = spellResults.results;
          break;

        case 'end_turn':
          const endTurnResults = this.executeEndTurn(newState, action);
          Object.assign(newState, endTurnResults.newState);
          results = endTurnResults.results;
          break;

        case 'surrender':
          const surrenderResults = this.executeSurrender(newState, action);
          Object.assign(newState, surrenderResults.newState);
          results = surrenderResults.results;
          break;

        default:
          loggers.game.warn('Unknown action type', { actionType: action.actionType });
          break;
      }

      // Process faction passive abilities
      this.processFactionPassives(newState, action, results);

      // Update quest progress
      this.updateQuestProgress(newState, action, results);

      // Check for win conditions
      this.checkWinConditions(newState);

      loggers.game.debug('Action executed successfully', {
        gameId: gameState.id,
        actionId: action.id,
        resultsCount: results.length
      });

      return { newState, results };

    } catch (error: any) {
      loggers.game.error('Action execution failed', {
        gameId: gameState.id,
        actionId: action.id,
        error: error.message,
        stack: error.stack
      });

      return {
        newState: gameState,
        results: [{
          type: 'game_ended',
          description: `Action execution failed: ${error.message}`,
          involvedCards: [],
          data: { error: error.message }
        }]
      };
    }
  }

  /**
   * Process combat between two units
   */
  processCombat(attacker: BoardCard, target: BoardCard): {
    attackerDamage: number;
    targetDamage: number;
    attackerDestroyed: boolean;
    targetDestroyed: boolean;
  } {
    try {
      // Calculate base damage
      const attackerDamage = attacker.attack || 0;
      const targetDamage = target.attack || 0;

      // Apply damage
      const attackerNewHp = Math.max(0, attacker.currentHp - targetDamage);
      const targetNewHp = Math.max(0, target.currentHp - attackerDamage);

      // Determine if units are destroyed
      const attackerDestroyed = attackerNewHp <= 0;
      const targetDestroyed = targetNewHp <= 0;

      loggers.game.debug('Combat processed', {
        attacker: attacker.name,
        target: target.name,
        attackerDamage,
        targetDamage,
        attackerDestroyed,
        targetDestroyed
      });

      return {
        attackerDamage: targetDamage,
        targetDamage: attackerDamage,
        attackerDestroyed,
        targetDestroyed
      };

    } catch (error: any) {
      loggers.game.error('Combat processing failed', {
        attacker: attacker.name,
        target: target.name,
        error: error.message
      });

      return {
        attackerDamage: 0,
        targetDamage: 0,
        attackerDestroyed: false,
        targetDestroyed: false
      };
    }
  }

  /**
   * Apply card effects
   */
  processCardEffects(gameState: GameState, card: Card, targets: GridPosition[]): GameActionResult[] {
    try {
      const results: GameActionResult[] = [];

      // Process each ability on the card
      for (const ability of card.abilities || []) {
        const effectResults = this.applyCardEffect(gameState, card, ability.id, targets);
        results.push(...effectResults);
      }

      return results;

    } catch (error: any) {
      loggers.game.error('Card effect processing failed', {
        gameId: gameState.id,
        cardId: card.id,
        error: error.message
      });

      return [];
    }
  }

  /**
   * Handle faction passive abilities
   */
  processFactionPassives(gameState: GameState, action: GameAction, actionResults: GameActionResult[]): void {
    try {
      const playerState = getPlayerState(gameState, action.playerId);
      if (!playerState) return;

      const formation = FACTION_FORMATIONS[playerState.faction];
      if (!formation) return;

      // Process each passive effect
      for (const passiveEffect of formation.passiveAbility.effects) {
        if (this.shouldTriggerPassive(passiveEffect.trigger, action, actionResults)) {
          this.applyFactionPassive(gameState, playerState, passiveEffect, action, actionResults);
        }
      }

    } catch (error: any) {
      loggers.game.error('Faction passive processing failed', {
        gameId: gameState.id,
        playerId: action.playerId,
        error: error.message
      });
    }
  }

  // Private helper methods

  private handleResourcePhase(gameState: GameState): GameState {
    const currentPlayerState = getPlayerState(gameState, gameState.currentPlayer);
    if (!currentPlayerState) return gameState;

    // Increase resources
    const newMaxResources = Math.min(
      GAME_CONSTANTS.MAX_RESOURCES,
      Math.floor(gameState.turn / 2) + 1
    );

    currentPlayerState.maxResources = newMaxResources;
    currentPlayerState.resources = newMaxResources;
    currentPlayerState.resourcesSpent = 0;

    // Progress to draw phase
    gameState.phase = 'draw';

    loggers.game.debug('Resource phase processed', {
      gameId: gameState.id,
      playerId: gameState.currentPlayer,
      newResources: newMaxResources
    });

    return gameState;
  }

  private handleDrawPhase(gameState: GameState): GameState {
    const currentPlayerState = getPlayerState(gameState, gameState.currentPlayer);
    if (!currentPlayerState) return gameState;

    // Draw cards if hand is not full and deck has cards
    const cardsToDrawMax = GAME_CONSTANTS.MAX_HAND_SIZE - currentPlayerState.hand.length;
    const cardsAvailable = currentPlayerState.deck.length;
    const cardsToDraw = Math.min(cardsToDrawMax, cardsAvailable, gameState.turn === 1 ? 5 : 1);

    for (let i = 0; i < cardsToDraw; i++) {
      const drawnCard = currentPlayerState.deck.shift();
      if (drawnCard) {
        currentPlayerState.hand.push(drawnCard);
      }
    }

    // Enable player actions
    currentPlayerState.canAct = true;

    // Progress to actions phase
    gameState.phase = 'actions';

    loggers.game.debug('Draw phase processed', {
      gameId: gameState.id,
      playerId: gameState.currentPlayer,
      cardsDrawn: cardsToDraw,
      handSize: currentPlayerState.hand.length
    });

    return gameState;
  }

  private executePlaceUnit(gameState: GameState, action: GameAction): { newState: GameState; results: GameActionResult[] } {
    const data = action.actionData as PlaceUnitActionData;
    const results: GameActionResult[] = [];

    const playerState = getPlayerState(gameState, action.playerId);
    if (!playerState) {
      return { newState: gameState, results };
    }

    // Get card from hand
    const card = playerState.hand[data.handIndex];
    if (!card) {
      return { newState: gameState, results };
    }

    // Remove from hand
    playerState.hand.splice(data.handIndex, 1);

    // Spend resources
    playerState.resourcesSpent += data.resourceCost;

    // Create board card
    const boardCard: BoardCard = {
      ...card,
      position: data.position,
      currentHp: card.hp || 1,
      canAttack: false, // Summoning sickness
      canMove: false,
      hasAttacked: false,
      summonedThisTurn: true,
      effects: [],
      abilities: card.abilities || []
    };

    // Place on board
    if (playerState.board[data.position.row] !== undefined) {
      playerState.board[data.position.row]![data.position.col] = boardCard;
    }

    // Update statistics
    playerState.unitsPlaced++;

    // Create result
    results.push({
      type: 'card_placed',
      description: `${card.name} placed at (${data.position.row}, ${data.position.col})`,
      involvedCards: [card.id.toString()],
      data: { position: data.position, cardId: card.id }
    });

    return { newState: gameState, results };
  }

  private executeAttack(gameState: GameState, action: GameAction): { newState: GameState; results: GameActionResult[] } {
    const data = action.actionData as AttackActionData;
    const results: GameActionResult[] = [];

    const playerState = getPlayerState(gameState, action.playerId);
    const opponentState = getOpponentState(gameState, action.playerId);

    if (!playerState || !opponentState) {
      return { newState: gameState, results };
    }

    // Get attacker and target
    const attacker = playerState.board[data.attackerPosition.row]?.[data.attackerPosition.col];
    const target = opponentState.board[data.targetPosition.row]?.[data.targetPosition.col];

    if (!attacker || !target) {
      return { newState: gameState, results };
    }

    // Process combat
    const combatResult = this.processCombat(attacker, target);

    // Apply damage
    attacker.currentHp -= combatResult.attackerDamage;
    target.currentHp -= combatResult.targetDamage;
    attacker.hasAttacked = true;

    // Update statistics
    playerState.damageDealt += combatResult.targetDamage;

    // Handle destroyed units
    if (combatResult.targetDestroyed && target && opponentState.board[data.targetPosition.row]) {
      opponentState.board[data.targetPosition.row]![data.targetPosition.col] = null;
      opponentState.graveyard.push(target);
      playerState.unitsKilled++;

      results.push({
        type: 'card_destroyed',
        description: `${target.name} destroyed`,
        involvedCards: [target.id.toString()],
        data: { position: data.targetPosition }
      });
    }

    if (combatResult.attackerDestroyed && attacker && playerState.board[data.attackerPosition.row]) {
      playerState.board[data.attackerPosition.row]![data.attackerPosition.col] = null;
      playerState.graveyard.push(attacker);

      results.push({
        type: 'card_destroyed',
        description: `${attacker.name} destroyed`,
        involvedCards: [attacker.id.toString()],
        data: { position: data.attackerPosition }
      });
    }

    // Damage results
    if (combatResult.targetDamage > 0) {
      results.push({
        type: 'damage_dealt',
        description: `${attacker.name} deals ${combatResult.targetDamage} damage to ${target.name}`,
        involvedCards: [attacker.id.toString(), target.id.toString()],
        data: { damage: combatResult.targetDamage }
      });
    }

    if (combatResult.attackerDamage > 0) {
      results.push({
        type: 'damage_dealt',
        description: `${target.name} deals ${combatResult.attackerDamage} damage to ${attacker.name}`,
        involvedCards: [target.id.toString(), attacker.id.toString()],
        data: { damage: combatResult.attackerDamage }
      });
    }

    return { newState: gameState, results };
  }

  private executeCastSpell(gameState: GameState, action: GameAction): { newState: GameState; results: GameActionResult[] } {
    const data = action.actionData as CastSpellActionData;
    const results: GameActionResult[] = [];

    const playerState = getPlayerState(gameState, action.playerId);
    if (!playerState) {
      return { newState: gameState, results };
    }

    // Get spell from hand
    const spell = playerState.hand[data.handIndex];
    if (!spell) {
      return { newState: gameState, results };
    }

    // Remove from hand
    playerState.hand.splice(data.handIndex, 1);

    // Spend resources
    playerState.resourcesSpent += data.resourceCost;

    // Add to graveyard
    playerState.graveyard.push(spell);

    // Update statistics
    playerState.spellsCast++;

    // Process spell effects
    const spellResults = this.processCardEffects(gameState, spell, data.targets);
    results.push(...spellResults);

    return { newState: gameState, results };
  }

  private executeEndTurn(gameState: GameState, action: GameAction): { newState: GameState; results: GameActionResult[] } {
    const results: GameActionResult[] = [];

    // Reset current player's turn state
    const currentPlayerState = getPlayerState(gameState, gameState.currentPlayer);
    if (currentPlayerState) {
      currentPlayerState.canAct = false;
      currentPlayerState.actionsThisTurn = [];

      // Reset unit states
      for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
        if (currentPlayerState.board[row]) {
          for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
            const unit = currentPlayerState.board[row]![col];
            if (unit) {
              unit.canAttack = true;
              unit.hasAttacked = false;
              unit.summonedThisTurn = false;
            }
          }
        }
      }
    }

    // Switch to next player
    const nextPlayerId = gameState.currentPlayer === gameState.player1Id
      ? gameState.player2Id
      : gameState.player1Id;

    gameState.currentPlayer = nextPlayerId;
    gameState.turn++;
    gameState.phase = 'resources';
    gameState.timeRemaining = gameState.timeLimit;

    results.push({
      type: 'turn_ended',
      description: `Turn ended. Player ${nextPlayerId} turn begins.`,
      involvedCards: [],
      data: { newCurrentPlayer: nextPlayerId, turn: gameState.turn }
    });

    return { newState: gameState, results };
  }

  private executeSurrender(gameState: GameState, action: GameAction): { newState: GameState; results: GameActionResult[] } {
    const results: GameActionResult[] = [];

    // Determine winner (opponent of surrendering player)
    const winnerId = gameState.currentPlayer === gameState.player1Id
      ? gameState.player2Id
      : gameState.player1Id;

    gameState.gameOver = true;
    gameState.winner = winnerId;
    gameState.winCondition = 'opponent_surrender';
    gameState.status = 'completed';

    results.push({
      type: 'game_ended',
      description: `Player ${action.playerId} surrendered. Player ${winnerId} wins.`,
      involvedCards: [],
      data: { winnerId, reason: 'surrender' }
    });

    return { newState: gameState, results };
  }

  private applyCardEffect(gameState: GameState, card: Card, effect: string, targets: GridPosition[]): GameActionResult[] {
    const results: GameActionResult[] = [];

    // This is a simplified effect system - in a real implementation,
    // you'd have a more sophisticated effect parsing and execution system
    switch (effect.toLowerCase()) {
      case 'damage':
        // Apply damage to targets
        for (const target of targets) {
          results.push({
            type: 'damage_dealt',
            description: `${card.name} effect deals damage at (${target.row}, ${target.col})`,
            involvedCards: [card.id.toString()],
            data: { position: target, damage: 2 } // Default damage
          });
        }
        break;

      case 'heal':
        // Heal targets
        for (const target of targets) {
          results.push({
            type: 'health_restored',
            description: `${card.name} effect heals unit at (${target.row}, ${target.col})`,
            involvedCards: [card.id.toString()],
            data: { position: target, healing: 2 } // Default healing
          });
        }
        break;

      default:
        loggers.game.debug('Unknown card effect', { effect, cardId: card.id });
        break;
    }

    return results;
  }

  private shouldTriggerPassive(trigger: string, action: GameAction, results: GameActionResult[]): boolean {
    switch (trigger) {
      case 'on_line_complete':
        return results.some(r => r.type === 'card_placed');
      case 'on_unit_death':
        return results.some(r => r.type === 'card_destroyed');
      case 'on_unit_destroyed':
        return results.some(r => r.type === 'card_destroyed');
      case 'turn_start':
        return action.actionType === 'end_turn';
      default:
        return false;
    }
  }

  private applyFactionPassive(
    gameState: GameState,
    playerState: PlayerState,
    passiveEffect: any,
    action: GameAction,
    results: GameActionResult[]
  ): void {
    try {
      switch (playerState.faction) {
        case 'humans':
          this.applyHumanPassive(gameState, playerState, passiveEffect, results);
          break;
        case 'aliens':
          this.applyAlienPassive(gameState, playerState, passiveEffect, results);
          break;
        case 'robots':
          this.applyRobotPassive(gameState, playerState, passiveEffect, results);
          break;
      }
    } catch (error: any) {
      loggers.game.error('Faction passive application failed', {
        faction: playerState.faction,
        error: error.message
      });
    }
  }

  private applyHumanPassive(gameState: GameState, playerState: PlayerState, passiveEffect: any, results: GameActionResult[]): void {
    // Ultimate Rampart: Complete lines get +2 ATK/+1 HP
    const completeLines = this.findCompleteLines(playerState.board);
    if (completeLines.length > 0) {
      for (const line of completeLines) {
        for (const position of line) {
          const unit = playerState.board[position.row]?.[position.col];
          if (unit) {
            unit.attack = (unit.attack || 0) + 2;
            unit.currentHp += 1;
            unit.hp = (unit.hp || 0) + 1;

            results.push({
              type: 'effect_applied',
              description: `${unit.name} gains +2 ATK/+1 HP from Ultimate Rampart`,
              involvedCards: [unit.id.toString()],
              data: { effect: 'ultimate_rampart', position }
            });
          }
        }
      }
    }
  }

  private applyAlienPassive(gameState: GameState, playerState: PlayerState, passiveEffect: any, results: GameActionResult[]): void {
    // Evolutionary Adaptation: Dead aliens reduce next summon cost by 1
    const deadAliens = results.filter(r =>
      r.type === 'card_destroyed' &&
      r.involvedCards.some(cardId => {
        // Check if destroyed card was from this player
        return playerState.graveyard.some(card => card.id.toString() === cardId);
      })
    );

    if (deadAliens.length > 0) {
      // Apply cost reduction to next summons (simplified implementation)
      results.push({
        type: 'effect_applied',
        description: 'Evolutionary Adaptation: Next summon costs reduced by 1',
        involvedCards: [],
        data: { effect: 'evolutionary_adaptation', reduction: deadAliens.length }
      });
    }
  }

  private applyRobotPassive(gameState: GameState, playerState: PlayerState, passiveEffect: any, results: GameActionResult[]): void {
    // Reanimation Protocols: 30% chance to resurrect with 1 HP
    const destroyedRobots = results.filter(r =>
      r.type === 'card_destroyed' &&
      r.involvedCards.some(cardId => {
        return playerState.graveyard.some(card => card.id.toString() === cardId);
      })
    );

    for (const destroyed of destroyedRobots) {
      if (Math.random() < 0.3) { // 30% chance
        const position = destroyed.data?.position;
        if (position) {
          // Find the destroyed robot and resurrect it
          const deadRobot = playerState.graveyard.find(card =>
            destroyed.involvedCards.includes(card.id.toString())
          );

          if (deadRobot) {
            const resurrectedUnit: BoardCard = {
              ...deadRobot,
              position,
              currentHp: 1,
              canAttack: false,
              canMove: false,
              hasAttacked: false,
              summonedThisTurn: true,
              effects: [],
              abilities: deadRobot.abilities || []
            };

            if (playerState.board[position.row]) {
              playerState.board[position.row]![position.col] = resurrectedUnit;
            }
            playerState.graveyard = playerState.graveyard.filter(card => card.id !== deadRobot.id);

            results.push({
              type: 'effect_applied',
              description: `${deadRobot.name} resurrected with 1 HP by Reanimation Protocols`,
              involvedCards: [deadRobot.id.toString()],
              data: { effect: 'reanimation_protocols', position }
            });
          }
        }
      }
    }
  }

  private findCompleteLines(board: (BoardCard | null)[][]): GridPosition[][] {
    const completeLines: GridPosition[][] = [];

    // Check rows
    for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
      const rowPositions: GridPosition[] = [];
      let isComplete = true;

      if (board[row]) {
        for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
          if (board[row]?.[col]) {
            rowPositions.push({ row, col });
          } else {
            isComplete = false;
            break;
          }
        }
      } else {
        isComplete = false;
      }

      if (isComplete && rowPositions.length > 0) {
        completeLines.push(rowPositions);
      }
    }

    // Check columns
    for (let col = 0; col < GAME_CONSTANTS.BOARD_COLS; col++) {
      const colPositions: GridPosition[] = [];
      let isComplete = true;

      for (let row = 0; row < GAME_CONSTANTS.BOARD_ROWS; row++) {
        if (board[row]?.[col]) {
          colPositions.push({ row, col });
        } else {
          isComplete = false;
          break;
        }
      }

      if (isComplete && colPositions.length > 0) {
        completeLines.push(colPositions);
      }
    }

    return completeLines;
  }

  private updateQuestProgress(gameState: GameState, action: GameAction, results: GameActionResult[]): void {
    try {
      const playerState = getPlayerState(gameState, action.playerId);
      if (!playerState || playerState.questProgress.isCompleted) return;

      // Update quest progress based on action and results
      let progressIncrease = 0;

      switch (playerState.questProgress.questId) {
        case 'tactical_superiority':
          // Control grid positions
          if (action.actionType === 'place_unit') {
            progressIncrease = 1;
          }
          break;

        case 'systematic_elimination':
          // Eliminate enemy units
          progressIncrease = results.filter(r => r.type === 'card_destroyed').length;
          break;

        case 'swarm_victory':
          // Summon units
          if (action.actionType === 'place_unit') {
            progressIncrease = 1;
          }
          break;

        default:
          // Other quests implemented similarly
          break;
      }

      if (progressIncrease > 0) {
        playerState.questProgress.currentValue += progressIncrease;

        // Check for completion
        if (playerState.questProgress.currentValue >= playerState.questProgress.targetValue) {
          playerState.questProgress.isCompleted = true;
          playerState.questProgress.completedAt = new Date();

          results.push({
            type: 'quest_progress',
            description: `Quest ${playerState.questProgress.questId} completed!`,
            involvedCards: [],
            data: {
              questId: playerState.questProgress.questId,
              completed: true
            }
          });
        } else {
          results.push({
            type: 'quest_progress',
            description: `Quest progress: ${playerState.questProgress.currentValue}/${playerState.questProgress.targetValue}`,
            involvedCards: [],
            data: {
              questId: playerState.questProgress.questId,
              progress: playerState.questProgress.currentValue,
              target: playerState.questProgress.targetValue
            }
          });
        }
      }
    } catch (error: any) {
      loggers.game.error('Quest progress update failed', {
        gameId: gameState.id,
        playerId: action.playerId,
        error: error.message
      });
    }
  }

  private checkWinConditions(gameState: GameState): void {
    try {
      // Check quest completion
      if (gameState.players.player1.questProgress.isCompleted) {
        gameState.gameOver = true;
        gameState.winner = gameState.player1Id;
        gameState.winCondition = 'quest_completed';
        gameState.status = 'completed';
        return;
      }

      if (gameState.players.player2.questProgress.isCompleted) {
        gameState.gameOver = true;
        gameState.winner = gameState.player2Id;
        gameState.winCondition = 'quest_completed';
        gameState.status = 'completed';
        return;
      }

      // Check deck empty condition
      if (gameState.players.player1.deck.length === 0 && gameState.players.player1.hand.length === 0) {
        gameState.gameOver = true;
        gameState.winner = gameState.player2Id;
        gameState.winCondition = 'deck_empty';
        gameState.status = 'completed';
        return;
      }

      if (gameState.players.player2.deck.length === 0 && gameState.players.player2.hand.length === 0) {
        gameState.gameOver = true;
        gameState.winner = gameState.player1Id;
        gameState.winCondition = 'deck_empty';
        gameState.status = 'completed';
        return;
      }

      // Check turn limit
      if (gameState.turn >= GAME_CONSTANTS.MAX_TURNS) {
        const p1Progress = gameState.players.player1.questProgress.currentValue;
        const p2Progress = gameState.players.player2.questProgress.currentValue;

        gameState.gameOver = true;
        gameState.winCondition = 'timeout';
        gameState.status = 'completed';

        if (p1Progress > p2Progress) {
          gameState.winner = gameState.player1Id;
        } else if (p2Progress > p1Progress) {
          gameState.winner = gameState.player2Id;
        }
        // If tied, winner remains undefined (draw)
      }

    } catch (error: any) {
      loggers.game.error('Win condition check failed', {
        gameId: gameState.id,
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const gameMechanicsService = GameMechanicsService.getInstance();