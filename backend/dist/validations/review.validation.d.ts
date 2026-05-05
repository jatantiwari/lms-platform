import { z } from 'zod';
export declare const createReviewSchema: z.ZodObject<{
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    comment?: string | undefined;
}, {
    rating: number;
    comment?: string | undefined;
}>;
export declare const updateReviewSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    rating?: number | undefined;
    comment?: string | undefined;
}, {
    rating?: number | undefined;
    comment?: string | undefined;
}>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
//# sourceMappingURL=review.validation.d.ts.map