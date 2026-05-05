import { Router } from 'express';
import { rateLecture, getMyLectureRating, getLectureRatingSummary } from '../controllers/lectureRating.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Public
router.get('/lecture/:lectureId/summary', getLectureRatingSummary);

// Authenticated
router.use(authenticate);
router.post('/lecture/:lectureId', rateLecture);
router.get('/lecture/:lectureId/my', getMyLectureRating);

export default router;
