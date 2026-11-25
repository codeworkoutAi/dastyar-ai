import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TECHNICAL_FAQS } from '../data/tarapolContent';

export const TechnicalFaq: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="faq-section" className="py-6 scroll-mt-24 max-w-3xl mx-auto w-full space-y-6">
      <h2
        className="text-2xl sm:text-3xl font-black text-[var(--text-main)] text-center"
        style={{ fontFamily: "'Estedad', sans-serif" }}
      >
        سوالات متداول
      </h2>

      <div className="space-y-3">
        {TECHNICAL_FAQS.map((item, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <div key={item.q} className="clay-card rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveIndex(isOpen ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-right cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                  {item.q}
                </span>
                <ChevronDown
                  size={17}
                  className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed border-t border-subtle">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
