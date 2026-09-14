import React, { useState } from 'react';
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
  Palette,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Footer } from '../../components/Footer';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showcaseModels, setShowcaseModels] = useState<string[]>(['Qwen 2.5 72B', 'Llama 3.1 405B', 'Mixtral 8x22B', 'Gemma 2', 'DBRX']);
  const [totalModels, setTotalModels] = useState<number>(42);

  React.useEffect(() => {
    fetch('/api/default-profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTotalModels(Math.max(42, data.length));
          const names = data.map(m => (m.modelName || m.id).split('/').pop()).filter(Boolean);
          // Get some unique interesting models
          const uniqueNames = Array.from(new Set(names)).slice(0, 8);
          if (uniqueNames.length > 0) {
            setShowcaseModels(uniqueNames);
          }
        }
      })
      .catch(err => console.error('Failed to fetch models for landing:', err));
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleStartChat = () => {
    navigate('/chat');
  };

  const topModels = [
    {
      id: 'claude',
      name: 'Claude 3.5 Sonnet',
      company: 'Anthropic',
      tag: 'استاد استدلال و کدنویسی',
      desc: 'قوی‌ترین هوش مصنوعی جهان برای نگارش ادبی فارسی، برنامه‌نویسی پیچیده، بازنویسی متون و استدلال عمیق.',
      badge: 'محبوب برنامه‌نویسان',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      accentColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-500'
    },
    {
      id: 'gpt4o',
      name: 'GPT-4o',
      company: 'OpenAI',
      tag: 'هوش همه‌کاره و خلاق',
      desc: 'پرچم‌دار جهانی شرکت OpenAI؛ ایده‌پردازی، نگارش خلاقانه، حل مسائل تحلیلی و گفتگو با سرعت بالا.',
      badge: 'پرکاربردترین',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
      accentColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-500'
    },
    {
      id: 'gemini',
      name: 'Gemini 2.0 Flash',
      company: 'Google',
      tag: 'سرعت مافوق صوت و دید بصری',
      desc: 'سرعت خیره‌کننده در تحلیل اسناد و PDF، درک دقیق عکس‌ها و تصاویر و جستجوی زنده در اینترنت.',
      badge: 'فوق‌سریع گوگل',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80',
      accentColor: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-500'
    },
    {
      id: 'flux',
      name: 'Flux.1 AI Studio',
      company: 'Black Forest Labs',
      tag: 'استودیوی خلق تصاویر هایپررئال',
      desc: 'تولید تصاویر هنری و واقع‌گرایانه با بالاترین وضوح جزئیات فقط با توصیف متنی به زبان فارسی.',
      badge: 'هنری و گرافیک',
      image: '/studio-presets/tehran2150.jpg',
      accentColor: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-500'
    }
  ];

  const galleryImages = [
    {
      src: '/studio-presets/tehran2150.jpg',
      title: 'تهران در سال ۲۱۵۰',
      prompt: 'نمایی از برج میلاد و تهران آینده، نئون‌های بنفش و سایبرپانک، ماشین‌های پرنده',
      tag: 'محیط شهری آینده‌نگر'
    },
    {
      src: '/studio-presets/space-fox.jpg',
      title: 'روباه کیهانی',
      prompt: 'پرتره سینمایی روباه فضایی با لباس کیهان‌نوردی در میان کهکشان و غبار ستاره‌ای',
      tag: 'فانتزی هایپررئال'
    },
    {
      src: '/studio-presets/crystal-tree.jpg',
      title: 'درخت بلورین شب‌تاب',
      prompt: 'درخت کریستالی درخشان با شاخه‌های الماس‌گون در شبی تاریک با نورافشانی ماورایی',
      tag: 'هنر مفهومی'
    },
    {
      src: '/studio-presets/samurai.jpg',
      title: 'سامورایی دیجیتال',
      prompt: 'جنگجوی افسانه‌ای با زره مدرن کروم و شمشیر نورانی زیر باران توکیو',
      tag: 'کاراکتر مفهومی'
    },
    {
      src: '/studio-presets/castle.jpg',
      title: 'قصر معلق در ابرها',
      prompt: 'کاخ باستانی شناور روی صخره‌های آسمانی، آبشارهای جادویی در غروب آفتاب',
      tag: 'سرزمین‌های فانتزی'
    },
    {
      src: '/studio-presets/cheetah.jpg',
      title: 'یوزپلنگ در دشت کریستال',
      prompt: 'یوزپلنگ تیزپا در حال دویدن در طبیعتی کریستالی با بازتاب‌های درخشان نور خورشید',
      tag: 'طبیعت و حیات‌وحش'
    }
  ];

  const packages = [
    {
      title: 'بسته پایه',
      price: '۲۰,۰۰۰',
      tokenEstimate: 'حدود ۱۰۰,۰۰۰ توکن',
      desc: 'مناسب برای پرسش و پاسخ‌های روزمره و نگارش متون کوتاه',
      features: ['دسترسی به تمام مدل‌ها', 'بدون تاریخ انقضا', 'محاسبه دقیق توکن'],
      isPopular: false
    },
    {
      title: 'بسته استاندارد',
      price: '۵۰,۰۰۰',
      tokenEstimate: 'حدود ۲۵۰,۰۰۰ توکن',
      desc: 'محبوب‌ترین انتخاب برای پژوهشگران، دانشجویان و تولید محتوا',
      features: ['دسترسی به Claude و GPT-4o', 'جستجوی زنده وب', 'بدون تاریخ انقضا', 'پشتیبانی اولویت‌دار'],
      isPopular: true
    },
    {
      title: 'بسته پیشرفته',
      price: '۱۰۰,۰۰۰',
      tokenEstimate: 'حدود ۵۰۰,۰۰۰ توکن',
      desc: 'ایده‌آل برای کدنویسی فشرده، پروژه‌های برنامه‌نویسی و کاربری حرفه‌ای',
      features: ['پردازش اسناد حجیم و PDF', 'استودیوی تولید تصویر', 'دسترسی نامحدود به ابزارها', 'بدون تاریخ انقضا'],
      isPopular: false
    }
  ];

  const faqs = [
    {
      q: 'اعتبار هدیه ۵۰,۰۰۰ تومانی چیست و چطور دریافت می‌شود؟',
      a: 'به محض ثبت‌نام اولیه با شماره موبایل یا ایمیل، مبلغ ۵۰,۰۰۰ تومان اعتبار نقدی رایگان بلافاصله به کیف پول شما واریز می‌شود. با این اعتبار می‌توانید صدها پیام باکیفیت به مدل‌های GPT-4o و Claude ارسال کنید و هوش و سرعت سیستم را بسنجید.'
    },
    {
      q: 'مدل پرداخت Pay-As-You-Go چگونه کار می‌کند؟',
      a: 'شما نیازی به خرید اشتراک‌های ماهانه دلاری سنگین ندارید. حساب خود را به تومان شارژ می‌کنید و به ازای هر پیامی که ارسال می‌کنید، فقط هزینه چند تک‌تومانی توکن‌های ورودی و خروجی از موجودی شما کسر می‌شود. اعتبار شما هرگز منقضی نمی‌شود.'
    },
    {
      q: 'آیا برای استفاده نیاز به فیلترشکن یا شماره مجازی خارجی است؟',
      a: 'خیر! تمامی ارتباطات از سرورهای اختصاصی ما به صورت مستقیم و بدون فیلتر برقرار می‌شود. برای ثبت‌نام نیازی به شماره خارجی یا کردیت کارت بین‌المللی نیست و با شماره موبایل یا حساب گوگل ایرانی به راحتی وارد می‌شوید.'
    },
    {
      q: 'آیا امکان دسترسی به فروشگاه و وبلاگ نیز وجود دارد؟',
      a: 'بله، در کنار چت هوش مصنوعی، فروشگاه اختصاصی برای خرید اکانت‌های رسمی، لایسنس‌ها و کلیدهای API و همچنین مجله تخصصی اخبار و آموزش‌های هوش مصنوعی در اختیار شماست.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#07090e] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Ambient Lighting Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent blur-[140px] rounded-full animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-bl from-purple-600/15 via-pink-600/10 to-transparent blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '11s' }} />
        <div className="absolute bottom-[-10%] left-[25%] w-[45%] h-[45%] bg-gradient-to-tr from-emerald-600/10 via-teal-600/5 to-transparent blur-[130px] rounded-full" />
      </div>

      {/* ---------------- 1. Standalone Sticky Header ---------------- */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-[#07090e]/80 border-b border-zinc-200/80 dark:border-white/5 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                دستیار هوشمند
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">پلتفرم هوش مصنوعی فارسی</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            <Link
              to="/chat"
              className="px-3 py-2 rounded-xl hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>چت‌باکس</span>
            </Link>
            <Link
              to="/store"
              className="px-3 py-2 rounded-xl hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-emerald-500" />
              <span>فروشگاه اشتراک‌ها</span>
            </Link>
            <Link
              to="/blog"
              className="px-3 py-2 rounded-xl hover:text-purple-600 dark:hover:text-purple-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span>مجله و اخبار AI</span>
            </Link>
            <a
              href="#gallery"
              className="px-3 py-2 rounded-xl hover:text-pink-600 dark:hover:text-pink-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <ImageIcon className="w-4 h-4 text-pink-500" />
              <span>گالری تصاویر</span>
            </a>
            <a
              href="#pricing"
              className="px-3 py-2 rounded-xl hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>تعرفه‌ها</span>
            </a>
            <a
              href="#faq"
              className="px-3 py-2 rounded-xl hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-all"
            >
              سوالات متداول
            </a>
          </nav>

          {/* Action CTA & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <span>ورود به محیط چت</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                >
                  ورود به حساب
                </button>
                <button
                  onClick={handleStartChat}
                  className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-zinc-900/10 dark:shadow-white/5 transition-all cursor-pointer"
                >
                  <span>شروع با ۵۰ هزار تومان هدیه</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- 2. Hero Section With Rich Visuals ---------------- */}
      <section className="relative z-10 pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Badges */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 pr-2 pl-3 rounded-full bg-white/90 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 shadow-sm backdrop-blur-xl mb-6">
          <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black animate-pulse">
            <Gift className="w-4 h-4" />
            <span>۵۰,۰۰۰ تومان اعتبار هدیه نقدی با ثبت‌نام اولیه</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">•</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-300 font-bold px-1">
            پرداخت ریالی شتاب • بدون نیاز به ویزاکارت یا فیلترشکن
          </span>
        </div>

        {/* Main H1 Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] sm:leading-[1.15] max-w-4xl text-zinc-900 dark:text-white mb-6">
          دسترسی آسان به برترین <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 dark:from-blue-400 dark:via-purple-400 dark:to-emerald-400">
            هوش‌های مصنوعی دنیا
          </span>
          <span className="block mt-2 text-2xl sm:text-4xl font-bold text-zinc-700 dark:text-zinc-300">
            به زبان فارسی و پرداخت به اندازه مصرف واقعی
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium leading-relaxed mb-8">
          دیگر نیازی به خرید اشتراک‌های ماهانه دلاری سنگین یا دغدغه قطع شدن فیلترشکن ندارید. با قوی‌ترین مدل‌های Claude 3.5، GPT-4o و Gemini به فارسی چت کنید و فقط هزینه کلمات مصرفی را به تومان بپردازید.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-10">
          <button
            onClick={handleStartChat}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-xl shadow-blue-600/25 hover:shadow-blue-600/35 transition-all cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>شروع گفتگو با ۵۰,۰۰۰ تومان هدیه</span>
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
          </button>

          <Link
            to="/store"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 font-bold text-sm sm:text-base shadow-sm transition-all"
          >
            <Store className="w-4 h-4 text-emerald-500" />
            <span>فروشگاه محصولات و اکانت‌ها</span>
          </Link>
        </div>

        {/* Hero Visual Mockup Combined With Rich 3D Visual */}
        <div className="w-full max-w-5xl mt-8 sm:mt-12 relative">
          <div className="relative rounded-3xl p-2 bg-gradient-to-b from-blue-500/20 via-purple-500/10 to-transparent border border-zinc-200/80 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl">
            {/* Visual Hero Banner Image */}
            <div className="relative h-48 sm:h-72 w-full rounded-2xl overflow-hidden mb-4">
              <img
                src="/images/hero-neural.jpg"
                alt="هوش مصنوعی پیشرفته فارسی"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-[#0c101a]/40 to-transparent flex items-end p-6">
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
                    موتور هوش مصنوعی چندگانه
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-white mt-2 drop-shadow-md">
                    پاسخ‌گویی آنی با سرعت مافوق صوت و بالاترین دقت نگارش فارسی
                  </h3>
                </div>
              </div>
            </div>

            {/* Interactive Chat Bubble Mockup */}
            <div className="bg-white/95 dark:bg-[#0c101a]/95 rounded-2xl p-4 sm:p-6 text-right border border-zinc-200/70 dark:border-white/5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Claude 3.5 Sonnet
                    </div>
                    <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      آنلاین • متصل به وب
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  موجودی شما: ۵۰,۰۰۰ تومان (هدیه رایگان)
                </div>
              </div>

              {/* User message */}
              <div className="flex justify-start mb-3">
                <div className="max-w-[85%] bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm leading-relaxed shadow-sm">
                  سلام! یک الگوریتم پایتون برای پردازش متن فارسی با هوش مصنوعی برام بنویس و سرعتش رو بگو.
                </div>
              </div>

              {/* AI message */}
              <div className="flex justify-end mb-2">
                <div className="max-w-[90%] bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/5 p-4 rounded-2xl rounded-tl-xs text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  <p className="mb-2 font-medium">
                    درود! برای پردازش فوق‌سریع زبان فارسی، مدل <strong>ParsBERT</strong> بهترین گزینه است:
                  </p>
                  <div className="bg-zinc-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] dir-ltr text-left mb-3">
                    from transformers import AutoTokenizer, AutoModel<br/>
                    tokenizer = AutoTokenizer.from_pretrained("HooshvareLab/bert-fa-base-uncased")
                  </div>
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      سرعت: ۰.۹ ثانیه • ۲۹۰ توکن
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      کسر از کیف پول: ۵۸ تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 3. Three Visual Portal Gateways ---------------- */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-3">
            شاهراه دسترسی به خدمات پلتفرم
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            مستقیماً به بخش دلخواه خود وارد شوید:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Chatbox */}
          <div className="group rounded-3xl overflow-hidden bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:border-blue-500/40 shadow-md hover:shadow-2xl transition-all flex flex-col justify-between text-right">
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src="/images/feature-developer.jpg"
                alt="چت‌باکس هوش مصنوعی"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
                  گفتگوی هوشمند
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">
                  چت‌باکس هوشمند (Chat App)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-medium">
                  چت با مدل‌های GPT-4o، Claude و Gemini، استخراج متن اسناد و PDF، جستجوی زنده در گوگل با ۵۰,۰۰۰ تومان هدیه اولیه.
                </p>
              </div>
              <Link
                to="/chat"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>ورود به چت‌باکس</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Store */}
          <div className="group rounded-3xl overflow-hidden bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:border-emerald-500/40 shadow-md hover:shadow-2xl transition-all flex flex-col justify-between text-right">
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src="/images/store-portal.jpg"
                alt="فروشگاه هوش مصنوعی"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                  محصولات و لایسنس
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">
                  فروشگاه اشتراک‌ها
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-medium">
                  خرید رسمی اشتراک ChatGPT Plus، کلیدهای اختصاصی API و لایسنس‌های معتبر هوش مصنوعی با پرداخت ریالی و تحویل فوری.
                </p>
              </div>
              <Link
                to="/store"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>مشاهده فروشگاه</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Blog */}
          <div className="group rounded-3xl overflow-hidden bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:border-purple-500/40 shadow-md hover:shadow-2xl transition-all flex flex-col justify-between text-right">
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src="/images/blog-portal.jpg"
                alt="وبلاگ هوش مصنوعی"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-bold shadow-sm">
                  اخبار و آموزش
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">
                  مجله و اخبار لحظه‌ای AI
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-medium">
                  تازه‌ترین رویدادهای هوش مصنوعی جهان، مقالات آموزشی، مقایسه مدل‌ها و ترفندهای مهندسی پرامپت به زبان فارسی روان.
                </p>
              </div>
              <Link
                to="/blog"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>ورود به وبلاگ</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 4. AI Image Generation Visual Showcase Gallery ---------------- */}
      <section id="gallery" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold mb-3">
            <Palette className="w-3.5 h-3.5" />
            <span>استودیوی تولید تصویر هوشمند (Flux.1)</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-4">
            تولید تصاویر شگفت‌انگیز با دستور متنی فارسی
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            فقط تصور کنید و بنویسید؛ هوش مصنوعی آن را با بالاترین کیفیت هنری و واقع‌گرایانه برای شما خلق می‌کند:
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="group rounded-3xl overflow-hidden bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 shadow-md hover:shadow-2xl transition-all flex flex-col text-right relative"
            >
              <div className="relative h-64 w-full overflow-hidden bg-zinc-900">
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-5">
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1">
                    {img.tag}
                  </span>
                  <h4 className="text-base font-black text-white mb-1.5">{img.title}</h4>
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-medium">
                    «{img.prompt}»
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 5. Models Showcase with Visual Cards ---------------- */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>قدرتمندترین مدل‌های هوش مصنوعی</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-4">
            بهترین مغزهای هوش مصنوعی در اختیار شما
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            بر اساس زمینه کاری خود بهترین هوش مصنوعی را انتخاب کنید:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topModels.map((model) => (
            <div
              key={model.id}
              className="rounded-3xl overflow-hidden bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 shadow-xs hover:shadow-xl transition-all text-right flex flex-col justify-between"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={model.image}
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-[#0c101a]/40 to-transparent flex items-end p-3.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white">
                    {model.badge}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                    {model.company}
                  </div>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white mb-1">
                    {model.name}
                  </h3>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3">
                    {model.tag}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 font-medium">
                    {model.desc}
                  </p>
                </div>
                <button
                  onClick={handleStartChat}
                  className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>شروع چت با {model.name}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 5.5 Multi-Routing Engine Showcase ---------------- */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/30 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/30 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="flex-1 text-right relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold mb-5 border border-white/20">
              <Layers className="w-4 h-4 text-blue-300" />
              <span>موتور مسیریابی هوشمند (Smart Router)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight">
              دسترسی یکپارچه به بیش از <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-extrabold text-5xl mx-1 drop-shadow-sm">{totalModels.toLocaleString('fa-IR')}</span> مدل برتر دنیا
            </h2>
            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              سیستم ما با استفاده از موتور پیشرفته <strong>Multi-Routing</strong>، درخواست شما را تحلیل کرده و به صورت خودکار آن را به بهینه‌ترین، سریع‌ترین و ارزان‌ترین مدل هدایت می‌کند تا ضمن کاهش چشمگیر هزینه‌ها، بالاترین کیفیت پاسخ‌گویی را تجربه کنید.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-2 justify-start" dir="ltr">
              {[...showcaseModels, 'و ده‌ها مدل دیگر...'].map((tag, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-white text-xs font-mono font-bold shadow-sm backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex-1 relative z-10 w-full max-w-sm">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10" dir="ltr">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-white font-bold text-sm">Routing Status</span>
              </div>
              <div className="space-y-3" dir="ltr">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/90 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Routing to OpenRouter</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-100 font-mono font-bold">
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Model Selected: Qwen-72B</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/90 font-mono">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Cost per 1k tokens: ~0.00$</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 6. Economic Comparison ---------------- */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900/90 dark:to-zinc-950 border border-zinc-200/80 dark:border-white/10 shadow-xl text-right">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-3">
              چرا مدل اعتباری (Pay-As-You-Go) به‌صرفه‌ترین انتخاب است؟
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              مقایسه اشتراک سنتی ۲۰ دلاری شرکت‌های خارجی با سیستم اعتباری منعطف دستیار هوشمند:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-100/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 text-right flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-red-500 mb-1">اشتراک ماهانه سنتی (خارجی)</div>
                <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-200 mb-4">
                  ماهانه ۲۰ دلار (~۱,۵۰۰,۰۰۰ تومان)
                </h3>
                <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  <li className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span>✕</span>
                    <span>پرداخت مبلغ کامل حتی اگر در ماه فقط چند پیام ارسال کنید</span>
                  </li>
                  <li className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span>✕</span>
                    <span>نیاز به مسترکارت یا ویزاکارت بین‌المللی و کارمزد صرافی</span>
                  </li>
                  <li className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span>✕</span>
                    <span>انقضای سهمیه با اتمام ماه میلادی</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 text-right flex flex-col justify-between shadow-md">
              <div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold mb-1">
                  پیشنهاد هوشمندانه
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">
                  شروع با ۵۰,۰۰۰ تومان هدیه + شارژ ریالی با مبالغ دلخواه
                </h3>
                <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>✓</span>
                    <span>پرداخت دقیقاً به اندازه تعداد توکن‌های مصرفی هر چت</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>✓</span>
                    <span>پرداخت با کارت‌های بانکی عضو شتاب بدون واسطه</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>✓</span>
                    <span>اعتبار شما هرگز منقضی نمی‌شود و تا همیشه محفوظ است</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 7. Pricing Packages ---------------- */}
      <section id="pricing" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
            <Coins className="w-3.5 h-3.5" />
            <span>بسته‌های شارژ اعتباری</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-4">
            تعرفه‌های شفاف، اقتصادی و منعطف
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            هر زمان به توکن بیشتری نیاز داشتید، با یک کلیک حساب خود را شارژ کنید:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-6 sm:p-7 text-right flex flex-col justify-between transition-all ${
                pkg.isPopular
                  ? 'bg-white dark:bg-zinc-900 border-2 border-emerald-500 shadow-xl relative scale-100 sm:scale-105 z-20'
                  : 'bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 shadow-xs'
              }`}
            >
              <div>
                {pkg.isPopular && (
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black mb-3">
                    محبوب‌ترین انتخاب
                  </div>
                )}
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">{pkg.title}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{pkg.price}</span>
                  <span className="text-xs text-zinc-500 font-bold">تومان</span>
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg inline-block">
                  {pkg.tokenEstimate}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-medium">
                  {pkg.desc}
                </p>
                <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-white/5 mb-6">
                  {pkg.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartChat}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  pkg.isPopular
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white'
                }`}
              >
                شروع و شارژ حساب
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 8. FAQ Section ---------------- */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-3">
            سوالات متداول
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            پاسخ سریع به پرسش‌های رایج کاربران درباره نحوه کار با دستیار هوشمند
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 overflow-hidden transition-all text-right"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer gap-4"
              >
                <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 transition-transform shrink-0 ${
                    activeFaq === idx ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1 border-t border-zinc-100 dark:border-white/5 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 9. Bottom CTA Banner ---------------- */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-black mb-4 relative z-10">
            آماده‌اید سرعت و هوش مصنوعی واقعی را تجربه کنید؟
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto mb-8 relative z-10 leading-relaxed font-medium">
            همین حالا ثبت‌نام کنید و ۵۰,۰۰۰ تومان اعتبار هدیه رایگان برای چت با GPT-4o و Claude 3.5 دریافت کنید.
          </p>
          <button
            onClick={handleStartChat}
            className="inline-flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all cursor-pointer relative z-10 hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>شروع چت با ۵۰,۰۰۰ تومان هدیه</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ---------------- 10. Footer ---------------- */}
      <Footer />
    </div>
  );
};
export default LandingPage;
