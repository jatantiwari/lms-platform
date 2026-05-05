'use client';

import { useState } from 'react';
import {
  BookOpen,
  CandlestickChart,
  Zap,
  Globe,
  ShieldCheck,
  MonitorPlay,
  ChevronDown,
} from 'lucide-react';

const modules = [
  {
    id: 1,
    icon: BookOpen,
    title: 'Commodity Market Basics',
    color: 'from-primary/20 to-primary/5',
    topics: [
      'What are commodities?',
      'MCX structure & how it works',
      'Contract specifications (Lot size, expiry, margins)',
      'Key commodities: Gold, Silver, Crude Oil, Natural Gas',
    ],
  },
  {
    id: 2,
    icon: CandlestickChart,
    title: 'Price Action Mastery',
    color: 'from-primary/20 to-primary/5',
    topics: [
      'Market structure (Trend, Range, Breakouts)',
      'Support & Resistance — Advanced concepts',
      'Demand & Supply zones',
      'Smart money concepts',
    ],
  },
  {
    id: 3,
    icon: Zap,
    title: 'Intraday & Swing Strategies',
    color: 'from-primary/20 to-primary/5',
    topics: [
      'High probability intraday setups',
      'Opening range breakout strategy',
      'Momentum trading in crude oil',
      'Swing trading in gold',
    ],
  },
  {
    id: 4,
    icon: Globe,
    title: 'Fundamental Analysis (Power Edge)',
    color: 'from-primary/20 to-primary/5',
    topics: [
      'Impact of global news on commodities',
      'US Dollar & commodities correlation',
      'Crude oil inventory data',
      'Economic events (CPI, Interest rates)',
    ],
  },
  {
    id: 5,
    icon: ShieldCheck,
    title: 'Risk Management & Psychology',
    color: 'from-primary/20 to-primary/5',
    topics: [
      'Capital protection strategies',
      'Position sizing mastery',
      'Stop-loss strategies',
      'Trader mindset & discipline',
    ],
  },
  {
    id: 6,
    icon: MonitorPlay,
    title: 'Live Trading & Execution',
    color: 'from-primary/20 to-primary/5',
    topics: [
      'Live market sessions',
      'Trade planning & execution',
      'Real-time case studies',
      'Trade journaling system',
    ],
  },
];

export function CurriculumBreakdown() {
  const [openModule, setOpenModule] = useState<number | null>(1);

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
            Curriculum Breakdown
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            What You'll{' '}
            <span className="text-primary">Learn</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Six power-packed modules taking you from zero to professional — theory, strategy, live execution, and mindset.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Module list — accordion */}
          <div className="space-y-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isOpen = openModule === mod.id;
              return (
                <div
                  key={mod.id}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-primary/50 shadow-[0_0_30px_rgba(0,0,0,0.3)]'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenModule(isOpen ? null : mod.id)}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isOpen ? 'bg-primary' : 'bg-primary/15'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isOpen ? 'text-primary-foreground' : 'text-primary'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                        Module {mod.id}
                      </span>
                      <p className="text-sm md:text-base font-bold text-foreground truncate">
                        {mod.title}
                      </p>
                    </div>
                    <ChevronDown
                      className={`shrink-0 w-4 h-4 text-primary transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Topics */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <ul className="px-5 pb-5 space-y-2 border-t border-border/50 pt-4">
                      {mod.topics.map((topic) => (
                        <li key={topic} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panel — sticky visual summary */}
          <div className="lg:sticky lg:top-24 space-y-5">
            {/* Module counter cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '6', label: 'Modules' },
                { value: '24+', label: 'Topics' },
                { value: 'Live', label: 'Sessions' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-background border border-border text-center"
                >
                  <span className="text-2xl font-extrabold text-primary">{value}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
                </div>
              ))}
            </div>

            {/* Active module detail card */}
            {openModule !== null && (() => {
              const active = modules.find((m) => m.id === openModule)!;
              const ActiveIcon = active.icon;
              return (
                <div className="relative rounded-2xl bg-background border border-primary/30 p-6 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <ActiveIcon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                        Module {active.id}
                      </p>
                      <h3 className="text-base font-bold text-foreground">{active.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {active.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-3">
                        <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm text-foreground/80">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 text-center space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Ready to master all 6 modules?
              </p>
              <a
                href="/courses"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 py-3 rounded-xl transition-colors w-full"
              >
                Enroll Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
