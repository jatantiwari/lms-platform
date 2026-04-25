'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { dashboardApi } from '@/lib/api';
import { Course } from '@/types';
import { Search, BookOpen, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff, Star } from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = async (pg = page, q = search) => {
    setIsLoading(true);
    try {
      const { data } = await dashboardApi.getAllCourses({ page: pg, limit: 20, search: q });
      setCourses(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCourses(1, search);
  };

  const handleStatusToggle = async (course: Course) => {
    const newStatus = course.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    try {
      await dashboardApi.adminUpdateCourse(course.id, { status: newStatus });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: newStatus } : c)),
      );
      toast.success(`Course ${newStatus.toLowerCase()}`);
    } catch {
      toast.error('Failed to update course');
    }
  };

  const handleToggleFeatured = async (course: Course) => {
    try {
      await dashboardApi.adminUpdateCourse(course.id, { isFeatured: !course.isFeatured });
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isFeatured: !c.isFeatured } : c)),
      );
      toast.success('Course updated');
    } catch {
      toast.error('Failed to update course');
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses ({total.toLocaleString()})</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="input-field pl-9"
          />
        </div>
        <button type="submit" className="btn-primary px-5">Search</button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="card p-4 flex items-start gap-4">
                <div className="relative w-24 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{course.title}</h3>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                      course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                      course.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600',
                    )}>
                      {course.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    By {course.instructor?.name} &bull; {course.totalStudents} students &bull; {formatPrice(course.price)} &bull; {timeAgo(course.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(course)}
                    title={course.isFeatured ? 'Unfeature' : 'Feature'}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      course.isFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500',
                    )}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStatusToggle(course)}
                    title={course.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {course.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary disabled:opacity-50 flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="btn-secondary disabled:opacity-50 flex items-center gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
