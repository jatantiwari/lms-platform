"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentHistory = exports.verifyPayment = exports.createOrder = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const payment_service_1 = require("../services/payment.service");
const email_1 = require("../utils/email");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Create Order (Dummy) ─────────────────────────────────────────────────────
exports.createOrder = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.body;
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId, status: 'PUBLISHED' },
    });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    // Prevent duplicate enrollment
    const existing = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (existing)
        throw new AppError_1.AppError('You are already enrolled in this course', 409);
    // Free course → enroll directly without creating a payment record
    if (Number(course.price) === 0) {
        await enrollUser(userId, courseId, course.title);
        (0, response_1.sendSuccess)(res, { enrolled: true }, 'Enrolled in free course successfully');
        return;
    }
    const effectivePrice = course.discountPrice ?? course.price;
    const order = (0, payment_service_1.createDummyOrder)(Number(effectivePrice));
    // Create a pending payment record
    await prisma_1.default.payment.create({
        data: {
            amount: effectivePrice,
            currency: 'INR',
            status: 'PENDING',
            razorpayOrderId: order.orderId,
            userId,
            courseId,
        },
    });
    (0, response_1.sendSuccess)(res, {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        courseName: course.title,
    }, 'Order created');
});
// ─── Confirm Dummy Payment ─────────────────────────────────────────────────────
exports.verifyPayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { orderId } = req.body;
    if (!orderId)
        throw new AppError_1.AppError('orderId is required', 400);
    const payment = await prisma_1.default.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: { course: true, user: true },
    });
    if (!payment)
        throw new AppError_1.NotFoundError('Payment record');
    if (payment.userId !== userId)
        throw new AppError_1.ForbiddenError('Payment does not belong to you');
    if (payment.status === 'COMPLETED') {
        (0, response_1.sendSuccess)(res, { enrolled: true }, 'Already enrolled');
        return;
    }
    // Mark payment complete and create enrollment atomically
    await prisma_1.default.$transaction([
        prisma_1.default.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED' },
        }),
        prisma_1.default.enrollment.create({
            data: { userId, courseId: payment.courseId },
        }),
        prisma_1.default.course.update({
            where: { id: payment.courseId },
            data: { totalStudents: { increment: 1 } },
        }),
    ]);
    // Send enrollment confirmation email (non-blocking)
    void (0, email_1.sendEmail)({
        to: payment.user.email,
        subject: `Enrollment Confirmed: ${payment.course.title}`,
        html: (0, email_1.enrollmentConfirmTemplate)(payment.user.name, payment.course.title),
    });
    (0, response_1.sendSuccess)(res, { enrolled: true, courseSlug: payment.course.slug }, 'Payment confirmed and enrolled');
});
// ─── Payment History ──────────────────────────────────────────────────────────
exports.getPaymentHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const payments = await prisma_1.default.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            course: { select: { id: true, title: true, slug: true, thumbnail: true } },
        },
    });
    (0, response_1.sendSuccess)(res, payments, 'Payment history');
});
// ─── Private helper ───────────────────────────────────────────────────────────
async function enrollUser(userId, courseId, courseTitle) {
    const [, user] = await prisma_1.default.$transaction([
        prisma_1.default.enrollment.create({ data: { userId, courseId } }),
        prisma_1.default.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
        prisma_1.default.course.update({ where: { id: courseId }, data: { totalStudents: { increment: 1 } } }),
    ]);
    if (user) {
        void (0, email_1.sendEmail)({
            to: user.email,
            subject: `Enrollment Confirmed: ${courseTitle}`,
            html: (0, email_1.enrollmentConfirmTemplate)(user.name, courseTitle),
        });
    }
}
//# sourceMappingURL=payment.controller.js.map