'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Star, Award, ArrowRight } from 'lucide-react';
import { HeroCarousel } from '../hero-carousel';

const heroSlides = [
  {
    id: 1,
    image: '/stock-market-trader.png',
    alt: 'Stock Trading Hero',
    badge: '📈 Master the Markets',
    title: 'Stock Obsessed Trading',
    subtitle: 'Learn professional strategies to dominate Nifty, Bank Nifty, and stock markets.',
  },
  {
    id: 2,
    image: '/c5.png',
    alt: 'Index Trading Hero',
    badge: '🎯 Index Trading',
    title: 'Trade Nifty Like a Pro',
    subtitle: 'Master index trading with institutional-grade analysis and proven setups.',
  },
  {
    id: 4,
    image: '/3d-rendering-financial-neon-bull.jpg',
    alt: 'bull-market-trading-hero',
    badge: '🐂 Ride the Bull',
    title: 'Conquer the Bull Market',
    subtitle: 'Learn aggressive strategies to maximize gains in rising markets.',
  },
];

export function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0 z-0">
        <HeroCarousel slides={heroSlides} hideSlideText titleTag="h1" />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-20 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-20 sm:pb-28 pt-32 md:pt-0">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm mt-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary tracking-wide">
                India's No. 1 Trading Mentorship
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-xl">
              Stock{' '}
              <span className="text-primary">Obsessed</span>
              <br />
              Trading Mentorship
            </h1>
            <p className="text-base md:text-xl text-white/80 leading-relaxed max-w-lg">
              Master Nifty, Bank Nifty, and stock trading with institutional-grade strategies. Join 5000+ successful traders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/courses">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto shadow-lg shadow-primary/30 cursor-pointer">
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto cursor-pointer">
                  Get Free Consultation
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">5K+</p>
                  <p className="text-xs text-white/60">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">98%</p>
                  <p className="text-xs text-white/60">Success Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">15+</p>
                  <p className="text-xs text-white/60">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}