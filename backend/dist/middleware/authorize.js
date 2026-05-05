"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const AppError_1 = require("../utils/AppError");
/**
 * Authorization middleware factory.
 * Usage: authorize('ADMIN') or authorize('INSTRUCTOR', 'ADMIN')
 */
const authorize = (...roles) => (req, _res, next) => {
    if (!req.user)
        throw new AppError_1.UnauthorizedError();
    if (!roles.includes(req.user.role)) {
        throw new AppError_1.ForbiddenError(`Access denied. Required role(s): ${roles.join(', ')}`);
    }
    next();
};
exports.authorize = authorize;
//# sourceMappingURL=authorize.js.map