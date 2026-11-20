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
  GraduationCap,
  Lightbulb,
  Globe,
  Zap,
  ShieldCheck,
  Code2,
  Palette,
  Bot,
  ShoppingBag,
  Clock,
  CreditCard,
  Lock,
  Cpu,
  TrendingUp,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';

const ADVISOR_PROMPT_EXAMPLES = [
  'برای برنامه‌نویسی و پایتون کدوم اکانت بهتره؟',
  'تفاوت اکانت اختصاصی با اشتراکی چیه؟',
  'بهترین ابزار برای طراحی عکس و کارهای گرافیکی چیه؟',
  'برای تحلیل مقالات و اسناد سنگین پی‌دی‌اف کدوم رو پیشنهاد می‌دی؟',
  'نحوه تحویل و گارانتی اکانت‌ها به چه صورته؟'
];

const FAQS = [
  {
    q: 'دستیار هوش مصنوعی چیست و چه تفاوتی با موتور جستجو دارد؟',
    a: 'دستیار هوش مصنوعی سیستمی مبتنی بر مدل‌های زبانی پیشرفته است که سوالات شما را درک کرده، متن می‌نویسد، کدها را تحلیل و اشکال‌زدایی می‌کند و برخلاف موتور جستجو که صرفاً لینک صفحات وب را نمایش می‌دهد، پاسخ‌های دقیق، متناسب با زمینه و آماده به کار ارائه می‌کند.'
  },
  {
    q: 'تفاوت اکانت اختصاصی با اکانت‌های اشتراکی چیست؟',
    a: 'در اکانت اختصاصی، اشتراک مستقیماً روی ایمیل و حساب شخصی خودتان فعال می‌شود؛ بنابراین چت‌ها، پروژه‌ها و کدهای شما کاملاً محرمانه می‌ماند، خطر قطعی ناگهانی یا لغو اشتراک وجود ندارد، و محدودیت نرخ (Rate Limit) پیام‌ها را با سایر افراد شریک نمی‌شوید.'
  },
  {
    q: 'تحویل سفارش‌ها در Dastyar AI چقدر زمان می‌برد؟',
    a: 'تمامی سفارش‌های اکانت‌های قانونی ظرف مدت ۱ تا ۲۴ ساعت کاری پس از ثبت سفارش آماده شده و اطلاعات ورود یا فعال‌سازی از طریق پیامک، ایمیل و پنل کاربری در اختیارتان قرار می‌گیرد.'
  },
  {
    q: 'آیا اکانت‌های خریداری شده دارای گارانتی هستند؟',
    a: 'بله. تمامی محصولات و اشتراک‌های Dastyar AI دارای ضمانت اصالت و گارانتی تعویض در تمام طول مدت اعتبار اشتراک هستند. در صورت بروز هرگونه اختلال یا مشکل فنی، تیم پشتیبانی پاسخگوی شماست.'
  },
  {
    q: 'چگونه بهترین اکانت را متناسب با کارم انتخاب کنم؟',
    a: 'شما می‌توانید با استفاده از «مشاور هوشمند خرید» که در تمام صفحات سایت در دسترس است، تخصص و نیازهای خود (کدنویسی، تولید محتوا، طراحی، ترید یا کارهای دانشگاهی) را بیان کنید تا مشاور مناسب‌ترین اکانت و پکیج را به شما پیشنهاد دهد.'
  },
  {
    q: 'روش‌های پرداخت به چه صورت است؟',
    a: 'امکان پرداخت امن و مستقیم از طریق کلیه کارت‌های بانکی عضو شتاب در درگاه شاپرک فراهم است. همچنین امکان پرداخت از طریق کارت‌به‌کارت و ارسال سریع رسید در پنل یا تلگرام وجود دارد.'
  }
];

export const AiAssistantPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setPageSeo({
      title: 'دستیار هوش مصنوعی چیست؟ راهنمای انتخاب و خرید ابزارهای هوش مصنوعی | Dastyar AI',
      description: 'دستیار هوش مصنوعی چیست، چه کاربردهایی دارد و چطور بهترین اکانت قانونی هوش مصنوعی را متناسب با نیاز شغلی خود انتخاب و خریداری کنیم؟ راهنمای کامل Dastyar AI.',
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
            <span>راهنمای جامع شناخت، مقایسه و خرید ابزارهای هوش مصنوعی</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-snug mb-5"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوش مصنوعی چیست؟ راهنمای جامع انتخاب و کاربرد
          </h1>

          <p
            className="text-base sm:text-lg text-[#525d75] dark:text-[#9aa5bc] leading-relaxed max-w-3xl mx-auto text-justify sm:text-center"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            دستیارهای هوش مصنوعی سیستم‌های پیشرفته‌ای هستند که قادرند زبان انسان را عمیقاً درک کنند، به سوالات تخصصی پاسخ دهند، کدهای پیچیده برنامه‌نویسی را بنویسند، تصاویر هنری و واقعی خلق کنند و اسناد حجیم را در چند ثانیه تجزیه و تحلیل نمایند. در این راهنما، انواع ابزارهای هوش مصنوعی، تفاوت اکانت‌های قانونی با اشتراکی، و نحوه انتخاب بهترین ابزار برای تخصص کاری شما را بررسی می‌کنیم.
          </p>
        </div>

        {/* Section 1: Definition & Working Mechanism */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-4 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
            دستیار هوش مصنوعی چیست و چطور کار می‌کند؟
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed text-justify">
            <p>
              دستیار هوش مصنوعی یک محیط رایانشی مدرن بر پایه مدل‌های زبانی بزرگ (LLM) و سیستم‌های چندحالته (Multimodal) است. این دستیارها کلمات، دستورات و حتی تصاویر و اسنادی که بارگذاری می‌کنید را پردازش کرده و بر اساس بافت زمینه گفتگو، خروجی‌های ساختاریافته و کاربردی تولید می‌کنند.
            </p>
            <p>
              برخلاف موتورهای جستجوی سنتی که صرفاً فهرستی از وب‌سایت‌ها را پیش روی شما می‌گذارند، دستیار هوش مصنوعی محتوا را ترکیب، تحلیل و بازنویسی می‌کند؛ یعنی می‌توانید بگویید «این جدول داده‌ها را به نمودار یا کدهای پایتون تبدیل کن»، «این متن قرارداد را بررسی و بندهای پرریسک آن را خلاصه کن» یا «یک کمپین تبلیغاتی با ایده‌های خلاقانه بنویس».
            </p>
          </div>
        </section>

        {/* Section 2: Categories of AI Tools */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            انواع ابزارهای هوش مصنوعی در بازار جهانی
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2 mb-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Bot className="w-4 h-4" />
                <span>۱. دستیارهای جامع گفتگو و محیط‌های کاری (Chat & Workspace)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                مجهز به ویرایشگرهای تعاملی (مانند Canvas)، ابزار جستجوی زنده وب، تحلیل عمیق اسناد و ترجمه روان برای کارهای روزمره و حرفه‌ای.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2 mb-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                <span>۲. دستیارهای اختصاصی کدنویسی (Code Assistants)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                مخصوص برنامه‌نویسان با امکان تحلیل مخازن کد، پیشنهاد توابع، دیباگ خط‌به‌خط، بازنویسی معماری و ساخت خودکار تست‌ها.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2 mb-1.5 text-purple-600 dark:text-purple-400 font-bold text-sm">
                <Palette className="w-4 h-4" />
                <span>۳. موتورهای استودیویی طراحی و تصویر (Image Engines)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                خلق تصاویر باکیفیت و فوتورئال، رندرهای گرافیکی، بنرهای تبلیغاتی و ادیت‌های جزئی برای طراحان، معماران و کسب‌وکارها.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2 mb-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Cpu className="w-4 h-4" />
                <span>۴. توکن‌ها و کلیدهای API (Developer APIs)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                ارتباط مستقیم برنامه‌نویسی برای اتصال اسکریپت‌های پایتون، اتوماسیون فرآیندها (مانند n8n) و ساخت اپلیکیشن‌های هوش مصنوعی.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Which Account is Right For You? */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-cyan-600 rounded-full" />
            راهنمای انتخاب اکانت متناسب با تخصص شما
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3">
              <Code2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-1">برای برنامه‌نویسان و مهندسان نرم‌افزار:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  اگر به دنبال تحلیل کدهای طولانی، ویرایشگر تعاملی کد، یا اتصال به اسکریپت‌های پایتون هستید، اکانت‌های دارای محیط‌های کدنویسی تخصصی یا کلیدهای API توسعه‌دهنده بهترین بازدهی را برای شما به همراه دارند.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3">
              <Palette className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-1">برای طراحان و دیجیتال‌آرتیست‌ها:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  اگر هدف شما خلق تصاویر تبلیغاتی باکیفیت، رندرهای معماری یا کانسپت‌آرت است، اکانت‌های پریمیوم مجهز به موتورهای فوتورئال و استودیویی انتخابی بی‌نظیر هستند.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-1">برای تولیدکنندگان محتوا و کارشناسان سئو:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  اکانت‌های پیشرفته با قابلیت نگارش روان به زبان فارسی، خلاصه‌سازی و جستجوی لحظه‌ای به شما امکان نگارش مقالات تخصصی، سناریونویسی و بهینه‌سازی محتوا را می‌دهند.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#0f1420] dark:text-white mb-1">برای پژوهشگران، تحلیل‌گران و تریدرها:</strong>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  اگر نیاز به خواندن و استخراج نکات از کتاب‌ها و فایل‌های حجیم PDF، گزارش‌های مالی و داده‌های آماری دارید، اکانت‌های دارای بافتار متنی بالا (Context Window) بهترین همراه شما خواهند بود.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Dedicated vs Shared Accounts */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-rose-600 rounded-full" />
            چرا اکانت اختصاصی؟ (تفاوت حیاتی با اکانت‌های اشتراکی)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4.5 rounded-2xl clay-subcard border-r-4 border-emerald-500">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>اکانت اختصاصی قانونی (Dastyar AI)</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                <li>• فعال‌سازی مستقیم روی ایمیل و حساب شخصی شما</li>
                <li>• حفظ ۱۰۰٪ محرمانگی گفتگوها، فایل‌ها و پروژه‌ها</li>
                <li>• سهمیه و نرخ پیام کامل بدون رقابت با دیگران</li>
                <li>• پایداری دائمی همراه با گارانتی تعویض تا پایان دوره</li>
              </ul>
            </div>

            <div className="p-4.5 rounded-2xl clay-subcard border-r-4 border-rose-500">
              <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>اکانت‌های اشتراکی یا کرکی متفرقه</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                <li>• استفاده چند نفر ناشناس به صورت همزمان از یک حساب</li>
                <li>• خطر لو رفتن ایده‌ها، کدها و تاریخچه چت‌های خصوصی</li>
                <li>• تمام شدن سریع سهمیه پیام به خاطر استفاده سایرین</li>
                <li>• خطر دائمی مسدود شدن (Ban) بدون هیچ‌گونه گارانتی</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5: Shopping Advisor & Prompt Suggestions */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2
              className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white flex items-center gap-3"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <span className="w-2.5 h-6 bg-purple-600 rounded-full" />
              مشاور هوشمند خرید Dastyar AI؛ راهنمای ۲۴ ساعته انتخاب اکانت
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
            اگر مطمئن نیستید کدام ابزار برای زمینه کاری و بودجه شما مناسب‌تر است، می‌توانید سوال خود را از مشاور آنلاین بپرسید. روی نمونه سوالات زیر کلیک کنید تا پاسخ فوری دریافت نمایید:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {ADVISOR_PROMPT_EXAMPLES.map((promptText, idx) => (
              <Link
                key={idx}
                to={`/?advisor=open&prompt=${encodeURIComponent(promptText)}`}
                className="p-4 rounded-2xl clay-subcard hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Bot className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-[#0f1420] dark:text-white truncate">
                    «{promptText}»
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold shrink-0">
                  <span>مشورت با مشاور خرید</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 6: How to Buy in 4 Steps */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-amber-500 rounded-full" />
            مراحل خرید و فعال‌سازی در Dastyar AI
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl clay-subcard">
              <div className="w-7 h-7 rounded-lg bg-blue-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(1)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">انتخاب اکانت یا ابزار:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                محصول مورد نظر را در ویترین فروشگاه انتخاب کرده یا از مشاور هوشمند کمک بگیرید.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(2)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">پرداخت امن و سریع:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                از طریق کلیه کارت‌های عضو شتاب در درگاه شاپرک یا انتقال کارت‌به‌کارت پرداخت کنید.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(3)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">فعال‌سازی ظرف ۱ تا ۲۴ ساعت:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                اکانت به صورت کاملاً قانونی روی ایمیل شما فعال و اطلاعات ورود ارسال می‌شود.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs mb-2">
                {toPersianDigits(4)}
              </div>
              <strong className="block text-sm text-[#0f1420] dark:text-white mb-1">استفاده پایدار با گارانتی کامل:</strong>
              <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                در تمام طول مدت اشتراک، پشتیبانی فنی و ضمانت اصالت همراه شماست.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: FAQs */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-teal-600 rounded-full" />
            سوالات متداول
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl clay-subcard overflow-hidden transition-all">
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
            آماده‌اید هوش مصنوعی را به همراه دائمی کار و تخصص خود تبدیل کنید؟
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/store"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 clay-btn-primary font-bold text-white rounded-2xl shadow-lg hover:scale-105 transition-all text-sm sm:text-base"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده و خرید اکانت‌ها</span>
            </Link>

            <Link
              to="/?advisor=open"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 clay-card hover:clay-card-elevated font-bold text-[#0f1420] dark:text-white rounded-2xl transition-all text-sm sm:text-base border border-[var(--border-subtle)]"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <Bot className="w-4 h-4 text-blue-500" />
              <span>گفتگو با مشاور هوشمند خرید</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AiAssistantPage;
