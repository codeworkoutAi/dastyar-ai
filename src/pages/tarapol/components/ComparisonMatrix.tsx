import React from 'react';
import { Scale, CheckCircle2, XCircle } from 'lucide-react';
import { COMPARISON_ROWS } from '../data/tarapolContent';

export const ComparisonMatrix: React.FC = () => {
  return (
    <section className="py-4 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
          <Scale size={14} />
          <span>مقایسه شفاف مهندسی و اقتصادی</span>
        </span>
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          تَراپُل در برابر خرید مستقیم API دلاری
        </h2>
      </div>

      <div className="clay-card rounded-card overflow-hidden p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-subtle">
                <th className="py-3.5 px-4 text-xs sm:text-sm font-black text-[var(--text-muted)]">
                  معیار مقایسه
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-black text-[var(--text-dim)]">
                  خرید مستقیم API دلاری
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-black text-[var(--accent-primary)]">
                  نرم‌افزار تَراپُل (نسخه ۲.۱)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.metric} className="transition-colors">
                  <td className="py-4 px-4 text-xs sm:text-sm font-bold text-[var(--text-main)]">
                    {row.metric}
                  </td>
                  <td className="py-4 px-4 text-xs sm:text-sm text-[var(--text-muted)]">
                    <div className="flex items-start gap-2">
                      <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{row.directApi}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs sm:text-sm font-bold text-[var(--text-main)]">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{row.tarapol}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
