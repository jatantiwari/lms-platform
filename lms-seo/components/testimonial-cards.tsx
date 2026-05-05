'use client';

import { Star } from 'lucide-react';

interface TestimonialProps {
  name: string;
  role: string;
  image: string;
  content: string;
  rating: number;
  result: string;
}

export function TestimonialCard({ name, role, image, content, rating, result }: TestimonialProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-primary text-primary' : 'text-border'}`}
          />
        ))}
      </div>

      {/* Content */}
      <p className="text-foreground leading-relaxed mb-4 italic">
        "{content}"
      </p>

      {/* Result */}
      <p className="text-primary font-semibold mb-6 text-sm">
        {result}
      </p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialGrid({ testimonials }: { testimonials: TestimonialProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {testimonials.map((testimonial, index) => (
        <TestimonialCard key={index} {...testimonial} />
      ))}
    </div>
  );
}
