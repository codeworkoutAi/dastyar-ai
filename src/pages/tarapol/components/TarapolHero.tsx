import React from 'react';
import { Key, Layers } from 'lucide-react';
import { toPersianDigits } from '../../../lib/persianUtils';

interface TarapolHeroProps {
  usePersianDigits: boolean;
}

const SUPPORTED_MODEL_ICONS = [
  { name: 'Gemini', src: '/icons/gemini.svg' },
  { name: 'Qwen', src: '/icons/qwen.svg' },
  { name: 'DeepSeek', src: '/icons/deepseek.svg' },
  { name: 'Claude', src: '/icons/claude.svg' },
];

export const TarapolHero: React.FC<TarapolHeroProps> = ({ usePersianDigits }) => {
  const portText = usePersianDigits ? toPersianDigits('8765') : '8765';

  return (
    <section className="pt-4 sm:pt-8 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Right Column: Minimal Punchy Headline + Model Icons + CTAs */}
        <div className="lg:col-span-6 space-y-7 text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
            <span>Tarapol v2.1</span>
            <span className="text-[var(--text-dim)]">·</span>
            <span className="text-[var(--text-muted)]">گیت‌وی محلی IDE</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-[var(--text-main)] leading-[1.2] tracking-tight"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            شورای مدل‌های برتر
            <span className="block mt-2 text-[var(--accent-primary)]">
              بدون هزینه دلاری API
            </span>
          </h1>

          {/* Visual Model Icons Strip instead of heavy text */}
          <div className="flex flex-wrap items-center gap-3">
            {SUPPORTED_MODEL_ICONS.map((m) => (
              <div
                key={m.name}
                className="clay-surface rounded-2xl px-3.5 py-2 flex items-center gap-2"
              >
                <img src={m.src} alt={m.name} className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-[var(--text-main)]">{m.name}</span>
              </div>
            ))}
          </div>

          {/* 2 Clean Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <a
              href="#pricing-section"
              className="px-7 py-3.5 rounded-btn clay-btn-primary text-white font-black text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Key size={17} />
              <span>تهیه لایسنس دائمی</span>
            </a>

            <a
              href="#ide-integration"
              className="px-5 py-3.5 rounded-btn clay-btn text-[var(--text-main)] font-bold text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Layers size={17} className="text-[var(--accent-primary)]" />
              <span>اتصال به ادیتور</span>
            </a>
          </div>
        </div>

        {/* Left Column: High-Craft 3D Matte Visual Showcase */}
        <div className="lg:col-span-6">
          <div className="clay-card-elevated rounded-card p-3 sm:p-4 space-y-3">
            <div className="rounded-2xl overflow-hidden clay-surface-inset aspect-[16/10] bg-[#0f172a]">
              <img
                src="/images/tarapol/hero-bridge.webp"
                alt="پل ارتباطی تَراپُل بین محیط کدنویسی و مدل‌های هوش مصنوعی"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="px-2 py-1 flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                اتصال لوکال روی پورت {portText}
              </span>
              <span className="font-mono text-[11px] text-[var(--text-dim)]" dir="ltr">
                Win · macOS · Linux
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
