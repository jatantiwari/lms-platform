import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CurriculumDetail } from '@/components/curriculum-detail';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Curriculum - Financial Freedom Mentor | Commodity Trading Education',
  description: 'Module-by-module curriculum for our commodity trading mentorship — MCX, Gold, Silver, Crude Oil, Natural Gas and global commodities.',
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
                Module-by-module breakdown across all three plans — from commodity basics to live execution and personal mentorship.
              </p>
            </div>
          </div>
        </section>

        {/* Curriculum Sections */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-16">

              {/* Basic Plan */}
              <div>
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-foreground">Basic Plan</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                      Foundations of commodity trading — MCX structure, price action, and your first intraday strategies.
                    </p>
                  </div>
                  <div className="md:text-right shrink-0">
                    <div className="text-3xl font-extrabold text-primary">₹10,000</div>
                    <div className="text-sm text-muted-foreground">1 Month</div>
                    <Link href="/courses" className="mt-3 inline-block">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Enroll Now
                      </Button>
                    </Link>
                  </div>
                </div>
                <CurriculumDetail courseType="beginner" />
              </div>

              <div className="h-px bg-border" />

              {/* Pro Plan */}
              <div>
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-foreground">
                      Pro Plan{' '}
                      <span className="ml-2 text-sm font-bold tracking-wider uppercase text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full align-middle">
                        Most Popular
                      </span>
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                      Full strategy system with regular live trading sessions, advanced price action, and doubt-solving support.
                    </p>
                  </div>
                  <div className="md:text-right shrink-0">
                    <div className="text-3xl font-extrabold text-primary">₹25,000</div>
                    <div className="text-sm text-muted-foreground">3 Months</div>
                    <Link href="/courses" className="mt-3 inline-block">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Enroll Now
                      </Button>
                    </Link>
                  </div>
                </div>
                <CurriculumDetail courseType="intermediate" />
              </div>

              <div className="h-px bg-border" />

              {/* Elite Plan */}
              <div>
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-foreground">Elite Plan</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                      Complete mastery from beginner to advanced — daily live trading, personal mentorship, psychology coaching, and lifetime access.
                    </p>
                  </div>
                  <div className="md:text-right shrink-0">
                    <div className="text-3xl font-extrabold text-primary">₹50,000</div>
                    <div className="text-sm text-muted-foreground">6 Months</div>
                    <Link href="/courses" className="mt-3 inline-block">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Enroll Now
                      </Button>
                    </Link>
                  </div>
                </div>
                <CurriculumDetail courseType="advanced" />
              </div>
            </div>

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
