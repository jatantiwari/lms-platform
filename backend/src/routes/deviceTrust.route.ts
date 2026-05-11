import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  checkDeviceTrust,
  sendDeviceTrustOtp,
  verifyDeviceTrustOtp,
  updatePhone,
} from '../controllers/deviceTrust.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Device Trust for Course Access ──────────────────────────────────────────

/**
 * GET /auth/device-trust/check?deviceId=...&fingerprintHash=...
 * Returns { isTrusted, requiresVerification, deviceId, knownDevice }
 */
router.get('/check', checkDeviceTrust);

/**
 * POST /auth/device-trust/send-otp
 * Sends OTP to enrolled phone. Optionally validates SIM phone number.
 * Body: { deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, platform, isRooted, isEmulator }
 */
router.post('/send-otp', sendDeviceTrustOtp);

/**
 * POST /auth/device-trust/verify-otp
 * Verifies OTP and marks device as trusted for course access.
 * Body: { otp, deviceId, fingerprintHash, simPhoneNumber?, simCarrier?, simSlot?, isRooted, isEmulator }
 */
router.post('/verify-otp', verifyDeviceTrustOtp);

// ─── Phone Number Update (one-time only) ─────────────────────────────────────

/**
 * Phase 1: POST /auth/phone/update { newPhone } → sends OTP to new number
 * Phase 2: POST /auth/phone/update { newPhone, otp } → verifies + applies change
 */
router.post(
  '/phone-update',
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'),
  updatePhone,
);

export default router;
