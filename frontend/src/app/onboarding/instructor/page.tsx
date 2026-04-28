'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUser } from '@/store/authStore';
import { instructorApi } from '@/lib/api';
import { InstructorApplication } from '@/types';
import {
  GraduationCap, Loader2, CheckCircle2, XCircle, Clock, BookOpen,
  Plus, X as XIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function InstructorOnboardingPage() {
  const router = useRouter();
  const user = useUser();
  const { fetchMe } = useAuthStore();

  const [application, setApplication] = useState<InstructorApplication | null | undefined>(
    undefined, // undefined = loading
  );
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  const [form, setForm] = useState({
    teachingExperience: '',
    bio: '',
    linkedIn: '',
    website: '',
  });
  const [expertiseInput, setExpertiseInput] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Guards
  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!user.emailVerified) { router.replace('/verify-email'); return; }
    if (user.role !== 'INSTRUCTOR') { router.replace('/dashboard/student'); return; }
    if (user.instructorApproved) { router.replace('/dashboard/instructor'); return; }
  }, [user, router]);

  // Load existing application
  useEffect(() => {
    if (!user || user.role !== 'INSTRUCTOR') return;
    instructorApi
      .getMyApplication()
      .then(({ data }) => setApplication(data.data ?? null))
      .catch(() => setApplication(null))
      .finally(() => setIsLoadingApp(false));
  }, [user]);

  const addExpertise = () => {
    const tag = expertiseInput.trim();
    if (!tag) return;
    if (expertise.includes(tag)) return;
    setExpertise((prev) => [...prev, tag]);
    setExpertiseInput('');
  };

  const removeExpertise = (tag: string) => {
    setExpertise((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (expertise.length === 0) {
      setFormError('Add at least one area of expertise');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await instructorApi.apply({
        ...form,
        expertise,
        linkedIn: form.linkedIn || undefined,
        website: form.website || undefined,
      });
      setApplication(data.data);
      toast.success('Application submitted! We\'ll review it shortly.');
      // Refresh user so instructorApproved reflects any future state
      await fetchMe();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit application';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'INSTRUCTOR') return null;

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  /* ── Status views ────────────────────────────────────────────────────────── */
  if (application?.status === 'PENDING') {
    return <StatusCard status="PENDING" />;
  }
  if (application?.status === 'APPROVED') {
    return <StatusCard status="APPROVED" />;
  }

  /* ── Application form (new or re-apply after rejection) ─────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Instructor Application</h1>
            <p className="text-sm text-gray-500">Tell us about yourself so we can verify your account</p>
          </div>
        </div>

        {/* Rejection notice */}
        {application?.status === 'REJECTED' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">Previous application rejected</p>
                {application.rejectionReason && (
                  <p className="text-sm text-red-700">{application.rejectionReason}</p>
                )}
                <p className="text-xs text-red-600 mt-1">Please address the feedback above and resubmit.</p>
              </div>
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Teaching experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teaching / Professional Experience <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.teachingExperience}
              onChange={(e) => setForm((p) => ({ ...p, teachingExperience: e.target.value }))}
              rows={4}
              required
              minLength={20}
              placeholder="Describe your teaching background, professional experience, and why you want to teach on ADI Boost…"
              className="input-field resize-none"
            />
          </div>

          {/* Expertise tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas of Expertise <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExpertise(); } }}
                placeholder="e.g. React, Machine Learning, UX Design"
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={addExpertise}
                className="px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {expertise.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeExpertise(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              required
              minLength={50}
              placeholder="This will appear on your instructor profile…"
              className="input-field resize-none"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
            <input
              type="url"
              value={form.linkedIn}
              onChange={(e) => setForm((p) => ({ ...p, linkedIn: e.target.value }))}
              placeholder="https://linkedin.com/in/yourprofile"
              className="input-field"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            {application?.status === 'REJECTED' ? 'Resubmit Application' : 'Submit Application'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          You can also{' '}
          <Link href="/dashboard/instructor" className="text-primary-600 hover:underline">
            go to your dashboard
          </Link>{' '}
          and submit the application later.
        </p>
      </div>
    </div>
  );
}

/* ── Status Card component ───────────────────────────────────────────────────── */
function StatusCard({ status }: { status: 'PENDING' | 'APPROVED' }) {
  if (status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your instructor application has been submitted and is being reviewed by our team. We&apos;ll notify you by email once a decision is made.
          </p>
          <Link href="/dashboard/instructor" className="btn-primary inline-flex items-center gap-2">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;re Approved!</h1>
        <p className="text-sm text-gray-500 mb-6">Your instructor account is active. Start creating your courses now.</p>
        <Link href="/dashboard/instructor" className="btn-primary inline-flex items-center gap-2">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
