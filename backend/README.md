# LMS Platform - Backend API

Production-ready Learning Management System backend built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Students, instructors, and administrators
- 📚 **Course Management** - Create, update, and manage courses with sections and lectures
- 🎥 **Video Processing** - HLS streaming, S3 upload, and transcoding
- 💳 **Payment Integration** - Razorpay integration for course purchases
- 📧 **Email Service** - AWS SES/SMTP for transactional emails
- 📊 **Progress Tracking** - Student progress and completion tracking
- ⭐ **Reviews & Ratings** - Course reviews and rating system
- 🔒 **Security** - Helmet, CORS, rate limiting, input validation

## 📋 Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 14+
- AWS Account (for S3 and optionally SES)
- Razorpay Account (for payments)

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Server
NODE_ENV=development
PORT=5010
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5010/api/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lms_platform

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-super-secret-access-token-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-min-32-chars

# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket-name

# AWS SES (Email)
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
EMAIL_FROM="LMS Platform <noreply@yourdomain.com>"

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

### 4. AWS S3 Setup

1. Create an S3 bucket in AWS Console
2. Configure CORS for your bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
3. Create IAM user with S3 permissions and get access keys

### 5. Email Service Setup (AWS SES)

See detailed guide: [docs/AWS_SES_SETUP.md](docs/AWS_SES_SETUP.md)

**Quick Start:**
1. Go to AWS SES Console
2. Verify your email address or domain
3. Create SMTP credentials
4. Update `.env` with SMTP credentials
5. Test: `npm run test:ses your-email@example.com`

**Alternative Email Providers:**
- Gmail (for development)
- SendGrid
- Mailgun
- See `.env.example` for configuration examples

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5010`

### Production Mode

```bash
# Build
npm run build

# Start
npm start
```

## 🧪 Testing

### Test Email Configuration

```bash
# Test generic email service
npm run test:email recipient@example.com

# Test AWS SES specifically (with detailed diagnostics)
npm run test:ses recipient@example.com
```

### Test API Endpoints

Use the included Postman collection or:

```bash
# Health check
curl http://localhost:5010/health

# API documentation
curl http://localhost:5010/api-docs
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (env, database, logger, S3)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (auth, validation, error handling)
│   ├── routes/          # API routes
│   ├── services/        # Business logic (payment, S3, video, transcribe)
│   ├── utils/           # Utility functions (email, JWT, password, etc.)
│   ├── validations/     # Zod validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeder
├── docs/                # Documentation
│   └── AWS_SES_SETUP.md # Email setup guide
└── dist/                # Compiled JavaScript (generated)
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Courses
- `GET /api/v1/courses` - List all courses
- `GET /api/v1/courses/:slug` - Get course details
- `POST /api/v1/courses` - Create course (instructor)
- `PUT /api/v1/courses/:id` - Update course (instructor)
- `DELETE /api/v1/courses/:id` - Delete course (instructor)

### Lectures
- `GET /api/v1/lectures/:id` - Get lecture details
- `POST /api/v1/lectures` - Create lecture (instructor)
- `PUT /api/v1/lectures/:id` - Update lecture (instructor)
- `DELETE /api/v1/lectures/:id` - Delete lecture (instructor)
- `POST /api/v1/lectures/:id/upload` - Upload video

### Enrollments
- `POST /api/v1/enrollments` - Enroll in course
- `GET /api/v1/enrollments/my-courses` - Get user's enrolled courses

### Progress
- `POST /api/v1/progress/mark-complete` - Mark lecture as complete
- `GET /api/v1/progress/course/:courseId` - Get course progress

### Reviews
- `POST /api/v1/reviews` - Create review
- `GET /api/v1/reviews/course/:courseId` - Get course reviews

### Payments
- `POST /api/v1/payments/create-order` - Create Razorpay order
- `POST /api/v1/payments/verify` - Verify payment

### HLS Streaming
- `GET /api/v1/hls/:videoKey/master.m3u8` - Get HLS manifest
- `GET /api/v1/hls/:videoKey/:quality/:segment` - Get HLS segment

## 🔒 Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Zod schema validation
- **Password Hashing** - bcrypt
- **JWT Authentication** - Secure token-based auth
- **Role-based Access Control** - Student, Instructor, Admin roles

## 📧 Email Templates

The system sends the following transactional emails:

1. **Welcome Email** - Sent on user registration
2. **Password Reset** - Sent when user requests password reset
3. **Enrollment Confirmation** - Sent when user enrolls in a course

Customize templates in: `src/utils/email.ts`

## 🐛 Debugging

### Enable Debug Logs

Set in `.env`:
```env
NODE_ENV=development
```

Logs are written to:
- Console (development)
- Files in `logs/` directory (production)

### Common Issues

**Email not sending:**
```bash
# Run diagnostics
npm run test:ses your-email@example.com

# Check .env configuration
# Verify AWS SES credentials
# Ensure email/domain is verified in AWS SES
```

**Database connection failed:**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# Test connection: psql -d DATABASE_URL
```

**S3 upload failed:**
```bash
# Verify AWS credentials in .env
# Check S3 bucket permissions
# Ensure bucket CORS is configured
```

## 📦 Deployment

See the main [deployment guide](../README.md) for VPS deployment instructions.

### Quick Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure production database
- [ ] Set up AWS SES with verified domain
- [ ] Request AWS SES production access
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License

## 📞 Support

For issues and questions:
- Check [docs/AWS_SES_SETUP.md](docs/AWS_SES_SETUP.md) for email setup
- Review environment variables in `.env.example`
- Check application logs in `logs/` directory

---

Built with ❤️ using Node.js, Express, TypeScript, and PostgreSQL
