import { sendEmail } from './email';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailService() {
  console.log('🧪 Testing email service...\n');

  const testEmail = process.argv[2] || 'test@example.com';

  console.log(`Sending test email to: ${testEmail}`);
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`SMTP User: ${process.env.SMTP_USER}\n`);

  try {
    await sendEmail({
      to: testEmail,
      subject: '✅ LMS Email Service Test',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
          <h2 style="color:#6366f1">🎉 Email Service Working!</h2>
          <p>Your LMS Platform email service is configured correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Timestamp: ${new Date().toLocaleString()}</li>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>From: ${process.env.EMAIL_FROM}</li>
          </ul>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee">
          <p style="color:#888;font-size:12px">
            This is an automated test email from your LMS Platform.
          </p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('Check your inbox to confirm delivery.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    process.exit(1);
  }
}

testEmailService();
