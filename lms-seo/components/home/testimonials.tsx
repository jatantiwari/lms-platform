import { Users, Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Full-Time Trader',
    content: 'The mentorship transformed my trading completely. From losing money consistently to now making 15-20% monthly returns. The Nifty strategies are pure gold!',
    rating: 5,
  },
  {
    name: 'Priya Mehta',
    role: 'Working Professional',
    content: 'I started as a complete beginner. Within 3 months of the program, I became consistently profitable. The live trading sessions are invaluable.',
    rating: 5,
  },
  {
    name: 'Amit Kumar',
    role: 'Business Owner',
    content: 'Best decision I made for my financial future. The risk management framework alone is worth the investment. Now trading is my second income source.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
            Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
            What Our{' '}
            <span className="text-primary">Students Say</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="rounded-2xl bg-card border border-border p-6 hover:border-primary/40 transition-all duration-300">
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-foreground/80 mb-6 leading-relaxed">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.name}</h4>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}