/**
 * Card Service
 * Core service for managing cards, factions, and card validation
 */
import { prisma } from '../lib/database';
import {
  Card,
  Faction,
  CardType,
  FactionData,
  CardAbility,
  ApiResponse,
  CONSTRAINTS,
  FORMATION_PATTERNS,
  isValidFaction,
  isValidCardType
} from '../types/database';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Power level calculation result
export interface PowerLevelResult {
  powerLevel: number;
  costEfficiency: number;
  breakdown: {
    attackValue: number;
    healthValue: number;
    rangeBonus: number;
    abilityBonus: number;
  };
}

// Card query options
export interface CardQueryOptions {
  includeInactive?: boolean;
  faction?: Faction;
  type?: CardType;
  costRange?: { min: number; max: number };
  setId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Card management service
 */
export class CardService {
  /**
   * Get all active cards with optional filtering
   */
  static async getAllCards(options: CardQueryOptions = {}): Promise<Card[]> {
    const {
      includeInactive = false,
      faction,
      type,
      costRange,
      setId,
      limit,
      offset = 0
    } = options;

    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (faction) {
      where.faction = faction;
    }

    if (type) {
      where.type = type;
    }

    if (costRange) {
      where.cost = {
        gte: costRange.min,
        lte: costRange.max
      };
    }

    if (setId) {
      where.setId = setId;
    }

    const findManyOptions: any = {
      where,
      orderBy: [
        { faction: 'asc' },
        { cost: 'asc' },
        { name: 'asc' }
      ],
      skip: offset
    };

    if (limit !== undefined) {
      findManyOptions.take = limit;
    }

    const cards = await prisma.activeCard.findMany(findManyOptions);

    return cards.map(this.transformPrismaCard);
  }

  /**
   * Get cards by faction
   */
  static async getCardsByFaction(faction: Faction): Promise<Card[]> {
    if (!isValidFaction(faction)) {
      throw new Error(`Invalid faction: ${faction}`);
    }

    return this.getAllCards({ faction });
  }

  /**
   * Get card by ID
   */
  static async getCardById(id: string): Promise<Card | null> {
    const card = await prisma.activeCard.findUnique({
      where: { id }
    });

    return card ? this.transformPrismaCard(card) : null;
  }

  /**
   * Get all faction data
   */
  static async getAllFactions(): Promise<FactionData[]> {
    const factions = await prisma.factionData.findMany({
      orderBy: { id: 'asc' }
    });

    return factions.map(faction => ({
      ...faction,
      id: faction.id as Faction,
      formation: faction.formation as boolean[][],
      passiveAbility: faction.passiveAbility as any
    }));
  }

  /**
   * Get specific faction data
   */
  static async getFaction(id: Faction): Promise<FactionData | null> {
    if (!isValidFaction(id)) {
      throw new Error(`Invalid faction ID: ${id}`);
    }

    const faction = await prisma.factionData.findUnique({
      where: { id }
    });

    if (!faction) return null;

    return {
      ...faction,
      id: faction.id as Faction,
      formation: faction.formation as boolean[][],
      passiveAbility: faction.passiveAbility as any
    };
  }

  /**
   * Validate card data
   */
  static validateCard(card: Partial<Card>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!card.name?.trim()) {
      errors.push('Card name is required');
    } else if (card.name.length > CONSTRAINTS.CARD_NAME_MAX_LENGTH) {
      errors.push(`Card name must be ${CONSTRAINTS.CARD_NAME_MAX_LENGTH} characters or less`);
    }

    if (!card.faction) {
      errors.push('Faction is required');
    } else if (!isValidFaction(card.faction)) {
      errors.push(`Invalid faction: ${card.faction}`);
    }

    if (!card.type) {
      errors.push('Card type is required');
    } else if (!isValidCardType(card.type)) {
      errors.push(`Invalid card type: ${card.type}`);
    }

    // Cost validation
    if (card.cost === undefined || card.cost === null) {
      errors.push('Cost is required');
    } else if (card.cost < CONSTRAINTS.MIN_COST || card.cost > CONSTRAINTS.MAX_COST) {
      errors.push(`Cost must be between ${CONSTRAINTS.MIN_COST} and ${CONSTRAINTS.MAX_COST}`);
    }

    // Unit-specific validations
    if (card.type === 'unit') {
      if (card.attack === undefined || card.attack === null) {
        errors.push('Attack is required for unit cards');
      } else if (card.attack < 0 || card.attack > 20) {
        errors.push('Attack must be between 0 and 20');
      }

      if (card.hp === undefined || card.hp === null) {
        errors.push('HP is required for unit cards');
      } else if (card.hp < 1 || card.hp > 20) {
        errors.push('HP must be between 1 and 20');
      }

      if (card.range !== undefined && (card.range < 1 || card.range > 3)) {
        errors.push('Range must be between 1 and 3');
      }

      // Power level warning
      if (card.attack !== undefined && card.hp !== undefined && card.cost !== undefined) {
        const powerLevel = this.calculatePowerLevel(card as Card).powerLevel;
        const expectedPowerLevel = card.cost * 2.5; // Rough balance guideline

        if (powerLevel > expectedPowerLevel * 1.3) {
          warnings.push('Card may be overpowered for its cost');
        } else if (powerLevel < expectedPowerLevel * 0.7) {
          warnings.push('Card may be underpowered for its cost');
        }
      }
    } else if (card.type === 'spell') {
      // Spells shouldn't have combat stats
      if (card.attack !== undefined && card.attack !== null) {
        warnings.push('Spell cards should not have attack values');
      }
      if (card.hp !== undefined && card.hp !== null) {
        warnings.push('Spell cards should not have HP values');
      }
      if (card.range !== undefined && card.range !== null) {
        warnings.push('Spell cards should not have range values');
      }
    }

    // Abilities validation
    if (card.abilities && Array.isArray(card.abilities)) {
      for (const ability of card.abilities) {
        if (!ability.id || !ability.name || !ability.description) {
          errors.push('All abilities must have id, name, and description');
        }
        if (!['passive', 'triggered', 'activated'].includes(ability.effectType)) {
          errors.push(`Invalid ability effect type: ${ability.effectType}`);
        }
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors
    };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  /**
   * Calculate card power level for balance analysis
   */
  static calculatePowerLevel(card: Card): PowerLevelResult {
    let powerLevel = 0;
    const breakdown = {
      attackValue: 0,
      healthValue: 0,
      rangeBonus: 0,
      abilityBonus: 0
    };

    if (card.type === 'unit') {
      // Base combat value
      breakdown.attackValue = (card.attack || 0) * 1.5;
      breakdown.healthValue = (card.hp || 0) * 1.0;

      // Range bonus
      if (card.range && card.range > 1) {
        breakdown.rangeBonus = (card.range - 1) * 0.5;
      }

      powerLevel = breakdown.attackValue + breakdown.healthValue + breakdown.rangeBonus;
    }

    // Ability bonuses (simplified)
    if (card.abilities && Array.isArray(card.abilities)) {
      breakdown.abilityBonus = card.abilities.length * 1.0; // Basic ability value
      powerLevel += breakdown.abilityBonus;
    }

    const costEfficiency = card.cost > 0 ? powerLevel / card.cost : 0;

    return {
      powerLevel: Math.round(powerLevel * 100) / 100,
      costEfficiency: Math.round(costEfficiency * 100) / 100,
      breakdown
    };
  }

  /**
   * Get card statistics for balance analysis
   */
  static async getCardStatistics(): Promise<{
    totalCards: number;
    cardsByFaction: Record<Faction, number>;
    cardsByType: Record<CardType, number>;
    costDistribution: Record<number, number>;
    averagePowerLevel: number;
  }> {
    const cards = await this.getAllCards();

    const statistics = {
      totalCards: cards.length,
      cardsByFaction: {
        humans: 0,
        aliens: 0,
        robots: 0
      } as Record<Faction, number>,
      cardsByType: {
        unit: 0,
        spell: 0
      } as Record<CardType, number>,
      costDistribution: {} as Record<number, number>,
      averagePowerLevel: 0
    };

    let totalPowerLevel = 0;

    for (const card of cards) {
      // Faction count
      statistics.cardsByFaction[card.faction]++;

      // Type count
      statistics.cardsByType[card.type]++;

      // Cost distribution
      statistics.costDistribution[card.cost] = (statistics.costDistribution[card.cost] || 0) + 1;

      // Power level
      totalPowerLevel += this.calculatePowerLevel(card).powerLevel;
    }

    statistics.averagePowerLevel = cards.length > 0 ?
      Math.round((totalPowerLevel / cards.length) * 100) / 100 : 0;

    return statistics;
  }

  /**
   * Transform Prisma card to domain card
   */
  private static transformPrismaCard(prismaCard: any): Card {
    return {
      id: prismaCard.id,
      name: prismaCard.name,
      faction: prismaCard.faction,
      type: prismaCard.type,
      cost: prismaCard.cost,
      attack: prismaCard.attack,
      hp: prismaCard.hp,
      range: prismaCard.range,
      abilities: Array.isArray(prismaCard.abilities) ? prismaCard.abilities : [],
      description: prismaCard.description || undefined,
      flavorText: prismaCard.flavorText || undefined,
      imageUrl: prismaCard.imageUrl || undefined,
      setId: prismaCard.setId,
      isActive: prismaCard.isActive ?? true,
      createdAt: prismaCard.createdAt,
      updatedAt: prismaCard.updatedAt
    };
  }

  /**
   * Get card abilities reference data
   */
  static async getCardAbilities(): Promise<CardAbility[]> {
    const abilities = await prisma.cardAbility.findMany({
      orderBy: { name: 'asc' }
    });

    return abilities.map(ability => ({
      id: ability.id,
      name: ability.name,
      description: ability.description,
      effectType: ability.effectType as 'passive' | 'triggered' | 'activated',
      parameters: ability.parameters as Record<string, any>
    }));
  }

  /**
   * Get formation pattern for faction
   */
  static getFormationPattern(faction: Faction): boolean[][] {
    return FORMATION_PATTERNS[faction];
  }

  /**
   * Check if position is valid for faction
   */
  static isValidPosition(faction: Faction, row: number, col: number): boolean {
    const formation = this.getFormationPattern(faction);

    if (row < 0 || row >= formation.length || col < 0 || col >= (formation[0]?.length ?? 0)) {
      return false;
    }

    return formation[row]?.[col] ?? false;
  }
}

export default CardService;