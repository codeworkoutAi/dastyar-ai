import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  Dumbbell,
  FileText,
  BookOpen,
  FileCheck,
  Code2,
  Languages,
  Landmark,
  ArrowLeft,
  CheckCircle2,
  Zap,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Wallet,
  Send,
  Smartphone,
  Store,
  Globe
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';

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
    id: 'subsidies',
    title: 'استعلام یارانه، کالابرگ و سهام عدالت',
    subtitle: 'زمان واریز، دهک‌بندی خانوار و سود سهام با جستجوی زنده وب',
    badge: 'معیشتی و بانکی',
    icon: Landmark,
    color: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15',
    prompt: 'آخرین اخبار و وضعیت رسمی درباره [زمان واریز یارانه این ماه / کالابرگ الکترونیک و سبد معیشتی / سود سهام عدالت] را به همراه نحوه استعلام با کد ملی و پیوند سامانه‌های رسمی برای من توضیح بده.'
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

const WHY_DASTYAR_CARDS = [
  {
    id: 'free-quota',
    title: 'چت رایگان و نامحدود',
    text: `${toPersianDigits(15)} پیام مهمان بدون ورود و چت نامحدود با مدل‌های پایه پس از ورود.`,
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/15'
  },
  {
    id: 'pay-as-you-go',
    title: 'پرداخت به‌ازای مصرف',
    text: 'کیف پول با اعتبار مادام‌العمر. بدون اشتراک اجباری، بدون هزینه پنهان.',
    icon: Wallet,
    color: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15'
  },
  {
    id: 'telegram-bot',
    title: 'ربات تلگرام',
    text: 'همین دستیار در تلگرام. دسترسی سریع بدون باز کردن مرورگر.',
    icon: Send,
    color: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/10 dark:bg-sky-400/15'
  },
  {
    id: 'pwa',
    title: 'قابل نصب (PWA)',
    text: 'روی گوشی نصب کنید، مثل یک اپ native. بدون نیاز به Play Store.',
    icon: Smartphone,
    color: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 dark:bg-violet-400/15'
  },
  {
    id: 'android-app',
    title: 'اپ اندروید',
    text: 'نسخه رسمی در کافه‌بازار با پرداخت بازارپی.',
    icon: Store,
    color: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 dark:bg-amber-400/15'
  },
  {
    id: 'web-search',
    title: 'پاسخ با داده‌های تازه وب',
    text: 'جستجوی زنده + دانش مدل، در یک پاسخ منسجم.',
    icon: Globe,
    color: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-400/15'
  }
];

export const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const incomingPrompt = searchParams.get('prompt');
  const chatCtaUrl = incomingPrompt && incomingPrompt.trim()
    ? `/chat?prompt=${encodeURIComponent(incomingPrompt.trim())}`
    : '/chat';

  useEffect(() => {
    const softwareSchema = {
      '@type': 'SoftwareApplication',
      name: 'Dastyar AI | دستیار هوش مصنوعی فارسی',
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
        'استعلام زمان واریز یارانه، کالابرگ الکترونیک و سود سهام عدالت',
        'مشاوره علمی روتین سلامت پوست و مو',
        'برنامه تمرینی بدنسازی و فیتنس شخصی',
        'نگارش نامه‌ها و مکاتبات رسمی اداری',
        'خلاصه‌سازی مقالات علمی و متون تخصصی PDF',
        'تدوین پیش‌نویس قراردادهای کاری و تجاری',
        'کدنویسی، دیباگ و بهینه‌سازی برنامه‌ها',
        'ترجمه تخصصی و سلیس متون بین‌المللی',
        'دسترسی مستقیم بدون محدودیت‌های تحریم',
        'چت رایگان و نامحدود با مدل‌های پایه برای کلیه کاربران'
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
            text: 'بله، دستیار هوشمند برای شروع ۱۵ پیام مهمان بدون ثبت‌نام و پس از ورود چت کاملاً رایگان و نامحدود با مدل‌های پایه ارائه می‌دهد.'
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
          name: 'دستیار هوشمند از چه قابلیت‌هایی پشتیبانی می‌کند؟',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'پلتفرم از پیشرفته‌ترین قابلیت‌های هوش مصنوعی شامل چت فارسی، برنامه‌نویسی، تحلیل اسناد و بینایی ماشین پشتیبانی می‌نماید.'
          }
        }
      ]
    };

    setPageSeo({
      title: 'Dastyar AI | دستیار هوش مصنوعی فارسی — چت، کد، اسناد',
      description: 'با Dastyar AI رایگان شروع کنید: چت رایگان و نامحدود با مدل‌های پایه + پرداخت به‌ازای مصرف برای مدل‌های پیشرفته. چت، برنامه‌نویسی، تحلیل اسناد و تصویر به فارسی.',
      keywords: 'استعلام یارانه این ماه, سود سهام عدالت با کد ملی, کالابرگ الکترونیک, تنظیم لایحه با هوش مصنوعی, دادخواست حقوقی, روتین پوست و مو, برنامه بدنسازی با هوش مصنوعی, نگارش نامه اداری, چت هوش مصنوعی فارسی, هوش مصنوعی بدون تحریم, دستیار هوشمند',
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
            className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-snug py-1 px-1 mb-2"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوش مصنوعی فارسی | Dastyar AI
          </h1>

          {/* Subtitle / Preserved High-Ranking Headline as H2 */}
          <h2
            className="text-sm sm:text-base md:text-lg font-bold text-[#334155] dark:text-[#cbd5e1] leading-normal py-1 px-1 mb-4"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوشمند؛ هوش مصنوعی پیشرفته، بدون مرز و به زبان فارسی
          </h2>

          {/* Subtitle */}
          <p
            className="text-xs sm:text-sm md:text-base text-[#525d75] dark:text-[#9aa5bc] font-normal leading-relaxed mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            دسترسی مستقیم، آنی و پایدار به قدرتمندترین فناوری‌های هوش مصنوعی بدون محدودیت‌های تحریمی
          </p>

          {/* Primary Radiant Call-to-Action (CTA) */}
          <div className="flex flex-col items-center justify-center gap-3.5">
            <Link
              to={chatCtaUrl}
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
                <span>چت رایگان و نامحدود پس از ورود</span>
              </span>
              <span className="opacity-30 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>پاسخ‌دهی آنی</span>
              </span>
            </div>

            {/* Educational Link to /ai-assistant */}
            <div className="pt-2 text-center">
              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>دستیار هوش مصنوعی چیست؟</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 3. چرا Dastyar AI؟ (6 Cards Section) */}
        <section aria-label="چرا Dastyar AI؟" className="w-full mb-12 sm:mb-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2
              className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-2"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              چرا Dastyar AI؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {WHY_DASTYAR_CARDS.map((card) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  className="clay-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <IconComp className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div>
                      <h3
                        className="text-base sm:text-lg font-bold text-[#0f1420] dark:text-white mb-1.5"
                        style={{ fontFamily: "'Estedad', sans-serif" }}
                      >
                        {card.title}
                      </h3>
                      <p
                        className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed"
                        style={{ fontFamily: "'Vazirmatn', sans-serif" }}
                      >
                        {card.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. 8 High-Intent Interactive Quick Starters (Option B) */}
        <section aria-label="ابزارهای هوشمند پرکاربرد" className="w-full mb-12">
          <div className="text-center mb-6">
            <span
              className="text-xs sm:text-sm font-bold text-[#525d75] dark:text-[#9aa5bc] inline-flex items-center gap-2"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <span>امروز می‌خواهید چه کاری برایتان انجام شود؟ روی هر موضوع کلیک کنید:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* 4. Minimal Capabilities Bar */}
        <section aria-label="قابلیت‌های هوش مصنوعی" className="max-w-4xl mx-auto w-full pt-4">
          <div className="clay-card-thick p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
            <div className="text-xs font-bold text-[#525d75] dark:text-[#9aa5bc] shrink-0" style={{ fontFamily: "'Estedad', sans-serif" }}>
              مجهز به پیشرفته‌ترین فناوری‌های هوش مصنوعی:
            </div>

            {/* Capability Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <span>دستیار گفتگو و نگارش</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <Code2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>برنامه‌نویسی و کد</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <span>تحلیل اسناد و بینایی</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-surface text-xs font-bold text-[#0f1420] dark:text-white">
                <Zap className="w-4 h-4 text-rose-500 shrink-0" />
                <span>پردازش و جستجوی زنده</span>
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
