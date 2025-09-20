/**
 * Cards API Integration Tests
 * Test card and faction API endpoints with real database
 */
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/database';

describe('Cards API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/cards', () => {
    it('should return list of cards', async () => {
      const response = await request(app)
        .get('/api/cards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should filter cards by faction', async () => {
      const response = await request(app)
        .get('/api/cards?faction=humans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All returned cards should be humans
      response.body.data.forEach((card: any) => {
        expect(card.faction).toBe('humans');
      });
    });

    it('should filter cards by type', async () => {
      const response = await request(app)
        .get('/api/cards?type=unit')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All returned cards should be units
      response.body.data.forEach((card: any) => {
        expect(card.type).toBe('unit');
      });
    });

    it('should filter cards by cost range', async () => {
      const response = await request(app)
        .get('/api/cards?cost_min=2&cost_max=4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All returned cards should have cost between 2 and 4
      response.body.data.forEach((card: any) => {
        expect(card.cost).toBeGreaterThanOrEqual(2);
        expect(card.cost).toBeLessThanOrEqual(4);
      });
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/cards?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 for invalid faction', async () => {
      const response = await request(app)
        .get('/api/cards?faction=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid cost range', async () => {
      const response = await request(app)
        .get('/api/cards?cost_min=15')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/cards/faction/:faction', () => {
    it('should return cards for valid faction', async () => {
      const response = await request(app)
        .get('/api/cards/faction/humans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All cards should be humans
      response.body.data.forEach((card: any) => {
        expect(card.faction).toBe('humans');
      });
    });

    it('should return 400 for invalid faction', async () => {
      const response = await request(app)
        .get('/api/cards/faction/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/cards/stats', () => {
    it('should return card statistics', async () => {
      const response = await request(app)
        .get('/api/cards/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCards');
      expect(response.body.data).toHaveProperty('cardsByFaction');
      expect(response.body.data).toHaveProperty('cardsByType');
      expect(response.body.data).toHaveProperty('costDistribution');
      expect(response.body.data).toHaveProperty('averagePowerLevel');

      // Check structure of nested objects
      expect(response.body.data.cardsByFaction).toHaveProperty('humans');
      expect(response.body.data.cardsByFaction).toHaveProperty('aliens');
      expect(response.body.data.cardsByFaction).toHaveProperty('robots');

      expect(response.body.data.cardsByType).toHaveProperty('unit');
      expect(response.body.data.cardsByType).toHaveProperty('spell');
    });
  });

  describe('GET /api/cards/abilities', () => {
    it('should return card abilities reference', async () => {
      const response = await request(app)
        .get('/api/cards/abilities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // Check structure of abilities
      if (response.body.data.length > 0) {
        const ability = response.body.data[0];
        expect(ability).toHaveProperty('id');
        expect(ability).toHaveProperty('name');
        expect(ability).toHaveProperty('description');
        expect(ability).toHaveProperty('effectType');
        expect(ability).toHaveProperty('parameters');
      }
    });
  });

  describe('GET /api/cards/:id', () => {
    let testCardId: string;

    beforeAll(async () => {
      // Get a test card ID from the database
      const cards = await request(app).get('/api/cards?limit=1');
      if (cards.body.data.length > 0) {
        testCardId = cards.body.data[0].id;
      }
    });

    it('should return specific card when found', async () => {
      if (!testCardId) {
        console.log('No test cards available, skipping card-specific tests');
        return;
      }

      const response = await request(app)
        .get(`/api/cards/${testCardId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('faction');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('cost');
      expect(response.body.data.id).toBe(testCardId);
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .get('/api/cards/cm0000000000000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Card not found');
    });

    it('should return 400 for invalid card ID format', async () => {
      const response = await request(app)
        .get('/api/cards/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/cards/:id/validate', () => {
    let testCardId: string;

    beforeAll(async () => {
      // Get a test card ID from the database
      const cards = await request(app).get('/api/cards?limit=1');
      if (cards.body.data.length > 0) {
        testCardId = cards.body.data[0].id;
      }
    });

    it('should validate existing card', async () => {
      if (!testCardId) {
        console.log('No test cards available, skipping validation tests');
        return;
      }

      const response = await request(app)
        .post(`/api/cards/${testCardId}/validate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('card');
      expect(response.body.data).toHaveProperty('validation');
      expect(response.body.data).toHaveProperty('powerLevel');

      // Check validation structure
      expect(response.body.data.validation).toHaveProperty('isValid');
      expect(response.body.data.validation).toHaveProperty('errors');

      // Check power level structure
      expect(response.body.data.powerLevel).toHaveProperty('powerLevel');
      expect(response.body.data.powerLevel).toHaveProperty('costEfficiency');
      expect(response.body.data.powerLevel).toHaveProperty('breakdown');
    });

    it('should return 404 for non-existent card validation', async () => {
      const response = await request(app)
        .post('/api/cards/cm0000000000000000000000/validate')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Card not found');
    });
  });
});