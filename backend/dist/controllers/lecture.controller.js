"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranscript = exports.deleteQuestion = exports.addQuestion = exports.deleteResource = exports.uploadAttachment = exports.reorderLectures = exports.getLecture = exports.uploadVideo = exports.deleteLecture = exports.updateLecture = exports.createLecture = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const s3_service_1 = require("../services/s3.service");
const video_service_1 = require("../services/video.service");
const transcribe_service_1 = require("../services/transcribe.service");
const s3_1 = require("../config/s3");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
/** Re-generate pre-signed download URLs for attachment resources that have a stored key. */
async function signResources(resources) {
    const list = resources ?? [];
    return Promise.all(list.map(async (r) => {
        if (r.type === 'attachment' && r.key) {
            return { ...r, url: await (0, s3_1.getDownloadPresignedUrl)(r.key, 3600) };
        }
        return r;
    }));
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertSectionOwner(sectionId, userId, userRole) {
    const section = await prisma_1.default.section.findUnique({
        where: { id: sectionId },
        include: { course: { select: { instructorId: true } } },
    });
    if (!section)
        throw new AppError_1.NotFoundError('Section');
    if (section.course.instructorId !== userId && userRole !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
    return section;
}
async function assertEnrolledOrOwner(lectureId, userId, userRole) {
    const lecture = await prisma_1.default.lecture.findUnique({
        where: { id: lectureId },
        include: { section: { include: { course: true } } },
    });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const course = lecture.section.course;
    // Instructor or admin can always access
    if (course.instructorId === userId || userRole === 'ADMIN')
        return lecture;
    // Free lectures are accessible to all authenticated users
    if (lecture.isFree)
        return lecture;
    // Check enrollment for paid content
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment)
        throw new AppError_1.ForbiddenError('You must enroll in this course to watch this lecture');
    return lecture;
}
// ─── Create Lecture ───────────────────────────────────────────────────────────
exports.createLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId } = req.params;
    const { title, description, isFree, order } = req.body;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lastLecture = await prisma_1.default.lecture.findFirst({
        where: { sectionId },
        orderBy: { order: 'desc' },
    });
    const lectureOrder = order ?? (lastLecture ? lastLecture.order + 1 : 0);
    const lecture = await prisma_1.default.lecture.create({
        data: { title, description, isFree: isFree ?? false, order: lectureOrder, sectionId },
    });
    (0, response_1.sendSuccess)(res, lecture, 'Lecture created', 201);
});
// ─── Update Lecture ───────────────────────────────────────────────────────────
exports.updateLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId, lectureId } = req.params;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const updated = await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: req.body,
    });
    (0, response_1.sendSuccess)(res, updated, 'Lecture updated');
});
// ─── Delete Lecture ────────────────────────────────────────────────────────────
exports.deleteLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId, lectureId } = req.params;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    // Clean up S3 files
    if (lecture.videoKey)
        await (0, s3_service_1.removeFromS3)(lecture.videoKey).catch(() => { });
    if (lecture.hlsKey) {
        // Delete all HLS segments (best-effort)
        await (0, s3_service_1.removeFromS3)(lecture.hlsKey).catch(() => { });
    }
    await prisma_1.default.lecture.delete({ where: { id: lectureId } });
    // Recalculate course stats
    await updateCourseStats(lecture.sectionId);
    (0, response_1.sendSuccess)(res, null, 'Lecture deleted');
});
// ─── Upload Video ─────────────────────────────────────────────────────────────
exports.uploadVideo = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file)
        throw new AppError_1.AppError('No video file provided', 400);
    const { sectionId, lectureId } = req.params;
    const section = await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    // Delete old video if exists
    if (lecture.videoKey)
        await (0, s3_service_1.removeFromS3)(lecture.videoKey).catch(() => { });
    // 1. Upload original to S3 — fast operation (~1–5s depending on file size)
    const { key: videoKey } = await (0, s3_service_1.uploadToS3)(req.file.buffer, `raw-videos/${section.courseId}`, req.file.originalname, req.file.mimetype);
    // 2. Mark lecture as "video received, HLS processing" and clear stale HLS data.
    await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: { videoKey, hlsKey: null, videoUrl: null, isPublished: false, duration: null },
    });
    // 3. Respond immediately — the client no longer waits for ffmpeg.
    (0, response_1.sendSuccess)(res, { processing: true }, 'Video uploaded, HLS conversion started in background');
    // 4. Background: HLS conversion → DB update → transcription (fire-and-forget).
    //    Node.js keeps executing after res.send(); buffer stays in memory until GC.
    const videoBuffer = req.file.buffer;
    (0, video_service_1.convertToHLS)(videoBuffer, section.courseId, lectureId)
        .then(async ({ hlsKey, duration }) => {
        await prisma_1.default.lecture.update({
            where: { id: lectureId },
            data: { hlsKey, videoUrl: null, duration: Math.round(duration), isPublished: true },
        });
        await updateCourseStats(sectionId);
        // Kick off AWS Transcribe after HLS is ready
        return (0, transcribe_service_1.startTranscriptionJob)(videoKey, lectureId);
    })
        .then(async (jobName) => {
        await prisma_1.default.lecture.update({
            where: { id: lectureId },
            data: { transcriptJobName: jobName, transcriptStatus: 'IN_PROGRESS' },
        });
        logger_1.default.info(`HLS + transcription complete for lecture ${lectureId}`);
    })
        .catch((err) => logger_1.default.error(`Background HLS/transcription failed for lecture ${lectureId}:`, err));
});
// ─── Get Lecture (authenticated + enrolled) ───────────────────────────────────
exports.getLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.UnauthorizedError();
    const { lectureId } = req.params;
    const lecture = await assertEnrolledOrOwner(lectureId, req.user.userId, req.user.role);
    // If the lecture has a stored HLS key, generate a fresh pre-signed stream URL.
    // This ensures the URL is always valid regardless of when it was originally created.
    let streamUrl = lecture.videoUrl ?? null;
    if (lecture.hlsKey) {
        streamUrl = await (0, video_service_1.getHLSStreamUrl)(lecture.hlsKey);
    }
    // Re-sign attachment resources so their download URLs never expire.
    const signedResources = await signResources(lecture.resources);
    (0, response_1.sendSuccess)(res, { ...lecture, videoUrl: streamUrl, resources: signedResources }, 'Lecture fetched');
});
// ─── Reorder Lectures ─────────────────────────────────────────────────────────
exports.reorderLectures = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId } = req.params;
    const { lectures } = req.body;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    await prisma_1.default.$transaction(lectures.map(({ id, order }) => prisma_1.default.lecture.update({ where: { id }, data: { order } })));
    (0, response_1.sendSuccess)(res, null, 'Lectures reordered');
});
// ─── Upload Attachment ────────────────────────────────────────────────────────
exports.uploadAttachment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file)
        throw new AppError_1.AppError('No file provided', 400);
    const { sectionId, lectureId } = req.params;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const { key, url } = await (0, s3_service_1.uploadToS3)(req.file.buffer, `attachments/${lectureId}`, req.file.originalname, req.file.mimetype);
    const existing = lecture.resources ?? [];
    const updated = await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: {
            resources: [
                ...existing,
                { type: 'attachment', title: req.file.originalname, url, key },
            ],
        },
    });
    (0, response_1.sendSuccess)(res, updated, 'Attachment uploaded');
});
// ─── Delete Resource ──────────────────────────────────────────────────────────
exports.deleteResource = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId, lectureId } = req.params;
    const { url } = req.body;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const existing = lecture.resources ?? [];
    const toRemove = existing.find((r) => r.url === url);
    // Clean up S3 file if it was an attachment
    if (toRemove?.key) {
        await (0, s3_service_1.removeFromS3)(toRemove.key).catch(() => { });
    }
    const updated = await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: { resources: existing.filter((r) => r.url !== url) },
    });
    (0, response_1.sendSuccess)(res, updated, 'Resource removed');
});
// ─── Add Question ─────────────────────────────────────────────────────────────
exports.addQuestion = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId, lectureId } = req.params;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const { question, options, correctIndex, showAtSecond, explanation } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
        throw new AppError_1.AppError('question, options[] (min 2), and correctIndex are required', 400);
    }
    const newQuestion = {
        id: crypto.randomUUID(),
        question,
        options,
        correctIndex: Number(correctIndex),
        showAtSecond: Number(showAtSecond),
        explanation,
    };
    const existing = lecture.questions ?? [];
    const updated = await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: { questions: [...existing, newQuestion] },
    });
    (0, response_1.sendSuccess)(res, updated, 'Question added', 201);
});
// ─── Delete Question ──────────────────────────────────────────────────────────
exports.deleteQuestion = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { sectionId, lectureId, questionId } = req.params;
    await assertSectionOwner(sectionId, req.user.userId, req.user.role);
    const lecture = await prisma_1.default.lecture.findFirst({ where: { id: lectureId, sectionId } });
    if (!lecture)
        throw new AppError_1.NotFoundError('Lecture');
    const existing = lecture.questions ?? [];
    const updated = await prisma_1.default.lecture.update({
        where: { id: lectureId },
        data: { questions: existing.filter((q) => q.id !== questionId) },
    });
    (0, response_1.sendSuccess)(res, updated, 'Question deleted');
});
// ─── Get / Poll Transcript ────────────────────────────────────────────────────
exports.getTranscript = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.UnauthorizedError();
    const { lectureId } = req.params;
    const lecture = await assertEnrolledOrOwner(lectureId, req.user.userId, req.user.role);
    // Already completed → return cached text
    if (lecture.transcriptStatus === 'COMPLETED' && lecture.transcript) {
        (0, response_1.sendSuccess)(res, { status: 'COMPLETED', transcript: lecture.transcript });
        return;
    }
    // No video yet
    if (!lecture.videoKey) {
        (0, response_1.sendSuccess)(res, { status: 'NO_VIDEO' });
        return;
    }
    // Not started → kick off job now
    if (!lecture.transcriptJobName) {
        const jobName = await (0, transcribe_service_1.startTranscriptionJob)(lecture.videoKey, lectureId);
        await prisma_1.default.lecture.update({
            where: { id: lectureId },
            data: { transcriptJobName: jobName, transcriptStatus: 'IN_PROGRESS' },
        });
        (0, response_1.sendSuccess)(res, { status: 'IN_PROGRESS' });
        return;
    }
    // Already running → check AWS for latest status
    const { status, transcriptText } = await (0, transcribe_service_1.checkTranscriptionJob)(lecture.transcriptJobName, lectureId);
    if (status === 'COMPLETED' && transcriptText) {
        await prisma_1.default.lecture.update({
            where: { id: lectureId },
            data: { transcriptStatus: 'COMPLETED', transcript: transcriptText },
        });
        (0, response_1.sendSuccess)(res, { status: 'COMPLETED', transcript: transcriptText });
        return;
    }
    if (status === 'FAILED') {
        await prisma_1.default.lecture.update({
            where: { id: lectureId },
            data: { transcriptStatus: 'FAILED' },
        });
        (0, response_1.sendSuccess)(res, { status: 'FAILED' });
        return;
    }
    (0, response_1.sendSuccess)(res, { status });
});
// ─── Private helper ───────────────────────────────────────────────────────────
async function updateCourseStats(sectionId) {
    const section = await prisma_1.default.section.findUnique({
        where: { id: sectionId },
        select: { courseId: true },
    });
    if (!section)
        return;
    const lectures = await prisma_1.default.lecture.findMany({
        where: { section: { courseId: section.courseId } },
        select: { duration: true },
    });
    const totalDuration = lectures.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const totalLectures = lectures.length;
    await prisma_1.default.course.update({
        where: { id: section.courseId },
        data: { totalDuration, totalLectures },
    });
}
//# sourceMappingURL=lecture.controller.js.map