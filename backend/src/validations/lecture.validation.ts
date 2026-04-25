import { z } from 'zod';

const resourceSchema = z.object({
  type: z.enum(['link', 'attachment']),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  key: z.string().optional(), // S3 key for attachments
});

export const createLectureSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  isFree: z.boolean().default(false),
});

export const updateLectureSchema = createLectureSchema.extend({
  resources: z.array(resourceSchema).optional(),
}).partial();

export const reorderLecturesSchema = z.object({
  lectures: z.array(
    z.object({ id: z.string(), order: z.number().int().min(0) }),
  ),
});

export type CreateLectureInput = z.infer<typeof createLectureSchema>;
export type UpdateLectureInput = z.infer<typeof updateLectureSchema>;
export type LectureResource = z.infer<typeof resourceSchema>;
