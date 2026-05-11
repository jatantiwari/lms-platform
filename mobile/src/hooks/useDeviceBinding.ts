/**
 * useDeviceBinding — collects device fingerprint + security status,
 * and exposes a function to register/validate the device with the backend.
 *
 * ── Device Binding Strategy ──────────────────────────────────────────────
 * 1. On first login, compute device fingerprint and send to backend.
 * 2. Backend stores fingerprint + device metadata in DeviceBinding table.
 * 3. On every subsequent login, fingerprint is re-computed and compared
 *    server-side with the stored one.
 * 4. Mismatches trigger step-up authentication (re-verify phone OTP).
 * 5. Sessions are cryptographically tied to the device fingerprint via
 *    a device-bound JWT claim (deviceId in payload).
 *
 * ── Security Properties ──────────────────────────────────────────────────
 * - Rooted devices → block or show warning
 * - Emulators      → block (configurable)
 * - New device     → force re-verification
 * - Token stolen   → invalid on different deviceId
 * ────────────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as ExpoDevice from 'expo-device';
import * as ExpoConstants from 'expo-constants';
import { getDeviceFingerprint, getSecurityStatus, getSimCards } from '../lib/simVerification';
import type { DeviceFingerprint, SecurityStatus } from '../lib/simVerification';
import api from './api';

export interface DeviceInfo {
  fingerprint: DeviceFingerprint | null;
  security: SecurityStatus | null;
  /** Expo-level device metadata (available on all platforms) */
  expoDeviceInfo: {
    deviceName: string | null;
    osName: string | null;
    osVersion: string | null;
    brand: string | null;
    modelName: string | null;
    deviceType: number | null;
    isDevice: boolean;
  };
}

export interface DeviceBindingResult {
  success: boolean;
  isNewDevice: boolean;
  requiresReverification: boolean;
  error?: string;
}

export function useDeviceBinding() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isBound, setIsBound] = useState(false);

  /**
   * Collects all device information.
   * Call this early (e.g. on app startup or before login).
   */
  const collectDeviceInfo = useCallback(async (): Promise<DeviceInfo> => {
    setIsCollecting(true);
    try {
      const [fingerprint, security] = await Promise.allSettled([
        getDeviceFingerprint(),
        getSecurityStatus(),
      ]);

      const info: DeviceInfo = {
        fingerprint: fingerprint.status === 'fulfilled' ? fingerprint.value : null,
        security: security.status === 'fulfilled' ? security.value : null,
        expoDeviceInfo: {
          deviceName: ExpoDevice.deviceName,
          osName: ExpoDevice.osName,
          osVersion: ExpoDevice.osVersion,
          brand: ExpoDevice.brand,
          modelName: ExpoDevice.modelName,
          deviceType: ExpoDevice.deviceType ?? null,
          isDevice: ExpoDevice.isDevice,
        },
      };

      setDeviceInfo(info);
      return info;
    } finally {
      setIsCollecting(false);
    }
  }, []);

  /**
   * Registers or validates device binding with the backend.
   * Returns whether the device is new (needs re-verification).
   */
  const bindDevice = useCallback(async (): Promise<DeviceBindingResult> => {
    const info = deviceInfo ?? (await collectDeviceInfo());

    // Block rooted devices from sensitive operations (configurable)
    if (info.security?.isRooted) {
      return {
        success: false,
        isNewDevice: false,
        requiresReverification: false,
        error: 'ROOTED_DEVICE',
      };
    }

    // Optionally block emulators
    if (info.security?.isEmulator && !__DEV__) {
      return {
        success: false,
        isNewDevice: false,
        requiresReverification: false,
        error: 'EMULATOR_DETECTED',
      };
    }

    try {
      const response = await api.post<{
        success: boolean;
        isNewDevice: boolean;
        requiresReverification: boolean;
      }>('/auth/device-binding', {
        deviceId: info.fingerprint?.deviceId,
        fingerprintHash: info.fingerprint?.fingerprintHash,
        buildFingerprint: info.fingerprint?.buildFingerprint,
        model: info.fingerprint?.model ?? info.expoDeviceInfo.modelName,
        manufacturer: info.fingerprint?.manufacturer,
        sdkVersion: info.fingerprint?.sdkVersion,
        osName: info.expoDeviceInfo.osName,
        osVersion: info.expoDeviceInfo.osVersion,
        platform: Platform.OS,
        isEmulator: info.security?.isEmulator ?? !info.expoDeviceInfo.isDevice,
        isRooted: info.security?.isRooted ?? false,
        isDeveloperOptionsEnabled: info.security?.isDeveloperOptionsEnabled ?? false,
      });

      const { isNewDevice, requiresReverification } = response.data;
      setIsBound(true);

      return { success: true, isNewDevice, requiresReverification };
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Device binding failed';
      return { success: false, isNewDevice: false, requiresReverification: false, error: message };
    }
  }, [deviceInfo, collectDeviceInfo]);

  return {
    deviceInfo,
    isCollecting,
    isBound,
    collectDeviceInfo,
    bindDevice,
  };
}
