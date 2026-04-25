'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { AdminStats } from '@/types';
import { Users, BookOpen, TrendingUp, DollarSign, ChevronRight, Loader2 } from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getAdminStats()
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
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Courses', value: stats?.totalCourses ?? 0, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Enrollments', value: stats?.totalEnrollments ?? 0, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'text-yellow-600 bg-yellow-50' },
  ];

  const userRoles = stats?.usersByRole ?? {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Users by Role</h2>
          <div className="space-y-3">
            {Object.entries(userRoles).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{role}</span>
                <span className="font-semibold text-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-primary-600 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.recentUsers ?? []).map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    user.role === 'INSTRUCTOR' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>{user.role}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: Users },
          { href: '/admin/courses', label: 'Manage Courses', icon: BookOpen },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6 text-primary-600" />
              <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {label}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
