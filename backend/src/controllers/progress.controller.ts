import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import prisma from '../config/prisma';

// ─── Mark Lecture Complete / Update Progress ───────────────────────────────────

export const updateProgress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { lectureId } = req.params;
  const { completed = true, watchedSeconds = 0 } = req.body;

  // Verify lecture exists
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lecture) throw new NotFoundError('Lecture');

  // Verify enrollment
  const courseId = lecture.section.courseId;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');

  // Upsert progress record
  const progress = await prisma.progress.upsert({
    where: { userId_lectureId: { userId, lectureId } },
    update: { completed, watchedSeconds },
    create: { userId, lectureId, completed, watchedSeconds },
  });

  // Mark enrollment as complete if all lectures are done
  if (completed) {
    await checkAndMarkCourseComplete(userId, courseId);
  }

  sendSuccess(res, progress, 'Progress updated');
});

// ─── Get Course Progress ──────────────────────────────────────────────────────

export const getCourseProgress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { courseId } = req.params;

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');

  const [allLectures, completedProgress] = await Promise.all([
    prisma.lecture.findMany({
      where: { section: { courseId }, isPublished: true },
      select: { id: true },
    }),
    prisma.progress.findMany({
      where: { userId, completed: true, lecture: { section: { courseId } } },
      select: { lectureId: true, watchedSeconds: true },
    }),
  ]);

  const completedIds = new Set(completedProgress.map((p) => p.lectureId));
  const totalLectures = allLectures.length;
  const completedCount = allLectures.filter((l) => completedIds.has(l.id)).length;
  const percentage = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  sendSuccess(res, {
    totalLectures,
    completedCount,
    percentage,
    completedLectureIds: [...completedIds],
    completedAt: enrollment.completedAt,
  }, 'Course progress');
});

// ─── Private helper ───────────────────────────────────────────────────────────

async function checkAndMarkCourseComplete(userId: string, courseId: string): Promise<void> {
  const [allPublished, completed] = await Promise.all([
    prisma.lecture.count({ where: { section: { courseId }, isPublished: true } }),
    prisma.progress.count({
      where: { userId, completed: true, lecture: { section: { courseId } } },
    }),
  ]);

  if (allPublished > 0 && completed >= allPublished) {
    await prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { completedAt: new Date() },
    });
  }
}
