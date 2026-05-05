"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserActive = exports.listUsers = exports.updatePushToken = exports.changePassword = exports.uploadAvatar = exports.updateProfile = exports.getUserProfile = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const password_1 = require("../utils/password");
const s3_service_1 = require("../services/s3.service");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Get Profile ──────────────────────────────────────────────────────────────
exports.getUserProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma_1.default.user.findUnique({
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
    if (!user)
        throw new AppError_1.NotFoundError('User');
    // Refresh presigned URLs for avatar and course thumbnails
    const freshUser = {
        ...user,
        avatar: await (0, s3_service_1.s3ImageUrl)(user.avatar),
        courses: await Promise.all(user.courses.map(async (c) => ({ ...c, thumbnail: await (0, s3_service_1.s3ImageUrl)(c.thumbnail) }))),
    };
    (0, response_1.sendSuccess)(res, freshUser, 'Profile fetched');
});
// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, bio, headline, website, phone } = req.body;
    const userId = req.user.userId;
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: { name, bio, headline, website, phone: phone || null },
        select: {
            id: true, name: true, email: true, role: true,
            avatar: true, bio: true, headline: true, website: true, phone: true,
        },
    });
    (0, response_1.sendSuccess)(res, user, 'Profile updated');
});
// ─── Upload Avatar ────────────────────────────────────────────────────────────
exports.uploadAvatar = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file)
        throw new AppError_1.ForbiddenError('No image file provided');
    const userId = req.user.userId;
    const existingUser = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { avatar: true },
    });
    // Delete old avatar from S3 — handle both public URLs and presigned URLs
    if (existingUser?.avatar) {
        const oldKey = (0, s3_service_1.extractS3Key)(existingUser.avatar);
        await (0, s3_service_1.removeFromS3)(oldKey).catch(() => { });
    }
    const { key, url } = await (0, s3_service_1.uploadToS3)(req.file.buffer, `avatars`, req.file.originalname, req.file.mimetype);
    // Store the S3 key (not the presigned URL) so we can always re-sign it later
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: { avatar: key },
        select: { id: true, name: true, avatar: true },
    });
    // Return the fresh presigned URL to the client
    (0, response_1.sendSuccess)(res, { ...user, avatar: url }, 'Avatar updated');
});
// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    const { comparePassword } = await Promise.resolve().then(() => __importStar(require('../utils/password')));
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch)
        throw new AppError_1.ForbiddenError('Current password is incorrect');
    const hashed = await (0, password_1.hashPassword)(newPassword);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { password: hashed, refreshToken: null }, // invalidate sessions
    });
    (0, response_1.sendSuccess)(res, null, 'Password changed. Please log in again.');
});
// ─── Push Token ───────────────────────────────────────────────────────────────
exports.updatePushToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { pushToken, platform } = req.body;
    const userId = req.user.userId;
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { pushToken, pushTokenPlatform: platform ?? null },
    });
    (0, response_1.sendSuccess)(res, null, 'Push token updated');
});
// ─── Admin: List Users ────────────────────────────────────────────────────────
exports.listUsers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const role = req.query.role;
    const where = {
        ...(search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ],
        } : {}),
        ...(role ? { role: role } : {}),
    };
    const [users, total] = await Promise.all([
        prisma_1.default.user.findMany({
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
        prisma_1.default.user.count({ where }),
    ]);
    (0, response_1.sendSuccess)(res, users, 'Users fetched', 200, (0, response_1.paginationMeta)(page, limit, total));
});
// ─── Admin: Toggle User Active ─────────────────────────────────────────────────
exports.toggleUserActive = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma_1.default.user.findUnique({ where: { id } });
    if (!user)
        throw new AppError_1.NotFoundError('User');
    const updated = await prisma_1.default.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, name: true, isActive: true },
    });
    (0, response_1.sendSuccess)(res, updated, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
});
//# sourceMappingURL=user.controller.js.map