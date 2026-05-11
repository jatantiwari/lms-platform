/**
 * Device Trust Store
 *
 * Persists device trust state in SecureStore.
 * This store is the single source of truth for whether the current device
 * is trusted to access course content.
 *
 * Key design decisions:
 * - Trust state is LOCAL first (fast path, no network on every navigation)
 * - Backend validation happens when:
 *   a) App opens (hydrate)
 *   b) Trust state is older than 24 hours
 * - Trust is cleared on logout
 * - Trust is cleared when the user changes their phone number
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDeviceFingerprint } from '../lib/simVerification';
import { deviceTrustApi } from '../lib/api';

const SECURE_STORE_KEY = 'deviceTrustState';
const TRUST_EXPIRY_MS = 24 * 60 * 60 * 1000; // Re-validate against backend every 24h

interface DeviceTrustPersistedState {
  isTrusted: boolean;
  deviceId: string;
  fingerprintHash: string;
  trustedAt: number; // unix ms
  verifiedPhone: string | null;
}

interface DeviceTrustStore {
  // ── Derived state ──────────────────────────────────────────────────────────
  isTrusted: boolean;
  isLoading: boolean;
  deviceId: string | null;
  fingerprintHash: string | null;
  verifiedPhone: string | null;
  trustedAt: number | null;
  isHydrated: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Called on app start — restores trust state from SecureStore */
  hydrate: () => Promise<void>;

  /**
   * Check whether the current device is trusted.
   * Reads local state first; validates against backend if stale (>24h).
   * Returns true if trusted.
   */
  checkTrust: () => Promise<boolean>;

  /**
   * Mark this device as trusted after successful OTP verification.
   * Persists to SecureStore.
   */
  markTrusted: (params: { deviceId: string; fingerprintHash: string; phone: string | null }) => Promise<void>;

  /**
   * Clear trust state (call on logout or phone number change).
   */
  clearTrust: () => Promise<void>;

  /** Returns { deviceId, fingerprintHash } for the current device */
  getDeviceIdentifiers: () => Promise<{ deviceId: string; fingerprintHash: string } | null>;
}

export const useDeviceTrustStore = create<DeviceTrustStore>((set, get) => ({
  isTrusted: false,
  isLoading: false,
  deviceId: null,
  fingerprintHash: null,
  verifiedPhone: null,
  trustedAt: null,
  isHydrated: false,

  async hydrate() {
    try {
      const raw = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!raw) {
        set({ isHydrated: true });
        return;
      }
      const state = JSON.parse(raw) as DeviceTrustPersistedState;
      set({
        isTrusted: state.isTrusted,
        deviceId: state.deviceId,
        fingerprintHash: state.fingerprintHash,
        trustedAt: state.trustedAt,
        verifiedPhone: state.verifiedPhone,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  async checkTrust() {
    // iOS / web — no device binding required, always trusted
    if (Platform.OS !== 'android') {
      set({ isTrusted: true, isHydrated: true });
      return true;
    }

    const { isTrusted, trustedAt, deviceId, fingerprintHash } = get();

    // If not trusted locally, no point checking backend
    if (!isTrusted || !deviceId || !fingerprintHash) return false;

    // If trust is still fresh, accept it
    if (trustedAt && Date.now() - trustedAt < TRUST_EXPIRY_MS) return true;

    // Trust is stale — validate against backend
    set({ isLoading: true });
    try {
      const { data } = await deviceTrustApi.check({ deviceId, fingerprintHash });
      const backendTrusted: boolean = data?.data?.isTrusted ?? false;
      if (!backendTrusted) {
        await get().clearTrust();
      } else {
        // Refresh the trustedAt timestamp
        await get().markTrusted({ deviceId, fingerprintHash, phone: get().verifiedPhone });
      }
      set({ isLoading: false });
      return backendTrusted;
    } catch {
      // On network error, trust the local state (offline resilience)
      set({ isLoading: false });
      return isTrusted;
    }
  },

  async markTrusted({ deviceId, fingerprintHash, phone }) {
    const state: DeviceTrustPersistedState = {
      isTrusted: true,
      deviceId,
      fingerprintHash,
      trustedAt: Date.now(),
      verifiedPhone: phone,
    };
    await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(state));
    set({
      isTrusted: true,
      deviceId,
      fingerprintHash,
      verifiedPhone: phone,
      trustedAt: state.trustedAt,
    });
  },

  async clearTrust() {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    set({
      isTrusted: false,
      deviceId: null,
      fingerprintHash: null,
      verifiedPhone: null,
      trustedAt: null,
    });
  },

  async getDeviceIdentifiers() {
    try {
      if (Platform.OS !== 'android') return null;
      const fp = await getDeviceFingerprint();
      if (!fp) return null;
      return { deviceId: fp.deviceId, fingerprintHash: fp.fingerprintHash };
    } catch {
      return null;
    }
  },
}));

/** Convenience selector — same pattern as useUser in authStore */
export const useDeviceTrust = () => useDeviceTrustStore((s) => s.isTrusted);
