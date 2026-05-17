"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceTrustService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
const deviceBinding_1 = require("../utils/deviceBinding");
const twoFactor_1 = require("../utils/twoFactor");
const MAX_DEVICES_PER_USER = 3;
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds between OTP sends
const smsSessions = new Map();
function pruneSmsSessions() {
    const now = Date.now();
    for (const [token, session] of smsSessions) {
        if (session.expiresAt < now)
            smsSessions.delete(token);
    }
}
// ─── Helpers ───────────────────────────────────────────────────────────────────
function maskPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4)
        return '****';
    return digits.slice(0, 2) + '*'.repeat(digits.length - 4) + digits.slice(-2);
}
function normalizePhone(raw) {
    return raw.replace(/\D/g, '').replace(/^91/, '').slice(-10);
}
function phonesMatch(enrolled, sim) {
    if (!enrolled || !sim)
        return false;
    return normalizePhone(enrolled) === normalizePhone(sim);
}
async function getOrCreateDeviceBinding(userId, input) {
    const existing = await prisma_1.default.deviceBinding.findFirst({
        where: { userId, deviceId: input.deviceId, isActive: true },
    });
    if (existing) {
        // Refresh lastSeenAt and security flags
        return prisma_1.default.deviceBinding.update({
            where: { id: existing.id },
            data: {
                lastSeenAt: new Date(),
                isRooted: input.isRooted,
                isEmulator: input.isEmulator,
                fingerprintHash: input.fingerprintHash,
                appVersion: input.appVersion,
            },
        });
    }
    // Enforce max devices — evict oldest
    const count = await prisma_1.default.deviceBinding.count({ where: { userId, isActive: true } });
    if (count >= MAX_DEVICES_PER_USER) {
        const oldest = await prisma_1.default.deviceBinding.findFirst({
            where: { userId, isActive: true },
            orderBy: { lastSeenAt: 'asc' },
        });
        if (oldest) {
            await prisma_1.default.deviceBinding.update({ where: { id: oldest.id }, data: { isActive: false } });
        }
    }
    return prisma_1.default.deviceBinding.create({
        data: {
            userId,
            deviceId: input.deviceId,
            fingerprintHash: input.fingerprintHash,
            platform: 'platform' in input ? input.platform : 'android',
            isRooted: input.isRooted,
            isEmulator: input.isEmulator,
            appVersion: input.appVersion,
            carrierName: input.simCarrier,
            simSlotIndex: input.simSlot,
            requiresReverification: true,
            isTrustedForCourseAccess: false,
            lastSeenAt: new Date(),
        },
    });
}
// ─── Service ───────────────────────────────────────────────────────────────────
exports.deviceTrustService = {
    /**
     * Check if a device is trusted for course access.
     * Called before navigating to the learn screen.
     */
    async checkTrustStatus(userId, input) {
        const binding = await prisma_1.default.deviceBinding.findFirst({
            where: { userId, deviceId: input.deviceId, isActive: true },
        });
        // Get enrolled phone for context
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { phone: true, phoneVerified: true },
        });
        if (!binding) {
            return {
                isTrusted: false,
                requiresVerification: true,
                deviceId: input.deviceId,
                knownDevice: false,
                phoneMatches: null,
            };
        }
        // Verify fingerprint hasn't changed
        const hashMatches = (0, deviceBinding_1.isFingerprintMatch)(binding.fingerprintHash, input.fingerprintHash);
        // Update last seen
        await prisma_1.default.deviceBinding.update({
            where: { id: binding.id },
            data: {
                lastSeenAt: new Date(),
                fingerprintHash: input.fingerprintHash,
            },
        });
        const isTrusted = binding.isTrustedForCourseAccess &&
            !binding.requiresReverification &&
            binding.isActive &&
            hashMatches &&
            !!user?.phoneVerified;
        return {
            isTrusted,
            requiresVerification: !isTrusted,
            deviceId: input.deviceId,
            knownDevice: true,
            phoneMatches: null, // only checked during OTP flow
        };
    },
    /**
     * Send OTP to enrolled phone for device trust verification.
     * Optionally validates the SIM phone number against the enrolled number.
     */
    async sendDeviceTrustOtp(userId, input, ipAddress) {
        if (!env_1.env.TWOFACTOR_API_KEY) {
            throw new Error('SMS service not configured');
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, phone: true, phoneVerified: true, deviceTrustOtpSession: true },
        });
        if (!user)
            throw new Error('User not found');
        if (!user.phone)
            throw new Error('No enrolled phone number found. Please update your profile.');
        if (!user.phoneVerified)
            throw new Error('Phone number not yet verified. Please verify your phone first.');
        // ─── SIM phone number mismatch check ──────────────────────────────────────
        // If the app could read the SIM phone number, verify it matches enrolled phone
        const simPhone = (input.simPhoneNumber ?? '').trim();
        if (simPhone.length >= 10) {
            const match = phonesMatch(user.phone, simPhone);
            if (!match) {
                // Log the failed attempt
                await prisma_1.default.verificationLog.create({
                    data: {
                        userId,
                        deviceId: input.deviceId,
                        type: 'DEVICE_TRUST_OTP',
                        status: 'BLOCKED',
                        phone: maskPhone(user.phone),
                        failureReason: 'SIM phone number does not match enrolled phone',
                        ipAddress,
                        platform: input.platform,
                        isRooted: input.isRooted,
                        isEmulator: input.isEmulator,
                    },
                });
                throw Object.assign(new Error('The SIM in this device does not match your enrolled mobile number.'), {
                    code: 'PHONE_MISMATCH',
                    statusCode: 403,
                });
            }
        }
        // ── Generate OTP: use client-generated OTP if provided, otherwise generate one ──
        const phone10 = normalizePhone(user.phone);
        const otp = input.clientOtp ?? (0, twoFactor_1.generateOtp)(6);
        await (0, twoFactor_1.sendOtpViaTwoFactor)(phone10, otp, input.appHash, "OTP1");
        // Store hashed OTP + expiry in DB (never store plaintext OTP)
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { deviceTrustOtpSession: (0, twoFactor_1.encodeOtpSession)(otp) },
        });
        // Create/update device binding (doesn't trust yet)
        await getOrCreateDeviceBinding(userId, input);
        return { success: true, maskedPhone: maskPhone(user.phone) };
    },
    /**
     * Verify OTP and mark device as trusted for course access.
     * Enforces nonce + timestamp anti-replay.
     */
    async verifyDeviceTrustOtp(userId, input, ipAddress) {
        if (!env_1.env.TWOFACTOR_API_KEY) {
            throw new Error('SMS service not configured');
        }
        // ─── Anti-replay: timestamp + nonce ───────────────────────────────────────
        if (!(0, deviceBinding_1.isTimestampFresh)(input.timestamp)) {
            throw Object.assign(new Error('Request expired. Please try again.'), { statusCode: 400 });
        }
        if (!(0, deviceBinding_1.checkAndConsumeNonce)(input.nonce)) {
            throw Object.assign(new Error('Duplicate request detected. Please try again.'), { statusCode: 400 });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, phone: true, phoneVerified: true, deviceTrustOtpSession: true },
        });
        if (!user)
            throw new Error('User not found');
        if (!user.deviceTrustOtpSession) {
            throw Object.assign(new Error('No OTP session found. Please request a new OTP.'), {
                statusCode: 400,
            });
        }
        // ─── Verify OTP locally (hash compare) ───────────────────────────────────
        const decoded = (0, twoFactor_1.decodeOtpSession)(user.deviceTrustOtpSession);
        const otpValid = decoded !== null && (0, twoFactor_1.verifyOtpHash)(input.otp, decoded.hash);
        if (!otpValid) {
            // Log failed attempt
            await prisma_1.default.verificationLog.create({
                data: {
                    userId,
                    deviceId: input.deviceId,
                    type: 'DEVICE_TRUST_OTP',
                    status: 'FAILED',
                    phone: user.phone ? maskPhone(user.phone) : undefined,
                    failureReason: 'OTP mismatch or expired',
                    ipAddress,
                    isRooted: input.isRooted,
                    isEmulator: input.isEmulator,
                },
            });
            throw Object.assign(new Error('Invalid or expired OTP. Please try again.'), {
                statusCode: 400,
            });
        }
        // ─── Mark device as trusted ───────────────────────────────────────────────
        const binding = await getOrCreateDeviceBinding(userId, input);
        const trustedBinding = await prisma_1.default.deviceBinding.update({
            where: { id: binding.id },
            data: {
                isTrustedForCourseAccess: true,
                requiresReverification: false,
                verifiedMobileNumber: user.phone,
                verificationCount: { increment: 1 },
                trustedAt: new Date(),
                carrierName: input.simCarrier,
                simSlotIndex: input.simSlot,
                lastSeenAt: new Date(),
            },
        });
        // Clear OTP session
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { deviceTrustOtpSession: null },
        });
        // Audit log
        await prisma_1.default.verificationLog.create({
            data: {
                userId,
                deviceId: input.deviceId,
                deviceBindingId: trustedBinding.id,
                type: 'DEVICE_TRUST_OTP',
                status: 'SUCCESS',
                phone: user.phone ? maskPhone(user.phone) : undefined,
                ipAddress,
                isRooted: input.isRooted,
                isEmulator: input.isEmulator,
            },
        });
        return {
            success: true,
            isTrusted: true,
            deviceBindingId: trustedBinding.id,
        };
    },
    // ─── Mobile-Originated SMS Verification ────────────────────────────────────
    /**
     * Step 1: App calls this to get the session token and SMS body.
     * Returns the target number the app should send the SMS to.
     */
    async initSmsVerify(userId, input, ipAddress) {
        if (!env_1.env.DEVICE_SMS_TARGET_NUMBER) {
            throw Object.assign(new Error('SMS verification not configured on this server.'), {
                statusCode: 503,
            });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, phone: true, phoneVerified: true },
        });
        if (!user)
            throw new Error('User not found');
        if (!user.phone)
            throw new Error('No enrolled phone number. Please update your profile.');
        if (!user.phoneVerified)
            throw new Error('Phone number not verified. Please verify your phone first.');
        // Block rooted / emulator devices
        if (input.isRooted) {
            throw Object.assign(new Error('Access denied: rooted devices cannot be verified.'), {
                statusCode: 403,
            });
        }
        // Optional SIM mismatch check (if app could read SIM phone number)
        const simPhone = (input.simPhoneNumber ?? '').trim();
        if (simPhone.length >= 10 && !phonesMatch(user.phone, simPhone)) {
            await prisma_1.default.verificationLog.create({
                data: {
                    userId,
                    deviceId: input.deviceId,
                    type: 'DEVICE_TRUST_SMS',
                    status: 'BLOCKED',
                    phone: maskPhone(user.phone),
                    failureReason: 'SIM phone number does not match enrolled phone',
                    ipAddress,
                    platform: input.platform,
                    isRooted: input.isRooted,
                    isEmulator: input.isEmulator,
                },
            });
            throw Object.assign(new Error('The SIM in this device does not match your enrolled mobile number.'), { code: 'PHONE_MISMATCH', statusCode: 403 });
        }
        pruneSmsSessions();
        // Generate a cryptographically random session token
        const sessionToken = crypto_1.default.randomBytes(20).toString('hex');
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        smsSessions.set(sessionToken, {
            userId,
            deviceId: input.deviceId,
            fingerprintHash: input.fingerprintHash,
            enrolledPhone: user.phone,
            platform: input.platform,
            isRooted: input.isRooted,
            isEmulator: input.isEmulator,
            simCarrier: input.simCarrier,
            simSlot: input.simSlot,
            expiresAt,
            verified: false,
        });
        // The SMS body the device must send verbatim
        const smsBody = `ADI-VERIFY ${sessionToken}`;
        return {
            sessionToken,
            targetNumber: env_1.env.DEVICE_SMS_TARGET_NUMBER,
            smsBody,
            expiresAt,
        };
    },
    /**
     * Step 2 (webhook): Called by SMS gateway when an SMS arrives at our number.
     * Validates sender phone == enrolled phone, token valid → marks device trusted.
     */
    async processSmsWebhook(fromNumber, body, ipAddress) {
        pruneSmsSessions();
        // Extract token: "ADI-VERIFY <40-char-hex>"
        const match = body.trim().match(/^ADI-VERIFY\s+([0-9a-f]{40})$/i);
        if (!match)
            return; // Not our format — ignore silently
        const sessionToken = match[1].toLowerCase();
        const session = smsSessions.get(sessionToken);
        if (!session || session.expiresAt < Date.now()) {
            smsSessions.delete(sessionToken);
            return; // Expired or unknown token
        }
        if (session.verified)
            return; // Already processed
        // Validate sender phone == enrolled phone
        if (!phonesMatch(session.enrolledPhone, fromNumber)) {
            await prisma_1.default.verificationLog.create({
                data: {
                    userId: session.userId,
                    deviceId: session.deviceId,
                    type: 'DEVICE_TRUST_SMS',
                    status: 'BLOCKED',
                    phone: maskPhone(session.enrolledPhone),
                    failureReason: `Sender mismatch: expected ${maskPhone(session.enrolledPhone)} got ${maskPhone(fromNumber)}`,
                    ipAddress,
                    platform: session.platform,
                    isRooted: session.isRooted,
                    isEmulator: session.isEmulator,
                },
            });
            return;
        }
        // Mark session verified in memory
        session.verified = true;
        // Persist device binding as trusted
        const input = {
            deviceId: session.deviceId,
            fingerprintHash: session.fingerprintHash,
            simCarrier: session.simCarrier,
            simSlot: session.simSlot,
            isRooted: session.isRooted,
            isEmulator: session.isEmulator,
            platform: session.platform,
        };
        const binding = await getOrCreateDeviceBinding(session.userId, input);
        const trusted = await prisma_1.default.deviceBinding.update({
            where: { id: binding.id },
            data: {
                isTrustedForCourseAccess: true,
                requiresReverification: false,
                verifiedMobileNumber: session.enrolledPhone,
                verificationCount: { increment: 1 },
                trustedAt: new Date(),
                carrierName: session.simCarrier,
                simSlotIndex: session.simSlot,
                lastSeenAt: new Date(),
            },
        });
        await prisma_1.default.verificationLog.create({
            data: {
                userId: session.userId,
                deviceId: session.deviceId,
                deviceBindingId: trusted.id,
                type: 'DEVICE_TRUST_SMS',
                status: 'SUCCESS',
                phone: maskPhone(session.enrolledPhone),
                ipAddress,
                platform: session.platform,
                isRooted: session.isRooted,
                isEmulator: session.isEmulator,
            },
        });
    },
    /**
     * Step 3 (poll): App polls this until verified or expired.
     */
    checkSmsVerifyStatus(sessionToken) {
        pruneSmsSessions();
        const session = smsSessions.get(sessionToken);
        if (!session)
            return { verified: false, expired: true };
        if (session.expiresAt < Date.now()) {
            smsSessions.delete(sessionToken);
            return { verified: false, expired: true };
        }
        return { verified: session.verified, expired: false };
    },
};
//# sourceMappingURL=deviceTrust.service.js.map