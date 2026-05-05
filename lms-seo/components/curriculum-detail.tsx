'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CurriculumModule {
  week: string;
  title: string;
  topics: string[];
}

export interface CurriculumDetailProps {
  courseType: 'beginner' | 'intermediate' | 'advanced';
}

const curriculumData = {
  beginner: [
    {
      week: 'Module 1',
      title: 'Commodity Market Basics',
      topics: [
        'What are commodities?',
        'MCX structure & how it works',
        'Contract specifications (Lot size, expiry, margins)',
        'Key commodities: Gold, Silver, Crude Oil, Natural Gas',
      ],
    },
    {
      week: 'Module 2',
      title: 'Price Action Mastery',
      topics: [
        'Market structure (Trend, Range, Breakouts)',
        'Support & Resistance — Advanced concepts',
        'Demand & Supply zones',
        'Smart money concepts',
      ],
    },
    {
      week: 'Module 3',
      title: 'Intraday & Swing Strategies',
      topics: [
        'High probability intraday setups',
        'Opening range breakout strategy',
        'Momentum trading in crude oil',
        'Swing trading in gold',
      ],
    },
  ],
  intermediate: [
    {
      week: 'Module 1–3',
      title: 'All Basic Plan Modules',
      topics: [
        'Complete commodity market basics',
        'Price action mastery',
        'Intraday & swing strategies',
        'Foundational live session recordings',
      ],
    },
    {
      week: 'Module 4',
      title: 'Fundamental Analysis (Power Edge)',
      topics: [
        'Impact of global news on commodities',
        'US Dollar & commodities correlation',
        'Crude oil inventory data analysis',
        'Economic events: CPI, Interest rates',
      ],
    },
    {
      week: 'Module 5',
      title: 'Risk Management & Psychology',
      topics: [
        'Capital protection strategies',
        'Position sizing mastery',
        'Stop-loss strategies',
        'Trader mindset & discipline',
      ],
    },
    {
      week: 'Module 6',
      title: 'Live Trading & Execution',
      topics: [
        'Regular live market sessions',
        'Trade planning & execution',
        'Advanced price action setups',
        'Trade support + doubt solving',
      ],
    },
  ],
  advanced: [
    {
      week: 'Module 1–6',
      title: 'All Basic & Pro Plan Modules',
      topics: [
        'Full commodity market mastery',
        'Price action & smart money concepts',
        'Intraday, swing & fundamental analysis',
        'Risk management & execution frameworks',
      ],
    },
    {
      week: 'Elite Module A',
      title: 'Daily Live Trading',
      topics: [
        'Daily live market sessions',
        'Real-time trade calls in Gold & Crude Oil',
        'Live chart reading and setup identification',
        'Post-market review sessions',
      ],
    },
    {
      week: 'Elite Module B',
      title: 'Personal Mentorship & Psychology',
      topics: [
        'One-on-one personal mentorship',
        'Psychology coaching & mindset building',
        'Custom trade journaling system',
        'Personalised feedback on every trade',
      ],
    },
    {
      week: 'Elite Module C',
      title: 'Advanced Mastery & Lifetime Access',
      topics: [
        'Advanced multi-commodity strategies',
        'LME metals & COMEX futures exposure',
        'Cross-market arbitrage concepts',
        'Lifetime access + all future updates',
      ],
    },
  ],
};

export function CurriculumDetail({ courseType }: CurriculumDetailProps) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const curriculum = curriculumData[courseType];

  return (
    <div className="space-y-4">
      {curriculum.map((module, index) => (
        <div
          key={index}
          className="border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
        >
          <button
            onClick={() =>
              setExpandedWeek(expandedWeek === module.week ? null : module.week)
            }
            className="w-full flex items-center justify-between p-6 bg-card hover:bg-accent/30 transition-colors"
          >
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-primary mb-1">
                {module.week}
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {module.title}
              </h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-primary transition-transform ${
                expandedWeek === module.week ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedWeek === module.week && (
            <div className="px-6 py-4 bg-muted/30 border-t border-border">
              <h4 className="font-semibold text-foreground mb-3">
                Topics Covered:
              </h4>
              <ul className="space-y-2">
                {module.topics.map((topic, topicIndex) => (
                  <li
                    key={topicIndex}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <span className="text-primary font-bold mt-1">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
