"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDevicePayload = validateDevicePayload;
exports.isFingerprintMatch = isFingerprintMatch;
exports.generateDeviceSessionToken = generateDeviceSessionToken;
exports.checkAndConsumeNonce = checkAndConsumeNonce;
exports.isTimestampFresh = isTimestampFresh;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Normalizes and validates the device payload from the client.
 * Rejects obviously malformed payloads.
 */
function validateDevicePayload(payload) {
    const { deviceId, fingerprintHash, platform } = payload;
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 16) {
        return { valid: false, error: 'Invalid deviceId' };
    }
    if (!fingerprintHash || typeof fingerprintHash !== 'string' || fingerprintHash.length < 32) {
        return { valid: false, error: 'Invalid fingerprintHash' };
    }
    if (!platform || !['android', 'ios', 'web'].includes(platform)) {
        return { valid: false, error: 'Invalid platform' };
    }
    return {
        valid: true,
        data: {
            deviceId: sanitize(deviceId),
            fingerprintHash: sanitize(fingerprintHash),
            buildFingerprint: sanitize(payload.buildFingerprint),
            model: sanitize(payload.model),
            manufacturer: sanitize(payload.manufacturer),
            sdkVersion: typeof payload.sdkVersion === 'number' ? payload.sdkVersion : undefined,
            osName: sanitize(payload.osName),
            osVersion: sanitize(payload.osVersion),
            platform: payload.platform,
            isEmulator: Boolean(payload.isEmulator),
            isRooted: Boolean(payload.isRooted),
            isDeveloperOptionsEnabled: Boolean(payload.isDeveloperOptionsEnabled),
        },
    };
}
/**
 * Determines if the provided fingerprint matches the stored one.
 * Timing-safe comparison prevents timing oracle attacks.
 */
function isFingerprintMatch(stored, provided) {
    if (!stored || !provided)
        return false;
    // Pad to equal length for crypto.timingSafeEqual
    const a = Buffer.from(stored.padEnd(64, '0'));
    const b = Buffer.from(provided.padEnd(64, '0'));
    if (a.length !== b.length)
        return false;
    return crypto_1.default.timingSafeEqual(a, b);
}
/**
 * Generates a device session token — an HMAC-signed token that binds
 * the device to the current session. Stored in DB and sent in JWT payload.
 */
function generateDeviceSessionToken(deviceId, userId) {
    const secret = process.env.DEVICE_BINDING_SECRET ?? process.env.JWT_SECRET ?? 'change-me';
    const payload = `${userId}:${deviceId}:${Date.now()}`;
    return crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
}
// ─── Nonce anti-replay store (in-process, 90-second TTL) ─────────────────────
// For multi-process deployments, replace with Redis SETNX.
const usedNonces = new Map();
/**
 * Returns true if the nonce has NOT been seen before (and stores it).
 * Returns false if the nonce is a replay.
 */
function checkAndConsumeNonce(nonce) {
    const now = Date.now();
    // Purge expired entries
    for (const [n, exp] of usedNonces) {
        if (exp < now)
            usedNonces.delete(n);
    }
    if (usedNonces.has(nonce))
        return false;
    usedNonces.set(nonce, now + 90000);
    return true;
}
/**
 * Validates that a client timestamp is within ±30 seconds of server time.
 * Prevents replay of captured requests.
 */
function isTimestampFresh(clientTimestampMs) {
    const diff = Math.abs(Date.now() - clientTimestampMs);
    return diff <= 30000;
}
// ─── Internal ────────────────────────────────────────────────────────────────
function sanitize(value) {
    if (value === undefined || value === null)
        return undefined;
    // Strip non-printable characters and limit length
    return String(value).replace(/[^\x20-\x7E]/g, '').slice(0, 256);
}
//# sourceMappingURL=deviceBinding.js.map