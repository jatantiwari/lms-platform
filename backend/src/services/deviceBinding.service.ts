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
import prisma from '../config/prisma';
import { isFingerprintMatch, generateDeviceSessionToken } from '../utils/deviceBinding';
import type { DeviceBindingInput } from '../validations/deviceBinding.validation';

const MAX_DEVICES_PER_USER = 3;

export interface DeviceBindingResult {
  isNewDevice: boolean;
  requiresReverification: boolean;
  deviceBindingId: string;
  sessionToken: string;
  /** Whether the device was blocked (rooted/emulator policy) */
  blocked?: boolean;
  blockReason?: string;
}

export const deviceBindingService = {
  /**
   * Registers or validates a device for a user.
   *
   * Called on every login from the mobile app.
   * Returns isNewDevice=true when the fingerprint doesn't match any
   * previously registered device for this user.
   */
  async registerOrValidateDevice(
    userId: string,
    payload: DeviceBindingInput
  ): Promise<DeviceBindingResult> {
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
    const existing = await (prisma as any).deviceBinding.findFirst({
      where: { userId, deviceId, isActive: true },
    });

    let isNewDevice = false;
    let requiresReverification = false;
    let bindingId: string;

    if (existing) {
      // Device known — check if fingerprint still matches
      const fingerprintMatches = isFingerprintMatch(existing.fingerprintHash, fingerprintHash);

      if (!fingerprintMatches) {
        // Fingerprint changed (firmware update, factory reset)
        // Treat as new device — require re-verification
        isNewDevice = true;
        requiresReverification = true;
        await (prisma as any).deviceBinding.update({
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
      } else {
        // Same device — update metadata + lastSeen
        await (prisma as any).deviceBinding.update({
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
    } else {
      // ── New device ────────────────────────────────────────────────────
      isNewDevice = true;

      // Check device limit per user
      const deviceCount = await (prisma as any).deviceBinding.count({
        where: { userId, isActive: true },
      });

      if (deviceCount >= MAX_DEVICES_PER_USER) {
        // Remove the oldest device to make room
        const oldest = await (prisma as any).deviceBinding.findFirst({
          where: { userId, isActive: true },
          orderBy: { lastSeenAt: 'asc' },
        });
        if (oldest) {
          await (prisma as any).deviceBinding.update({
            where: { id: oldest.id },
            data: { isActive: false },
          });
        }
      }

      const newBinding = await (prisma as any).deviceBinding.create({
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
    const sessionToken = generateDeviceSessionToken(deviceId, userId);

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
  async validateDeviceSession(
    userId: string,
    deviceId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const binding = await (prisma as any).deviceBinding.findFirst({
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
  async getUserDevices(userId: string) {
    return (prisma as any).deviceBinding.findMany({
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
  async revokeDevice(userId: string, deviceBindingId: string): Promise<void> {
    await (prisma as any).deviceBinding.updateMany({
      where: { id: deviceBindingId, userId },
      data: { isActive: false },
    });
  },

  /**
   * Called after successful phone OTP verification.
   * Clears the requiresReverification flag for the device.
   */
  async markDeviceVerified(userId: string, deviceId: string): Promise<void> {
    await (prisma as any).deviceBinding.updateMany({
      where: { userId, deviceId, isActive: true },
      data: { requiresReverification: false },
    });
  },
};
