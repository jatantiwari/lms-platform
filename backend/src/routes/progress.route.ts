import { Router } from 'express';
import { updateProgress, getCourseProgress } from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.put('/lecture/:lectureId', updateProgress);
router.get('/course/:courseId', getCourseProgress);

export default router;
