'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, Search, Bell, ChevronDown, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuthStore, useUser } from '@/store/authStore';
import { cn, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Header() {
  const user = useUser();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/courses?search=${encodeURIComponent(search)}`);
  };

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'INSTRUCTOR'
      ? '/dashboard/instructor'
      : '/dashboard/student';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-lg text-gray-900 hidden sm:block">LMS Platform</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/courses"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 rounded-md transition-colors"
            >
              Courses
            </Link>

            {!user ? (
              <>
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  Sign up
                </Link>
              </>
            ) : (
              <div className="relative ml-2">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary-200 transition-all"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className={cn(
                        'inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium',
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700'
                        : user.role === 'INSTRUCTOR' ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                      )}>
                        {user.role}
                      </span>
                    </div>
                    <Link
                      href={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Link href="/courses" className="text-sm font-medium text-gray-700 py-2">Courses</Link>
              {!user ? (
                <>
                  <Link href="/login" className="btn-secondary text-center">Log in</Link>
                  <Link href="/register" className="btn-primary text-center">Sign up</Link>
                </>
              ) : (
                <>
                  <Link href={dashboardPath} className="text-sm font-medium text-gray-700 py-2">Dashboard</Link>
                  <button onClick={handleLogout} className="text-sm text-red-600 py-2 text-left">Log out</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
