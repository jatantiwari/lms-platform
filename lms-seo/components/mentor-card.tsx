'use client';

import Image from 'next/image';
import { Star, BadgeCheck } from 'lucide-react';

export interface MentorProfile {
  name: string;
  title: string;
  specialization: string;
  yearsOfExperience: number;
  rating: number;
  reviews: number;
  bio: string;
  image: string;
  credentials: string[];
}

interface MentorCardProps {
  mentor: MentorProfile;
}

export function MentorCard({ mentor }: MentorCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Image Section */}
      <div className="relative h-64 bg-muted">
        <Image
          src={mentor.image}
          alt={mentor.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <BadgeCheck className="w-4 h-4" />
          Verified
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-foreground mb-1">
          {mentor.name}
        </h3>
        <p className="text-primary font-semibold mb-2">{mentor.title}</p>

        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(mentor.rating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {mentor.rating}
          </span>
          <span className="text-sm text-muted-foreground">
            ({mentor.reviews} reviews)
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-4 flex-1">
          {mentor.bio}
        </p>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-semibold text-foreground">
            Specialization: <span className="text-primary">{mentor.specialization}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {mentor.yearsOfExperience} Years of Experience
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Credentials
          </p>
          <div className="flex flex-wrap gap-2">
            {mentor.credentials.map((credential, index) => (
              <span
                key={index}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium"
              >
                {credential}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
