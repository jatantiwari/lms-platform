'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { courseApi } from '@/lib/api';
import { Category } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(5, 'Min 5 characters').max(200),
  description: z.string().min(20, 'Min 20 characters'),
  price: z.coerce.number().min(0, 'Cannot be negative'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  language: z.string().min(1, 'Required'),
  categoryId: z.string().min(1, 'Select a category'),
  shortDesc: z.string().max(300).optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    courseApi.getAll({ limit: 100 }).then(({ data }) => {
      // Fetch categories separately if available; else extract from courses
    }).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { level: 'BEGINNER', language: 'English', price: 0 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { data: res } = await courseApi.create({
        ...data,
        tags: [],
        requirements: [],
        objectives: [],
      });
      toast.success('Course created!');
      router.push(`/dashboard/instructor/courses/${res.data.id}/curriculum`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create course';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Course</h1>
      <p className="text-gray-500 text-sm mb-8">Fill in the details below to set up your course.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
          <input {...register('title')} className="input-field" placeholder="e.g. Complete Web Development Bootcamp" />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <input {...register('shortDesc')} className="input-field" placeholder="One-line summary (shown in cards)" />
          {errors.shortDesc && <p className="mt-1 text-xs text-red-600">{errors.shortDesc.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
          <textarea
            {...register('description')}
            rows={4}
            className="input-field resize-none"
            placeholder="Describe what students will learn..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
            <input {...register('price')} type="number" min={0} step={1} className="input-field" placeholder="0 for free" />
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
            <input {...register('language')} className="input-field" placeholder="English" />
            {errors.language && <p className="mt-1 text-xs text-red-600">{errors.language.message}</p>}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <input {...register('categoryId')} className="input-field" placeholder="Category ID" />
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Create Course & Add Curriculum
        </button>
      </form>
    </div>
  );
}
