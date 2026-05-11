import { Request, Response, NextFunction } from 'express';
import { deviceBindingService } from '../services/deviceBinding.service';
import { deviceBindingSchema } from '../validations/deviceBinding.validation';
import { BadRequestError, UnauthorizedError } from '../utils/AppError';

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
export const registerDeviceBinding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('Not authenticated');

    const parsed = deviceBindingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid payload');
    }

    const result = await deviceBindingService.registerOrValidateDevice(userId, parsed.data);

    if (result.blocked) {
      res.status(403).json({
        success: false,
        error: result.blockReason,
        message:
          result.blockReason === 'ROOTED_DEVICE'
            ? 'Access denied: rooted devices are not permitted.'
            : 'Access denied: this device type is not permitted.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      isNewDevice: result.isNewDevice,
      requiresReverification: result.requiresReverification,
      sessionToken: result.sessionToken,
      deviceBindingId: result.deviceBindingId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/devices
 *
 * Returns a list of registered devices for the authenticated user.
 * Used for the "Manage Devices" screen in app settings.
 */
export const getUserDevices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('Not authenticated');

    const devices = await deviceBindingService.getUserDevices(userId);
    res.status(200).json({ success: true, data: devices });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /auth/devices/:deviceBindingId
 *
 * Revokes a device binding (logout from a specific device).
 * Logs the user out of that device by invalidating its device session token.
 */
export const revokeDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('Not authenticated');

    const { deviceBindingId } = req.params;
    if (!deviceBindingId || typeof deviceBindingId !== 'string') {
      throw new BadRequestError('Missing deviceBindingId');
    }

    await deviceBindingService.revokeDevice(userId, deviceBindingId);
    res.status(200).json({ success: true, message: 'Device revoked' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/device-binding/verify
 *
 * Called after successful phone OTP verification to clear requiresReverification.
 * Body: { deviceId: string }
 */
export const confirmDeviceVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('Not authenticated');

    const { deviceId } = req.body;
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestError('Missing deviceId');
    }

    await deviceBindingService.markDeviceVerified(userId, deviceId);
    res.status(200).json({ success: true, message: 'Device verified' });
  } catch (err) {
    next(err);
  }
};
