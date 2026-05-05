"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Student routes
router.get('/my', enrollment_controller_1.getMyEnrollments);
router.get('/check/:courseId', enrollment_controller_1.checkEnrollment);
// Instructor routes
router.get('/course/:courseId/students', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), enrollment_controller_1.getCourseStudents);
exports.default = router;
//# sourceMappingURL=enrollment.route.js.map