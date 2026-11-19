import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Globe, MessageSquare, ArrowLeft, Mail } from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    setPageSeo({
      title: 'درباره Dastyar AI | دستیار هوش مصنوعی فارسی',
      description: 'Dastyar AI چیست، چرا ساخته شد، و چرا رایگان است. دستیار هوش مصنوعی فارسی با چت رایگان نامحدود روی مدل‌های پایه و پرداخت به‌ازای مصرف برای مدل‌های پیشرفته.',
      canonical: `${window.location.origin}/about`,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'درباره Dastyar AI',
        description: 'Dastyar AI چیست، چرا ساخته شد، و چرا رایگان است. دستیار هوش مصنوعی فارسی با چت رایگان نامحدود روی مدل‌های پایه و پرداخت به‌ازای مصرف برای مدل‌های پیشرفته.',
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
            <span>معرفی و بیانیه شفافیت پلتفرم</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-snug mb-4"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            درباره Dastyar AI
          </h1>

          <p
            className="text-base sm:text-lg text-[#525d75] dark:text-[#9aa5bc] leading-relaxed max-w-2xl mx-auto"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            Dastyar AI یک دستیار هوش مصنوعی فارسی‌زبان است که برای کاربران ایرانی طراحی شده است. بسیاری از ابزارهای جهانی یا به فارسی روان پاسخ نمی‌دهند، یا برای استفاده از ایران محدودیت دارند، یا کاربر را مجبور به پرداخت اشتراک ماهانه می‌کنند. ما Dastyar AI را ساختیم تا این موانع را برداریم: پاسخ فارسی طبیعی، دسترسی مستقیم، و مدلی که فقط به‌ازای مصرف واقعی هزینه می‌گیرد.
          </p>
        </div>

        {/* Section 1: Why Dastyar AI? */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
            چرا Dastyar AI؟
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  چت رایگان و نامحدود:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  بدون نیاز به پرداخت اولیه با {toPersianDigits(15)} پیام مهمان شروع کنید و پس از ورود، نامحدود از مدل‌های پایه استفاده کنید.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  پرداخت به‌ازای مصرف (Pay-As-You-Go):
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  بدون اشتراک اجباری، بدون هزینه پنهان. کیف پول شما اعتبار مادام‌العمر دارد و فقط بابت استفاده واقعی کسر می‌شود.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  دسترسی مستقیم از ایران:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  بدون نیاز به تغییر IP یا شماره تلفن خارجی.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Globe className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  چندکاناله:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  وب، PWA قابل نصب، ربات تلگرام، و اپلیکیشن اندروید در کافه‌بازار.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl clay-subcard flex items-start gap-3.5">
              <Sparkles className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm sm:text-base text-[#0f1420] dark:text-white font-bold mb-1">
                  پاسخ با داده‌های تازه:
                </strong>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  برای سوالاتی که به اطلاعات روز نیاز دارند، از جستجوی زنده وب در کنار دانش مدل استفاده می‌کنیم.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Why Free? (Transparent Model) */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-4 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-emerald-500 rounded-full" />
            چرا «رایگان» است؟ (مدل شفاف)
          </h2>

          <p className="text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
            Dastyar AI یک سرویس فریمیوم است. با {toPersianDigits(15)} پیام مهمان بدون ثبت‌نام آشنا می‌شوید و پس از ورود می‌توانید به‌صورت رایگان و نامحدود با مدل‌های پایه گفتگو کنید. برای استفاده از مدل‌های تخصصی و پیشرفته یا تولید تصویر استودیویی، کیف پول خود را شارژ می‌کنید و فقط بابت همان مصرف هزینه می‌دهید. این مدل به ما اجازه می‌دهد بدون تبلیغات مزاحم، بدون فروش داده کاربران، و بدون اجبار به اشتراک ماهانه کار کنیم.
          </p>
        </section>

        {/* Section 3: How it works? */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-lg sm:text-xl font-bold text-[#0f1420] dark:text-white mb-4 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-indigo-500 rounded-full" />
            چطور کار می‌کند؟
          </h2>

          <p className="text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
            Dastyar AI به چند موتور هوش مصنوعی پیشرو متصل است و بر اساس نیاز شما، بهترین موتور را برای هر درخواست انتخاب می‌کند. لازم نیست نگران انتخاب مدل یا تنظیمات فنی باشید — فقط به فارسی بنویسید و پاسخ بگیرید.
          </p>
        </section>

        {/* CTA Banner */}
        <section className="clay-card-thick p-8 sm:p-10 rounded-3xl text-center mb-8 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10">
          <p className="text-base sm:text-lg font-bold text-[#0f1420] dark:text-white mb-6">
            همین حالا رایگان شروع کنید — {toPersianDigits(15)} پیام بدون ورود و چت نامحدود پس از ورود، بدون اشتراک اجباری.
          </p>
          <Link
            to="/?advisor=open"
            className="inline-flex items-center gap-3 px-8 py-3.5 clay-btn-primary font-bold text-white rounded-2xl shadow-lg hover:scale-105 transition-all"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span>شروع گفتگو با مشاور هوشمند</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </section>

        {/* Contact Info */}
        <div className="text-center text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] py-4">
          برای ارتباط با ما، به صفحه <Link to="/contact" className="text-blue-600 dark:text-blue-400 font-bold underline">تماس</Link> بروید یا از طریق ربات تلگرام پیام دهید.
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
