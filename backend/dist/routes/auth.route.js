"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const authenticate_1 = require("../middleware/authenticate");
const validate_1 = require("../middleware/validate");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validate)(auth_validation_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validate_1.validate)(auth_validation_1.loginSchema), auth_controller_1.login);
router.post('/refresh-token', (0, validate_1.validate)(auth_validation_1.refreshTokenSchema), auth_controller_1.refreshToken);
router.post('/forgot-password', (0, validate_1.validate)(auth_validation_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password', (0, validate_1.validate)(auth_validation_1.resetPasswordSchema), auth_controller_1.resetPassword);
// Protected
router.post('/logout', authenticate_1.authenticate, auth_controller_1.logout);
router.get('/me', authenticate_1.authenticate, auth_controller_1.getMe);
router.post('/verify-email', authenticate_1.authenticate, (0, validate_1.validate)(auth_validation_1.verifyEmailSchema), auth_controller_1.verifyEmail);
router.post('/resend-verification', authenticate_1.authenticate, auth_controller_1.resendVerification);
// Phone (SIM) verification
router.post('/send-phone-otp', authenticate_1.authenticate, auth_controller_1.sendPhoneOtp);
router.post('/verify-phone-otp', authenticate_1.authenticate, (0, validate_1.validate)(auth_validation_1.verifyPhoneOtpSchema), auth_controller_1.verifyPhoneOtp);
exports.default = router;
//# sourceMappingURL=auth.route.js.map