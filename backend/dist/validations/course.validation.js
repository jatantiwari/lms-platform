"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseQuerySchema = exports.reorderSectionsSchema = exports.updateSectionSchema = exports.createSectionSchema = exports.updateCourseSchema = exports.createCourseSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: zod_1.z.string().min(20, 'Description must be at least 20 characters'),
    shortDesc: zod_1.z.string().max(300).optional(),
    price: zod_1.z.number().min(0, 'Price cannot be negative'),
    discountPrice: zod_1.z.number().min(0).optional().nullable(),
    level: zod_1.z.nativeEnum(client_1.CourseLevel).default('BEGINNER'),
    language: zod_1.z.string().default('English'),
    categoryId: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(10).optional().default([]),
    requirements: zod_1.z.array(zod_1.z.string()).optional().default([]),
    objectives: zod_1.z.array(zod_1.z.string()).optional().default([]),
    mobileOnly: zod_1.z.boolean().optional().default(false),
});
exports.updateCourseSchema = exports.createCourseSchema.partial();
exports.createSectionSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    order: zod_1.z.number().int().min(0).optional(),
});
exports.updateSectionSchema = exports.createSectionSchema.partial();
exports.reorderSectionsSchema = zod_1.z.object({
    sections: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), order: zod_1.z.number().int().min(0) })),
});
exports.courseQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(12),
    search: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    level: zod_1.z.nativeEnum(client_1.CourseLevel).optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    sortBy: zod_1.z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
    language: zod_1.z.string().optional(),
});
//# sourceMappingURL=course.validation.js.map