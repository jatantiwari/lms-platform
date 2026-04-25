# LMS Platform

A full-featured, production-ready Learning Management System built with Next.js, Node.js, PostgreSQL, and HLS video streaming.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | JWT (access 15m / refresh 7d) + RBAC |
| Storage | AWS S3 / Cloudflare R2 |
| Video | ffmpeg → HLS `.m3u8` streaming via HLS.js |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |
| Cache | Redis (optional) |

## Features

- **3 roles**: Student, Instructor, Admin
- **Course management**: sections, lectures, HLS video upload, thumbnail upload
- **Student experience**: browse, purchase (Razorpay), watch with progress tracking, leave reviews
- **Instructor dashboard**: earnings stats, student roster, curriculum editor
- **Admin panel**: manage users (activate/deactivate), moderate courses (feature/archive)
- **Adaptive HLS streaming**: 360p / 720p / 1080p automatically generated via ffmpeg
- **Email notifications**: welcome, enrollment confirmation, password reset

## Prerequisites

- Node.js 18+
- PostgreSQL 16
- Redis 7 (optional, for rate limiting)
- ffmpeg installed and in PATH
- AWS S3 (or compatible) bucket

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> lms-platform
cd lms-platform

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit both files with your credentials.

### 3. Database Setup

```bash
cd backend

# Run migrations
npm run prisma:migrate

# Seed default categories and users
npm run prisma:seed
```

Default seeded accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lmsplatform.com | Admin@123 |
| Instructor | instructor@demo.com | Instructor@123 |
| Student | student@demo.com | Student@123 |

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend && npm run dev
```

## Docker (Database + Redis only)

```bash
# Start only PostgreSQL and Redis
docker-compose up postgres redis -d

# Then run backend and frontend locally as above
```

## Full Docker Compose

```bash
# Requires backend/Dockerfile to be created
cp .env.example .env   # fill in secrets
docker-compose up -d
```

## API Overview

All endpoints are prefixed with `/api/v1/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | Public | Register |
| POST | /auth/login | Public | Login |
| GET | /auth/me | JWT | Current user |
| GET | /courses | Public | Browse courses |
| GET | /courses/:slug | Optional | Course detail |
| POST | /courses | Instructor | Create course |
| POST | /payments/create-order | Student | Create Razorpay order |
| POST | /payments/verify | Student | Verify payment + enroll |
| GET | /enrollments/my | Student | My enrollments |
| PUT | /progress/lecture/:id | Student | Update progress |
| GET | /dashboard/instructor | Instructor | Stats |
| GET | /dashboard/admin | Admin | Platform stats |

Full Swagger docs available at `http://localhost:5000/api-docs` in development.

## Project Structure

```
lms-platform/
├── backend/                # Express + TypeScript API
│   ├── prisma/             # Schema, migrations, seed
│   └── src/
│       ├── config/         # Env, Prisma, S3, logger
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth, validation, upload
│       ├── routes/         # Express routers
│       ├── services/       # S3, video, payment
│       ├── utils/          # AppError, jwt, email, etc.
│       └── validations/    # Zod schemas
├── frontend/               # Next.js 14 App Router
│   └── src/
│       ├── app/            # Pages (auth, courses, dashboard, admin)
│       ├── components/     # Reusable UI components
│       ├── lib/            # API client, utilities
│       ├── store/          # Zustand stores
│       └── types/          # TypeScript interfaces
└── docker-compose.yml
```

## Deployment Notes

- Set `NODE_ENV=production` on backend to enable JSON logging and disable stack traces in responses
- Configure CORS `FRONTEND_URL` to match your deployed frontend domain
- Use a CDN in front of S3 for video segment delivery performance
- ffmpeg must be available in the backend server's PATH for video processing
- For Razorpay webhooks, expose `/api/v1/payments/webhook` with your webhook secret
# lms-platform
