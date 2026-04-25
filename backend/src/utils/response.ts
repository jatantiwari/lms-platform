import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

/**
 * Sends a standardised JSON success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const payload: ApiResponse<T> = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

/**
 * Sends a standardised JSON error response.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
): Response {
  const payload: ApiResponse = { success: false, message };
  return res.status(statusCode).json(payload);
}

/**
 * Builds pagination meta from current page, limit, and total count.
 */
export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}
