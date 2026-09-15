import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Sparkles,
  MessageSquare,
  Store,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Gift,
  Coins,
  CheckCircle2,
  Zap,
  Globe,
  Image as ImageIcon,
  ChevronDown,
  Cpu,
  Layers,
  Search,
  Check,
  Copy,
  Menu,
  X,
  FileText,
  SlidersHorizontal,
  Code2,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Footer } from '../../components/Footer';

interface DemoScenario {
  id: string;
  label: string;
  icon: any;
  model: string;
  modelBadge: string;
  userPrompt: string;
  aiResponse: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'contract',
    label: 'نگارش قرارداد و نامه اداری',
    icon: FileText,
    model: 'Claude 3.5 Sonnet',
    modelBadge: 'قدرتمندترین مدل ادبی و نگارش',
    userPrompt: 'یک پیش‌نویس قرارداد همکاری محرمانگی اطلاعات (NDA) برای یک پروژه استارتاپی به زبان فارسی رسمی و حقوقی بنویس.',
    aiResponse: `**قرارداد عدم افشای اطلاعات محرمانه (NDA)**

**ماده ۱ - طرفین قرارداد:**
این توافق‌نامه بین شرکت الف (افشاکننده) و طرف ب (دریافت‌کننده اطلاعات) با شرایط ذیل منعقد می‌گردد:

**ماده ۲ - موضوع قرارداد:**
حفظ محرمانگی کلیه داده‌های فنی، سورس‌کدها، الگوریتم‌ها و اسناد تجاری مبادله شده در طول مدت همکاری.

**ماده ۳ - تعهدات دریافت‌کننده:**
دریافت‌کننده متعهد می‌شود تدابیر امنیتی لازم را به کار بسته و از انتشار هرگونه اطلاعات بدون رضایت کتبی خودداری نماید.`
  },
  {
    id: 'coding',
    label: 'کدنویسی و رفع خطای نرم‌افزار',
    icon: Code2,
    model: 'DeepSeek-V3 / GPT-4o',
    modelBadge: 'متخصص معماری کد و الگوریتم',
    userPrompt: 'یک تابع تایپ‌اسکریپت بنویس که نرخ استفاده از توکن‌ها را به ازای هر دقیقه مدیریت و لاگ کند.',
    aiResponse: `\`\`\`typescript
interface TokenLimiter {
  maxTokensPerMinute: number;
  consumed: number;
  resetAt: number;
}

export function checkTokenLimit(limiter: TokenLimiter, tokensNeeded: number): boolean {
  const now = Date.now();
  if (now > limiter.resetAt) {
    limiter.consumed = 0;
    limiter.resetAt = now + 60_000;
  }
  if (limiter.consumed + tokensNeeded <= limiter.maxTokensPerMinute) {
    limiter.consumed += tokensNeeded;
    return true; // مجاز به ارسال
  }
  return false; // سهمیه این دقیقه پر شده است
}
\`\`\``
  },
  {
    id: 'vision',
    label: 'استودیو تصویرسازی فارسی',
    icon: ImageIcon,
    model: 'Flux.1 Studio',
    modelBadge: 'موتور هایپررئال نسل جدید',
    userPrompt: 'تصویر یک یوزپلنگ ایرانی تیزپا از جنس طلای مایع و کریستال در کویر لوت هنگام غروب آفتاب',
    aiResponse: `✨ **درخواست با موفقیت تحلیل شد و به پرامپت سینمایی تبدیل گشت:**
\`Action shot of a sleek Asiatic cheetah made of shimmering gold and crystal running gracefully across desert sand dunes at sunset, warm cinematic golden hour light, flying sand dust, 8k photorealism\`

🖼️ تصویر با رزولوشن 8K و نورپردازی واقع‌گرایانه آماده بارگیری است.`
  }
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  const galleryImages = [
    {
      src: '/images/gallery/tehran-2150.jpg',
      title: 'تهران در سال ۲۱۵۰',
      tag: 'سایبرپانک ایرانی',
      prompt: 'Cinematic photorealistic masterpiece of futuristic Tehran in year 2150, iconic Milad tower and Azadi monument reimagined in sleek neo-cyberpunk architecture, flying autonomous hovercrafts with neon light trails, misty atmospheric golden hour, 8k resolution, Octane render'
    },
    {
      src: '/images/gallery/persian-cyber-knight.jpg',
      title: 'سردار سایبرنتیک هخامنشی',
      tag: 'حماسی و کانسپت',
      prompt: 'Cinematic portrait of an ancient Persian warrior in cybernetic high-tech battle armor, engraved golden Farvahar patterns and glowing cyan energy lines, holding a sleek plasma scimitar sword, atmospheric smoke and rim lighting, dark background, ultra-detailed 8k'
    },
    {
      src: '/images/gallery/crystal-tree.jpg',
      title: 'درخت بلورین شب‌تاب',
      tag: 'طبیعت جادویی',
      prompt: 'Bioluminescent crystal tree in an enchanted dark forest at night, glowing amethyst and diamond branches, floating cyan fireflies and glowing dust, soft volumetric light rays, hyperrealistic cinematic fantasy nature photography, 8k resolution, octane render'
    },
    {
      src: '/images/gallery/space-fox.jpg',
      title: 'روباه فضانورد کیهانی',
      tag: 'علمی تخیلی سینمایی',
      prompt: 'Cinematic macro close-up portrait of a majestic cosmic space fox with fur woven from stardust and nebulae, wearing an intricate vintage astronaut helmet with brass fittings, deep space background with swirling galaxies and glittering constellations'
    },
    {
      src: '/images/gallery/crystal-cheetah.jpg',
      title: 'یوزپلنگ طلایی و بلورین',
      tag: 'حیات‌وحش مفهومی',
      prompt: 'Action shot of a sleek Asiatic cheetah made of shimmering gold and crystal running gracefully across desert sand dunes at sunset, warm cinematic golden hour light, flying sand dust, photorealistic wildlife masterpiece, 8k resolution'
    },
    {
      src: '/images/gallery/floating-sanctuary.jpg',
      title: 'قصر آسمانی و کهن',
      tag: 'معماری رویایی',
      prompt: 'A breathtaking ancient palace floating on a giant moss-covered celestial rock in the clouds, waterfalls pouring off the edge into golden sunset mist, ethereal floating architecture with Persian arches and domes, cherry blossom trees, 8k resolution'
    }
  ];

  const packages = [
    {
      title: 'هدیه ثبت‌نام',
      price: 'رایگان',
      rawPrice: 0,
      badge: 'هدیه شروع',
      badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      tokenEstimate: '~۱۵۰,۰۰۰ توکن سهمیه',
      messagesCount: 'حدود ۱۵۰ تا ۲۰۰ پیام کامل',
      desc: 'بلافاصله پس از ثبت‌نام اولیه به کیف پول شما افزوده می‌شود تا عملکرد مدل‌ها را بسنجید.',
      features: ['دسترسی به تمام مدل‌های هوش مصنوعی', 'بدون نیاز به کارت اعتباری', 'تحلیل اسناد و جستجوی وب'],
      isPopular: false,
      ctaText: 'شروع با اعتبار رایگان',
      ctaAction: () => (isAuthenticated ? navigate('/chat') : setAuthModalOpen(true))
    },
    {
      title: 'بسته پایه (استارتر)',
      price: '۴۹,۰۰۰',
      rawPrice: 49000,
      badge: 'مناسب دانشجویان',
      badgeColor: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      tokenEstimate: '~۴۰۰,۰۰۰ توکن سهمیه',
      messagesCount: 'حدود ۳۰۰ تا ۴۰۰ پاسخ هوشمند',
      desc: 'ایده‌آل برای پرسش و پاسخ‌های روزمره، نگارش ایمیل و خلاصه کردن مقالات.',
      features: ['دسترسی به Claude و GPT-4o', 'بدون تاریخ انقضا', 'محاسبه دقیق به اندازه مصرف'],
      isPopular: false,
      ctaText: 'تهیه بسته',
      ctaAction: () => navigate('/dashboard')
    },
    {
      title: 'بسته نقره‌ای',
      price: '۱۴۹,۰۰۰',
      rawPrice: 149000,
      creditGranted: '۱۸۰,۰۰۰ تومان',
      badge: 'محبوب‌ترین انتخاب (+۲۰٪ بونوس)',
      badgeColor: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold',
      tokenEstimate: '~۱,۸۰۰,۰۰۰ توکن سهمیه',
      messagesCount: 'معادل بیش از ۱,۵۰۰ پیام کامل',
      desc: 'پرفروش‌ترین بسته برای پژوهشگران، وکلا، پزشکان و تولیدکنندگان مداوم محتوا.',
      features: ['۲۰٪ اعتبار هدیه اضافه', 'تحلیل کامل فایل‌های PDF حجیم', 'استودیو تصویرساز بدون محدودیت', 'پشتیبانی در اولویت'],
      isPopular: true,
      ctaText: 'انتخاب بسته نقره‌ای',
      ctaAction: () => navigate('/dashboard')
    },
    {
      title: 'بسته طلایی (حرفه‌ای)',
      price: '۳۴۹,۰۰۰',
      rawPrice: 349000,
      creditGranted: '۴۵۰,۰۰۰ تومان',
      badge: 'بیشترین تخفیف (+۳۰٪ بونوس)',
      badgeColor: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold',
      tokenEstimate: '~۵,۵۰۰,۰۰۰ توکن سهمیه',
      messagesCount: 'معادل ۵,۰۰۰+ پیام و کدنویسی عمیق',
      desc: 'ویژه توسعه‌دهندگان، معماران سیستم، تیم‌ها و تحلیل‌گران داده‌های سنگین.',
      features: ['۳۰٪ شارژ تشویقی رایگان', 'اولویت اول در سرعت پردازش', 'تولید کدهای طولانی و پیشرفته', 'بدون تاریخ انقضا'],
      isPopular: false,
      ctaText: 'انتخاب بسته طلایی',
      ctaAction: () => navigate('/dashboard')
    }
  ];

  const faqs = [
    {
      q: 'اعتبار هدیه ۵۰,۰۰۰ تومانی چگونه دریافت می‌شود؟',
      a: 'به محض ثبت‌نام اولیه در سایت، مبلغ ۵۰,۰۰۰ تومان اعتبار نقدی بلافاصله به کیف پول حساب شما اضافه می‌شود. بدون نیاز به پرداخت هیچ هزینه‌ای می‌توانید بلافاصله وارد چت شوید و صدها پیام باکیفیت ارسال کنید.'
    },
    {
      q: 'تفاوت سیستم شما با خرید اکانت دلاری چیست؟',
      a: 'در خرید اشتراک‌های دلاری، باید ماهانه حداقل ۲۰ دلار (بیش از ۱ میلیون و ۷۰۰ هزار تومان) پرداخت کنید و درگیر قطعی فیلترشکن شوید. در پلتفرم ما، نیازی به فیلترشکن نیست و با کارت بانکی شتاب، فقط به اندازه چند تک‌تومانی کلماتی که استفاده می‌کنید هزینه می‌پردازید و اعتبارتان هرگز منقضی نمی‌شود.'
    },
    {
      q: 'چه مدل‌هایی در این پلتفرم در دسترس هستند؟',
      a: 'شما به طور همزمان به برترین مدل‌های روز دنیا شامل Claude 3.5 Sonnet، GPT-4o، Google Gemini 2.0 Flash، DeepSeek-V3 و استودیوی تصویرسازی Flux دسترسی دارید و می‌توانید در یک کلیک بین آن‌ها جابه‌جا شوید.'
    },
    {
      q: 'آیا امکان آپلود و تحلیل فایل و PDF وجود دارد؟',
      a: 'بله! می‌توانید اسناد متنی، فایل‌های PDF تا سقف ۵۰ مگابایت، فایل‌های کدنویسی، اکسل و تصاویر را آپلود کرده و از هوش مصنوعی بخواهید آن را خلاصه، تحلیل یا ترجمه کند.'
    }
  ];

  const copyPromptToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900 font-sans" dir="rtl">
      {/* ---------------- 1. Minimalistic Header ---------------- */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-[#09090b]/80 border-b border-zinc-200/80 dark:border-white/[0.08] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-white">
                دستیار هوشمند
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">پلتفرم جامع هوش مصنوعی</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <Link to="/chat" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              چت‌باکس هوشمند
            </Link>
            <a href="#models" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              مدل‌ها و امکانات
            </a>
            <a href="#gallery" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              استودیو تصویر
            </a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              بسته‌ها و تعرفه
            </a>
            <Link to="/store" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              فروشگاه
            </Link>
            <Link to="/blog" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              اخبار AI
            </Link>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>ورود به چت</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden sm:inline-flex px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ورود
                </button>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>شروع با هدیه</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              aria-label="منوی موبایل"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <Link
              to="/chat"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] text-xs font-bold"
            >
              <span>ورود به چت‌باکس هوشمند</span>
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
            <a
              href="#models"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              مدل‌ها و امکانات
            </a>
            <a
              href="#gallery"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              گالری استودیو تصویر
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              بسته‌ها و تعرفه توکن
            </a>
            <Link
              to="/store"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              فروشگاه محصولات
            </Link>
            <Link
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              اخبار و مجله AI
            </Link>
          </div>
        )}
      </header>

      {/* ---------------- 2. Hero Section ---------------- */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-64 sm:h-96 bg-zinc-400/10 dark:bg-white/[0.03] blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] shadow-xs text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-800 dark:text-zinc-200">۵۰٬۰۰۰ تومان اعتبار هدیه بدون نیاز به فیلترشکن</span>
          <span className="text-zinc-400">|</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-normal">پرداخت ریالی به اندازه مصرف</span>
        </div>

        {/* Crisp High-Contrast Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-950 dark:text-white leading-[1.25] sm:leading-[1.15] max-w-3xl mb-5">
          دسترسی مستقیم به <br />
          <span className="text-zinc-500 dark:text-zinc-400">برترین هوش‌های مصنوعی</span> جهان
        </h1>

        {/* Balanced Subtitle */}
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl font-normal leading-relaxed mb-8">
          بدون نیاز به خرید اشتراک‌های ماهانه دلاری یا دغدغه فیلترشکن؛ با برترین مدل‌های Claude 3.5، GPT-4o و Gemini به فارسی گفتگو کنید، اسناد را تحلیل نمایید و فقط به اندازه کلمات مصرفی پرداخت کنید.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-14">
          <Link
            to="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm shadow-md transition-all group"
          >
            <span>شروع گفتگو با اعتبار رایگان</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] font-bold text-sm transition-all"
          >
            <Coins className="w-4 h-4 text-zinc-500" />
            <span>مشاهده تعرفه‌ها و بسته‌ها</span>
          </a>
        </div>

        {/* ---------------- Interactive Hero Console ---------------- */}
        <div className="w-full max-w-4xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] shadow-2xl overflow-hidden text-right">
          {/* Console Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-[11px] font-mono text-zinc-400 mr-2">چت‌باکس هوشمند چندمدلی</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{activeScenario.model}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 font-semibold">
                {activeScenario.modelBadge}
              </span>
            </div>
          </div>

          {/* Scenario Selector Chips */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-zinc-100 dark:border-white/[0.06] overflow-x-auto [scrollbar-width:none]">
            {DEMO_SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              const isActive = activeScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Console Body Area */}
          <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm font-sans leading-relaxed">
            {/* User Message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-xl bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl rounded-tr-xs p-3.5 sm:p-4 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-white/[0.04]">
                <p className="font-medium">{activeScenario.userPrompt}</p>
              </div>
              <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-300 font-bold text-xs">
                شما
              </div>
            </div>

            {/* AI Response */}
            <div className="flex items-start gap-3 justify-start">
              <div className="w-7 h-7 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 max-w-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl rounded-tl-xs p-4 sm:p-5 text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
                {activeScenario.aiResponse}
              </div>
            </div>
          </div>

          {/* Console Footer with Direct CTA */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01]">
            <span className="text-[11px] text-zinc-400">بدون تاخیر • پردازش زنده (Streaming)</span>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white hover:underline underline-offset-4"
            >
              <span>تست زنده در چت‌باکس</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- 3. Bento Grid: Four Core Pillars ---------------- */}
      <section id="models" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight mb-3">
            همه قابلیت‌ها، در یک نقطه متمرکز
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal">
            به‌جای پراکندگی بین چندین سرویس و اشتراک‌های متعدد، از یک محیط یکپارچه استفاده کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Bento Card 1: Multi-Model Flagship (Double Column) */}
          <div className="md:col-span-2 rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white mb-2">
                دسترسی همزمان به پیشروترین مدل‌های AI
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                سوییچ آنی میان Claude 3.5 Sonnet، GPT-4o، Gemini 2.0 Flash و DeepSeek-V3؛ با روتینگ هوشمند (Smart Intent Detection) سیستم خودکار بهترین مدل را متناسب با درخواست شما انتخاب می‌کند.
              </p>
            </div>
            {/* Model Pills Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] text-center">
                <span className="block font-bold text-xs text-zinc-900 dark:text-white">Claude 3.5</span>
                <span className="text-[10px] text-zinc-400">ادبی و کدنویسی</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] text-center">
                <span className="block font-bold text-xs text-zinc-900 dark:text-white">GPT-4o</span>
                <span className="text-[10px] text-zinc-400">خلاقیت و تحلیل</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] text-center">
                <span className="block font-bold text-xs text-zinc-900 dark:text-white">Gemini 2.0</span>
                <span className="text-[10px] text-zinc-400">سرعت مافوق‌صوت</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] text-center">
                <span className="block font-bold text-xs text-zinc-900 dark:text-white">DeepSeek V3</span>
                <span className="text-[10px] text-zinc-400">استدلال و ریاضی</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: No VPN & Pay As You Go */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white mb-2">
                بدون تحریم و پرداخت ریالی
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                بدون نیاز به فیلترشکن و دغدغه مسدود شدن اکانت؛ با کارت بانکی شتاب شارژ کنید و هزینه پیام‌ها به صورت دانه‌ای و چند تک‌تومانی کسر می‌شود.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتبار شما هرگز منقضی نمی‌شود</span>
              </span>
            </div>
          </div>

          {/* Bento Card 3: Deep Document & Code Analysis */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-5">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white mb-2">
                تحلیل اسناد و فایل‌های سنگین
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                آپلود مستقیم کتاب‌ها و مقالات PDF تا سقف ۵۰ مگابایت، فایل‌های کدنویسی و دیتاهای اکسل جهت استخراج نکات، تلخیص و پاسخ‌گویی موشکافانه.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/[0.06] text-[11px] text-zinc-400">
              پشتیبانی از PDF، کد، اکسل و متن
            </div>
          </div>

          {/* Bento Card 4: High-End Image Studio (Double Column) */}
          <div className="md:col-span-2 rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-5">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white mb-2">
                استودیو خلق تصاویر هایپررئال با زبان فارسی
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                صحنه دلخواهتان را به فارسی تایپ کنید؛ موتور بهینه‌ساز پرامپت، ایده شما را به جزئیات غنی هنری و سینمایی تبدیل کرده و تصویری خیره‌کننده با موتورهای Flux تحویل می‌دهد.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">وضوح تا 8K • سبک‌های سینمایی، فانتزی و عکاسی</span>
              <a href="#gallery" className="text-xs font-bold text-zinc-900 dark:text-white hover:underline">
                مشاهده گالری آثار زیر ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 4. Hyperrealistic Image Gallery Showcase ---------------- */}
      <section id="gallery" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/[0.08]">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
              AI IMAGE STUDIO SHOWCASE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight">
              آثار تولیدشده توسط استودیوی تصویرساز
            </h2>
          </div>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white hover:underline underline-offset-4"
          >
            <span>ورود به استودیو و تولید تصویر دلخواه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Gallery Grid: 6 Real High-Resolution Images with Detailed English Prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="group rounded-3xl overflow-hidden bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image Preview */}
              <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                  {img.tag}
                </div>
              </div>

              {/* Card Meta & Prompt */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white mb-1.5">
                    {img.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-mono" dir="ltr">
                    {img.prompt}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => copyPromptToClipboard(img.prompt, idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedPromptIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">پرامپت کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی پرامپت انگلیسی</span>
                      </>
                    )}
                  </button>

                  <Link
                    to="/chat"
                    className="text-[11px] font-bold text-zinc-900 dark:text-white hover:underline"
                  >
                    تست این استایل
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 5. Transparent Hybrid Pricing Section ---------------- */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
            HONEST & TRANSPARENT PRICING
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight mb-3">
            تعرفه‌ها بر اساس تومان و سهمیه توکن
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal">
            بدون هزینه‌های پنهان، بدون کسر ماهانه خودکار. هر بسته به موجودی کیف‌پول شما اضافه شده و هرگز منقضی نمی‌شود.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                pkg.isPopular
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xl scale-[1.02] border-2 border-zinc-900 dark:border-white'
                  : 'bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 shadow-xs'
              }`}
            >
              <div>
                {/* Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
                      pkg.isPopular
                        ? 'bg-white/10 text-white dark:bg-zinc-900/10 dark:text-zinc-900 border-white/20 dark:border-zinc-900/20'
                        : pkg.badgeColor
                    }`}
                  >
                    {pkg.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-2">{pkg.title}</h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-3xl font-black font-mono tracking-tight">{pkg.price}</span>
                  {pkg.rawPrice > 0 && <span className="text-xs font-medium opacity-70">تومان</span>}
                </div>

                {/* Token / Messages Estimate Badge */}
                <div
                  className={`p-3 rounded-2xl mb-4 text-xs space-y-1 ${
                    pkg.isPopular
                      ? 'bg-white/10 dark:bg-zinc-900/5 text-inherit'
                      : 'bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="font-bold font-mono">{pkg.tokenEstimate}</div>
                  <div className="text-[11px] opacity-80">{pkg.messagesCount}</div>
                </div>

                <p className="text-xs opacity-80 leading-relaxed mb-6">{pkg.desc}</p>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs mb-8">
                  {pkg.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${pkg.isPopular ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-500'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action CTA */}
              <button
                onClick={pkg.ctaAction}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  pkg.isPopular
                    ? 'bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950'
                }`}
              >
                {pkg.ctaText}
              </button>
            </div>
          ))}
        </div>

        {/* Pricing Guarantee Banner */}
        <div className="mt-10 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ضمانت بازگشت وجه در صورت نارضایتی</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>شارژ آنی کیف پول بلافاصله پس از پرداخت شتاب</span>
          </div>
        </div>
      </section>

      {/* ---------------- 6. Frequently Asked Questions ---------------- */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-3xl mx-auto border-t border-zinc-200/80 dark:border-white/[0.08]">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight mb-2">
            پرسش‌های متداول
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            پاسخ سریع به ابهامات رایج کاربران پیش از شروع
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-zinc-900 dark:text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-white/[0.04]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- 7. Final Call to Action ---------------- */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl p-8 sm:p-12 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              همین حالا با ۵۰٬۰۰۰ تومان هدیه شروع کنید
            </h2>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
              ثبت‌نام در کمتر از ۳۰ ثانیه؛ بدون نیاز به کارت بانکی یا پرداخت وجه، بلافاصله وارد محیط چت شوید.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/chat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800 font-bold text-sm shadow-md transition-all"
              >
                <span>ورود به چت‌باکس</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/store"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/20 text-inherit font-bold text-sm transition-all"
              >
                <Store className="w-4 h-4" />
                <span>مشاهده فروشگاه</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 8. Footer Component ---------------- */}
      <Footer />
    </div>
  );
};
