"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCourses = exports.getMyCourses = exports.deleteCourse = exports.publishCourse = exports.uploadThumbnail = exports.updateCourse = exports.getCourseById = exports.getCourseBySlug = exports.getCourses = exports.createCourse = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const s3_service_1 = require("../services/s3.service");
const video_service_1 = require("../services/video.service");
const s3_1 = require("../config/s3");
const slugify_1 = require("../utils/slugify");
const prisma_1 = __importDefault(require("../config/prisma"));
async function signResources(resources) {
    const list = resources ?? [];
    return Promise.all(list.map(async (r) => {
        if (r.type === 'attachment' && r.key) {
            return { ...r, url: await (0, s3_1.getDownloadPresignedUrl)(r.key, 3600) };
        }
        return r;
    }));
}
/** Refresh thumbnail and any nested instructor/user avatar with fresh presigned URLs. */
async function withFreshImageUrls(obj) {
    const out = { ...obj };
    if ('thumbnail' in out && out.thumbnail) {
        out.thumbnail = await (0, s3_service_1.s3ImageUrl)(out.thumbnail);
    }
    if ('avatar' in out && out.avatar) {
        out.avatar = await (0, s3_service_1.s3ImageUrl)(out.avatar);
    }
    // Nested instructor / user avatars
    if (out.instructor && typeof out.instructor === 'object') {
        const inst = out.instructor;
        if (inst.avatar) {
            out.instructor = { ...inst, avatar: await (0, s3_service_1.s3ImageUrl)(inst.avatar) };
        }
    }
    if (out.courses && Array.isArray(out.courses)) {
        out.courses = await Promise.all(out.courses.map((c) => withFreshImageUrls(c)));
    }
    return out;
}
// ─── Create Course ────────────────────────────────────────────────────────────
exports.createCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = req.user.userId;
    const data = req.body;
    // Only approved instructors can create courses
    const instructor = await prisma_1.default.user.findUnique({
        where: { id: instructorId },
        select: { instructorApproved: true },
    });
    if (!instructor?.instructorApproved) {
        throw new AppError_1.ForbiddenError('Your instructor account is not yet approved. Please complete the onboarding and wait for admin approval.');
    }
    let slug = (0, slugify_1.createSlug)(data.title);
    const existing = await prisma_1.default.course.findUnique({ where: { slug } });
    if (existing)
        slug = (0, slugify_1.createSlug)(data.title, true);
    const course = await prisma_1.default.course.create({
        data: {
            ...data,
            slug,
            instructorId,
            price: data.price,
        },
        include: { category: true, instructor: { select: { id: true, name: true, avatar: true } } },
    });
    (0, response_1.sendSuccess)(res, course, 'Course created', 201);
});
// ─── Browse Courses (public) ──────────────────────────────────────────────────
exports.getCourses = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 12, search, category, level, minPrice, maxPrice, sortBy = 'newest', language, } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
        status: 'PUBLISHED',
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } },
            ],
        }),
        ...(category && { category: { slug: category } }),
        ...(level && { level: level }),
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
    const orderBy = sortBy === 'newest' ? { createdAt: 'desc' }
        : sortBy === 'oldest' ? { createdAt: 'asc' }
            : sortBy === 'price_asc' ? { price: 'asc' }
                : sortBy === 'price_desc' ? { price: 'desc' }
                    : sortBy === 'popular' ? { totalStudents: 'desc' }
                        : sortBy === 'rating' ? { avgRating: 'desc' }
                            : { createdAt: 'desc' };
    const [courses, total] = await Promise.all([
        prisma_1.default.course.findMany({
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
        prisma_1.default.course.count({ where }),
    ]);
    const freshCourses = await Promise.all(courses.map(withFreshImageUrls));
    (0, response_1.sendSuccess)(res, freshCourses, 'Courses fetched', 200, (0, response_1.paginationMeta)(Number(page), Number(limit), total));
});
// ─── Get Course by Slug ───────────────────────────────────────────────────────
exports.getCourseBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { slug } = req.params;
    const course = await prisma_1.default.course.findUnique({
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
    if (!course || course.status !== 'PUBLISHED')
        throw new AppError_1.NotFoundError('Course');
    // Check if requesting user is enrolled (to unlock video URLs)
    let isEnrolled = false;
    if (req.user) {
        const enrollment = await prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId: req.user.userId, courseId: course.id } },
        });
        isEnrolled = !!enrollment || req.user.userId === course.instructorId;
    }
    const signLectures = async (lectures, allowAll) => Promise.all(lectures.map(async (l) => {
        const { hlsKey, ...rest } = l;
        if ((allowAll || l.isFree) && hlsKey) {
            return { ...rest, videoUrl: await (0, video_service_1.getHLSStreamUrl)(hlsKey) };
        }
        return { ...rest, videoUrl: allowAll ? (l.videoUrl ?? null) : null };
    }));
    const sectionsWithUrls = await Promise.all(course.sections.map(async (section) => ({
        ...section,
        lectures: await signLectures(section.lectures, isEnrolled),
    })));
    const freshCourse = await withFreshImageUrls({ ...course, sections: sectionsWithUrls, isEnrolled });
    (0, response_1.sendSuccess)(res, freshCourse, 'Course fetched');
});
// ─── Get Course by ID (instructor/admin/enrolled student) ────────────────────
exports.getCourseById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const course = await prisma_1.default.course.findUnique({
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
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    const isOwner = userId && (course.instructorId === userId || req.user?.role === 'ADMIN');
    if (!isOwner) {
        // Allow enrolled students to access their course content
        if (!userId)
            throw new AppError_1.NotFoundError('Course');
        const enrollment = await prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: course.id } },
        });
        if (!enrollment)
            throw new AppError_1.NotFoundError('Course');
    }
    // Sign lecture URLs — owners get all (including draft), students only get published
    const sectionsWithUrls = await Promise.all(course.sections.map(async (section) => ({
        ...section,
        lectures: await Promise.all(section.lectures
            .filter((l) => isOwner || l.isPublished !== false)
            .map(async (lecture) => {
            const { hlsKey, ...rest } = lecture;
            const signedResources = await signResources(lecture.resources);
            const videoProcessing = !!lecture.videoKey && !hlsKey;
            if (hlsKey) {
                return { ...rest, videoUrl: await (0, video_service_1.getHLSStreamUrl)(hlsKey), resources: signedResources, videoProcessing: false };
            }
            return { ...rest, resources: signedResources, videoProcessing };
        })),
    })));
    const freshCourse = await withFreshImageUrls({ ...course, sections: sectionsWithUrls });
    (0, response_1.sendSuccess)(res, freshCourse, 'Course fetched');
});
// ─── Update Course ─────────────────────────────────────────────────────────────
exports.updateCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const course = await prisma_1.default.course.findUnique({ where: { id } });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== userId && req.user.role !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    const updated = await prisma_1.default.course.update({
        where: { id },
        data: req.body,
        include: { category: true },
    });
    (0, response_1.sendSuccess)(res, updated, 'Course updated');
});
// ─── Upload Thumbnail ─────────────────────────────────────────────────────────
exports.uploadThumbnail = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file)
        throw new AppError_1.AppError('No thumbnail file provided', 400);
    const { id } = req.params;
    const userId = req.user.userId;
    const course = await prisma_1.default.course.findUnique({ where: { id } });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== userId && req.user.role !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    // Delete old thumbnail — handle both public URLs and presigned URLs\n  if (course.thumbnail) {\n    const oldKey = extractS3Key(course.thumbnail);\n    await removeFromS3(oldKey).catch(() => {});\n  }
    const { key, url } = await (0, s3_service_1.uploadToS3)(req.file.buffer, `thumbnails/${id}`, req.file.originalname, req.file.mimetype);
    // Store the S3 key (not the presigned URL) so it never expires in the DB
    const updated = await prisma_1.default.course.update({
        where: { id },
        data: { thumbnail: key },
        select: { id: true, thumbnail: true },
    });
    // Return the fresh presigned URL to the caller
    (0, response_1.sendSuccess)(res, { ...updated, thumbnail: url }, 'Thumbnail uploaded');
});
// ─── Publish / Unpublish Course ───────────────────────────────────────────────
exports.publishCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const course = await prisma_1.default.course.findUnique({
        where: { id },
        include: { sections: { include: { lectures: true } } },
    });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== userId && req.user.role !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    // Basic publish validation
    const hasPublishedLectures = course.sections.some((s) => s.lectures.some((l) => l.isPublished));
    if (!hasPublishedLectures && course.status === 'DRAFT') {
        throw new AppError_1.AppError('Add at least one published lecture before publishing', 400);
    }
    const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = await prisma_1.default.course.update({
        where: { id },
        data: { status: newStatus },
        select: { id: true, title: true, status: true },
    });
    (0, response_1.sendSuccess)(res, updated, `Course ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`);
});
// ─── Delete Course ─────────────────────────────────────────────────────────────
exports.deleteCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const course = await prisma_1.default.course.findUnique({ where: { id } });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== userId && req.user.role !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    const enrollmentCount = await prisma_1.default.enrollment.count({ where: { courseId: id } });
    if (enrollmentCount > 0) {
        throw new AppError_1.AppError('Cannot delete a course with enrolled students. Archive it instead.', 400);
    }
    await prisma_1.default.course.delete({ where: { id } });
    (0, response_1.sendSuccess)(res, null, 'Course deleted');
});
// ─── Instructor: Get My Courses ────────────────────────────────────────────────
exports.getMyCourses = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const [courses, total] = await Promise.all([
        prisma_1.default.course.findMany({
            where: { instructorId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                _count: { select: { enrollments: true, reviews: true, sections: true } },
            },
        }),
        prisma_1.default.course.count({ where: { instructorId } }),
    ]);
    const freshCourses = await Promise.all(courses.map(withFreshImageUrls));
    (0, response_1.sendSuccess)(res, freshCourses, 'Your courses', 200, (0, response_1.paginationMeta)(page, limit, total));
});
// ─── Admin: Get All Courses ───────────────────────────────────────────────────
exports.getAllCourses = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const status = req.query.status;
    const where = {
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(status && { status: status }),
    };
    const [courses, total] = await Promise.all([
        prisma_1.default.course.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                instructor: { select: { id: true, name: true, email: true } },
                _count: { select: { enrollments: true } },
            },
        }),
        prisma_1.default.course.count({ where }),
    ]);
    const freshCourses = await Promise.all(courses.map(withFreshImageUrls));
    (0, response_1.sendSuccess)(res, freshCourses, 'All courses', 200, (0, response_1.paginationMeta)(page, limit, total));
});
//# sourceMappingURL=course.controller.js.map