import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import prisma from '../config/prisma';

// ─── Instructor Dashboard Stats ───────────────────────────────────────────────

export const getInstructorStats = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.userId;

  const [courses, enrollmentData, paymentData, recentEnrollments] = await Promise.all([
    // All instructor courses
    prisma.course.findMany({
      where: { instructorId },
      select: {
        id: true, title: true, slug: true, status: true,
        thumbnail: true, price: true, totalStudents: true,
        avgRating: true, totalReviews: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Total enrollment count
    prisma.enrollment.count({
      where: { course: { instructorId } },
    }),

    // Total earnings (completed payments)
    prisma.payment.aggregate({
      where: { course: { instructorId }, status: 'COMPLETED' },
      _sum: { amount: true },
    }),

    // Recent 5 enrollments
    prisma.enrollment.findMany({
      where: { course: { instructorId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  // Monthly earnings for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyPayments = await prisma.payment.findMany({
    where: {
      course: { instructorId },
      status: 'COMPLETED',
      createdAt: { gte: sixMonthsAgo },
    },
    select: { amount: true, createdAt: true },
  });

  const monthlyEarnings: Record<string, number> = {};
  monthlyPayments.forEach((p) => {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
    monthlyEarnings[key] = (monthlyEarnings[key] || 0) + Number(p.amount);
  });

  sendSuccess(res, {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === 'PUBLISHED').length,
    totalStudents: enrollmentData,
    totalEarnings: paymentData._sum.amount ?? 0,
    courses,
    recentEnrollments,
    monthlyEarnings,
  }, 'Instructor stats');
});

// ─── Admin Dashboard Stats ────────────────────────────────────────────────────

export const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue,
    recentUsers,
    recentCourses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    }),
    prisma.course.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  const usersByRoleRaw = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });

  const usersByRole = Object.fromEntries(
    usersByRoleRaw.map(({ role, _count }) => [role, _count.role])
  );

  sendSuccess(res, {
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    usersByRole,
    recentUsers,
    recentCourses,
  }, 'Admin stats');
});

// ─── Admin: Update Course Status ──────────────────────────────────────────────

export const adminUpdateCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, isFeatured } = req.body;

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(isFeatured !== undefined && { isFeatured }),
    },
    select: { id: true, title: true, status: true, isFeatured: true },
  });

  sendSuccess(res, course, 'Course updated by admin');
});
