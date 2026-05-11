"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Validates all required environment variables at startup.
 * Throws a descriptive error if any required variable is missing or invalid.
 */
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000').transform(Number),
    FRONTEND_URL: zod_1.z.string().url(),
    // Database
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    // JWT
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    // AWS S3
    AWS_ACCESS_KEY_ID: zod_1.z.string().min(1),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().min(1),
    AWS_REGION: zod_1.z.string().default('ap-south-1'),
    AWS_S3_BUCKET_NAME: zod_1.z.string().min(1),
    AWS_S3_ENDPOINT: zod_1.z.string().optional(), // for Cloudflare R2
    // Razorpay (required for SEO registration payment flow)
    RAZORPAY_KEY_ID: zod_1.z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional().default(''),
    // SEO marketing site
    SEO_SITE_URL: zod_1.z.string().url().optional().default('http://localhost:3001'),
    // The instructor user ID that all SEO registrations are assigned to
    DEFAULT_INSTRUCTOR_ID: zod_1.z.string().min(1).optional().default(''),
    // 2Factor SMS OTP (https://2factor.in)
    TWOFACTOR_API_KEY: zod_1.z.string().optional().default(''),
    // Email (AWS SES)
    EMAIL_FROM: zod_1.z.string().default('LMS Platform <no-reply@lmsplatform.com>'),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(_env.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = _env.data;
//# sourceMappingURL=env.js.map