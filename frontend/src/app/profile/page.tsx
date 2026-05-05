'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/store/authStore';

export default function ProfileRedirectPage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'INSTRUCTOR') {
      router.replace('/dashboard/instructor/profile');
    } else if (user.role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/dashboard/student/profile');
    }
  }, [user, router]);

  return null;
}
