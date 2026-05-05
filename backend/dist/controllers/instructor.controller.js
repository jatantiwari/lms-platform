"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewApplication = exports.listApplications = exports.getMyApplication = exports.applyAsInstructor = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const email_1 = require("../utils/email");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Apply as Instructor ──────────────────────────────────────────────────────
exports.applyAsInstructor = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { teachingExperience, expertise, bio, linkedIn, website } = req.body;
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: { instructorProfile: true },
    });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    if (user.role !== 'INSTRUCTOR')
        throw new AppError_1.ForbiddenError('Only instructors can apply');
    if (user.instructorApproved) {
        throw new AppError_1.AppError('Your instructor account is already approved', 400);
    }
    if (user.instructorProfile) {
        if (user.instructorProfile.status === 'PENDING') {
            throw new AppError_1.ConflictError('You already have a pending application');
        }
        // Allow reapplication if rejected — update the existing record
        const updated = await prisma_1.default.instructorProfile.update({
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
        (0, response_1.sendSuccess)(res, updated, 'Application resubmitted', 200);
        return;
    }
    const profile = await prisma_1.default.instructorProfile.create({
        data: {
            userId,
            teachingExperience,
            expertise: Array.isArray(expertise) ? expertise : [expertise],
            bio,
            linkedIn: linkedIn ?? null,
            website: website ?? null,
        },
    });
    (0, response_1.sendSuccess)(res, profile, 'Instructor application submitted', 201);
});
// ─── Get My Application ───────────────────────────────────────────────────────
exports.getMyApplication = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const profile = await prisma_1.default.instructorProfile.findUnique({ where: { userId } });
    (0, response_1.sendSuccess)(res, profile, 'Application fetched');
});
// ─── List Applications (Admin) ────────────────────────────────────────────────
exports.listApplications = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { status } = req.query;
    const applications = await prisma_1.default.instructorProfile.findMany({
        where: status ? { status: status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, email: true, avatar: true, createdAt: true },
            },
        },
    });
    (0, response_1.sendSuccess)(res, applications, 'Applications fetched');
});
// ─── Review Application (Admin) ───────────────────────────────────────────────
exports.reviewApplication = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
        throw new AppError_1.AppError('Status must be APPROVED or REJECTED', 400);
    }
    const profile = await prisma_1.default.instructorProfile.findUnique({
        where: { id },
        include: { user: true },
    });
    if (!profile)
        throw new AppError_1.NotFoundError('Instructor application');
    const updated = await prisma_1.default.instructorProfile.update({
        where: { id },
        data: {
            status,
            rejectionReason: status === 'REJECTED' ? (rejectionReason ?? null) : null,
            reviewedAt: new Date(),
        },
    });
    // Update instructorApproved on the user
    await prisma_1.default.user.update({
        where: { id: profile.userId },
        data: { instructorApproved: status === 'APPROVED' },
    });
    // Send notification email (non-blocking)
    if (status === 'APPROVED') {
        void (0, email_1.sendEmail)({
            to: profile.user.email,
            subject: 'Your instructor application has been approved!',
            html: (0, email_1.instructorApprovedEmailTemplate)(profile.user.name),
        });
    }
    else {
        void (0, email_1.sendEmail)({
            to: profile.user.email,
            subject: 'Update on your instructor application',
            html: (0, email_1.instructorRejectedEmailTemplate)(profile.user.name, rejectionReason ?? ''),
        });
    }
    (0, response_1.sendSuccess)(res, updated, `Application ${status.toLowerCase()}`);
});
//# sourceMappingURL=instructor.controller.js.map