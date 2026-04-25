# AWS SES Setup Guide

This guide will help you set up Amazon Simple Email Service (SES) for your LMS Platform.

## Why AWS SES?

- ✅ **Cost-effective**: $0.10 per 1,000 emails
- ✅ **High deliverability**: 99.9% uptime SLA
- ✅ **Scalable**: Send millions of emails
- ✅ **Integrated**: Works with your existing AWS infrastructure
- ✅ **Free tier**: 3,000 emails/month when sending from EC2

---

## Step 1: Access AWS SES Console

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Simple Email Service (SES)**
3. Select your preferred region (e.g., `ap-south-1` for Mumbai)

> **Note**: Ensure you're in the same region as your S3 bucket for consistency.

---

## Step 2: Verify Your Email Address or Domain

### Option A: Email Verification (Quick Start)

1. Go to **Verified identities** → **Create identity**
2. Select **Email address**
3. Enter your email (e.g., `noreply@yourdomain.com`)
4. Click **Create identity**
5. Check your email for verification link and click it

### Option B: Domain Verification (Recommended for Production)

1. Go to **Verified identities** → **Create identity**
2. Select **Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Choose **Easy DKIM** (recommended)
5. Click **Create identity**
6. Add the provided DNS records to your domain:
   - **DKIM records** (3 CNAME records)
   - **SPF record** (TXT): `v=spf1 include:amazonses.com ~all`
   - **DMARC record** (optional): `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
7. Wait for DNS propagation (5-60 minutes)

---

## Step 3: Request Production Access

**Important**: New AWS accounts start in **Sandbox Mode** with limitations:
- ✉️ Only send to verified email addresses
- 📊 Limited to 200 emails/day, 1 email/second

### Request Production Access:

1. Go to **Account dashboard** → **Request production access**
2. Fill out the form:
   - **Mail type**: Transactional
   - **Website URL**: Your LMS domain
   - **Use case description**: 
     ```
     This is an LMS (Learning Management System) platform that sends 
     transactional emails including:
     - User registration/welcome emails
     - Password reset emails
     - Course enrollment confirmations
     - Progress notifications
     
     All emails are opt-in and sent only to registered users.
     ```
   - **Compliance**: Confirm you have bounce/complaint handling
3. Submit request (usually approved within 24 hours)

---

## Step 4: Create SMTP Credentials

1. Go to **SMTP settings** in the left sidebar
2. Click **Create SMTP credentials**
3. Enter IAM user name: `lms-platform-smtp-user`
4. Click **Create user**
5. **Download credentials** (you'll only see these once!)
   - SMTP Username (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - SMTP Password (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

---

## Step 5: Update Your .env File

Update your `backend/.env` with the SES credentials:

```env
# AWS SES Configuration
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EMAIL_FROM="LMS Platform <noreply@yourdomain.com>"
```

### SMTP Endpoints by Region:

| Region | SMTP Endpoint |
|--------|---------------|
| US East (N. Virginia) | `email-smtp.us-east-1.amazonaws.com` |
| US West (Oregon) | `email-smtp.us-west-2.amazonaws.com` |
| EU (Ireland) | `email-smtp.eu-west-1.amazonaws.com` |
| Asia Pacific (Mumbai) | `email-smtp.ap-south-1.amazonaws.com` |
| Asia Pacific (Singapore) | `email-smtp.ap-southeast-1.amazonaws.com` |

[Full list of endpoints](https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html)

---

## Step 6: Configure Email Notifications

### Set Up Bounce and Complaint Handling:

1. Go to **Configuration sets** → **Create set**
2. Name it: `lms-platform-emails`
3. Add **Event destinations**:
   - **Bounces**: Send to SNS topic or CloudWatch
   - **Complaints**: Send to SNS topic or CloudWatch
4. Update your email utility to use this configuration set (optional)

### Update email.ts to use configuration set (optional):

```typescript
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  // Add configuration set
  headers: {
    'X-SES-CONFIGURATION-SET': 'lms-platform-emails'
  }
});
```

---

## Step 7: Test Your Setup

Run the email test script:

```bash
cd backend
npm run test:email your-verified-email@example.com
```

You should see:
```
✅ Email sent successfully!
Check your inbox to confirm delivery.
```

---

## Step 8: Monitor Email Sending

### CloudWatch Metrics:
- Go to **CloudWatch** → **Metrics** → **SES**
- Monitor: Sends, Bounces, Complaints, Rejects

### Reputation Dashboard:
- Go to **SES** → **Reputation metrics**
- Keep bounce rate < 5%
- Keep complaint rate < 0.1%

---

## Common Issues and Solutions

### ❌ "Email address is not verified"
**Solution**: Verify your sender email or request production access.

### ❌ "554 Message rejected: Email address is not verified"
**Solution**: You're in sandbox mode. Verify recipient emails or request production access.

### ❌ "Invalid credentials"
**Solution**: Double-check SMTP username and password in .env file.

### ❌ "Connection timeout"
**Solution**: Ensure your VPS security group allows outbound traffic on port 587.

### ❌ Emails going to spam
**Solutions**:
- Set up SPF, DKIM, and DMARC records
- Warm up your domain (gradually increase sending volume)
- Use a configuration set with feedback loop
- Maintain good reputation (low bounce/complaint rates)

---

## Security Best Practices

1. **Never commit .env file** - Add to .gitignore
2. **Use IAM policies** - Restrict SES user to only send emails
3. **Rotate credentials** - Change SMTP passwords periodically
4. **Monitor usage** - Set up CloudWatch alarms for unusual activity
5. **Enable MFA** - Protect your AWS account with multi-factor auth

---

## Cost Estimation

### Pricing (as of 2026):
- **First 3,000 emails/month**: Free (when sending from EC2)
- **Additional emails**: $0.10 per 1,000 emails
- **Attachments**: $0.12 per GB

### Example:
- **10,000 emails/month**: ~$0.70/month
- **100,000 emails/month**: ~$9.70/month
- **1M emails/month**: ~$97/month

Much cheaper than SendGrid or Mailchimp!

---

## Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SMTP Interface Guide](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Deliverability Dashboard](https://docs.aws.amazon.com/ses/latest/dg/reputation-dashboard.html)

---

## Quick Checklist

- [ ] AWS SES console accessed
- [ ] Email/domain verified
- [ ] Production access requested (if needed)
- [ ] SMTP credentials created and downloaded
- [ ] .env file updated with SES credentials
- [ ] DNS records added (for domain verification)
- [ ] Test email sent successfully
- [ ] Bounce/complaint notifications configured
- [ ] CloudWatch monitoring set up

---

**Need Help?** Check the AWS SES documentation or contact AWS Support.
