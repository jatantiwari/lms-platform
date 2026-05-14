'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CurriculumModule {
  week: string;
  title: string;
  topics: string[];
}

export interface CurriculumDetailProps {
  courseType:
    | 'commodity-basic'
    | 'commodity-pro'
    | 'commodity-elite'
    | 'stock-basic'
    | 'stock-pro'
    | 'stock-elite';
}

const curriculumData = {
  'commodity-basic': [
    {
      week: 'Module 1',
      title: 'Commodity Market Basics',
      topics: [
        'What are commodities?',
        'MCX structure & how it works',
        'Contract specifications (Lot size, expiry, margins)',
        'Key commodities: Gold, Silver, Crude Oil, Natural Gas',
        'How to read commodity prices',
      ],
    },
    {
      week: 'Module 2',
      title: 'Price Action Mastery',
      topics: [
        'Market structure (Trend, Range, Breakouts)',
        'Support & Resistance — Advanced concepts',
        'Demand & Supply zones',
        'Candlestick patterns for commodities',
        'Smart money concepts',
      ],
    },
    {
      week: 'Module 3',
      title: 'Intraday & Swing Strategies',
      topics: [
        'High probability intraday setups',
        'Opening range breakout strategy',
        'Momentum trading in Crude Oil',
        'Swing trading in Gold',
        'Stop loss & basic risk management',
      ],
    },
  ],

  'commodity-pro': [
    {
      week: 'Phase 1: Module 1',
      title: 'Commodity Market Deep Dive',
      topics: [
        'MCX & NCDEX structure in depth',
        'Contract specifications for all key commodities',
        'How global events affect commodity prices',
        'Key drivers: Gold, Silver, Crude Oil, Natural Gas, Copper',
        'Margin requirements & leverage management',
      ],
    },
    {
      week: 'Phase 1: Module 2',
      title: 'Technical Analysis for Commodities',
      topics: [
        'Advanced candlestick patterns',
        'Support, Resistance & Supply-Demand zones',
        'Trendlines, channels & chart patterns',
        'Moving Averages (EMA, SMA) for commodities',
        'Volume analysis in commodity markets',
      ],
    },
    {
      week: 'Phase 1: Module 3',
      title: 'Indicators & Tools',
      topics: [
        'RSI & Stochastic for commodity trading',
        'MACD & signal line interpretation',
        'ATR (Average True Range) for stop loss',
        'VWAP & pivot points',
        'Multi-timeframe analysis',
      ],
    },
    {
      week: 'Phase 2: Module 4',
      title: 'Intraday Strategies',
      topics: [
        'Opening range breakout strategy',
        'Momentum trading in Crude Oil',
        'Scalping setups for Natural Gas',
        'Trade entry, exit & re-entry rules',
        'Risk-reward ratio mastery',
      ],
    },
    {
      week: 'Phase 2: Module 5',
      title: 'Swing Trading Strategies',
      topics: [
        'Multi-day Gold & Silver swing trades',
        'Breakout & pullback strategy',
        'Positional setups using weekly charts',
        'Trend-following systems',
        'Position sizing techniques',
      ],
    },
    {
      week: 'Phase 2: Module 6',
      title: 'Risk Management & Psychology',
      topics: [
        'Stop loss strategy for commodities',
        'Capital protection rules',
        'Handling volatile commodity moves',
        'Emotional discipline & trading psychology',
        'Trade journaling system',
      ],
    },
    {
      week: 'Phase 3: Module 7',
      title: 'Live Trading Sessions',
      topics: [
        'Real-time market analysis (MCX hours)',
        'Live trade execution & commentary',
        'Morning & evening trade setups',
        'Trade review & performance tracking',
        'Doubt-solving sessions',
      ],
    },
    {
      week: 'Phase 3: Module 8',
      title: 'Advanced Setups & Review',
      topics: [
        'High-probability reversal patterns',
        'News-based commodity trades',
        'Building a consistent daily routine',
        'Strategy backtesting on historical data',
        'Creating a personal trading plan',
      ],
    },
  ],

  'commodity-elite': [
    {
      week: 'Month 1: Foundation & Market Structure',
      title: 'Build a Rock-Solid Commodity Base',
      topics: [
        'MCX structure, participants & contract specs',
        'All major commodities: Gold, Silver, Crude, Natural Gas, Copper',
        'Global macro drivers affecting commodity prices',
        'Margin, leverage & capital allocation',
        'Trading platform setup & order types',
        'Introduction to charts & candlesticks',
        'Daily market routine setup',
      ],
    },
    {
      week: 'Month 2: Technical Analysis Mastery',
      title: 'Master Chart Reading & Price Action',
      topics: [
        'Advanced candlestick patterns',
        'Support, Resistance, Supply & Demand zones',
        'Trendlines, channels & flag patterns',
        'Moving Averages, RSI, MACD for commodities',
        'Volume & open interest analysis',
        'Multi-timeframe analysis framework',
        'Live chart practice sessions',
      ],
    },
    {
      week: 'Month 3: Advanced Trading Strategies',
      title: 'Develop Profitable Systems',
      topics: [
        'Opening range breakout strategy',
        'Momentum trading in Crude Oil & Natural Gas',
        'Gold & Silver swing trade setups',
        'Breakout, pullback & reversal strategies',
        'Risk-reward ratio mastery',
        'Position sizing techniques',
        'Strategy backtesting sessions',
      ],
    },
    {
      week: 'Month 4: Risk Management & Psychology',
      title: 'Protect Capital & Build Discipline',
      topics: [
        'Stop loss strategy (fixed vs ATR-based)',
        'Capital protection rules',
        'Handling volatile market moves',
        'Trading psychology (fear, greed, FOMO control)',
        'Consistency & discipline framework',
        'Handling losses & drawdowns',
        'Mindset coaching sessions',
      ],
    },
    {
      week: 'Month 5: Live Market Execution',
      title: 'Real-World Trading Experience',
      topics: [
        'Daily live trading sessions (MCX hours)',
        'Trade entry & exit in real time',
        'Morning & evening market preparation',
        'Live trade review & feedback',
        'Performance tracking & journaling',
        'Weekly Q&A sessions',
        'Building trading confidence',
      ],
    },
    {
      week: 'Month 6: Elite Trader Transformation',
      title: 'Achieve Full Trading Independence',
      topics: [
        'Advanced risk & portfolio management',
        'Scaling capital safely',
        'Multi-commodity portfolio building',
        'Creating a personal trading system',
        'Building multiple income streams',
        'Business & wealth mindset training',
        'Certification & career roadmap',
      ],
    },
    {
      week: 'Elite Bonuses',
      title: 'Exclusive Premium Benefits',
      topics: [
        'Daily trade setups (learning purpose)',
        'Live market trading (3–5 days/week)',
        'Private VIP community (Telegram/Discord)',
        'Lifetime access to recordings',
        'Personal mentorship support',
        'Trade review & feedback sessions',
        'Weekly Q&A calls',
        'Certificate of completion',
      ],
    },
  ],

  'stock-basic': [
    {
      week: 'Module 1',
      title: 'Stock Market Basics',
      topics: [
        'What is the Stock Market?',
        'How NSE & BSE work',
        'Key participants: Retail, FII, DII',
        'Types of stocks: Large cap, Mid cap, Small cap',
        'Index basics: NIFTY 50, SENSEX',
      ],
    },
    {
      week: 'Module 2',
      title: 'Account Setup & Trading Tools',
      topics: [
        'Demat & Trading account setup',
        'Brokers overview (Zerodha, Upstox, Angel One)',
        'Trading platform interface walkthrough',
        'Order types: Market, Limit, SL, SL-M',
        'Reading a contract note',
      ],
    },
    {
      week: 'Module 3',
      title: 'Chart Reading & First Trades',
      topics: [
        'Introduction to candlestick charts',
        'Basic candlestick patterns (Doji, Hammer, Engulfing)',
        'Support & Resistance basics',
        'Timeframes: 5min, Daily, Weekly',
        'Placing your first trade (live demo)',
        'Basic stop loss & risk management',
      ],
    },
  ],

  'stock-pro': [
    {
      week: 'Phase 1: Module 1',
      title: 'Introduction to Stock Market',
      topics: [
        'What is Stock Market?',
        'History & evolution of stock markets',
        'Role of stock exchanges like NSE & BSE',
        'How money flows in the market',
        'Key participants (Retail, FII, DII)',
      ],
    },
    {
      week: 'Phase 1: Module 2',
      title: 'Account Setup & Tools',
      topics: [
        'Demat & Trading account setup',
        'Brokers overview (Zerodha, Upstox)',
        'Trading platforms & interface',
        'Order types (Market, Limit, SL, SL-M)',
        'Understanding contract notes',
      ],
    },
    {
      week: 'Phase 1: Module 3',
      title: 'Market Basics',
      topics: [
        'Types of markets (Primary vs Secondary)',
        'Types of stocks (Large cap, Mid cap, Small cap)',
        'Index basics (NIFTY 50, SENSEX)',
        'Bull vs Bear market',
        'IPO basics',
      ],
    },
    {
      week: 'Phase 2: Module 4',
      title: 'Chart Reading Basics',
      topics: [
        'Candlestick patterns (Doji, Hammer, Engulfing)',
        'Timeframes (1min, 5min, Daily, Weekly)',
        'Chart types',
      ],
    },
    {
      week: 'Phase 2: Module 5',
      title: 'Price Action Mastery',
      topics: [
        'Support & Resistance',
        'Trend identification (Uptrend, Downtrend, Sideways)',
        'Breakouts & Fakeouts',
        'Demand & Supply zones',
      ],
    },
    {
      week: 'Phase 2: Module 6',
      title: 'Indicators & Tools',
      topics: [
        'Moving Averages (SMA, EMA)',
        'RSI (Relative Strength Index)',
        'MACD (Moving Average Convergence Divergence)',
        'Volume analysis',
        'VWAP',
      ],
    },
    {
      week: 'Phase 3: Module 7',
      title: 'Company Analysis',
      topics: [
        'Business model understanding',
        'Revenue & profit analysis',
        'Industry comparison',
      ],
    },
    {
      week: 'Phase 3: Module 8',
      title: 'Financial Statements',
      topics: [
        'Balance Sheet',
        'Profit & Loss Statement',
        'Cash Flow Statement',
      ],
    },
    {
      week: 'Phase 3: Module 9',
      title: 'Key Ratios',
      topics: [
        'PE Ratio',
        'ROE / ROCE',
        'Debt-to-Equity',
        'EPS & growth analysis',
      ],
    },
    {
      week: 'Phase 4: Module 10',
      title: 'Intraday Trading',
      topics: [
        'Intraday setups',
        'Scalping basics',
        'Risk control in fast markets',
      ],
    },
    {
      week: 'Phase 4: Module 11',
      title: 'Swing Trading',
      topics: [
        'Multi-day trades',
        'Swing setups',
        'Entry & exit strategies',
      ],
    },
    {
      week: 'Phase 4: Module 12',
      title: 'Positional Trading',
      topics: [
        'Long-term setups',
        'Trend-following systems',
        'Portfolio building',
      ],
    },
    {
      week: 'Phase 4: Module 13',
      title: 'Options Trading (Beginner to Intermediate)',
      topics: [
        'Basics of Options (Call & Put)',
        'Option chain analysis',
        'Simple strategies (Straddle, Strangle)',
        'Hedging basics',
      ],
    },
    {
      week: 'Phase 5: Module 14',
      title: 'Risk Management',
      topics: [
        'Stop loss strategy',
        'Position sizing',
        'Capital protection rules',
        'Risk-to-reward ratio',
      ],
    },
    {
      week: 'Phase 5: Module 15',
      title: 'Trading Psychology',
      topics: [
        'Emotional control',
        'Discipline building',
        'Avoiding overtrading',
        'Mindset of successful traders',
      ],
    },
    {
      week: 'Phase 6: Module 16',
      title: 'Live Trading Sessions',
      topics: [
        'Real-time market analysis',
        'Live trade execution',
        'Market opening strategy',
      ],
    },
    {
      week: 'Phase 6: Module 17',
      title: 'Trade Review & Improvement',
      topics: [
        'Trade journal creation',
        'Mistake analysis',
        'Performance tracking',
      ],
    },
    {
      week: 'Bonus: Module 18',
      title: 'Advanced Strategies',
      topics: [
        'Price action strategies',
        'Breakout strategies',
        'Reversal trading setups',
      ],
    },
    {
      week: 'Bonus: Module 19',
      title: 'Algorithmic Trading (Basic Intro)',
      topics: [
        'What is algo trading',
        'Automation tools overview',
      ],
    },
    {
      week: 'Bonus: Module 20',
      title: 'Passive Income Strategies',
      topics: [
        'Dividend investing',
        'Long-term wealth building',
      ],
    },
  ],
  'stock-elite': [
    {
      week: 'Month 1: Foundation & Market Basics',
      title: 'Build Strong Fundamentals',
      topics: [
        'Introduction to Stock Market (India & Global)',
        'How Stock Exchanges Work (NSE, BSE)',
        'Types of Market Participants',
        'Key Terminologies (Equity, IPO, Volume, etc.)',
        'Demat & Trading Account Setup',
        'Types of Orders (Market, Limit, SL)',
        'Introduction to Charts & Candlesticks',
      ],
    },
    {
      week: 'Month 2: Technical Analysis Mastery',
      title: 'Learn Chart Reading & Price Action',
      topics: [
        'Candlestick Patterns (Doji, Hammer, Engulfing)',
        'Support & Resistance Strategy',
        'Trend Analysis (Uptrend, Downtrend)',
        'Chart Patterns (Breakouts, Flags, Triangles)',
        'Moving Averages (EMA, SMA)',
        'Indicators (RSI, MACD, Volume)',
        'Live Chart Practice Sessions',
      ],
    },
    {
      week: 'Month 3: Advanced Trading Strategies',
      title: 'Develop Profitable Trading Systems',
      topics: [
        'Intraday Trading Strategies',
        'Swing Trading Strategies',
        'Breakout & Pullback Strategy',
        'Risk-Reward Ratio Mastery',
        'Position Sizing Techniques',
        'Stop Loss & Capital Protection',
        'Strategy Backtesting Sessions',
      ],
    },
    {
      week: 'Month 4: Fundamental Analysis & Investing',
      title: 'Learn Long-Term Wealth Creation',
      topics: [
        'Financial Statements (P&L, Balance Sheet)',
        'Ratio Analysis (ROE, PE, Debt)',
        'How to Pick Multibagger Stocks',
        'Sector Analysis',
        'Economic Indicators',
        'Long-Term Portfolio Building',
        'Case Studies of Successful Stocks',
      ],
    },
    {
      week: 'Month 5: Live Market Execution & Psychology',
      title: 'Real-World Trading Experience',
      topics: [
        'Live Market Trading Sessions',
        'Trade Entry & Exit in Real Time',
        'Trading Psychology (Fear, Greed Control)',
        'Discipline & Consistency Framework',
        'Handling Losses & Drawdowns',
        'Journaling & Performance Tracking',
        'Mindset Coaching Sessions',
      ],
    },
    {
      week: 'Month 6: Elite Trader Transformation',
      title: 'Become Independent & Scalable',
      topics: [
        'Advanced Risk Management',
        'Portfolio Diversification',
        'Passive Income Strategies (Options Basics)',
        'Scaling Capital Safely',
        'Creating Personal Trading Plan',
        'Building Multiple Income Streams',
        'Business & Wealth Mindset Training',
      ],
    },
    {
      week: 'Elite Features (Premium Bonuses)',
      title: 'Exclusive Mentorship Benefits',
      topics: [
        'Daily Trade Signals (Learning Purpose)',
        'Live Market Trading (3–5 days/week)',
        'Private VIP Community (Telegram/Discord)',
        'Lifetime Access to Recordings',
        'Personal Mentorship Support',
        'Trade Review & Feedback Sessions',
        'Weekly Q&A Calls',
        'Certification of Completion',
      ],
    },
    {
      week: 'Bonus Modules',
      title: 'Additional Wealth Building Skills',
      topics: [
        'Options Trading Basics',
        'Crypto Market Introduction',
        'AI Tools for Trading',
        'Personal Finance & Wealth Building',
      ],
    },
  ],
};

export function CurriculumDetail({ courseType }: CurriculumDetailProps) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const curriculum = curriculumData[courseType];

  // Auto-expand first module on initial render for better UX
  // (optional - remove if not needed)

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
            className="w-full flex items-center justify-between p-6 bg-card hover:bg-accent/30 transition-colors text-left cursor-pointer"
          >
            <div className="flex-1">
              <div className="text-sm font-semibold text-primary mb-1">
                {module.week}
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {module.title}
              </h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-primary transition-transform shrink-0 ml-4 ${
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