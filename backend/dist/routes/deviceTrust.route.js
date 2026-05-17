"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const deviceTrust_controller_1 = require("../controllers/deviceTrust.controller");
const router = (0, express_1.Router)();
// ─── SMS Webhook (no auth — gateway-facing) ───────────────────────────────────
/**
 * POST /auth/device-trust/sms-webhook
 * Called by Twilio / SMS gateway when a device sends an SMS to our virtual number.
 * Protected by x-webhook-secret header instead of JWT.
 */
router.post('/sms-webhook', deviceTrust_controller_1.smsWebhook);
// All other routes require authentication
router.use(authenticate_1.authenticate);
// ─── Device Trust for Course Access ──────────────────────────────────────────
/**
 * GET /auth/device-trust/check?deviceId=...&fingerprintHash=...
 * Returns { isTrusted, requiresVerification, deviceId, knownDevice }
 */
router.get('/check', deviceTrust_controller_1.checkDeviceTrust);
/**
 * POST /auth/device-trust/init-sms-verify
 * Mobile-originated SMS flow: returns sessionToken + SMS body the device must send.
 * Body: { deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, platform, isRooted, isEmulator }
 */
router.post('/init-sms-verify', deviceTrust_controller_1.initSmsVerify);
/**
 * GET /auth/device-trust/sms-verify-status?sessionToken=...
 * Polls the status of a mobile-originated SMS verification session.
 * Returns { verified, expired }
 */
router.get('/sms-verify-status', deviceTrust_controller_1.smsVerifyStatus);
/**
 * POST /auth/device-trust/send-otp
 * OTP fallback: backend sends OTP to enrolled phone.
 * Body: { deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, platform, isRooted, isEmulator }
 */
router.post('/send-otp', deviceTrust_controller_1.sendDeviceTrustOtp);
/**
 * POST /auth/device-trust/verify-otp
 * Verifies OTP and marks device as trusted.
 * Body: { otp, deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, nonce, timestamp, isRooted, isEmulator }
 */
router.post('/verify-otp', deviceTrust_controller_1.verifyDeviceTrustOtp);
// ─── Phone Number Update (one-time only) ─────────────────────────────────────
router.post('/phone-update', (0, authorize_1.authorize)('STUDENT', 'INSTRUCTOR', 'ADMIN'), deviceTrust_controller_1.updatePhone);
exports.default = router;
//# sourceMappingURL=deviceTrust.route.js.map