import { Router } from 'express';
import {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createReviewSchema, updateReviewSchema } from '../validations/review.validation';

const router = Router();

// Public
router.get('/course/:courseId', getCourseReviews);

// Authenticated
router.use(authenticate);
router.post('/course/:courseId', authorize('STUDENT'), validate(createReviewSchema), createReview);
router.put('/:reviewId', validate(updateReviewSchema), updateReview);
router.delete('/:reviewId', deleteReview);

// Admin moderation
router.patch('/:reviewId/toggle-visibility', authorize('ADMIN'), toggleReviewVisibility);

export default router;
