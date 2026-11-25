import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { IDE_CONFIGS } from '../data/tarapolContent';

export const IdeIntegrationTabs: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(IDE_CONFIGS[0].id);
  const [copied, setCopied] = useState(false);

  const current = IDE_CONFIGS.find((c) => c.id === activeId) || IDE_CONFIGS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.baseUrl).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="ide-integration" className="py-6 scroll-mt-24 space-y-8">
      <h2
        className="text-2xl sm:text-3xl font-black text-[var(--text-main)] text-center"
        style={{ fontFamily: "'Estedad', sans-serif" }}
      >
        اتصال آنی به ادیتور شما
      </h2>

      <div className="clay-card rounded-card p-5 sm:p-7 max-w-3xl mx-auto space-y-5">
        {/* IDE Pill Switcher */}
        <div className="clay-surface-inset rounded-2xl p-1.5 flex flex-wrap gap-1.5">
          {IDE_CONFIGS.map((ide) => {
            const isSelected = ide.id === activeId;
            return (
              <button
                key={ide.id}
                type="button"
                onClick={() => setActiveId(ide.id)}
                className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'clay-btn-primary text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {ide.label}
              </button>
            );
          })}
        </div>

        {/* Single-line Copyable Endpoint */}
        <div className="clay-surface-inset rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[var(--text-dim)]">{current.hint}</div>
            <div className="text-sm sm:text-base font-mono font-bold text-[var(--text-main)] truncate" dir="ltr">
              {current.baseUrl}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="clay-btn px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>کپی شد</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>کپی آدرس</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
