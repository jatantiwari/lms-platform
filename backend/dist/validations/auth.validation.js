"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    role: zod_1.z.enum(['STUDENT', 'INSTRUCTOR']).optional().default('STUDENT'),
    phone: zod_1.z.string().regex(/^[+]?[0-9]{7,15}$/, 'Invalid phone number').optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'STUDENT' && !data.phone) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Phone number is required for students',
            path: ['phone'],
        });
    }
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z
        .string()
        .min(8)
        .regex(/[A-Z]/)
        .regex(/[0-9]/),
});
exports.verifyEmailSchema = zod_1.z.object({
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    headline: zod_1.z.string().max(150).optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().regex(/^[+]?[0-9]{7,15}$/, 'Invalid phone number').optional().or(zod_1.z.literal('')),
});
//# sourceMappingURL=auth.validation.js.map