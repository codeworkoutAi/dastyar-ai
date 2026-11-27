import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Key, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TECHNICAL_FAQS } from '../data/tarapolContent';

export const TechnicalFaq: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section id="faq-section" className="py-4 scroll-mt-24 space-y-12">
      {/* Technical FAQ Accordion */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
            <HelpCircle size={14} />
            <span>پاسخ‌های شفاف فنی</span>
          </span>
          <h2
            className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            سوالات متداول توسعه‌دهندگان
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

      {/* Final Conversion CTA Card */}
      <div className="clay-card-elevated rounded-card p-6 sm:p-10 text-center space-y-5 max-w-4xl mx-auto">
        <h3
          className="text-xl sm:text-2xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          آماده‌اید شورای مدل‌های پرچمدار را وارد IDE خود کنید؟
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          با یک بار خرید لایسنس دائمی تَراپُل، برای همیشه از هزینه دلاری API بی‌نیاز شوید و کدهایتان را با هم‌فکری هم‌زمان دو مدل برتر بازبینی کنید.
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
            <span>سوال فنی دارید؟ تماس با پشتیبانی</span>
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
