"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.paginationMeta = paginationMeta;
/**
 * Sends a standardised JSON success response.
 */
function sendSuccess(res, data, message = 'Success', statusCode = 200, meta) {
    const payload = { success: true, message, data };
    if (meta)
        payload.meta = meta;
    return res.status(statusCode).json(payload);
}
/**
 * Sends a standardised JSON error response.
 */
function sendError(res, message, statusCode = 500) {
    const payload = { success: false, message };
    return res.status(statusCode).json(payload);
}
/**
 * Builds pagination meta from current page, limit, and total count.
 */
function paginationMeta(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
    };
}
//# sourceMappingURL=response.js.map