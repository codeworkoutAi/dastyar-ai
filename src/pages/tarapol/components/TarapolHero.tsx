import React, { useState, useEffect } from 'react';
import { Key, Sparkles, CheckCircle2, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { toPersianDigits } from '../../../lib/persianUtils';

const COUNCIL_MODELS = [
  { name: 'Google Gemini 4 Neon', icon: '/icons/gemini.svg' },
  { name: 'Alibaba Qwen4-Max', icon: '/icons/qwen.svg' },
];

const HERO_SLIDES = [
  { title: '۱. داشبورد و پایش لحظه‌ای', src: '/images/tarapol/app-dashboard.webp' },
  { title: '۲. محیط‌های توسعه متصل', src: '/images/tarapol/app-ides.webp' },
  { title: '۳. مدل‌ها و وب‌چت', src: '/images/tarapol/app-models.webp' },
  { title: '۴. تنظیمات شبکه', src: '/images/tarapol/app-network.webp' },
  { title: '۵. تنظیمات موتور', src: '/images/tarapol/app-engine.webp' },
  { title: '۶. مدیریت لایسنس دائمی', src: '/images/tarapol/app-license.webp' },
  { title: '۷. لاگ و عیب‌یابی', src: '/images/tarapol/app-logs.webp' },
  { title: '۸. راهنما و آموزش گام‌به‌گام', src: '/images/tarapol/app-guide.webp' },
];

export const TarapolHero: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const currentSlide = HERO_SLIDES[activeIndex];

  return (
    <section className="pt-2 sm:pt-6 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Right Column: Compact Copy + Model Badges + CTAs (4 cols) */}
        <div className="lg:col-span-4 space-y-4 text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-[11px] font-bold text-[var(--accent-primary)]">
            <Sparkles size={13} className="text-amber-500" />
            <span>نرم‌افزار تَراپُل · نسخه ۲.۱</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl lg:text-[1.85rem] font-black text-[var(--text-main)] leading-[1.3] tracking-tight"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            شورای مشاوره مدل‌های برتر وب
            <span className="block mt-1 text-[var(--accent-primary)]">
              در محیط کدنویسی شما
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            <strong className="text-[var(--text-main)]">نرم‌افزار تَراپُل (Tarapol)</strong> پل دسکتاپ اتصال مستقیم{' '}
            <strong className="text-[var(--text-main)]">۵ محیط کدنویسی</strong> (Cursor، VS Code، Antigravity، Claude Code و Cline) به{' '}
            <strong className="text-[var(--text-main)]">شورای مدل‌های برتر وب</strong> (Gemini 4 Neon و Qwen4-Max) است؛ با{' '}
            <strong className="text-[var(--text-main)]">۱۰۰٪ صرفه‌جویی در هزینه دلاری API</strong> و راه‌اندازی در کمتر از ۲ دقیقه.
          </p>

          {/* Council Model Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {COUNCIL_MODELS.map((model) => (
              <div
                key={model.name}
                className="clay-surface rounded-xl px-3 py-1.5 flex items-center gap-2"
              >
                <img src={model.icon} alt={model.name} className="w-4 h-4 object-contain" />
                <span className="text-xs font-bold text-[var(--text-main)]">
                  {model.name}
                </span>
              </div>
            ))}
          </div>

          {/* Key Buyer Assurances */}
          <div className="space-y-1.5 pt-0.5">
            {[
              'هم‌فکری هم‌زمان چند مدل در یک شورا',
              'بدون نیاز به کارت ارزی و خرید API',
              'امنیت کامل کدها روی سیستم شخصی شما',
              'نصب سریع روی ویندوز، مک و لینوکس',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]"
              >
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href="#pricing-section"
              className="px-5 py-2.5 rounded-btn clay-btn-primary text-white font-black text-xs sm:text-sm flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Key size={15} />
              <span>دریافت لایسنس</span>
            </a>

            <a
              href="#council-demo"
              className="px-4 py-2.5 rounded-btn clay-btn text-[var(--text-main)] font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Users size={15} className="text-[var(--accent-primary)]" />
              <span>عملکرد شورا</span>
            </a>
          </div>
        </div>

        {/* Left Column: Large Ordered Animated App Carousel (8 cols) */}
        <div
          className="lg:col-span-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="clay-card-elevated rounded-card p-3 sm:p-4 space-y-3">
            {/* Carousel Stage */}
            <div className="relative rounded-2xl overflow-hidden clay-surface-inset aspect-[16/9] bg-[#18181b]">
              {HERO_SLIDES.map((slide, idx) => (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt={slide.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                    idx === activeIndex
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-[0.98] pointer-events-none'
                  }`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ))}

              {/* Prev / Next Controls */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="تصویر قبلی"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="تصویر بعدی"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Ordered Slide Footer & Dots */}
            <div className="px-1.5 py-0.5 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentSlide.title}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={slide.title}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex
                        ? 'w-5 bg-[var(--accent-primary)]'
                        : 'w-2 bg-[var(--text-dim)]/40 hover:bg-[var(--text-dim)]'
                    }`}
                  />
                ))}
                <span className="text-[11px] font-bold text-[var(--text-dim)] mr-1.5 tabular-nums">
                  {toPersianDigits(String(activeIndex + 1))} / {toPersianDigits(String(HERO_SLIDES.length))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
