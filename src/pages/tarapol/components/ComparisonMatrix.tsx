import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { toPersianDigits } from '../../../lib/persianUtils';

interface ComparisonMatrixProps {
  usePersianDigits?: boolean;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({ usePersianDigits = false }) => {
  const fmt = (s: string) => (usePersianDigits ? toPersianDigits(s) : s);

  return (
    <section className="py-6 space-y-8">
      <h2
        className="text-2xl sm:text-3xl font-black text-[var(--text-main)] text-center"
        style={{ fontFamily: "'Estedad', sans-serif" }}
      >
        حذف هزینه ارزی و تحریم
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Before: Direct USD API */}
        <div className="clay-card rounded-card p-7 sm:p-8 flex flex-col items-center text-center space-y-3 opacity-80">
          <div className="w-12 h-12 rounded-2xl clay-surface flex items-center justify-center text-rose-500">
            <XCircle size={24} />
          </div>
          <div className="text-xs font-bold text-[var(--text-dim)]">خرید مستقیم API دلاری</div>
          <div className="text-3xl sm:text-4xl font-black text-[var(--text-muted)] line-through tabular-nums">
            {fmt('60')}$ / ماه
          </div>
          <div className="text-xs font-bold text-[var(--text-muted)]">
            نیازمند کارت ارزی و تحریم‌شکن
          </div>
        </div>

        {/* After: Tarapol Local Gateway */}
        <div className="clay-card-elevated border-strong rounded-card p-7 sm:p-8 flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl clay-surface flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-xs font-bold text-[var(--accent-primary)]">گیت‌وی محلی تَراپُل</div>
          <div className="text-3xl sm:text-4xl font-black text-[var(--text-main)] tabular-nums">
            {fmt('0')}$ هزینه API
          </div>
          <div className="text-xs font-bold text-[var(--text-main)]">
            ۱۰۰٪ لوکال با یک‌بار خرید ریالی
          </div>
        </div>
      </div>
    </section>
  );
};
