/**
 * Cards API Routes
 * RESTful endpoints for card and faction data
 */
import { Router, Request, Response } from 'express';
import { CardService } from '../services/cardService';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import { ApiResponse, Faction, isValidFaction } from '../types/database';
import { z } from 'zod';

const router = Router();

// Validation schemas
const FactionParamSchema = z.object({
  faction: z.enum(['humans', 'aliens', 'robots'])
});

const CardQuerySchema = z.object({
  faction: z.enum(['humans', 'aliens', 'robots']).optional(),
  type: z.enum(['unit', 'spell']).optional(),
  cost_min: z.coerce.number().min(1).max(10).optional(),
  cost_max: z.coerce.number().min(1).max(10).optional(),
  set_id: z.string().optional(),
  include_inactive: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  offset: z.coerce.number().min(0).optional()
});

const CardIdParamSchema = z.object({
  id: z.string().cuid()
});

/**
 * GET /api/cards
 * Get all active cards with optional filtering
 */
router.get('/',
  validateRequest({ query: CardQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      faction,
      type,
      cost_min,
      cost_max,
      set_id,
      include_inactive,
      limit,
      offset
    } = req.query as any;

    const options: any = {
      faction,
      type,
      setId: set_id,
      includeInactive: include_inactive,
      limit,
      offset
    };

    if (cost_min || cost_max) {
      options.costRange = {
        min: cost_min || 1,
        max: cost_max || 10
      };
    }

    const cards = await CardService.getAllCards(options);

    const response: ApiResponse<typeof cards> = {
      success: true,
      data: cards,
      timestamp: new Date()
    };

    res.json(response);
  })
);

/**
 * GET /api/cards/faction/:faction
 * Get cards by faction
 */
router.get('/faction/:faction',
  validateRequest({ params: FactionParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { faction } = req.params as { faction: Faction };

    const cards = await CardService.getCardsByFaction(faction);

    const response: ApiResponse<typeof cards> = {
      success: true,
      data: cards,
      timestamp: new Date()
    };

    return res.json(response);
  })
);

/**
 * GET /api/cards/stats
 * Get card statistics for balance analysis
 */
router.get('/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await CardService.getCardStatistics();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      timestamp: new Date()
    };

    res.json(response);
  })
);

/**
 * GET /api/cards/abilities
 * Get card abilities reference data
 */
router.get('/abilities',
  asyncHandler(async (req: Request, res: Response) => {
    const abilities = await CardService.getCardAbilities();

    const response: ApiResponse<typeof abilities> = {
      success: true,
      data: abilities,
      timestamp: new Date()
    };

    res.json(response);
  })
);

/**
 * GET /api/cards/:id
 * Get specific card by ID
 */
router.get('/:id',
  validateRequest({ params: CardIdParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Card ID is required',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    const card = await CardService.getCardById(id);

    if (!card) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Card not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof card> = {
      success: true,
      data: card,
      timestamp: new Date()
    };

    return res.json(response);
  })
);

/**
 * POST /api/cards/:id/validate
 * Validate card data (for admin/testing)
 */
router.post('/:id/validate',
  validateRequest({ params: CardIdParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Card ID is required',
        timestamp: new Date()
      };
      return res.status(400).json(response);
    }

    const card = await CardService.getCardById(id);

    if (!card) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Card not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const validation = CardService.validateCard(card);
    const powerLevel = CardService.calculatePowerLevel(card);

    const result = {
      card,
      validation,
      powerLevel
    };

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      timestamp: new Date()
    };

    return res.json(response);
  })
);

export default router;