import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CurriculumTabs } from '@/components/curriculum-tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Curriculum - Financial Freedom Mentor | Trading Education',
  description: 'Module-by-module curriculum for Commodity Trading and Stock Trading mentorship — MCX, NSE, Gold, Silver, Crude Oil, Equity, F&O and more.',
};

export default function CurriculumPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary tracking-wide">
                  Complete Learning Roadmap
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                Detailed <span className="text-primary">Curriculum</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Module-by-module breakdown for Commodity Trading and Stock Trading — Basic, Pro, and Elite plans.
              </p>
            </div>
          </div>
        </section>

        {/* Curriculum Sections */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <CurriculumTabs />

            {/* What's Included */}
            <div className="mt-20 p-8 rounded-2xl bg-card border border-border relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <h3 className="text-2xl font-extrabold text-foreground mb-6">
                Included in All Plans
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Community access',
                  'Comprehensive study materials',
                  'Live doubt-clearing sessions',
                  'Recorded classes for self-paced revision',
                  'Certificate upon completion',
                  'Personal mentorship (Elite plan)',
                  'Lifetime access + updates (Elite plan)',
                  'Trade journaling system',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </span>
                    <span className="text-muted-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
