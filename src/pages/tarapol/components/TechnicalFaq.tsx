import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Key, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TECHNICAL_FAQS } from '../data/tarapolContent';

export const TechnicalFaq: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section id="faq-section" className="py-4 scroll-mt-24 space-y-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
            <HelpCircle size={14} />
            <span>پاسخ‌های شفاف</span>
          </span>
          <h2
            className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            سوالات متداول خریداران
          </h2>
        </div>

        <div className="space-y-3">
          {TECHNICAL_FAQS.map((item, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div key={item.q} className="clay-card rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-right cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm font-black text-[var(--text-main)]">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed border-t border-subtle">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Conversion CTA */}
      <div className="clay-card-elevated rounded-card p-6 sm:p-9 text-center space-y-4 max-w-3xl mx-auto">
        <h3
          className="text-xl sm:text-2xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          شورای مدل‌های برتر را به محیط کدنویسی خود بیاورید
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          با یک بار تهیه لایسنس تَراپُل، برای همیشه از هزینه‌های دلاری API بی‌نیاز شوید و با اطمینان بیشتر کدنویسی کنید.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
          <a
            href="#pricing-section"
            className="px-6 py-3.5 rounded-btn clay-btn-primary text-white font-black text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Key size={17} />
            <span>انتخاب پلن و دریافت آنی</span>
          </a>
          <Link
            to="/contact"
            className="px-5 py-3.5 rounded-btn clay-btn text-[var(--text-main)] font-bold text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            <span>سوالی دارید؟ تماس با پشتیبانی</span>
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* GEO / SEO Internal Links to Educational Guide & Release Post */}
        <div className="pt-4 border-t border-subtle flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[var(--text-muted)]">
          <Link to="/blog/tarapol-ai-council-guide" className="hover:text-[var(--accent-primary)] transition-colors">
            راهنمای آموزشی تشکیل شورای هوش مصنوعی با تَراپُل ←
          </Link>
          <span className="text-[var(--text-dim)]">·</span>
          <Link to="/blog/tarapol-v2-1-release" className="hover:text-[var(--accent-primary)] transition-colors">
            معرفی کامل نسخه ۲.۱ تَراپُل ←
          </Link>
        </div>
      </div>
    </section>
  );
};
