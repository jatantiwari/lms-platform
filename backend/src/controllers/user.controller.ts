import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, paginationMeta } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import { hashPassword } from '../utils/password';
import { uploadToS3, removeFromS3 } from '../services/s3.service';
import prisma from '../config/prisma';

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      avatar: true,
      bio: true,
      headline: true,
      website: true,
      createdAt: true,
      courses: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true, title: true, slug: true, thumbnail: true,
          price: true, avgRating: true, totalStudents: true, level: true,
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { courses: true, enrollments: true } },
    },
  });

  if (!user) throw new NotFoundError('User');
  sendSuccess(res, user, 'Profile fetched');
});

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { name, bio, headline, website } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, bio, headline, website },
    select: {
      id: true, name: true, email: true, role: true,
      avatar: true, bio: true, headline: true, website: true,
    },
  });

  sendSuccess(res, user, 'Profile updated');
});

// ─── Upload Avatar ────────────────────────────────────────────────────────────

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new ForbiddenError('No image file provided');

  const userId = req.user!.userId;
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  // Delete old avatar from S3
  if (existingUser?.avatar) {
    const oldKey = new URL(existingUser.avatar).pathname.slice(1);
    await removeFromS3(oldKey).catch(() => {/* ignore if delete fails */});
  }

  const { url } = await uploadToS3(
    req.file.buffer,
    `avatars`,
    req.file.originalname,
    req.file.mimetype,
  );

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: url },
    select: { id: true, name: true, avatar: true },
  });

  sendSuccess(res, user, 'Avatar updated');
});

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const { comparePassword } = await import('../utils/password');
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new ForbiddenError('Current password is incorrect');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, refreshToken: null }, // invalidate sessions
  });

  sendSuccess(res, null, 'Password changed. Please log in again.');
});

// ─── Admin: List Users ────────────────────────────────────────────────────────

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(role ? { role: role as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, isActive: true, createdAt: true,
        _count: { select: { enrollments: true, courses: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, users, 'Users fetched', 200, paginationMeta(page, limit, total));
});

// ─── Admin: Toggle User Active ─────────────────────────────────────────────────

export const toggleUserActive = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true },
  });

  sendSuccess(res, updated, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
});
