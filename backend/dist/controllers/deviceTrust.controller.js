"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsWebhook = exports.smsVerifyStatus = exports.initSmsVerify = exports.updatePhone = exports.verifyDeviceTrustOtp = exports.sendDeviceTrustOtp = exports.checkDeviceTrust = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const deviceTrust_service_1 = require("../services/deviceTrust.service");
const deviceTrust_validation_1 = require("../validations/deviceTrust.validation");
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
const twoFactor_1 = require("../utils/twoFactor");
// ─── Check device trust status ────────────────────────────────────────────────
exports.checkDeviceTrust = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const parsed = deviceTrust_validation_1.checkDeviceTrustSchema.safeParse(req.query);
    if (!parsed.success) {
        throw new AppError_1.AppError(`Invalid query: ${parsed.error.issues[0].message}`, 400);
    }
    const result = await deviceTrust_service_1.deviceTrustService.checkTrustStatus(userId, parsed.data);
    (0, response_1.sendSuccess)(res, result, 'Device trust status');
});
// ─── Send OTP for device trust verification ───────────────────────────────────
exports.sendDeviceTrustOtp = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const parsed = deviceTrust_validation_1.sendDeviceTrustOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError_1.AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
    }
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? 'unknown';
    try {
        const result = await deviceTrust_service_1.deviceTrustService.sendDeviceTrustOtp(userId, parsed.data, ipAddress);
        (0, response_1.sendSuccess)(res, result, `OTP sent to your registered mobile number`);
    }
    catch (err) {
        const e = err;
        if (e.code === 'PHONE_MISMATCH') {
            throw new AppError_1.ForbiddenError(e.message);
        }
        throw new AppError_1.AppError(e.message ?? 'Failed to send OTP', e.statusCode ?? 500);
    }
});
// ─── Verify OTP + mark device as trusted ──────────────────────────────────────
exports.verifyDeviceTrustOtp = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const parsed = deviceTrust_validation_1.verifyDeviceTrustOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError_1.AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
    }
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? 'unknown';
    try {
        const result = await deviceTrust_service_1.deviceTrustService.verifyDeviceTrustOtp(userId, parsed.data, ipAddress);
        (0, response_1.sendSuccess)(res, result, 'Device verified successfully. Course access granted.');
    }
    catch (err) {
        const e = err;
        throw new AppError_1.AppError(e.message ?? 'Verification failed', e.statusCode ?? 400);
    }
});
// ─── One-time phone number update ─────────────────────────────────────────────
exports.updatePhone = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const parsed = deviceTrust_validation_1.updatePhoneSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError_1.AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
    }
    const { newPhone, otp } = parsed.data;
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true, isPhoneUpdated: true, deviceTrustOtpSession: true },
    });
    if (!user)
        throw new AppError_1.AppError('User not found', 404);
    if (user.isPhoneUpdated) {
        throw new AppError_1.ForbiddenError('Phone number can only be changed once. This user has already updated their phone number.');
    }
    const normalizePhone = (p) => p.replace(/\D/g, '').replace(/^91/, '').slice(-10);
    const normalizedNew = normalizePhone(newPhone);
    const normalizedCurrent = user.phone ? normalizePhone(user.phone) : '';
    if (normalizedNew === normalizedCurrent) {
        throw new AppError_1.AppError('New phone number is the same as the current phone number.', 400);
    }
    // Phase 1: No OTP yet → send OTP to the NEW number
    if (!otp) {
        if (!env_1.env.TWOFACTOR_API_KEY)
            throw new AppError_1.AppError('SMS service not configured', 503);
        const phone10 = normalizePhone(newPhone);
        const generatedOtp = (0, twoFactor_1.generateOtp)(6);
        await (0, twoFactor_1.sendOtpViaTwoFactor)(phone10, generatedOtp, undefined, "OTP1");
        // Store encoded session (hash|expiry) with PHONE_CHANGE prefix
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { deviceTrustOtpSession: `PHONE_CHANGE:${newPhone}:${(0, twoFactor_1.encodeOtpSession)(generatedOtp)}` },
        });
        (0, response_1.sendSuccess)(res, {}, `OTP sent to ${newPhone.slice(0, 3)}****${newPhone.slice(-3)}`);
        return;
    }
    // Phase 2: OTP provided → verify and finalize
    if (!user.deviceTrustOtpSession?.startsWith('PHONE_CHANGE:')) {
        throw new AppError_1.AppError('No phone change session found. Please initiate the process again.', 400);
    }
    const [, sessionPhone, encodedSession] = user.deviceTrustOtpSession.split(':');
    // Ensure the OTP is for the same new phone
    if (normalizePhone(sessionPhone) !== normalizedNew) {
        throw new AppError_1.AppError('Phone number mismatch. Please restart the process.', 400);
    }
    if (!env_1.env.TWOFACTOR_API_KEY)
        throw new AppError_1.AppError('SMS service not configured', 503);
    // Verify OTP locally against stored hash
    const decoded = (0, twoFactor_1.decodeOtpSession)(encodedSession);
    if (!decoded || !(0, twoFactor_1.verifyOtpHash)(otp, decoded.hash)) {
        throw new AppError_1.AppError('Invalid or expired OTP.', 400);
    }
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? 'unknown';
    // Update phone + log + revoke device trust (force re-verification on all devices)
    await prisma_1.default.$transaction([
        prisma_1.default.user.update({
            where: { id: userId },
            data: {
                originalPhone: user.phone,
                phone: newPhone,
                isPhoneUpdated: true,
                phoneUpdatedAt: new Date(),
                phoneVerified: true,
                deviceTrustOtpSession: null,
            },
        }),
        prisma_1.default.phoneChangeLog.create({
            data: {
                userId,
                previousPhone: user.phone ?? '',
                newPhone,
                ipAddress,
                platform: 'mobile',
                verifiedViaOtp: true,
            },
        }),
        // Force all active devices to re-verify with new phone
        prisma_1.default.deviceBinding.updateMany({
            where: { userId, isActive: true },
            data: {
                isTrustedForCourseAccess: false,
                requiresReverification: true,
                verifiedMobileNumber: null,
            },
        }),
    ]);
    // Audit log
    await prisma_1.default.verificationLog.create({
        data: {
            userId,
            type: 'PHONE_CHANGE',
            status: 'SUCCESS',
            phone: `${newPhone.slice(0, 3)}****${newPhone.slice(-3)}`,
            ipAddress,
            platform: 'mobile',
        },
    });
    (0, response_1.sendSuccess)(res, {}, 'Phone number updated successfully. Please re-verify your device for course access.');
});
// ─── Init mobile-originated SMS verification ──────────────────────────────────
exports.initSmsVerify = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const parsed = deviceTrust_validation_1.initSmsVerifySchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError_1.AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
    }
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? 'unknown';
    try {
        const result = await deviceTrust_service_1.deviceTrustService.initSmsVerify(userId, parsed.data, ipAddress);
        (0, response_1.sendSuccess)(res, result, 'SMS verification initiated');
    }
    catch (err) {
        const e = err;
        if (e.code === 'PHONE_MISMATCH')
            throw new AppError_1.ForbiddenError(e.message);
        throw new AppError_1.AppError(e.message ?? 'Failed to initiate SMS verification', e.statusCode ?? 500);
    }
});
// ─── Poll SMS verify status ───────────────────────────────────────────────────
exports.smsVerifyStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sessionToken } = req.query;
    if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length !== 40) {
        throw new AppError_1.AppError('Invalid sessionToken', 400);
    }
    const result = deviceTrust_service_1.deviceTrustService.checkSmsVerifyStatus(sessionToken);
    (0, response_1.sendSuccess)(res, result, 'SMS verify status');
});
// ─── SMS webhook (Twilio / 2Factor inbound) ───────────────────────────────────
// This endpoint is called by the SMS gateway when a device sends an SMS to our number.
// No auth middleware — protected by webhook secret header.
exports.smsWebhook = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // Validate webhook secret to prevent spoofing
    if (env_1.env.SMS_WEBHOOK_SECRET) {
        const provided = req.headers['x-webhook-secret'] ?? req.headers['x-twilio-signature'];
        if (!provided || provided !== env_1.env.SMS_WEBHOOK_SECRET) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
    }
    const parsed = deviceTrust_validation_1.smsWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
        // Respond 200 to prevent gateway retry loops
        res.status(200).json({ status: 'ignored' });
        return;
    }
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress
        ?? 'unknown';
    await deviceTrust_service_1.deviceTrustService.processSmsWebhook(parsed.data.From, parsed.data.Body, ipAddress);
    // Always respond 200 to SMS gateways
    res.status(200).json({ status: 'ok' });
});
//# sourceMappingURL=deviceTrust.controller.js.map