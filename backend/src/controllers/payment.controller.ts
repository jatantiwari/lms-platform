import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError, AppError } from '../utils/AppError';
import { createDummyOrder } from '../services/payment.service';
import { sendEmail, enrollmentConfirmTemplate } from '../utils/email';
import prisma from '../config/prisma';

// ─── Create Order (Dummy) ─────────────────────────────────────────────────────

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { courseId } = req.body;

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: 'PUBLISHED' },
  });
  if (!course) throw new NotFoundError('Course');

  // Prevent duplicate enrollment
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) throw new AppError('You are already enrolled in this course', 409);

  // Free course → enroll directly without creating a payment record
  if (Number(course.price) === 0) {
    await enrollUser(userId, courseId, course.title);
    sendSuccess(res, { enrolled: true }, 'Enrolled in free course successfully');
    return;
  }

  const effectivePrice = course.discountPrice ?? course.price;
  const order = createDummyOrder(Number(effectivePrice));

  // Create a pending payment record
  await prisma.payment.create({
    data: {
      amount: effectivePrice,
      currency: 'INR',
      status: 'PENDING',
      razorpayOrderId: order.orderId,
      userId,
      courseId,
    },
  });

  sendSuccess(res, {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    courseName: course.title,
  }, 'Order created');
});

// ─── Confirm Dummy Payment ─────────────────────────────────────────────────────

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { orderId } = req.body;

  if (!orderId) throw new AppError('orderId is required', 400);

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    include: { course: true, user: true },
  });
  if (!payment) throw new NotFoundError('Payment record');
  if (payment.userId !== userId) throw new ForbiddenError('Payment does not belong to you');
  if (payment.status === 'COMPLETED') {
    sendSuccess(res, { enrolled: true }, 'Already enrolled');
    return;
  }

  // Mark payment complete and create enrollment atomically
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    }),
    prisma.enrollment.create({
      data: { userId, courseId: payment.courseId },
    }),
    prisma.course.update({
      where: { id: payment.courseId },
      data: { totalStudents: { increment: 1 } },
    }),
  ]);

  // Send enrollment confirmation email (non-blocking)
  void sendEmail({
    to: payment.user.email,
    subject: `Enrollment Confirmed: ${payment.course.title}`,
    html: enrollmentConfirmTemplate(payment.user.name, payment.course.title),
  });

  sendSuccess(res, { enrolled: true, courseSlug: payment.course.slug }, 'Payment confirmed and enrolled');
});

// ─── Payment History ──────────────────────────────────────────────────────────

export const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true, slug: true, thumbnail: true } },
    },
  });

  sendSuccess(res, payments, 'Payment history');
});

// ─── Private helper ───────────────────────────────────────────────────────────

async function enrollUser(userId: string, courseId: string, courseTitle: string): Promise<void> {
  const [, user] = await prisma.$transaction([
    prisma.enrollment.create({ data: { userId, courseId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    prisma.course.update({ where: { id: courseId }, data: { totalStudents: { increment: 1 } } }),
  ]);

  if (user) {
    void sendEmail({
      to: user.email,
      subject: `Enrollment Confirmed: ${courseTitle}`,
      html: enrollmentConfirmTemplate(user.name, courseTitle),
    });
  }
}

