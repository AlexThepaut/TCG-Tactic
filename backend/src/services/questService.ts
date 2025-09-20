/**
 * Quest Service
 * Manages victory conditions, quest assignment, progress tracking, and completion detection
 */
import {
  GameState,
  PlayerState,
  GameAction,
  GameActionResult,
  QuestProgress,
  QuestMilestone
} from '../types/gameState';
import { Faction } from '../types/database';
import { logger, loggers } from '../utils/logger';

// Quest definition interface
export interface QuestDefinition {
  id: string;
  faction: Faction;
  name: string;
  description: string;
  category: 'elimination' | 'territory' | 'synergy' | 'survival' | 'resource';
  targetValue: number;
  milestones: number[]; // Progress milestones for partial rewards
  condition: QuestCondition;
  difficultyTier: 1 | 2 | 3; // 1 = easy, 2 = medium, 3 = hard
  isSecret: boolean; // Hidden from opponent
}

// Quest condition function type
export type QuestCondition = (
  gameState: GameState,
  playerState: PlayerState,
  action: GameAction,
  results: GameActionResult[]
) => number; // Returns progress increment

/**
 * Quest Service
 * Handles quest assignment, progress tracking, and victory detection
 */
export class QuestService {
  private static instance: QuestService;
  private questDefinitions: Map<string, QuestDefinition> = new Map();

  private constructor() {
    this.initializeQuestDefinitions();
  }

  static getInstance(): QuestService {
    if (!QuestService.instance) {
      QuestService.instance = new QuestService();
    }
    return QuestService.instance;
  }

  /**
   * Assign a quest to a player based on faction and preferences
   */
  assignQuest(faction: Faction, preference?: string): QuestProgress {
    try {
      const availableQuests = this.getQuestsForFaction(faction);

      let selectedQuest: QuestDefinition;

      // Check if preference is valid and available
      if (preference && this.questDefinitions.has(preference)) {
        const preferredQuest = this.questDefinitions.get(preference)!;
        if (preferredQuest.faction === faction) {
          selectedQuest = preferredQuest;
        } else {
          // Fallback to random if preference doesn't match faction
          selectedQuest = this.selectRandomQuest(availableQuests);
        }
      } else {
        selectedQuest = this.selectRandomQuest(availableQuests);
      }

      const questProgress: QuestProgress = {
        questId: selectedQuest.id,
        currentValue: 0,
        targetValue: selectedQuest.targetValue,
        isCompleted: false,
        milestones: selectedQuest.milestones.map(value => ({
          value,
          description: this.getMilestoneDescription(selectedQuest.id, value)
        }))
      };

      loggers.game.info('Quest assigned', {
        questId: selectedQuest.id,
        faction,
        targetValue: selectedQuest.targetValue,
        preference
      });

      return questProgress;

    } catch (error: any) {
      loggers.game.error('Quest assignment failed', {
        faction,
        preference,
        error: error.message
      });

      // Fallback to a default quest
      return this.createDefaultQuestProgress(faction);
    }
  }

  /**
   * Update quest progress based on game action and results
   */
  updateQuestProgress(
    gameState: GameState,
    playerState: PlayerState,
    action: GameAction,
    results: GameActionResult[]
  ): boolean {
    try {
      if (playerState.questProgress.isCompleted) {
        return false; // Already completed
      }

      const questDefinition = this.questDefinitions.get(playerState.questProgress.questId);
      if (!questDefinition) {
        loggers.game.warn('Quest definition not found', {
          questId: playerState.questProgress.questId
        });
        return false;
      }

      // Calculate progress increment
      const progressIncrement = questDefinition.condition(gameState, playerState, action, results);

      if (progressIncrement > 0) {
        const oldValue = playerState.questProgress.currentValue;
        playerState.questProgress.currentValue = Math.min(
          playerState.questProgress.currentValue + progressIncrement,
          playerState.questProgress.targetValue
        );

        // Check for milestone achievements
        this.checkMilestones(playerState.questProgress, oldValue);

        // Check for quest completion
        if (playerState.questProgress.currentValue >= playerState.questProgress.targetValue) {
          playerState.questProgress.isCompleted = true;
          playerState.questProgress.completedAt = new Date();

          loggers.game.info('Quest completed', {
            questId: playerState.questProgress.questId,
            playerId: playerState.id,
            finalValue: playerState.questProgress.currentValue
          });

          return true; // Quest completed
        }

        loggers.game.debug('Quest progress updated', {
          questId: playerState.questProgress.questId,
          playerId: playerState.id,
          oldValue,
          newValue: playerState.questProgress.currentValue,
          increment: progressIncrement
        });
      }

      return false; // Quest not completed yet

    } catch (error: any) {
      loggers.game.error('Quest progress update failed', {
        questId: playerState.questProgress.questId,
        playerId: playerState.id,
        actionType: action.type,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get quest definition by ID
   */
  getQuestDefinition(questId: string): QuestDefinition | null {
    return this.questDefinitions.get(questId) || null;
  }

  /**
   * Get all quests for a faction
   */
  getQuestsForFaction(faction: Faction): QuestDefinition[] {
    return Array.from(this.questDefinitions.values())
      .filter(quest => quest.faction === faction);
  }

  /**
   * Get quest progress description for UI
   */
  getProgressDescription(questProgress: QuestProgress): string {
    const quest = this.questDefinitions.get(questProgress.questId);
    if (!quest) return 'Unknown quest';

    if (questProgress.isCompleted) {
      return `${quest.name} - COMPLETED!`;
    }

    const percentage = Math.floor((questProgress.currentValue / questProgress.targetValue) * 100);
    return `${quest.name} - ${questProgress.currentValue}/${questProgress.targetValue} (${percentage}%)`;
  }

  /**
   * Check if quest is achievable given current game state
   */
  isQuestAchievable(gameState: GameState, playerState: PlayerState): boolean {
    const quest = this.questDefinitions.get(playerState.questProgress.questId);
    if (!quest || playerState.questProgress.isCompleted) return true;

    // Basic feasibility checks based on quest type
    switch (quest.category) {
      case 'elimination':
        // Check if there are enough opponent units to eliminate
        const opponentState = gameState.players.player1.id === playerState.id
          ? gameState.players.player2
          : gameState.players.player1;
        const remainingTargets = this.countUnitsOnBoard(opponentState) + opponentState.deck.length;
        const requiredTargets = quest.targetValue - playerState.questProgress.currentValue;
        return remainingTargets >= requiredTargets;

      case 'territory':
        // Check if there are enough valid positions
        return true; // Territory quests are generally always achievable

      case 'synergy':
        // Check if player has required cards in deck/hand
        return true; // Synergy quests depend on card availability

      case 'survival':
        // Survival quests are time-based and generally achievable
        return true;

      case 'resource':
        // Resource quests are action-based and generally achievable
        return true;

      default:
        return true;
    }
  }

  // Private helper methods

  private initializeQuestDefinitions(): void {
    // Human quests - Focus on discipline and coordination
    this.addQuestDefinition({
      id: 'tactical_superiority',
      faction: 'humans',
      name: 'Tactical Superiority',
      description: 'Control 15 grid positions simultaneously',
      category: 'territory',
      targetValue: 15,
      milestones: [5, 10],
      difficultyTier: 2,
      isSecret: true,
      condition: this.createTerritoryControlCondition(15)
    });

    this.addQuestDefinition({
      id: 'defensive_mastery',
      faction: 'humans',
      name: 'Defensive Mastery',
      description: 'Prevent 10 attacks through positioning and defense',
      category: 'survival',
      targetValue: 10,
      milestones: [3, 6],
      difficultyTier: 3,
      isSecret: true,
      condition: this.createDefensiveCondition()
    });

    this.addQuestDefinition({
      id: 'coordinated_strike',
      faction: 'humans',
      name: 'Coordinated Strike',
      description: 'Deal 25 damage through coordinated attacks',
      category: 'elimination',
      targetValue: 25,
      milestones: [8, 16],
      difficultyTier: 1,
      isSecret: true,
      condition: this.createDamageCondition()
    });

    // Alien quests - Focus on evolution and adaptation
    this.addQuestDefinition({
      id: 'evolutionary_dominance',
      faction: 'aliens',
      name: 'Evolutionary Dominance',
      description: 'Evolve 8 units through death and rebirth',
      category: 'synergy',
      targetValue: 8,
      milestones: [3, 5],
      difficultyTier: 2,
      isSecret: true,
      condition: this.createEvolutionCondition()
    });

    this.addQuestDefinition({
      id: 'adaptive_survival',
      faction: 'aliens',
      name: 'Adaptive Survival',
      description: 'Survive 12 attacks through adaptation',
      category: 'survival',
      targetValue: 12,
      milestones: [4, 8],
      difficultyTier: 3,
      isSecret: true,
      condition: this.createSurvivalCondition()
    });

    this.addQuestDefinition({
      id: 'swarm_victory',
      faction: 'aliens',
      name: 'Swarm Victory',
      description: 'Summon 20 units to overwhelm the opponent',
      category: 'resource',
      targetValue: 20,
      milestones: [7, 14],
      difficultyTier: 1,
      isSecret: true,
      condition: this.createSummonCondition()
    });

    // Robot quests - Focus on persistence and technology
    this.addQuestDefinition({
      id: 'technological_supremacy',
      faction: 'robots',
      name: 'Technological Supremacy',
      description: 'Deploy 5 high-cost advanced units (7+ cost)',
      category: 'resource',
      targetValue: 5,
      milestones: [2, 3],
      difficultyTier: 3,
      isSecret: true,
      condition: this.createAdvancedUnitCondition()
    });

    this.addQuestDefinition({
      id: 'persistent_advance',
      faction: 'robots',
      name: 'Persistent Advance',
      description: 'Resurrect 10 units through reanimation protocols',
      category: 'synergy',
      targetValue: 10,
      milestones: [3, 6],
      difficultyTier: 2,
      isSecret: true,
      condition: this.createResurrectionCondition()
    });

    this.addQuestDefinition({
      id: 'systematic_elimination',
      faction: 'robots',
      name: 'Systematic Elimination',
      description: 'Eliminate 12 enemy units through precise attacks',
      category: 'elimination',
      targetValue: 12,
      milestones: [4, 8],
      difficultyTier: 1,
      isSecret: true,
      condition: this.createEliminationCondition()
    });

    loggers.game.info('Quest definitions initialized', {
      totalQuests: this.questDefinitions.size,
      byFaction: {
        humans: this.getQuestsForFaction('humans').length,
        aliens: this.getQuestsForFaction('aliens').length,
        robots: this.getQuestsForFaction('robots').length
      }
    });
  }

  private addQuestDefinition(quest: QuestDefinition): void {
    this.questDefinitions.set(quest.id, quest);
  }

  private selectRandomQuest(quests: QuestDefinition[]): QuestDefinition {
    if (quests.length === 0) {
      throw new Error('No quests available for selection');
    }

    // Weight selection by difficulty (favor easier quests slightly)
    const weights = quests.map(quest => {
      switch (quest.difficultyTier) {
        case 1: return 3; // Easy quests more likely
        case 2: return 2; // Medium quests
        case 3: return 1; // Hard quests less likely
        default: return 2;
      }
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < quests.length; i++) {
      random -= weights[i]!;
      if (random <= 0) {
        return quests[i]!;
      }
    }

    // Fallback to last quest
    return quests[quests.length - 1]!;
  }

  private createDefaultQuestProgress(faction: Faction): QuestProgress {
    const defaultQuests = {
      humans: 'coordinated_strike',
      aliens: 'swarm_victory',
      robots: 'systematic_elimination'
    };

    const questId = defaultQuests[faction];
    const quest = this.questDefinitions.get(questId);

    return {
      questId,
      currentValue: 0,
      targetValue: quest?.targetValue || 10,
      isCompleted: false,
      milestones: quest?.milestones.map(value => ({
        value,
        description: this.getMilestoneDescription(questId, value)
      })) || []
    };
  }

  private checkMilestones(questProgress: QuestProgress, oldValue: number): void {
    for (const milestone of questProgress.milestones) {
      if (!milestone.achievedAt && oldValue < milestone.value && questProgress.currentValue >= milestone.value) {
        milestone.achievedAt = new Date();

        loggers.game.info('Quest milestone achieved', {
          questId: questProgress.questId,
          milestone: milestone.value,
          description: milestone.description
        });
      }
    }
  }

  private getMilestoneDescription(questId: string, value: number): string {
    const quest = this.questDefinitions.get(questId);
    if (!quest) return `Reach ${value} progress`;

    switch (quest.category) {
      case 'elimination':
        return `Eliminate ${value} units`;
      case 'territory':
        return `Control ${value} positions`;
      case 'synergy':
        return `Achieve ${value} synergies`;
      case 'survival':
        return `Survive ${value} attacks`;
      case 'resource':
        return `Complete ${value} actions`;
      default:
        return `Reach ${value} progress`;
    }
  }

  private countUnitsOnBoard(playerState: PlayerState): number {
    let count = 0;
    for (const row of playerState.board) {
      for (const cell of row) {
        if (cell) count++;
      }
    }
    return count;
  }

  // Quest condition creators

  private createTerritoryControlCondition(targetPositions: number): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.type === 'place_unit') {
        const currentPositions = this.countUnitsOnBoard(playerState);
        return Math.max(0, currentPositions - playerState.questProgress.currentValue);
      }
      return 0;
    };
  }

  private createDefensiveCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      // Increment when attacks are prevented or when units survive attacks
      if (action.playerId !== playerState.id) {
        // Opponent's action
        const preventedAttacks = results.filter(r =>
          r.type === 'damage_dealt' && r.data?.damage === 0
        ).length;
        return preventedAttacks;
      }
      return 0;
    };
  }

  private createDamageCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId === playerState.id) {
        const totalDamage = results
          .filter(r => r.type === 'damage_dealt')
          .reduce((sum, r) => sum + (r.data?.damage || 0), 0);
        return totalDamage;
      }
      return 0;
    };
  }

  private createEvolutionCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId === playerState.id) {
        // Count units that died and triggered evolution effects
        const evolutionEvents = results.filter(r =>
          r.type === 'effect_applied' && r.data?.effect === 'evolutionary_adaptation'
        ).length;
        return evolutionEvents;
      }
      return 0;
    };
  }

  private createSurvivalCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId !== playerState.id) {
        // Count attacks that our units survived
        const survivedAttacks = results.filter(r =>
          r.type === 'damage_dealt' && r.data?.damage > 0 &&
          !results.some(destroy => destroy.type === 'card_destroyed' && destroy.involvedCards.includes(r.involvedCards[1] || ''))
        ).length;
        return survivedAttacks;
      }
      return 0;
    };
  }

  private createSummonCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId === playerState.id && action.type === 'place_unit') {
        return 1;
      }
      return 0;
    };
  }

  private createAdvancedUnitCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId === playerState.id && action.type === 'place_unit') {
        const placedCard = results.find(r => r.type === 'card_placed');
        if (placedCard) {
          // Check if the placed unit has cost 7 or higher
          const handIndex = (action.data as any).handIndex;
          const card = playerState.hand[handIndex];
          if (card && card.cost >= 7) {
            return 1;
          }
        }
      }
      return 0;
    };
  }

  private createResurrectionCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId === playerState.id) {
        const resurrections = results.filter(r =>
          r.type === 'effect_applied' && r.data?.effect === 'reanimation_protocols'
        ).length;
        return resurrections;
      }
      return 0;
    };
  }

  private createEliminationCondition(): QuestCondition {
    return (gameState: GameState, playerState: PlayerState, action: GameAction, results: GameActionResult[]): number => {
      if (action.playerId === playerState.id) {
        const eliminations = results.filter(r => r.type === 'card_destroyed').length;
        return eliminations;
      }
      return 0;
    };
  }
}

// Export singleton instance
export const questService = QuestService.getInstance();