import { Router } from 'express';
import { submitSeoLead, subscribeSeoNewsletter } from '../controllers/seoLead.controller';

const router = Router();

router.post('/contact', submitSeoLead);
router.post('/subscribe', subscribeSeoNewsletter);

export default router;
