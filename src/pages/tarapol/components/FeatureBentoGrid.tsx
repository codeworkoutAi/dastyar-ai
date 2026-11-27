import React from 'react';
import { BENTO_FEATURES } from '../data/tarapolContent';

export const FeatureBentoGrid: React.FC = () => {
  return (
    <section className="py-4 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          چرا برنامه‌نویسان حرفه‌ای تَراپُل را انتخاب می‌کنند؟
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          ترکیبی از امنیت، سرعت و صرفه‌جویی واقعی در هزینه‌های ارزی
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {BENTO_FEATURES.map((feature) => (
          <div
            key={feature.id}
            className={`${feature.span} clay-card rounded-card p-5 sm:p-6 flex flex-col justify-between gap-5 transition-transform duration-300 hover:-translate-y-1`}
          >
            <div className="clay-surface-inset rounded-2xl overflow-hidden h-44 sm:h-52 bg-[#0f172a] flex items-center justify-center">
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="space-y-2 text-right px-1">
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
