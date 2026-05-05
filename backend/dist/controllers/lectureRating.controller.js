"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLectureRatingSummary = exports.getMyLectureRating = exports.rateLecture = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Private helpers ──────────────────────────────────────────────────────────
/** Recalculate a lecture's avgRating and totalRatings, then update course avgRating */
async function updateRatings(lectureId, courseId) {
    // Update lecture rating
    const lectureResult = await prisma_1.default.lectureRating.aggregate({
        where: { lectureId },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: {
            avgRating: lectureResult._avg.rating ?? 0,
            totalRatings: lectureResult._count.rating,
        },
    });
    // Update course avgRating — combined from lecture ratings + reviews
    const lectureRatingResult = await prisma_1.default.lectureRating.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const reviewResult = await prisma_1.default.review.aggregate({
        where: { courseId, isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const lrCount = lectureRatingResult._count.rating;
    const lrAvg = lectureRatingResult._avg.rating ?? 0;
    const rvCount = reviewResult._count.rating;
    const rvAvg = reviewResult._avg.rating ?? 0;
    const totalCount = lrCount + rvCount;
    const avgRating = totalCount > 0
        ? (lrAvg * lrCount + rvAvg * rvCount) / totalCount
        : 0;
    await prisma_1.default.course.update({
        where: { id: courseId },
        data: { avgRating: Math.round(avgRating * 10) / 10 },
    });
}
// ─── Rate a Lecture ───────────────────────────────────────────────────────────
exports.rateLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { lectureId } = req.params;
    const { rating } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new AppError_1.ForbiddenError('Rating must be an integer between 1 and 5');
    }
    // Verify lecture exists and get courseId
    const lecture = await prisma_1.default.lecture.findUnique({
        where: { id: lectureId },
        include: { section: { select: { courseId: true } } },
    });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const courseId = lecture.section.courseId;
    // Verify enrollment
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment)
        throw new AppError_1.ForbiddenError('You must be enrolled in this course to rate a lecture');
    // Upsert rating
    const lectureRating = await prisma_1.default.lectureRating.upsert({
        where: { userId_lectureId: { userId, lectureId } },
        create: { userId, lectureId, courseId, rating },
        update: { rating },
    });
    await updateRatings(lectureId, courseId);
    (0, response_1.sendSuccess)(res, lectureRating, 'Lecture rated successfully');
});
// ─── Get My Rating for a Lecture ──────────────────────────────────────────────
exports.getMyLectureRating = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { lectureId } = req.params;
    const rating = await prisma_1.default.lectureRating.findUnique({
        where: { userId_lectureId: { userId, lectureId } },
    });
    (0, response_1.sendSuccess)(res, rating ?? null, 'Rating fetched');
});
// ─── Get Lecture Rating Summary (public) ─────────────────────────────────────
exports.getLectureRatingSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { lectureId } = req.params;
    const lecture = await prisma_1.default.lecture.findUnique({
        where: { id: lectureId },
        select: { avgRating: true, totalRatings: true },
    });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    (0, response_1.sendSuccess)(res, lecture, 'Lecture rating summary fetched');
});
//# sourceMappingURL=lectureRating.controller.js.map