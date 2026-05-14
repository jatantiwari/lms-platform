import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError, ConflictError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { sendEmail, seoLeadInstructorTemplate, seoLeadStudentAckTemplate } from '../utils/email';

type InstructorRecord = {
  id: string;
  name: string;
  email: string;
  role: 'INSTRUCTOR' | 'ADMIN' | 'STUDENT';
};

async function resolveInstructor(): Promise<InstructorRecord> {
  let instructor: InstructorRecord | null = null;

  const configuredId = env.DEFAULT_INSTRUCTOR_ID;
  if (configuredId) {
    instructor = await prisma.user.findFirst({
      where: { id: configuredId, role: 'INSTRUCTOR' },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  if (!instructor) {
    instructor = await prisma.user.findFirst({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  if (!instructor) {
    throw new AppError('Platform configuration error: no instructor account found in database', 500);
  }

  return instructor;
}

export const submitSeoLead = catchAsync(async (req: Request, res: Response) => {
  const { fullName, email, phone, message } = req.body as {
    fullName?: string;
    email?: string;
    phone?: string;
    message?: string;
  };

  if (!fullName?.trim()) throw new AppError('fullName is required', 400);
  if (!email?.trim()) throw new AppError('email is required', 400);
  if (!message?.trim()) throw new AppError('message is required', 400);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Invalid email address', 400);
  }

  const instructor = await resolveInstructor();

  const lead = await prisma.seoContactLead.create({
    data: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message.trim(),
      instructorId: instructor.id,
    },
  });

  void sendEmail({
    to: instructor.email,
    subject: `New Contact Lead: ${fullName.trim()}`,
    html: seoLeadInstructorTemplate(instructor.name, {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      message: message.trim(),
    }),
  });

  void sendEmail({
    to: email.trim().toLowerCase(),
    subject: 'We received your message - Financial Freedom Mentor',
    html: seoLeadStudentAckTemplate(fullName.trim()),
  });

  sendSuccess(
    res,
    { leadId: lead.id },
    'Thank you! We have received your message and will contact you soon.',
    201,
  );
});

export const subscribeSeoNewsletter = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) throw new AppError('email is required', 400);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Invalid email address', 400);
  }

  const instructor = await resolveInstructor();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.seoSubscriber.findUnique({
    where: {
      email_instructorId: {
        email: normalizedEmail,
        instructorId: instructor.id,
      },
    },
  });

  if (existing) {
    if (!existing.isActive) {
      await prisma.seoSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }

    sendSuccess(res, { subscribed: true, alreadySubscribed: true }, 'Email already subscribed');
    return;
  }

  try {
    await prisma.seoSubscriber.create({
      data: {
        email: normalizedEmail,
        instructorId: instructor.id,
      },
    });
  } catch {
    throw new ConflictError('This email is already subscribed');
  }

  sendSuccess(res, { subscribed: true }, 'Subscribed successfully', 201);
});
