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
import { Request, Response, NextFunction } from 'express';
export declare function requireDeviceTrust(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=requireDeviceTrust.d.ts.map