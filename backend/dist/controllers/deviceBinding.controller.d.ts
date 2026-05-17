import { Request, Response, NextFunction } from 'express';
/**
 * POST /auth/device-binding
 *
 * Registers or validates the calling device for the authenticated user.
 * Call this on every login after token is obtained.
 *
 * Body: DeviceBindingInput (see deviceBinding.validation.ts)
 *
 * Response:
 *   200 { success, isNewDevice, requiresReverification, sessionToken, deviceBindingId }
 */
export declare const registerDeviceBinding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /auth/devices
 *
 * Returns a list of registered devices for the authenticated user.
 * Used for the "Manage Devices" screen in app settings.
 */
export declare const getUserDevices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /auth/devices/:deviceBindingId
 *
 * Revokes a device binding (logout from a specific device).
 * Logs the user out of that device by invalidating its device session token.
 */
export declare const revokeDevice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /auth/device-binding/verify
 *
 * Called after successful phone OTP verification to clear requiresReverification.
 * Body: { deviceId: string }
 */
export declare const confirmDeviceVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=deviceBinding.controller.d.ts.map