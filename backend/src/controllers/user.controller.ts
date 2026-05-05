import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, paginationMeta } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import { hashPassword } from '../utils/password';
import { uploadToS3, removeFromS3, s3ImageUrl, extractS3Key } from '../services/s3.service';
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

  // Refresh presigned URLs for avatar and course thumbnails
  const freshUser = {
    ...user,
    avatar: await s3ImageUrl(user.avatar),
    courses: await Promise.all(
      user.courses.map(async (c) => ({ ...c, thumbnail: await s3ImageUrl(c.thumbnail) })),
    ),
  };
  sendSuccess(res, freshUser, 'Profile fetched');
});

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { name, bio, headline, website, phone } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, bio, headline, website, phone: phone || null },
    select: {
      id: true, name: true, email: true, role: true,
      avatar: true, bio: true, headline: true, website: true, phone: true,
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

  // Delete old avatar from S3 — handle both public URLs and presigned URLs
  if (existingUser?.avatar) {
    const oldKey = extractS3Key(existingUser.avatar);
    await removeFromS3(oldKey).catch(() => {/* ignore if delete fails */});
  }

  const { key, url } = await uploadToS3(
    req.file.buffer,
    `avatars`,
    req.file.originalname,
    req.file.mimetype,
  );

  // Store the S3 key (not the presigned URL) so we can always re-sign it later
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: key },
    select: { id: true, name: true, avatar: true },
  });

  // Return the fresh presigned URL to the client
  sendSuccess(res, { ...user, avatar: url }, 'Avatar updated');
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

// ─── Push Token ───────────────────────────────────────────────────────────────

export const updatePushToken = catchAsync(async (req: Request, res: Response) => {
  const { pushToken, platform } = req.body as { pushToken: string; platform?: string };
  const userId = req.user!.userId;
  await prisma.user.update({
    where: { id: userId },
    data: { pushToken, pushTokenPlatform: platform ?? null },
  });
  sendSuccess(res, null, 'Push token updated');
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
