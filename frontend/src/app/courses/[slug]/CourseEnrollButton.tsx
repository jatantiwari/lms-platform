'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/types';
import { useUser } from '@/store/authStore';
import { paymentApi, enrollmentApi } from '@/lib/api';
import { formatPrice, getErrorMessage } from '@/lib/utils';
import { ShoppingCart, Lock, CreditCard, X, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  course: Course;
}

export default function CourseEnrollButton({ course }: Props) {
  const user = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<{ orderId: string; amount: number; courseName: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(course.isEnrolled ?? false);

  // Re-check enrollment client-side (server render has no auth token)
  useEffect(() => {
    if (!user) return;
    enrollmentApi.check(course.id)
      .then(({ data }) => setIsEnrolled(data.data?.isEnrolled ?? false))
      .catch(() => {});
  }, [user, course.id]);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${course.slug}`);
      return;
    }
    if (isEnrolled) {
      router.push(`/courses/${course.slug}/learn`);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await paymentApi.createOrder(course.id);
      // Free course: backend directly enrolls and returns enrolled:true
      if (data.data.enrolled) {
        toast.success('Enrolled successfully!');
        setIsEnrolled(true);
        router.push(`/courses/${course.slug}/learn`);
        return;
      }
      // Paid course: show dummy payment confirmation modal
      setModal({
        orderId: data.data.orderId,
        amount: data.data.amount,
        courseName: data.data.courseName,
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!modal) return;
    setConfirming(true);
    try {
      await paymentApi.verify({ orderId: modal.orderId });
      toast.success('Payment confirmed! You are now enrolled.');
      setModal(null);
      setIsEnrolled(true);
      router.push(`/courses/${course.slug}/learn`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      {isEnrolled ? (
        <button
          onClick={() => router.push(`/courses/${course.slug}/learn`)}
          className="w-full flex items-center justify-center gap-2 py-3 text-base font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
        >
          <PlayCircle className="w-5 h-5" />
          Start Learning
        </button>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          {isLoading ? (
            <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {user ? <ShoppingCart className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              {!user
                ? 'Sign in to Enroll'
                : Number(course.discountPrice ?? course.price) === 0
                ? 'Enroll for Free'
                : `Enroll for ${formatPrice(Number(course.discountPrice ?? course.price))}`}
            </>
          )}
        </button>
      )}

      {/* Dummy payment confirmation modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Confirm Payment</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Course</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%]">{modal.courseName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(modal.amount / 100)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Mode</span>
                <span className="text-amber-600 font-medium">Test / Demo</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4 text-center">
              This is a demo payment. No real money will be charged.
            </p>

            <button
              onClick={handleConfirmPayment}
              disabled={confirming}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {confirming ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay &amp; Enroll
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
