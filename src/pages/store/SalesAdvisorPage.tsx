import React, { useEffect } from 'react';
import { Sparkles, ShieldCheck, Zap, CreditCard, Send, ArrowRight, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { ShoppingAdvisorWidget } from '../../components/store/ShoppingAdvisorWidget';
import { setPageSeo } from '../../lib/seo';

export function SalesAdvisorPage() {
  useEffect(() => {
    setPageSeo({
      title: 'مشاور هوشمند انتخاب و خرید اکانت هوش مصنوعی | Dastyar AI',
      description: 'راهنمای هوشمند و رایگان برای انتخاب بهترین اکانت هوش مصنوعی، مقایسه پلن‌ها و ابزارها متناسب با نیاز برنامه‌نویسی، تولید محتوا، ترید و گرافیک.',
      canonical: `${window.location.origin}/chat`,
      ogType: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: 'مشاور هوشمند انتخاب و خرید اکانت هوش مصنوعی',
            description: 'راهنمای هوشمند و رایگان برای انتخاب بهترین اکانت هوش مصنوعی و مقایسه ابزارها.',
            url: `${window.location.origin}/chat`
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'مشاور هوشمند Dastyar AI چیست و چگونه کار می‌کند؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'مشاور هوشمند یک دستیار تخصصی رایگان است که به صورت آنلاین به سوالات شما درباره تفاوت اکانت‌های هوش مصنوعی، قیمت‌ها و بهترین گزینه برای کار شما پاسخ می‌دهد.'
                }
              },
              {
                '@type': 'Question',
                name: 'آیا استفاده از مشاور خرید رایگان است؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بله، مشاوره برای تمامی کاربران کاملاً رایگان است و نیازی به پرداخت هزینه یا ثبت‌نام ندارد.'
                }
              }
            ]
          }
        ]
      }
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300">
      <GlobalHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
            <Sparkles size={14} className="text-amber-500" />
            <span>مشاوره کاملاً رایگان و آنی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight leading-snug">
            مشاور هوشمند انتخاب و خرید اکانت‌های هوش مصنوعی
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            نمی‌دانید برای کار خود (برنامه‌نویسی، تولید محتوا، ترید، ادیت ویدیو یا گرافیک) کدام اکانت یا ابزار بهتر است؟ از مشاور آنلاین ما بپرسید تا بهترین گزینه را به شما معرفی کند.
          </p>
        </div>

        {/* Embedded Advisor Chat Container */}
        <div className="max-w-2xl mx-auto mb-12">
          <ShoppingAdvisorWidget isEmbedded={true} defaultOpen={true} />
        </div>

        {/* Quick Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <div className="p-4 rounded-2xl clay-card text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Zap size={20} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-main)]">تحویل ۱ تا ۲۴ ساعت</h4>
            <p className="text-[10px] text-[var(--text-dim)]">فعال‌سازی قانونی با پشتیبانی کامل</p>
          </div>

          <div className="p-4 rounded-2xl clay-card text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-main)]">ضمانت اصالت و تعویض</h4>
            <p className="text-[10px] text-[var(--text-dim)]">گارانتی کامل در طول دوره اشتراک</p>
          </div>

          <div className="p-4 rounded-2xl clay-card text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
              <CreditCard size={20} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-main)]">پرداخت امن شاپرک</h4>
            <p className="text-[10px] text-[var(--text-dim)]">درگاه بانکی شتاب و کارت‌به‌کارت</p>
          </div>

          <div className="p-4 rounded-2xl clay-card text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Send size={20} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-main)]">پشتیبانی تلگرام</h4>
            <p className="text-[10px] text-[var(--text-dim)]">راهنمایی و پیگیری سریع سفارشات</p>
          </div>
        </div>

        {/* Back to Store Call-to-Action Banner */}
        <div className="p-6 rounded-3xl clay-card-thick flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div>
            <h3 className="font-black text-sm text-[var(--text-main)] mb-1">می‌خواهید همه محصولات را بررسی کنید؟</h3>
            <p className="text-xs text-[var(--text-muted)]">کاتالوگ کامل اکانت‌ها، بسته‌ها و قیمت‌های روز را در ویترین فروشگاه ببینید.</p>
          </div>
          <Link
            to="/"
            className="px-6 py-2.5 clay-btn-primary font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <span>مشاهده همه محصولات فروشگاه</span>
            <ArrowRight size={14} className="rotate-180" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
