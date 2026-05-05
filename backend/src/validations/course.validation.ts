import { z } from 'zod';
import { CourseLevel } from '@prisma/client';

export const createCourseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  shortDesc: z.string().max(300).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  discountPrice: z.number().min(0).optional().nullable(),
  level: z.nativeEnum(CourseLevel).default('BEGINNER'),
  language: z.string().default('English'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  objectives: z.array(z.string()).optional().default([]),
  mobileOnly: z.boolean().optional().default(false),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createSectionSchema = z.object({
  title: z.string().min(2).max(200),
  order: z.number().int().min(0).optional(),
});

export const updateSectionSchema = createSectionSchema.partial();

export const reorderSectionsSchema = z.object({
  sections: z.array(
    z.object({ id: z.string(), order: z.number().int().min(0) }),
  ),
});

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.nativeEnum(CourseLevel).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
  language: z.string().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
