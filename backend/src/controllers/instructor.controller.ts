import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AppError, NotFoundError, ConflictError, ForbiddenError } from '../utils/AppError';
import { sendEmail, instructorApprovedEmailTemplate, instructorRejectedEmailTemplate } from '../utils/email';
import prisma from '../config/prisma';

// ─── Apply as Instructor ──────────────────────────────────────────────────────

export const applyAsInstructor = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { teachingExperience, expertise, bio, linkedIn, website } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { instructorProfile: true },
  });

  if (!user) throw new NotFoundError('User');
  if (user.role !== 'INSTRUCTOR') throw new ForbiddenError('Only instructors can apply');
  if (user.instructorApproved) {
    throw new AppError('Your instructor account is already approved', 400);
  }

  if (user.instructorProfile) {
    if (user.instructorProfile.status === 'PENDING') {
      throw new ConflictError('You already have a pending application');
    }
    // Allow reapplication if rejected — update the existing record
    const updated = await prisma.instructorProfile.update({
      where: { userId },
      data: {
        teachingExperience,
        expertise: Array.isArray(expertise) ? expertise : [expertise],
        bio,
        linkedIn: linkedIn ?? null,
        website: website ?? null,
        status: 'PENDING',
        rejectionReason: null,
        reviewedAt: null,
      },
    });
    sendSuccess(res, updated, 'Application resubmitted', 200);
    return;
  }

  const profile = await prisma.instructorProfile.create({
    data: {
      userId,
      teachingExperience,
      expertise: Array.isArray(expertise) ? expertise : [expertise],
      bio,
      linkedIn: linkedIn ?? null,
      website: website ?? null,
    },
  });

  sendSuccess(res, profile, 'Instructor application submitted', 201);
});

// ─── Get My Application ───────────────────────────────────────────────────────

export const getMyApplication = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const profile = await prisma.instructorProfile.findUnique({ where: { userId } });
  sendSuccess(res, profile, 'Application fetched');
});

// ─── List Applications (Admin) ────────────────────────────────────────────────

export const listApplications = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };

  const applications = await prisma.instructorProfile.findMany({
    where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, createdAt: true },
      },
    },
  });

  sendSuccess(res, applications, 'Applications fetched');
});

// ─── Review Application (Admin) ───────────────────────────────────────────────

export const reviewApplication = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Status must be APPROVED or REJECTED', 400);
  }

  const profile = await prisma.instructorProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!profile) throw new NotFoundError('Instructor application');

  const updated = await prisma.instructorProfile.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? (rejectionReason ?? null) : null,
      reviewedAt: new Date(),
    },
  });

  // Update instructorApproved on the user
  await prisma.user.update({
    where: { id: profile.userId },
    data: { instructorApproved: status === 'APPROVED' },
  });

  // Send notification email (non-blocking)
  if (status === 'APPROVED') {
    void sendEmail({
      to: profile.user.email,
      subject: 'Your instructor application has been approved!',
      html: instructorApprovedEmailTemplate(profile.user.name),
    });
  } else {
    void sendEmail({
      to: profile.user.email,
      subject: 'Update on your instructor application',
      html: instructorRejectedEmailTemplate(profile.user.name, rejectionReason ?? ''),
    });
  }

  sendSuccess(res, updated, `Application ${status.toLowerCase()}`);
});
