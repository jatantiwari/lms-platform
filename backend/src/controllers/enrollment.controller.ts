import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, paginationMeta } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import { s3ImageUrl } from '../services/s3.service';
import prisma from '../config/prisma';

// ─── Enroll (already enrolled check) ──────────────────────────────────────────

export const getMyEnrollments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
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
    prisma.enrollment.count({ where: { userId } }),
  ]);

  // Attach progress percentage to each enrollment
  const enriched = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [[allCount, doneCount], signedThumbnail] = await Promise.all([
        Promise.all([
          prisma.lecture.count({
            where: { section: { courseId: enrollment.courseId }, isPublished: true },
          }),
          prisma.progress.count({
            where: {
              userId,
              completed: true,
              lecture: { section: { courseId: enrollment.courseId } },
            },
          }),
        ]),
        s3ImageUrl(enrollment.course.thumbnail),
      ]);
      return {
        ...enrollment,
        course: {
          ...enrollment.course,
          thumbnail: signedThumbnail,
        },
        progress: {
          totalLectures: allCount,
          completedCount: doneCount,
          percentage: allCount > 0 ? Math.round((doneCount / allCount) * 100) : 0,
        },
      };
    }),
  );

  sendSuccess(res, enriched, 'Enrollments fetched', 200, paginationMeta(page, limit, total));
});

// ─── Check Enrollment ─────────────────────────────────────────────────────────

export const checkEnrollment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { courseId } = req.params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  sendSuccess(res, { isEnrolled: !!enrollment }, 'Enrollment status');
});

// ─── Instructor: Get Enrolled Students ────────────────────────────────────────

export const getCourseStudents = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const instructorId = req.user!.userId;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== instructorId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
      },
    }),
    prisma.enrollment.count({ where: { courseId } }),
  ]);

  sendSuccess(res, enrollments, 'Students fetched', 200, paginationMeta(page, limit, total));
});
