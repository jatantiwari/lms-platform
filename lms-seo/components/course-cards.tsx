'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  price: number;
  rating: number;
  students: number;
  duration: string;
  featured?: boolean;
}

export function CourseCard({
  title,
  level,
  description,
  price,
  rating,
  students,
  duration,
  featured = false,
}: CourseCardProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
        featured
          ? 'border-2 border-primary shadow-2xl shadow-primary/20 scale-105'
          : 'border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
      }`}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
          Popular
        </div>
      )}

      <div className={`p-8 ${featured ? 'bg-gradient-to-br from-card to-background' : 'bg-card'}`}>
        {/* Level Badge */}
        <div className="inline-block">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full mb-4 block ${
              level === 'Beginner'
                ? 'bg-primary/10 text-primary'
                : level === 'Intermediate'
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-destructive/10 text-destructive'
            }`}
          >
            {level}
          </span>
        </div>

        {/* Course Title */}
        <h3 className="text-2xl font-bold text-foreground mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground leading-relaxed mb-6">
          {description}
        </p>

        {/* Meta Info */}
        <div className="space-y-3 mb-6 py-6 border-y border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>{students}+ students</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span>{rating} rating</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold text-primary mb-1">
              ${price}
            </p>
            <p className="text-xs text-muted-foreground">One-time payment</p>
          </div>
          <Link href="/contact">
            <Button className={featured ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}>
              Enroll Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CourseGrid({ courses }: { courses: CourseCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((course, index) => (
        <CourseCard
          key={index}
          {...course}
          featured={index === 1}
        />
      ))}
    </div>
  );
}
