"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seoRegistration_controller_1 = require("../controllers/seoRegistration.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', seoRegistration_controller_1.seoRegister);
router.post('/verify-payment', seoRegistration_controller_1.seoVerifyPayment);
// Instructor-only routes
router.get('/students', authenticate_1.authenticate, (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), seoRegistration_controller_1.getMyStudents);
router.post('/enroll', authenticate_1.authenticate, (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), seoRegistration_controller_1.enrollStudent);
exports.default = router;
//# sourceMappingURL=seoRegistration.route.js.map