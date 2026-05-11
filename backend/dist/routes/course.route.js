"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const course_controller_1 = require("../controllers/course.controller");
const section_controller_1 = require("../controllers/section.controller");
const authenticate_1 = require("../middleware/authenticate");
const authenticate_2 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const upload_1 = require("../middleware/upload");
const validate_1 = require("../middleware/validate");
const course_validation_1 = require("../validations/course.validation");
const lecture_route_1 = __importDefault(require("./lecture.route"));
const router = (0, express_1.Router)();
// Mount lecture routes under /:courseId/sections/:sectionId/lectures
router.use('/:courseId/sections/:sectionId/lectures', lecture_route_1.default);
// ── Public browsing ────────────────────────────────────────────────────────────
router.get('/', authenticate_2.optionalAuthenticate, course_controller_1.getCourses);
// ── Static/specific paths MUST come before /:slug wildcard ────────────────────
// (Express matches routes in registration order; /my would otherwise match /:slug)
router.get('/my', authenticate_1.authenticate, (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), course_controller_1.getMyCourses);
router.get('/instructor/my-courses', authenticate_1.authenticate, (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), course_controller_1.getMyCourses);
router.get('/id/:id', authenticate_1.authenticate, course_controller_1.getCourseById);
router.get('/admin/all', authenticate_1.authenticate, (0, authorize_1.authorize)('ADMIN'), course_controller_1.getAllCourses);
// ── Wildcard slug (must be last among GET routes) ─────────────────────────────
router.get('/:slug', authenticate_2.optionalAuthenticate, course_controller_1.getCourseBySlug);
// ── Authenticated write routes ────────────────────────────────────────────────
router.use(authenticate_1.authenticate);
router.post('/', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(course_validation_1.createCourseSchema), course_controller_1.createCourse);
router.put('/:id', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(course_validation_1.updateCourseSchema), course_controller_1.updateCourse);
router.post('/:id/thumbnail', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), upload_1.uploadImage.single('thumbnail'), course_controller_1.uploadThumbnail);
router.patch('/:id/publish', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), course_controller_1.publishCourse);
router.delete('/:id', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), course_controller_1.deleteCourse);
// Section management
router.post('/:courseId/sections', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(course_validation_1.createSectionSchema), section_controller_1.createSection);
router.put('/:courseId/sections/:sectionId', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(course_validation_1.updateSectionSchema), section_controller_1.updateSection);
router.delete('/:courseId/sections/:sectionId', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), section_controller_1.deleteSection);
router.put('/:courseId/sections/reorder', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(course_validation_1.reorderSectionsSchema), section_controller_1.reorderSections);
exports.default = router;
//# sourceMappingURL=course.route.js.map