"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeSeoNewsletter = exports.submitSeoLead = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const prisma_1 = __importDefault(require("../config/prisma"));
const email_1 = require("../utils/email");
async function resolveInstructor() {
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
    return instructor;
}
exports.submitSeoLead = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { fullName, email, phone, message } = req.body;
    if (!fullName?.trim())
        throw new AppError_1.AppError('fullName is required', 400);
    if (!email?.trim())
        throw new AppError_1.AppError('email is required', 400);
    if (!message?.trim())
        throw new AppError_1.AppError('message is required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError_1.AppError('Invalid email address', 400);
    }
    const instructor = await resolveInstructor();
    const lead = await prisma_1.default.seoContactLead.create({
        data: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            message: message.trim(),
            instructorId: instructor.id,
        },
    });
    void (0, email_1.sendEmail)({
        to: instructor.email,
        subject: `New Contact Lead: ${fullName.trim()}`,
        html: (0, email_1.seoLeadInstructorTemplate)(instructor.name, {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || undefined,
            message: message.trim(),
        }),
    });
    void (0, email_1.sendEmail)({
        to: email.trim().toLowerCase(),
        subject: 'We received your message - Financial Freedom Mentor',
        html: (0, email_1.seoLeadStudentAckTemplate)(fullName.trim()),
    });
    (0, response_1.sendSuccess)(res, { leadId: lead.id }, 'Thank you! We have received your message and will contact you soon.', 201);
});
exports.subscribeSeoNewsletter = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    if (!email?.trim())
        throw new AppError_1.AppError('email is required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError_1.AppError('Invalid email address', 400);
    }
    const instructor = await resolveInstructor();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma_1.default.seoSubscriber.findUnique({
        where: {
            email_instructorId: {
                email: normalizedEmail,
                instructorId: instructor.id,
            },
        },
    });
    if (existing) {
        if (!existing.isActive) {
            await prisma_1.default.seoSubscriber.update({
                where: { id: existing.id },
                data: { isActive: true },
            });
        }
        (0, response_1.sendSuccess)(res, { subscribed: true, alreadySubscribed: true }, 'Email already subscribed');
        return;
    }
    try {
        await prisma_1.default.seoSubscriber.create({
            data: {
                email: normalizedEmail,
                instructorId: instructor.id,
            },
        });
    }
    catch {
        throw new AppError_1.ConflictError('This email is already subscribed');
    }
    (0, response_1.sendSuccess)(res, { subscribed: true }, 'Subscribed successfully', 201);
});
//# sourceMappingURL=seoLead.controller.js.map