import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '../config/env';
import logger from '../config/logger';

const ses = new SESClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: MailOptions): Promise<void> {
  try {
    await ses.send(
      new SendEmailCommand({
        Source: env.EMAIL_FROM,
        Destination: { ToAddresses: [options.to] },
        Message: {
          Subject: { Data: options.subject, Charset: 'UTF-8' },
          Body: { Html: { Data: options.html, Charset: 'UTF-8' } },
        },
      }),
    );
    logger.info(`Email sent via SES to ${options.to}`);
  } catch (err) {
    logger.error('Failed to send email via SES', err);
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

export function verificationEmailTemplate(name: string, code: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#4f46e5;margin:0;font-size:24px">ADI Boost</h1>
      </div>
      <h2 style="color:#111827;margin-bottom:8px">Verify your email address</h2>
      <p style="color:#6b7280;margin-bottom:24px">Hi ${name}, use the code below to verify your email. It expires in 15 minutes.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#4f46e5">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:13px">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;
}

export function instructorApprovedEmailTemplate(name: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#4f46e5;margin:0;font-size:24px">ADI Boost</h1>
      </div>
      <h2 style="color:#111827;margin-bottom:8px">🎉 You're approved as an Instructor!</h2>
      <p style="color:#6b7280;margin-bottom:24px">Hi ${name}, great news! Your instructor application has been reviewed and <strong style="color:#16a34a">approved</strong> by our team.</p>
      <p style="color:#6b7280;margin-bottom:24px">You can now create and publish courses on ADI Boost.</p>
      <a href="${env.FRONTEND_URL}/dashboard/instructor/courses/new"
         style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">
        Create Your First Course
      </a>
      <p style="margin-top:32px;color:#9ca3af;font-size:13px">Welcome to the ADI Boost instructor community!</p>
    </div>
  `;
}

export function instructorRejectedEmailTemplate(name: string, reason: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#4f46e5;margin:0;font-size:24px">ADI Boost</h1>
      </div>
      <h2 style="color:#111827;margin-bottom:8px">Instructor Application Update</h2>
      <p style="color:#6b7280;margin-bottom:16px">Hi ${name}, thank you for your interest in becoming an instructor on ADI Boost.</p>
      <p style="color:#6b7280;margin-bottom:16px">After reviewing your application, we were unable to approve it at this time.</p>
      ${
        reason
          ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin-bottom:16px">
               <p style="margin:0;color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p>
             </div>`
          : ''
      }
      <p style="color:#6b7280;margin-bottom:24px">You may reapply after addressing the feedback above.</p>
      <a href="${env.FRONTEND_URL}/onboarding/instructor"
         style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">
        Reapply
      </a>
      <p style="margin-top:32px;color:#9ca3af;font-size:13px">Thank you for your understanding.</p>
    </div>
  `;
}
