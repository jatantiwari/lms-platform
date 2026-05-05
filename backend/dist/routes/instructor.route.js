"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const instructor_controller_1 = require("../controllers/instructor.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
const applySchema = zod_1.z.object({
    teachingExperience: zod_1.z.string().min(20, 'Please describe your teaching experience (min 20 chars)'),
    expertise: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]),
    bio: zod_1.z.string().min(50, 'Bio must be at least 50 characters'),
    linkedIn: zod_1.z.string().url('Invalid LinkedIn URL').optional().or(zod_1.z.literal('')),
    website: zod_1.z.string().url('Invalid URL').optional().or(zod_1.z.literal('')),
});
const reviewSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: zod_1.z.string().optional(),
});
const router = (0, express_1.Router)();
// Instructor-only
router.post('/apply', authenticate_1.authenticate, (0, authorize_1.authorize)('INSTRUCTOR'), (0, validate_1.validate)(applySchema), instructor_controller_1.applyAsInstructor);
router.get('/my-application', authenticate_1.authenticate, (0, authorize_1.authorize)('INSTRUCTOR'), instructor_controller_1.getMyApplication);
// Admin-only
router.get('/applications', authenticate_1.authenticate, (0, authorize_1.authorize)('ADMIN'), instructor_controller_1.listApplications);
router.patch('/applications/:id', authenticate_1.authenticate, (0, authorize_1.authorize)('ADMIN'), (0, validate_1.validate)(reviewSchema), instructor_controller_1.reviewApplication);
exports.default = router;
//# sourceMappingURL=instructor.route.js.map