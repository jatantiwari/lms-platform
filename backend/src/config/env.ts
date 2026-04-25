import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates all required environment variables at startup.
 * Throws a descriptive error if any required variable is missing or invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  FRONTEND_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET_NAME: z.string().min(1),
  AWS_S3_ENDPOINT: z.string().optional(), // for Cloudflare R2

  // Razorpay (optional — not used when dummy payment mode is active)
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),

  // Email (SMTP - supports Gmail, AWS SES, SendGrid, etc.)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().min(1), // SMTP username (email for Gmail, IAM username for AWS SES)
  SMTP_PASS: z.string().min(1), // SMTP password or API key
  EMAIL_FROM: z.string().default('LMS Platform <no-reply@lmsplatform.com>'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _env.data;
export type Env = typeof env;
