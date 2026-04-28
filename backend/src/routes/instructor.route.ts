import { Router } from 'express';
import {
  applyAsInstructor,
  getMyApplication,
  listApplications,
  reviewApplication,
} from '../controllers/instructor.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const applySchema = z.object({
  teachingExperience: z.string().min(20, 'Please describe your teaching experience (min 20 chars)'),
  expertise: z.union([z.string(), z.array(z.string())]),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  linkedIn: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

const router = Router();

// Instructor-only
router.post('/apply', authenticate, authorize('INSTRUCTOR'), validate(applySchema), applyAsInstructor);
router.get('/my-application', authenticate, authorize('INSTRUCTOR'), getMyApplication);

// Admin-only
router.get('/applications', authenticate, authorize('ADMIN'), listApplications);
router.patch('/applications/:id', authenticate, authorize('ADMIN'), validate(reviewSchema), reviewApplication);

export default router;
