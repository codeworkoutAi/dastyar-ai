import React from 'react';
import { Laptop, Sparkles, Users, CheckCircle2 } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '../data/tarapolContent';

interface PricingCards3DProps {
  formatPrice: (price: number) => string;
  onSelectPlan: (planId: PricingPlan['id']) => void;
}

const PLAN_ICONS: Record<PricingPlan['id'], React.FC<{ size?: number }>> = {
  starter: Laptop,
  pro: Sparkles,
  team: Users,
};

export const PricingCards3D: React.FC<PricingCards3DProps> = ({ formatPrice, onSelectPlan }) => {
  return (
    <section id="pricing-section" className="py-6 scroll-mt-24 space-y-10">
      <div className="text-center space-y-3">
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          انتخاب لایسنس دائمی
        </h2>
      </div>

      {/* Visual Product Box Showcase */}
      <div className="clay-card rounded-card p-4 sm:p-5 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-5">
        <div className="w-24 h-28 rounded-2xl clay-surface p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src="/images/products/tarapol-box.jpg"
            alt="بسته نرم‌افزار تَراپُل نسخه ۲.۱"
            className="w-full h-full object-contain rounded-xl"
            loading="lazy"
          />
        </div>
        <div className="text-center sm:text-right space-y-1">
          <div className="text-sm sm:text-base font-black text-[var(--text-main)]">
            تحویل آنی بسته نسخه ۲.۱ تجاری
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            نصب‌کننده مستقل (Windows · macOS · Linux) + اکستنشن کروم + کلید لایسنس آفلاین
          </div>
        </div>
      </div>

      {/* Clean 3-Card Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id];
          const isFeatured = Boolean(plan.featured);

          return (
            <div
              key={plan.id}
              className={`${
                isFeatured ? 'clay-card-elevated border-strong' : 'clay-card'
              } rounded-card p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-transform duration-300 hover:-translate-y-1`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black ${
                      isFeatured
                        ? 'clay-btn-primary text-white'
                        : 'clay-surface text-[var(--text-muted)]'
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <span className="w-9 h-9 rounded-xl clay-surface flex items-center justify-center text-[var(--accent-primary)]">
                    <Icon size={17} />
                  </span>
                </div>

                <h3 className="text-lg font-black text-[var(--text-main)]">{plan.title}</h3>

                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black tabular-nums ${
                      isFeatured ? 'text-[var(--accent-primary)]' : 'text-[var(--text-main)]'
                    }`}
                  >
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-dim)]">تومان</span>
                </div>

                <ul className="space-y-2.5 text-xs text-[var(--text-muted)] pt-3 border-t border-subtle">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span className={isFeatured ? 'font-bold text-[var(--text-main)]' : ''}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full py-3.5 rounded-btn font-black text-xs sm:text-sm transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                  isFeatured
                    ? 'clay-btn-primary text-white'
                    : 'clay-btn text-[var(--text-main)]'
                }`}
              >
                {plan.ctaLabel}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
