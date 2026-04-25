import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseBySlug,
  getCourseById,
  updateCourse,
  uploadThumbnail,
  publishCourse,
  deleteCourse,
  getMyCourses,
  getAllCourses,
} from '../controllers/course.controller';
import { createSection, updateSection, deleteSection, reorderSections } from '../controllers/section.controller';
import { authenticate } from '../middleware/authenticate';
import { optionalAuthenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { uploadImage } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  createCourseSchema,
  updateCourseSchema,
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} from '../validations/course.validation';
import lectureRouter from './lecture.route';

const router = Router();

// Mount lecture routes under /:courseId/sections/:sectionId/lectures
router.use('/:courseId/sections/:sectionId/lectures', lectureRouter);

// ── Public browsing ────────────────────────────────────────────────────────────
router.get('/', optionalAuthenticate, getCourses);

// ── Static/specific paths MUST come before /:slug wildcard ────────────────────
// (Express matches routes in registration order; /my would otherwise match /:slug)
router.get('/my', authenticate, authorize('INSTRUCTOR', 'ADMIN'), getMyCourses);
router.get('/instructor/my-courses', authenticate, authorize('INSTRUCTOR', 'ADMIN'), getMyCourses);
router.get('/id/:id', authenticate, authorize('INSTRUCTOR', 'ADMIN'), getCourseById);
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllCourses);

// ── Wildcard slug (must be last among GET routes) ─────────────────────────────
router.get('/:slug', optionalAuthenticate, getCourseBySlug);

// ── Authenticated write routes ────────────────────────────────────────────────
router.use(authenticate);
router.post('/', authorize('INSTRUCTOR', 'ADMIN'), validate(createCourseSchema), createCourse);
router.put('/:id', authorize('INSTRUCTOR', 'ADMIN'), validate(updateCourseSchema), updateCourse);
router.post('/:id/thumbnail', authorize('INSTRUCTOR', 'ADMIN'), uploadImage.single('thumbnail'), uploadThumbnail);
router.patch('/:id/publish', authorize('INSTRUCTOR', 'ADMIN'), publishCourse);
router.delete('/:id', authorize('INSTRUCTOR', 'ADMIN'), deleteCourse);

// Section management
router.post('/:courseId/sections', authorize('INSTRUCTOR', 'ADMIN'), validate(createSectionSchema), createSection);
router.put('/:courseId/sections/:sectionId', authorize('INSTRUCTOR', 'ADMIN'), validate(updateSectionSchema), updateSection);
router.delete('/:courseId/sections/:sectionId', authorize('INSTRUCTOR', 'ADMIN'), deleteSection);
router.put('/:courseId/sections/reorder', authorize('INSTRUCTOR', 'ADMIN'), validate(reorderSectionsSchema), reorderSections);

export default router;
