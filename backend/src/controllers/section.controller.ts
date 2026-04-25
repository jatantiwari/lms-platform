import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import prisma from '../config/prisma';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function assertCourseOwner(courseId: string, userId: string, userRole: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }
}

// ─── Create Section ───────────────────────────────────────────────────────────

export const createSection = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, order } = req.body;
  await assertCourseOwner(courseId, req.user!.userId, req.user!.role);

  // Auto-assign order if not provided
  const lastSection = await prisma.section.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  });
  const sectionOrder = order ?? (lastSection ? lastSection.order + 1 : 0);

  const section = await prisma.section.create({
    data: { title, order: sectionOrder, courseId },
    include: { lectures: true },
  });

  sendSuccess(res, section, 'Section created', 201);
});

// ─── Update Section ────────────────────────────────────────────────────────────

export const updateSection = catchAsync(async (req: Request, res: Response) => {
  const { courseId, sectionId } = req.params;
  await assertCourseOwner(courseId, req.user!.userId, req.user!.role);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) throw new NotFoundError('Section');

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: req.body,
    include: { lectures: { orderBy: { order: 'asc' } } },
  });

  sendSuccess(res, updated, 'Section updated');
});

// ─── Delete Section ────────────────────────────────────────────────────────────

export const deleteSection = catchAsync(async (req: Request, res: Response) => {
  const { courseId, sectionId } = req.params;
  await assertCourseOwner(courseId, req.user!.userId, req.user!.role);

  const section = await prisma.section.findFirst({ where: { id: sectionId, courseId } });
  if (!section) throw new NotFoundError('Section');

  await prisma.section.delete({ where: { id: sectionId } });
  sendSuccess(res, null, 'Section deleted');
});

// ─── Reorder Sections ─────────────────────────────────────────────────────────

export const reorderSections = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { sections } = req.body as { sections: { id: string; order: number }[] };
  await assertCourseOwner(courseId, req.user!.userId, req.user!.role);

  await prisma.$transaction(
    sections.map(({ id, order }) =>
      prisma.section.update({ where: { id }, data: { order } }),
    ),
  );

  sendSuccess(res, null, 'Sections reordered');
});
