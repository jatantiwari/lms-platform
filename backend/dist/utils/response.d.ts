import { Response } from 'express';
/**
 * Sends a standardised JSON success response.
 */
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number, meta?: Record<string, unknown>): Response;
/**
 * Sends a standardised JSON error response.
 */
export declare function sendError(res: Response, message: string, statusCode?: number): Response;
/**
 * Builds pagination meta from current page, limit, and total count.
 */
export declare function paginationMeta(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};
//# sourceMappingURL=response.d.ts.map