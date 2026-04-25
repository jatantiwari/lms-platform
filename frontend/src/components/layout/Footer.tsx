import Link from 'next/link';
import { BookOpen, Twitter, Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white mb-4">
              <BookOpen className="w-6 h-6 text-primary-400" />
              <span className="font-bold text-lg">LMS Platform</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Empowering learners worldwide with quality online education.
            </p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-white font-semibold mb-4">Learn</h3>
            <ul className="space-y-2 text-sm">
              {['All Courses', 'Web Development', 'Data Science', 'Mobile Development', 'Cloud & DevOps'].map((item) => (
                <li key={item}>
                  <Link href="/courses" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Teach */}
          <div>
            <h3 className="text-white font-semibold mb-4">Teach</h3>
            <ul className="space-y-2 text-sm">
              {['Become an Instructor', 'Instructor Hub', 'Course Guidelines', 'Earnings'].map((item) => (
                <li key={item}>
                  <Link href="/register?role=INSTRUCTOR" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {['About Us', 'Careers', 'Blog', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} LMS Platform. All rights reserved.</p>
          <p>Built with Next.js, TypeScript & ❤️</p>
        </div>
      </div>
    </footer>
  );
}
