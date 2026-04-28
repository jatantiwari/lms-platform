'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { enrollmentApi } from '@/lib/api';
import { Enrollment } from '@/types';
import { BookOpen, Clock, ChevronRight, Loader2, Trophy } from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    enrollmentApi
      .getMyEnrollments()
      .then(({ data }) => setEnrollments(data.data ?? []))
      .catch(() => setEnrollments([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const getProgress = (e: Enrollment) => {
    const raw = e.progress;
    return typeof raw === 'object' && raw !== null ? raw.percentage ?? 0 : raw ?? 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-500 text-sm mt-1">
          {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-20">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h2>
          <p className="text-gray-400 mb-6">Start learning by enrolling in a course</p>
          <Link href="/courses" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const progress = getProgress(enrollment);
            return (
              <Link
                key={enrollment.id}
                href={`/courses/${course.slug}/learn`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
              >
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-primary-300" />
                    </div>
                  )}
                  {enrollment.completedAt && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Completed
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-3 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>

                  <div className="mb-3">
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
