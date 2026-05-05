"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLecturesSchema = exports.updateLectureSchema = exports.createLectureSchema = void 0;
const zod_1 = require("zod");
const resourceSchema = zod_1.z.object({
    type: zod_1.z.enum(['link', 'attachment']),
    title: zod_1.z.string().min(1).max(200),
    url: zod_1.z.string().url(),
    key: zod_1.z.string().optional(), // S3 key for attachments
});
exports.createLectureSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().max(2000).optional(),
    order: zod_1.z.number().int().min(0).optional(),
    isFree: zod_1.z.boolean().default(false),
});
exports.updateLectureSchema = exports.createLectureSchema.extend({
    resources: zod_1.z.array(resourceSchema).optional(),
}).partial();
exports.reorderLecturesSchema = zod_1.z.object({
    lectures: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), order: zod_1.z.number().int().min(0) })),
});
//# sourceMappingURL=lecture.validation.js.map