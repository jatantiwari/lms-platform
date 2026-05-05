"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleReviewVisibility = exports.deleteReview = exports.updateReview = exports.getCourseReviews = exports.createReview = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Create Review ─────────────────────────────────────────────────────────────
exports.createReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    // Must be enrolled
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment)
        throw new AppError_1.ForbiddenError('You must be enrolled to review this course');
    const course = await prisma_1.default.course.findUnique({ where: { id: courseId } });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    // One review per user per course
    const existing = await prisma_1.default.review.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (existing)
        throw new AppError_1.AppError('You have already reviewed this course', 409);
    const review = await prisma_1.default.review.create({
        data: { rating, comment, userId, courseId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    // Recalculate course average rating
    await updateCourseRating(courseId);
    (0, response_1.sendSuccess)(res, review, 'Review submitted', 201);
});
// ─── Get Reviews for a Course ─────────────────────────────────────────────────
exports.getCourseReviews = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'newest';
    const orderBy = sort === 'newest' ? { createdAt: 'desc' }
        : sort === 'oldest' ? { createdAt: 'asc' }
            : sort === 'highest' ? { rating: 'desc' }
                : sort === 'lowest' ? { rating: 'asc' }
                    : { createdAt: 'desc' };
    const [reviews, total] = await Promise.all([
        prisma_1.default.review.findMany({
            where: { courseId, isHidden: false },
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            include: { user: { select: { id: true, name: true, avatar: true } } },
        }),
        prisma_1.default.review.count({ where: { courseId, isHidden: false } }),
    ]);
    // Rating distribution
    const distribution = await prisma_1.default.review.groupBy({
        by: ['rating'],
        where: { courseId, isHidden: false },
        _count: { rating: true },
    });
    const ratingDist = Array.from({ length: 5 }, (_, i) => {
        const found = distribution.find((d) => d.rating === i + 1);
        return { stars: i + 1, count: found?._count.rating ?? 0 };
    }).reverse();
    (0, response_1.sendSuccess)(res, { reviews, ratingDistribution: ratingDist }, 'Reviews fetched', 200, (0, response_1.paginationMeta)(page, limit, total));
});
// ─── Update Review ─────────────────────────────────────────────────────────────
exports.updateReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const review = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new AppError_1.NotFoundError('Review');
    if (review.userId !== userId)
        throw new AppError_1.ForbiddenError('You can only edit your own reviews');
    const updated = await prisma_1.default.review.update({
        where: { id: reviewId },
        data: { rating, comment },
        include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    await updateCourseRating(review.courseId);
    (0, response_1.sendSuccess)(res, updated, 'Review updated');
});
// ─── Delete Review ─────────────────────────────────────────────────────────────
exports.deleteReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const review = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new AppError_1.NotFoundError('Review');
    if (review.userId !== userId && req.user.role !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You can only delete your own reviews');
    }
    await prisma_1.default.review.delete({ where: { id: reviewId } });
    await updateCourseRating(review.courseId);
    (0, response_1.sendSuccess)(res, null, 'Review deleted');
});
// ─── Admin: Toggle review visibility ─────────────────────────────────────────
exports.toggleReviewVisibility = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { reviewId } = req.params;
    const review = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new AppError_1.NotFoundError('Review');
    const updated = await prisma_1.default.review.update({
        where: { id: reviewId },
        data: { isHidden: !review.isHidden },
    });
    await updateCourseRating(review.courseId);
    (0, response_1.sendSuccess)(res, updated, `Review ${updated.isHidden ? 'hidden' : 'shown'}`);
});
// ─── Private helper ───────────────────────────────────────────────────────────
async function updateCourseRating(courseId) {
    const result = await prisma_1.default.review.aggregate({
        where: { courseId, isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await prisma_1.default.course.update({
        where: { id: courseId },
        data: {
            avgRating: result._avg.rating ?? 0,
            totalReviews: result._count.rating,
        },
    });
}
//# sourceMappingURL=review.controller.js.map