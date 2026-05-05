"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: zod_1.z.string().max(2000).optional(),
});
exports.updateReviewSchema = exports.createReviewSchema.partial();
//# sourceMappingURL=review.validation.js.map