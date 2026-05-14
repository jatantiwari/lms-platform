import Link from 'next/link';
import { BarChart2, TrendingUp } from 'lucide-react';
import { CurriculumDetail } from '@/components/curriculum-detail';
import { Button } from '@/components/ui/button';

const commodityPlans = [
  {
    key: 'commodity-basic' as const,
    title: 'Basic Plan',
    badge: null,
    subtitle: 'Foundations of commodity trading — MCX structure, price action, and your first intraday strategies.',
    price: '₹10,000',
    duration: '1 Month',
  },
  {
    key: 'commodity-pro' as const,
    title: 'Pro Plan',
    badge: 'Most Popular',
    subtitle: 'Full commodity strategy system with live MCX trading sessions, advanced price action, and doubt-solving support.',
    price: '₹25,000',
    duration: '3 Months',
  },
  {
    key: 'commodity-elite' as const,
    title: 'Elite Plan',
    badge: 'Best Value',
    subtitle: 'Complete commodity mastery — daily live trading, personal mentorship, psychology coaching, and lifetime access.',
    price: '₹45,000',
    duration: '6 Months',
  },
];

const stockPlans = [
  {
    key: 'stock-basic' as const,
    title: 'Basic Plan',
    badge: null,
    subtitle: 'Foundations of stock market trading — NSE/BSE structure, account setup, and your first chart-based trades.',
    price: '₹10,000',
    duration: '1 Month',
  },
  {
    key: 'stock-pro' as const,
    title: 'Pro Plan',
    badge: 'Most Popular',
    subtitle: 'Full equity & F&O strategy system with live NSE sessions, technical analysis, fundamental analysis, and doubt solving.',
    price: '₹25,000',
    duration: '3 Months',
  },
  {
    key: 'stock-elite' as const,
    title: 'Elite Plan',
    badge: 'Best Value',
    subtitle: 'Complete stock market mastery — daily live trading, personal mentorship, psychology & portfolio management, lifetime access.',
    price: '₹45,000',
    duration: '6 Months',
  },
];

function PlanSection({ plan }: { plan: (typeof commodityPlans)[number] | (typeof stockPlans)[number] }) {
  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-foreground">
            {plan.title}
            {plan.badge && (
              <span className="ml-3 text-sm font-bold tracking-wider uppercase text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full align-middle">
                {plan.badge}
              </span>
            )}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-xl">{plan.subtitle}</p>
        </div>
        <div className="md:text-right shrink-0">
          <div className="text-3xl font-extrabold text-primary">{plan.price}</div>
          <div className="text-sm text-muted-foreground">{plan.duration}</div>
          <Link href="/courses" className="mt-3 inline-block">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              Enroll Now
            </Button>
          </Link>
        </div>
      </div>
      <CurriculumDetail courseType={plan.key} />
    </div>
  );
}

export function CurriculumTabs() {
  return (
    <div className="space-y-24">
      {/* ── Commodity Trading ─────────────────────────────── */}
      <div>
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-foreground">Commodity Trading</h2>
            <p className="text-sm text-muted-foreground mt-0.5">MCX — Gold, Silver, Crude Oil, Natural Gas & more</p>
          </div>
        </div>
        <div className="h-px bg-border mb-12" />

        <div className="space-y-16">
          {commodityPlans.map((plan, i) => (
            <div key={plan.key}>
              {i > 0 && <div className="h-px bg-border/50 mb-16" />}
              <PlanSection plan={plan} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Stock Market Trading ───────────────────────────── */}
      <div>
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-foreground">Stock Market Trading</h2>
            <p className="text-sm text-muted-foreground mt-0.5">NSE/BSE — Equity, F&O, Intraday, Swing & more</p>
          </div>
        </div>
        <div className="h-px bg-border mb-12" />

        <div className="space-y-16">
          {stockPlans.map((plan, i) => (
            <div key={plan.key}>
              {i > 0 && <div className="h-px bg-border/50 mb-16" />}
              <PlanSection plan={plan} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

