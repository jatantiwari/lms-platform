import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

/**
 * Authorization middleware factory.
 * Usage: authorize('ADMIN') or authorize('INSTRUCTOR', 'ADMIN')
 */
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role as Role)) {
      throw new ForbiddenError(
        `Access denied. Required role(s): ${roles.join(', ')}`,
      );
    }
    next();
  };
