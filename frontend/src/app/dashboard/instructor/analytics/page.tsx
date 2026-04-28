'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { InstructorStats } from '@/types';
import { TrendingUp, Users, DollarSign, BookOpen, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function InstructorAnalyticsPage() {
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track your course performance and earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: stats?.totalCourses ?? 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Total Earnings', value: formatPrice(stats?.totalEarnings ?? 0), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Published', value: stats?.publishedCourses ?? 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-xl border ${border} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Earnings Chart */}
      {stats?.monthlyEarnings && stats.monthlyEarnings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Monthly Earnings Breakdown</h2>
          </div>
          <div className="space-y-4">
            {stats.monthlyEarnings.map((m) => {
              const maxAmount = Math.max(...stats.monthlyEarnings.map((x) => x.amount), 1);
              const pct = Math.round((m.amount / maxAmount) * 100);
              return (
                <div key={`${m.month}-${m.year}`}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600 w-28">
                      {new Date(m.year, m.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 w-20 text-right">{formatPrice(m.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Enrollments */}
      {stats?.recentEnrollments && stats.recentEnrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-gray-900">All Recent Enrollments</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentEnrollments.map((e) => (
              <div key={e.user.id + e.course.id + e.createdAt} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs shrink-0">
                    {e.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.user?.name}</p>
                    <p className="text-xs text-gray-400">{e.course?.title}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
