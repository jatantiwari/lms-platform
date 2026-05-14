'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Is this program suitable for beginners?', a: 'Absolutely! Our program is designed for absolute beginners. We start from basics and gradually move to advanced concepts.' },
  { q: 'What is the duration of the mentorship?', a: 'We offer 1-month, 3-month, and 6-month programs. Each includes live sessions, recorded content, and community support.' },
  { q: 'Do you provide live trading sessions?', a: 'Yes! Daily live trading sessions where we analyze markets and take trades in real-time.' },
  { q: 'What markets do you cover?', a: 'We focus on Nifty, Bank Nifty, and stock trading. Our strategies work across equity, futures, and options.' },
  { q: 'Is there any refund policy?', a: 'We offer a 7-day money-back guarantee if you\'re not satisfied with the program.' },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-foreground">
            Frequently Asked{' '}
            <span className="text-primary">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-5 text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                {faq.q}
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ${openIndex === idx ? 'max-h-40 pb-5 px-5' : 'max-h-0 overflow-hidden'}`}>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}