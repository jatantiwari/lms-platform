import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StatsSection } from '@/components/stats-section';
import { TrendingUp, Users, Award, Star, Quote, BarChart2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Results & Success Stories - Financial Freedom Mentor',
  description: 'See real results from 5000+ traders trained by Financial Freedom Mentor. MCX Commodity & NSE/BSE Stock Market success stories.',
};

export default function ResultsPage() {
  const commodityTestimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Software Engineer → Commodity Trader',
      rating: 5,
      content: 'The MCX strategies taught here completely changed how I trade Gold. Within 3 months of the Pro Plan, I was generating ₹40,000+ monthly just from commodity intraday trades. The live sessions are incredible.',
      timeframe: 'Completed Pro Plan — 3 months',
    },
    {
      name: 'Priya Singh',
      role: 'Homemaker → Full-Time Commodity Trader',
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

  const stockTestimonials = [
    {
      name: 'Arjun Mehta',
      role: 'IT Professional → Part-Time Stock Trader',
      rating: 5,
      content: 'The NIFTY 50 intraday strategy and option chain analysis taught in the Pro Plan completely transformed my trading. I now make ₹35,000+ consistently every month from equity & F&O trades.',
      timeframe: 'Completed Pro Plan — 3 months',
    },
    {
      name: 'Sneha Reddy',
      role: 'College Student → Swing Trader',
      rating: 5,
      content: 'I started the Basic Plan with zero market knowledge. The step-by-step chart reading and candlestick modules made it so easy. I placed my first profitable trade within the first week of the course.',
      timeframe: 'Started with Basic Plan, upgraded to Pro',
    },
    {
      name: 'Rohit Sharma',
      role: 'Business Owner → Full-Time Investor',
      rating: 5,
      content: 'The fundamental analysis and multibagger stock picking framework in the Elite Plan is pure gold. My long-term portfolio is up 40% in 8 months. The 1-on-1 mentorship sessions were a game changer.',
      timeframe: 'Completed Elite Plan — 6 months',
    },
    {
      name: 'Meera Kapoor',
      role: 'Homemaker → Portfolio Builder',
      rating: 5,
      content: 'I was always scared of the stock market. The mentor broke everything down so simply — from Demat setup to live F&O trades. Now I manage my own portfolio confidently and earn a second income.',
      timeframe: 'Elite Plan — Investing live for 1+ year',
    },
  ];

  const commodityOutcomes = [
    {
      icon: TrendingUp,
      title: 'Consistent Commodity Income',
      description: '65% of students generate monthly income trading MCX commodities within 3 months of course completion.',
    },
    {
      icon: Award,
      title: 'Career Transformation',
      description: '40% transition to full-time or part-time commodity trading careers after completing the Elite or Pro Plan.',
    },
    {
      icon: Users,
      title: 'Confident MCX Trading',
      description: '85% feel fully confident trading Gold, Silver, Crude Oil, and Natural Gas on MCX after completing the course.',
    },
    {
      icon: Star,
      title: 'Financial Freedom via Commodities',
      description: 'Thousands achieve financial independence through MCX commodity markets with our institutional-level strategies.',
    },
  ];

  const stockOutcomes = [
    {
      icon: TrendingUp,
      title: 'Consistent Stock Market Income',
      description: '68% of students generate monthly income from equity & F&O trading within 3 months of course completion.',
    },
    {
      icon: Award,
      title: 'Portfolio Growth',
      description: 'Elite plan students report an average portfolio growth of 35–45% in the first year through fundamentals-driven investing.',
    },
    {
      icon: Users,
      title: 'Confident NSE/BSE Trading',
      description: '88% feel fully confident trading NIFTY 50, stocks, and options on NSE/BSE after completing the course.',
    },
    {
      icon: Star,
      title: 'Financial Freedom via Stocks',
      description: 'Thousands build long-term wealth and passive income streams through equity, F&O, and dividend investing.',
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
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                Results That <span className="text-primary">Speak</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Real results from real students who mastered Commodity Trading and Stock Market Trading through our mentorship programs.
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
                What Our Students <span className="text-primary">Achieve</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Measurable outcomes our students reach after completing their chosen plan.
              </p>
            </div>

            {/* Commodity Outcomes */}
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/30">
                  <BarChart2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">Commodity Trading</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {commodityOutcomes.map((outcome, index) => {
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

            {/* Stock Outcomes */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/30">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">Stock Market Trading</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {stockOutcomes.map((outcome, index) => {
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
                Hear directly from traders who transformed their financial future through commodity and stock markets.
              </p>
            </div>

            {/* Commodity Testimonials */}
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/30">
                  <BarChart2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">Commodity Trading</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {commodityTestimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="relative p-8 rounded-2xl bg-background border border-border hover:border-primary/40 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                    <p className="text-muted-foreground italic mb-6 leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
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

            {/* Stock Testimonials */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/30">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">Stock Market Trading</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {stockTestimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="relative p-8 rounded-2xl bg-background border border-border hover:border-primary/40 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                    <p className="text-muted-foreground italic mb-6 leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
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
          </div>
        </section>

        {/* Results by Plan */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-foreground mb-4 text-center">
              Results by <span className="text-primary">Plan</span>
            </h2>
            <p className="text-center text-muted-foreground mb-14">Measurable success rates across both programs.</p>

            {/* Commodity Results */}
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/30">
                  <BarChart2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">Commodity Trading</h3>
              </div>
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
                    tagline: 'Active Commodity Trading',
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
                      '75% generate ₹45,000+ monthly income',
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

            {/* Stock Results */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/30">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">Stock Market Trading</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    plan: 'Basic Plan',
                    tagline: 'Strong Foundation',
                    results: [
                      '90% master NSE/BSE stock market basics',
                      '86% confident to place their first equity trade',
                      '80% open a live Demat & trading account',
                    ],
                  },
                  {
                    plan: 'Pro Plan',
                    tagline: 'Active Stock Trading',
                    featured: true,
                    results: [
                      '82% generate monthly income from equity & F&O',
                      '72% consistently profitable within 3 months',
                      '68% trade options with confidence',
                    ],
                  },
                  {
                    plan: 'Elite Plan',
                    tagline: 'Full Market Mastery',
                    results: [
                      '88% achieve their financial freedom goals',
                      '73% generate ₹45,000+ monthly income',
                      '55% build a long-term wealth portfolio',
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
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
