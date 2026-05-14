'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface AudienceSegment {
  icon: LucideIcon;
  title: string;
  description: string;
  whoItIsFor: string[];
  benefits: string[];
  courseRecommendation: string;
}

interface AudienceSegmentProps {
  segment: AudienceSegment;
}

export function AudienceSegment({ segment }: AudienceSegmentProps) {
  const Icon = segment.icon;

  return (
    <div className="bg-white rounded-lg border border-border p-8 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-primary">
            {segment.title}
          </h3>
          <p className="text-black mt-1">{segment.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold text-primary mb-3">
            Who This Is For
          </h4>
          <ul className="space-y-2">
            {segment.whoItIsFor.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-black">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-primary mb-3">
            Key Benefits
          </h4>
          <ul className="space-y-2">
            {segment.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-black">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link href="/courses">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
          Explore Courses
        </Button>
      </Link>
    </div>
  );
}
