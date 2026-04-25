import { notFound } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CourseEnrollButton from './CourseEnrollButton';
import CoursePreviewPlayer from '@/components/course/CoursePreviewPlayer';
import CourseCurriculum from '@/components/course/CourseCurriculum';
import StarRating from '@/components/review/StarRating';
import { courseApi } from '@/lib/api';
import { Course } from '@/types';
import {
  BookOpen, Clock, Users, Globe, BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { formatPrice, formatDuration, levelLabel, timeAgo } from '@/lib/utils';

interface PageProps {
  params: { slug: string };
}

async function getCourse(slug: string): Promise<Course | null> {
  try {
    const { data } = await courseApi.getBySlug(slug);
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const course = await getCourse(params.slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.shortDesc ?? course.description.slice(0, 160),
    openGraph: { images: course.thumbnail ? [{ url: course.thumbnail }] : [] },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const effectivePrice = course.discountPrice ?? course.price;
  const totalLectures = course.sections?.reduce((sum, s) => sum + s.lectures.length, 0) ?? 0;

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        {/* Course Header (dark banner) */}
        <div className="bg-gray-900 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {course.category && (
                <span className="text-primary-400 text-sm font-medium">{course.category.name}</span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mt-1 mb-3">{course.title}</h1>
              {course.shortDesc && (
                <p className="text-gray-300 text-base mb-4">{course.shortDesc}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <StarRating value={course.avgRating} readonly size="sm" />
                  <span className="text-yellow-400 font-semibold ml-1">
                    {Number(course.avgRating).toFixed(1)}
                  </span>
                  <span>({course.totalReviews.toLocaleString()} reviews)</span>
                </div>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.totalStudents.toLocaleString()} students
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {course.language}
                </span>
              </div>
              <p className="mt-3 text-gray-400 text-sm">
                Created by{' '}
                <span className="text-primary-400 font-medium">{course.instructor.name}</span>
                {' '}&bull; Last updated {timeAgo(course.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* What you'll learn */}
              {course.objectives.length > 0 && (
                <section className="bg-white rounded-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                        {obj}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Requirements */}
              {course.requirements.length > 0 && (
                <section className="bg-white rounded-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Curriculum */}
              {course.sections && course.sections.length > 0 && (
                <CourseCurriculum
                  sections={course.sections}
                  totalLectures={totalLectures}
                  totalDuration={course.totalDuration}
                />
              )}

              {/* About instructor */}
              <section className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About the Instructor</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-100 shrink-0">
                    {course.instructor.avatar ? (
                      <Image
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl">
                        {course.instructor.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{course.instructor.name}</h3>
                    {course.instructor.headline && (
                      <p className="text-sm text-primary-600 mb-2">{course.instructor.headline}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Reviews */}
              {course.reviews && course.reviews.length > 0 && (
                <section className="bg-white rounded-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Student Reviews
                  </h2>
                  <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
                    <div className="text-center">
                      <p className="text-5xl font-extrabold text-yellow-500">
                        {Number(course.avgRating).toFixed(1)}
                      </p>
                      <StarRating value={course.avgRating} readonly />
                      <p className="text-xs text-gray-500 mt-1">Course Rating</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {course.reviews.map((review) => (
                      <div key={review.id} className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
                          {review.user.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">{review.user.name}</span>
                            <StarRating value={review.rating} readonly size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky sidebar purchase card */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <CoursePreviewPlayer
                    previewVideo={course.previewVideo}
                    thumbnail={course.thumbnail}
                    title={course.title}
                  />
                  <div className="p-6">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {formatPrice(effectivePrice)}
                      </span>
                      {course.discountPrice && (
                        <span className="text-lg line-through text-gray-400">
                          {formatPrice(course.price)}
                        </span>
                      )}
                    </div>

                    {/* Enroll button (client component) */}
                    <CourseEnrollButton course={course} />

                    <div className="mt-6 space-y-2 text-sm text-gray-600">
                      {[
                        { icon: BookOpen, label: `${totalLectures} lectures` },
                        { icon: Clock, label: formatDuration(course.totalDuration) },
                        { icon: BarChart2, label: levelLabel(course.level) },
                        { icon: Globe, label: course.language },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
