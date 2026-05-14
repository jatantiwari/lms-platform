'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Users, Star, Award } from 'lucide-react';
import { HeroCarousel } from '@/components/hero-carousel';

export function HeroSection() {

const heroSlides = [
  {
    id: 1,
    image: 'c1.png',
    alt: 'Course Overview',
    badge: '🚀 Start Your Journey',
    title: 'Learn, Invest, Grow',
    subtitle: 'Master stock market trading with India\'s top mentors and proven strategies.',
  },
  {
    id: 2,
    image: 'c2.png',
    alt: 'Expert Mentors',
    badge: '👨‍🏫 World-Class Faculty',
    title: '50+ Expert Mentors',
    subtitle: 'Learn directly from professionals with decades of real market experience.',
  },
  {
    id: 3,
    image: 'c3.png',
    alt: 'Student Success',
    badge: '🏆 Proven Results',
    title: '5000+ Successful Students',
    subtitle: 'Join a thriving community of traders who have transformed their financial lives.',
  },
  {
    id: 4,
    image: 'c4.png',
    alt: 'Market Mastery',
    badge: '📈 Advanced Strategies',
    title: 'Ride the Bull, Rule the Bear',
    subtitle: 'Gain the edge to profit in any market condition with our battle-tested playbooks.',
  },
  {
    id: 5,
    image: 'c5.png',
    alt: 'Financial Freedom',
    badge: '💰 Your Future Awaits',
    title: 'Achieve Financial Freedom',
    subtitle: 'Build sustainable wealth and take control of your financial destiny today.',
  },
];
  return (
    <section className="relative w-full min-h-screen flex items-end overflow-hidden">
      {/* Full-width background carousel */}
      <div className="absolute inset-0 z-0">
         <HeroCarousel slides={heroSlides} hideSlideText titleTag="h1" />
      </div>

      {/* Strong left-side vignette so text pops */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none" />
      {/* Bottom vignette to separate from next section */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Hero content overlay */}
      <div className="relative z-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-20 sm:pb-28 pt-32 md:pt-0">
          <div className="max-w-2xl space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm mt-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary tracking-wide">
                Ride the Bull, Rule the Bear
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-xl">
              Commodity{' '}
              <span className="text-primary">Trading</span>
              <br />
              Mentorship Program
            </h1>

            <p className="text-base md:text-xl text-white/80 leading-relaxed max-w-lg">
              Master Nifty, Bank Nifty, Sensex, Gold, Crude Oil, and Global Commodities Like a Professional
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow cursor-pointer"
                >
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto cursor-pointer"
                >
                  Get Free Consultation
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">5K+</p>
                  <p className="text-xs text-white/60 mt-0.5">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">98%</p>
                  <p className="text-xs text-white/60 mt-0.5">Success Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">15+</p>
                  <p className="text-xs text-white/60 mt-0.5">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
