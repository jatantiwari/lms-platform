"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerification = exports.verifyPhoneOtp = exports.sendPhoneOtp = exports.verifyEmail = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const s3_service_1 = require("../services/s3.service");
const env_1 = require("../config/env");
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_1 = __importDefault(require("crypto"));
// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing)
        throw new AppError_1.ConflictError('An account with this email already exists');
    const hashed = await (0, password_1.hashPassword)(password);
    // Generate 6-digit verification code (expires 15 minutes)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExp = new Date(Date.now() + 15 * 60 * 1000);
    const user = await prisma_1.default.user.create({
        data: { name, email, password: hashed, role, phone: phone ?? null, verificationCode, verificationCodeExp },
        select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, emailVerified: true, phoneVerified: true, instructorApproved: true, createdAt: true },
    });
    // Send verification email (non-blocking)
    void (0, email_1.sendEmail)({
        to: email,
        subject: 'Verify your ADI Boost account',
        html: (0, email_1.verificationEmailTemplate)(name, verificationCode),
    });
    const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, email: user.email });
    // Persist refresh token hash
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { refreshToken: await (0, password_1.hashPassword)(refreshToken) },
    });
    (0, response_1.sendSuccess)(res, { user, accessToken, refreshToken }, 'Account created successfully', 201);
});
// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !(await (0, password_1.comparePassword)(password, user.password))) {
        throw new AppError_1.UnauthorizedError('Invalid email or password');
    }
    if (!user.isActive)
        throw new AppError_1.UnauthorizedError('Account is deactivated. Contact support.');
    const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role, email: user.email });
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { refreshToken: await (0, password_1.hashPassword)(refreshToken) },
    });
    const { password: _, refreshToken: __, ...safeUser } = user;
    (0, response_1.sendSuccess)(res, { user: safeUser, accessToken, refreshToken }, 'Logged in successfully');
});
// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { refreshToken: token } = req.body;
    if (!token)
        throw new AppError_1.UnauthorizedError('Refresh token required');
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw new AppError_1.UnauthorizedError('Invalid or expired refresh token');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: payload.userId } });
    if (!user?.refreshToken)
        throw new AppError_1.UnauthorizedError('Session invalidated. Please log in again.');
    const isValid = await (0, password_1.comparePassword)(token, user.refreshToken);
    if (!isValid)
        throw new AppError_1.UnauthorizedError('Invalid refresh token');
    const newAccessToken = (0, jwt_1.generateAccessToken)({
        userId: user.id,
        role: user.role,
        email: user.email,
    });
    const newRefreshToken = (0, jwt_1.generateRefreshToken)({
        userId: user.id,
        role: user.role,
        email: user.email,
    });
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { refreshToken: await (0, password_1.hashPassword)(newRefreshToken) },
    });
    (0, response_1.sendSuccess)(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Tokens refreshed');
});
// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (req.user) {
        await prisma_1.default.user.update({
            where: { id: req.user.userId },
            data: { refreshToken: null },
        });
    }
    (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
});
// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
        (0, response_1.sendSuccess)(res, null, 'If that email exists, a reset link has been sent.');
        return;
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExp },
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await (0, email_1.sendEmail)({
        to: user.email,
        subject: 'Password Reset Request',
        html: (0, email_1.passwordResetTemplate)(user.name, resetUrl),
    });
    (0, response_1.sendSuccess)(res, null, 'If that email exists, a reset link has been sent.');
});
// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { token, password } = req.body;
    const user = await prisma_1.default.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExp: { gt: new Date() },
        },
    });
    if (!user)
        throw new AppError_1.AppError('Invalid or expired reset token', 400);
    const hashed = await (0, password_1.hashPassword)(password);
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { password: hashed, resetToken: null, resetTokenExp: null, refreshToken: null },
    });
    (0, response_1.sendSuccess)(res, null, 'Password reset successfully. Please log in.');
});
// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            bio: true,
            headline: true,
            website: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            instructorApproved: true,
            createdAt: true,
            _count: {
                select: { enrollments: true, courses: true },
            },
        },
    });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    (0, response_1.sendSuccess)(res, { ...user, avatar: await (0, s3_service_1.s3ImageUrl)(user.avatar) }, 'User fetched');
});
// ─── Verify Email ─────────────────────────────────────────────────────────────
exports.verifyEmail = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { code } = req.body;
    const userId = req.user.userId;
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    if (user.emailVerified) {
        // Return the full user object so the frontend can safely call setUser
        const fullUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, role: true, avatar: true,
                emailVerified: true, instructorApproved: true, createdAt: true,
            },
        });
        (0, response_1.sendSuccess)(res, fullUser, 'Email already verified');
        return;
    }
    if (!user.verificationCode || !user.verificationCodeExp) {
        throw new AppError_1.AppError('No verification code found. Please request a new one.', 400);
    }
    if (new Date() > user.verificationCodeExp) {
        throw new AppError_1.AppError('Verification code has expired. Please request a new one.', 400);
    }
    if (user.verificationCode !== code) {
        throw new AppError_1.AppError('Invalid verification code.', 400);
    }
    const updated = await prisma_1.default.user.update({
        where: { id: userId },
        data: { emailVerified: true, verificationCode: null, verificationCodeExp: null },
        select: {
            id: true, name: true, email: true, role: true, avatar: true,
            emailVerified: true, instructorApproved: true, createdAt: true,
        },
    });
    (0, response_1.sendSuccess)(res, updated, 'Email verified successfully');
});
// ─── Resend Verification ──────────────────────────────────────────────────────
// ─── Send Phone OTP ─────────────────────────────────────────────────────────
exports.sendPhoneOtp = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true, phoneVerified: true },
    });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    if (user.phoneVerified)
        throw new AppError_1.AppError('Phone number is already verified', 400);
    if (!user.phone)
        throw new AppError_1.AppError('No phone number found. Update your profile first.', 400);
    if (!env_1.env.TWOFACTOR_API_KEY)
        throw new AppError_1.AppError('SMS service not configured', 503);
    // Strip to digits only — 2Factor expects E.164 without + for Indian numbers
    const phone = user.phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
    const url = `https://2factor.in/API/V1/${env_1.env.TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`;
    const tfRes = await fetch(url);
    const tfData = (await tfRes.json());
    if (tfData.Status !== 'Success') {
        throw new AppError_1.AppError(`Failed to send OTP: ${tfData.Details}`, 502);
    }
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { phoneOtpSession: tfData.Details },
    });
    (0, response_1.sendSuccess)(res, {}, 'OTP sent to your registered mobile number');
});
// ─── Verify Phone OTP ────────────────────────────────────────────────────────
exports.verifyPhoneOtp = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { otp } = req.body;
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, phoneOtpSession: true, phoneVerified: true },
    });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    if (user.phoneVerified)
        throw new AppError_1.AppError('Phone number is already verified', 400);
    if (!user.phoneOtpSession) {
        throw new AppError_1.AppError('No OTP session found. Please request a new OTP first.', 400);
    }
    if (!env_1.env.TWOFACTOR_API_KEY)
        throw new AppError_1.AppError('SMS service not configured', 503);
    const url = `https://2factor.in/API/V1/${env_1.env.TWOFACTOR_API_KEY}/SMS/VERIFY/${user.phoneOtpSession}/${otp}`;
    const tfRes = await fetch(url);
    const tfData = (await tfRes.json());
    if (tfData.Status !== 'Success' || !tfData.Details.includes('OTP Matched')) {
        throw new AppError_1.AppError('Invalid or expired OTP. Please try again.', 400);
    }
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { phoneVerified: true, phoneOtpSession: null },
    });
    (0, response_1.sendSuccess)(res, {}, 'Phone number verified successfully');
});
// ─── Resend Verification ──────────────────────────────────────────────────────
exports.resendVerification = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    if (user.emailVerified) {
        (0, response_1.sendSuccess)(res, null, 'Email is already verified');
        return;
    }
    // Rate-limit: don't resend if code was generated less than 2 minutes ago
    if (user.verificationCodeExp) {
        const msUntilExpiry = user.verificationCodeExp.getTime() - Date.now();
        const msTotal = 15 * 60 * 1000;
        if (msUntilExpiry > msTotal - 2 * 60 * 1000) {
            throw new AppError_1.AppError('Please wait before requesting another code.', 429);
        }
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExp = new Date(Date.now() + 15 * 60 * 1000);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { verificationCode, verificationCodeExp },
    });
    void (0, email_1.sendEmail)({
        to: user.email,
        subject: 'Your ADI Boost verification code',
        html: (0, email_1.verificationEmailTemplate)(user.name, verificationCode),
    });
    (0, response_1.sendSuccess)(res, null, 'Verification code sent');
});
//# sourceMappingURL=auth.controller.js.map