import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CourseCard from '@/components/course/CourseCard';
import { courseApi } from '@/lib/api';
import { Course } from '@/types';
import { ArrowRight, BookOpen, Users, Award, Play } from 'lucide-react';

async function getFeaturedCourses(): Promise<Course[]> {
  try {
    const { data } = await courseApi.getAll({ limit: 8, sortBy: 'popular' });
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const courses = await getFeaturedCourses();

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Learn Without
                <span className="block text-yellow-300">Limits</span>
              </h1>
              <p className="text-lg text-primary-100 mb-8 leading-relaxed">
                Start, switch, or advance your career with thousands of courses
                from expert instructors. Learn at your own pace, anytime, anywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors text-base"
                >
                  Explore Courses <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/register?role=INSTRUCTOR"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base"
                >
                  Start Teaching
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 mt-10 text-sm text-primary-100">
                {[
                  { icon: BookOpen, label: '10,000+ Courses' },
                  { icon: Users, label: '500K+ Students' },
                  { icon: Award, label: 'Expert Instructors' },
                  { icon: Play, label: 'HD Video Content' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Popular Courses */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Most Popular Courses</h2>
              <p className="text-gray-500 mt-1">Join millions of learners around the world</p>
            </div>
            <Link href="/courses" className="btn-outline hidden sm:flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="sm:hidden mt-6 text-center">
            <Link href="/courses" className="btn-outline">View All Courses</Link>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '500K+', label: 'Active Students' },
                { value: '10K+', label: 'Online Courses' },
                { value: '2K+', label: 'Expert Instructors' },
                { value: '95%', label: 'Satisfaction Rate' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-1">{value}</p>
                  <p className="text-gray-600 text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary-600 text-white py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-primary-100 mb-8 text-lg">
              Join over 500,000 students already learning on ADI Boost.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-10 py-4 rounded-xl hover:bg-primary-50 transition-colors text-base"
            >
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
