import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PricingTable } from '@/components/pricing-table';
import { CTASection } from '@/components/cta-section';

export const metadata: Metadata = {
  title: 'Courses & Pricing - Financial Freedom Mentor | Commodity Trading Mentorship',
  description: 'Choose from Basic (₹10,000), Pro (₹25,000), or Elite (₹50,000) commodity trading mentorship plans. MCX Gold, Silver, Crude Oil and more.',
};

const pricingPlans = [
  {
    name: 'Basic',
    price: 10000,
    currency: '₹',
    duration: '1 Month',
    description: 'Perfect launchpad for beginners entering commodity markets.',
    features: [
      { name: 'Basics of commodity trading', included: true },
      { name: '1 core strategy', included: true },
      { name: 'Limited live sessions', included: true },
      { name: 'Community access', included: true },
      { name: 'Full strategy system', included: false },
      { name: 'Advanced price action', included: false },
      { name: 'Personal mentorship', included: false },
      { name: 'Lifetime access + updates', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 25000,
    currency: '₹',
    duration: '3 Months',
    description: 'Full strategy system with live trading and hands-on support.',
    popular: true,
    features: [
      { name: 'All Basic Plan content', included: true },
      { name: 'Full strategy system', included: true },
      { name: 'Regular live trading sessions', included: true },
      { name: 'Advanced price action', included: true },
      { name: 'Trade support + doubt solving', included: true },
      { name: 'Personal mentorship', included: false },
      { name: 'Daily live trading', included: false },
      { name: 'Lifetime access + updates', included: false },
    ],
  },
  {
    name: 'Elite',
    price: 50000,
    currency: '₹',
    duration: '6 Months',
    description: 'Complete mastery — Beginner to Advanced with personal mentorship.',
    features: [
      { name: 'All Pro Plan content', included: true },
      { name: 'Complete mastery (Beginner → Advanced)', included: true },
      { name: 'Daily live trading', included: true },
      { name: 'Personal mentorship', included: true },
      { name: 'Psychology coaching', included: true },
      { name: 'Lifetime access + updates', included: true },
    ],
  },
];

export default function CoursesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="w-full py-20 bg-card border-b border-border">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-sm font-semibold text-primary tracking-wide">Commodity Trading Mentorship</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight">
                Simple, Transparent <span className="text-primary">Pricing</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Three plans designed to take you from complete beginner to professional commodity trader. No hidden fees.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="w-full py-20 bg-background">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PricingTable plans={pricingPlans} />
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full py-20 bg-card border-y border-border">
          <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-foreground text-center mb-12">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'What commodities will I learn to trade?',
                  a: 'You will learn to trade Gold, Silver, Crude Oil, and Natural Gas on MCX, along with global commodities including LME metals and COMEX futures in the Elite Plan.',
                },
                {
                  q: 'Do I need prior trading experience?',
                  a: 'Absolutely not. The Basic Plan starts from zero — we cover what commodities are, how MCX works, contract specs, and your first strategy. No prior experience is needed.',
                },
                {
                  q: 'Are the live sessions recorded?',
                  a: 'Yes. All live sessions are recorded and available for replay. You can learn at your own pace alongside the live schedule.',
                },
                {
                  q: 'What is the difference between Pro and Elite?',
                  a: 'Pro gives you the full strategy system with regular live sessions and doubt solving. Elite adds daily live trading, personal one-on-one mentorship, psychology coaching, and lifetime access with all future updates.',
                },
                {
                  q: 'Do you offer a money-back guarantee?',
                  a: 'Yes. We offer a satisfaction guarantee. If you feel the course is not right for you within the first 7 days, contact our team and we will work out a solution.',
                },
                {
                  q: 'How do I choose the right plan?',
                  a: 'If you are a complete beginner with limited capital, start with Basic. If you want a full strategy system with live support, choose Pro. If you want personal mentorship and daily live trading, invest in Elite. Contact us for a free consultation.',
                },
              ].map((item, i) => (
                <div key={i} className="border-b border-border pb-6 last:border-b-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.q}</h3>
                  <p className="text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection
          title="Start Your Commodity Trading Journey Today"
          description="Join thousands of successful MCX traders. Choose your plan and get started with expert mentorship — from basics to daily live trading."
          primaryButtonText="Enroll Now"
          primaryButtonHref="/register"
        />
      </main>
      <Footer />
    </>
  );
}
