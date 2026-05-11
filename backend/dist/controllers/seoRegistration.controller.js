"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollStudent = exports.getMyStudents = exports.seoVerifyPayment = exports.seoRegister = void 0;
const crypto_1 = __importDefault(require("crypto"));
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const password_1 = require("../utils/password");
const email_1 = require("../utils/email");
const payment_service_1 = require("../services/payment.service");
const env_1 = require("../config/env");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Plan → Amount map ─────────────────────────────────────────────────────────
const PLAN_AMOUNTS = {
    Basic: 10000,
    Pro: 25000,
    Elite: 50000,
};
// ─── Utility: generate a readable random password ─────────────────────────────
function generatePassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
    return Array.from(crypto_1.default.randomBytes(length))
        .map((b) => chars[b % chars.length])
        .join('');
}
// ─── POST /seo-registration/register ─────────────────────────────────────────
// Public endpoint — called by the lms-seo marketing site registration form.
// 1. Creates a STUDENT user account with auto-generated password.
// 2. Creates a SeoRegistration record linked to the default instructor.
// 3. Creates a Razorpay order.
// 4. Emails credentials to the student + notification to the instructor.
exports.seoRegister = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { studentName, fatherGuardianName, mobileNumber, emailId, address, educationalQualification, occupation, preferredCoursePlan, previousCommodityTradingExperience, whyJoin, } = req.body;
    // Validate required fields
    const required = [
        'studentName', 'fatherGuardianName', 'mobileNumber', 'emailId',
        'address', 'educationalQualification', 'occupation',
        'preferredCoursePlan', 'whyJoin',
    ];
    for (const field of required) {
        if (!req.body[field]?.trim()) {
            throw new AppError_1.AppError(`${field} is required`, 400);
        }
    }
    // Validate plan
    const plan = preferredCoursePlan;
    const amount = PLAN_AMOUNTS[plan];
    if (!amount)
        throw new AppError_1.AppError('Invalid course plan selected', 400);
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
        throw new AppError_1.AppError('Invalid email address', 400);
    }
    // Check for duplicate email
    const existing = await prisma_1.default.user.findUnique({ where: { email: emailId } });
    if (existing)
        throw new AppError_1.ConflictError('An account with this email already exists. Please login.');
    // Resolve instructor — prefer configured ID, fall back to first INSTRUCTOR in DB
    let instructor = null;
    const configuredId = env_1.env.DEFAULT_INSTRUCTOR_ID;
    if (configuredId) {
        instructor = await prisma_1.default.user.findFirst({
            where: { id: configuredId, role: 'INSTRUCTOR' },
            select: { id: true, name: true, email: true, role: true },
        });
    }
    if (!instructor) {
        instructor = await prisma_1.default.user.findFirst({
            where: { role: 'INSTRUCTOR' },
            select: { id: true, name: true, email: true, role: true },
        });
    }
    if (!instructor) {
        throw new AppError_1.AppError('Platform configuration error: no instructor account found in database', 500);
    }
    // Generate credentials
    const plainPassword = generatePassword();
    const hashedPassword = await (0, password_1.hashPassword)(plainPassword);
    // Create STUDENT user
    const user = await prisma_1.default.user.create({
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
    const order = await (0, payment_service_1.createRazorpayOrder)(amount, `seo_${user.id}`);
    // Create SeoRegistration record
    const registration = await prisma_1.default.seoRegistration.create({
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
    const loginUrl = `${env_1.env.FRONTEND_URL}/login`;
    const dashboardUrl = `${env_1.env.FRONTEND_URL}/dashboard/instructor/students`;
    // Fire emails non-blocking
    void (0, email_1.sendEmail)({
        to: emailId,
        subject: `Welcome to Financial Freedom Mentor — Your Login Credentials`,
        html: (0, email_1.seoStudentCredentialsTemplate)(studentName, emailId, plainPassword, plan, loginUrl),
    });
    void (0, email_1.sendEmail)({
        to: instructor.email,
        subject: `New Student Registered: ${studentName} (${plan} Plan)`,
        html: (0, email_1.seoInstructorNotificationTemplate)(instructor.name, {
            name: studentName,
            email: emailId,
            mobile: mobileNumber,
            plan,
            occupation,
            experience: previousCommodityTradingExperience ?? 'No',
            whyJoin,
        }, dashboardUrl),
    });
    (0, response_1.sendSuccess)(res, {
        registrationId: registration.id,
        userId: user.id,
        razorpayOrderId: order.orderId,
        amount: order.amount, // paise
        currency: order.currency,
        razorpayKeyId: env_1.env.RAZORPAY_KEY_ID,
        studentName,
        emailId,
    }, 'Registration successful. Please complete the payment.', 201);
});
// ─── POST /seo-registration/verify-payment ───────────────────────────────────
// Called by the frontend after Razorpay payment modal closes successfully.
exports.seoVerifyPayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new AppError_1.AppError('razorpayOrderId, razorpayPaymentId, and razorpaySignature are required', 400);
    }
    // Verify signature
    const isValid = (0, payment_service_1.verifyRazorpaySignature)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid)
        throw new AppError_1.AppError('Payment verification failed: invalid signature', 400);
    const registration = await prisma_1.default.seoRegistration.findUnique({
        where: { razorpayOrderId },
        include: { user: true },
    });
    if (!registration)
        throw new AppError_1.NotFoundError('Registration');
    if (registration.paymentStatus === 'COMPLETED') {
        (0, response_1.sendSuccess)(res, { alreadyPaid: true }, 'Payment already confirmed');
        return;
    }
    // Update registration
    await prisma_1.default.seoRegistration.update({
        where: { id: registration.id },
        data: {
            paymentStatus: 'COMPLETED',
            razorpayPaymentId,
            razorpaySignature,
        },
    });
    // Send payment receipt to student
    void (0, email_1.sendEmail)({
        to: registration.emailId,
        subject: 'Payment Confirmed — Financial Freedom Mentor',
        html: (0, email_1.seoPaymentConfirmedTemplate)(registration.studentName, registration.preferredCoursePlan, registration.amount, razorpayPaymentId),
    });
    (0, response_1.sendSuccess)(res, { paid: true }, 'Payment confirmed successfully');
});
// ─── GET /seo-registration/students ──────────────────────────────────────────
// Instructor-only: view all registrations assigned to the logged-in instructor.
exports.getMyStudents = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [students, total] = await Promise.all([
        prisma_1.default.seoRegistration.findMany({
            where: { instructorId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                enrolledCourse: { select: { id: true, title: true, slug: true } },
            },
        }),
        prisma_1.default.seoRegistration.count({ where: { instructorId } }),
    ]);
    (0, response_1.sendSuccess)(res, { students, total, page, limit }, 'Students fetched');
});
// ─── POST /seo-registration/enroll ───────────────────────────────────────────
// Instructor-only: enroll a registered student into a specific course.
exports.enrollStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = req.user.userId;
    const { registrationId, courseId } = req.body;
    if (!registrationId || !courseId) {
        throw new AppError_1.AppError('registrationId and courseId are required', 400);
    }
    const registration = await prisma_1.default.seoRegistration.findUnique({
        where: { id: registrationId },
        include: { user: true },
    });
    if (!registration)
        throw new AppError_1.NotFoundError('Registration');
    if (registration.instructorId !== instructorId) {
        throw new AppError_1.ForbiddenError('This registration does not belong to you');
    }
    // Verify instructor owns the course
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, slug: true, instructorId: true },
    });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== instructorId) {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    const userId = registration.userId;
    // Upsert enrollment
    const alreadyEnrolled = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (!alreadyEnrolled) {
        await prisma_1.default.$transaction([
            prisma_1.default.enrollment.create({ data: { userId, courseId } }),
            prisma_1.default.course.update({ where: { id: courseId }, data: { totalStudents: { increment: 1 } } }),
        ]);
    }
    // Link the enrolled course to the registration record
    await prisma_1.default.seoRegistration.update({
        where: { id: registrationId },
        data: { enrolledCourseId: courseId },
    });
    const loginUrl = `${env_1.env.FRONTEND_URL}/learn/${course.slug}`;
    // Notify student
    void (0, email_1.sendEmail)({
        to: registration.emailId,
        subject: `You're enrolled in ${course.title} — Financial Freedom Mentor`,
        html: (0, email_1.seoEnrollmentConfirmTemplate)(registration.studentName, course.title, loginUrl),
    });
    (0, response_1.sendSuccess)(res, { enrolled: !alreadyEnrolled, courseId, courseTitle: course.title }, alreadyEnrolled ? 'Student was already enrolled' : 'Student enrolled successfully');
});
//# sourceMappingURL=seoRegistration.controller.js.map