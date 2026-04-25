import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory that validates req[target] against a Zod schema.
 * Replaces the target with the parsed (and coerced) value on success.
 * Returns 400 with structured field errors on failure.
 */
export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace with parsed value so downstream code gets coerced types
    (req as Record<string, unknown>)[target] = result.data;
    next();
  };
