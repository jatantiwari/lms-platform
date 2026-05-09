'use client';

import { TrendingUp, Users, Award, Star } from 'lucide-react';

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      value: '5000+',
      label: 'Students Trained',
      description: 'Growing community of successful traders',
    },
    {
      icon: Star,
      value: '4.9/5',
      label: 'Average Rating',
      description: 'Based on 2000+ student reviews',
    },
    {
      icon: TrendingUp,
      value: '85%',
      label: 'Success Rate',
      description: 'Students achieving their trading goals',
    },
    {
      icon: Award,
      value: '50+',
      label: 'Expert Mentors',
      description: 'Experienced traders and analysts',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            Our Track Record
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful traders who have transformed their financial future
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-8 text-center border border-border hover:shadow-lg transition-shadow"
              >
                <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  {stat.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
