"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lectureRating_controller_1 = require("../controllers/lectureRating.controller");
const authenticate_1 = require("../middleware/authenticate");
const router = (0, express_1.Router)();
// Public
router.get('/lecture/:lectureId/summary', lectureRating_controller_1.getLectureRatingSummary);
// Authenticated
router.use(authenticate_1.authenticate);
router.post('/lecture/:lectureId', lectureRating_controller_1.rateLecture);
router.get('/lecture/:lectureId/my', lectureRating_controller_1.getMyLectureRating);
exports.default = router;
//# sourceMappingURL=lectureRating.route.js.map