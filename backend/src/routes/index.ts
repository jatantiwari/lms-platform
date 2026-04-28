import { Router } from 'express';
import authRouter from './auth.route';
import userRouter from './user.route';
import courseRouter from './course.route';
import enrollmentRouter from './enrollment.route';
import progressRouter from './progress.route';
import reviewRouter from './review.route';
import paymentRouter from './payment.route';
import dashboardRouter from './dashboard.route';
import hlsRouter from './hls.route';
import instructorRouter from './instructor.route';
import { authenticate } from '../middleware/authenticate';
import { getLecture } from '../controllers/lecture.controller';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/courses', courseRouter);
router.use('/enrollments', enrollmentRouter);
router.use('/progress', progressRouter);
router.use('/reviews', reviewRouter);
router.use('/payments', paymentRouter);
router.use('/dashboard', dashboardRouter);
router.use('/hls', hlsRouter);
router.use('/instructor', instructorRouter);

// Top-level lecture fetch used by the learn page (GET /lectures/:lectureId)
router.get('/lectures/:lectureId', authenticate, getLecture);

export default router;
