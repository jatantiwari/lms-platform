'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi, instructorApi } from '@/lib/api';
import { InstructorStats } from '@/types';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Loader2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';
import { useUser } from '@/store/authStore';

export default function InstructorDashboardPage() {
  const user = useUser();
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

  const cards = [
    {
      label: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Total Earnings',
      value: formatPrice(stats?.totalEarnings ?? 0),
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Published Courses',
      value: stats?.publishedCourses ?? 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Approval status banner */}
      {!user?.instructorApproved && (
        <ApprovalBanner />
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-primary-100 mt-1 text-sm">Here&apos;s what&apos;s happening with your courses today.</p>
          </div>
          <Link
            href="/dashboard/instructor/courses/new"
            className="flex items-center gap-2 bg-white text-primary-600 font-semibold px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-xl border ${border} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Earnings */}
        {stats?.monthlyEarnings && stats.monthlyEarnings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Monthly Earnings</h2>
            </div>
            <div className="space-y-3">
              {stats.monthlyEarnings.map((m) => {
                const maxAmount = Math.max(...stats.monthlyEarnings.map((x) => x.amount), 1);
                const pct = Math.round((m.amount / maxAmount) * 100);
                return (
                  <div key={`${m.month}-${m.year}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {new Date(m.year, m.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="font-semibold text-gray-900">{formatPrice(m.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
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
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h2 className="font-semibold text-gray-900">Recent Enrollments</h2>
              </div>
              <Link href="/dashboard/instructor/courses" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentEnrollments.map((e) => (
                <div
                  key={e.user.id + '-' + e.course.id + '-' + e.createdAt}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs shrink-0">
                      {e.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{e.course?.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{timeAgo(e.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/instructor/courses/new"
            className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-primary-300 hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <Plus className="w-5 h-5 text-primary-500 group-hover:text-primary-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Create Course</p>
              <p className="text-xs text-gray-500">Add a new course</p>
            </div>
          </Link>
          <Link
            href="/dashboard/instructor/courses"
            className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <BookOpen className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Manage Courses</p>
              <p className="text-xs text-gray-500">Edit or publish</p>
            </div>
          </Link>
          <Link
            href="/dashboard/instructor/analytics"
            className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-all group"
          >
            <TrendingUp className="w-5 h-5 text-amber-500 group-hover:text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">View Analytics</p>
              <p className="text-xs text-gray-500">Track performance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Approval Status Banner ──────────────────────────────────────────────── */
function ApprovalBanner() {
  const [appStatus, setAppStatus] = useState<'loading' | 'none' | 'PENDING' | 'REJECTED'>('loading');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    instructorApi
      .getMyApplication()
      .then(({ data }) => {
        const app = data.data;
        if (!app) { setAppStatus('none'); return; }
        setAppStatus(app.status === 'APPROVED' ? 'none' : app.status);
        if (app.rejectionReason) setRejectionReason(app.rejectionReason);
      })
      .catch(() => setAppStatus('none'));
  }, []);

  if (appStatus === 'loading') return null;

  if (appStatus === 'none') {
    return (
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-yellow-800">Complete your instructor application</p>
          <p className="text-xs text-yellow-700 mt-0.5">Submit your application so an admin can verify your account before you can create courses.</p>
        </div>
        <Link
          href="/onboarding/instructor"
          className="shrink-0 text-xs font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Apply Now
        </Link>
      </div>
    );
  }

  if (appStatus === 'PENDING') {
    return (
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Application under review</p>
          <p className="text-xs text-blue-700 mt-0.5">Your instructor application is being reviewed. We&apos;ll email you once a decision is made. Course creation is disabled until approved.</p>
        </div>
      </div>
    );
  }

  if (appStatus === 'REJECTED') {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">Application rejected</p>
          {rejectionReason && <p className="text-xs text-red-700 mt-0.5">{rejectionReason}</p>}
        </div>
        <Link
          href="/onboarding/instructor"
          className="shrink-0 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Reapply
        </Link>
      </div>
    );
  }

  return null;
}
