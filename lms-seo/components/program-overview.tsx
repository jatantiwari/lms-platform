import Image from 'next/image';
import { BarChart2, Flame, Zap, Droplets, Wheat, Globe2 } from 'lucide-react';

const commodities = [
  {
    icon: BarChart2,
    name: 'Gold',
    description: 'Trade the world\'s most trusted safe-haven asset using institutional entry/exit techniques.',
  },
  {
    icon: Zap,
    name: 'Silver',
    description: 'Capitalise on silver\'s high volatility with precision setups and risk-managed position sizing.',
  },
  {
    icon: Flame,
    name: 'Crude Oil',
    description: 'Decode OPEC-driven price swings and geopolitical flows to trade WTI & Brent confidently.',
  },
  {
    icon: Droplets,
    name: 'Natural Gas',
    description: 'Master seasonal patterns and supply-demand shifts in one of MCX\'s most active contracts.',
  },
  {
    icon: Wheat,
    name: 'Agri Commodities',
    description: 'Leverage monsoon cycles, MSP announcements and global crop data for agri-commodity trades.',
  },
  {
    icon: Globe2,
    name: 'Global Commodities',
    description: 'Expand your edge to LME metals, COMEX futures and cross-market arbitrage strategies.',
  },
];

export function ProgramOverview() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle gold radial glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section badge + headline — centred above the two columns */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
            Program Overview
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Trade Commodities Like an{' '}
            <span className="text-primary">Institution</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            This mentorship is designed for{' '}
            <strong className="text-foreground">beginners and intermediate traders</strong>{' '}
            who want to build consistent income through commodity markets — MCX &amp; global
            commodities. You'll learn how to trade using institutional-level strategies, risk
            management frameworks, and live market insights.
          </p>
        </div>

        {/* Two-column: image left, content right */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            {/* Gold shimmer border on top */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-10" />
            <Image
              src="/program-overview.png"
              alt="Program Overview — Commodity Trading Mentorship"
              width={800}
              height={520}
              className="w-full h-auto object-cover"
              priority
            />
            {/* Subtle bottom fade into background */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          {/* Highlight cards */}
          <div className="space-y-5">
            <div className="flex gap-5 items-start p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Who Is This For?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Beginners who want to start trading commodities. Stock traders looking to diversify income. Working professionals seeking a side income. Traders struggling with consistency.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Globe2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">What You Will Learn</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Institutional entry &amp; exit strategies, smart money concepts, commodity-specific
                  seasonal patterns, live trade analysis, and a structured risk management system for
                  every position.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commodity cards grid */}
        <h3 className="text-center text-sm font-bold tracking-widest uppercase text-muted-foreground mb-8">
          Commodities You Will Master
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {commodities.map(({ icon: Icon, name, description }) => (
            <div
              key={name}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary)/0.08)]"
            >
              {/* Gold top-border accent on hover */}
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">{name}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
