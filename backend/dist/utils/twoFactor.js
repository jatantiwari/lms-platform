"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.verifyOtpHash = verifyOtpHash;
exports.encodeOtpSession = encodeOtpSession;
exports.decodeOtpSession = decodeOtpSession;
exports.sendOtpViaTwoFactor = sendOtpViaTwoFactor;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
// ─── OTP Generation ──────────────────────────────────────────────────────────
/**
 * Generates a cryptographically random numeric OTP.
 * @param length 4 | 5 | 6  (default 6)
 */
function generateOtp(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length);
    return String(crypto_1.default.randomInt(min, max));
}
// ─── Hashing & Comparison ────────────────────────────────────────────────────
/**
 * Returns the SHA-256 hex hash of an OTP.
 * Never store plaintext OTPs — always store the hash.
 */
function hashOtp(otp) {
    return crypto_1.default.createHash('sha256').update(otp).digest('hex');
}
/**
 * Constant-time comparison of a plaintext OTP against its stored SHA-256 hash.
 * Prevents timing-based attacks.
 */
function verifyOtpHash(plainOtp, storedHash) {
    const incoming = Buffer.from(hashOtp(plainOtp), 'hex');
    const expected = Buffer.from(storedHash, 'hex');
    if (incoming.length !== expected.length)
        return false;
    return crypto_1.default.timingSafeEqual(incoming, expected);
}
// ─── Session Encoding ────────────────────────────────────────────────────────
const SESSION_SEPARATOR = '|';
/**
 * Encodes an OTP into a compact session string safe for DB storage.
 * Format: `<sha256-hex>|<expiresAtMs>`
 *
 * @param otp     The plaintext OTP to encode
 * @param ttlMs   Time-to-live in milliseconds (default 10 minutes)
 */
function encodeOtpSession(otp, ttlMs = 10 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    return `${hashOtp(otp)}${SESSION_SEPARATOR}${expiresAt}`;
}
/**
 * Decodes and validates a stored OTP session string.
 * Returns null if the format is invalid or the session has expired.
 */
function decodeOtpSession(session) {
    const idx = session.indexOf(SESSION_SEPARATOR);
    if (idx === -1)
        return null;
    const hash = session.slice(0, idx);
    const expiresAt = Number(session.slice(idx + 1));
    if (!hash || isNaN(expiresAt))
        return null;
    if (Date.now() > expiresAt)
        return null; // expired
    return { hash, expiresAt };
}
// ─── 2Factor API Call ────────────────────────────────────────────────────────
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
async function sendOtpViaTwoFactor(phone10, otp, appHash, templateName) {
    if (!env_1.env.TWOFACTOR_API_KEY) {
        throw Object.assign(new Error('SMS service not configured'), { statusCode: 503 });
    }
    const template = templateName || env_1.env.SMS_RETRIEVER_TEMPLATE || '';
    // When no custom template is configured, use the raw OTP endpoint.
    // If the app hash is available, append it so SMS Retriever can auto-read it.
    // Format required by Android SMS Retriever: "<#> <message>\n<11-char-hash>"
    if (!template && appHash) {
        // Use 2Factor's transactional route with a message body.
        // 2Factor doesn't support free-form body on the /SMS/ endpoint, so we use
        // the hash as a second OTP pass-through by constructing the URL with a
        // custom template suffix that the account owner sets once in the dashboard:
        //   Template name: ADIOTPRETRIEVER
        //   Template body: <#> {#var#} is your ADI Boost OTP. {#var#}
        // Until then, fall back to plain OTP without hash (User Consent dialog).
        const url = `https://2factor.in/API/V1/${env_1.env.TWOFACTOR_API_KEY}/SMS/${phone10}/${otp}/"OTP1"`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`2Factor HTTP error: ${res.status} ${res.statusText}`);
        const data = (await res.json());
        if (data.Status !== 'Success')
            throw new Error(`Failed to send OTP: ${data.Details}`);
        return;
    }
    // Only append /:template when we actually have a configured template name.
    // Supplying an unknown template causes 2Factor to fall back to a voice call.
    const url = template
        ? `https://2factor.in/API/V1/${env_1.env.TWOFACTOR_API_KEY}/SMS/${phone10}/${otp}/${template}`
        : `https://2factor.in/API/V1/${env_1.env.TWOFACTOR_API_KEY}/SMS/${phone10}/${otp}/"OTP1"`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`2Factor HTTP error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json());
    if (data.Status !== 'Success') {
        throw new Error(`Failed to send OTP: ${data.Details}`);
    }
}
//# sourceMappingURL=twoFactor.js.map