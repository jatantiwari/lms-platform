"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceBindingService = void 0;
/**
 * Device Binding Service
 *
 * Handles registration and validation of device fingerprints.
 * This is the server-side implementation of the Google Pay-style
 * device binding flow.
 *
 * ── Database Design (MongoDB / Prisma) ───────────────────────────────────
 * DeviceBinding documents are stored per user. A user may have multiple
 * registered devices (phone + tablet, for example).
 *
 * Each document stores:
 *   - userId             → owner
 *   - deviceId           → primary identifier (hex, from hardware fingerprint)
 *   - fingerprintHash    → full SHA-256 for comparison
 *   - platform / model   → metadata for admin visibility
 *   - isRooted           → security flag
 *   - isEmulator         → security flag
 *   - lastSeenAt         → for device management UI
 *   - isActive           → user can revoke devices
 *   - sessionTokens[]    → active session tokens bound to this device
 * ────────────────────────────────────────────────────────────────────────
 */
const prisma_1 = __importDefault(require("../config/prisma"));
const deviceBinding_1 = require("../utils/deviceBinding");
const MAX_DEVICES_PER_USER = 3;
exports.deviceBindingService = {
    /**
     * Registers or validates a device for a user.
     *
     * Called on every login from the mobile app.
     * Returns isNewDevice=true when the fingerprint doesn't match any
     * previously registered device for this user.
     */
    async registerOrValidateDevice(userId, payload) {
        const { deviceId, fingerprintHash, isRooted, isEmulator } = payload;
        // ── Policy: block rooted devices (configurable) ──────────────────────
        const blockRooted = process.env.BLOCK_ROOTED_DEVICES === 'true';
        if (blockRooted && isRooted) {
            return {
                isNewDevice: false,
                requiresReverification: false,
                deviceBindingId: '',
                sessionToken: '',
                blocked: true,
                blockReason: 'ROOTED_DEVICE',
            };
        }
        // ── Policy: block emulators in production ────────────────────────────
        const blockEmulators = process.env.BLOCK_EMULATOR_DEVICES === 'true';
        if (blockEmulators && isEmulator) {
            return {
                isNewDevice: false,
                requiresReverification: false,
                deviceBindingId: '',
                sessionToken: '',
                blocked: true,
                blockReason: 'EMULATOR_DETECTED',
            };
        }
        // ── Look for existing device binding ─────────────────────────────────
        const existing = await prisma_1.default.deviceBinding.findFirst({
            where: { userId, deviceId, isActive: true },
        });
        let isNewDevice = false;
        let requiresReverification = false;
        let bindingId;
        if (existing) {
            // Device known — check if fingerprint still matches
            const fingerprintMatches = (0, deviceBinding_1.isFingerprintMatch)(existing.fingerprintHash, fingerprintHash);
            if (!fingerprintMatches) {
                // Fingerprint changed (firmware update, factory reset)
                // Treat as new device — require re-verification
                isNewDevice = true;
                requiresReverification = true;
                await prisma_1.default.deviceBinding.update({
                    where: { id: existing.id },
                    data: {
                        fingerprintHash,
                        buildFingerprint: payload.buildFingerprint,
                        isRooted,
                        isEmulator,
                        lastSeenAt: new Date(),
                        requiresReverification: true,
                    },
                });
            }
            else {
                // Same device — update metadata + lastSeen
                await prisma_1.default.deviceBinding.update({
                    where: { id: existing.id },
                    data: {
                        isRooted,
                        isEmulator,
                        isDeveloperOptionsEnabled: payload.isDeveloperOptionsEnabled,
                        lastSeenAt: new Date(),
                        requiresReverification: false,
                    },
                });
            }
            bindingId = existing.id;
        }
        else {
            // ── New device ────────────────────────────────────────────────────
            isNewDevice = true;
            // Check device limit per user
            const deviceCount = await prisma_1.default.deviceBinding.count({
                where: { userId, isActive: true },
            });
            if (deviceCount >= MAX_DEVICES_PER_USER) {
                // Remove the oldest device to make room
                const oldest = await prisma_1.default.deviceBinding.findFirst({
                    where: { userId, isActive: true },
                    orderBy: { lastSeenAt: 'asc' },
                });
                if (oldest) {
                    await prisma_1.default.deviceBinding.update({
                        where: { id: oldest.id },
                        data: { isActive: false },
                    });
                }
            }
            const newBinding = await prisma_1.default.deviceBinding.create({
                data: {
                    userId,
                    deviceId,
                    fingerprintHash,
                    buildFingerprint: payload.buildFingerprint,
                    model: payload.model,
                    manufacturer: payload.manufacturer,
                    sdkVersion: payload.sdkVersion,
                    osName: payload.osName,
                    osVersion: payload.osVersion,
                    platform: payload.platform,
                    isEmulator,
                    isRooted,
                    isDeveloperOptionsEnabled: payload.isDeveloperOptionsEnabled ?? false,
                    isActive: true,
                    requiresReverification: true,
                    lastSeenAt: new Date(),
                },
            });
            bindingId = newBinding.id;
            requiresReverification = true;
        }
        // Generate a device session token (stored for token-binding validation)
        const sessionToken = (0, deviceBinding_1.generateDeviceSessionToken)(deviceId, userId);
        return {
            isNewDevice,
            requiresReverification,
            deviceBindingId: bindingId,
            sessionToken,
        };
    },
    /**
     * Validates that a request is coming from the expected device.
     * Called on sensitive operations (payment, account change).
     */
    async validateDeviceSession(userId, deviceId) {
        const binding = await prisma_1.default.deviceBinding.findFirst({
            where: { userId, deviceId, isActive: true },
        });
        if (!binding) {
            return { valid: false, reason: 'DEVICE_NOT_REGISTERED' };
        }
        if (binding.requiresReverification) {
            return { valid: false, reason: 'REVERIFICATION_REQUIRED' };
        }
        return { valid: true };
    },
    /**
     * Lists all active devices for a user (for device management screen).
     */
    async getUserDevices(userId) {
        return prisma_1.default.deviceBinding.findMany({
            where: { userId, isActive: true },
            orderBy: { lastSeenAt: 'desc' },
            select: {
                id: true,
                deviceId: true,
                model: true,
                manufacturer: true,
                platform: true,
                osName: true,
                osVersion: true,
                isEmulator: true,
                isRooted: true,
                lastSeenAt: true,
                createdAt: true,
            },
        });
    },
    /**
     * Revokes a device (user-initiated from device management screen).
     */
    async revokeDevice(userId, deviceBindingId) {
        await prisma_1.default.deviceBinding.updateMany({
            where: { id: deviceBindingId, userId },
            data: { isActive: false },
        });
    },
    /**
     * Called after successful phone OTP verification.
     * Clears the requiresReverification flag for the device.
     */
    async markDeviceVerified(userId, deviceId) {
        await prisma_1.default.deviceBinding.updateMany({
            where: { userId, deviceId, isActive: true },
            data: { requiresReverification: false },
        });
    },
};
//# sourceMappingURL=deviceBinding.service.js.map