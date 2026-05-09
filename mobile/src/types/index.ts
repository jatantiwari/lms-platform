// Shared TypeScript types mirroring the backend

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string;
  headline?: string;
  website?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  instructorApproved: boolean;
  createdAt: string;
  _count?: { enrollments: number; courses: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDesc?: string;
  thumbnail?: string | null;
  price: number;
  discountPrice?: number | null;
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
  mobileOnly: boolean;
  instructorId: string;
  instructor: Pick<User, 'id' | 'name' | 'avatar' | 'headline'>;
  category?: Category;
  sections?: Section[];
  isEnrolled?: boolean;
  createdAt: string;
  updatedAt: string;
  reviews?: Review[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lectures: Lecture[];
}

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  videoUrl?: string | null;
  isFree: boolean;
  isPublished: boolean;
  videoProcessing?: boolean;
  avgRating?: number;
  totalRatings?: number;
  sectionId: string;
  resources?: LectureResource[];
}

export interface LectureResource {
  type: 'link' | 'attachment';
  title: string;
  url: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedAt?: string;
  completionPercentage?: number;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    level: CourseLevel;
    totalLectures: number;
    totalDuration: number;
    instructor: Pick<User, 'id' | 'name' | 'avatar'>;
  };
  progress?: {
    completedLectures: number;
    totalLectures: number;
    percentage: number;
  };
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface Progress {
  completedLectures: string[];
  totalLectures: number;
  percentage: number;
  lastWatched?: string;
}

export interface Notification {
  id: string;
  type: 'enrollment' | 'new_lecture' | 'review_reply' | 'general';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  courseId?: string;
  lectureId?: string;
}

// AppNotification: used by the local notification store (includes data payload)
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
  data?: {
    courseId?: string;
    lectureId?: string;
    [key: string]: unknown;
  };
}
