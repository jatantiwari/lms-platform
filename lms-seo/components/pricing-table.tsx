'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingPlanProps {
  name: string;
  price: number;
  currency?: string;
  duration?: string;
  description: string;
  features: PricingFeature[];
  highlighted?: boolean;
  popular?: boolean;
}

export function PricingCard({ name, price, currency = '$', duration = '/month', description, features, highlighted = false, popular = false }: PricingPlanProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
        highlighted
          ? 'border-2 border-primary shadow-2xl shadow-primary/20 scale-105'
          : 'border border-border hover:border-primary/50'
      }`}
    >
      {(highlighted || popular) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
      )}

      {(highlighted || popular) && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
          Popular
        </div>
      )}

      <div className={`p-8 ${highlighted || popular ? 'bg-gradient-to-br from-primary/5 to-background' : 'bg-card'}`}>
        {/* Plan Name */}
        <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{currency}{price.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{duration}</p>
        </div>

        {/* CTA Button */}
        <Link href="/register" className="w-full block mb-8">
          <Button
            className={`w-full ${
              highlighted || popular
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'border border-primary text-primary hover:bg-primary/10'
            }`}
            variant={highlighted || popular ? 'default' : 'outline'}
          >
            Enroll Now
          </Button>
        </Link>

        {/* Divider */}
        <div className="border-t border-border mb-8"></div>

        {/* Features */}
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              {feature.included ? (
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 bg-border rounded flex-shrink-0"></div>
              )}
              <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingTable({ plans }: { plans: PricingPlanProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan, index) => (
        <PricingCard
          key={index}
          {...plan}
          highlighted={index === 1}
        />
      ))}
    </div>
  );
}
