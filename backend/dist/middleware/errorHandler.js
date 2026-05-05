"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Centralised error handling middleware.
 * Converts known error types into structured JSON responses.
 * In production, internal errors never leak stack traces to clients.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Prisma unique constraint violation
        if (err.code === 'P2002') {
            statusCode = 409;
            const fields = err.meta?.target?.join(', ') ?? 'field';
            message = `Duplicate value for ${fields}`;
            isOperational = true;
        }
        else if (err.code === 'P2025') {
            // Record not found
            statusCode = 404;
            message = 'Record not found';
            isOperational = true;
        }
        else {
            message = 'Database error';
            isOperational = false;
        }
    }
    else if (err instanceof SyntaxError && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON in request body';
        isOperational = true;
    }
    else if (err instanceof Error) {
        if (err.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Invalid token';
            isOperational = true;
        }
        else if (err.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Token expired';
            isOperational = true;
        }
    }
    // Log non-operational (unexpected) errors
    if (!isOperational) {
        logger_1.default.error('Unhandled error:', err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_1.env.NODE_ENV === 'development' && err instanceof Error
            ? { stack: err.stack, detail: err.message }
            : {}),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map