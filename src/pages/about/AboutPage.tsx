import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Clock,
  CreditCard,
  Headphones,
  Bot,
  ArrowLeft,
  Mail,
  Send,
  Lock,
  Layers,
  Award,
  Users,
  Cpu,
  Palette,
  Code2,
  Key
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    setPageSeo({
      title: 'درباره Dastyar AI | فروشگاه تخصصی ابزارها و اکانت‌های قانونی هوش مصنوعی',
      description: 'Dastyar AI مرجع تخصصی خرید اکانت‌های قانونی و اختصاصی هوش مصنوعی، لایسنس‌های معتبر، کلیدهای API و مشاور هوشمند خرید در ایران با تحویل سریع و ضمانت تعویض.',
      canonical: `${window.location.origin}/about`,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'درباره Dastyar AI',
        description: 'Dastyar AI مرجع تخصصی خرید اکانت‌های قانونی و اختصاصی هوش مصنوعی، لایسنس‌های معتبر، کلیدهای API و مشاور هوشمند خرید در ایران با تحویل سریع و ضمانت تعویض.',
        url: `${window.location.origin}/about`
      }
    });
  }, []);

  return (
    <div className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] flex flex-col justify-between transition-colors overflow-x-hidden" dir="rtl">
      <GlobalHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero / Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill-thick text-xs font-bold mb-4 shadow-sm select-none">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>فروشگاه تخصصی و مرجع رسمی ابزارهای هوش مصنوعی</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-snug mb-5"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            درباره Dastyar AI
          </h1>

          <p
            className="text-base sm:text-lg text-[#525d75] dark:text-[#9aa5bc] leading-relaxed max-w-2xl mx-auto"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            Dastyar AI مرجع تخصصی ارائه اکانت‌های اختصاصی، قانونی و لایسنس‌های معتبر ابزارهای برتر هوش مصنوعی در ایران است. ما بستری امن، پایدار و شفاف برای برنامه‌نویسان، طراحان، پژوهشگران و کسب‌وکارهای ایرانی فراهم ساخته‌ایم تا بدون موانع پرداخت‌های بین‌المللی، مستقیماً به پیشرفته‌ترین فناوری‌های روز دنیا دسترسی داشته باشند.
          </p>
        </div>

        {/* Section 1: Core Pillars */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
            چرا Dastyar AI؟ (مزایای محوری و منشور اصالت)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  فعال‌سازی قانونی روی ایمیل شخصی:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  تمام اکانت‌های اختصاصی به صورت ۱۰۰٪ قانونی روی ایمیل شخصی خودتان فعال می‌شوند؛ بدون دسترسی اشتراکی تا امنیت، تاریخچه چت‌ها و حریم خصوصی پروژه‌های شما کاملاً اختصاصی بماند.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  ضمانت کامل و گارانتی تعویض:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  تمامی اکانت‌ها و سرویس‌ها دارای ضمانت اصالت و گارانتی تعویض در تمام طول مدت اشتراک هستند تا تجربه‌ای بی‌دغدغه و مطمئن داشته باشید.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  تحویل سریع ظرف {toPersianDigits(1)} تا {toPersianDigits(24)} ساعت کاری:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  پس از ثبت سفارش، اطلاعات ورود یا فعال‌سازی در سریع‌ترین زمان ممکن از طریق پیامک، ایمیل و پنل کاربری برای شما ارسال می‌گردد.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <CreditCard className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  پرداخت امن ریالی (شاپرک و کارت‌به‌کارت):
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  پرداخت مستقیم و آنی از طریق کلیه کارت‌های بانکی عضو شتاب در درگاه شاپرک، همراه با امکان واریز کارت‌به‌کارت و ثبت سریع رسید.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Bot className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  مشاور هوشمند ۲۴ ساعته خرید:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  سیستم آنلاین مشاور هوشمند در تمام صفحات سایت آماده است تا بر اساس شغل، تخصص و بودجه شما، بهترین اکانت و پکیج را پیشنهاد دهد.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Headphones className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  پشتیبانی فنی در تلگرام:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  تیم پشتیبانی تخصصی ما در تلگرام همواره در دسترس است تا سوالات، پیگیری سفارش‌ها و راهنمایی‌های فنی شما را در کوتاه‌ترین زمان پاسخ دهد.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Product Categories */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            دسته‌بندی محصولات در فروشگاه Dastyar AI
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2.5 mb-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>اکانت‌های اختصاصی پریمیوم و پلاس</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                مناسب برای چت هوشمند، خلاصه‌سازی و تحلیل اسناد سنگین، جستجوی زنده در وب و استفاده از ابزارهای تحلیلی پیشرفته.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2.5 mb-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Code2 className="w-4 h-4" />
                <span>دستیارهای برنامه‌نویسی و کدنویسی</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                محیط‌های تعاملی و پیشرفته برای توسعه‌دهندگان، تحلیل و اشکال‌زدایی خط‌به‌خط، بازنویسی پروژه‌ها و اتوماسیون وظایف فنی.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2.5 mb-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                <Palette className="w-4 h-4" />
                <span>موتورهای استودیویی طراحی و تصویر</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                خلق تصاویر باکیفیت و فوتورئال، ادیت‌های خلاقانه و تولید انواع کانسپت‌ها و محتواهای بصری برای طراحان و دیجیتال‌آرتیست‌ها.
              </p>
            </div>

            <div className="p-4 rounded-2xl clay-subcard">
              <div className="flex items-center gap-2.5 mb-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>کلیدها و توکن‌های API اختصاصی</span>
              </div>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                اعتبار رسمی توسعه‌دهندگان برای اتصال مستقیم به اسکریپت‌های پایتون، پلتفرم‌های اتوماسیون (مانند n8n) و زیرساخت‌های استارتاپی.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Story & Mission */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-4 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-emerald-500 rounded-full" />
            داستان ما؛ دسترسی بی‌دغدغه به فناوری
          </h2>

          <p className="text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed text-justify mb-4">
            استفاده از هوش مصنوعی دیگر یک سرگرمی نیست؛ بلکه ابزاری ضروری برای رقابت در دنیای مدرن کار و توسعه است. با این حال، متخصصان و فعالان کسب‌وکار در ایران همواره با چالش‌هایی مانند کارت‌های اعتباری بین‌المللی، فعال‌سازی‌های پرخطر و نبود پشتیبانی پاسخگو مواجه بوده‌اند.
          </p>
          <p className="text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed text-justify">
            ما در Dastyar AI متعهد شده‌ایم این فاصله را پر کنیم: با ایجاد بستری امن برای ارائه اشتراک‌های کاملاً اختصاصی، پشتیبانی همیشگی و مشاوره هوشمند، تا شما بدون هیچ نگرانی فنی، فقط روی توسعه مهارت‌ها و گسترش کسب‌وکارتان تمرکز کنید.
          </p>
        </section>

        {/* CTA Banner */}
        <section className="clay-card-thick p-8 sm:p-10 rounded-3xl text-center mb-8 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10">
          <p className="text-base sm:text-lg font-bold text-[#0f1420] dark:text-white mb-6">
            نمی‌دانید کدام اکانت یا ابزار هوش مصنوعی برای کار شما مناسب‌تر است؟
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/?advisor=open"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 clay-btn-primary font-bold text-white rounded-2xl shadow-lg hover:scale-105 transition-all text-sm sm:text-base"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <Bot className="w-4 h-4" />
              <span>گفتگو با مشاور هوشمند خرید</span>
            </Link>

            <Link
              to="/store"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 clay-card hover:clay-card-elevated font-bold text-[#0f1420] dark:text-white rounded-2xl transition-all text-sm sm:text-base border border-[var(--border-subtle)]"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span>مشاهده همه محصولات فروشگاه</span>
            </Link>
          </div>
        </section>

        {/* Contact Info */}
        <div className="text-center text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] py-4">
          نیاز به راهنمایی بیشتری دارید؟ به صفحه{' '}
          <Link to="/contact" className="text-blue-600 dark:text-blue-400 font-bold underline">
            تماس با ما
          </Link>{' '}
          مراجعه کنید یا از طریق پشتیبانی تلگرام پیام دهید.
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
