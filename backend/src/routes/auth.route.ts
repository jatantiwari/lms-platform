import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
  resendVerification,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyPhoneOtpSchema,
} from '../validations/auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/verify-email', authenticate, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);

// Phone (SIM) verification
router.post('/send-phone-otp', authenticate, sendPhoneOtp);
router.post('/verify-phone-otp', authenticate, validate(verifyPhoneOtpSchema), verifyPhoneOtp);

export default router;
