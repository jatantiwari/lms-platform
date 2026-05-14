import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CoursesContent } from '@/components/courses-content';
import { CTASection } from '@/components/cta-section';

export const metadata: Metadata = {
  title: 'Courses & Pricing - Financial Freedom Mentor | Commodity & Stock Trading Mentorship',
  description: 'Choose from Basic (₹10,000), Pro (₹25,000), or Elite (₹50,000) plans for Commodity Trading (MCX) or Stock Trading (NSE/BSE). Live sessions, personal mentorship & more.',
};

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
                <span className="text-sm font-semibold text-primary tracking-wide">Commodity & Stock Trading Mentorship</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                Simple, Transparent <span className="text-primary">Pricing</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Separate programs for Commodity Trading and Stock Trading — same three plans, same world-class mentorship. No hidden fees.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="w-full py-20 bg-background">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CoursesContent />
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
                  q: 'What is the difference between Commodity Trading and Stock Trading programs?',
                  a: 'The Commodity Trading program focuses on MCX markets — Gold, Silver, Crude Oil, Natural Gas, and Copper. The Stock Trading program covers NSE/BSE equity, intraday, swing, F&O, and long-term investing. Both follow the same Basic / Pro / Elite plan structure at the same prices.',
                },
                {
                  q: 'What will I learn in the Commodity Trading program?',
                  a: 'You will learn MCX market structure, contract specifications, commodity price drivers, technical analysis, intraday & swing strategies for Gold/Silver/Crude Oil, risk management, trading psychology, and live trading with personal mentorship in the Elite plan.',
                },
                {
                  q: 'What will I learn in the Stock Trading program?',
                  a: 'You will learn stock market basics, NSE/BSE structure, technical analysis, candlestick patterns, intraday & swing strategies, options trading (beginner to intermediate), fundamental analysis, portfolio building, trading psychology — all the way to becoming an independent trader.',
                },
                {
                  q: 'Do I need prior trading experience?',
                  a: 'Absolutely not. The Basic Plan in both programs starts from zero — covering market basics, order types, charts, and foundational strategies. No prior experience is needed.',
                },
                {
                  q: 'Are the live sessions recorded?',
                  a: 'Yes. All live sessions are recorded and available for replay. Elite plan includes lifetime access to all recordings.',
                },
                {
                  q: 'What is the difference between Pro and Elite?',
                  a: 'Pro gives you the full strategy system, live trading sessions (2–3 days/week for stock, regular MCX hours for commodity), trade setups, weekly Q&A, VIP community, risk management, and psychology training. Elite adds daily live sessions (3–5 days/week), 1-on-1 mentorship (3–5 calls), a personalized trading plan, advanced risk management, options/income strategies, priority WhatsApp support, lifetime access, and certification.',
                },
                {
                  q: 'Do you offer a money-back guarantee?',
                  a: 'Yes. We offer a satisfaction guarantee. If you feel the course is not right for you within the first 7 days, contact our team and we will work out a solution.',
                },
                {
                  q: 'How do I choose the right plan?',
                  a: 'If you are a complete beginner, start with Basic. If you are serious about developing real trading skills, choose Pro (most popular). For full transformation with personal mentorship and lifetime access, invest in Elite. Contact Us us for a free consultation to pick the right program and plan.',
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
          title="Start Your Trading Journey Today"
          description="Choose Commodity or Stock Trading — and pick the plan that fits your goals. Expert mentorship from basics to live trading to complete financial freedom."
          primaryButtonText="Enroll Now"
          primaryButtonHref="/register"
        />
      </main>
      <Footer />
    </>
  );
}