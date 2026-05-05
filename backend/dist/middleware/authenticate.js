"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const AppError_1 = require("../utils/AppError");
/**
 * Verifies the Bearer access token from the Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError_1.UnauthorizedError('No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = (0, jwt_1.verifyAccessToken)(token);
        next();
    }
    catch {
        throw new AppError_1.UnauthorizedError('Invalid or expired access token');
    }
};
exports.authenticate = authenticate;
/**
 * Optional authenticate — attaches user if token is present but does not
 * block requests without a token (used for public routes that have auth-aware logic).
 */
const optionalAuthenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = (0, jwt_1.verifyAccessToken)(token);
        }
        catch {
            // Silently ignore invalid tokens on optional routes
        }
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=authenticate.js.map