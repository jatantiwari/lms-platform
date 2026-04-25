import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError, AppError, UnauthorizedError } from '../utils/AppError';
import { uploadToS3, removeFromS3 } from '../services/s3.service';
import { convertToHLS, getHLSStreamUrl } from '../services/video.service';
import { startTranscriptionJob, checkTranscriptionJob } from '../services/transcribe.service';
import { getDownloadPresignedUrl } from '../config/s3';
import prisma from '../config/prisma';
import logger from '../config/logger';

type LectureQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  showAtSecond: number;
  explanation?: string;
};

type ResourceEntry = { type: string; title: string; url: string; key?: string };

/** Re-generate pre-signed download URLs for attachment resources that have a stored key. */
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertSectionOwner(sectionId: string, userId: string, userRole: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!section) throw new NotFoundError('Section');
  if (section.course.instructorId !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenError('You do not own this course');
  }
  return section;
}

async function assertEnrolledOrOwner(lectureId: string, userId: string, userRole: string) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: { include: { course: true } } },
  });
  if (!lecture) throw new NotFoundError('Lecture');

  const course = lecture.section.course;

  // Instructor or admin can always access
  if (course.instructorId === userId || userRole === 'ADMIN') return lecture;

  // Free lectures are accessible to all authenticated users
  if (lecture.isFree) return lecture;

  // Check enrollment for paid content
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) throw new ForbiddenError('You must enroll in this course to watch this lecture');

  return lecture;
}

// ─── Create Lecture ───────────────────────────────────────────────────────────

export const createLecture = catchAsync(async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { title, description, isFree, order } = req.body;

  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);

  const lastLecture = await prisma.lecture.findFirst({
    where: { sectionId },
    orderBy: { order: 'desc' },
  });
  const lectureOrder = order ?? (lastLecture ? lastLecture.order + 1 : 0);

  const lecture = await prisma.lecture.create({
    data: { title, description, isFree: isFree ?? false, order: lectureOrder, sectionId },
  });

  sendSuccess(res, lecture, 'Lecture created', 201);
});

// ─── Update Lecture ───────────────────────────────────────────────────────────

export const updateLecture = catchAsync(async (req: Request, res: Response) => {
  const { sectionId, lectureId } = req.params;
  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);

  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  const updated = await prisma.lecture.update({
    where: { id: lectureId },
    data: req.body,
  });

  sendSuccess(res, updated, 'Lecture updated');
});

// ─── Delete Lecture ────────────────────────────────────────────────────────────

export const deleteLecture = catchAsync(async (req: Request, res: Response) => {
  const { sectionId, lectureId } = req.params;
  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);

  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  // Clean up S3 files
  if (lecture.videoKey) await removeFromS3(lecture.videoKey).catch(() => {});
  if (lecture.hlsKey) {
    // Delete all HLS segments (best-effort)
    await removeFromS3(lecture.hlsKey).catch(() => {});
  }

  await prisma.lecture.delete({ where: { id: lectureId } });

  // Recalculate course stats
  await updateCourseStats(lecture.sectionId);

  sendSuccess(res, null, 'Lecture deleted');
});

// ─── Upload Video ─────────────────────────────────────────────────────────────

export const uploadVideo = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No video file provided', 400);
  const { sectionId, lectureId } = req.params;

  const section = await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);
  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  // Delete old video if exists
  if (lecture.videoKey) await removeFromS3(lecture.videoKey).catch(() => {});

  // 1. Upload original to S3 — fast operation (~1–5s depending on file size)
  const { key: videoKey } = await uploadToS3(
    req.file.buffer,
    `raw-videos/${section.courseId}`,
    req.file.originalname,
    req.file.mimetype,
  );

  // 2. Mark lecture as "video received, HLS processing" and clear stale HLS data.
  await prisma.lecture.update({
    where: { id: lectureId },
    data: { videoKey, hlsKey: null, videoUrl: null, isPublished: false, duration: null },
  });

  // 3. Respond immediately — the client no longer waits for ffmpeg.
  sendSuccess(res, { processing: true }, 'Video uploaded, HLS conversion started in background');

  // 4. Background: HLS conversion → DB update → transcription (fire-and-forget).
  //    Node.js keeps executing after res.send(); buffer stays in memory until GC.
  const videoBuffer = req.file.buffer;
  convertToHLS(videoBuffer, section.courseId, lectureId)
    .then(async ({ hlsKey, duration }) => {
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { hlsKey, videoUrl: null, duration: Math.round(duration), isPublished: true },
      });
      await updateCourseStats(sectionId);

      // Kick off AWS Transcribe after HLS is ready
      return startTranscriptionJob(videoKey, lectureId);
    })
    .then(async (jobName) => {
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { transcriptJobName: jobName, transcriptStatus: 'IN_PROGRESS' },
      });
      logger.info(`HLS + transcription complete for lecture ${lectureId}`);
    })
    .catch((err) => logger.error(`Background HLS/transcription failed for lecture ${lectureId}:`, err));
});

// ─── Get Lecture (authenticated + enrolled) ───────────────────────────────────

export const getLecture = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { lectureId } = req.params;

  const lecture = await assertEnrolledOrOwner(lectureId, req.user.userId, req.user.role);

  // If the lecture has a stored HLS key, generate a fresh pre-signed stream URL.
  // This ensures the URL is always valid regardless of when it was originally created.
  let streamUrl = lecture.videoUrl ?? null;
  if (lecture.hlsKey) {
    streamUrl = await getHLSStreamUrl(lecture.hlsKey);
  }

  // Re-sign attachment resources so their download URLs never expire.
  const signedResources = await signResources(lecture.resources);

  sendSuccess(res, { ...lecture, videoUrl: streamUrl, resources: signedResources }, 'Lecture fetched');
});

// ─── Reorder Lectures ─────────────────────────────────────────────────────────

export const reorderLectures = catchAsync(async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { lectures } = req.body as { lectures: { id: string; order: number }[] };
  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);

  await prisma.$transaction(
    lectures.map(({ id, order }) =>
      prisma.lecture.update({ where: { id }, data: { order } }),
    ),
  );

  sendSuccess(res, null, 'Lectures reordered');
});

// ─── Upload Attachment ────────────────────────────────────────────────────────

export const uploadAttachment = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file provided', 400);
  const { sectionId, lectureId } = req.params;

  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);
  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  const { key, url } = await uploadToS3(
    req.file.buffer,
    `attachments/${lectureId}`,
    req.file.originalname,
    req.file.mimetype,
  );

  const existing = (lecture.resources as { type: string; title: string; url: string; key?: string }[] | null) ?? [];
  const updated = await prisma.lecture.update({
    where: { id: lectureId },
    data: {
      resources: [
        ...existing,
        { type: 'attachment', title: req.file.originalname, url, key },
      ],
    },
  });

  sendSuccess(res, updated, 'Attachment uploaded');
});

// ─── Delete Resource ──────────────────────────────────────────────────────────

export const deleteResource = catchAsync(async (req: Request, res: Response) => {
  const { sectionId, lectureId } = req.params;
  const { url } = req.body as { url: string };

  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);
  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  const existing = (lecture.resources as { type: string; title: string; url: string; key?: string }[] | null) ?? [];
  const toRemove = existing.find((r) => r.url === url);

  // Clean up S3 file if it was an attachment
  if (toRemove?.key) {
    await removeFromS3(toRemove.key).catch(() => {});
  }

  const updated = await prisma.lecture.update({
    where: { id: lectureId },
    data: { resources: existing.filter((r) => r.url !== url) },
  });

  sendSuccess(res, updated, 'Resource removed');
});

// ─── Add Question ─────────────────────────────────────────────────────────────

export const addQuestion = catchAsync(async (req: Request, res: Response) => {
  const { sectionId, lectureId } = req.params;
  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);

  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  const { question, options, correctIndex, showAtSecond, explanation } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2) {
    throw new AppError('question, options[] (min 2), and correctIndex are required', 400);
  }

  const newQuestion: LectureQuestion = {
    id: crypto.randomUUID(),
    question,
    options,
    correctIndex: Number(correctIndex),
    showAtSecond: Number(showAtSecond),
    explanation,
  };

  const existing = (lecture.questions as LectureQuestion[] | null) ?? [];
  const updated = await prisma.lecture.update({
    where: { id: lectureId },
    data: { questions: [...existing, newQuestion] },
  });

  sendSuccess(res, updated, 'Question added', 201);
});

// ─── Delete Question ──────────────────────────────────────────────────────────

export const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  const { sectionId, lectureId, questionId } = req.params;
  await assertSectionOwner(sectionId, req.user!.userId, req.user!.role);

  const lecture = await prisma.lecture.findFirst({ where: { id: lectureId, sectionId } });
  if (!lecture) throw new NotFoundError('Lecture');

  const existing = (lecture.questions as LectureQuestion[] | null) ?? [];
  const updated = await prisma.lecture.update({
    where: { id: lectureId },
    data: { questions: existing.filter((q) => q.id !== questionId) },
  });

  sendSuccess(res, updated, 'Question deleted');
});

// ─── Get / Poll Transcript ────────────────────────────────────────────────────

export const getTranscript = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { lectureId } = req.params;

  const lecture = await assertEnrolledOrOwner(lectureId, req.user.userId, req.user.role);

  // Already completed → return cached text
  if (lecture.transcriptStatus === 'COMPLETED' && lecture.transcript) {
    return sendSuccess(res, { status: 'COMPLETED', transcript: lecture.transcript });
  }

  // No video yet
  if (!lecture.videoKey) {
    return sendSuccess(res, { status: 'NO_VIDEO' });
  }

  // Not started → kick off job now
  if (!lecture.transcriptJobName) {
    const jobName = await startTranscriptionJob(lecture.videoKey, lectureId);
    await prisma.lecture.update({
      where: { id: lectureId },
      data: { transcriptJobName: jobName, transcriptStatus: 'IN_PROGRESS' },
    });
    return sendSuccess(res, { status: 'IN_PROGRESS' });
  }

  // Already running → check AWS for latest status
  const { status, transcriptText } = await checkTranscriptionJob(lecture.transcriptJobName, lectureId);

  if (status === 'COMPLETED' && transcriptText) {
    await prisma.lecture.update({
      where: { id: lectureId },
      data: { transcriptStatus: 'COMPLETED', transcript: transcriptText },
    });
    return sendSuccess(res, { status: 'COMPLETED', transcript: transcriptText });
  }

  if (status === 'FAILED') {
    await prisma.lecture.update({
      where: { id: lectureId },
      data: { transcriptStatus: 'FAILED' },
    });
    return sendSuccess(res, { status: 'FAILED' });
  }

  return sendSuccess(res, { status });
});

// ─── Private helper ───────────────────────────────────────────────────────────
async function updateCourseStats(sectionId: string): Promise<void> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { courseId: true },
  });
  if (!section) return;

  const lectures = await prisma.lecture.findMany({
    where: { section: { courseId: section.courseId } },
    select: { duration: true },
  });

  const totalDuration = lectures.reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const totalLectures = lectures.length;

  await prisma.course.update({
    where: { id: section.courseId },
    data: { totalDuration, totalLectures },
  });
}
