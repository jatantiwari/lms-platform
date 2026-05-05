'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUser } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { ShieldCheck, Loader2, RefreshCw, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const user = useUser();
  const { fetchMe } = useAuthStore();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect if user is already verified
  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.emailVerified) {
      if (user.role === 'INSTRUCTOR' && !user.instructorApproved) {
        router.replace('/onboarding/instructor');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else if (user.role === 'INSTRUCTOR') {
        router.replace('/dashboard/instructor');
      } else {
        router.replace('/dashboard/student');
      }
    }
  }, [user, router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const code = digits.join('');

  const handleDigitChange = (idx: number, val: string) => {
    // Accept only digits, handle paste
    const sanitized = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = sanitized;
    setDigits(next);
    if (sanitized && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter all 6 digits');
      return;
    }
    setIsVerifying(true);
    try {
      await authApi.verifyEmail(code);
      // Use fetchMe to get a complete, fresh user object — avoids partial state corruption
      const updated = await fetchMe();
      toast.success('Email verified!');
      if (!updated) {
        router.replace('/login');
        return;
      }
      if (updated.role === 'INSTRUCTOR' && !updated.instructorApproved) {
        router.replace('/onboarding/instructor');
      } else if (updated.role === 'ADMIN') {
        router.replace('/admin');
      } else if (updated.role === 'INSTRUCTOR') {
        router.replace('/dashboard/instructor');
      } else {
        router.replace('/dashboard/student');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired code';
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await authApi.resendVerification();
      toast.success('New code sent to your email');
      setResendCooldown(120); // 2 min cooldown
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to resend';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  if (!user || user.emailVerified) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Verify your email
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          We sent a 6-digit code to <strong className="text-gray-700">{user.email}</strong>. Enter it below to continue.
        </p>

        <form onSubmit={handleVerify}>
          {/* OTP Inputs */}
          <div className="flex gap-3 justify-center mb-8">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isVerifying ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-primary-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
            >
              {isResending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
