import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CTASection } from '@/components/cta-section';
import { Award, Users, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Financial Freedom Mentor - Our Story & Mission',
  description: 'Learn about Financial Freedom Mentor - helping traders ride the bull and rule the bear. Expert mentorship for lasting financial freedom.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Financial Freedom Mentor
              </h1>
              <p className="text-2xl font-bold text-primary mb-4">Ride the Bull. Rule the Bear.</p>
              <p className="text-xl text-muted-foreground">
                Founded on a mission to empower traders with expert mentorship and achieve lasting financial freedom through proven trading strategies.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="w-full py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Financial Freedom Mentor was founded by a group of successful traders who mastered both bull and bear markets. We realized there was a critical gap in quality financial education, and we committed to creating something transformative.
                  </p>
                  <p>
                    Our mission is simple: help traders learn proven strategies to ride the bull markets and rule the bear markets. Through comprehensive courses and personalized mentorship, we guide students toward lasting financial freedom.
                  </p>
                  <p>
                    Today, we&apos;ve empowered thousands of traders to build sustainable wealth and achieve their financial goals. Our success is measured by the success of our students - their growth is our growth.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-8 border border-border">
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <Award className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Industry Recognition</h3>
                      <p className="text-sm text-muted-foreground">
                        Awarded &quot;Best Trading Education Platform&quot; 3 years in a row by Financial Times.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Users className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Growing Community</h3>
                      <p className="text-sm text-muted-foreground">
                        50,000+ students worldwide learning and trading with confidence every day.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <TrendingUp className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Proven Results</h3>
                      <p className="text-sm text-muted-foreground">
                        98% of our students report increased profitability within the first year.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Values Section */}
        <section className="w-full py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Our Core Values
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Integrity', desc: 'We believe in honest, transparent education and real trading results.' },
                { title: 'Excellence', desc: 'We provide the highest quality courses and mentorship available.' },
                { title: 'Accessibility', desc: 'Making financial education affordable and available to everyone.' },
                { title: 'Growth', desc: 'Continuous improvement and evolution with market changes.' },
              ].map((value, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-all">
                  <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection
          title="Join Our Community Today"
          description="Become part of a growing community of successful traders. Start your mentorship journey now."
          primaryButtonText="Explore Courses"
          primaryButtonHref="/courses"
        />
      </main>
      <Footer />
    </>
  );
}
