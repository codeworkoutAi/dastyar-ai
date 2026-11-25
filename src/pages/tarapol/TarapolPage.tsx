import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Code2,
  Bot,
  Terminal,
  Server,
  ArrowLeft,
  ChevronDown,
  Download,
  Key,
  Laptop,
  Users,
  Compass,
  FileCode,
  Lock,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Clock,
  Star
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { CheckoutModal } from '../../components/CheckoutModal';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export function TarapolPage() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  useEffect(() => {
    // 1. Setup Advanced Developer SEO & GEO Schema
    setPageSeo({
      title: 'تَراپُل (Tarapol) | شورای مشاوران ارشد هوش مصنوعی برای Antigravity و Cursor',
      description: 'پل ارتباطی اختصاصی میان محیط توسعه (Google Antigravity و Cursor) و مدل‌های وب پرچمدار Google Gemini 4 Neon و Alibaba Qwen4-Max برای بازبینی عمیق کد، معماری سیستم و عیب‌یابی بدون هزینه دلاری API.',
      keywords: 'تراپل, tarapol, antigravity, antigravity bridge, gemini 4 neon, qwen4-max, cursor ai, هوش مصنوعی برنامه نویسی, شورای هوش مصنوعی, آنتی گرویتی, دستیار هوشمند کدنویسی, خرید لایسنس تراپل',
      canonical: `${window.location.origin}/tarapol`,
      ogImage: `${window.location.origin}/images/products/tarapol-box.jpg`,
      ogType: 'product',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'نرم‌افزار تَراپُل (Tarapol Universal AI Gateway)',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows 10, Windows 11',
        description: 'شورای مشاوران ارشد هوش مصنوعی و گیت‌وی محلی برای ارتباط محیط‌های کدنویسی با برترین مدل‌های استدلالی وب (Gemini 4 Neon و Qwen4-Max).',
        image: `${window.location.origin}/images/products/tarapol-box.jpg`,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'IRR',
          lowPrice: '3900000',
          highPrice: '14900000',
          offerCount: '3'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.95',
          reviewCount: '48'
        }
      }
    });

    // 2. Fetch product data from store API (Product ID 34)
    fetch('/api/products')
      .then(res => res.json())
      .then((data: any[]) => {
        const found = data.find(p => p.id === 34 || p.title?.includes('تراپل') || p.title?.includes('Tarapol'));
        if (found) {
          setProductData(found);
          let vars = [];
          try {
            vars = typeof found.variations === 'string' ? JSON.parse(found.variations) : (found.variations || []);
          } catch (e) {
            vars = [];
          }
          if (vars.length > 0) {
            const defaultVar = vars.find((v: any) => v.id === 'pro') || vars[0];
            setSelectedVariation(defaultVar);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenCheckout = (planId: string) => {
    setSelectedPlan(planId);
    let chosenVar = null;
    if (productData && productData.variations) {
      try {
        const vars = typeof productData.variations === 'string' ? JSON.parse(productData.variations) : productData.variations;
        chosenVar = vars.find((v: any) => v.id === planId) || vars[0];
      } catch (e) {
        chosenVar = null;
      }
    }
    
    // Fallback product object if not loaded from DB yet
    const fallbackProduct = productData || {
      id: 34,
      title: 'لایسنس نرم‌افزار تَراپُل (Tarapol AI Gateway) | شورای مشاوران ارشد هوش مصنوعی',
      price: planId === 'starter' ? 390000 : planId === 'team' ? 1490000 : 690000,
      category: 'software',
      image: '/images/products/tarapol-box.jpg'
    };

    setProductData(fallbackProduct);
    setSelectedVariation(chosenVar || {
      id: planId,
      title: planId === 'starter' ? 'پلن پایه (Starter - ۱ سیستم)' : planId === 'team' ? 'پلن استودیو و تیمی (Team Edition)' : 'پلن حرفه‌ای (Pro Developer)',
      price: planId === 'starter' ? 390000 : planId === 'team' ? 1490000 : 690000
    });
    setIsCheckoutOpen(true);
  };

  const formatPrice = (p: number) => {
    const formatted = (p || 0).toLocaleString();
    return usePersianDigits ? toPersianDigits(formatted) : formatted;
  };

  const faqs = [
    {
      q: 'آیا کدهای پروژه من به سرورهای واسط ارسال می‌شوند؟',
      a: 'خیر، به هیچ وجه. نرم‌افزار تَراپُل کاملاً به صورت محلی (روی رایانه شما در پورت 8765) اجرا می‌شود. ارتباط فقط میان مرورگر کروم شخصی شما و محیط توسعه شما برقرار است و هیچ سرور میانی در این میان وجود ندارد.'
    },
    {
      q: 'تفاوت تَراپُل با جمینای داخلی Antigravity چیست؟',
      a: 'در Antigravity اخیراً مدل Gemini 4 Hydrogen در دسترس قرار گرفته است، اما مدل‌های تفکر عمیق‌تر مانند Gemini 4 Neon و همچنین مدل قدرتمند Alibaba Qwen4-Max در دسترس نیستند. تَراپُل این امکان را به شما می‌دهد که این مدل‌های فوق‌العاده را به عنوان مشاور ارشد در کنار مدل مجری خود داشته باشید.'
    },
    {
      q: 'شورای هوش مصنوعی (/council) دقیقاً چطور کار می‌کند؟',
      a: 'کافیست در پنجره چت Antigravity عبارت council/ را به همراه سوال یا معماری مدنظرتان بنویسید. تَراپُل به صورت خودکار فایل‌های مرتبط پروژه را بسته‌بندی کرده و همزمان برای Google Gemini 4 Neon و Alibaba Qwen4-Max ارسال می‌کند و اجماع نظر تفکیک‌شده آن‌ها را در قالب یک گزارش ساختاریافته به شما تحویل می‌دهد.'
    },
    {
      q: 'آیا در ادیتورهای Cursor و VS Code هم قابل استفاده است؟',
      a: 'بله! در تنظیمات OpenAI ادیتور Cursor یا اکستنشن‌های VS Code (مانند Cline، Roo Code و Continue)، کافیست آدرس Base URL را برابر با http://localhost:8765/v1 بگذارید تا از تمامی مدل‌ها بهره‌مند شوید.'
    },
    {
      q: 'لایسنس نرم‌افزار به چه صورت فعال می‌شود؟',
      a: 'پس از خرید، کد لایسنس اختصاصی همراه با لینک دانلود نرم‌افزار نصبی Tarapol-Setup-v2.1.exe در اختیارتان قرار می‌گیرد. با وارد کردن کد در نرم‌افزار، لایسنس به صورت آفلاین بر روی سیستم شما فعال و دائمی می‌شود.'
    }
  ];

  return (
    <div className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] flex flex-col justify-between transition-colors overflow-x-hidden selection:bg-indigo-500 selection:text-white" dir="rtl">
      <GlobalHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
        
        {/* ========================================================
            HERO SECTION: High-Impact Visuals & Value Proposition
           ======================================================== */}
        <section className="relative pt-4 sm:pt-8 pb-8">
          {/* Ambient decorative lights */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/25 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute top-1/3 left-10 w-80 h-80 bg-cyan-500/15 dark:bg-cyan-500/20 blur-3xl pointer-events-none rounded-full" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Right Column: Copy, Badges & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              {/* Product Badge Pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl clay-pill-thick text-xs font-bold shadow-xs select-none border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>نسخه رسمی ۲.۱ تجاری | گیت‌وی جهانی هوش مصنوعی</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono">v2.1 Stable</span>
              </div>

              {/* Main Headline */}
              <h1
                className="text-3xl sm:text-5xl lg:text-5xl font-black text-zinc-900 dark:text-white leading-[1.25] tracking-tight"
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                شورای مشاوران ارشد هوش مصنوعی
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-300">
                  در محیط کدنویسی شما
                </span>
              </h1>

              {/* Subtitle / Philosophy */}
              <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl font-normal">
                مدل داخلی ادیتور شما کارهایش را انجام می‌دهد؛ مدل‌های پرچمدار تفکر وب 
                (<span className="font-bold text-indigo-600 dark:text-indigo-400">Google Gemini 4 Neon</span> و{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400">Alibaba Qwen4-Max</span>) 
                کدها و معماری شما را بازبینی، نقد و هدایت می‌کنند. 
                بدون نیاز به شارژ دلاری API، با حفظ ۱۰۰٪ محرمانگی کدها در سیستم شما.
              </p>

              {/* Bullet Features Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>دسترسی اختصاصی به Gemini 4 Neon</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>اسلش‌کامند شورای هم‌فکری (council/)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>سازگار با Antigravity، Cursor و VS Code</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>لایسنس سخت‌افزاری آفلاین و دائمی</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-4">
                <a
                  href="#pricing-section"
                  className="px-6 py-3.5 rounded-2xl clay-btn-primary text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Key size={18} />
                  <span>تهیه لایسنس دائمی</span>
                </a>

                <a
                  href="#how-it-works"
                  className="px-5 py-3.5 rounded-2xl clay-btn text-zinc-800 dark:text-zinc-100 font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-800"
                >
                  <Layers size={18} className="text-indigo-500" />
                  <span>نحوه کارکرد شورا</span>
                </a>

                <a
                  href="#setup-guide"
                  className="px-4 py-3.5 rounded-2xl clay-btn text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Clock size={15} />
                  <span>راه‌اندازی در ۳ دقیقه</span>
                </a>
              </div>

              {/* Developer Trust Metrics */}
              <div className="pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 grid grid-cols-3 gap-4 text-right">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-price">
                    {usePersianDigits ? toPersianDigits('0') : '0'}$
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    هزینه دلاری API
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-price">
                    {usePersianDigits ? toPersianDigits('100%') : '100%'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    محلی و بدون سرور میانی
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-price">
                    {usePersianDigits ? toPersianDigits('2') : '2'} پرچمدار
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    همزمان در یک شورا
                  </div>
                </div>
              </div>

            </div>

            {/* Left Column: 3D Product Box Visual Rendering */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-md w-full">
                
                {/* Back Glowing Atmosphere */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all opacity-80" />

                {/* Main Card Frame */}
                <div className="relative rounded-3xl overflow-hidden clay-card p-3 sm:p-4 border border-white/60 dark:border-white/10 shadow-2xl transition-all duration-500 group-hover:-translate-y-1">
                  
                  {/* Badge Overlay */}
                  <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600/90 text-white backdrop-blur-md text-xs font-black shadow-md">
                      تَراپُل نسخه تجاری ۲.۱
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-emerald-400 backdrop-blur-md text-[10px] font-mono border border-emerald-500/30">
                      ● Active Bridge 8765
                    </span>
                  </div>

                  {/* 3D Box Image */}
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center p-2">
                    <img
                      src="/images/products/tarapol-box.jpg"
                      alt="نرم‌افزار تَراپُل - Tarapol Universal AI Gateway 3D Box"
                      className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] group-hover:scale-105 transition-transform duration-500"
                      loading="eager"
                    />
                  </div>

                  {/* Micro Specs Footer on Box */}
                  <div className="mt-3 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Terminal size={14} className="text-indigo-500" />
                      Windows 10/11 x64
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">Node + Python GUI</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>


        {/* ========================================================
            THE REAL PROBLEM & THE SENIOR ADVISOR SOLUTION
           ======================================================== */}
        <section className="py-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2
              className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              چرا توسعه‌دهندگان حرفه‌ای به تَراپُل نیاز دارند؟
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              تفاوت کاربری واقعی ابزارهای محلی با قدرت بی‌پایان وب‌چت‌های هوش مصنوعی
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* The Limitation Card */}
            <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-4 border-r-4 border-r-rose-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                    محدودیت مدل‌های موجود در محیط توسعه (IDE)
                  </h3>
                  <span className="text-xs text-rose-500 font-bold">کمبود مدل‌های تفکر عمیق و سهمیه‌های پرهزینه</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                در محیط‌هایی مانند Google Antigravity، مدل‌های داخلی (حتی اخیراً با اضافه شدن Hydrogen) برای اجرای سریع تسک‌ها عالی هستند، اما دسترسی به مدل‌های پرچمدار تفکر و استدلال مانند <strong className="text-zinc-900 dark:text-white">Gemini 4 Neon</strong> و مدل تخصصی کدنویسی علی‌بابا یعنی <strong className="text-zinc-900 dark:text-white">Qwen4-Max</strong> را ندارید.
                کپی-پیست دستی صدها خط کد در مرورگر نیز بسیار کند، خطاساز و فرساینده است.
              </p>
            </div>

            {/* The Tarapol Solution Card */}
            <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-4 border-r-4 border-r-emerald-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                    راهکار هوشمندانه تَراپُل (شورای مشاوران ارشد)
                  </h3>
                  <span className="text-xs text-emerald-500 font-bold">پل هوشمند بدون هزینه دلاری با استخراج خودکار فایل‌ها</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                تَراپُل به صورت اتوماتیک پرونده فنی پروژه، وضعیت گیت و فایل‌های مرتبط شما را پکیج کرده و از طریق پل محلی به پیشرفته‌ترین مدل‌های وب می‌سپارد. آن‌ها کدهای شما را با تفکر عمیق چند دقیقه‌ای تحلیل کرده و مشاوره‌ای شفاف به محیط ادیتور شما بازمی‌گردانند تا مدل مجری، تغییرات را با ضریب اطمینان بالا پیاده‌سازی کند.
              </p>
            </div>

          </div>
        </section>


        {/* ========================================================
            HOW IT WORKS: 4-Step Interactive Architecture Diagram
           ======================================================== */}
        <section id="how-it-works" className="py-6 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl clay-pill text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Layers size={14} />
              <span>معماری شورا در یک نگاه</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              جریان کار شورای هوش مصنوعی چگونه است؟
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              مشاهده کنید داده‌ها و راهکارها چطور بدون خروج از کامپیوتر شما پردازش می‌شوند
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            
            {/* Step 1 */}
            <div className="clay-card p-5 rounded-2xl space-y-3 relative group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                ۱
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Code2 size={16} className="text-indigo-500" />
                درخواست در IDE
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                در چت Antigravity عبارت <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-indigo-600 font-mono">/council</code> یا در Cursor پرامپت خود را می‌نویسید.
              </p>
            </div>

            {/* Step 2 */}
            <div className="clay-card p-5 rounded-2xl space-y-3 relative group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm">
                ۲
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Server size={16} className="text-purple-500" />
                پکیج هوشمند تَراپُل
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                کانتکست‌ساز تَراپُل وضعیت گیت، معماری و فایل‌های مرتبط را استخراج کرده و به پورت 8765 لوکال می‌فرستد.
              </p>
            </div>

            {/* Step 3 */}
            <div className="clay-card p-5 rounded-2xl space-y-3 relative group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black text-sm">
                ۳
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Cpu size={16} className="text-cyan-500" />
                شورای تفکر وب
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Google Gemini 4 Neon و Alibaba Qwen4-Max همزمان به نقد کد، یافتن باگ‌ها و ارائه معماری بهینه می‌پردازند.
              </p>
            </div>

            {/* Step 4 */}
            <div className="clay-card p-5 rounded-2xl space-y-3 relative group hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                ۴
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                اعمال مطمئن کدها
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                مشاوره تفکیک‌شده به محیط کدنویسی بازمی‌گردد و ایجنت یا برنامه‌نویس تغییرات را با خیال آسوده اعمال می‌کند.
              </p>
            </div>

          </div>
        </section>


        {/* ========================================================
            DUAL COMPATIBILITY: ANTIGRAVITY & CURSOR/VSCODE
           ======================================================== */}
        <section className="py-6">
          <div className="clay-card p-6 sm:p-10 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Antigravity Side */}
              <div className="space-y-4 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  <Terminal size={14} />
                  <span>پشتیبانی بومی از Google Antigravity</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  فرمان‌های اختصاصی بدون دستکاری هسته IDE
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  تَراپُل به صورت خودکار اسکیل‌های رسمی زیر را در پوشه تنظیمات شما رجیستر می‌کند:
                </p>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl clay-surface text-xs font-mono flex items-center justify-between">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">/neon &lt;پرسش&gt;</span>
                    <span className="text-[11px] text-zinc-500 font-sans">مشورت مستقیم با Gemini 4 Neon</span>
                  </div>
                  <div className="p-3 rounded-xl clay-surface text-xs font-mono flex items-center justify-between">
                    <span className="font-bold text-purple-600 dark:text-purple-400">/qwen &lt;پرسش&gt;</span>
                    <span className="text-[11px] text-zinc-500 font-sans">تحلیل کد توسط Alibaba Qwen4-Max</span>
                  </div>
                  <div className="p-3 rounded-xl clay-surface text-xs font-mono flex items-center justify-between border border-amber-500/30 bg-amber-500/5">
                    <span className="font-bold text-amber-600 dark:text-amber-400">/council &lt;معماری یا باگ&gt;</span>
                    <span className="text-[11px] text-amber-600 font-sans font-bold">شورای همزمان دو ابرمدل</span>
                  </div>
                </div>
              </div>

              {/* Cursor & VS Code Side */}
              <div className="space-y-4 text-right lg:border-r lg:border-zinc-200 dark:lg:border-zinc-800 lg:pr-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                  <Server size={14} />
                  <span>سازگار با Cursor، VS Code و Roo Code</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  پروکسی سازگار با استاندارد رسمی OpenAI
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  تَراپُل یک اندپوینت کامل روی پورت ۸۷۶۵ باز می‌کند. کافیست در تنظیمات ادیتور خود مقادیر زیر را وارد کنید تا تمام جریان‌های کاری شما متصل شوند:
                </p>
                <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs space-y-2 text-left" dir="ltr">
                  <div className="text-zinc-400 text-[11px]">// Cursor & VS Code OpenAI Settings:</div>
                  <div>Base URL: <span className="text-emerald-400">http://localhost:8765/v1</span></div>
                  <div>API Key:  <span className="text-cyan-400">tarapol-free-key</span> (یا هر متنی)</div>
                  <div>Models:   <span className="text-amber-400">gemini-4-neon, qwen-4-max, auto</span></div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ========================================================
            COMMERCIAL LICENSING & PRICING PLANS
           ======================================================== */}
        <section id="pricing-section" className="py-8 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl clay-pill text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Key size={14} />
              <span>لایسنس دائمی سخت‌افزاری آفلاین</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              پلن‌های دسترسی تجاری نرم‌افزار تَراپُل
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              یک بار پرداخت برای استفاده همیشگی — بدون اشتراک ماهانه یا هزینه‌های پنهان
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            
            {/* Plan 1: Starter */}
            <div className="clay-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 relative transition-transform hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                    توسعه‌دهنده فردی
                  </span>
                  <Laptop size={20} className="text-zinc-400" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                  پلن پایه (Starter)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  مناسب برنامه‌نویسان فریلنسر برای استفاده دائمی روی یک سیستم شخصی
                </p>

                <div className="pt-2">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white font-price">
                    {formatPrice(390000)}
                  </span>
                  <span className="text-xs text-zinc-500 mr-1.5 font-bold">تومان / مادام‌العمر</span>
                </div>

                <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>فعال‌سازی دائمی روی ۱ سیستم (Machine ID)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>دسترسی به Gemini 4 Neon و Qwen4-Max</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>نرم‌افزار نصبی ویندوز + اکستنشن کروم</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>آپدیت‌های رایگان سری نسخه ۲.x</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenCheckout('starter')}
                className="w-full py-3.5 rounded-2xl clay-btn text-zinc-800 dark:text-zinc-100 font-bold text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700"
              >
                خرید پلن پایه
              </button>
            </div>

            {/* Plan 2: Pro (Featured) */}
            <div className="clay-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 relative transition-transform hover:-translate-y-1.5 border-2 border-indigo-500 shadow-xl shadow-indigo-500/15 bg-gradient-to-b from-indigo-500/5 to-transparent">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black shadow-md">
                پیشنهاد شورای هوش مصنوعی
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                    حرفه‌ای (دو دستگاه)
                  </span>
                  <Sparkles size={20} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                  پلن حرفه‌ای (Pro Developer)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  برای توسعه‌دهندگانی که هم روی لپ‌تاپ و هم روی PC دسکتاپ کدنویسی می‌کنند
                </p>

                <div className="pt-2">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-price">
                    {formatPrice(690000)}
                  </span>
                  <span className="text-xs text-zinc-500 mr-1.5 font-bold">تومان / مادام‌العمر</span>
                </div>

                <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <li className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>فعال‌سازی همزمان روی ۲ سیستم فیزیکی</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>اسلش‌کامند اختصاصی شورای هم‌فکری (/council)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>پشتیبانی کامل از هر دو ادیتور Antigravity و Cursor</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>سیستم کانتکست‌ساز هوشمند پرونده پروژه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>پشتیبانی فنی در اولویت اختصاصی</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenCheckout('pro')}
                className="w-full py-3.5 rounded-2xl clay-btn-primary text-white font-black text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                خرید پلن حرفه‌ای (پیشنهادی)
              </button>
            </div>

            {/* Plan 3: Team */}
            <div className="clay-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 relative transition-transform hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                    تیم‌ها و استودیوها
                  </span>
                  <Users size={20} className="text-purple-500" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                  پلن سازمانی و تیمی (Team)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  برای شرکت‌های نرم‌افزاری و تیم‌های فنی تا ۵ برنامه‌نویس
                </p>

                <div className="pt-2">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white font-price">
                    {formatPrice(1490000)}
                  </span>
                  <span className="text-xs text-zinc-500 mr-1.5 font-bold">تومان / مادام‌العمر</span>
                </div>

                <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>فعال‌سازی روی تا ۵ سیستم کامپیوتری مستقل</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>پشتیبانی از اشتراک شبکه محلی و مالتی‌یوزر</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>امکان صدور فاکتور رسمی معتبر</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>جلسه آموزش و راه‌اندازی آنلاین اختصاصی</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenCheckout('team')}
                className="w-full py-3.5 rounded-2xl clay-btn text-zinc-800 dark:text-zinc-100 font-bold text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700"
              >
                خرید پلن تیمی
              </button>
            </div>

          </div>
        </section>


        {/* ========================================================
            SETUP GUIDE: 3-Minute Quick Setup
           ======================================================== */}
        <section id="setup-guide" className="py-6 scroll-mt-24">
          <div className="clay-card p-6 sm:p-10 rounded-3xl space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                راهنمای راه‌اندازی و شروع به کار در ۳ مرحله ساده
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                همه چیز آماده است؛ بدون نیاز به تنظیمات پیچیده شبکه یا اسکریپت‌نویسی
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 rounded-2xl clay-surface space-y-3 text-right">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  ۱
                </div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                  نصب نرم‌افزار تَراپُل
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  فایل نصبی <strong>Tarapol-Setup-v2.1.exe</strong> را اجرا کرده و با کد لایسنس اختصاصی خود آن را فعال کنید.
                </p>
              </div>

              <div className="p-5 rounded-2xl clay-surface space-y-3 text-right">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  ۲
                </div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                  فعال‌سازی اکستنشن کروم
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  افزونه تَراپُل را در مرورگر لود کرده و تب چت Gemini یا Qwen را باز بگذارید تا وضعیت سبز شود.
                </p>
              </div>

              <div className="p-5 rounded-2xl clay-surface space-y-3 text-right">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                  ۳
                </div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                  اجرای اسلش‌کامند در IDE
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  در پنجره چت Antigravity عبارت <strong>/council</strong> یا <strong>/neon</strong> را بنویسید و از مشاوره پرچمداران لذت ببرید!
                </p>
              </div>

            </div>
          </div>
        </section>


        {/* ========================================================
            FREQUENTLY ASKED QUESTIONS (FAQ)
           ======================================================== */}
        <section className="py-6 max-w-4xl mx-auto w-full">
          <div className="text-center mb-10 space-y-2">
            <h3
              className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              پرسش‌های متداول توسعه‌دهندگان
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              پاسخ به سوالات متداول درباره امنیت، لایسنس و شیوه اتصال
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="clay-card rounded-2xl overflow-hidden transition-all duration-200 border border-zinc-200/50 dark:border-zinc-800/50"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right cursor-pointer select-none"
                  >
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-black/5 dark:border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>


        {/* ========================================================
            BOTTOM CONVERSION CTA BANNER
           ======================================================== */}
        <section className="py-6">
          <div className="relative rounded-3xl overflow-hidden clay-card p-8 sm:p-12 text-center space-y-6 border border-indigo-500/30 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-zinc-900/40">
            <div className="max-w-2xl mx-auto space-y-3">
              <h3 className="text-2xl sm:text-4xl font-black text-white">
                به جمع توسعه‌دهندگانی بپیوندید که با شورای هوش مصنوعی کد می‌زنند
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                با لایسنس مادام‌العمر تَراپُل، کدهای تمیزتر، معماری پایدارتر و بازبینی هم‌زمان دو ابرمدل پرچمدار جهان را بدون هزینه‌های دلاری تجربه کنید.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => handleOpenCheckout('pro')}
                className="px-8 py-4 rounded-2xl clay-btn-primary text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Key size={18} />
                <span>خرید لایسنس و دریافت آنی نرم‌افزار</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* Checkout Modal Integration */}
      {isCheckoutOpen && productData && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={productData}
          selectedVariation={selectedVariation}
        />
      )}
    </div>
  );
}
export default TarapolPage;
