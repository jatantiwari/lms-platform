"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseProgress = exports.updateProgress = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Mark Lecture Complete / Update Progress ───────────────────────────────────
exports.updateProgress = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { lectureId } = req.params;
    const { completed = true, watchedSeconds = 0 } = req.body;
    // Verify lecture exists
    const lecture = await prisma_1.default.lecture.findUnique({
        where: { id: lectureId },
        include: { section: { select: { courseId: true } } },
    });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    // Verify enrollment
    const courseId = lecture.section.courseId;
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment)
        throw new AppError_1.ForbiddenError('You are not enrolled in this course');
    // Upsert progress record
    const progress = await prisma_1.default.progress.upsert({
        where: { userId_lectureId: { userId, lectureId } },
        update: { completed, watchedSeconds },
        create: { userId, lectureId, completed, watchedSeconds },
    });
    // Mark enrollment as complete if all lectures are done
    if (completed) {
        await checkAndMarkCourseComplete(userId, courseId);
    }
    (0, response_1.sendSuccess)(res, progress, 'Progress updated');
});
// ─── Get Course Progress ──────────────────────────────────────────────────────
exports.getCourseProgress = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.params;
    // Verify enrollment
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment)
        throw new AppError_1.ForbiddenError('You are not enrolled in this course');
    const [allLectures, completedProgress] = await Promise.all([
        prisma_1.default.lecture.findMany({
            where: { section: { courseId }, isPublished: true },
            select: { id: true },
        }),
        prisma_1.default.progress.findMany({
            where: { userId, completed: true, lecture: { section: { courseId } } },
            select: { lectureId: true, watchedSeconds: true },
        }),
    ]);
    const completedIds = new Set(completedProgress.map((p) => p.lectureId));
    const totalLectures = allLectures.length;
    const completedCount = allLectures.filter((l) => completedIds.has(l.id)).length;
    const percentage = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;
    (0, response_1.sendSuccess)(res, {
        totalLectures,
        completedCount,
        percentage,
        completedLectures: [...completedIds],
        completedAt: enrollment.completedAt,
    }, 'Course progress');
});
// ─── Private helper ───────────────────────────────────────────────────────────
async function checkAndMarkCourseComplete(userId, courseId) {
    const [allPublished, completed] = await Promise.all([
        prisma_1.default.lecture.count({ where: { section: { courseId }, isPublished: true } }),
        prisma_1.default.progress.count({
            where: { userId, completed: true, lecture: { section: { courseId } } },
        }),
    ]);
    if (allPublished > 0 && completed >= allPublished) {
        await prisma_1.default.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: { completedAt: new Date() },
        });
    }
}
//# sourceMappingURL=progress.controller.js.map