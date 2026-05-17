/**
 * Device Binding Utilities
 *
 * ── Strategy (Google Pay / PhonePe style) ────────────────────────────────
 * 1. First login: device fingerprint is registered and stored.
 * 2. Every subsequent login: fingerprint is re-computed and compared.
 * 3. Mismatch → mark as "new device" → require phone OTP re-verification.
 * 4. Session JWT includes deviceId claim → tokens bound to device.
 * 5. Server rejects tokens where deviceId claim ≠ stored device fingerprint.
 *
 * ── What constitutes the device fingerprint ──────────────────────────────
 * - ANDROID_ID (changes on factory reset)
 * - Build.FINGERPRINT (unique per model+firmware)
 * - Build.BOARD + Build.HARDWARE
 * Combined as SHA-256 on the device, then sent to backend.
 *
 * ── Security properties ───────────────────────────────────────────────────
 * - Session cloning blocked: stolen JWT is invalid on a different deviceId
 * - Rooted device: flagged in DB, can trigger step-up auth
 * - Emulator: flagged and optionally blocked at service layer
 * ────────────────────────────────────────────────────────────────────────
 */
export interface DeviceRegistrationPayload {
    deviceId: string;
    fingerprintHash: string;
    buildFingerprint?: string;
    model?: string;
    manufacturer?: string;
    sdkVersion?: number;
    osName?: string;
    osVersion?: string;
    platform: 'android' | 'ios' | 'web';
    isEmulator?: boolean;
    isRooted?: boolean;
    isDeveloperOptionsEnabled?: boolean;
}
/**
 * Normalizes and validates the device payload from the client.
 * Rejects obviously malformed payloads.
 */
export declare function validateDevicePayload(payload: Partial<DeviceRegistrationPayload>): {
    valid: true;
    data: DeviceRegistrationPayload;
} | {
    valid: false;
    error: string;
};
/**
 * Determines if the provided fingerprint matches the stored one.
 * Timing-safe comparison prevents timing oracle attacks.
 */
export declare function isFingerprintMatch(stored: string, provided: string): boolean;
/**
 * Generates a device session token — an HMAC-signed token that binds
 * the device to the current session. Stored in DB and sent in JWT payload.
 */
export declare function generateDeviceSessionToken(deviceId: string, userId: string): string;
/**
 * Returns true if the nonce has NOT been seen before (and stores it).
 * Returns false if the nonce is a replay.
 */
export declare function checkAndConsumeNonce(nonce: string): boolean;
/**
 * Validates that a client timestamp is within ±30 seconds of server time.
 * Prevents replay of captured requests.
 */
export declare function isTimestampFresh(clientTimestampMs: number): boolean;
//# sourceMappingURL=deviceBinding.d.ts.map