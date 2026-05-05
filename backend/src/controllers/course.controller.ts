import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess, paginationMeta } from '../utils/response';
import { NotFoundError, ForbiddenError, AppError, UnauthorizedError } from '../utils/AppError';
import { uploadToS3, removeFromS3, s3ImageUrl, extractS3Key } from '../services/s3.service';
import { getHLSStreamUrl } from '../services/video.service';
import { getDownloadPresignedUrl } from '../config/s3';
import { createSlug } from '../utils/slugify';
import prisma from '../config/prisma';

type ResourceEntry = { type: string; title: string; url: string; key?: string };

async function signResources(resources: unknown): Promise<ResourceEntry[]> {
  const list = (resources as ResourceEntry[] | null) ?? [];
  return Promise.all(
    list.map(async (r) => {
      if (r.type === 'attachment' && r.key) {
        return { ...r, url: await getDownloadPresignedUrl(r.key, 3600) };
      }
      return r;
    }),
  );
}

/** Refresh thumbnail and any nested instructor/user avatar with fresh presigned URLs. */
async function withFreshImageUrls<T extends Record<string, unknown>>(obj: T): Promise<T> {
  const out: Record<string, unknown> = { ...obj };

  if ('thumbnail' in out && out.thumbnail) {
    out.thumbnail = await s3ImageUrl(out.thumbnail as string);
  }
  if ('avatar' in out && out.avatar) {
    out.avatar = await s3ImageUrl(out.avatar as string);
  }
  // Nested instructor / user avatars
  if (out.instructor && typeof out.instructor === 'object') {
    const inst = out.instructor as Record<string, unknown>;
    if (inst.avatar) {
      out.instructor = { ...inst, avatar: await s3ImageUrl(inst.avatar as string) };
    }
  }
  if (out.courses && Array.isArray(out.courses)) {
    out.courses = await Promise.all(
      (out.courses as Record<string, unknown>[]).map((c) => withFreshImageUrls(c)),
    );
  }
  return out as T;
}

// ─── Create Course ────────────────────────────────────────────────────────────

export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.userId;
  const data = req.body;

  // Only approved instructors can create courses
  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { instructorApproved: true },
  });
  if (!instructor?.instructorApproved) {
    throw new ForbiddenError('Your instructor account is not yet approved. Please complete the onboarding and wait for admin approval.');
  }

  let slug = createSlug(data.title);
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) slug = createSlug(data.title, true);

  const course = await prisma.course.create({
    data: {
      ...data,
      slug,
      instructorId,
      price: data.price,
    },
    include: { category: true, instructor: { select: { id: true, name: true, avatar: true } } },
  });

  sendSuccess(res, course, 'Course created', 201);
});

// ─── Browse Courses (public) ──────────────────────────────────────────────────

export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1, limit = 12, search, category, level,
    minPrice, maxPrice, sortBy = 'newest', language,
  } = req.query as Record<string, string>;

  const skip = (Number(page) - 1) * Number(limit);

  const where: Prisma.CourseWhereInput = {
    status: 'PUBLISHED',
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ],
    }),
    ...(category && { category: { slug: category } }),
    ...(level && { level: level as Prisma.EnumCourseLevelFilter }),
    ...(language && { language: { equals: language, mode: 'insensitive' } }),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) }),
          },
        }
      : {}),
  };

  const orderBy: Prisma.CourseOrderByWithRelationInput =
    sortBy === 'newest' ? { createdAt: 'desc' }
    : sortBy === 'oldest' ? { createdAt: 'asc' }
    : sortBy === 'price_asc' ? { price: 'asc' }
    : sortBy === 'price_desc' ? { price: 'desc' }
    : sortBy === 'popular' ? { totalStudents: 'desc' }
    : sortBy === 'rating' ? { avgRating: 'desc' }
    : { createdAt: 'desc' };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      select: {
        id: true, title: true, slug: true, shortDesc: true,
        thumbnail: true, price: true, discountPrice: true,
        level: true, language: true, avgRating: true,
        totalReviews: true, totalStudents: true, totalLectures: true,
        totalDuration: true, tags: true, createdAt: true,
        instructor: { select: { id: true, name: true, avatar: true, headline: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const freshCourses = await Promise.all(courses.map(withFreshImageUrls));
  sendSuccess(res, freshCourses, 'Courses fetched', 200, paginationMeta(Number(page), Number(limit), total));
});

// ─── Get Course by Slug ───────────────────────────────────────────────────────

export const getCourseBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: {
        select: {
          id: true, name: true, avatar: true,
          headline: true, bio: true, website: true,
          _count: { select: { courses: true, enrollments: true } },
        },
      },
      category: true,
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lectures: {
            orderBy: { order: 'asc' },
            select: {
              id: true, title: true, duration: true,
              isFree: true, isPublished: true, order: true,
              videoUrl: true, hlsKey: true, // hlsKey used to generate fresh pre-signed URLs
            },
          },
        },
      },
      reviews: {
        where: { isHidden: false },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course || course.status !== 'PUBLISHED') throw new NotFoundError('Course');

  // Check if requesting user is enrolled (to unlock video URLs)
  let isEnrolled = false;
  if (req.user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.userId, courseId: course.id } },
    });
    isEnrolled = !!enrollment || req.user.userId === course.instructorId;
  }

  // Generate fresh pre-signed stream URLs from hlsKey; strip hlsKey from response.
  // Enrolled users / instructor get all lecture URLs; others only get isFree ones.
  type RawLecture = typeof course.sections[0]['lectures'][0];
  const signLectures = async (lectures: RawLecture[], allowAll: boolean) =>
    Promise.all(
      lectures.map(async (l) => {
        const { hlsKey, ...rest } = l;
        if ((allowAll || l.isFree) && hlsKey) {
          return { ...rest, videoUrl: await getHLSStreamUrl(hlsKey) };
        }
        return { ...rest, videoUrl: allowAll ? (l.videoUrl ?? null) : null };
      }),
    );

  const sectionsWithUrls = await Promise.all(
    course.sections.map(async (section) => ({
      ...section,
      lectures: await signLectures(section.lectures, isEnrolled),
    })),
  );

  const freshCourse = await withFreshImageUrls({ ...course, sections: sectionsWithUrls, isEnrolled });
  sendSuccess(res, freshCourse, 'Course fetched');
});

// ─── Get Course by ID (instructor/admin/enrolled student) ────────────────────

export const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lectures: { orderBy: { order: 'asc' } },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) throw new NotFoundError('Course');

  const isOwner = userId && (course.instructorId === userId || req.user?.role === 'ADMIN');

  if (!isOwner) {
    // Allow enrolled students to access their course content
    if (!userId) throw new UnauthorizedError('You must be logged in to access this course');
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment) throw new ForbiddenError('You must be enrolled in this course to access it');
  }

  // Sign lecture URLs — owners get all (including draft), students only get published
  const sectionsWithUrls = await Promise.all(
    course.sections.map(async (section) => ({
      ...section,
      lectures: await Promise.all(
        section.lectures
          .filter((l) => isOwner || (l as typeof l & { isPublished?: boolean }).isPublished !== false)
          .map(async (lecture) => {
            const { hlsKey, ...rest } = lecture as typeof lecture & { hlsKey?: string | null };
            const signedResources = await signResources((lecture as unknown as { resources: unknown }).resources);
            const videoProcessing = !!(lecture as unknown as { videoKey?: string }).videoKey && !hlsKey;
            if (hlsKey) {
              return { ...rest, videoUrl: await getHLSStreamUrl(hlsKey), resources: signedResources, videoProcessing: false };
            }
            return { ...rest, resources: signedResources, videoProcessing };
          }),
      ),
    })),
  );

  const freshCourse = await withFreshImageUrls({ ...course, sections: sectionsWithUrls } as Record<string, unknown>);
  sendSuccess(res, freshCourse, 'Course fetched');
});

// ─── Update Course ─────────────────────────────────────────────────────────────

export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== userId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }

  const updated = await prisma.course.update({
    where: { id },
    data: req.body,
    include: { category: true },
  });

  sendSuccess(res, updated, 'Course updated');
});

// ─── Upload Thumbnail ─────────────────────────────────────────────────────────

export const uploadThumbnail = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No thumbnail file provided', 400);
  const { id } = req.params;
  const userId = req.user!.userId;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== userId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }

  // Delete old thumbnail — handle both public URLs and presigned URLs\n  if (course.thumbnail) {\n    const oldKey = extractS3Key(course.thumbnail);\n    await removeFromS3(oldKey).catch(() => {});\n  }

  const { key, url } = await uploadToS3(
    req.file.buffer,
    `thumbnails/${id}`,
    req.file.originalname,
    req.file.mimetype,
  );

  // Store the S3 key (not the presigned URL) so it never expires in the DB
  const updated = await prisma.course.update({
    where: { id },
    data: { thumbnail: key },
    select: { id: true, thumbnail: true },
  });

  // Return the fresh presigned URL to the caller
  sendSuccess(res, { ...updated, thumbnail: url }, 'Thumbnail uploaded');
});

// ─── Publish / Unpublish Course ───────────────────────────────────────────────

export const publishCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { sections: { include: { lectures: true } } },
  });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== userId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }

  // Basic publish validation
  const hasPublishedLectures = course.sections.some((s) =>
    s.lectures.some((l) => l.isPublished),
  );
  if (!hasPublishedLectures && course.status === 'DRAFT') {
    throw new AppError('Add at least one published lecture before publishing', 400);
  }

  const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  const updated = await prisma.course.update({
    where: { id },
    data: { status: newStatus },
    select: { id: true, title: true, status: true },
  });

  sendSuccess(res, updated, `Course ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`);
});

// ─── Delete Course ─────────────────────────────────────────────────────────────

export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new NotFoundError('Course');
  if (course.instructorId !== userId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }

  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } });
  if (enrollmentCount > 0) {
    throw new AppError(
      'Cannot delete a course with enrolled students. Archive it instead.',
      400,
    );
  }

  await prisma.course.delete({ where: { id } });
  sendSuccess(res, null, 'Course deleted');
});

// ─── Instructor: Get My Courses ────────────────────────────────────────────────

export const getMyCourses = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: { select: { enrollments: true, reviews: true, sections: true } },
      },
    }),
    prisma.course.count({ where: { instructorId } }),
  ]);

  const freshCourses = await Promise.all(courses.map(withFreshImageUrls));
  sendSuccess(res, freshCourses, 'Your courses', 200, paginationMeta(page, limit, total));
});

// ─── Admin: Get All Courses ───────────────────────────────────────────────────

export const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;

  const where: Prisma.CourseWhereInput = {
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(status && { status: status as Prisma.EnumCourseStatusFilter }),
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const freshCourses = await Promise.all(courses.map(withFreshImageUrls));
  sendSuccess(res, freshCourses, 'All courses', 200, paginationMeta(page, limit, total));
});
