'use client';

import { useState } from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import { PricingTable } from '@/components/pricing-table';

type Category = 'commodity' | 'stock';

const commodityPlans = [
  {
    name: 'Basic',
    price: 10000,
    currency: '₹',
    duration: '1 Month',
    description: 'Quick Start Program for beginners — build a strong foundation in MCX commodity trading.',
    features: [
      { name: 'Commodity Market Basics (MCX, NCDEX)', included: true },
      { name: 'Key Commodities: Gold, Silver, Crude Oil, Natural Gas', included: true },
      { name: 'Candlestick Patterns & Support/Resistance', included: true },
      { name: '1 Core Commodity Strategy', included: true },
      { name: 'Limited Live Sessions (MCX hours)', included: true },
      { name: 'Community Access (Basic Group)', included: true },
      { name: 'Advanced Strategies', included: false },
      { name: 'Live Trading Sessions (Regular)', included: false },
      { name: 'Personal Mentorship', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 25000,
    currency: '₹',
    duration: '3 Months',
    description: 'Complete Commodity Trader Development Program — full strategy system with live MCX support.',
    popular: true,
    features: [
      { name: 'Everything in Basic', included: true },
      { name: 'Full Commodity Strategy System', included: true },
      { name: 'Advanced Price Action for Commodities', included: true },
      { name: 'Intraday + Swing Strategies (Crude, Gold, Silver)', included: true },
      { name: 'Regular Live Trading Sessions (MCX hours)', included: true },
      { name: 'Weekly Q&A + Doubt Solving', included: true },
      { name: 'Trade Setups (For Learning)', included: true },
      { name: 'Private VIP Community Access', included: true },
      { name: 'Risk Management System', included: true },
      { name: 'Trading Psychology Training', included: true },
    ],
  },
  {
    name: 'Elite',
    price: 50000,
    currency: '₹',
    duration: '6 Months',
    description: 'Full Financial Freedom Mentorship — complete MCX commodity mastery with personal mentorship.',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Daily Live Trading Sessions (3–5 days/week)', included: true },
      { name: 'Multi-Commodity Portfolio Building', included: true },
      { name: 'Global Macro Impact on Commodities', included: true },
      { name: '1-on-1 Mentorship (3–5 Calls)', included: true },
      { name: 'Personalized Commodity Trading Plan', included: true },
      { name: 'Advanced Risk Management (ATR-based)', included: true },
      { name: 'Priority Support (WhatsApp/Direct)', included: true },
      { name: 'Lifetime Access to Recordings', included: true },
      { name: 'Certification of Completion', included: true },
    ],
  },
];

const stockPlans = [
  {
    name: 'Basic',
    price: 10000,
    currency: '₹',
    duration: '1 Month',
    description: 'Quick Start Program for beginners — build a strong foundation in NSE/BSE stock market trading.',
    features: [
      { name: 'Beginner to Intermediate Technical Analysis', included: true },
      { name: 'Market Basics (NSE, BSE, Order Types, Charts)', included: true },
      { name: 'Candlestick Patterns & Support/Resistance', included: true },
      { name: '4 Live Classes (1 per week)', included: true },
      { name: 'Basic Strategy Introduction', included: true },
      { name: 'Community Access (Basic Group)', included: true },
      { name: 'Live Trading Sessions (Regular)', included: false },
      { name: 'Advanced Strategies', included: false },
      { name: 'Personal Mentorship', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 25000,
    currency: '₹',
    duration: '3 Months',
    description: 'Complete Stock Trader Development Program — equity & F&O strategy system with live NSE support.',
    popular: true,
    features: [
      { name: 'Everything in Basic', included: true },
      { name: 'Advanced Technical Analysis', included: true },
      { name: 'Intraday + Swing + Positional Strategies', included: true },
      { name: 'Options Trading (Beginner to Intermediate)', included: true },
      { name: 'Live Market Sessions (2–3 days/week, NSE hours)', included: true },
      { name: 'Weekly Q&A + Doubt Solving', included: true },
      { name: 'Trade Setups (For Learning)', included: true },
      { name: 'Private VIP Community Access', included: true },
      { name: 'Risk Management System', included: true },
      { name: 'Trading Psychology Training', included: true },
    ],
  },
  {
    name: 'Elite',
    price: 50000,
    currency: '₹',
    duration: '6 Months',
    description: 'Full Financial Freedom Mentorship — complete stock market mastery with personal mentorship.',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Live Market Sessions (3–5 days/week)', included: true },
      { name: 'Fundamental Analysis & Long-Term Investing', included: true },
      { name: 'Portfolio Building Strategies', included: true },
      { name: '1-on-1 Mentorship (3–5 Calls)', included: true },
      { name: 'Personalized Trading Plan', included: true },
      { name: 'Advanced Risk Management', included: true },
      { name: 'Options Basics + Income Strategies', included: true },
      { name: 'Priority Support (WhatsApp/Direct)', included: true },
      { name: 'Lifetime Access to Recordings', included: true },
      { name: 'Certification of Completion', included: true },
    ],
  },
];

export function CoursesContent() {
  const [activeCategory, setActiveCategory] = useState<Category>('commodity');

  const plans = activeCategory === 'commodity' ? commodityPlans : stockPlans;

  return (
    <>
      {/* Category Tab Switcher */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
          <button
            onClick={() => setActiveCategory('commodity')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeCategory === 'commodity'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Commodity Trading
          </button>
          <button
            onClick={() => setActiveCategory('stock')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeCategory === 'stock'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Stock Trading
          </button>
        </div>
      </div>

      {/* Category subtitle */}
      <p className="text-center text-sm text-muted-foreground mb-10">
        {activeCategory === 'commodity'
          ? 'Plans for MCX Commodity Trading — Gold, Silver, Crude Oil, Natural Gas & more'
          : 'Plans for NSE/BSE Stock Trading — Equity, F&O, Intraday, Swing & more'}
      </p>

      <PricingTable plans={plans} />
    </>
  );
}
