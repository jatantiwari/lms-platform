'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle2, ArrowRight } from 'lucide-react';

export function MentorIntro() {
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-xl" />
            <div className="relative rounded-2xl overflow-hidden border border-primary/30">
              <Image
                src="/mentor.jpeg"
                alt="Lead Mentor"
                width={600}
                height={500}
                className="w-full h-125 object-contain"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-card border border-primary/30 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">15+</p>
                  <p className="text-xs text-muted-foreground">Years Experience</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
              Meet Your Mentor
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Learn from India's{' '}
              <span className="text-primary">Top Trading Mentor</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              With over 15 years of institutional trading experience, I've trained thousands of traders to achieve consistent profitability. My approach combines technical mastery with psychological discipline.
            </p>
            <ul className="space-y-3">
              {['15+ years trading experience', 'Trained 5000+ successful traders', 'Proprietary institutional strategies', 'Live market analysis daily'].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/about">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
                Know More About Mentor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}