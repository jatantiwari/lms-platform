import { Router } from 'express';
import { getMyEnrollments, checkEnrollment, getCourseStudents } from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// Student routes
router.get('/my', getMyEnrollments);
router.get('/check/:courseId', checkEnrollment);

// Instructor routes
router.get('/course/:courseId/students', authorize('INSTRUCTOR', 'ADMIN'), getCourseStudents);

export default router;
