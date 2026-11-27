import React from 'react';
import { Key, Sparkles, CheckCircle2, Users } from 'lucide-react';

const COUNCIL_MODELS = [
  { name: 'Google Gemini 4 Neon', icon: '/icons/gemini.svg' },
  { name: 'Alibaba Qwen4-Max', icon: '/icons/qwen.svg' },
];

export const TarapolHero: React.FC = () => {
  return (
    <section className="pt-4 sm:pt-8 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Right Column: Plain-Language Persuasive Copy + Model Badges + CTAs */}
        <div className="lg:col-span-6 space-y-6 text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
            <Sparkles size={14} className="text-amber-500" />
            <span>نرم‌افزار تَراپُل (Tarapol) · نسخه ۲.۱</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-[var(--text-main)] leading-[1.3] tracking-tight"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            شورای مشاوره مدل‌های برتر وب
            <span className="block mt-1.5 text-[var(--accent-primary)]">
              در محیط کدنویسی شما
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            تَراپُل محیط کدنویسی شما را مستقیم به مدل‌های قدرتمند وب وصل می‌کند تا به‌جای تکیه بر یک نظر، از{' '}
            <strong className="text-[var(--text-main)]">هم‌فکری هم‌زمان یک شورا</strong>{' '}
            روی پروژه خود استفاده کنید — امن روی سیستم شخصی خودتان و بدون پرداخت یک دلار هزینه API.
          </p>

          {/* Council Model Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {COUNCIL_MODELS.map((model) => (
              <div
                key={model.name}
                className="clay-surface rounded-2xl px-4 py-2.5 flex items-center gap-2.5"
              >
                <img src={model.icon} alt={model.name} className="w-5 h-5 object-contain" />
                <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                  {model.name}
                </span>
              </div>
            ))}
          </div>

          {/* Key Buyer Assurances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {[
              'هم‌فکری هم‌زمان چند مدل در یک شورا',
              'بدون نیاز به کارت ارزی و خرید API',
              'امنیت کامل کدها روی سیستم شخصی شما',
              'نصب سریع روی ویندوز، مک و لینوکس',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--text-main)]">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="#pricing-section"
              className="px-6 py-3.5 rounded-btn clay-btn-primary text-white font-black text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Key size={17} />
              <span>دریافت لایسنس تَراپُل</span>
            </a>

            <a
              href="#council-demo"
              className="px-5 py-3.5 rounded-btn clay-btn text-[var(--text-main)] font-bold text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Users size={17} className="text-[var(--accent-primary)]" />
              <span>مشاهده عملکرد شورا</span>
            </a>
          </div>
        </div>

        {/* Left Column: Attractive 3D Product Visual */}
        <div className="lg:col-span-6">
          <div className="clay-card-elevated rounded-card p-3 sm:p-4 space-y-3">
            <div className="rounded-2xl overflow-hidden clay-surface-inset aspect-[16/10] bg-[#0f172a]">
              <img
                src="/images/tarapol/hero-bridge.webp"
                alt="تَراپُل — اتصال مستقیم محیط کدنویسی به شورای مدل‌های هوش مصنوعی وب"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="px-2 py-1 flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                شورای هم‌فکری مدل‌های وب آماده اتصال
              </span>
              <span className="text-[11px] font-bold text-[var(--text-dim)]">
                Windows · macOS · Linux
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
