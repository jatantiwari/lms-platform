import { Router } from 'express';
import {
  getInstructorStats,
  getAdminStats,
  adminUpdateCourse,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// Instructor dashboard
router.get('/instructor', authorize('INSTRUCTOR', 'ADMIN'), getInstructorStats);

// Admin dashboard
router.get('/admin', authorize('ADMIN'), getAdminStats);
router.patch('/admin/courses/:id', authorize('ADMIN'), adminUpdateCourse);

export default router;
