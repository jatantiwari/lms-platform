import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import {
  AppError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { sendEmail, verificationEmailTemplate, passwordResetTemplate } from '../utils/email';
import { s3ImageUrl } from '../services/s3.service';
import { env } from '../config/env';
import prisma from '../config/prisma';
import {
  generateOtp,
  sendOtpViaTwoFactor,
  encodeOtpSession,
  decodeOtpSession,
  verifyOtpHash,
} from '../utils/twoFactor';
import crypto from 'crypto';

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  const hashed = await hashPassword(password);

  // Generate 6-digit verification code (expires 15 minutes)
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExp = new Date(Date.now() + 15 * 60 * 1000);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, phone: phone ?? null, verificationCode, verificationCodeExp },
    select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, emailVerified: true, phoneVerified: true, instructorApproved: true, createdAt: true },
  });

  // Send verification email (non-blocking)
  void sendEmail({
    to: email,
    subject: 'Verify your ADI Boost account',
    html: verificationEmailTemplate(name, verificationCode),
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, email: user.email });

  // Persist refresh token hash
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await hashPassword(refreshToken) },
  });

  sendSuccess(res, { user, accessToken, refreshToken }, 'Account created successfully', 201);
});

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) throw new UnauthorizedError('Account is deactivated. Contact support.');

  const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, email: user.email });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await hashPassword(refreshToken) },
  });

  const { password: _, refreshToken: __, ...safeUser } = user;

  sendSuccess(res, { user: safeUser, accessToken, refreshToken }, 'Logged in successfully');
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new UnauthorizedError('Refresh token required');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user?.refreshToken) throw new UnauthorizedError('Session invalidated. Please log in again.');

  const isValid = await comparePassword(token, user.refreshToken);
  if (!isValid) throw new UnauthorizedError('Invalid refresh token');

  const newAccessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await hashPassword(newRefreshToken) },
  });

  sendSuccess(
    res,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    'Tokens refreshed',
  );
});

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = catchAsync(async (req: Request, res: Response) => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshToken: null },
    });
  }
  sendSuccess(res, null, 'Logged out successfully');
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) {
    sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: passwordResetTemplate(user.name, resetUrl),
  });

  sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
});

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashed = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExp: null, refreshToken: null },
  });

  sendSuccess(res, null, 'Password reset successfully. Please log in.');
});

// ─── Get Me ───────────────────────────────────────────────────────────────────

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      headline: true,
      website: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      instructorApproved: true,
      createdAt: true,
      _count: {
        select: { enrollments: true, courses: true },
      },
    },
  });

  if (!user) throw new NotFoundError('User');
  sendSuccess(res, { ...user, avatar: await s3ImageUrl(user.avatar) }, 'User fetched');
});

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  if (user.emailVerified) {
    // Return the full user object so the frontend can safely call setUser
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        emailVerified: true, instructorApproved: true, createdAt: true,
      },
    });
    sendSuccess(res, fullUser, 'Email already verified');
    return;
  }

  if (!user.verificationCode || !user.verificationCodeExp) {
    throw new AppError('No verification code found. Please request a new one.', 400);
  }

  if (new Date() > user.verificationCodeExp) {
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }

  if (user.verificationCode !== code) {
    throw new AppError('Invalid verification code.', 400);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, verificationCode: null, verificationCodeExp: null },
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      emailVerified: true, instructorApproved: true, createdAt: true,
    },
  });

  sendSuccess(res, updated, 'Email verified successfully');
});

// ─── Resend Verification ──────────────────────────────────────────────────────

// ─── Send Phone OTP ─────────────────────────────────────────────────────────

export const sendPhoneOtp = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, phoneVerified: true },
  });
  if (!user) throw new NotFoundError('User');
  if (user.phoneVerified) throw new AppError('Phone number is already verified', 400);
  if (!user.phone) throw new AppError('No phone number found. Update your profile first.', 400);

  if (!env.TWOFACTOR_API_KEY) throw new AppError('SMS service not configured', 503);

  // Strip to digits only — 2Factor expects 10-digit Indian number
  const phone = user.phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);

  const otp = generateOtp(6);
  const appHash = typeof req.body?.appHash === 'string' ? req.body.appHash : undefined;
  await sendOtpViaTwoFactor(phone, otp, appHash,"OTP1");

  await prisma.user.update({
    where: { id: userId },
    data: { phoneOtpSession: encodeOtpSession(otp) },
  });

  sendSuccess(res, {}, 'OTP sent to your registered mobile number');
});

// ─── Verify Phone OTP ────────────────────────────────────────────────────────

export const verifyPhoneOtp = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { otp } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phoneOtpSession: true, phoneVerified: true },
  });
  if (!user) throw new NotFoundError('User');
  if (user.phoneVerified) throw new AppError('Phone number is already verified', 400);
  if (!user.phoneOtpSession) {
    throw new AppError('No OTP session found. Please request a new OTP first.', 400);
  }

  if (!env.TWOFACTOR_API_KEY) throw new AppError('SMS service not configured', 503);

  // Verify OTP locally against stored hash
  const decoded = decodeOtpSession(user.phoneOtpSession);
  if (!decoded || !verifyOtpHash(otp, decoded.hash)) {
    throw new AppError('Invalid or expired OTP. Please try again.', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { phoneVerified: true, phoneOtpSession: null },
  });

  sendSuccess(res, {}, 'Phone number verified successfully');
});

// ─── Resend Verification ──────────────────────────────────────────────────────

export const resendVerification = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  if (user.emailVerified) {
    sendSuccess(res, null, 'Email is already verified');
    return;
  }

  // Rate-limit: don't resend if code was generated less than 2 minutes ago
  if (user.verificationCodeExp) {
    const msUntilExpiry = user.verificationCodeExp.getTime() - Date.now();
    const msTotal = 15 * 60 * 1000;
    if (msUntilExpiry > msTotal - 2 * 60 * 1000) {
      throw new AppError('Please wait before requesting another code.', 429);
    }
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExp = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { verificationCode, verificationCodeExp },
  });

  void sendEmail({
    to: user.email,
    subject: 'Your ADI Boost verification code',
    html: verificationEmailTemplate(user.name, verificationCode),
  });

  sendSuccess(res, null, 'Verification code sent');
});
