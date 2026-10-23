import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  Dumbbell,
  FileText,
  BookOpen,
  FileCheck,
  Code2,
  Languages,
  ArrowLeft,
  CheckCircle2,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';

interface PromptNiche {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
  prompt: string;
}

const HIGH_INTENT_NICHES: PromptNiche[] = [
  {
    id: 'legal',
    title: 'تنظیم لایحه و دادخواست قضایی',
    subtitle: 'نگارش متون حقوقی مستند به مواد قانون مدنی',
    badge: 'حقوقی و قضایی',
    icon: Scale,
    color: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-400/15',
    prompt: 'یک لایحه دفاعیه مستدل و رسمی برای ارائه به دادگاه با استناد به قوانین حقوقی موضوعه ایران و لحن متقن قضایی برای موضوع زیر تنظیم کن:\n\n[موضوع و شرح خلاصه ادعا]'
  },
  {
    id: 'skincare',
    title: 'روتین تخصصی سلامت پوست و مو',
    subtitle: 'مشاوره علمی مراقبت روز و شب و ترکیبات مؤثر',
    badge: 'سلامت و زیبایی',
    icon: Sparkles,
    color: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 dark:bg-rose-400/15',
    prompt: 'لطفاً بر اساس مشخصات پوست و موی من (نوع پوست: چرب/خشک/مختلط، دغدغه: جوش/لک/منافذ/ریزش مو)، یک روتین مراقبت روز و شب علمی با ترتیب مصرف و تداخلات دارویی پیشنهاد کن:\n\n[نوع پوست و دغدغه اصلی شما]'
  },
  {
    id: 'fitness',
    title: 'برنامه بدنسازی و فیتنس شخصی',
    subtitle: 'برنامه تمرینی هفتگی بر اساس قد، وزن و هدف',
    badge: 'ورزش و تندرستی',
    icon: Dumbbell,
    color: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 dark:bg-amber-400/15',
    prompt: 'بر اساس مشخصات من (سن: [سن]، قد: [قد]، وزن: [وزن]، سابقه تمرین: [مبتدی/متوسط/پیشرفته]، هدف: [کاهش وزن/حجم/کات])، یک برنامه تمرینی هفتگی اختصاصی با نام دقیق حرکات، ست‌ها و تکرارها بنویس.'
  },
  {
    id: 'letters',
    title: 'نگارش نامه و ایمیل اداری',
    subtitle: 'نامه‌نگاری رسمی برای وام، استعفا و اداری',
    badge: 'مکاتبات سازمانی',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/15',
    prompt: 'یک نامه اداری رسمی، محترمانه و اصولی خطاب به [نام یا عنوان مقام مسئول] جهت طرح درخواست [موضوع درخواست: مثلاً وام/مرخصی/انتقال] با تشریفات اداری بنویس.'
  },
  {
    id: 'academic',
    title: 'خلاصه‌سازی مقالات و اسناد PDF',
    subtitle: 'استخراج نکات کلیدی، چکیده و ترجمه مفهومی',
    badge: 'پژوهش دانشگاهی',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15',
    prompt: 'این مقاله علمی و متن تخصصی را در قالب ۵ نکته کلیدی، کاربردی و با بیانی ساده، مفهومی و دانشگاهی برای من خلاصه و تحلیل کن:\n\n[متن یا چکیده مقاله]'
  },
  {
    id: 'contracts',
    title: 'تدوین قرارداد و توافق‌نامه کاری',
    subtitle: 'پیش‌نویس قرارداد محرمانگی، فریلنسری و همکاری',
    badge: 'قراردادهای تجاری',
    icon: FileCheck,
    color: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-500/10 dark:bg-teal-400/15',
    prompt: 'یک پیش‌نویس استاندارد قرارداد کاری دوجانبه برای [نوع همکاری: فریلنسری/شراکت/استخدام] با درج تعهدات طرفین، شروط محرمانگی (NDA)، نحوه حل اختلاف و ضمانت اجرا تدوین کن.'
  },
  {
    id: 'coding',
    title: 'برنامه‌نویسی و رفع خطای کد',
    subtitle: 'دیباگ، تبدیل زبان و بهینه‌سازی کدهای نرم‌افزار',
    badge: 'مهندسی نرم‌افزار',
    icon: Code2,
    color: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-400/15',
    prompt: 'کد زیر را بررسی کن، باگ‌ها و خطاهای عملکردی آن را پیدا کرده و نسخه بهینه‌شده، تمیز و کامنت‌گذاری‌شده آن را به زبان [نام زبان برنامه‌نویسی] به من تحویل بده:\n\n[قطعه کد]'
  },
  {
    id: 'translation',
    title: 'ترجمه تخصصی و بدون لغزش',
    subtitle: 'برگردان سلیس و مفهومی متون با رعایت اصطلاحات',
    badge: 'زبان‌های بین‌المللی',
    icon: Languages,
    color: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 dark:bg-violet-400/15',
    prompt: 'متن تخصصی زیر را بدون ترجمه مکانیکی و واژه‌به‌واژه، با نثری کاملاً روان، دقیق، اصیل و متناسب با ادبیات تخصصی موضوع به فارسی ترجمه کن:\n\n[متن جهت ترجمه]'
  }
];

export const LandingPage: React.FC = () => {
  useEffect(() => {
    const softwareSchema = {
      '@type': 'SoftwareApplication',
      name: 'دستیار هوشمند | چت با هوش مصنوعی فارسی',
      applicationCategory: 'UtilityApplication, BusinessApplication',
      operatingSystem: 'Web, Android, iOS, Windows, macOS',
      inLanguage: 'fa-IR',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'IRR',
        availability: 'https://schema.org/InStock'
      },
      featureList: [
        'تنظیم لایحه و دادخواست حقوقی دادگاه با هوش مصنوعی',
        'مشاوره علمی روتین سلامت پوست و مو',
        'برنامه تمرینی بدنسازی و فیتنس شخصی',
        'نگارش نامه‌ها و مکاتبات رسمی اداری',
        'خلاصه‌سازی مقالات علمی و متون تخصصی PDF',
        'تدوین پیش‌نویس قراردادهای کاری و تجاری',
        'کدنویسی، دیباگ و بهینه‌سازی برنامه‌ها',
        'ترجمه تخصصی و سلیس متون بین‌المللی',
        'دسترسی مستقیم بدون محدودیت‌های تحریم',
        'سهمیه رایگان روزانه برای کلیه کاربران'
      ]
    };

    const faqSchema = {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'آیا استفاده از دستیار هوشمند رایگان است؟',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'بله، دستیار هوشمند روزانه سهمیه گفتگوی کاملاً رایگان برای تمام کاربران در نظر گرفته است و شروع کار نیازی به پرداخت وجه یا وارد کردن اطلاعات کارت بانکی ندارد.'
          }
        },
        {
          '@type': 'Question',
          name: 'آیا برای دسترسی به مدل‌ها به ابزارهای جانبی یا دور زدن تحریم نیاز است؟',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'خیر، سرورهای پردازشی پلتفرم ارتباطی مستقیم، پایدار و پرسرعت برای کاربران در سراسر ایران بدون محدودیت‌های منطقه‌ای فراهم ساخته‌اند.'
          }
        },
        {
          '@type': 'Question',
          name: 'دستیار هوشمند از چه مدل‌هایی پشتیبانی می‌کند؟',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'پلتفرم از پیشرفته‌ترین مدل‌های روز جهان از جمله Claude 3.5 Sonnet، GPT-4o، Google Gemini و DeepSeek به زبان فارسی پشتیبانی می‌نماید.'
          }
        }
      ]
    };

    setPageSeo({
      title: 'دستیار هوشمند | چت با هوش مصنوعی رایگان، تنظیم لایحه، روتین پوست و کدنویسی',
      description: 'دسترسی مستقیم و بدون تحریم به مدل‌های هوش مصنوعی Claude 3.5، GPT-4o و Gemini به زبان فارسی. تنظیم لایحه قضایی، روتین پوست و مو، برنامه بدنسازی، نگارش نامه اداری و برنامه‌نویسی.',
      keywords: 'هوش مصنوعی فارسی, چت با هوش مصنوعی, تنظیم لایحه با هوش مصنوعی, دادخواست حقوقی, روتین پوست و مو, برنامه بدنسازی با هوش مصنوعی, نگارش نامه اداری, خلاصه مقاله علمی, دستیار هوشمند, هوش مصنوعی بدون تحریم',
      canonical: 'https://dastyarai.com/',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [softwareSchema, faqSchema]
      }
    });
  }, []);

  return (
    <div
      className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] selection:clay-surface selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors overflow-x-hidden flex flex-col justify-between"
      dir="rtl"
    >
      {/* 1. Global Navigation Header */}
      <GlobalHeader />

      <main id="main-content" className="flex-1 flex flex-col justify-center py-8 sm:py-14 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {/* 2. Hero Section: Focused, Minimal, High-Impact */}
        <section className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill-thick text-xs font-bold mb-5 select-none shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#0f1420] dark:text-[#e4e7ee]">
              اتصال مستقیم، پرسرعت و پایدار از سراسر ایران
            </span>
          </div>

          {/* Magnetic Primary Headline */}
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-[1.3] py-2 px-1 mb-4"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوشمند؛ هوش مصنوعی پیشرفته، بدون مرز و به زبان فارسی
          </h1>

          {/* Subtitle */}
          <p
            className="text-xs sm:text-sm md:text-base text-[#525d75] dark:text-[#9aa5bc] font-normal leading-relaxed mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            دسترسی مستقیم، آنی و پایدار به قدرتمندترین مدل‌های جهان بدون محدودیت‌های تحریمی
          </p>

          {/* Primary Radiant Call-to-Action (CTA) */}
          <div className="flex flex-col items-center justify-center gap-3.5">
            <Link
              to="/chat"
              aria-label="شروع گفتگوی رایگان با دستیار هوشمند"
              className="group relative inline-flex items-center justify-center gap-3 px-9 py-4 clay-btn-primary-thick font-black text-sm sm:text-base text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              <span>شروع گفتگوی رایگان</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
            </Link>

            {/* Reassurance Trust Anchor */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-[#525d75] dark:text-[#9aa5bc] pt-1 select-none">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>کاملاً رایگان برای شروع</span>
              </span>
              <span className="opacity-30 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>بدون نیاز به کارت بانکی</span>
              </span>
              <span className="opacity-30 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>پاسخ‌دهی آنی</span>
              </span>
            </div>
          </div>
        </section>

        {/* 3. 8 High-Intent Interactive Quick Starters (Option B) */}
        <section aria-label="ابزارهای هوشمند پرکاربرد" className="w-full mb-12">
          <div className="text-center mb-6">
            <span
              className="text-xs sm:text-sm font-bold text-[#525d75] dark:text-[#9aa5bc] inline-flex items-center gap-2"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <span>امروز می‌خواهید چه کاری برایتان انجام شود؟ روی هر موضوع کلیک کنید:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {HIGH_INTENT_NICHES.map((niche) => {
              const IconComp = niche.icon;
              return (
                <Link
                  key={niche.id}
                  to={`/chat?prompt=${encodeURIComponent(niche.prompt)}`}
                  className="group relative p-4 rounded-2xl clay-card hover:clay-card-elevated transition-all duration-300 flex flex-col justify-between text-right cursor-pointer hover:-translate-y-1 active:scale-[0.98] border border-black/5 dark:border-white/5"
                >
                  <div>
                    {/* Top row: Icon + Category Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-xl ${niche.iconBg} ${niche.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="type-badge font-bold px-2.5 py-0.5 rounded-full clay-pill-thick text-[11px] text-[#525d75] dark:text-[#9aa5bc]">
                        {niche.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      className="font-bold text-sm text-[#0f1420] dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      style={{ fontFamily: "'Estedad', sans-serif" }}
                    >
                      {niche.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed line-clamp-2">
                      {niche.subtitle}
                    </p>
                  </div>

                  {/* Micro Action Indicator */}
                  <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                    <span>آماده‌سازی پرامپت در چت</span>
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. Minimal Models Bar (Logos Bar) */}
        <section aria-label="مدل‌های هوش مصنوعی پشتیبانی‌شده" className="max-w-4xl mx-auto w-full pt-4">
          <div className="clay-card-thick p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
            <div className="text-xs font-bold text-[#525d75] dark:text-[#9aa5bc] shrink-0" style={{ fontFamily: "'Estedad', sans-serif" }}>
              مجهز به پیشرفته‌ترین مدل‌های هوش مصنوعی جهان:
            </div>

            {/* Model Badges with sleek vector SVGs */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-3.5">
              {/* Claude 3.5 */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#d97757] shrink-0">
                  <path d="M18.8 20.5H22L12 3H8.8L-0 20.5H3.2L12 4.6L18.8 20.5ZM12.2 16.5H15.4L13.8 13.3L12.2 16.5Z"/>
                </svg>
                <span>Claude 3.5 Sonnet</span>
              </div>

              {/* GPT-4o */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#10a37f] shrink-0">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A6.0651 6.0651 0 0 0 19.0192 19.818a5.9847 5.9847 0 0 0 3.9977-2.9 6.0462 6.0462 0 0 0-.735-7.0968zM8.7505 18.2588a4.5078 4.5078 0 0 1-2.4828-4.2238l.0047-.1165 4.5492 2.627v5.253a4.5204 4.5204 0 0 1-2.0711-3.5397zm-3.518-7.9044a4.5078 4.5078 0 0 1 1.0506-4.739 4.4962 4.4962 0 0 1 3.5332-1.2828L5.2671 6.959v5.254l-4.5492-2.6264zm10.0526-7.234a4.5078 4.5078 0 0 1 4.2238 2.4828 4.4962 4.4962 0 0 1-.225 3.7388L14.7347 6.716 10.1855 4.089v-5.253a4.5078 4.5078 0 0 1 5.1016 1.8344zm3.4897 7.9044a4.5078 4.5078 0 0 1-1.0506 4.739 4.4962 4.4962 0 0 1-3.5332 1.2828l4.5492-2.6264V9.022l4.5492 2.6264zm-10.0526 7.234a4.5078 4.5078 0 0 1-4.2238-2.4828 4.4962 4.4962 0 0 1 .225-3.7388L9.2653 17.284 13.8145 19.911v5.253a4.5078 4.5078 0 0 1-5.1016-1.8344zM16.3262 10.038l-4.269 2.4646-4.269-2.4646V5.109l4.269 2.4646 4.269-2.4646v4.929z" />
                </svg>
                <span>GPT-4o</span>
              </div>

              {/* Gemini */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#4285f4] shrink-0">
                  <path d="M12.025 24C12.025 17.5 17.5 12.025 24 12.025C17.5 12.025 12.025 6.5 12.025 0C12.025 6.5 6.5 12.025 0 12.025C6.5 12.025 12.025 17.5 12.025 24Z"/>
                </svg>
                <span>Gemini 2.0</span>
              </div>

              {/* DeepSeek */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#0066ff] shrink-0">
                  <path d="M12 21.5c-5.238 0-9.5-4.262-9.5-9.5S6.762 2.5 12 2.5s9.5 4.262 9.5 9.5-4.262 9.5-9.5 9.5zm0-17C7.86 4.5 4.5 7.86 4.5 12s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zM12 17c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"/>
                </svg>
                <span>DeepSeek V3</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Standard Global Footer (eNamad, Blog, Store, Policies) */}
      <Footer />
    </div>
  );
};
