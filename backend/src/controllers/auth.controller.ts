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
import { sendEmail, welcomeEmailTemplate, passwordResetTemplate } from '../utils/email';
import prisma from '../config/prisma';
import crypto from 'crypto';

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });

  // Send welcome email (non-blocking)
  void sendEmail({
    to: email,
    subject: 'Welcome to LMS Platform!',
    html: welcomeEmailTemplate(name),
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
      emailVerified: true,
      createdAt: true,
      _count: {
        select: { enrollments: true, courses: true },
      },
    },
  });

  if (!user) throw new NotFoundError('User');
  sendSuccess(res, user, 'User fetched');
});
