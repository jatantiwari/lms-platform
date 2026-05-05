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
import { ArrowRight, BookOpen, Users, TrendingUp } from 'lucide-react';

export default function Home() {
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
        {/* Who Can Join Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Who Can Join?
              </h2>
              <p className="text-xl text-muted-foreground mb-12">
                Financial Freedom Mentor is designed for everyone - whether you're a student, working professional, entrepreneur, or retiree. 
                Find your perfect learning path.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">For Beginners</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Flexible</div>
                  <p className="text-sm text-muted-foreground">Learning Pace</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">No Exp</div>
                  <p className="text-sm text-muted-foreground">Needed</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">18+</div>
                  <p className="text-sm text-muted-foreground">Age Requirement</p>
                </div>
              </div>
              <Link href="/who-can-join">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                  Explore Who Can Join
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Ride the Bull and Rule the Bear?"
          description="Join thousands of successful traders who have achieved financial freedom through expert mentorship and proven strategies. Learn, Invest, Grow."
          primaryButtonText="Enroll in a Course"
          primaryButtonHref="/courses"
        />
      </main>
      <Footer />
    </>
  );
}
