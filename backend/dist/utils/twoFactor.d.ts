/**
 * twoFactor.ts — 2Factor.in SMS OTP utilities
 *
 * Uses the Manual Generation endpoint (custom OTP) so that OTP values are
 * generated and verified entirely within this application, without relying on
 * 2Factor's VERIFY endpoint.  This gives us full control over:
 *   - OTP length and character set
 *   - Expiry window
 *   - Timing-safe comparison (prevents timing attacks on stored secrets)
 *
 * API reference:
 *   GET https://2factor.in/API/V1/:api_key/SMS/:phone/:otp_value/:template_name
 */
/**
 * Generates a cryptographically random numeric OTP.
 * @param length 4 | 5 | 6  (default 6)
 */
export declare function generateOtp(length?: 4 | 5 | 6): string;
/**
 * Returns the SHA-256 hex hash of an OTP.
 * Never store plaintext OTPs — always store the hash.
 */
export declare function hashOtp(otp: string): string;
/**
 * Constant-time comparison of a plaintext OTP against its stored SHA-256 hash.
 * Prevents timing-based attacks.
 */
export declare function verifyOtpHash(plainOtp: string, storedHash: string): boolean;
/**
 * Encodes an OTP into a compact session string safe for DB storage.
 * Format: `<sha256-hex>|<expiresAtMs>`
 *
 * @param otp     The plaintext OTP to encode
 * @param ttlMs   Time-to-live in milliseconds (default 10 minutes)
 */
export declare function encodeOtpSession(otp: string, ttlMs?: number): string;
/**
 * Decodes and validates a stored OTP session string.
 * Returns null if the format is invalid or the session has expired.
 */
export declare function decodeOtpSession(session: string): {
    hash: string;
    expiresAt: number;
} | null;
/**
 * Sends a custom OTP via the 2Factor.in Manual Generation endpoint.
 *
 * Endpoint: GET /API/V1/:api_key/SMS/:phone/:otp_value/:template_name
 *
 * @param phone10      10-digit Indian phone number (no country code, no +)
 * @param otp          The plaintext OTP to send (4-6 digits)
/**
 * Sends a custom OTP via the 2Factor.in Manual Generation endpoint.
 *
 * Endpoint: GET /API/V1/:api_key/SMS/:phone/:otp_value/:template_name
 *
 * @param phone10      10-digit Indian phone number (no country code, no +)
 * @param otp          The plaintext OTP to send (4-6 digits)
 * @param appHash      Optional 11-char Android app hash. When provided and no
 *                     template is configured, the hash is appended to the OTP
 *                     message body via 2Factor's `TEXTLOCAL_IN` raw sender, so
 *                     the Android SMS Retriever API can silently read the OTP
 *                     without user interaction or a system consent dialog.
 *                     When a custom template is configured (SMS_RETRIEVER_TEMPLATE)
 *                     the template itself must already contain the hash — this
 *                     param is ignored in that case.
 * @param templateName Optional 2Factor template name. Falls back to
 *                     SMS_RETRIEVER_TEMPLATE env var. If neither is set the
 *                     template segment is OMITTED so 2Factor uses its default
 *                     SMS template — this avoids accidental voice-call fallback
 *                     when a non-existent template name is supplied.
 *
 * @throws Error if 2Factor API key is missing or the API call fails
 */
export declare function sendOtpViaTwoFactor(phone10: string, otp: string, appHash?: string, templateName?: string): Promise<void>;
//# sourceMappingURL=twoFactor.d.ts.map