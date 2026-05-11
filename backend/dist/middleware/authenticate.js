"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictOptionalAuthenticate = exports.optionalAuthenticate = exports.authenticate = void 0;
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
/**
 * Strict-optional authenticate — like optionalAuthenticate but throws 401 when
 * a token IS present but invalid/expired. This lets clients (mobile, web) trigger
 * their token-refresh flow rather than silently being treated as unauthenticated,
 * which would deny them access to paid content they are enrolled in.
 *
 * Also accepts a JWT via the `?token=` query parameter as a fallback for native
 * video players (e.g. expo-av on mobile) that cannot set custom HTTP headers.
 * The Authorization header is checked first; ?token= is only used when no header
 * is present.
 *
 * Use on routes that are public for genuinely unauthenticated users (no token at all)
 * but require valid auth for users who hold a token (e.g. HLS streaming).
 */
const strictOptionalAuthenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    // Prefer Authorization header; fall back to ?token= query param (for native players)
    const rawToken = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.query.token;
    if (rawToken) {
        try {
            req.user = (0, jwt_1.verifyAccessToken)(rawToken);
        }
        catch {
            throw new AppError_1.UnauthorizedError('Invalid or expired access token');
        }
    }
    next();
};
exports.strictOptionalAuthenticate = strictOptionalAuthenticate;
//# sourceMappingURL=authenticate.js.map