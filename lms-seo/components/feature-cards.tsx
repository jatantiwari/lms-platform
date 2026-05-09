'use client';

import { BarChart3, Users, BookOpen, TrendingUp, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Comprehensive Curriculum',
    description: 'Learn from beginner basics to advanced trading strategies with structured modules.'
  },
  {
    icon: Users,
    title: 'Expert Mentorship',
    description: 'Get personalized guidance from experienced traders with 15+ years of experience.'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analysis',
    description: 'Access live market analysis and trading signals from professional analysts.'
  },
  {
    icon: TrendingUp,
    title: 'Proven Strategies',
    description: 'Learn and apply tested trading strategies that consistently deliver results.'
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Master the art of protecting your capital with advanced risk management techniques.'
  },
  {
    icon: Zap,
    title: 'Live Trading Sessions',
    description: 'Participate in live trading sessions and learn directly from market professionals.'
  },
];

export function FeatureCards() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Our Mentorship?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            We provide comprehensive education and expert guidance to help you succeed in stock market trading.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
