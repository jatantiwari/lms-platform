import { z } from 'zod';
declare const resourceSchema: z.ZodObject<{
    type: z.ZodEnum<["link", "attachment"]>;
    title: z.ZodString;
    url: z.ZodString;
    key: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "link" | "attachment";
    url: string;
    title: string;
    key?: string | undefined;
}, {
    type: "link" | "attachment";
    url: string;
    title: string;
    key?: string | undefined;
}>;
export declare const createLectureSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    isFree: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    isFree: boolean;
    description?: string | undefined;
    order?: number | undefined;
}, {
    title: string;
    description?: string | undefined;
    order?: number | undefined;
    isFree?: boolean | undefined;
}>;
export declare const updateLectureSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    isFree: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    resources: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["link", "attachment"]>;
        title: z.ZodString;
        url: z.ZodString;
        key: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "link" | "attachment";
        url: string;
        title: string;
        key?: string | undefined;
    }, {
        type: "link" | "attachment";
        url: string;
        title: string;
        key?: string | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    isFree?: boolean | undefined;
    resources?: {
        type: "link" | "attachment";
        url: string;
        title: string;
        key?: string | undefined;
    }[] | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    isFree?: boolean | undefined;
    resources?: {
        type: "link" | "attachment";
        url: string;
        title: string;
        key?: string | undefined;
    }[] | undefined;
}>;
export declare const reorderLecturesSchema: z.ZodObject<{
    lectures: z.ZodArray<z.ZodObject<{
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
    lectures: {
        id: string;
        order: number;
    }[];
}, {
    lectures: {
        id: string;
        order: number;
    }[];
}>;
export type CreateLectureInput = z.infer<typeof createLectureSchema>;
export type UpdateLectureInput = z.infer<typeof updateLectureSchema>;
export type LectureResource = z.infer<typeof resourceSchema>;
export {};
//# sourceMappingURL=lecture.validation.d.ts.map