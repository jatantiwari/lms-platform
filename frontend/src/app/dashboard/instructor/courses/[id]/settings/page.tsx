'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { courseApi } from '@/lib/api';
import { Course } from '@/types';
import {
  ArrowLeft, ImagePlus, Upload, Loader2,
  Smartphone, Check, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(5, 'Min 5 characters').max(200),
  shortDesc: z.string().max(300).optional(),
  description: z.string().min(20, 'Min 20 characters'),
  price: z.coerce.number().min(0, 'Cannot be negative'),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  language: z.string().min(1, 'Required'),
  categoryId: z.string().optional(),
  mobileOnly: z.boolean().optional().default(false),
});

type FormData = z.infer<typeof schema>;

export default function CourseSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { level: 'BEGINNER', language: 'English', price: 0, mobileOnly: false },
  });

  const mobileOnly = watch('mobileOnly');

  const loadCourse = async () => {
    try {
      const { data } = await courseApi.getById(id);
      const c: Course = data.data;
      setCourse(c);
      reset({
        title: c.title,
        shortDesc: c.shortDesc ?? '',
        description: c.description,
        price: c.price,
        discountPrice: c.discountPrice ?? undefined,
        level: c.level,
        language: c.language,
        categoryId: c.category?.id ?? '',
        mobileOnly: c.mobileOnly,
      });
    } catch {
      toast.error('Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCourse(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    try {
      await courseApi.uploadThumbnail(id, file);
      const { data } = await courseApi.getById(id);
      setCourse(data.data);
      toast.success('Thumbnail updated!');
    } catch {
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await courseApi.publish(id);
      await loadCourse();
      toast.success('Course published!');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to publish',
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await courseApi.update(id, {
        ...data,
        discountPrice: data.discountPrice ?? null,
        categoryId: data.categoryId || undefined,
      });
      await loadCourse();
      toast.success('Course details saved!');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to save changes',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button
          onClick={() => router.push('/dashboard/instructor/courses')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> My Courses
        </button>
        <span className="text-gray-300">/</span>
        <Link
          href={`/dashboard/instructor/courses/${id}/curriculum`}
          className="text-primary-600 hover:underline flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4" /> Curriculum
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Settings</h1>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.title}</p>
        </div>
        {course.status !== 'PUBLISHED' && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Publish Course
          </button>
        )}
        {course.status === 'PUBLISHED' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700">
            <Check className="w-3.5 h-3.5" /> Published
          </span>
        )}
      </div>

      {/* ── Thumbnail ─────────────────────────────────── */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-primary-500" />
          Course Thumbnail
        </h2>
        <div className="flex items-start gap-5">
          {/* Preview */}
          <div className="shrink-0">
            {course.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail}
                alt="Course thumbnail"
                className="w-48 h-28 object-cover rounded-xl border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-48 h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs">No thumbnail yet</span>
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex flex-col gap-2">
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailUpload(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={uploadingThumbnail}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {uploadingThumbnail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadingThumbnail
                ? 'Uploading…'
                : course.thumbnail
                ? 'Change Thumbnail'
                : 'Upload Thumbnail'}
            </button>
            <p className="text-xs text-gray-400 leading-relaxed">
              Recommended: <strong>1280×720 px</strong><br />
              Formats: JPG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* ── Course Details Form ───────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 -mb-1">
          Course Details
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Title *
          </label>
          <input {...register('title')} className="input-field" />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Description
          </label>
          <input
            {...register('shortDesc')}
            className="input-field"
            placeholder="One-line summary shown on course cards"
          />
          {errors.shortDesc && <p className="mt-1 text-xs text-red-600">{errors.shortDesc.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Description *
          </label>
          <textarea
            {...register('description')}
            rows={5}
            className="input-field resize-none"
            placeholder="Describe what students will learn…"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
            <input
              {...register('price')}
              type="number"
              min={0}
              step={1}
              className="input-field"
              placeholder="0 for free"
            />
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
            <input
              {...register('discountPrice')}
              type="number"
              min={0}
              step={1}
              className="input-field"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
            <select {...register('level')} className="input-field">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="ALL_LEVELS">All Levels</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
            <input {...register('language')} className="input-field" />
            {errors.language && <p className="mt-1 text-xs text-red-600">{errors.language.message}</p>}
          </div>
        </div>

        {/* Mobile-only toggle */}
        <button
          type="button"
          onClick={() => setValue('mobileOnly', !mobileOnly, { shouldDirty: true })}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors',
            mobileOnly
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300',
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            mobileOnly ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500',
          )}>
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold', mobileOnly ? 'text-primary-700' : 'text-gray-700')}>
              Mobile Device Only
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {mobileOnly
                ? 'Only students on mobile devices can access this course'
                : 'This course is accessible on all devices'}
            </p>
          </div>
          <div className={cn(
            'w-5 h-5 rounded-full border-2 shrink-0 transition-colors',
            mobileOnly ? 'border-primary-500 bg-primary-500' : 'border-gray-300',
          )}>
            {mobileOnly && (
              <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
