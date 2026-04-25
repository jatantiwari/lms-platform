#!/usr/bin/env ts-node

/**
 * AWS SES Verification Script
 * 
 * This script helps verify your AWS SES setup by:
 * 1. Testing SMTP connection
 * 2. Checking credentials
 * 3. Sending a test email
 * 4. Providing diagnostics
 * 
 * Usage:
 *   npm run test:ses your-email@example.com
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { env } from '../config/env';

dotenv.config();

interface SESVerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

async function verifySESConfiguration(): Promise<SESVerificationResult> {
  const result: SESVerificationResult = {
    success: true,
    errors: [],
    warnings: [],
    info: [],
  };

  console.log('\n🔍 AWS SES Configuration Verification\n');
  console.log('━'.repeat(60));

  // Check environment variables
  console.log('\n📋 Checking Configuration...\n');

  result.info.push(`SMTP Host: ${env.SMTP_HOST}`);
  result.info.push(`SMTP Port: ${env.SMTP_PORT}`);
  result.info.push(`SMTP User: ${env.SMTP_USER.substring(0, 8)}...`);
  result.info.push(`Email From: ${env.EMAIL_FROM}`);

  // Validate SES endpoint
  if (!env.SMTP_HOST.includes('email-smtp')) {
    result.warnings.push(
      'SMTP host does not appear to be an AWS SES endpoint. ' +
      'Expected format: email-smtp.<region>.amazonaws.com'
    );
  }

  // Validate port
  if (env.SMTP_PORT !== 587 && env.SMTP_PORT !== 465 && env.SMTP_PORT !== 25) {
    result.warnings.push(
      `Unusual SMTP port: ${env.SMTP_PORT}. AWS SES typically uses 587 (STARTTLS) or 465 (TLS).`
    );
  }

  // Validate credentials format
  if (env.SMTP_USER.length < 16) {
    result.warnings.push(
      'SMTP username appears too short. AWS SES SMTP usernames are typically 20 characters.'
    );
  }

  if (env.SMTP_PASS.length < 40) {
    result.warnings.push(
      'SMTP password appears too short. AWS SES SMTP passwords are typically 44 characters.'
    );
  }

  // Display current configuration
  result.info.forEach(info => console.log(`   ✓ ${info}`));
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   ⚠ ${warning}`));
  }

  return result;
}

async function testSESConnection(): Promise<boolean> {
  console.log('\n🔌 Testing SMTP Connection...\n');

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    debug: false, // Set to true for verbose output
  });

  try {
    await transporter.verify();
    console.log('   ✅ SMTP connection successful!');
    return true;
  } catch (error: any) {
    console.error('   ❌ SMTP connection failed!');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n   💡 Tip: Check your SMTP credentials in .env file');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n   💡 Tip: Check your network/firewall settings');
      console.error('      Ensure outbound traffic on port', env.SMTP_PORT, 'is allowed');
    }
    
    return false;
  }
}

async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  console.log(`\n📧 Sending Test Email to ${recipientEmail}...\n`);

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: env.EMAIL_FROM,
    to: recipientEmail,
    subject: '✅ AWS SES Test Email - LMS Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Success!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">AWS SES is Working!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your LMS Platform is successfully configured to send emails via AWS SES.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Test Details:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>SMTP Host:</strong> ${env.SMTP_HOST}</li>
              <li><strong>Region:</strong> ${env.AWS_REGION}</li>
              <li><strong>From Address:</strong> ${env.EMAIL_FROM}</li>
            </ul>
          </div>
          
          <div style="background: #e8f4f8; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
            <strong style="color: #17a2b8;">ℹ️ Next Steps:</strong>
            <ol style="color: #666; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Verify your domain in AWS SES for production use</li>
              <li>Request production access if you're in sandbox mode</li>
              <li>Set up bounce and complaint notifications</li>
              <li>Configure DKIM, SPF, and DMARC records</li>
            </ol>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            This is an automated test email from your LMS Platform.<br>
            Sent via Amazon SES
          </p>
        </div>
      </div>
    `,
    text: `
AWS SES Test Email - Success!

Your LMS Platform is successfully configured to send emails via AWS SES.

Test Details:
- Timestamp: ${new Date().toLocaleString()}
- SMTP Host: ${env.SMTP_HOST}
- Region: ${env.AWS_REGION}
- From Address: ${env.EMAIL_FROM}

Next Steps:
1. Verify your domain in AWS SES for production use
2. Request production access if you're in sandbox mode
3. Set up bounce and complaint notifications
4. Configure DKIM, SPF, and DMARC records

---
This is an automated test email from your LMS Platform.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('   ✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return true;
  } catch (error: any) {
    console.error('   ❌ Failed to send test email!');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('not verified')) {
      console.error('\n   💡 Tip: You may be in AWS SES Sandbox mode');
      console.error('      - Verify the sender email address in AWS SES console');
      console.error('      - OR request production access');
      console.error('      - See: docs/AWS_SES_SETUP.md for details');
    }
    
    return false;
  }
}

async function main() {
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('\n❌ Error: No recipient email provided\n');
    console.log('Usage: npm run test:ses your-email@example.com\n');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error('\n❌ Error: Invalid email format\n');
    process.exit(1);
  }

  try {
    // Step 1: Verify configuration
    const configResult = await verifySESConfiguration();

    // Step 2: Test connection
    const connectionSuccess = await testSESConnection();
    if (!connectionSuccess) {
      console.log('\n❌ Cannot proceed: SMTP connection failed\n');
      process.exit(1);
    }

    // Step 3: Send test email
    const emailSuccess = await sendTestEmail(recipientEmail);

    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 Verification Summary\n');
    
    if (emailSuccess) {
      console.log('   ✅ AWS SES is properly configured!');
      console.log(`   ✅ Test email sent to ${recipientEmail}`);
      console.log('\n   Check your inbox (and spam folder) for the test email.\n');
      
      if (configResult.warnings.length > 0) {
        console.log('   ⚠️  There are warnings to review above.\n');
      }
      
      console.log('   📖 For more information, see: backend/docs/AWS_SES_SETUP.md\n');
      process.exit(0);
    } else {
      console.log('   ❌ AWS SES setup incomplete');
      console.log('\n   Please review the errors above and check:\n');
      console.log('   1. SMTP credentials in .env file');
      console.log('   2. Email verification status in AWS SES console');
      console.log('   3. AWS SES sandbox/production mode');
      console.log('   4. Network/firewall settings\n');
      console.log('   📖 See setup guide: backend/docs/AWS_SES_SETUP.md\n');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the verification
main();
