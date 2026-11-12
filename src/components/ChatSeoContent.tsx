import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toPersianDigits } from '../lib/persianUtils';
import { Sparkles, HelpCircle, ArrowLeft, ChevronDown, CheckCircle2, MessageSquare } from 'lucide-react';

const SAMPLE_PROMPTS = [
  'یک ایمیل رسمی برای درخواست مرخصی بنویس.',
  'این پاراگراف را خلاصه کن: [متن]',
  'یک برنامه تمرینی هفتگی برای مبتدی‌ها بده.',
  'برای شروع یک کسب‌وکار کوچک، پنج ایده بده.',
  'این جمله را به انگلیسی روان ترجمه کن: [متن]',
];

const FAQS = [
  {
    q: 'آیا چت با Dastyar AI رایگان است؟',
    a: `بله. چت با مدل‌های پایه برای کاربران واردشده کاملاً رایگان و نامحدود است؛ برای مدل‌های پیشرفته از پرداخت به‌ازای مصرف استفاده می‌شود.`,
  },
  {
    q: 'آیا باید ثبت‌نام کنم؟',
    a: `برای ${toPersianDigits(15)} پیام اول نیازی نیست. برای ادامه گفتگوی نامحدود و ذخیره تاریخچه، ثبت‌نام با شماره موبایل یا گوگل.`,
  },
  {
    q: 'آیا می‌توانم هر سوالی به فارسی بپرسم؟',
    a: 'بله، هر سوالی دارید کافیست به فارسی بنویسید تا دستیار هوشمند پاسخ دقیق، مستقیم و روان به زبان فارسی ارائه دهد.',
  },
  {
    q: 'آیا پاسخ‌ها به فارسی هستند؟',
    a: 'بله. پاسخ‌ها به فارسی روان ارائه می‌شوند.',
  },
  {
    q: 'آیا از ایران قابل دسترسی است؟',
    a: 'بله، بدون محدودیت تحریمی.',
  },
  {
    q: 'آیا می‌توانم تاریخچه گفتگو را ذخیره کنم؟',
    a: 'بله، با ورود به حساب کاربری.',
  },
];

const STEPS = [
  'درخواستتان را به فارسی بنویسید — هرچه دقیق‌تر، پاسخ بهتر.',
  'پاسخ را بخوانید — می‌توانید بپرسید «بیشتر توضیح بده».',
  'گفتگو را ادامه دهید — هوش مصنوعی زمینه را به خاطر می‌سپارد.',
  'نتیجه را کپی کنید — پاسخ را در کار، ایمیل، یا پروژه‌تان استفاده کنید.',
];

export const ChatSeoContent: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handlePromptClick = (prompt: string) => {
    navigate(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <section aria-label="راهنمای چت هوش مصنوعی فارسی" className="w-full max-w-4xl mx-auto px-4 py-12 space-y-10 text-[var(--color-text-main)]">
      {/* 1. What is AI Chat? */}
      <div className="clay-card p-6 sm:p-8 rounded-card border border-[var(--color-border-subtle)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl clay-surface flex items-center justify-center text-blue-500 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-main)]">
            چت هوش مصنوعی چیست؟
          </h2>
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)]">
          چت هوش مصنوعی یک گفتگوی متنی بین شما و یک مدل زبانی پیشرفته است. شما سوال می‌پرسید، درخواست می‌کنید، یا متنی می‌فرستید؛ و هوش مصنوعی پاسخ می‌دهد. برخلاف جستجوی معمولی که فقط لینک نشان می‌دهد، چت هوش مصنوعی پاسخ مستقیم و متناسب با موقعیت شما ارائه می‌دهد.
        </p>
        <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)]">
          چت با هوش مصنوعی فارسی رایگان همان تجربه گفتگوی هوشمند را به زبان فارسی روان فراهم می‌کند: بدون نیاز به انگلیسی، بدون ترجمه دستی، و با درک اصطلاحات و لحن رایج فارسی. در Dastyar AI با {toPersianDigits(15)} پیام مهمان بدون ثبت‌نام شروع می‌کنید و پس از ورود به چت رایگان و نامحدود با مدل‌های پایه دسترسی دارید.
        </p>
      </div>

      {/* 2. How it works? */}
      <div className="clay-card p-6 sm:p-8 rounded-card border border-[var(--color-border-subtle)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl clay-surface flex items-center justify-center text-emerald-500 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-main)]">
            چطور کار می‌کند؟
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STEPS.map((step, idx) => (
            <div key={idx} className="clay-surface p-4 rounded-xl border border-[var(--color-border-subtle)] flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg clay-btn-primary flex items-center justify-center text-xs font-bold shrink-0">
                {toPersianDigits(idx + 1)}
              </span>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[var(--color-text-main)] pt-0.5">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sample Prompts */}
      <div className="clay-card p-6 sm:p-8 rounded-card border border-[var(--color-border-subtle)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl clay-surface flex items-center justify-center text-amber-500 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-main)]">
            نمونه پرامپت‌ها
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {SAMPLE_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(promptText)}
              className="clay-surface hover:clay-btn p-3.5 sm:p-4 rounded-xl border border-[var(--color-border-subtle)] flex items-center justify-between gap-3 text-right cursor-pointer transition-all hover:scale-[1.01] group"
            >
              <span className="text-xs sm:text-sm font-bold text-[var(--color-text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                «{promptText}»
              </span>
              <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>امتحان کنید</span>
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Frequently Asked Questions */}
      <div className="clay-card p-6 sm:p-8 rounded-card border border-[var(--color-border-subtle)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl clay-surface flex items-center justify-center text-indigo-500 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-main)]">
            سوالات متداول
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="clay-surface rounded-xl border border-[var(--color-border-subtle)] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-right font-bold text-xs sm:text-sm text-[var(--color-text-main)] cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed border-t border-[var(--color-border-subtle)] animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
