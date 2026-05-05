import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
type ValidateTarget = 'body' | 'query' | 'params';
/**
 * Middleware factory that validates req[target] against a Zod schema.
 * Replaces the target with the parsed (and coerced) value on success.
 * Returns 400 with structured field errors on failure.
 */
export declare const validate: (schema: ZodSchema, target?: ValidateTarget) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map