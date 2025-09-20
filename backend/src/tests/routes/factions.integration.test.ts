/**
 * Factions API Integration Tests
 * Test faction API endpoints with real database
 */
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/database';

describe('Factions API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/factions', () => {
    it('should return list of all factions', async () => {
      const response = await request(app)
        .get('/api/factions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.timestamp).toBeDefined();

      // Should have exactly 3 factions
      expect(response.body.data).toHaveLength(3);

      // Check that all required factions are present
      const factionIds = response.body.data.map((f: any) => f.id);
      expect(factionIds).toContain('humans');
      expect(factionIds).toContain('aliens');
      expect(factionIds).toContain('robots');

      // Check structure of faction data
      response.body.data.forEach((faction: any) => {
        expect(faction).toHaveProperty('id');
        expect(faction).toHaveProperty('name');
        expect(faction).toHaveProperty('description');
        expect(faction).toHaveProperty('formation');
        expect(faction).toHaveProperty('passiveAbility');
        expect(faction).toHaveProperty('colorTheme');

        // Formation should be a 3x5 grid
        expect(faction.formation).toHaveLength(3);
        faction.formation.forEach((row: boolean[]) => {
          expect(row).toHaveLength(5);
          row.forEach((cell: boolean) => {
            expect(typeof cell).toBe('boolean');
          });
        });

        // Passive ability should have required structure
        expect(faction.passiveAbility).toHaveProperty('id');
        expect(faction.passiveAbility).toHaveProperty('name');
        expect(faction.passiveAbility).toHaveProperty('description');
        expect(faction.passiveAbility).toHaveProperty('effectType');
        expect(faction.passiveAbility).toHaveProperty('parameters');
      });
    });
  });

  describe('GET /api/factions/:id', () => {
    it('should return specific faction data for humans', async () => {
      const response = await request(app)
        .get('/api/factions/humans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('humans');
      expect(response.body.data.name).toBe('Humans');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('formation');
      expect(response.body.data).toHaveProperty('passiveAbility');
      expect(response.body.data).toHaveProperty('colorTheme');

      // Check humans formation (Tactical Phalanx)
      const expectedFormation = [
        [false, true, true, true, false],
        [false, true, true, true, false],
        [false, true, true, true, false]
      ];
      expect(response.body.data.formation).toEqual(expectedFormation);

      // Check passive ability
      expect(response.body.data.passiveAbility.id).toBe('ultimate_rampart');
      expect(response.body.data.passiveAbility.name).toBe('Ultimate Rampart');
    });

    it('should return specific faction data for aliens', async () => {
      const response = await request(app)
        .get('/api/factions/aliens')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('aliens');
      expect(response.body.data.name).toBe('Aliens');

      // Check aliens formation (Living Swarm)
      const expectedFormation = [
        [false, true, true, true, false],
        [true, true, true, true, true],
        [false, false, true, false, false]
      ];
      expect(response.body.data.formation).toEqual(expectedFormation);

      // Check passive ability
      expect(response.body.data.passiveAbility.id).toBe('evolutionary_adaptation');
    });

    it('should return specific faction data for robots', async () => {
      const response = await request(app)
        .get('/api/factions/robots')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('robots');
      expect(response.body.data.name).toBe('Robots');

      // Check robots formation (Immortal Army)
      const expectedFormation = [
        [true, true, true, true, true],
        [false, false, true, false, false],
        [false, true, true, true, false]
      ];
      expect(response.body.data.formation).toEqual(expectedFormation);

      // Check passive ability
      expect(response.body.data.passiveAbility.id).toBe('reanimation_protocols');
    });

    it('should return 400 for invalid faction', async () => {
      const response = await request(app)
        .get('/api/factions/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent valid faction format', async () => {
      const response = await request(app)
        .get('/api/factions/elves')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Faction not found');
    });
  });

  describe('GET /api/factions/:id/formation', () => {
    it('should return formation pattern for humans', async () => {
      const response = await request(app)
        .get('/api/factions/humans/formation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.faction).toBe('humans');
      expect(response.body.data.formation).toEqual([
        [false, true, true, true, false],
        [false, true, true, true, false],
        [false, true, true, true, false]
      ]);
    });

    it('should return formation pattern for aliens', async () => {
      const response = await request(app)
        .get('/api/factions/aliens/formation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.faction).toBe('aliens');
      expect(response.body.data.formation).toEqual([
        [false, true, true, true, false],
        [true, true, true, true, true],
        [false, false, true, false, false]
      ]);
    });

    it('should return formation pattern for robots', async () => {
      const response = await request(app)
        .get('/api/factions/robots/formation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.faction).toBe('robots');
      expect(response.body.data.formation).toEqual([
        [true, true, true, true, true],
        [false, false, true, false, false],
        [false, true, true, true, false]
      ]);
    });

    it('should return 400 for invalid faction', async () => {
      const response = await request(app)
        .get('/api/factions/invalid/formation')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/factions/:id/formation/validate', () => {
    it('should validate valid positions for humans', async () => {
      // Test valid position
      const validResponse = await request(app)
        .get('/api/factions/humans/formation/validate?row=1&col=2')
        .expect(200);

      expect(validResponse.body.success).toBe(true);
      expect(validResponse.body.data.faction).toBe('humans');
      expect(validResponse.body.data.position).toEqual({ row: 1, col: 2 });
      expect(validResponse.body.data.isValid).toBe(true);

      // Test invalid position
      const invalidResponse = await request(app)
        .get('/api/factions/humans/formation/validate?row=0&col=0')
        .expect(200);

      expect(invalidResponse.body.success).toBe(true);
      expect(invalidResponse.body.data.isValid).toBe(false);
    });

    it('should validate positions for aliens correctly', async () => {
      // Test position unique to aliens (edge of middle row)
      const response = await request(app)
        .get('/api/factions/aliens/formation/validate?row=1&col=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);

      // Test invalid position for aliens
      const invalidResponse = await request(app)
        .get('/api/factions/aliens/formation/validate?row=2&col=1')
        .expect(200);

      expect(invalidResponse.body.data.isValid).toBe(false);
    });

    it('should validate positions for robots correctly', async () => {
      // Test position unique to robots (front line edge)
      const response = await request(app)
        .get('/api/factions/robots/formation/validate?row=0&col=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);

      // Test invalid position for robots
      const invalidResponse = await request(app)
        .get('/api/factions/robots/formation/validate?row=1&col=1')
        .expect(200);

      expect(invalidResponse.body.data.isValid).toBe(false);
    });

    it('should return 400 for out-of-bounds positions', async () => {
      const response = await request(app)
        .get('/api/factions/humans/formation/validate?row=5&col=0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing query parameters', async () => {
      const response = await request(app)
        .get('/api/factions/humans/formation/validate')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid faction', async () => {
      const response = await request(app)
        .get('/api/factions/invalid/formation/validate?row=1&col=2')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/factions/:id/cards', () => {
    it('should return cards for humans faction', async () => {
      const response = await request(app)
        .get('/api/factions/humans/cards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All cards should belong to humans faction
      response.body.data.forEach((card: any) => {
        expect(card.faction).toBe('humans');
      });
    });

    it('should return cards for aliens faction', async () => {
      const response = await request(app)
        .get('/api/factions/aliens/cards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All cards should belong to aliens faction
      response.body.data.forEach((card: any) => {
        expect(card.faction).toBe('aliens');
      });
    });

    it('should return cards for robots faction', async () => {
      const response = await request(app)
        .get('/api/factions/robots/cards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All cards should belong to robots faction
      response.body.data.forEach((card: any) => {
        expect(card.faction).toBe('robots');
      });
    });

    it('should return 400 for invalid faction', async () => {
      const response = await request(app)
        .get('/api/factions/invalid/cards')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});