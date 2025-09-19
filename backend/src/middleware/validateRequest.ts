/**
 * Request Validation Middleware
 * Zod-based validation for request body, query, and parameters
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Validation schema interface
interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Creates validation middleware for request validation
 * @param schema - Object containing Zod schemas for body, query, and params
 * @returns Express middleware that validates requests
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      // ZodError will be handled by the error handler middleware
      next(error);
    }
  };
}

// Common validation schemas for reuse
export const commonSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.string().default('1').transform(Number),
    limit: z.string().default('10').transform(Number).refine((val: any) => val <= 100, {
      message: 'Limit cannot exceed 100'
    }),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc')
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().transform(Number).refine((val: any) => val > 0, {
      message: 'ID must be a positive number'
    })
  }),

  // String ID parameter (for UUIDs)
  stringIdParam: z.object({
    id: z.string().min(1, 'ID is required')
  }),

  // Game-specific schemas
  factionParam: z.object({
    faction: z.enum(['humans', 'aliens', 'robots'])
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1).max(100),
    faction: z.enum(['humans', 'aliens', 'robots']).optional(),
    type: z.enum(['unit', 'spell']).optional()
  })
};

// Validation helpers
export const validate = {
  // Quick validation for common patterns
  id: validateRequest({ params: commonSchemas.idParam }),
  stringId: validateRequest({ params: commonSchemas.stringIdParam }),
  pagination: validateRequest({ query: commonSchemas.pagination }),
  faction: validateRequest({ params: commonSchemas.factionParam }),
  search: validateRequest({ query: commonSchemas.searchQuery }),

  // Combine multiple validations
  combine: (...schemas: ValidationSchema[]) => {
    const combined: ValidationSchema = {};

    schemas.forEach(schema => {
      if (schema.body) combined.body = schema.body;
      if (schema.query) combined.query = schema.query;
      if (schema.params) combined.params = schema.params;
    });

    return validateRequest(combined);
  }
};