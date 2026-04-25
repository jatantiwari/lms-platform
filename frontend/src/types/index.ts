// Shared TypeScript types for the LMS platform

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  bio?: string;
  headline?: string;
  website?: string;
  emailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  _count?: { enrollments: number; courses: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDesc?: string;
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountPrice?: number;
  status: CourseStatus;
  level: CourseLevel;
  language: string;
  tags: string[];
  requirements: string[];
  objectives: string[];
  totalDuration: number;
  totalLectures: number;
  totalStudents: number;
  avgRating: number;
  totalReviews: number;
  isFeatured: boolean;
  instructorId: string;
  instructor: Pick<User, 'id' | 'name' | 'avatar' | 'headline'>;
  category?: Category;
  sections?: Section[];
  isEnrolled?: boolean;
  createdAt: string;
  reviews?: Review[];
  updatedAt: string;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lectures: Lecture[];
}

export interface LectureResource {
  type: 'link' | 'attachment';
  title: string;
  url: string;
  key?: string; // S3 key (attachments only)
}

export interface LectureQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  showAtSecond: number;
  explanation?: string;
}

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  videoUrl?: string;
  isFree: boolean;
  isPublished: boolean;
  videoProcessing?: boolean; // true while ffmpeg is converting in background
  sectionId: string;
  resources?: LectureResource[];
  questions?: LectureQuestion[];
  transcriptStatus?: string;
  transcript?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedAt?: string;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail' | 'level' | 'totalLectures' | 'totalDuration'> & {
    instructor: Pick<User, 'id' | 'name' | 'avatar'>;
  };
  progress?: {
    totalLectures: number;
    completedCount: number;
    percentage: number;
  };
  createdAt: string;
}

export interface Progress {
  lectureId: string;
  completed: boolean;
  watchedSeconds: number;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  courseId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId?: string;
  courseId: string;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail'>;
  createdAt: string;
}

// API response shapes
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEarnings: number;
  courses: Course[];
  recentEnrollments: Array<{
    user: Pick<User, 'id' | 'name' | 'avatar'>;
    course: Pick<Course, 'id' | 'title' | 'slug'>;
    createdAt: string;
  }>;
  monthlyEarnings: any[]; // Simplified for now, can be expanded to include month/year breakdown
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  usersByRole: Array<{ role: Role; _count: { role: number } }>;
  recentUsers: User[];
  recentCourses: Course[];
}
