"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Instructor dashboard
router.get('/instructor', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), dashboard_controller_1.getInstructorStats);
// Admin dashboard
router.get('/admin', (0, authorize_1.authorize)('ADMIN'), dashboard_controller_1.getAdminStats);
router.patch('/admin/courses/:id', (0, authorize_1.authorize)('ADMIN'), dashboard_controller_1.adminUpdateCourse);
exports.default = router;
//# sourceMappingURL=dashboard.route.js.map