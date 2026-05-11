import { Router } from 'express';
import { updateProgress, getCourseProgress } from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';
import { requireDeviceTrust } from '../middleware/requireDeviceTrust';

const router = Router();

router.use(authenticate, requireDeviceTrust);
router.put('/lecture/:lectureId', updateProgress);
router.get('/course/:courseId', getCourseProgress);

export default router;
