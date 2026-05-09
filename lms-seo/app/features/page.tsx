import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { FeatureCards } from '@/components/feature-cards';
import { CTASection } from '@/components/cta-section';

export const metadata: Metadata = {
  title: 'Features - Financial Freedom Mentor | Trading Education Benefits',
  description: 'Expert stock market mentorship features: live classes, personal guidance, proven strategies to ride the bull and rule the bear.',
};

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-6">
                Powerful Features for Your Trading Success
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Everything you need to become a confident and profitable trader, all in one comprehensive platform.
              </p>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <FeatureCards />

        {/* Additional Benefits Section */}
        <section className="w-full py-16 md:py-24 bg-card border-t border-border">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">24/7</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Access Anytime</h3>
                <p className="text-muted-foreground">
                  Access all course materials and resources whenever you want, from anywhere in the world.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">100%</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Money-Back Guarantee</h3>
                <p className="text-muted-foreground">
                  Not satisfied? Get a full refund within 30 days, no questions asked.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">∞</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Lifetime Updates</h3>
                <p className="text-muted-foreground">
                  Receive lifetime access to all future course updates and new modules at no extra cost.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTASection
          title="Experience the Difference"
          description="Join our community of successful traders and start your journey to financial independence today."
          primaryButtonText="Explore All Courses"
          primaryButtonHref="/courses"
        />
      </main>
      <Footer />
    </>
  );
}
