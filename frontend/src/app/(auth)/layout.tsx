'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // If email not verified, send to verification page
      if (!user.emailVerified) {
        router.replace('/verify-email');
        return;
      }
      if (user.role === 'ADMIN') router.replace('/admin');
      else if (user.role === 'INSTRUCTOR') router.replace('/dashboard/instructor');
      else router.replace('/dashboard/student');
    }
  }, [user, router]);

  // Don't render auth pages while redirect is pending
  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary-600" />
          <span className="text-2xl font-extrabold text-primary-700">ADI Boost</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
