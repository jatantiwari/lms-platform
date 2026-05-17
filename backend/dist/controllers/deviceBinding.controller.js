"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDeviceVerification = exports.revokeDevice = exports.getUserDevices = exports.registerDeviceBinding = void 0;
const deviceBinding_service_1 = require("../services/deviceBinding.service");
const deviceBinding_validation_1 = require("../validations/deviceBinding.validation");
const AppError_1 = require("../utils/AppError");
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
const registerDeviceBinding = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new AppError_1.UnauthorizedError('Not authenticated');
        const parsed = deviceBinding_validation_1.deviceBindingSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError_1.ValidationError(parsed.error.errors[0]?.message ?? 'Invalid payload');
        }
        const result = await deviceBinding_service_1.deviceBindingService.registerOrValidateDevice(userId, parsed.data);
        if (result.blocked) {
            res.status(403).json({
                success: false,
                error: result.blockReason,
                message: result.blockReason === 'ROOTED_DEVICE'
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
    }
    catch (err) {
        next(err);
    }
};
exports.registerDeviceBinding = registerDeviceBinding;
/**
 * GET /auth/devices
 *
 * Returns a list of registered devices for the authenticated user.
 * Used for the "Manage Devices" screen in app settings.
 */
const getUserDevices = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new AppError_1.UnauthorizedError('Not authenticated');
        const devices = await deviceBinding_service_1.deviceBindingService.getUserDevices(userId);
        res.status(200).json({ success: true, data: devices });
    }
    catch (err) {
        next(err);
    }
};
exports.getUserDevices = getUserDevices;
/**
 * DELETE /auth/devices/:deviceBindingId
 *
 * Revokes a device binding (logout from a specific device).
 * Logs the user out of that device by invalidating its device session token.
 */
const revokeDevice = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new AppError_1.UnauthorizedError('Not authenticated');
        const { deviceBindingId } = req.params;
        if (!deviceBindingId || typeof deviceBindingId !== 'string') {
            throw new AppError_1.ValidationError('Missing deviceBindingId');
        }
        await deviceBinding_service_1.deviceBindingService.revokeDevice(userId, deviceBindingId);
        res.status(200).json({ success: true, message: 'Device revoked' });
    }
    catch (err) {
        next(err);
    }
};
exports.revokeDevice = revokeDevice;
/**
 * POST /auth/device-binding/verify
 *
 * Called after successful phone OTP verification to clear requiresReverification.
 * Body: { deviceId: string }
 */
const confirmDeviceVerification = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new AppError_1.UnauthorizedError('Not authenticated');
        const { deviceId } = req.body;
        if (!deviceId || typeof deviceId !== 'string') {
            throw new AppError_1.ValidationError('Missing deviceId');
        }
        await deviceBinding_service_1.deviceBindingService.markDeviceVerified(userId, deviceId);
        res.status(200).json({ success: true, message: 'Device verified' });
    }
    catch (err) {
        next(err);
    }
};
exports.confirmDeviceVerification = confirmDeviceVerification;
//# sourceMappingURL=deviceBinding.controller.js.map