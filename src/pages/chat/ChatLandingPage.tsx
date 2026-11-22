import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, Sparkles, ShoppingBag, ShieldCheck, Zap, 
  HelpCircle, ChevronDown, ArrowLeft, CheckCircle2, MessageSquare
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { ShoppingAdvisorWidget } from '../../components/store/ShoppingAdvisorWidget';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';
import { useSettingsStore } from '../../store/settingsStore';

const CHAT_FAQS = [
  {
    q: 'آیا مشاوره و چت با مشاور هوشمند رایگان است؟',
    a: 'بله. استفاده از مشاور هوشمند آنلاین در این صفحه کاملاً رایگان و بدون نیاز به ثبت‌نام اولیه است و می‌توانید تمامی سوالات خود را درباره ابزارها، اکانت‌ها و مدل‌های هوش مصنوعی بپرسید.'
  },
  {
    q: 'مشاور هوشمند در چه زمینه‌هایی راهنمایی ارائه می‌دهد؟',
    a: 'مشاور هوشمند در زمینه انتخاب بهترین اکانت بر اساس نیاز شغلی شما (برنامه‌نویسی، تولید محتوا، طراحی و گرافیک، ترید، ترجمه و مقالات دانشگاهی)، مقایسه ابزارها، و بررسی هزینه‌ها و پلن‌ها شما را راهنمایی می‌کند.'
  },
  {
    q: 'آیا اکانت‌های پیشنهادی قانونی و با ضمانت هستند؟',
    a: 'بله. تمامی اکانت‌ها و لایسنس‌های موجود در فروشگاه Dastyar AI به صورت کاملاً قانونی، فعال‌سازی روی ایمیل اختصاصی کاربر و همراه با ضمانت تعویض و گارانتی در تمام مدت اشتراک ارائه می‌شوند.'
  },
  {
    q: 'پس از انتخاب اکانت، تحویل سفارش چقدر زمان می‌برد؟',
    a: 'محصولات آنی به محض پرداخت تحویل داده می‌شوند و اکانت‌های اختصاصی ظرف مدت ۱ تا ۲۴ ساعت کاری پس از ثبت سفارش با هماهنگی کامل فعال و تقدیم شما می‌گردند.'
  },
  {
    q: 'روش‌های پرداخت به چه صورت است؟',
    a: 'پرداخت آنلاین امن و مستقیم از طریق شبکه بانکی شاپرک با کلیه کارت‌های عضو شتاب، و همچنین پرداخت به صورت کارت‌به‌کارت با ارسال رسید پشتیبانی می‌شود.'
  }
];

const FEATURED_PRODUCTS = [
  {
    id: 29,
    slug: 'خرید-اکانت-قانونی-gemini-pro-و-gemini-advanced-فول-اختصاصی',
    title: 'اکانت اختصاصی هوش مصنوعی پیشرفته (Pro)',
    badge: 'فول اختصاصی جیمیل',
    price: 799000,
    features: ['دسترسی نامحدود به مدل‌های زبانی روز', 'پردازش اسناد حجیم و ویدیو', 'فعال‌سازی ۱۰۰٪ قانونی روی ایمیل شما']
  },
  {
    id: 30,
    slug: 'خرید-اکانت-قانونی-chatgpt-plus-اختصاصی-با-کردیت-codex',
    title: 'اکانت قانونی Plus اختصاصی (با کردیت کدنویسی)',
    badge: 'اختصاصی + کردیت CODEX',
    price: 799000,
    features: ['محیط تخصصی کدنویسی و تحلیل داده', 'اولویت دسترسی در ساعات شلوغی', 'تضمین پایداری و بدون قطعی']
  },
  {
    id: 32,
    slug: 'کردیت-اختصاصی-claude-و-gpt-ویژه-api-ادیتورها-و-n8n',
    title: 'کردیت اختصاصی API (ویژه ادیتورها و توسعه)',
    badge: 'کلید API معتبر',
    price: 999000,
    features: ['اتصال به VS Code، Cursor و n8n', 'پینگ عالی و دسترسی مستقیم', 'بدون محدودیت آی‌پی']
  }
];

export const ChatLandingPage: React.FC = () => {
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    setPageSeo({
      title: 'مشاور هوشمند و چت با هوش مصنوعی فارسی رایگان | Dastyar AI',
      description: 'راهنمای هوشمند و رایگان برای انتخاب و خرید بهترین اکانت‌های هوش مصنوعی، پاسخ آنی به سوالات و مشاوره آنلاین تخصصی به زبان فارسی.',
      canonical: `${window.location.origin}/chat`,
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: 'مشاور هوشمند و چت با هوش مصنوعی فارسی رایگان | Dastyar AI',
            description: 'راهنمای هوشمند و رایگان برای انتخاب و خرید بهترین اکانت‌های هوش مصنوعی، پاسخ آنی به سوالات و مشاوره آنلاین تخصصی به زبان فارسی.',
            url: `${window.location.origin}/chat`
          },
          {
            '@type': 'FAQPage',
            mainEntity: CHAT_FAQS.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.a
              }
            }))
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: 'مشاور هوشمند گفتگو', item: `${window.location.origin}/chat` }
            ]
          }
        ]
      }
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300">
      <GlobalHeader />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-10 max-w-[1200px]">
        {/* Top Hero Section */}
        <div className="text-center mb-8 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-surface border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-bold shadow-xs">
            <Sparkles size={14} className="animate-pulse" />
            <span>مشاور هوشمند و دستیار انتخاب ابزارهای AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight leading-tight">
            دستیار گفتگو و مشاور هوشمند هوش مصنوعی
          </h1>

          <p className="text-xs sm:text-base text-[var(--text-muted)] leading-relaxed">
            پاسخ سریع به سوالات شما، راهنمای دقیق انتخاب بهترین اکانت‌های قانونی هوش مصنوعی متناسب با نیاز کاری و مشاوره رایگان به زبان فارسی
          </p>
        </div>

        {/* Embedded Interactive Shopping Advisor Container */}
        <div className="mb-12 max-w-4xl mx-auto">
          <ShoppingAdvisorWidget isEmbedded={true} defaultOpen={true} />
        </div>

        {/* Store Conversion Banner / Recommended Accounts */}
        <section className="mb-14">
          <div className="p-6 sm:p-8 rounded-3xl clay-card-thick border border-[var(--card-border)] shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--card-border)]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
                    نیاز به اکانت‌های اختصاصی بدون محدودیت دارید؟
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  فعال‌سازی ۱۰۰٪ قانونی، بدون قطعی، تحویل فوری و گارانتی تعویض در فروشگاه Dastyar AI
                </p>
              </div>

              <Link
                to="/store"
                className="px-5 py-2.5 clay-btn-primary font-bold text-xs sm:text-sm rounded-xl shrink-0 flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all"
              >
                <ShoppingBag size={15} />
                <span>مشاهده کاتالوگ فروشگاه</span>
                <ArrowLeft size={15} />
              </Link>
            </div>

            {/* Featured Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURED_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 sm:p-5 rounded-2xl clay-card border border-[var(--card-border)] flex flex-col justify-between hover:scale-[1.01] transition-transform"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                        {prod.badge}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        ضمانت اصالت
                      </span>
                    </div>

                    <h3 className="font-black text-sm text-[var(--text-main)] mb-3 leading-snug">
                      {prod.title}
                    </h3>

                    <ul className="space-y-1.5 mb-4">
                      {prod.features.map((feat, fIdx) => (
                        <li key={fIdx} className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-[var(--card-border)]/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">قیمت:</span>
                      <span className="text-xs sm:text-sm font-black text-[var(--color-accent-primary)] font-price">
                        {usePersianDigits ? toPersianDigits(prod.price.toLocaleString('fa-IR')) : prod.price.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    <Link
                      to={`/store/product/${prod.id}/${prod.slug}`}
                      className="px-3.5 py-1.5 clay-btn font-bold text-xs rounded-xl flex items-center gap-1 hover:text-indigo-600 transition-colors"
                    >
                      <span>مشاهده و خرید</span>
                      <ArrowLeft size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-10 max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)] mb-1">
              پرسش‌های متداول درباره مشاور هوشمند و خرید اکانت
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              پاسخ به سوالات متداول کاربران درباره خدمات، نحوه تحویل و نحوه کارکرد سیستم
            </p>
          </div>

          <div className="space-y-3">
            {CHAT_FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl clay-card border border-[var(--card-border)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-right flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-[var(--text-main)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={16} className="text-indigo-500 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--card-border)]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
export default ChatLandingPage;
