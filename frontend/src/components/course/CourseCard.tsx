import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Clock, BarChart2 } from 'lucide-react';
import { Course } from '@/types';
import { cn, formatPrice, formatDuration, levelLabel, levelColor } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'horizontal';
}

export default function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  const effectivePrice = course.discountPrice ?? course.price;
  const hasDiscount = course.discountPrice != null && course.discountPrice < course.price;

  if (variant === 'horizontal') {
    return (
      <Link href={`/courses/${course.slug}`} className="card flex gap-4 p-4 hover:shadow-md transition-shadow">
        <div className="w-32 h-20 relative rounded-lg overflow-hidden shrink-0 bg-gray-100">
          {course.thumbnail ? (
            <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{course.title}</h3>
          <p className="text-xs text-gray-500 mb-2">{course.instructor.name}</p>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 star-filled" />
            <span className="text-xs font-semibold text-yellow-600">{Number(course.avgRating).toFixed(1)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-gray-900">{formatPrice(effectivePrice)}</p>
          {hasDiscount && (
            <p className="text-xs line-through text-gray-400">{formatPrice(course.price)}</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/courses/${course.slug}`} className="card group hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            {Math.round(((course.price - effectivePrice) / course.price) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', levelColor(course.level))}>
            {levelLabel(course.level)}
          </span>
          {course.category && (
            <span className="text-xs text-gray-500 truncate">{course.category.name}</span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1 flex-1">
          {course.title}
        </h3>

        <p className="text-xs text-gray-500 mb-3">{course.instructor.name}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 star-filled" />
            <span className="font-semibold text-yellow-600">{Number(course.avgRating).toFixed(1)}</span>
            <span>({course.totalReviews})</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.totalStudents.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(course.totalDuration)}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-base text-gray-900">{formatPrice(effectivePrice)}</span>
          {hasDiscount && (
            <span className="text-sm line-through text-gray-400">{formatPrice(course.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
