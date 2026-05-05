'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { courseApi } from '@/lib/api';
import { Course } from '@/types';
import { Plus, BookOpen, Users, Edit, Settings, Loader2 } from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    courseApi
      .getMyCourses()
      .then(({ data }) => setCourses(data.data ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <Link href="/dashboard/instructor/courses/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h2>
          <p className="text-gray-500 mb-6">Create your first course and start teaching</p>
          <Link href="/dashboard/instructor/courses/new" className="btn-primary">Create Course</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="card p-4 flex items-start gap-4">
              <div className="relative w-32 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {course.thumbnail ? (
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{course.title}</h3>
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                      course.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : course.status === 'DRAFT'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {course.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{course.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course.totalStudents.toLocaleString()} students
                  </span>
                  <span>{formatPrice(course.price)}</span>
                  <span>Updated {timeAgo(course.updatedAt)}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/dashboard/instructor/courses/${course.id}/settings`}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <Link
                  href={`/dashboard/instructor/courses/${course.id}/curriculum`}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Curriculum
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
