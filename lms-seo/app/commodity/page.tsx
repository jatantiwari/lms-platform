import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeatureCards } from '@/components/feature-cards';
import { CourseShowcase } from '@/components/course-showcase';
import { StatsSection } from '@/components/stats-section';
import { CTASection } from '@/components/cta-section';
import { ProgramOverview } from '@/components/program-overview';
import { CurriculumBreakdown } from '@/components/curriculum-breakdown';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, TrendingUp, Target, Brain, BarChart3, Shield, Briefcase, Sprout } from 'lucide-react';

export default function CommodityPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProgramOverview />
        <CurriculumBreakdown />
        <FeatureCards />
        <CourseShowcase />
        
        {/* Stats Section */}
        <StatsSection />

        {/* Your Transformation Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
                Your Transformation
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                From Beginner to{' '}
                <span className="text-primary">Professional Trader</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                By the end of this program, you will have the skills and confidence to trade independently.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: TrendingUp,
                  title: 'Market Mastery',
                  description: 'Understand how commodity markets move and react to global events',
                },
                {
                  icon: Target,
                  title: 'Trade with Confidence',
                  description: 'Trade Gold & Crude Oil with precision and conviction',
                },
                {
                  icon: Brain,
                  title: 'Consistent System',
                  description: 'Build a repeatable trading system that works for you',
                },
                {
                  icon: Shield,
                  title: 'Professional Risk',
                  description: 'Manage risk like a professional and protect your capital',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/25 transition-colors">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Positioning Line */}
            <div className="mt-12 text-center">
              <blockquote className="text-lg md:text-xl italic text-muted-foreground border-l-4 border-primary pl-6 max-w-2xl mx-auto">
                "Don't just trade randomly — learn how professionals trade commodities and build consistent income streams."
              </blockquote>
            </div>
          </div>
        </section>

        {/* Who Can Join Section */}
<section className="py-20 bg-card border-y border-border">
  <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-6">
        Who Is This{' '}
        <span className="text-primary">For?</span>
      </h2>
      <p className="text-base md:text-lg text-muted-foreground mb-12">
        Financial Freedom Mentor is designed for anyone serious about mastering commodity trading.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[
          { icon: Sprout, title: 'Beginners', desc: 'New to commodities' },
          { icon: BarChart3, title: 'Stock Traders', desc: 'Looking to diversify' },
          { icon: Briefcase, title: 'Working Professionals', desc: 'Seeking side income' },
          { icon: Target, title: 'Struggling Traders', desc: 'Need consistency' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="text-center p-4 rounded-xl bg-background border border-border hover:border-primary/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/25 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          );
        })}
      </div>
      <Link href="/who-can-join">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 cursor-pointer">
          Explore Who Can Join
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  </div>
</section>

        <CTASection
          title="Join the Commodity Mentorship Program Today"
          description="Start your journey to financial freedom. Master Gold, Crude Oil, and global commodities with expert mentorship and live trading sessions."
          primaryButtonText="Enroll Now"
          primaryButtonHref="/courses"
          secondaryButtonText="Get Free Consultation"
          secondaryButtonHref="/contact"
        />
      </main>
      <Footer />
    </>
  );
}