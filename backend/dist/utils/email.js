"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.welcomeEmailTemplate = welcomeEmailTemplate;
exports.passwordResetTemplate = passwordResetTemplate;
exports.enrollmentConfirmTemplate = enrollmentConfirmTemplate;
exports.verificationEmailTemplate = verificationEmailTemplate;
exports.instructorApprovedEmailTemplate = instructorApprovedEmailTemplate;
exports.instructorRejectedEmailTemplate = instructorRejectedEmailTemplate;
exports.seoStudentCredentialsTemplate = seoStudentCredentialsTemplate;
exports.seoInstructorNotificationTemplate = seoInstructorNotificationTemplate;
exports.seoPaymentConfirmedTemplate = seoPaymentConfirmedTemplate;
exports.seoEnrollmentConfirmTemplate = seoEnrollmentConfirmTemplate;
const client_ses_1 = require("@aws-sdk/client-ses");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
const ses = new client_ses_1.SESClient({
    region: env_1.env.AWS_REGION,
    credentials: {
        accessKeyId: env_1.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY,
    },
});
async function sendEmail(options) {
    try {
        await ses.send(new client_ses_1.SendEmailCommand({
            Source: env_1.env.EMAIL_FROM,
            Destination: { ToAddresses: [options.to] },
            Message: {
                Subject: { Data: options.subject, Charset: 'UTF-8' },
                Body: { Html: { Data: options.html, Charset: 'UTF-8' } },
            },
        }));
        logger_1.default.info(`Email sent via SES to ${options.to}`);
    }
    catch (err) {
        logger_1.default.error('Failed to send email via SES', err);
        // Don't rethrow — email failures shouldn't crash the request
    }
}
function welcomeEmailTemplate(name) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Welcome to LMS Platform, ${name}! 🎉</h2>
      <p>We're glad you're here. Start learning today by browsing our course catalog.</p>
      <a href="${env_1.env.FRONTEND_URL}/courses" 
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Browse Courses
      </a>
      <p style="margin-top:32px;color:#888;font-size:12px">
        You're receiving this because you signed up at LMS Platform.
      </p>
    </div>
  `;
}
function passwordResetTemplate(name, resetUrl) {
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
function enrollmentConfirmTemplate(name, courseTitle) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Enrollment Confirmed! 🎓</h2>
      <p>Hi ${name}, you're now enrolled in <strong>${courseTitle}</strong>.</p>
      <a href="${env_1.env.FRONTEND_URL}/dashboard/student"
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Go to My Courses
      </a>
    </div>
  `;
}
function verificationEmailTemplate(name, code) {
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
function instructorApprovedEmailTemplate(name) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#4f46e5;margin:0;font-size:24px">ADI Boost</h1>
      </div>
      <h2 style="color:#111827;margin-bottom:8px">🎉 You're approved as an Instructor!</h2>
      <p style="color:#6b7280;margin-bottom:24px">Hi ${name}, great news! Your instructor application has been reviewed and <strong style="color:#16a34a">approved</strong> by our team.</p>
      <p style="color:#6b7280;margin-bottom:24px">You can now create and publish courses on ADI Boost.</p>
      <a href="${env_1.env.FRONTEND_URL}/dashboard/instructor/courses/new"
         style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">
        Create Your First Course
      </a>
      <p style="margin-top:32px;color:#9ca3af;font-size:13px">Welcome to the ADI Boost instructor community!</p>
    </div>
  `;
}
function instructorRejectedEmailTemplate(name, reason) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#4f46e5;margin:0;font-size:24px">ADI Boost</h1>
      </div>
      <h2 style="color:#111827;margin-bottom:8px">Instructor Application Update</h2>
      <p style="color:#6b7280;margin-bottom:16px">Hi ${name}, thank you for your interest in becoming an instructor on ADI Boost.</p>
      <p style="color:#6b7280;margin-bottom:16px">After reviewing your application, we were unable to approve it at this time.</p>
      ${reason
        ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin-bottom:16px">
               <p style="margin:0;color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p>
             </div>`
        : ''}
      <p style="color:#6b7280;margin-bottom:24px">You may reapply after addressing the feedback above.</p>
      <a href="${env_1.env.FRONTEND_URL}/onboarding/instructor"
         style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">
        Reapply
      </a>
      <p style="margin-top:32px;color:#9ca3af;font-size:13px">Thank you for your understanding.</p>
    </div>
  `;
}
// ─── SEO Registration Emails ───────────────────────────────────────────────────
const BRAND_GOLD = '#D4A017';
const BRAND_BG = '#0E0D0B';
const BRAND_CARD = '#1A1914';
/**
 * Sent to the student immediately after registration — contains login credentials.
 */
function seoStudentCredentialsTemplate(name, email, password, plan, loginUrl) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:${BRAND_BG};border:1px solid #2a2a20;border-radius:12px;overflow:hidden">
      <div style="background:${BRAND_CARD};padding:28px 32px;border-bottom:2px solid ${BRAND_GOLD}">
        <h1 style="color:${BRAND_GOLD};margin:0;font-size:22px;letter-spacing:0.05em">Financial Freedom Mentor</h1>
        <p style="color:#888;margin:4px 0 0;font-size:13px">Commodity Trading Mentorship</p>
      </div>
      <div style="padding:32px">
        <h2 style="color:#f0ebe0;margin-bottom:8px">Welcome, ${name}! 🎉</h2>
        <p style="color:#a0998a;margin-bottom:24px">
          Your registration for the <strong style="color:${BRAND_GOLD}">${plan}</strong> plan was successful.
          Below are your login credentials for the learning platform.
        </p>
        <div style="background:${BRAND_CARD};border:1px solid #2a2a20;border-radius:8px;padding:24px;margin-bottom:24px">
          <p style="margin:0 0 8px;color:#a0998a;font-size:13px">YOUR LOGIN CREDENTIALS</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#a0998a;font-size:14px;padding:6px 0;width:90px">Email</td>
              <td style="color:#f0ebe0;font-size:14px;font-weight:600;padding:6px 0">${email}</td>
            </tr>
            <tr>
              <td style="color:#a0998a;font-size:14px;padding:6px 0">Password</td>
              <td style="color:${BRAND_GOLD};font-size:16px;font-weight:700;padding:6px 0;letter-spacing:0.1em">${password}</td>
            </tr>
          </table>
        </div>
        <p style="color:#a0998a;font-size:13px;margin-bottom:24px">
          Please change your password after your first login for security.
        </p>
        <a href="${loginUrl}"
           style="background:${BRAND_GOLD};color:#0E0D0B;padding:13px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">
          Login to Your Account &#8594;
        </a>
        <p style="margin-top:28px;color:#666;font-size:12px">
          Your mentor will contact you shortly to guide your next steps. For support, reply to this email.
        </p>
      </div>
    </div>
  `;
}
/**
 * Sent to the instructor when a new student registers.
 */
function seoInstructorNotificationTemplate(instructorName, student, dashboardUrl) {
    const rows = [
        ['Name', student.name],
        ['Email', student.email],
        ['Mobile', student.mobile],
        ['Plan', student.plan],
        ['Occupation', student.occupation],
        ['Prior Experience', student.experience],
    ]
        .map(([label, value]) => `<tr>
          <td style="color:#a0998a;font-size:13px;padding:7px 0;width:130px;vertical-align:top">${label}</td>
          <td style="color:#f0ebe0;font-size:14px;font-weight:600;padding:7px 0">${value}</td>
        </tr>`)
        .join('');
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:${BRAND_BG};border:1px solid #2a2a20;border-radius:12px;overflow:hidden">
      <div style="background:${BRAND_CARD};padding:28px 32px;border-bottom:2px solid ${BRAND_GOLD}">
        <h1 style="color:${BRAND_GOLD};margin:0;font-size:22px">Financial Freedom Mentor</h1>
        <p style="color:#888;margin:4px 0 0;font-size:13px">New Student Registration</p>
      </div>
      <div style="padding:32px">
        <h2 style="color:#f0ebe0;margin-bottom:8px">Hi ${instructorName}, a new student has registered!</h2>
        <p style="color:#a0998a;margin-bottom:24px">Here are the registration details:</p>
        <div style="background:${BRAND_CARD};border:1px solid #2a2a20;border-radius:8px;padding:24px;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse">
            ${rows}
            <tr>
              <td style="color:#a0998a;font-size:13px;padding:7px 0;vertical-align:top">Why They Joined</td>
              <td style="color:#f0ebe0;font-size:13px;padding:7px 0">${student.whyJoin}</td>
            </tr>
          </table>
        </div>
        <a href="${dashboardUrl}"
           style="background:${BRAND_GOLD};color:#0E0D0B;padding:13px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">
          View in Dashboard &#8594;
        </a>
      </div>
    </div>
  `;
}
/**
 * Sent to the student after successful payment confirmation.
 */
function seoPaymentConfirmedTemplate(name, plan, amount, paymentId) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:${BRAND_BG};border:1px solid #2a2a20;border-radius:12px;overflow:hidden">
      <div style="background:${BRAND_CARD};padding:28px 32px;border-bottom:2px solid ${BRAND_GOLD}">
        <h1 style="color:${BRAND_GOLD};margin:0;font-size:22px">Financial Freedom Mentor</h1>
        <p style="color:#888;margin:4px 0 0;font-size:13px">Payment Confirmation</p>
      </div>
      <div style="padding:32px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:48px;margin-bottom:8px">&#9989;</div>
          <h2 style="color:#f0ebe0;margin:0">Payment Successful!</h2>
        </div>
        <div style="background:${BRAND_CARD};border:1px solid #2a2a20;border-radius:8px;padding:24px;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#a0998a;font-size:13px;padding:6px 0">Plan</td>
              <td style="color:${BRAND_GOLD};font-size:14px;font-weight:700;padding:6px 0;text-align:right">${plan}</td>
            </tr>
            <tr>
              <td style="color:#a0998a;font-size:13px;padding:6px 0">Amount Paid</td>
              <td style="color:#f0ebe0;font-size:14px;font-weight:700;padding:6px 0;text-align:right">&#8377;${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color:#a0998a;font-size:13px;padding:6px 0">Payment ID</td>
              <td style="color:#a0998a;font-size:12px;padding:6px 0;text-align:right">${paymentId}</td>
            </tr>
          </table>
        </div>
        <p style="color:#a0998a;font-size:14px;margin-bottom:4px">
          Hi ${name}, your payment has been confirmed and your mentor will reach out within 24 hours to schedule your first session.
        </p>
        <p style="margin-top:28px;color:#666;font-size:12px">Please save this email as your payment receipt.</p>
      </div>
    </div>
  `;
}
/**
 * Sent to the student when the instructor manually enrolls them into a course.
 */
function seoEnrollmentConfirmTemplate(name, courseTitle, loginUrl) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:${BRAND_BG};border:1px solid #2a2a20;border-radius:12px;overflow:hidden">
      <div style="background:${BRAND_CARD};padding:28px 32px;border-bottom:2px solid ${BRAND_GOLD}">
        <h1 style="color:${BRAND_GOLD};margin:0;font-size:22px">Financial Freedom Mentor</h1>
        <p style="color:#888;margin:4px 0 0;font-size:13px">Enrollment Confirmation</p>
      </div>
      <div style="padding:32px">
        <h2 style="color:#f0ebe0;margin-bottom:8px">You're enrolled, ${name}! &#127891;</h2>
        <p style="color:#a0998a;margin-bottom:8px">Your instructor has enrolled you in:</p>
        <p style="color:${BRAND_GOLD};font-size:18px;font-weight:700;margin-bottom:24px">${courseTitle}</p>
        <a href="${loginUrl}"
           style="background:${BRAND_GOLD};color:#0E0D0B;padding:13px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">
          Start Learning Now &#8594;
        </a>
      </div>
    </div>
  `;
}
//# sourceMappingURL=email.js.map