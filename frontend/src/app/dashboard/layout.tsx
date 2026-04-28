'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  PlusCircle,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore, useUser } from '@/store/authStore';
import { cn, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/student', icon: LayoutDashboard },
  { label: 'My Courses', href: '/dashboard/student/courses', icon: BookOpen },
];

const instructorNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/instructor', icon: LayoutDashboard },
  { label: 'My Courses', href: '/dashboard/instructor/courses', icon: BookOpen },
  { label: 'Create Course', href: '/dashboard/instructor/courses/new', icon: PlusCircle },
  { label: 'Analytics', href: '/dashboard/instructor/analytics', icon: TrendingUp },
];

/* ── Sidebar component (top-level, stable reference) ───────────────────── */
interface SidebarProps {
  navItems: NavItem[];
  pathname: string;
  roleLabel: string;
  userName: string;
  userAvatar?: string;
  onNavClick: () => void;
  onLogout: () => void;
}

function Sidebar({
  navItems,
  pathname,
  roleLabel,
  userName,
  userAvatar,
  onNavClick,
  onLogout,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <BookOpen className="w-7 h-7 text-primary-600 shrink-0" />
        <Link
          href="/"
          className="font-bold text-lg text-gray-900 hover:text-primary-600 transition-colors"
        >
          ADI Boost
        </Link>
      </div>

      {/* User info card */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {getInitials(userName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            <span className="text-xs text-primary-600 font-medium bg-primary-100 px-2 py-0.5 rounded-full">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </p>

        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard/student' &&
              href !== '/dashboard/instructor' &&
              pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}

        {/* Account section */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Account
          </p>
          <Link
            href="/courses"
            onClick={onNavClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            Browse Courses
          </Link>
          <Link
            href={
              roleLabel === 'Instructor'
                ? '/dashboard/instructor/profile'
                : '/dashboard/student/profile'
            }
            onClick={onNavClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
          >
            <User className="w-4 h-4 shrink-0" />
            Profile
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const { logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!user.emailVerified) { router.replace('/verify-email'); return; }
  }, [user, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  if (!user || !user.emailVerified) return null;

  const navItems = user.role === 'INSTRUCTOR' ? instructorNav : studentNav;
  const roleLabel =
    user.role === 'INSTRUCTOR' ? 'Instructor' : user.role === 'ADMIN' ? 'Admin' : 'Student';

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const sidebarProps: SidebarProps = {
    navItems,
    pathname,
    roleLabel,
    userName: user.name,
    userAvatar: user.avatar,
    onNavClick: () => setSidebarOpen(false),
    onLogout: handleLogout,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30 shadow-sm">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center h-14 px-4 sm:px-6 gap-3">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
              <Link href="/" className="hover:text-primary-600 transition-colors shrink-0">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-gray-900 font-medium capitalize truncate">
                {pathname.split('/').filter(Boolean).slice(1).join(' › ')}
              </span>
            </div>

            {/* Right: avatar + logout */}
            <div className="ml-auto flex items-center gap-3">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                  {getInitials(user.name)}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
