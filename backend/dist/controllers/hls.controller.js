"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamVariantPlaylist = exports.streamMasterPlaylist = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const s3_1 = require("../config/s3");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Helpers ──────────────────────────────────────────────────────────────────
async function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}
async function fetchS3Text(key) {
    const cmd = new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET, Key: key });
    const response = await s3_1.s3Client.send(cmd);
    if (!response.Body)
        throw new AppError_1.NotFoundError('HLS content');
    return streamToString(response.Body);
}
/**
 * Checks whether the requesting user is allowed to access the lecture's HLS content.
 * Free lectures are open to all (including unauthenticated users).
 * Paid lectures require authentication + enrollment (or instructor/admin access).
 * Returns the lecture's hlsKey on success.
 */
async function assertHLSAccess(lectureId, userId, userRole) {
    const lecture = await prisma_1.default.lecture.findUnique({
        where: { id: lectureId },
        include: {
            section: { include: { course: { select: { id: true, instructorId: true } } } },
        },
    });
    if (!lecture || !lecture.hlsKey)
        throw new AppError_1.NotFoundError('Lecture');
    const course = lecture.section.course;
    // Free lectures: accessible without authentication
    if (lecture.isFree)
        return lecture.hlsKey;
    // Paid content: authentication required
    if (!userId)
        throw new AppError_1.ForbiddenError('Authentication required to access this content');
    // Course owner or admin: always allowed
    if (course.instructorId === userId || userRole === 'ADMIN')
        return lecture.hlsKey;
    // Check enrollment
    const enrollment = await prisma_1.default.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment)
        throw new AppError_1.ForbiddenError('You must enroll in this course to access this content');
    return lecture.hlsKey;
}
// ─── Stream master.m3u8 ───────────────────────────────────────────────────────
// Fetches master.m3u8 from S3 and rewrites variant playlist filenames
// (e.g. "720p.m3u8") to backend proxy URLs so hls.js never hits S3 directly
// for playlists.
exports.streamMasterPlaylist = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { lectureId } = req.params;
    const hlsKey = await assertHLSAccess(lectureId, req.user?.userId, req.user?.role);
    const content = await fetchS3Text(`${hlsKey}/master.m3u8`);
    const apiBase = process.env.API_URL ?? 'http://:5000/api/v1';
    // Propagate the ?token= query param (used by native players that can't set headers)
    // so variant playlist requests are also authenticated through the proxy.
    const tokenParam = req.query.token ? `?token=${encodeURIComponent(req.query.token)}` : '';
    const rewritten = content
        .split('\n')
        .map((line) => {
        const trimmed = line.trim();
        // Rewrite variant playlist references (e.g. "720p.m3u8") to proxy URLs
        if (trimmed.endsWith('.m3u8') && !trimmed.startsWith('#') && !trimmed.startsWith('http')) {
            return `${apiBase}/hls/${lectureId}/${trimmed}${tokenParam}`;
        }
        return line;
    })
        .join('\n');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegURL');
    res.setHeader('Cache-Control', 'no-store');
    res.send(rewritten);
});
// ─── Stream variant playlist (e.g. 720p.m3u8) ────────────────────────────────
// Fetches the variant playlist from S3 and rewrites absolute S3 segment keys
// (e.g. "hls/courseId/lectureId/720p_000.ts") to 1-hour pre-signed S3 URLs
// so hls.js can fetch segments directly from S3 without going through this proxy.
exports.streamVariantPlaylist = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { lectureId, filename } = req.params;
    // Prevent path traversal
    if (!/^[a-zA-Z0-9_-]+\.m3u8$/.test(filename)) {
        throw new AppError_1.ForbiddenError('Invalid playlist filename');
    }
    const hlsKey = await assertHLSAccess(lectureId, req.user?.userId, req.user?.role);
    const content = await fetchS3Text(`${hlsKey}/${filename}`);
    // Rewrite absolute S3 key lines ("hls/…/xxx.ts") to pre-signed URLs.
    // Each segment gets a 1-hour TTL — enough for an entire viewing session.
    const lines = await Promise.all(content.split('\n').map(async (line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('hls/') && trimmed.endsWith('.ts')) {
            return (0, s3_1.getDownloadPresignedUrl)(trimmed, 3600);
        }
        return line;
    }));
    res.setHeader('Content-Type', 'application/vnd.apple.mpegURL');
    res.setHeader('Cache-Control', 'no-store');
    res.send(lines.join('\n'));
});
//# sourceMappingURL=hls.controller.js.map