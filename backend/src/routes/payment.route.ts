import { Router } from 'express';
import { createOrder, verifyPayment, getPaymentHistory } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.post('/create-order', authorize('STUDENT', 'INSTRUCTOR'), createOrder);
router.post('/verify', authorize('STUDENT', 'INSTRUCTOR'), verifyPayment);
router.get('/history', getPaymentHistory);

export default router;
