'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CourseCard from '@/components/course/CourseCard';
import { courseApi } from '@/lib/api';
import { Course, PaginationMeta } from '@/types';
import { Search, Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters from URL params
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [level, setLevel] = useState(searchParams.get('level') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? 'newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await courseApi.getAll({
        page,
        limit: 12,
        search: search || undefined,
        level: level || undefined,
        sortBy,
      });
      setCourses(data.data ?? []);
      setMeta(data.meta);
    } catch {
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, level, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setLevel('');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = search || level || sortBy !== 'newest';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <div className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">All Courses</h1>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="input-field pl-10"
                />
              </div>
              <button type="submit" className="btn-primary px-6">Search</button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'btn-secondary flex items-center gap-2',
                  showFilters && 'ring-2 ring-primary-500',
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </form>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Level</label>
                  <select
                    value={level}
                    onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                    className="input-field w-44"
                  >
                    <option value="">All Levels</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="input-field w-48"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 pb-2.5">
                    <X className="w-4 h-4" /> Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {meta && (
            <p className="text-sm text-gray-500 mb-6">
              {meta.total.toLocaleString()} course{meta.total !== 1 ? 's' : ''} found
            </p>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-semibold text-gray-700">No courses found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!meta.hasPrevPage}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                            p === page
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!meta.hasNextPage}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
