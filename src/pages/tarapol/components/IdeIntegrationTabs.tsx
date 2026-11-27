import React, { useState } from 'react';
import { Code2 } from 'lucide-react';
import { IDE_OPTIONS } from '../data/tarapolContent';

export const IdeIntegrationTabs: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(IDE_OPTIONS[0].id);
  const currentIde = IDE_OPTIONS.find((t) => t.id === activeId) || IDE_OPTIONS[0];

  return (
    <section id="ide-integration" className="py-4 scroll-mt-24 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
          <Code2 size={14} />
          <span>سازگار با ابزارهای روزمره شما</span>
        </span>
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          شروع کار در کمتر از ۲ دقیقه، بدون تغییر ادیتور
        </h2>
      </div>

      <div className="clay-card rounded-card p-5 sm:p-7 max-w-4xl mx-auto space-y-6">
        {/* IDE Selector Tabs */}
        <div className="clay-surface-inset rounded-2xl p-1.5 flex flex-wrap gap-1.5">
          {IDE_OPTIONS.map((ide) => {
            const isSelected = ide.id === activeId;
            return (
              <button
                key={ide.id}
                type="button"
                onClick={() => setActiveId(ide.id)}
                className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'clay-btn-primary text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {ide.name}
              </button>
            );
          })}
        </div>

        {/* Simple 3-Step Buyer Guide (Zero Technical Plumbing Leaks) */}
        <div className="space-y-4 text-right">
          <div className="text-sm font-black text-[var(--text-main)]">{currentIde.tagline}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentIde.steps.map((step, idx) => (
              <div key={idx} className="clay-surface rounded-2xl p-4 space-y-2.5">
                <span className="w-7 h-7 rounded-xl clay-btn-primary text-white text-xs font-black flex items-center justify-center tabular-nums">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
