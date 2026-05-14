import { BarChart3, Activity, GitBranch, DollarSign, PieChart, Brain } from 'lucide-react';

const strategies = [
  { icon: BarChart3, name: 'Price Action', description: 'Master support/resistance, trendlines, and candlestick patterns.' },
  { icon: Activity, name: 'Momentum Trading', description: 'Capture breakouts and trending moves with high probability setups.' },
  { icon: GitBranch, name: 'Swing Trading', description: 'Hold positions for days to weeks capturing intermediate trends.' },
  { icon: DollarSign, name: 'Options Strategies', description: 'Learn premium selling, straddles, and iron condors.' },
  { icon: PieChart, name: 'Risk Management', description: 'Position sizing, stop-loss strategies, and capital protection.' },
  { icon: Brain, name: 'Trading Psychology', description: 'Develop discipline, patience, and emotional control.' },
];

export function TradingStrategies() {
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
            Trading Strategies
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
            Battle-Tested{' '}
            <span className="text-primary">Playbooks</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Strategies that work in Bull, Bear, and Range-bound markets
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategies.map(({ icon: Icon, name, description }) => (
            <div key={name} className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">{name}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}