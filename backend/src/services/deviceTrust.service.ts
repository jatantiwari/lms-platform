/**
 * Device Trust Service
 *
 * Manages device trust verification for course access gating.
 *
 * ── Flow ─────────────────────────────────────────────────────────────────────
 * 1. Student taps "Start Course" on mobile
 * 2. App sends device fingerprint → GET /auth/device-trust/check
 * 3. If trusted: allow access
 * 4. If not trusted:
 *    a. App shows DeviceVerificationModal
 *    b. User selects SIM → POST /auth/device-trust/send-otp
 *       - Backend checks simPhoneNumber (if provided) against user.phone
 *       - If mismatch → 403 PHONE_MISMATCH
 *       - Sends OTP to user.phone via 2Factor
 *    c. User enters OTP (auto-read via SMS Retriever) → POST /auth/device-trust/verify-otp
 *       - OTP verified → DeviceBinding.isTrustedForCourseAccess = true
 *       - Logs to VerificationLog
 * ─────────────────────────────────────────────────────────────────────────────
 */

import prisma from '../config/prisma';
import { env } from '../config/env';
import { isFingerprintMatch } from '../utils/deviceBinding';
import type {
  SendDeviceTrustOtpInput,
  VerifyDeviceTrustOtpInput,
  CheckDeviceTrustInput,
} from '../validations/deviceTrust.validation';

const MAX_DEVICES_PER_USER = 3;
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds between OTP sends

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return digits.slice(0, 2) + '*'.repeat(digits.length - 4) + digits.slice(-2);
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^91/, '').slice(-10);
}

function phonesMatch(enrolled: string | null, sim: string): boolean {
  if (!enrolled || !sim) return false;
  return normalizePhone(enrolled) === normalizePhone(sim);
}

async function getOrCreateDeviceBinding(
  userId: string,
  input: SendDeviceTrustOtpInput | VerifyDeviceTrustOtpInput,
) {
  const existing = await prisma.deviceBinding.findFirst({
    where: { userId, deviceId: input.deviceId, isActive: true },
  });

  if (existing) {
    // Refresh lastSeenAt and security flags
    return prisma.deviceBinding.update({
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
  const count = await prisma.deviceBinding.count({ where: { userId, isActive: true } });
  if (count >= MAX_DEVICES_PER_USER) {
    const oldest = await prisma.deviceBinding.findFirst({
      where: { userId, isActive: true },
      orderBy: { lastSeenAt: 'asc' },
    });
    if (oldest) {
      await prisma.deviceBinding.update({ where: { id: oldest.id }, data: { isActive: false } });
    }
  }

  return prisma.deviceBinding.create({
    data: {
      userId,
      deviceId: input.deviceId,
      fingerprintHash: input.fingerprintHash,
      platform: 'platform' in input ? (input as SendDeviceTrustOtpInput).platform : 'android',
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

export const deviceTrustService = {

  /**
   * Check if a device is trusted for course access.
   * Called before navigating to the learn screen.
   */
  async checkTrustStatus(userId: string, input: CheckDeviceTrustInput): Promise<DeviceTrustCheckResult> {
    const binding = await prisma.deviceBinding.findFirst({
      where: { userId, deviceId: input.deviceId, isActive: true },
    });

    // Get enrolled phone for context
    const user = await prisma.user.findUnique({
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
    const hashMatches = isFingerprintMatch(binding.fingerprintHash, input.fingerprintHash);

    // Update last seen
    await prisma.deviceBinding.update({
      where: { id: binding.id },
      data: {
        lastSeenAt: new Date(),
        fingerprintHash: input.fingerprintHash,
      },
    });

    const isTrusted =
      binding.isTrustedForCourseAccess &&
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
  async sendDeviceTrustOtp(userId: string, input: SendDeviceTrustOtpInput, ipAddress: string): Promise<SendOtpResult> {
    if (!env.TWOFACTOR_API_KEY) {
      throw new Error('SMS service not configured');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, phoneVerified: true, deviceTrustOtpSession: true },
    });

    if (!user) throw new Error('User not found');
    if (!user.phone) throw new Error('No enrolled phone number found. Please update your profile.');
    if (!user.phoneVerified) throw new Error('Phone number not yet verified. Please verify your phone first.');

    // ─── SIM phone number mismatch check ──────────────────────────────────────
    // If the app could read the SIM phone number, verify it matches enrolled phone
    const simPhone = (input.simPhoneNumber ?? '').trim();
    if (simPhone.length >= 10) {
      const match = phonesMatch(user.phone, simPhone);
      if (!match) {
        // Log the failed attempt
        await prisma.verificationLog.create({
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

    // ─── OTP rate limiting ────────────────────────────────────────────────────
    // Re-use 2Factor session; don't spam if called within cooldown
    // (no timestamp stored, so just attempt — 2Factor handles its own throttle)

    // ─── Send OTP via 2Factor ─────────────────────────────────────────────────
    const phone10 = normalizePhone(user.phone);
    const templateSegment = env.SMS_RETRIEVER_TEMPLATE ? `/${env.SMS_RETRIEVER_TEMPLATE}` : '';
    const url = `https://2factor.in/API/V1/${env.TWOFACTOR_API_KEY}/SMS/${phone10}/AUTOGEN${templateSegment}`;
    const tfRes = await fetch(url);
    const tfData = (await tfRes.json()) as { Status: string; Details: string };

    if (tfData.Status !== 'Success') {
      throw new Error(`Failed to send OTP: ${tfData.Details}`);
    }

    // Store OTP session in dedicated field (separate from account phone verify session)
    await prisma.user.update({
      where: { id: userId },
      data: { deviceTrustOtpSession: tfData.Details },
    });

    // Create/update device binding (doesn't trust yet)
    await getOrCreateDeviceBinding(userId, input);

    return { success: true, maskedPhone: maskPhone(user.phone) };
  },

  /**
   * Verify OTP and mark device as trusted for course access.
   */
  async verifyDeviceTrustOtp(
    userId: string,
    input: VerifyDeviceTrustOtpInput,
    ipAddress: string,
  ): Promise<VerifyOtpResult> {
    if (!env.TWOFACTOR_API_KEY) {
      throw new Error('SMS service not configured');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, phoneVerified: true, deviceTrustOtpSession: true },
    });

    if (!user) throw new Error('User not found');
    if (!user.deviceTrustOtpSession) {
      throw Object.assign(new Error('No OTP session found. Please request a new OTP.'), {
        statusCode: 400,
      });
    }

    // ─── Verify OTP with 2Factor ──────────────────────────────────────────────
    const verifyUrl = `https://2factor.in/API/V1/${env.TWOFACTOR_API_KEY}/SMS/VERIFY/${user.deviceTrustOtpSession}/${input.otp}`;
    const tfRes = await fetch(verifyUrl);
    const tfData = (await tfRes.json()) as { Status: string; Details: string };

    if (tfData.Status !== 'Success' || !tfData.Details.includes('OTP Matched')) {
      // Log failed attempt
      await prisma.verificationLog.create({
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

    const trustedBinding = await prisma.deviceBinding.update({
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
    await prisma.user.update({
      where: { id: userId },
      data: { deviceTrustOtpSession: null },
    });

    // Audit log
    await prisma.verificationLog.create({
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
};
