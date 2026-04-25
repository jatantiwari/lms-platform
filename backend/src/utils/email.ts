import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: MailOptions): Promise<void> {
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, ...options });
    logger.info(`Email sent to ${options.to}`);
  } catch (err) {
    logger.error('Failed to send email', err);
    // Don't rethrow — email failures shouldn't crash the request
  }
}

export function welcomeEmailTemplate(name: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Welcome to LMS Platform, ${name}! 🎉</h2>
      <p>We're glad you're here. Start learning today by browsing our course catalog.</p>
      <a href="${env.FRONTEND_URL}/courses" 
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Browse Courses
      </a>
      <p style="margin-top:32px;color:#888;font-size:12px">
        You're receiving this because you signed up at LMS Platform.
      </p>
    </div>
  `;
}

export function passwordResetTemplate(name: string, resetUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, you requested to reset your password.</p>
      <p>Click the button below (valid for 1 hour):</p>
      <a href="${resetUrl}"
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Reset Password
      </a>
      <p style="margin-top:16px;color:#888;font-size:12px">
        If you didn't request this, ignore this email.
      </p>
    </div>
  `;
}

export function enrollmentConfirmTemplate(name: string, courseTitle: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Enrollment Confirmed! 🎓</h2>
      <p>Hi ${name}, you're now enrolled in <strong>${courseTitle}</strong>.</p>
      <a href="${env.FRONTEND_URL}/dashboard/student"
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Go to My Courses
      </a>
    </div>
  `;
}
