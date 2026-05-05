import { Request, Response } from 'express';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AppError, NotFoundError, ConflictError, ForbiddenError } from '../utils/AppError';
import { hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import {
  sendEmail,
  seoStudentCredentialsTemplate,
  seoInstructorNotificationTemplate,
  seoPaymentConfirmedTemplate,
  seoEnrollmentConfirmTemplate,
} from '../utils/email';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/payment.service';
import { env } from '../config/env';
import prisma from '../config/prisma';

// ─── Plan → Amount map ─────────────────────────────────────────────────────────

const PLAN_AMOUNTS: Record<string, number> = {
  Basic: 10000,
  Pro: 25000,
  Elite: 50000,
};

// ─── Utility: generate a readable random password ─────────────────────────────

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  return Array.from(crypto.randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

// ─── POST /seo-registration/register ─────────────────────────────────────────
// Public endpoint — called by the lms-seo marketing site registration form.
// 1. Creates a STUDENT user account with auto-generated password.
// 2. Creates a SeoRegistration record linked to the default instructor.
// 3. Creates a Razorpay order.
// 4. Emails credentials to the student + notification to the instructor.

export const seoRegister = catchAsync(async (req: Request, res: Response) => {
  const {
    studentName,
    fatherGuardianName,
    mobileNumber,
    emailId,
    address,
    educationalQualification,
    occupation,
    preferredCoursePlan,
    previousCommodityTradingExperience,
    whyJoin,
  } = req.body as Record<string, string>;

  // Validate required fields
  const required = [
    'studentName', 'fatherGuardianName', 'mobileNumber', 'emailId',
    'address', 'educationalQualification', 'occupation',
    'preferredCoursePlan', 'whyJoin',
  ];
  for (const field of required) {
    if (!req.body[field]?.trim()) {
      throw new AppError(`${field} is required`, 400);
    }
  }

  // Validate plan
  const plan = preferredCoursePlan;
  const amount = PLAN_AMOUNTS[plan];
  if (!amount) throw new AppError('Invalid course plan selected', 400);

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
    throw new AppError('Invalid email address', 400);
  }

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: emailId } });
  if (existing) throw new ConflictError('An account with this email already exists. Please login.');

  // Resolve instructor
  const instructorId = env.DEFAULT_INSTRUCTOR_ID;
  if (!instructorId) throw new AppError('Platform configuration error: instructor not set', 500);

  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!instructor || instructor.role !== 'INSTRUCTOR') {
    throw new AppError('Platform configuration error: instructor not found', 500);
  }

  // Generate credentials
  const plainPassword = generatePassword();
  const hashedPassword = await hashPassword(plainPassword);

  // Create STUDENT user
  const user = await prisma.user.create({
    data: {
      name: studentName,
      email: emailId,
      password: hashedPassword,
      role: 'STUDENT',
      phone: mobileNumber,
      emailVerified: true, // auto-verify since we're creating via admin flow
    },
    select: { id: true, name: true, email: true, role: true },
  });

  // Create Razorpay order
  const order = await createRazorpayOrder(amount, `seo_${user.id}`);

  // Create SeoRegistration record
  const registration = await prisma.seoRegistration.create({
    data: {
      studentName,
      fatherGuardianName,
      mobileNumber,
      emailId,
      address,
      educationalQualification,
      occupation,
      preferredCoursePlan: plan,
      previousTradingExperience: previousCommodityTradingExperience ?? 'No',
      whyJoin,
      amount,
      razorpayOrderId: order.orderId,
      userId: user.id,
      instructorId: instructor.id,
    },
  });

  const loginUrl = `${env.FRONTEND_URL}/login`;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard/instructor/students`;

  // Fire emails non-blocking
  void sendEmail({
    to: emailId,
    subject: `Welcome to Financial Freedom Mentor — Your Login Credentials`,
    html: seoStudentCredentialsTemplate(studentName, emailId, plainPassword, plan, loginUrl),
  });

  void sendEmail({
    to: instructor.email,
    subject: `New Student Registered: ${studentName} (${plan} Plan)`,
    html: seoInstructorNotificationTemplate(
      instructor.name,
      {
        name: studentName,
        email: emailId,
        mobile: mobileNumber,
        plan,
        occupation,
        experience: previousCommodityTradingExperience ?? 'No',
        whyJoin,
      },
      dashboardUrl,
    ),
  });

  sendSuccess(
    res,
    {
      registrationId: registration.id,
      userId: user.id,
      razorpayOrderId: order.orderId,
      amount: order.amount,      // paise
      currency: order.currency,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      studentName,
      emailId,
    },
    'Registration successful. Please complete the payment.',
    201,
  );
});

// ─── POST /seo-registration/verify-payment ───────────────────────────────────
// Called by the frontend after Razorpay payment modal closes successfully.

export const seoVerifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as Record<string, string>;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('razorpayOrderId, razorpayPaymentId, and razorpaySignature are required', 400);
  }

  // Verify signature
  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) throw new AppError('Payment verification failed: invalid signature', 400);

  const registration = await prisma.seoRegistration.findUnique({
    where: { razorpayOrderId },
    include: { user: true },
  });
  if (!registration) throw new NotFoundError('Registration');
  if (registration.paymentStatus === 'COMPLETED') {
    sendSuccess(res, { alreadyPaid: true }, 'Payment already confirmed');
    return;
  }

  // Update registration
  await prisma.seoRegistration.update({
    where: { id: registration.id },
    data: {
      paymentStatus: 'COMPLETED',
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  // Send payment receipt to student
  void sendEmail({
    to: registration.emailId,
    subject: 'Payment Confirmed — Financial Freedom Mentor',
    html: seoPaymentConfirmedTemplate(
      registration.studentName,
      registration.preferredCoursePlan,
      registration.amount,
      razorpayPaymentId,
    ),
  });

  sendSuccess(res, { paid: true }, 'Payment confirmed successfully');
});

// ─── GET /seo-registration/students ──────────────────────────────────────────
// Instructor-only: view all registrations assigned to the logged-in instructor.

export const getMyStudents = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.userId;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const [students, total] = await Promise.all([
    prisma.seoRegistration.findMany({
      where: { instructorId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        enrolledCourse: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.seoRegistration.count({ where: { instructorId } }),
  ]);

  sendSuccess(res, { students, total, page, limit }, 'Students fetched');
});

// ─── POST /seo-registration/enroll ───────────────────────────────────────────
// Instructor-only: enroll a registered student into a specific course.

export const enrollStudent = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.userId;
  const { registrationId, courseId } = req.body as { registrationId: string; courseId: string };

  if (!registrationId || !courseId) {
    throw new AppError('registrationId and courseId are required', 400);
  }

  const registration = await prisma.seoRegistration.findUnique({
    where: { id: registrationId },
    include: { user: true },
  });
  if (!registration) throw new NotFoundError('Registration');
  if (registration.instructorId !== instructorId) {
    throw new ForbiddenError('This registration does not belong to you');
  }

  // Verify instructor owns the course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, slug: true, instructorId: true },
  });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== instructorId) {
    throw new ForbiddenError('You do not own this course');
  }

  const userId = registration.userId;

  // Upsert enrollment
  const alreadyEnrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!alreadyEnrolled) {
    await prisma.$transaction([
      prisma.enrollment.create({ data: { userId, courseId } }),
      prisma.course.update({ where: { id: courseId }, data: { totalStudents: { increment: 1 } } }),
    ]);
  }

  // Link the enrolled course to the registration record
  await prisma.seoRegistration.update({
    where: { id: registrationId },
    data: { enrolledCourseId: courseId },
  });

  const loginUrl = `${env.FRONTEND_URL}/learn/${course.slug}`;

  // Notify student
  void sendEmail({
    to: registration.emailId,
    subject: `You're enrolled in ${course.title} — Financial Freedom Mentor`,
    html: seoEnrollmentConfirmTemplate(registration.studentName, course.title, loginUrl),
  });

  sendSuccess(
    res,
    { enrolled: !alreadyEnrolled, courseId, courseTitle: course.title },
    alreadyEnrolled ? 'Student was already enrolled' : 'Student enrolled successfully',
  );
});
