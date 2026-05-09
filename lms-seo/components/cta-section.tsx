'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  title: string;
  description: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export function CTASection({
  title,
  description,
  primaryButtonText = 'Get Started',
  primaryButtonHref = '/contact',
  secondaryButtonText = 'Learn More',
  secondaryButtonHref = '/features',
}: CTASectionProps) {
  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 text-center space-y-8 py-12 md:py-16">
          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-balance">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={primaryButtonHref}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                {primaryButtonText}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href={secondaryButtonHref}>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-card w-full sm:w-auto">
                {secondaryButtonText}
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <p className="text-sm text-muted-foreground">
            No credit card required. Start learning immediately.
          </p>
        </div>
      </div>
    </section>
  );
}
