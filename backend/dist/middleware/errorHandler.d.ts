import { Request, Response, NextFunction } from 'express';
/**
 * Centralised error handling middleware.
 * Converts known error types into structured JSON responses.
 * In production, internal errors never leak stack traces to clients.
 */
export declare const errorHandler: (err: unknown, _req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map