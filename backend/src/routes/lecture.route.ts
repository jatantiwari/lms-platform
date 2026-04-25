import { Router } from 'express';
import {
  createLecture,
  updateLecture,
  deleteLecture,
  uploadVideo,
  getLecture,
  reorderLectures,
  uploadAttachment,
  deleteResource,
  addQuestion,
  deleteQuestion,
  getTranscript,
} from '../controllers/lecture.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { upload, uploadAttachment as uploadAttachmentMiddleware } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { createLectureSchema, updateLectureSchema, reorderLecturesSchema } from '../validations/lecture.validation';

// mergeParams allows access to :courseId and :sectionId from parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

// Student: view a single lecture (enrollment-gated in controller)
router.get('/:lectureId', getLecture);
// Transcript (student or owner)
router.get('/:lectureId/transcript', getTranscript);

// Instructor / Admin management
router.post(
  '/',
  authorize('INSTRUCTOR', 'ADMIN'),
  validate(createLectureSchema),
  createLecture,
);
router.put(
  '/reorder',
  authorize('INSTRUCTOR', 'ADMIN'),
  validate(reorderLecturesSchema),
  reorderLectures,
);
router.put(
  '/:lectureId',
  authorize('INSTRUCTOR', 'ADMIN'),
  validate(updateLectureSchema),
  updateLecture,
);
router.delete('/:lectureId', authorize('INSTRUCTOR', 'ADMIN'), deleteLecture);

// Video upload (large file — uses memoryStorage; consider streaming for production)
router.post(
  '/:lectureId/video',
  authorize('INSTRUCTOR', 'ADMIN'),
  upload.single('video'),
  uploadVideo,
);

// Attachment upload (PDFs, ZIPs, docs, etc.)
router.post(
  '/:lectureId/attachments',
  authorize('INSTRUCTOR', 'ADMIN'),
  uploadAttachmentMiddleware.single('file'),
  uploadAttachment,
);

// Remove a resource (attachment or link) by URL
router.delete(
  '/:lectureId/resources',
  authorize('INSTRUCTOR', 'ADMIN'),
  deleteResource,
);

// Timestamp quiz questions
router.post(
  '/:lectureId/questions',
  authorize('INSTRUCTOR', 'ADMIN'),
  addQuestion,
);
router.delete(
  '/:lectureId/questions/:questionId',
  authorize('INSTRUCTOR', 'ADMIN'),
  deleteQuestion,
);

export default router;
