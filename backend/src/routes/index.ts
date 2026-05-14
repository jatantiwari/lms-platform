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
import lectureRatingRouter from './lectureRating.route';
import seoRegistrationRouter from './seoRegistration.route';
import seoLeadRouter from './seoLead.route';
import deviceBindingRouter from './deviceBinding.route';
import deviceTrustRouter from './deviceTrust.route';
import { authenticate } from '../middleware/authenticate';
import { requireDeviceTrust } from '../middleware/requireDeviceTrust';
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
router.use('/lecture-ratings', lectureRatingRouter);
router.use('/seo-registration', seoRegistrationRouter);
router.use('/seo-leads', seoLeadRouter);
router.use('/auth/device-binding', deviceBindingRouter);
router.use('/auth/device-trust', deviceTrustRouter);

// Top-level lecture fetch used by the learn page (GET /lectures/:lectureId)
// requireDeviceTrust validates X-Device-ID header if present (mobile clients)
router.get('/lectures/:lectureId', authenticate, requireDeviceTrust, getLecture);

export default router;
