/**
 * Card Service Tests
 * Unit tests for card management and validation functionality
 */
import { CardService, ValidationResult, PowerLevelResult } from '../../services/cardService';
import { Card, Faction, CardType } from '../../types/database';

// Mock Prisma
jest.mock('../../lib/database', () => ({
  prisma: {
    activeCard: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    factionData: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    cardAbility: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../lib/database';

describe('CardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCards', () => {
    it('should return all active cards by default', async () => {
      const mockCards = [
        {
          id: '1',
          name: 'Test Card',
          faction: 'humans',
          type: 'unit',
          cost: 2,
          attack: 2,
          hp: 3,
          range: 1,
          abilities: [],
          setId: 'test-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.activeCard.findMany as jest.Mock).mockResolvedValue(mockCards);

      const result = await CardService.getAllCards();

      expect(prisma.activeCard.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [
          { faction: 'asc' },
          { cost: 'asc' },
          { name: 'asc' }
        ],
        skip: 0
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Test Card');
    });

    it('should filter by faction when specified', async () => {
      const mockCards = [
        {
          id: '1',
          name: 'Human Card',
          faction: 'humans',
          type: 'unit',
          cost: 2,
          attack: 2,
          hp: 3,
          range: 1,
          abilities: [],
          setId: 'test-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.activeCard.findMany as jest.Mock).mockResolvedValue(mockCards);

      const result = await CardService.getAllCards({ faction: 'humans' });

      expect(prisma.activeCard.findMany).toHaveBeenCalledWith({
        where: { faction: 'humans', isActive: true },
        orderBy: [
          { faction: 'asc' },
          { cost: 'asc' },
          { name: 'asc' }
        ],
        skip: 0
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.faction).toBe('humans');
    });

    it('should filter by cost range when specified', async () => {
      const mockCards: any[] = [];
      (prisma.activeCard.findMany as jest.Mock).mockResolvedValue(mockCards);

      await CardService.getAllCards({ costRange: { min: 2, max: 4 } });

      expect(prisma.activeCard.findMany).toHaveBeenCalledWith({
        where: {
          cost: {
            gte: 2,
            lte: 4
          },
          isActive: true
        },
        orderBy: [
          { faction: 'asc' },
          { cost: 'asc' },
          { name: 'asc' }
        ],
        skip: 0
      });
    });
  });

  describe('getCardById', () => {
    it('should return card when found', async () => {
      const mockCard = {
        id: '1',
        name: 'Test Card',
        faction: 'humans',
        type: 'unit',
        cost: 2,
        attack: 2,
        hp: 3,
        range: 1,
        abilities: [],
        setId: 'test-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.activeCard.findUnique as jest.Mock).mockResolvedValue(mockCard);

      const result = await CardService.getCardById('1');

      expect(prisma.activeCard.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });

      expect(result).toBeTruthy();
      expect(result?.name).toBe('Test Card');
    });

    it('should return null when card not found', async () => {
      (prisma.activeCard.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await CardService.getCardById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('validateCard', () => {
    it('should validate a correct unit card', () => {
      const validCard: Partial<Card> = {
        name: 'Test Unit',
        faction: 'humans',
        type: 'unit',
        cost: 3,
        attack: 2,
        hp: 3,
        range: 1,
        abilities: []
      };

      const result = CardService.validateCard(validCard);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject card with missing required fields', () => {
      const invalidCard: Partial<Card> = {
        name: '',
        cost: 3
      };

      const result = CardService.validateCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Card name is required');
      expect(result.errors).toContain('Faction is required');
      expect(result.errors).toContain('Card type is required');
    });

    it('should reject card with invalid cost', () => {
      const invalidCard: Partial<Card> = {
        name: 'Test Card',
        faction: 'humans',
        type: 'unit',
        cost: 15, // Invalid: over max
        attack: 2,
        hp: 3
      };

      const result = CardService.validateCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost must be between 1 and 10');
    });

    it('should reject unit card without attack/hp', () => {
      const invalidCard: Partial<Card> = {
        name: 'Test Unit',
        faction: 'humans',
        type: 'unit',
        cost: 3
        // Missing attack and hp
      };

      const result = CardService.validateCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Attack is required for unit cards');
      expect(result.errors).toContain('HP is required for unit cards');
    });

    it('should warn about overpowered cards', () => {
      const overpoweredCard: Partial<Card> = {
        name: 'Overpowered Unit',
        faction: 'humans',
        type: 'unit',
        cost: 1, // Very low cost
        attack: 10, // Very high attack
        hp: 10, // Very high hp
        range: 1,
        abilities: []
      };

      const result = CardService.validateCard(overpoweredCard);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Card may be overpowered for its cost');
    });

    it('should handle spell card validation correctly', () => {
      const spellCard: Partial<Card> = {
        name: 'Test Spell',
        faction: 'humans',
        type: 'spell',
        cost: 3,
        abilities: []
      };

      const result = CardService.validateCard(spellCard);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about spell cards with combat stats', () => {
      const spellWithStats: Partial<Card> = {
        name: 'Weird Spell',
        faction: 'humans',
        type: 'spell',
        cost: 3,
        attack: 2, // Spells shouldn't have attack
        hp: 1, // Or HP
        abilities: []
      };

      const result = CardService.validateCard(spellWithStats);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Spell cards should not have attack values');
      expect(result.warnings).toContain('Spell cards should not have HP values');
    });
  });

  describe('calculatePowerLevel', () => {
    it('should calculate power level for unit cards', () => {
      const testCard: Card = {
        id: '1',
        name: 'Test Unit',
        faction: 'humans',
        type: 'unit',
        cost: 3,
        attack: 3,
        hp: 2,
        range: 1,
        abilities: [],
        setId: 'test-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = CardService.calculatePowerLevel(testCard);

      expect(result.powerLevel).toBe(6.5); // (3 * 1.5) + (2 * 1.0) = 4.5 + 2.0 = 6.5
      expect(result.costEfficiency).toBe(2.17); // 6.5 / 3 = 2.166... rounded to 2.17
      expect(result.breakdown.attackValue).toBe(4.5);
      expect(result.breakdown.healthValue).toBe(2);
      expect(result.breakdown.rangeBonus).toBe(0);
    });

    it('should add range bonus for long-range units', () => {
      const longRangeCard: Card = {
        id: '1',
        name: 'Sniper',
        faction: 'humans',
        type: 'unit',
        cost: 3,
        attack: 3,
        hp: 1,
        range: 3, // Long range
        abilities: [],
        setId: 'test-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = CardService.calculatePowerLevel(longRangeCard);

      expect(result.breakdown.rangeBonus).toBe(1); // (3 - 1) * 0.5 = 1
      expect(result.powerLevel).toBe(6.5); // 4.5 + 1 + 1 = 6.5
    });

    it('should add ability bonus', () => {
      const cardWithAbilities: Card = {
        id: '1',
        name: 'Enhanced Unit',
        faction: 'humans',
        type: 'unit',
        cost: 4,
        attack: 3,
        hp: 3,
        range: 1,
        abilities: [
          {
            id: 'test1',
            name: 'Test Ability 1',
            description: 'Test',
            effectType: 'passive',
            parameters: {}
          },
          {
            id: 'test2',
            name: 'Test Ability 2',
            description: 'Test',
            effectType: 'triggered',
            parameters: {}
          }
        ],
        setId: 'test-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = CardService.calculatePowerLevel(cardWithAbilities);

      expect(result.breakdown.abilityBonus).toBe(2); // 2 abilities * 1.0 each
      expect(result.powerLevel).toBe(9.5); // 4.5 + 3 + 0 + 2 = 9.5
    });

    it('should return 0 power level for spell cards', () => {
      const spellCard: Card = {
        id: '1',
        name: 'Test Spell',
        faction: 'humans',
        type: 'spell',
        cost: 3,
        abilities: [],
        setId: 'test-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = CardService.calculatePowerLevel(spellCard);

      expect(result.powerLevel).toBe(0);
      expect(result.breakdown.attackValue).toBe(0);
      expect(result.breakdown.healthValue).toBe(0);
    });
  });

  describe('getFormationPattern', () => {
    it('should return correct formation for humans', () => {
      const formation = CardService.getFormationPattern('humans');

      expect(formation).toEqual([
        [false, true, true, true, false],
        [false, true, true, true, false],
        [false, true, true, true, false]
      ]);
    });

    it('should return correct formation for aliens', () => {
      const formation = CardService.getFormationPattern('aliens');

      expect(formation).toEqual([
        [false, true, true, true, false],
        [true, true, true, true, true],
        [false, false, true, false, false]
      ]);
    });

    it('should return correct formation for robots', () => {
      const formation = CardService.getFormationPattern('robots');

      expect(formation).toEqual([
        [true, true, true, true, true],
        [false, false, true, false, false],
        [false, true, true, true, false]
      ]);
    });
  });

  describe('isValidPosition', () => {
    it('should validate positions correctly for humans', () => {
      expect(CardService.isValidPosition('humans', 0, 1)).toBe(true);
      expect(CardService.isValidPosition('humans', 0, 0)).toBe(false);
      expect(CardService.isValidPosition('humans', 1, 2)).toBe(true);
      expect(CardService.isValidPosition('humans', 1, 4)).toBe(false);
    });

    it('should validate positions correctly for aliens', () => {
      expect(CardService.isValidPosition('aliens', 1, 0)).toBe(true); // Living swarm extends to edges
      expect(CardService.isValidPosition('aliens', 2, 1)).toBe(false);
      expect(CardService.isValidPosition('aliens', 2, 2)).toBe(true);
    });

    it('should validate positions correctly for robots', () => {
      expect(CardService.isValidPosition('robots', 0, 0)).toBe(true); // Immortal army covers full front line
      expect(CardService.isValidPosition('robots', 1, 0)).toBe(false);
      expect(CardService.isValidPosition('robots', 1, 2)).toBe(true);
    });

    it('should return false for out-of-bounds positions', () => {
      expect(CardService.isValidPosition('humans', -1, 0)).toBe(false);
      expect(CardService.isValidPosition('humans', 3, 0)).toBe(false);
      expect(CardService.isValidPosition('humans', 0, -1)).toBe(false);
      expect(CardService.isValidPosition('humans', 0, 5)).toBe(false);
    });
  });
});