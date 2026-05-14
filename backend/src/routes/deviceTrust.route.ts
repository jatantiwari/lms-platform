import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  checkDeviceTrust,
  sendDeviceTrustOtp,
  verifyDeviceTrustOtp,
  updatePhone,
  initSmsVerify,
  smsVerifyStatus,
  smsWebhook,
} from '../controllers/deviceTrust.controller';

const router = Router();

// ─── SMS Webhook (no auth — gateway-facing) ───────────────────────────────────
/**
 * POST /auth/device-trust/sms-webhook
 * Called by Twilio / SMS gateway when a device sends an SMS to our virtual number.
 * Protected by x-webhook-secret header instead of JWT.
 */
router.post('/sms-webhook', smsWebhook);

// All other routes require authentication
router.use(authenticate);

// ─── Device Trust for Course Access ──────────────────────────────────────────

/**
 * GET /auth/device-trust/check?deviceId=...&fingerprintHash=...
 * Returns { isTrusted, requiresVerification, deviceId, knownDevice }
 */
router.get('/check', checkDeviceTrust);

/**
 * POST /auth/device-trust/init-sms-verify
 * Mobile-originated SMS flow: returns sessionToken + SMS body the device must send.
 * Body: { deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, platform, isRooted, isEmulator }
 */
router.post('/init-sms-verify', initSmsVerify);

/**
 * GET /auth/device-trust/sms-verify-status?sessionToken=...
 * Polls the status of a mobile-originated SMS verification session.
 * Returns { verified, expired }
 */
router.get('/sms-verify-status', smsVerifyStatus);

/**
 * POST /auth/device-trust/send-otp
 * OTP fallback: backend sends OTP to enrolled phone.
 * Body: { deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, platform, isRooted, isEmulator }
 */
router.post('/send-otp', sendDeviceTrustOtp);

/**
 * POST /auth/device-trust/verify-otp
 * Verifies OTP and marks device as trusted.
 * Body: { otp, deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, nonce, timestamp, isRooted, isEmulator }
 */
router.post('/verify-otp', verifyDeviceTrustOtp);

// ─── Phone Number Update (one-time only) ─────────────────────────────────────
router.post(
  '/phone-update',
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'),
  updatePhone,
);

export default router;
