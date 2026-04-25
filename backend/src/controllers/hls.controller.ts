import { Request, Response } from 'express';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { catchAsync } from '../utils/catchAsync';
import { NotFoundError, ForbiddenError } from '../utils/AppError';
import { s3Client, S3_BUCKET, getDownloadPresignedUrl } from '../config/s3';
import prisma from '../config/prisma';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

async function fetchS3Text(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  const response = await s3Client.send(cmd);
  if (!response.Body) throw new NotFoundError('HLS content');
  return streamToString(response.Body as Readable);
}

/**
 * Checks whether the requesting user is allowed to access the lecture's HLS content.
 * Free lectures are open to all (including unauthenticated users).
 * Paid lectures require authentication + enrollment (or instructor/admin access).
 * Returns the lecture's hlsKey on success.
 */
async function assertHLSAccess(lectureId: string, userId?: string, userRole?: string): Promise<string> {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      section: { include: { course: { select: { id: true, instructorId: true } } } },
    },
  });
  if (!lecture || !lecture.hlsKey) throw new NotFoundError('Lecture');

  const course = lecture.section.course;

  // Free lectures: accessible without authentication
  if (lecture.isFree) return lecture.hlsKey;

  // Paid content: authentication required
  if (!userId) throw new ForbiddenError('Authentication required to access this content');

  // Course owner or admin: always allowed
  if (course.instructorId === userId || userRole === 'ADMIN') return lecture.hlsKey;

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) throw new ForbiddenError('You must enroll in this course to access this content');

  return lecture.hlsKey;
}

// ─── Stream master.m3u8 ───────────────────────────────────────────────────────
// Fetches master.m3u8 from S3 and rewrites variant playlist filenames
// (e.g. "720p.m3u8") to backend proxy URLs so hls.js never hits S3 directly
// for playlists.

export const streamMasterPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const hlsKey = await assertHLSAccess(lectureId, req.user?.userId, req.user?.role);

  const content = await fetchS3Text(`${hlsKey}/master.m3u8`);

  const apiBase = process.env.API_URL ?? 'http://localhost:5000/api/v1';

  const rewritten = content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      // Rewrite variant playlist references (e.g. "720p.m3u8") to proxy URLs
      if (trimmed.endsWith('.m3u8') && !trimmed.startsWith('#') && !trimmed.startsWith('http')) {
        return `${apiBase}/hls/${lectureId}/${trimmed}`;
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

export const streamVariantPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { lectureId, filename } = req.params;

  // Prevent path traversal
  if (!/^[a-zA-Z0-9_-]+\.m3u8$/.test(filename)) {
    throw new ForbiddenError('Invalid playlist filename');
  }

  const hlsKey = await assertHLSAccess(lectureId, req.user?.userId, req.user?.role);

  const content = await fetchS3Text(`${hlsKey}/${filename}`);

  // Rewrite absolute S3 key lines ("hls/…/xxx.ts") to pre-signed URLs.
  // Each segment gets a 1-hour TTL — enough for an entire viewing session.
  const lines = await Promise.all(
    content.split('\n').map(async (line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('hls/') && trimmed.endsWith('.ts')) {
        return getDownloadPresignedUrl(trimmed, 3600);
      }
      return line;
    }),
  );

  res.setHeader('Content-Type', 'application/vnd.apple.mpegURL');
  res.setHeader('Cache-Control', 'no-store');
  res.send(lines.join('\n'));
});
