import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AppError, ForbiddenError } from '../utils/AppError';
import { deviceTrustService } from '../services/deviceTrust.service';
import {
  sendDeviceTrustOtpSchema,
  verifyDeviceTrustOtpSchema,
  checkDeviceTrustSchema,
  updatePhoneSchema,
  initSmsVerifySchema,
  smsWebhookSchema,
} from '../validations/deviceTrust.validation';
import prisma from '../config/prisma';
import { env } from '../config/env';
import {
  generateOtp,
  sendOtpViaTwoFactor,
  encodeOtpSession,
  decodeOtpSession,
  verifyOtpHash,
} from '../utils/twoFactor';

// ─── Check device trust status ────────────────────────────────────────────────

export const checkDeviceTrust = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const parsed = checkDeviceTrustSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(`Invalid query: ${parsed.error.issues[0].message}`, 400);
  }

  const result = await deviceTrustService.checkTrustStatus(userId, parsed.data);
  sendSuccess(res, result, 'Device trust status');
});

// ─── Send OTP for device trust verification ───────────────────────────────────

export const sendDeviceTrustOtp = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const parsed = sendDeviceTrustOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  try {
    const result = await deviceTrustService.sendDeviceTrustOtp(userId, parsed.data, ipAddress);
    sendSuccess(res, result, `OTP sent to your registered mobile number`);
  } catch (err: unknown) {
    const e = err as Error & { code?: string; statusCode?: number };
    if (e.code === 'PHONE_MISMATCH') {
      throw new ForbiddenError(e.message);
    }
    throw new AppError(e.message ?? 'Failed to send OTP', e.statusCode ?? 500);
  }
});

// ─── Verify OTP + mark device as trusted ──────────────────────────────────────

export const verifyDeviceTrustOtp = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const parsed = verifyDeviceTrustOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  try {
    const result = await deviceTrustService.verifyDeviceTrustOtp(userId, parsed.data, ipAddress);
    sendSuccess(res, result, 'Device verified successfully. Course access granted.');
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    throw new AppError(e.message ?? 'Verification failed', e.statusCode ?? 400);
  }
});

// ─── One-time phone number update ─────────────────────────────────────────────

export const updatePhone = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const parsed = updatePhoneSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
  }

  const { newPhone, otp } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, isPhoneUpdated: true, deviceTrustOtpSession: true },
  });
  if (!user) throw new AppError('User not found', 404);
  if (user.isPhoneUpdated) {
    throw new ForbiddenError('Phone number can only be changed once. This user has already updated their phone number.');
  }

  const normalizePhone = (p: string) => p.replace(/\D/g, '').replace(/^91/, '').slice(-10);
  const normalizedNew = normalizePhone(newPhone);
  const normalizedCurrent = user.phone ? normalizePhone(user.phone) : '';

  if (normalizedNew === normalizedCurrent) {
    throw new AppError('New phone number is the same as the current phone number.', 400);
  }

  // Phase 1: No OTP yet → send OTP to the NEW number
  if (!otp) {
    if (!env.TWOFACTOR_API_KEY) throw new AppError('SMS service not configured', 503);

    const phone10 = normalizePhone(newPhone);
    const generatedOtp = generateOtp(6);

    await sendOtpViaTwoFactor(phone10, generatedOtp,undefined,"OTP1");

    // Store encoded session (hash|expiry) with PHONE_CHANGE prefix
    await prisma.user.update({
      where: { id: userId },
      data: { deviceTrustOtpSession: `PHONE_CHANGE:${newPhone}:${encodeOtpSession(generatedOtp)}` },
    });

    sendSuccess(res, {}, `OTP sent to ${newPhone.slice(0, 3)}****${newPhone.slice(-3)}`);
    return;
  }

  // Phase 2: OTP provided → verify and finalize
  if (!user.deviceTrustOtpSession?.startsWith('PHONE_CHANGE:')) {
    throw new AppError('No phone change session found. Please initiate the process again.', 400);
  }

  const [, sessionPhone, encodedSession] = user.deviceTrustOtpSession.split(':');

  // Ensure the OTP is for the same new phone
  if (normalizePhone(sessionPhone) !== normalizedNew) {
    throw new AppError('Phone number mismatch. Please restart the process.', 400);
  }

  if (!env.TWOFACTOR_API_KEY) throw new AppError('SMS service not configured', 503);

  // Verify OTP locally against stored hash
  const decoded = decodeOtpSession(encodedSession);
  if (!decoded || !verifyOtpHash(otp, decoded.hash)) {
    throw new AppError('Invalid or expired OTP.', 400);
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  // Update phone + log + revoke device trust (force re-verification on all devices)
  await prisma.$transaction([
    prisma.user.update({
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
    prisma.phoneChangeLog.create({
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
    prisma.deviceBinding.updateMany({
      where: { userId, isActive: true },
      data: {
        isTrustedForCourseAccess: false,
        requiresReverification: true,
        verifiedMobileNumber: null,
      },
    }),
  ]);

  // Audit log
  await prisma.verificationLog.create({
    data: {
      userId,
      type: 'PHONE_CHANGE',
      status: 'SUCCESS',
      phone: `${newPhone.slice(0, 3)}****${newPhone.slice(-3)}`,
      ipAddress,
      platform: 'mobile',
    },
  });

  sendSuccess(res, {}, 'Phone number updated successfully. Please re-verify your device for course access.');
});

// ─── Init mobile-originated SMS verification ──────────────────────────────────

export const initSmsVerify = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const parsed = initSmsVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(`Validation error: ${parsed.error.issues[0].message}`, 400);
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  try {
    const result = await deviceTrustService.initSmsVerify(userId, parsed.data, ipAddress);
    sendSuccess(res, result, 'SMS verification initiated');
  } catch (err: unknown) {
    const e = err as Error & { code?: string; statusCode?: number };
    if (e.code === 'PHONE_MISMATCH') throw new ForbiddenError(e.message);
    throw new AppError(e.message ?? 'Failed to initiate SMS verification', e.statusCode ?? 500);
  }
});

// ─── Poll SMS verify status ───────────────────────────────────────────────────

export const smsVerifyStatus = catchAsync(async (req: Request, res: Response) => {
  const { sessionToken } = req.query;
  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length !== 40) {
    throw new AppError('Invalid sessionToken', 400);
  }
  const result = deviceTrustService.checkSmsVerifyStatus(sessionToken);
  sendSuccess(res, result, 'SMS verify status');
});

// ─── SMS webhook (Twilio / 2Factor inbound) ───────────────────────────────────
// This endpoint is called by the SMS gateway when a device sends an SMS to our number.
// No auth middleware — protected by webhook secret header.

export const smsWebhook = catchAsync(async (req: Request, res: Response) => {
  // Validate webhook secret to prevent spoofing
  if (env.SMS_WEBHOOK_SECRET) {
    const provided = req.headers['x-webhook-secret'] ?? req.headers['x-twilio-signature'];
    if (!provided || provided !== env.SMS_WEBHOOK_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const parsed = smsWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    // Respond 200 to prevent gateway retry loops
    res.status(200).json({ status: 'ignored' });
    return;
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  await deviceTrustService.processSmsWebhook(
    parsed.data.From,
    parsed.data.Body,
    ipAddress,
  );

  // Always respond 200 to SMS gateways
  res.status(200).json({ status: 'ok' });
});
