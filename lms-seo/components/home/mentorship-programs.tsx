'use client';

import Link from 'next/link';
import { TrendingUp, LineChart, CandlestickChart, CheckCircle2, ArrowRight } from 'lucide-react';

const programs = [
  {
    icon: TrendingUp,
    title: 'Stock Trading Program',
    description: 'Master equity cash & futures trading with advanced technical analysis and proven strategies.',
    features: ['Technical Analysis', 'Stock Selection', 'Portfolio Management', 'Risk Control'],
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: LineChart,
    title: 'Index Trading Program',
    description: 'Trade Nifty & Bank Nifty with institutional-grade strategies for consistent profits.',
    features: ['Nifty/Bank Nifty', 'Options Strategies', 'Hedging Techniques', 'Index Futures'],
    color: 'from-green-500/20 to-green-500/5',
  },
  {
    icon: CandlestickChart,
    title: 'Options Trading Program',
    description: 'Learn premium selling, straddles, strangles, and advanced options strategies.',
    features: ['Option Greeks', 'Premium Selling', 'Strangle/Straddle', 'Iron Condor'],
    color: 'from-purple-500/20 to-purple-500/5',
  },
];

export function MentorshipPrograms() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
            Mentorship Programs
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
            Choose Your{' '}
            <span className="text-primary">Trading Path</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Structured mentorship programs designed for beginners to advanced traders
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, idx) => {
            const Icon = program.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-8">
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-6 group-hover:bg-primary/25 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{program.title}</h3>
                  <p className="text-muted-foreground mb-4">{program.description}</p>
                  <ul className="space-y-2 mb-6">
                    {program.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/courses" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}