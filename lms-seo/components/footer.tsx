'use client';

import Link from 'next/link';
import { Mail, Instagram, Facebook } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://lmsapi.alldigitalideas.com/api/v1';

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const handleSubscribe = async () => {
    const trimmedEmail = newsletterEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setSubscribeMessage('Please enter your email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSubscribeMessage('Please enter a valid email address.');
      return;
    }

    setIsSubscribing(true);
    setSubscribeMessage('');

    try {
      const res = await fetch(`${API_URL}/seo-leads/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubscribeMessage(data.message ?? 'Subscription failed. Please try again.');
        return;
      }

      setSubscribeMessage('Subscribed successfully.');
      setNewsletterEmail('');
    } catch {
      setSubscribeMessage('Network error. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSubscribeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubscribe();
    }
  };

  return (
    <footer className="w-full border-t border-border bg-card">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <Link href="/" className="block mb-4">
              <div className="mb-3">
                <div className="text-lg font-bold text-primary">Financial Freedom Mentor</div>
                <div className="text-xs text-primary font-semibold">Ride the Bull. Rule the Bear.</div>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Master commodity trading and stock Market trading with expert.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <a href="mailto:info@ffmentor.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                info@ffmentor.com
              </a>
              <a href="tel:+918000160017" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <span className="w-4 h-4 text-primary text-xs font-bold">📞</span>
                +91 98317 40535
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Learning</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/curriculum" className="text-muted-foreground hover:text-primary transition-colors">
                  Curriculum
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/who-can-join" className="text-muted-foreground hover:text-primary transition-colors">
                  Who Can Join
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/results" className="text-muted-foreground hover:text-primary transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="text-muted-foreground hover:text-primary transition-colors">
                  Data Deletion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get weekly tips and market insights.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (subscribeMessage) setSubscribeMessage('');
                }}
                onKeyDown={handleSubscribeKeyDown}
                className="bg-background border-border text-foreground text-sm"
              />
              <Button
                size="sm"
                disabled={isSubscribing}
                onClick={() => void handleSubscribe()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
            {subscribeMessage && (
              <p className="text-xs text-muted-foreground mt-2">{subscribeMessage}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Financial Freedom Mentor. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link>
              <Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
              <Link href="/data-deletion" className="hover:text-primary transition-colors">Data Deletion</Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/yours_ffmentor/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/yoursffmentor" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
