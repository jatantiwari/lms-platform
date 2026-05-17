"use strict";
/**
 * requireDeviceTrust middleware
 *
 * Protects course content routes (progress, lecture access, HLS).
 * Must be placed after `authenticate` middleware.
 *
 * Reads X-Device-ID from request headers and validates that the device
 * is currently trusted for this user.
 *
 * On failure returns:
 *   403 { code: 'DEVICE_NOT_TRUSTED', message: '...' }
 *
 * Usage in routes:
 *   router.use(authenticate, requireDeviceTrust);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDeviceTrust = requireDeviceTrust;
const prisma_1 = __importDefault(require("../config/prisma"));
const TRUSTED_DEVICE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache
// Simple in-process cache to avoid DB hit on every lecture request
const trustCache = new Map();
async function requireDeviceTrust(req, res, next) {
    const userId = req.user?.userId;
    const deviceId = req.headers['x-device-id'];
    // If no deviceId header → web client (not mobile) — skip device check for web
    if (!deviceId) {
        next();
        return;
    }
    if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }
    // Check cache first
    const cacheKey = `${userId}:${deviceId}`;
    const cached = trustCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        if (cached.trusted) {
            next();
            return;
        }
        res.status(403).json({
            success: false,
            code: 'DEVICE_NOT_TRUSTED',
            message: 'This device is not verified for course access. Please verify your device first.',
        });
        return;
    }
    try {
        const binding = await prisma_1.default.deviceBinding.findFirst({
            where: { userId, deviceId, isActive: true },
            select: {
                isTrustedForCourseAccess: true,
                requiresReverification: true,
                isActive: true,
            },
        });
        const isTrusted = !!binding &&
            binding.isTrustedForCourseAccess &&
            !binding.requiresReverification &&
            binding.isActive;
        // Cache result
        trustCache.set(cacheKey, { trusted: isTrusted, expiresAt: Date.now() + TRUSTED_DEVICE_CACHE_TTL_MS });
        // Keep cache from growing indefinitely
        if (trustCache.size > 10000) {
            const now = Date.now();
            for (const [key, val] of trustCache) {
                if (val.expiresAt < now)
                    trustCache.delete(key);
            }
        }
        if (!isTrusted) {
            res.status(403).json({
                success: false,
                code: 'DEVICE_NOT_TRUSTED',
                message: 'This device is not verified for course access. Please verify your device first.',
            });
            return;
        }
        // Update lastSeenAt asynchronously — don't block the request
        void prisma_1.default.deviceBinding.updateMany({
            where: { userId, deviceId },
            data: { lastSeenAt: new Date() },
        });
        next();
    }
    catch {
        // On DB error, fail open (log but allow) to avoid outage from gating student content
        // In production consider failing closed for high-security requirements
        next();
    }
}
//# sourceMappingURL=requireDeviceTrust.js.map