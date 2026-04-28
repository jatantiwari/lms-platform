'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { enrollmentApi } from '@/lib/api';
import { Enrollment } from '@/types';
import { BookOpen, Clock, ChevronRight, Loader2, GraduationCap, Trophy, PlayCircle } from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';
import { useUser } from '@/store/authStore';

interface EnrollmentWithProgress extends Enrollment {}

export default function StudentDashboardPage() {
  const user = useUser();
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await enrollmentApi.getMyEnrollments();
        setEnrollments(data.data ?? []);
      } catch {
        setEnrollments([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const completed = enrollments.filter((e) => !!e.completedAt).length;
  const inProgress = enrollments.filter((e) => !e.completedAt).length;

  const getProgress = (enrollment: EnrollmentWithProgress) => {
    const raw = enrollment.progress;
    return typeof raw === 'object' && raw !== null ? raw.percentage ?? 0 : raw ?? 0;
  };

  // Show up to 3 in-progress courses on overview
  const recentEnrollments = enrollments
    .filter((e) => !e.completedAt)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-primary-100 mt-1 text-sm">
          Keep up the great work — you&apos;re making progress!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Enrolled</p>
            <div className="bg-indigo-50 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total courses</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">In Progress</p>
            <div className="bg-amber-50 p-2 rounded-lg">
              <PlayCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inProgress}</p>
          <p className="text-xs text-gray-400 mt-0.5">Active courses</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <Trophy className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Finished courses</p>
        </div>
      </div>

      {/* Continue Learning */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Continue Learning</h2>
          <Link href="/dashboard/student/courses" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No courses yet</h3>
            <p className="text-xs text-gray-400 mb-4">Start learning by browsing our catalogue</p>
            <Link href="/courses" className="btn-primary text-sm">Browse Courses</Link>
          </div>
        ) : recentEnrollments.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">You&apos;ve completed all your enrolled courses. Enroll in more!</p>
            <Link href="/courses" className="btn-primary text-sm mt-4 inline-block">Browse Courses</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEnrollments.map((enrollment) => {
              const course = enrollment.course;
              const progress = getProgress(enrollment);
              return (
                <Link
                  key={enrollment.id}
                  href={`/courses/${course.slug}/learn`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                >
                  <div className="relative w-16 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {course.thumbnail ? (
                      <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{progress}%</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(course.totalDuration)}
                      </span>
                      <span>{timeAgo(enrollment.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Browse more */}
      <div className="bg-gradient-to-br from-indigo-50 to-primary-50 rounded-xl border border-indigo-100 p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900">Explore more courses</h3>
          <p className="text-sm text-gray-500 mt-0.5">Discover new topics and expand your skills</p>
        </div>
        <Link href="/courses" className="btn-primary shrink-0 text-sm">Browse Courses</Link>
      </div>
    </div>
  );
}
