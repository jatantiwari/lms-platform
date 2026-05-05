"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth.route"));
const user_route_1 = __importDefault(require("./user.route"));
const course_route_1 = __importDefault(require("./course.route"));
const enrollment_route_1 = __importDefault(require("./enrollment.route"));
const progress_route_1 = __importDefault(require("./progress.route"));
const review_route_1 = __importDefault(require("./review.route"));
const payment_route_1 = __importDefault(require("./payment.route"));
const dashboard_route_1 = __importDefault(require("./dashboard.route"));
const hls_route_1 = __importDefault(require("./hls.route"));
const instructor_route_1 = __importDefault(require("./instructor.route"));
const lectureRating_route_1 = __importDefault(require("./lectureRating.route"));
const authenticate_1 = require("../middleware/authenticate");
const lecture_controller_1 = require("../controllers/lecture.controller");
const router = (0, express_1.Router)();
router.use('/auth', auth_route_1.default);
router.use('/users', user_route_1.default);
router.use('/courses', course_route_1.default);
router.use('/enrollments', enrollment_route_1.default);
router.use('/progress', progress_route_1.default);
router.use('/reviews', review_route_1.default);
router.use('/payments', payment_route_1.default);
router.use('/dashboard', dashboard_route_1.default);
router.use('/hls', hls_route_1.default);
router.use('/instructor', instructor_route_1.default);
router.use('/lecture-ratings', lectureRating_route_1.default);
// Top-level lecture fetch used by the learn page (GET /lectures/:lectureId)
router.get('/lectures/:lectureId', authenticate_1.authenticate, lecture_controller_1.getLecture);
exports.default = router;
//# sourceMappingURL=index.js.map