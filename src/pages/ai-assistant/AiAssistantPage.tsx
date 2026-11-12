import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Layers,
  Wand2,
  FileText,
  Scale,
  Landmark,
  Dumbbell,
  GraduationCap,
  Lightbulb,
  Globe,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';

const PROMPT_EXAMPLES = [
  'یک ایمیل رسمی برای درخواست مرخصی استعلاجی بنویس.',
  'این متن را خلاصه کن و سه نکته کلیدی‌اش را جدا کن.',
  'برای من یک برنامه تمرینی سه روزه در هفته با تجهیزات خانگی بنویس.',
  'درباره یارانه معیشتی و شرایط دریافتش توضیح بده.',
  'یک لایحه ساده برای مطالبه طلب بنویس.'
];

const FAQS = [
  {
    q: 'دستیار هوش مصنوعی چیست؟',
    a: 'برنامه‌ای است که با مدل‌های زبانی پیشرفته به سوالات شما پاسخ می‌دهد، متن می‌نویسد و در کارهای روزمره کمک می‌کند.'
  },
  {
    q: 'تفاوت دستیار هوش مصنوعی با موتور جستجو چیست؟',
    a: 'موتور جستجو لینک نشان می‌دهد، اما دستیار هوش مصنوعی پاسخ مستقیم و متناسب با موقعیت شما ارائه می‌دهد.'
  },
  {
    q: 'آیا Dastyar AI رایگان است؟',
    a: 'بله. چت با مدل‌های پایه پس از ورود کاملاً رایگان و نامحدود است (و پیش از ورود ۱۵ پیام مهمان دارید). برای مدل‌های پیشرفته از پرداخت به‌ازای مصرف با کیف پول استفاده می‌شود.'
  },
  {
    q: 'آیا Dastyar AI به فارسی پاسخ می‌دهد؟',
    a: 'بله. تمام پاسخ‌ها به فارسی روان ارائه می‌شوند.'
  },
  {
    q: 'آیا از ایران قابل دسترسی است؟',
    a: 'بله. برای دسترسی مستقیم از ایران طراحی شده است.'
  }
];

export const AiAssistantPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setPageSeo({
      title: 'دستیار هوش مصنوعی چیست؟ راهنمای کامل | Dastyar AI',
      description: 'دستیار هوش مصنوعی چیست، چه کارهایی انجام می‌دهد و چطور از آن استفاده کنیم؟ راهنمای کامل + معرفی Dastyar AI.',
      canonical: `${window.location.origin}/ai-assistant`,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a
          }
        }))
      }
    });
  }, []);

  return (
    <div className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] flex flex-col justify-between transition-colors overflow-x-hidden" dir="rtl">
      <GlobalHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill-thick text-xs font-bold mb-4 shadow-sm select-none">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>راهنمای جامع هوش مصنوعی فارسی</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-[1.3] mb-5"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوش مصنوعی چیست؟
          </h1>

          <p
            className="text-base sm:text-lg text-[#525d75] dark:text-[#9aa5bc] leading-relaxed max-w-3xl mx-auto text-justify sm:text-center"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            دستیار هوش مصنوعی یک ابزار آنلاین است که با استفاده از مدل‌های زبانی پیشرفته، به سوالات شما پاسخ می‌دهد، متن می‌نویسد، اطلاعات را تحلیل می‌کند و در انجام کارهای روزمره کمک می‌کند. در این راهنما توضیح می‌دهیم دستیار هوش مصنوعی چیست، چه انواعی دارد، چه کارهایی انجام می‌دهد، و چطور می‌توانید از یک دستیار هوش مصنوعی فارسی مثل Dastyar AI استفاده کنید.
          </p>
        </div>

        {/* Section 1: Definition & How it works */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-4 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
            دستیار هوش مصنوعی چیست و چطور کار می‌کند؟
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed text-justify">
            <p>
              دستیار هوش مصنوعی برنامه‌ای است که با استفاده از مدل‌های زبانی پیشرفته، به سوالات شما پاسخ می‌دهد، متن می‌نویسد، اطلاعات را تحلیل می‌کند و در انجام کارهای روزمره کمک می‌کند. برخلاف موتور جستجو که فقط لینک نشان می‌دهد، دستیار هوش مصنوعی پاسخ مستقیم و متناسب با موقعیت شما ارائه می‌دهد و می‌تواند در چند نوبت گفتگو، درخواست شما را دقیق‌تر کند.
            </p>
            <p>
              این دستیارها بر پایه مدل‌های زبانی بزرگ کار می‌کنند: مدل، متن درخواست شما را تحلیل می‌کند، زمینه گفتگو را در نظر می‌گیرد و پاسخی تولید می‌کند که با درخواست شما همخوانی داشته باشد. هرچه درخواست شما دقیق‌تر و روشن‌تر باشد، پاسخ هم کاربردی‌تر خواهد بود.
            </p>
          </div>
        </section>

        {/* Section 2: Types of AI Assistants */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            انواع دستیار هوش مصنوعی
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl clay-surface">
              <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                دستیار عمومی:
              </strong>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                برای طیف وسیعی از کارها مثل نوشتن، ترجمه، خلاصه‌سازی و پاسخ به سوالات عمومی.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-surface">
              <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                دستیار تخصصی:
              </strong>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                برای یک حوزه مشخص مثل حقوق، مالی، پزشکی یا ورزش.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-surface">
              <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                دستیار فارسی و دستیار غیرفارسی:
              </strong>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                تفاوت اصلی در درک زبان، اصطلاحات و لحن است.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-surface">
              <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                دستیار متنی، صوتی و تصویری:
              </strong>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                بر اساس نوع ورودی و خروجی.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            Dastyar AI یک دستیار هوش مصنوعی فارسی و عمومی است که هم برای کارهای روزمره و هم برای کارهای تخصصی مثل تنظیم لایحه، استعلام یارانه و سهام، و برنامه تمرینی به کار می‌رود.
          </div>
        </section>

        {/* Section 3: Persian Difference */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-4 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-cyan-600 rounded-full" />
            یک دستیار هوش مصنوعی فارسی چه تفاوتی دارد؟
          </h2>

          <p className="text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed text-justify">
            بسیاری از مدل‌های جهانی وقتی با متن فارسی مواجه می‌شوند، پاسخ را به انگلیسی برمی‌گردانند یا لحن رسمی و ترجمه‌ای پیدا می‌کنند. یک دستیار هوش مصنوعی فارسی این مشکل را حل می‌کند: پاسخ را به فارسی روان می‌دهد، اصطلاحات رایج ایرانی را می‌فهمد، و ساختار جملات فارسی را رعایت می‌کند. این تفاوت در کارهای حساس‌تر — مثل نوشتن ایمیل اداری، تنظیم لایحه یا توضیح یک مفهوم تخصصی — بیشتر به چشم می‌آید.
          </p>
        </section>

        {/* Section 4: What Dastyar AI Does */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-emerald-600 rounded-full" />
            Dastyar AI چه کارهایی انجام می‌دهد؟
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">نوشتن و ویرایش:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  ایمیل اداری، پیام رسمی، متن تبلیغاتی، توضیحات محصول، پست شبکه اجتماعی، و بازنویسی متن با لحن دلخواه.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <Globe className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">ترجمه:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  ترجمه فارسی به انگلیسی و برعکس، با حفظ لحن و اصطلاحات تخصصی.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <Layers className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">خلاصه‌سازی:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  خلاصه کردن مقاله، قرارداد، یا گزارش طولانی در چند خط.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <Scale className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">تنظیم لایحه:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  کمک به نوشتن لایحه حقوقی، شکواییه، یا درخواست رسمی با ساختار درست.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <Landmark className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">استعلام یارانه و سهام:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  پاسخ به سوالات درباره یارانه معیشتی، وضعیت سهام، و اطلاعات مالی عمومی.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <Dumbbell className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">دستیار فیتنس:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  طراحی برنامه تمرینی، پیشنهاد رژیم غذایی، و پاسخ به سوالات ورزشی.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">یادگیری:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  توضیح مفاهیم پیچیده به زبان ساده، حل تمرین، و آماده‌سازی برای آزمون.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-surface flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-0.5">ایده‌پردازی:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  پیشنهاد نام برند، طرح محتوا، سناریو، و ایده پروژه.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Why Choose Dastyar AI */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-rose-600 rounded-full" />
            چرا Dastyar AI را انتخاب کنیم؟
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>چت رایگان و نامحدود:</strong> {toPersianDigits(15)} پیام مهمان بدون ورود و دسترسی نامحدود به مدل‌های پایه پس از ورود.</span>
            </div>

            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>پرداخت به‌ازای مصرف:</strong> کیف پول با اعتبار مادام‌العمر. بدون اشتراک اجباری.</span>
            </div>

            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span><strong>دسترسی مستقیم از ایران:</strong> بدون تغییر IP، با اتصال پایدار.</span>
            </div>

            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span><strong>فارسی روان:</strong> پاسخ‌ها به فارسی طبیعی و قابل استفاده، نه ترجمه ماشینی.</span>
            </div>

            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
              <span><strong>بدون محدودیت تحریمی:</strong> نیازی به کارت اعتباری خارجی یا شماره تلفن خارجی نیست.</span>
            </div>

            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm">
              <Wand2 className="w-4 h-4 text-purple-500 shrink-0" />
              <span><strong>ابزارهای کاربردی:</strong> چت، تنظیم لایحه، استعلام یارانه و سهام، دستیار فیتنس.</span>
            </div>

            <div className="p-3.5 rounded-xl clay-surface flex items-center gap-2.5 text-xs sm:text-sm sm:col-span-2">
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>چندکاناله:</strong> وب، PWA، ربات تلگرام، اپ اندروید کافه‌بازار.</span>
            </div>
          </div>
        </section>

        {/* Section 6: How to use (4 steps) */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-amber-500 rounded-full" />
            چطور از یک دستیار هوش مصنوعی استفاده کنیم؟
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl clay-surface">
              <div className="w-7 h-7 rounded-lg bg-blue-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(1)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">وارد صفحه چت شوید:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc]">
                روی دکمه «شروع گفتگوی رایگان» بزنید.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-surface">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(2)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">سوال یا درخواستتان را به فارسی بنویسید:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc]">
                هرچه دقیق‌تر، پاسخ بهتر.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-surface">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(3)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">پاسخ را بخوانید و ادامه دهید:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc]">
                می‌توانید بپرسید «بیشتر توضیح بده» یا «لحنش را رسمی‌تر کن».
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-surface">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(4)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">نتیجه را کپی یا ذخیره کنید:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc]">
                پاسخ‌ها را می‌توانید مستقیماً در کارتان استفاده کنید.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Sample Prompts */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-purple-600 rounded-full" />
            نمونه پرامپت‌هایی که می‌توانید امتحان کنید
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {PROMPT_EXAMPLES.map((promptText, idx) => (
              <Link
                key={idx}
                to={`/chat?prompt=${encodeURIComponent(promptText)}`}
                className="p-4 rounded-2xl clay-surface hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-[#0f1420] dark:text-white">
                    «{promptText}»
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold shrink-0">
                  <span>امتحان در چت</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 8: FAQs */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-teal-600 rounded-full" />
            سوالات متداول
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl clay-surface overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4.5 flex items-center justify-between gap-3 text-right cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#0f1420] dark:text-white flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#525d75] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed border-t border-black/5 dark:border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Footer */}
        <section className="clay-card-thick p-8 sm:p-10 rounded-3xl text-center mb-8 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10">
          <p className="text-base sm:text-lg font-bold text-[#0f1420] dark:text-white mb-6">
            همین حالا Dastyar AI را امتحان کنید.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-3 px-8 py-3.5 clay-btn-primary font-bold text-white rounded-2xl shadow-lg hover:scale-105 transition-all"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span>چت با هوش مصنوعی فارسی رایگان</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AiAssistantPage;
