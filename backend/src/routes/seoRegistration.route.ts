import { Router } from 'express';
import {
  seoRegister,
  seoVerifyPayment,
  getMyStudents,
  enrollStudent,
} from '../controllers/seoRegistration.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// Public routes
router.post('/register', seoRegister);
router.post('/verify-payment', seoVerifyPayment);

// Instructor-only routes
router.get('/students', authenticate, authorize('INSTRUCTOR', 'ADMIN'), getMyStudents);
router.post('/enroll', authenticate, authorize('INSTRUCTOR', 'ADMIN'), enrollStudent);

export default router;
