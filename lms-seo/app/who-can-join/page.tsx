'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AudienceSegment } from '@/components/audience-segment';
import { Briefcase, BookOpen, TrendingUp, Lightbulb, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WhoCanJoinPage() {
  const segments = [
    {
      icon: BookOpen,
      title: 'College Students & Fresh Graduates',
      description: 'Start your commodity trading journey early',
      whoItIsFor: [
        'B.Tech, MBA, Commerce & finance students',
        'Fresh graduates entering the job market',
        'Students looking to build wealth from scratch',
        'Young professionals with part-time trading interest',
      ],
      benefits: [
        'Learn MCX commodity trading from zero',
        'Start trading Gold & Silver with small capital',
        'Build long-term wealth habits early',
        'Network with a thriving trader community',
      ],
      courseRecommendation: 'Basic Plan (1 month) — ₹10,000',
    },
    {
      icon: Briefcase,
      title: 'Working Professionals',
      description: 'Build a second income alongside your day job',
      whoItIsFor: [
        'Software engineers, doctors, lawyers',
        'Corporate employees with stable income',
        'Professionals looking to diversify income',
        'Busy individuals needing flexible learning',
      ],
      benefits: [
        'Recorded classes — learn at your own pace',
        'Part-time commodity trading alongside your job',
        'Proven MCX strategies for busy professionals',
        'Build an alternate income source within months',
      ],
      courseRecommendation: 'Pro Plan (3 months) — ₹25,000',
    },
    {
      icon: TrendingUp,
      title: 'Entrepreneurs & Business Owners',
      description: 'Diversify income and grow your wealth',
      whoItIsFor: [
        'Business owners with surplus capital',
        'Entrepreneurs seeking passive income',
        'Self-employed professionals',
        'Those wanting portfolio diversification via commodities',
      ],
      benefits: [
        'Hedge business risk through commodity markets',
        'Create multiple income streams via MCX',
        'Learn institutional-level commodity strategies',
        'Build systematic wealth management skills',
      ],
      courseRecommendation: 'Elite Plan (6 months) — ₹50,000',
    },
    {
      icon: Lightbulb,
      title: 'Career Changers',
      description: 'Transition to professional commodity trading',
      whoItIsFor: [
        'People seeking a career change',
        'Those wanting full-time commodity trading',
        'Professionals with capital ready to deploy',
        'Those tired of the corporate grind',
      ],
      benefits: [
        'Comprehensive commodity trading education',
        'Build professional MCX trading skills',
        'Personal mentorship to fast-track growth',
        'Clear path to full-time trading career',
      ],
      courseRecommendation: 'Elite Plan (6 months) — ₹50,000',
    },
    {
      icon: Users,
      title: 'Retirees & Investors',
      description: 'Generate income from your retirement corpus',
      whoItIsFor: [
        'Retirees looking for monthly income',
        'Investors wanting to learn commodity trading',
        'Those with savings ready to invest',
        'Experienced investors adding a new skill',
      ],
      benefits: [
        'Generate regular income from Gold & Crude Oil',
        'Learn low-risk commodity swing strategies',
        'Expert guidance every step of the way',
        'Community of like-minded mature traders',
      ],
      courseRecommendation: 'Pro or Elite Plan — flexible pace',
    },
  ];

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="py-20 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary tracking-wide">For Everyone</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                Who Can <span className="text-primary">Join?</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Our commodity trading mentorship is designed for everyone — whether you're a student, professional, entrepreneur, or retiree. Find your perfect plan.
              </p>
            </div>
          </div>
        </section>

        {/* Audience Segments */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="space-y-8">
              {segments.map((segment, index) => (
                <AudienceSegment key={index} segment={segment} />
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-extrabold text-foreground mb-12 text-center">
                What You Need to <span className="text-primary">Get Started</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Minimum Requirements',
                    items: [
                      '18+ years old (or with parental consent)',
                      'Computer or smartphone with internet',
                      'Demat + MCX trading account (we help you open one)',
                      'Willingness to learn and practice daily',
                      'Commitment to attend live doubt sessions',
                    ],
                  },
                  {
                    title: 'Prior Knowledge Needed',
                    items: [
                      'NO prior commodity market experience needed',
                      'NO financial background required',
                      'Basic maths understanding is helpful',
                      'English reading/listening proficiency',
                      'We teach everything from scratch',
                    ],
                  },
                ].map(({ title, items }) => (
                  <div key={title} className="p-8 rounded-2xl bg-background border border-border">
                    <h3 className="text-xl font-bold text-foreground mb-5">{title}</h3>
                    <ul className="space-y-3">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-primary text-sm">
                          <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                            <Check className="w-3 h-3 text-secondary" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Course Selection Guide */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-foreground mb-12 text-center">
              How to Choose Your <span className="text-primary">Plan</span>
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              {[
                {
                  step: '1',
                  title: 'Assess Your Starting Point',
                  desc: 'No commodity trading experience? Start with Basic. Some experience? Go Pro. Want full mastery with mentorship? Choose Elite.',
                },
                {
                  step: '2',
                  title: 'Check Available Time',
                  desc: 'All plans include recorded sessions so you can learn at your own pace. Live sessions are regular and highly recommended.',
                },
                {
                  step: '3',
                  title: 'Consider Your Goals',
                  desc: 'Learning to trade part-time? Basic or Pro. Want daily live trading, personal mentorship and psychology coaching? Invest in Elite.',
                },
                {
                  step: '4',
                  title: 'Talk to Our Team',
                  desc: "Unsure? Book a free consultation. Our advisors will recommend the perfect plan based on your goals and experience level.",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-6 items-start">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg">
                    {step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-card border-t border-border">
          <div className="container mx-auto px-4 text-center space-y-6">
            <h2 className="text-4xl font-extrabold text-foreground">
              Ready to Start Your <span className="text-primary">Journey?</span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of successful commodity traders. Start at any level — our mentors will guide you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-lg shadow-primary/25">
                  View All Plans
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 px-8">
                  Free Consultation
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
