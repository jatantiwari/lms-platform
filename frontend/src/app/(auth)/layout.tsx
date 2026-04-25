import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary-600" />
          <span className="text-2xl font-extrabold text-primary-700">LMS Platform</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
