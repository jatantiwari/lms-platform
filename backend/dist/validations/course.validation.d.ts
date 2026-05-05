import { z } from 'zod';
export declare const createCourseSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    shortDesc: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    discountPrice: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    level: z.ZodDefault<z.ZodNativeEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
        ALL_LEVELS: "ALL_LEVELS";
    }>>;
    language: z.ZodDefault<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    requirements: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    objectives: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    mobileOnly: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
    tags: string[];
    title: string;
    description: string;
    price: number;
    language: string;
    requirements: string[];
    objectives: string[];
    mobileOnly: boolean;
    shortDesc?: string | undefined;
    discountPrice?: number | null | undefined;
    categoryId?: string | undefined;
}, {
    title: string;
    description: string;
    price: number;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined;
    tags?: string[] | undefined;
    shortDesc?: string | undefined;
    discountPrice?: number | null | undefined;
    language?: string | undefined;
    requirements?: string[] | undefined;
    objectives?: string[] | undefined;
    mobileOnly?: boolean | undefined;
    categoryId?: string | undefined;
}>;
export declare const updateCourseSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    shortDesc: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    discountPrice: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    level: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
        ALL_LEVELS: "ALL_LEVELS";
    }>>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    requirements: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    objectives: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    mobileOnly: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined;
    tags?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    shortDesc?: string | undefined;
    price?: number | undefined;
    discountPrice?: number | null | undefined;
    language?: string | undefined;
    requirements?: string[] | undefined;
    objectives?: string[] | undefined;
    mobileOnly?: boolean | undefined;
    categoryId?: string | undefined;
}, {
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined;
    tags?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    shortDesc?: string | undefined;
    price?: number | undefined;
    discountPrice?: number | null | undefined;
    language?: string | undefined;
    requirements?: string[] | undefined;
    objectives?: string[] | undefined;
    mobileOnly?: boolean | undefined;
    categoryId?: string | undefined;
}>;
export declare const createSectionSchema: z.ZodObject<{
    title: z.ZodString;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    order?: number | undefined;
}, {
    title: string;
    order?: number | undefined;
}>;
export declare const updateSectionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    order?: number | undefined;
}, {
    title?: string | undefined;
    order?: number | undefined;
}>;
export declare const reorderSectionsSchema: z.ZodObject<{
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        order: number;
    }, {
        id: string;
        order: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sections: {
        id: string;
        order: number;
    }[];
}, {
    sections: {
        id: string;
        order: number;
    }[];
}>;
export declare const courseQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodNativeEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
        ALL_LEVELS: "ALL_LEVELS";
    }>>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["newest", "oldest", "price_asc", "price_desc", "popular", "rating"]>>;
    language: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "newest" | "oldest" | "price_asc" | "price_desc" | "popular" | "rating";
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined;
    search?: string | undefined;
    category?: string | undefined;
    language?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}, {
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined;
    search?: string | undefined;
    category?: string | undefined;
    language?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "popular" | "rating" | undefined;
}>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
//# sourceMappingURL=course.validation.d.ts.map