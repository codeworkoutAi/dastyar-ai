import React from 'react';
import { FileCode, ShieldCheck, Laptop, Zap } from 'lucide-react';
import { BENTO_FEATURES } from '../data/tarapolContent';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  delta: FileCode,
  'offline-license': ShieldCheck,
  safety: Zap,
  'cross-platform': Laptop,
};

export const FeatureBentoGrid: React.FC = () => {
  return (
    <section className="py-4 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          معماری‌شده برای کار روزمره برنامه‌نویسان حرفه‌ای
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          ابزاری سبک، پایدار و بدون وابستگی‌های پیچیده برای بهره‌وری واقعی در پروژه‌های بزرگ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {BENTO_FEATURES.map((feature) => {
          const Icon = ICON_MAP[feature.id] || Zap;
          return (
            <div
              key={feature.id}
              className="clay-card rounded-card p-6 space-y-3.5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl clay-surface flex items-center justify-center text-[var(--accent-primary)]">
                  <Icon size={20} />
                </div>
                <span className="px-2.5 py-1 rounded-lg clay-surface-inset text-[11px] font-bold text-[var(--text-muted)]">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
