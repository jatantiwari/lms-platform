"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseStudents = exports.checkEnrollment = exports.getMyEnrollments = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Enroll (already enrolled check) ──────────────────────────────────────────
exports.getMyEnrollments = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const [enrollments, total] = await Promise.all([
        prisma_1.default.enrollment.findMany({
            where: { userId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                course: {
                    select: {
                        id: true, title: true, slug: true, thumbnail: true,
                        level: true, totalLectures: true, totalDuration: true,
                        instructor: { select: { id: true, name: true, avatar: true } },
                    },
                },
            },
        }),
        prisma_1.default.enrollment.count({ where: { userId } }),
    ]);
    // Attach progress percentage to each enrollment
    const enriched = await Promise.all(enrollments.map(async (enrollment) => {
        const [allCount, doneCount] = await Promise.all([
            prisma_1.default.lecture.count({
                where: { section: { courseId: enrollment.courseId }, isPublished: true },
            }),
            prisma_1.default.progress.count({
                where: {
                    userId,
                    completed: true,
                    lecture: { section: { courseId: enrollment.courseId } },
                },
            }),
        ]);
        return {
            ...enrollment,
            progress: {
                totalLectures: allCount,
                completedCount: doneCount,
                percentage: allCount > 0 ? Math.round((doneCount / allCount) * 100) : 0,
            },
        };
    }));
    (0, response_1.sendSuccess)(res, enriched, 'Enrollments fetched', 200, (0, response_1.paginationMeta)(page, limit, total));
});
// ─── Check Enrollment ─────────────────────────────────────────────────────────
exports.checkEnrollment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    (0, response_1.sendSuccess)(res, { isEnrolled: !!enrollment }, 'Enrollment status');
});
// ─── Instructor: Get Enrolled Students ────────────────────────────────────────
exports.getCourseStudents = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId } = req.params;
    const instructorId = req.user.userId;
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
    });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== instructorId && req.user.role !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [enrollments, total] = await Promise.all([
        prisma_1.default.enrollment.findMany({
            where: { courseId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
            },
        }),
        prisma_1.default.enrollment.count({ where: { courseId } }),
    ]);
    (0, response_1.sendSuccess)(res, enrollments, 'Students fetched', 200, (0, response_1.paginationMeta)(page, limit, total));
});
//# sourceMappingURL=enrollment.controller.js.map