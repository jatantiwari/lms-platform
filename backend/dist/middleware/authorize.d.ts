import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
/**
 * Authorization middleware factory.
 * Usage: authorize('ADMIN') or authorize('INSTRUCTOR', 'ADMIN')
 */
export declare const authorize: (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorize.d.ts.map