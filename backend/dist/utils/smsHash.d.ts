/**
 * SMS App Hash Utility for Node.js / Backend
 *
 * ── Purpose ──────────────────────────────────────────────────────────────
 * The Android SMS Retriever API requires the SMS body to end with an
 * 11-character app hash. This backend utility:
 *   1. Accepts the app hash from the mobile client
 *   2. Appends it to the OTP SMS before sending
 *   3. Validates that the hash matches expected values (optional security layer)
 *
 * ── SMS Format ────────────────────────────────────────────────────────────
 * The SMS MUST be ≤ 140 characters and end exactly with:
 *   \n\n<11-char-hash>
 *
 * Example:
 *   "Your ADI Boost OTP is 483921. Valid for 5 minutes.\n\nFA+9qCX9VSu"
 *
 * ── Notes ────────────────────────────────────────────────────────────────
 * - The hash is per-APK-signing-key, not per-device. It's the same for
 *   all users of the same app version.
 * - Debug and release builds have DIFFERENT hashes.
 * - You can hardcode the release hash as an env variable for validation.
 * ────────────────────────────────────────────────────────────────────────
 */
export interface OtpSmsOptions {
    appHash: string;
    otp: string;
    appName?: string;
    validMinutes?: number;
}
/**
 * Formats the OTP SMS body with the app hash appended.
 * The hash MUST be the last thing in the message (after two newlines).
 */
export declare function formatOtpSms(options: OtpSmsOptions): string;
/**
 * Validates that the provided app hash looks like a real SMS Retriever hash.
 * This is a basic format check — for strict validation, hardcode your
 * release key hash in EXPECTED_APP_HASHES env variable.
 */
export declare function validateAppHash(hash: string): boolean;
/**
 * Returns whether the given hash matches the expected release hashes.
 * Set EXPECTED_APP_HASHES as comma-separated list in environment.
 * Include both debug and release hashes during development.
 */
export declare function isKnownAppHash(hash: string): boolean;
//# sourceMappingURL=smsHash.d.ts.map