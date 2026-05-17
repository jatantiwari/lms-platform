/**
 * Device Trust Service
 *
 * Manages device trust verification for course access gating.
 *
 * ── Primary Flow (mobile-originated SMS) ─────────────────────────────────────
 * 1. App calls POST /auth/device-trust/init-sms-verify
 *    → Backend generates sessionToken, returns targetNumber + smsBody
 * 2. App sends SMS from device SIM: "ADI-VERIFY <sessionToken>"
 * 3. SMS gateway webhook calls POST /auth/device-trust/sms-webhook
 *    → Backend validates sender = enrolled phone, token valid
 *    → Marks device as trusted
 * 4. App polls GET /auth/device-trust/sms-verify-status?sessionToken=...
 *    → Returns { verified: true } when complete
 *
 * ── Fallback Flow (OTP) ───────────────────────────────────────────────────────
 * 1. App calls POST /auth/device-trust/send-otp
 * 2. Backend sends OTP to enrolled phone via 2Factor
 * 3. App auto-reads OTP via SMS Retriever, or user types it
 * 4. App calls POST /auth/device-trust/verify-otp with nonce+timestamp (anti-replay)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { SendDeviceTrustOtpInput, VerifyDeviceTrustOtpInput, CheckDeviceTrustInput, InitSmsVerifyInput } from '../validations/deviceTrust.validation';
export interface DeviceTrustCheckResult {
    isTrusted: boolean;
    requiresVerification: boolean;
    deviceId: string;
    /** Whether the device fingerprint matched a known device */
    knownDevice: boolean;
    /** Whether the SIM phone matches the enrolled phone (null if unverifiable) */
    phoneMatches: boolean | null;
}
export interface SendOtpResult {
    success: boolean;
    maskedPhone: string;
}
export interface VerifyOtpResult {
    success: boolean;
    isTrusted: boolean;
    deviceBindingId: string;
}
export declare const deviceTrustService: {
    /**
     * Check if a device is trusted for course access.
     * Called before navigating to the learn screen.
     */
    checkTrustStatus(userId: string, input: CheckDeviceTrustInput): Promise<DeviceTrustCheckResult>;
    /**
     * Send OTP to enrolled phone for device trust verification.
     * Optionally validates the SIM phone number against the enrolled number.
     */
    sendDeviceTrustOtp(userId: string, input: SendDeviceTrustOtpInput, ipAddress: string): Promise<SendOtpResult>;
    /**
     * Verify OTP and mark device as trusted for course access.
     * Enforces nonce + timestamp anti-replay.
     */
    verifyDeviceTrustOtp(userId: string, input: VerifyDeviceTrustOtpInput, ipAddress: string): Promise<VerifyOtpResult>;
    /**
     * Step 1: App calls this to get the session token and SMS body.
     * Returns the target number the app should send the SMS to.
     */
    initSmsVerify(userId: string, input: InitSmsVerifyInput, ipAddress: string): Promise<{
        sessionToken: string;
        targetNumber: string;
        smsBody: string;
        expiresAt: number;
    }>;
    /**
     * Step 2 (webhook): Called by SMS gateway when an SMS arrives at our number.
     * Validates sender phone == enrolled phone, token valid → marks device trusted.
     */
    processSmsWebhook(fromNumber: string, body: string, ipAddress: string): Promise<void>;
    /**
     * Step 3 (poll): App polls this until verified or expired.
     */
    checkSmsVerifyStatus(sessionToken: string): {
        verified: boolean;
        expired: boolean;
    };
};
//# sourceMappingURL=deviceTrust.service.d.ts.map