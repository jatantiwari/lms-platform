'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { enrollmentApi, progressApi } from '@/lib/api';
import { Enrollment } from '@/types';
import { BookOpen, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';

interface ProgressObject {
  totalLectures: number;
  completedCount: number;
  percentage: number;
}

interface EnrollmentWithProgress extends Enrollment {
  progress?: ProgressObject | number;
}

export default function StudentDashboardPage() {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Learning</h1>
      <p className="text-gray-500 text-sm mb-8">{enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled</p>

      {enrollments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h2>
          <p className="text-gray-500 mb-6">Start learning by enrolling in a course</p>
          <Link href="/courses" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const rawProgress = enrollment.progress;
            const progress = typeof rawProgress === 'object' && rawProgress !== null
              ? rawProgress.percentage ?? 0
              : rawProgress ?? 0;
            return (
              <Link
                key={enrollment.id}
                href={`/courses/${course.slug}/learn`}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-primary-300" />
                    </div>
                  )}
                  {enrollment.completedAt && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Completed
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{progress}% complete</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(course.totalDuration)}
                    </span>
                    <span>{timeAgo(enrollment.createdAt)}</span>
                  </div>
                </div>

                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary-600 font-medium">
                      {progress === 100 ? 'Review Course' : progress === 0 ? 'Start Learning' : 'Continue Learning'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-primary-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
