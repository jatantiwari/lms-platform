import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to forward errors to the global error handler,
 * eliminating try/catch boilerplate in every controller.
 */
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
