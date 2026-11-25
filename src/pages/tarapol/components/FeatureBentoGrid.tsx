import React from 'react';
import { BENTO_CARDS } from '../data/tarapolContent';

export const FeatureBentoGrid: React.FC = () => {
  return (
    <section className="py-6 space-y-8">
      <h2
        className="text-2xl sm:text-3xl font-black text-[var(--text-main)] text-center"
        style={{ fontFamily: "'Estedad', sans-serif" }}
      >
        ساخته‌شده برای سرعت و امنیت
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {BENTO_CARDS.map((card) => (
          <div
            key={card.id}
            className={`${card.span} clay-card rounded-card p-5 sm:p-6 flex flex-col justify-between gap-5 transition-transform duration-300 hover:-translate-y-1`}
          >
            {/* Large Visual Stage */}
            <div className="clay-surface-inset rounded-2xl overflow-hidden h-48 sm:h-56 bg-[#0f172a] flex items-center justify-center">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Ultra-Short Microcopy */}
            <div className="space-y-1 text-right px-1">
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
