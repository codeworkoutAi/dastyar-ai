import React from 'react';
import { Key, Layers, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { toPersianDigits } from '../../../lib/persianUtils';
import { CouncilLiveDemo } from './CouncilLiveDemo';

interface TarapolHeroProps {
  usePersianDigits: boolean;
}

export const TarapolHero: React.FC<TarapolHeroProps> = ({ usePersianDigits }) => {
  const formatNum = (val: string) => (usePersianDigits ? toPersianDigits(val) : val);

  return (
    <section className="pt-4 sm:pt-8 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Right Column: Value Proposition, Pain Point & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-right">
          {/* Version Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl clay-surface text-xs font-bold text-[var(--text-main)] select-none">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>نسخه ۲.۱ تجاری | گیت‌وی محلی و شورای هوش مصنوعی</span>
            <span className="px-2 py-0.5 rounded-lg clay-surface-inset text-[10px] font-mono text-[var(--accent-primary)]">
              v2.1 Stable
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-[var(--text-main)] leading-[1.3] tracking-tight"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            قدرت Gemini، DeepSeek و Qwen را
            <span className="block mt-1.5 text-[var(--accent-primary)]">
              بدون هزینه دلاری API وارد IDE خود کنید
            </span>
          </h1>

          {/* Concise Subtitle */}
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed max-w-2xl">
            مدل داخلی ادیتور شما کدنویسی روزمره را انجام می‌دهد؛ در کنار آن،{' '}
            <strong className="text-[var(--text-main)]">شورای مشاوران تَراپُل</strong>{' '}
            (<span className="font-bold text-[var(--accent-primary)]">Google Gemini 4 Neon</span> و{' '}
            <strong className="text-[var(--text-main)]">Alibaba Qwen4-Max</strong>) به‌صورت هم‌زمان معماری و کدهای شما را بازبینی می‌کنند — ۱۰۰٪ محلی روی سیستم شما، بدون نیاز به کارت ارزی.
          </p>

          {/* Key Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              'اسلش‌کامند اختصاصی هم‌فکری (/council)',
              'پروکسی استاندارد روی localhost:8765/v1',
              'سازگار با Antigravity، Cursor و VS Code',
              'لایسنس سخت‌افزاری آفلاین و دائمی',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[var(--text-main)]">
                <span className="w-6 h-6 rounded-lg clay-surface flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 size={14} />
                </span>
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
              <span>تهیه لایسنس دائمی</span>
            </a>

            <a
              href="#ide-integration"
              className="px-5 py-3.5 rounded-btn clay-btn text-[var(--text-main)] font-bold text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Layers size={17} className="text-[var(--accent-primary)]" />
              <span>نحوه اتصال به IDE</span>
            </a>

            <a
              href="#faq-section"
              className="px-4 py-3.5 rounded-btn clay-surface text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock size={14} />
              <span>راه‌اندازی در ۳ دقیقه</span>
            </a>
          </div>

          {/* Developer Trust Metrics */}
          <div className="pt-5 border-t border-subtle grid grid-cols-3 gap-4 text-right">
            <div className="clay-surface rounded-2xl p-3">
              <div className="text-lg sm:text-2xl font-black text-[var(--accent-primary)] tabular-nums">
                {formatNum('0')}$
              </div>
              <div className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium mt-0.5">
                هزینه دلاری API
              </div>
            </div>
            <div className="clay-surface rounded-2xl p-3">
              <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatNum('100%')}
              </div>
              <div className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium mt-0.5">
                محلی و بدون سرور واسط
              </div>
            </div>
            <div className="clay-surface rounded-2xl p-3">
              <div className="text-lg sm:text-2xl font-black text-[var(--text-main)] tabular-nums">
                {formatNum('2')} پرچمدار
              </div>
              <div className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium mt-0.5">
                هم‌زمان در یک شورا
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Interactive Live Council Simulator */}
        <div className="lg:col-span-5">
          <CouncilLiveDemo />
        </div>
      </div>
    </section>
  );
};
