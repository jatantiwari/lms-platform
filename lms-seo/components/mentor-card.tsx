'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';

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
    <div className="mx-auto w-full max-w-sm">
      {/* 9:16 portrait card */}
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-border">

        {/* ── Full-bleed background image ── */}
        <Image
          src={mentor.image}
          alt={mentor.name}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 384px"
          priority
        />

        {/* ── Gradient overlays ── */}
        {/* Top fade for readability of any top badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        {/* Strong bottom-up gradient for content area */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

        {/* ── Content pinned to bottom ── */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-5 pb-6 pt-24">

          {/* Name & title */}
          <div>
            <h3 className="text-2xl font-extrabold text-white leading-tight">
              {mentor.name}
            </h3>
            <p className="text-sm font-medium text-primary mt-1 leading-snug">
              {mentor.title}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(mentor.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-white/30'
                  }`}
                />
              ))}
              <span className="text-xs font-semibold text-white ml-1">{mentor.rating}</span>
              <span className="text-xs text-white/60 ml-0.5">({mentor.reviews})</span>
            </div>
            <span className="text-white/30 text-xs">•</span>
            <span className="text-xs font-semibold text-white/80">
              {mentor.yearsOfExperience}+ yrs experience
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 w-full" />

          {/* Bio — limited to 3 lines */}
          <p className="text-xs text-white/75 leading-relaxed line-clamp-3">
            {mentor.bio.split('\n\n')[0]}
          </p>

          {/* Specialization */}
          <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
            <span className="text-primary font-semibold">Specializes in: </span>
            {mentor.specialization}
          </p>

          {/* Credentials */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {mentor.credentials.map((credential, index) => (
              <span
                key={index}
                className="text-[10px] bg-white/10 border border-white/20 text-white px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
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
