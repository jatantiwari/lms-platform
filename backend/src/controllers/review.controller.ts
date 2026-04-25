import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, paginationMeta } from '../utils/response';
import { NotFoundError, ForbiddenError, AppError } from '../utils/AppError';
import prisma from '../config/prisma';

// ─── Create Review ─────────────────────────────────────────────────────────────

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  // Must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new ForbiddenError('You must be enrolled to review this course');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course');

  // One review per user per course
  const existing = await prisma.review.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) throw new AppError('You have already reviewed this course', 409);

  const review = await prisma.review.create({
    data: { rating, comment, userId, courseId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  // Recalculate course average rating
  await updateCourseRating(courseId);

  sendSuccess(res, review, 'Review submitted', 201);
});

// ─── Get Reviews for a Course ─────────────────────────────────────────────────

export const getCourseReviews = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sort = (req.query.sort as string) || 'newest';

  const orderBy =
    sort === 'newest' ? { createdAt: 'desc' as const }
    : sort === 'oldest' ? { createdAt: 'asc' as const }
    : sort === 'highest' ? { rating: 'desc' as const }
    : sort === 'lowest' ? { rating: 'asc' as const }
    : { createdAt: 'desc' as const };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { courseId, isHidden: false },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.review.count({ where: { courseId, isHidden: false } }),
  ]);

  // Rating distribution
  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { courseId, isHidden: false },
    _count: { rating: true },
  });

  const ratingDist = Array.from({ length: 5 }, (_, i) => {
    const found = distribution.find((d) => d.rating === i + 1);
    return { stars: i + 1, count: found?._count.rating ?? 0 };
  }).reverse();

  sendSuccess(
    res,
    { reviews, ratingDistribution: ratingDist },
    'Reviews fetched',
    200,
    paginationMeta(page, limit, total),
  );
});

// ─── Update Review ─────────────────────────────────────────────────────────────

export const updateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review');
  if (review.userId !== userId) throw new ForbiddenError('You can only edit your own reviews');

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { rating, comment },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  await updateCourseRating(review.courseId);

  sendSuccess(res, updated, 'Review updated');
});

// ─── Delete Review ─────────────────────────────────────────────────────────────

export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { reviewId } = req.params;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review');

  if (review.userId !== userId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You can only delete your own reviews');
  }

  await prisma.review.delete({ where: { id: reviewId } });
  await updateCourseRating(review.courseId);

  sendSuccess(res, null, 'Review deleted');
});

// ─── Admin: Toggle review visibility ─────────────────────────────────────────

export const toggleReviewVisibility = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review');

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: !review.isHidden },
  });

  await updateCourseRating(review.courseId);

  sendSuccess(res, updated, `Review ${updated.isHidden ? 'hidden' : 'shown'}`);
});

// ─── Private helper ───────────────────────────────────────────────────────────

async function updateCourseRating(courseId: string): Promise<void> {
  const result = await prisma.review.aggregate({
    where: { courseId, isHidden: false },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: {
      avgRating: result._avg.rating ?? 0,
      totalReviews: result._count.rating,
    },
  });
}
