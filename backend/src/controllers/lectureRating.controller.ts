import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import prisma from '../config/prisma';

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Recalculate a lecture's avgRating and totalRatings, then update course avgRating */
async function updateRatings(lectureId: string, courseId: string): Promise<void> {
  // Update lecture rating
  const lectureResult = await prisma.lectureRating.aggregate({
    where: { lectureId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.lecture.update({
    where: { id: lectureId },
    data: {
      avgRating: lectureResult._avg.rating ?? 0,
      totalRatings: lectureResult._count.rating,
    },
  });

  // Update course avgRating — combined from lecture ratings + reviews
  const lectureRatingResult = await prisma.lectureRating.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const reviewResult = await prisma.review.aggregate({
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

  await prisma.course.update({
    where: { id: courseId },
    data: { avgRating: Math.round(avgRating * 10) / 10 },
  });
}

// ─── Rate a Lecture ───────────────────────────────────────────────────────────

export const rateLecture = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { lectureId } = req.params;
  const { rating } = req.body as { rating: number };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ForbiddenError('Rating must be an integer between 1 and 5');
  }

  // Verify lecture exists and get courseId
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lecture) throw new NotFoundError('Lecture');

  const courseId = lecture.section.courseId;

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new ForbiddenError('You must be enrolled in this course to rate a lecture');

  // Upsert rating
  const lectureRating = await prisma.lectureRating.upsert({
    where: { userId_lectureId: { userId, lectureId } },
    create: { userId, lectureId, courseId, rating },
    update: { rating },
  });

  await updateRatings(lectureId, courseId);

  sendSuccess(res, lectureRating, 'Lecture rated successfully');
});

// ─── Get My Rating for a Lecture ──────────────────────────────────────────────

export const getMyLectureRating = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { lectureId } = req.params;

  const rating = await prisma.lectureRating.findUnique({
    where: { userId_lectureId: { userId, lectureId } },
  });

  sendSuccess(res, rating ?? null, 'Rating fetched');
});

// ─── Get Lecture Rating Summary (public) ─────────────────────────────────────

export const getLectureRatingSummary = catchAsync(async (req: Request, res: Response) => {
  const { lectureId } = req.params;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: { avgRating: true, totalRatings: true },
  });

  if (!lecture) throw new NotFoundError('Lecture');

  sendSuccess(res, lecture, 'Lecture rating summary fetched');
});
