import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import logger from '../config/logger';

/**
 * Centralised error handling middleware.
 * Converts known error types into structured JSON responses.
 * In production, internal errors never leak stack traces to clients.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 409;
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
      message = `Duplicate value for ${fields}`;
      isOperational = true;
    } else if (err.code === 'P2025') {
      // Record not found
      statusCode = 404;
      message = 'Record not found';
      isOperational = true;
    } else {
      message = 'Database error';
      isOperational = false;
    }
  } else if (err instanceof SyntaxError && 'body' in (err as Record<string, unknown>)) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    isOperational = true;
  } else if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      isOperational = true;
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      isOperational = true;
    }
  }

  // Log non-operational (unexpected) errors
  if (!isOperational) {
    logger.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && err instanceof Error
      ? { stack: err.stack, detail: err.message }
      : {}),
  });
};
