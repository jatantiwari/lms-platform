"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const validate_1 = require("../middleware/validate");
const review_validation_1 = require("../validations/review.validation");
const router = (0, express_1.Router)();
// Public
router.get('/course/:courseId', review_controller_1.getCourseReviews);
// Authenticated
router.use(authenticate_1.authenticate);
router.post('/course/:courseId', (0, authorize_1.authorize)('STUDENT'), (0, validate_1.validate)(review_validation_1.createReviewSchema), review_controller_1.createReview);
router.put('/:reviewId', (0, validate_1.validate)(review_validation_1.updateReviewSchema), review_controller_1.updateReview);
router.delete('/:reviewId', review_controller_1.deleteReview);
// Admin moderation
router.patch('/:reviewId/toggle-visibility', (0, authorize_1.authorize)('ADMIN'), review_controller_1.toggleReviewVisibility);
exports.default = router;
//# sourceMappingURL=review.route.js.map