import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StatsSection } from '@/components/stats-section';
import { TrendingUp, Users, Award, Star, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Results & Success Stories - Financial Freedom Mentor',
  description: 'See real results from 5000+ commodity traders trained by Financial Freedom Mentor. MCX Gold, Silver & Crude Oil success stories.',
};

export default function ResultsPage() {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Software Engineer → Commodity Trader',
      rating: 5,
      content: 'The MCX strategies taught here completely changed how I trade Gold. Within 3 months of the Pro Plan, I was generating ₹40,000+ monthly just from commodity intraday trades. The live sessions are incredible.',
      timeframe: 'Completed Pro Plan — 3 months',
    },
    {
      name: 'Priya Singh',
      role: 'Homemaker → Full-Time Trader',
      rating: 5,
      content: 'I had zero knowledge about MCX when I joined the Basic Plan. The step-by-step commodity basics and price action modules were eye-opening. Now I confidently trade Gold and Silver every day.',
      timeframe: 'Started with Basic Plan, upgraded to Pro',
    },
    {
      name: 'Vikram Desai',
      role: 'Doctor → Part-Time Commodity Trader',
      rating: 5,
      content: 'As a busy professional, I valued the flexible recorded sessions. The Crude Oil momentum strategy alone more than paid for the Elite Plan within the first month. Best investment I made.',
      timeframe: 'Completed Elite Plan — 6 months',
    },
    {
      name: 'Anjali Patel',
      role: 'Entrepreneur → Portfolio Trader',
      rating: 5,
      content: 'The fundamental analysis module — Dollar-commodity correlation and crude inventory data — gave me an edge no one else in my circle has. The personal mentorship in Elite is absolutely worth it.',
      timeframe: 'Elite Plan — Trading live for 1+ year',
    },
  ];

  const outcomes = [
    {
      icon: TrendingUp,
      title: 'Consistent Commodity Income',
      description: '65% of students generate monthly income trading MCX commodities within 3 months of course completion.',
    },
    {
      icon: Award,
      title: 'Career Transformation',
      description: '40% transition to full-time or part-time commodity trading careers after completing our Elite or Pro Plan.',
    },
    {
      icon: Users,
      title: 'Confident MCX Trading',
      description: '85% feel fully confident trading Gold, Silver, Crude Oil, and Natural Gas on MCX after completing the course.',
    },
    {
      icon: Star,
      title: 'Financial Freedom',
      description: 'Thousands achieve financial independence through commodity markets with our institutional-level strategies.',
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
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary tracking-wide">
                  Student Success Stories
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight">
                Results That <span className="text-primary">Speak</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Real results from real students who mastered commodity trading through our mentorship programs.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <StatsSection />

        {/* Outcomes */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <h2 className="text-4xl font-extrabold text-foreground mb-4">
                What Students <span className="text-primary">Achieve</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Measurable outcomes our students reach after completing their chosen plan.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {outcomes.map((outcome, index) => {
                const Icon = outcome.icon;
                return (
                  <div
                    key={index}
                    className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{outcome.title}</h3>
                    <p className="text-muted-foreground">{outcome.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <h2 className="text-4xl font-extrabold text-foreground mb-4">
                Student <span className="text-primary">Testimonials</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Hear directly from traders who transformed their financial future through commodity markets.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="relative p-8 rounded-2xl bg-background border border-border hover:border-primary/40 transition-all overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground italic mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-primary font-semibold">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{testimonial.timeframe}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Results by Plan */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-foreground mb-14 text-center">
              Results by <span className="text-primary">Plan</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  plan: 'Basic Plan',
                  tagline: 'Strong Foundation',
                  results: [
                    '92% master MCX commodity basics',
                    '88% confident to place their first MCX trade',
                    '78% open a live MCX trading account',
                  ],
                },
                {
                  plan: 'Pro Plan',
                  tagline: 'Active Trading',
                  featured: true,
                  results: [
                    '85% generate monthly income from commodities',
                    '70% consistently profitable within 3 months',
                    '65% trade multiple commodities with confidence',
                  ],
                },
                {
                  plan: 'Elite Plan',
                  tagline: 'Advanced Mastery',
                  results: [
                    '90% achieve financial freedom goals',
                    '75% generate ₹50,000+ monthly income',
                    '60% transition to full-time commodity trading',
                  ],
                },
              ].map(({ plan, tagline, featured, results }) => (
                <div
                  key={plan}
                  className={`p-8 rounded-2xl border transition-all ${
                    featured
                      ? 'border-primary bg-card shadow-[0_0_40px_rgba(0,0,0,0.3)]'
                      : 'border-border bg-card hover:border-primary/40'
                  } relative overflow-hidden`}
                >
                  {featured && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                  <h3 className="text-2xl font-extrabold text-foreground mb-1">{plan}</h3>
                  <p className="text-primary font-semibold text-sm mb-5">{tagline}</p>
                  <ul className="space-y-3">
                    {results.map((r) => (
                      <li key={r} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
