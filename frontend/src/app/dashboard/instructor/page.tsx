'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { InstructorStats } from '@/types';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getInstructorStats()
      .then(({ data }) => setStats(data.data))
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

  const cards = [
    {
      label: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Total Earnings',
      value: formatPrice(stats?.totalEarnings ?? 0),
      icon: DollarSign,
      color: 'text-yellow-600 bg-yellow-50',
    },
    {
      label: 'Published Courses',
      value: stats?.publishedCourses ?? 0,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your courses and track performance</p>
        </div>
        <Link href="/dashboard/instructor/courses/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Earnings */}
        {stats?.monthlyEarnings && stats.monthlyEarnings.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
            <div className="space-y-3">
              {stats.monthlyEarnings.map((m) => (
                <div key={`${m.month}-${m.year}`} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(m.year, m.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="font-semibold text-gray-900">{formatPrice(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Enrollments */}
        {stats?.recentEnrollments && stats.recentEnrollments.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Enrollments</h2>
              <Link href="/dashboard/instructor/courses" className="text-sm text-primary-600 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentEnrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.user?.name}</p>
                    <p className="text-xs text-gray-500">{e.course?.title}</p>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(e.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* My Courses quick link */}
      <div className="mt-6">
        <Link
          href="/dashboard/instructor/courses"
          className="flex items-center justify-between card p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              Manage My Courses
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
