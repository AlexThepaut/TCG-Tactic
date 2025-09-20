/**
 * Factions API Routes
 * RESTful endpoints for faction data and formations
 */
import { Router, Request, Response } from 'express';
import { CardService } from '../services/cardService';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import { ApiResponse, Faction } from '../types/database';
import { z } from 'zod';

const router = Router();

// Validation schemas
const FactionParamSchema = z.object({
  id: z.enum(['humans', 'aliens', 'robots'])
});

const PositionQuerySchema = z.object({
  row: z.coerce.number().min(0).max(2),
  col: z.coerce.number().min(0).max(4)
});

/**
 * GET /api/factions
 * Get all faction data
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const factions = await CardService.getAllFactions();

    const response: ApiResponse<typeof factions> = {
      success: true,
      data: factions,
      timestamp: new Date()
    };

    res.json(response);
  })
);

/**
 * GET /api/factions/:id
 * Get specific faction data
 */
router.get('/:id',
  validateRequest({ params: FactionParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: Faction };

    const faction = await CardService.getFaction(id);

    if (!faction) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Faction not found',
        timestamp: new Date()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof faction> = {
      success: true,
      data: faction,
      timestamp: new Date()
    };

    return res.json(response);
  })
);

/**
 * GET /api/factions/:id/formation
 * Get faction formation pattern
 */
router.get('/:id/formation',
  validateRequest({ params: FactionParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: Faction };

    const formation = CardService.getFormationPattern(id);

    const response: ApiResponse<{ faction: Faction; formation: boolean[][] }> = {
      success: true,
      data: {
        faction: id,
        formation
      },
      timestamp: new Date()
    };

    res.json(response);
  })
);

/**
 * GET /api/factions/:id/formation/validate
 * Validate position for faction formation
 */
router.get('/:id/formation/validate',
  validateRequest({
    params: FactionParamSchema,
    query: PositionQuerySchema
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: Faction };
    const { row, col } = req.query as any;

    const isValid = CardService.isValidPosition(id, row, col);

    const response: ApiResponse<{
      faction: Faction;
      position: { row: number; col: number };
      isValid: boolean;
    }> = {
      success: true,
      data: {
        faction: id,
        position: { row, col },
        isValid
      },
      timestamp: new Date()
    };

    res.json(response);
  })
);

/**
 * GET /api/factions/:id/cards
 * Get all cards for a specific faction
 */
router.get('/:id/cards',
  validateRequest({ params: FactionParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: Faction };

    const cards = await CardService.getCardsByFaction(id);

    const response: ApiResponse<typeof cards> = {
      success: true,
      data: cards,
      timestamp: new Date()
    };

    res.json(response);
  })
);

export default router;