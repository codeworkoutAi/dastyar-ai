import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { 
  Store, CheckCircle2, XCircle, BookOpen, Package, Zap, Sparkles, 
  ChevronLeft, Search, X, ShieldCheck, CreditCard, Send, ShoppingBag, 
  ArrowUpDown, Wallet, Plus, Info, Bot, MessageSquare, Clock,
  LayoutGrid, List, Layers, Key, ChevronRight, Palette, Code, Flame
} from 'lucide-react';
import { CheckoutModal } from '../../components/CheckoutModal';
import { Footer } from '../../components/Footer';
import { GlobalHeader } from '../../components/GlobalHeader';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';

export function StoreFront() {
  const { id } = useParams<{ id: string }>();
  const { setIsWalletOpen } = useUIStore();
  const { settings } = useSettingsStore();
  const { user, checkAuth } = useAuthStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode & Quick Filters
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [onlyInstant, setOnlyInstant] = useState(false);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % 4);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + 4) % 4);

  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [isCarouselPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentStatus = searchParams.get('payment');
  const orderId = searchParams.get('orderId');
  const refId = searchParams.get('refId');
  const msg = searchParams.get('msg');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (paymentStatus === 'success') {
      checkAuth();
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (user && products.length > 0) {
      const saved = sessionStorage.getItem('pending_checkout');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = products.find(p => String(p.id) === String(parsed.productId));
          if (found) {
            sessionStorage.removeItem('pending_checkout');
            setSelectedProduct(found);
          }
        } catch (e) {}
      }
    }
  }, [user, products]);

  useEffect(() => {
    const isRoot = window.location.pathname === '/';
    setPageSeo({
      title: 'Dastyar AI | فروشگاه تخصصی ابزارها و اکانت‌های هوش مصنوعی',
      description: 'فروشگاه تخصصی هوش مصنوعی Dastyar AI: خرید اکانت قانونی و اختصاصی، شارژ کیف پول، کلیدهای API و پکیج‌های آموزشی با تحویل سریع، ضمانت کامل و مشاور هوشمند خرید.',
      canonical: isRoot ? `${window.location.origin}/` : `${window.location.origin}/store`,
      ogType: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'OnlineStore',
            name: 'فروشگاه تخصصی هوش مصنوعی Dastyar AI',
            description: 'فروشگاه تخصصی هوش مصنوعی: خرید بسته‌های اعتباری، اکانت‌های اختصاصی، کلیدهای API و پکیج‌های آموزشی با تحویل سریع و ضمانت کامل.',
            url: isRoot ? `${window.location.origin}/` : `${window.location.origin}/store`,
            image: `${window.location.origin}/pwa-512x512.png`,
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'محصولات و خدمات هوش مصنوعی',
              itemListElement: products.slice(0, 12).map((p) => ({
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Product',
                  name: p.title,
                  url: `${window.location.origin}/store/product/${p.id}`
                },
                price: (p.price || 0) * 10,
                priceCurrency: 'IRR'
              }))
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: `${window.location.origin}/store` }
            ]
          }
        ]
      }
    });
  }, [products]);

  const fetchProducts = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/store/products');
      if (!res.ok) throw new Error('خطا در دریافت لیست محصولات');
      const data = await res.json();
      setProducts(data);
      if (id) {
        const found = data.find((p: any) => p.id.toString() === id);
        if (found) {
          setSelectedProduct(found);
        }
      }
      setLoading(false);
    } catch (err: any) {
      if (retryCount < 2) {
        setTimeout(() => fetchProducts(retryCount + 1), 1200);
        return;
      }
      const rawMsg = err?.message || '';
      const isNetworkError = rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('networkerror');
      setError(isNetworkError ? 'عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.' : (err.message || 'خطای سرور'));
      setLoading(false);
    }
  };

  const getProductTitleStyle = (title: string, cat?: string) => {
    const t = title.toLowerCase();
    if (cat === 'plan' || t.includes('بسته') || t.includes('طلایی')) {
      return 'bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent font-black drop-shadow-xs';
    }
    return 'clay-news-title font-black drop-shadow-xs';
  };

  // Category Counts
  const counts = useMemo(() => {
    return {
      all: products.length,
      plan: products.filter(p => p.category === 'plan').length,
      account: products.filter(p => p.category === 'account').length,
      api: products.filter(p => p.category === 'api').length,
      package: products.filter(p => p.category === 'package').length,
    };
  }, [products]);

  // Filtered & Sorted Products
  const processedProducts = useMemo(() => {
    let result = products.filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (onlyInstant && !(p.deliveryType === 'instant' || (p.deliveryTime && p.deliveryTime.includes('فوری')))) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchFeat = p.features?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchFeat;
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      }
      if (sortBy === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      // 'newest' default
      return (b.id || 0) - (a.id || 0);
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, onlyInstant]);

  const heroSlides = [
    {
      id: 'flagship',
      badge: 'مرجع رسمی و قانونی اشتراک‌های هوش مصنوعی',
      badgeColor: 'text-indigo-700 dark:text-indigo-300 border-indigo-300/40 dark:border-indigo-700/50',
      titleHighlight: 'خرید قانونی و مطمئن',
      titleRest: ' اشتراک ابزارهای برتر هوش مصنوعی',
      titleGradient: 'from-indigo-600 via-purple-600 to-sky-600 dark:from-indigo-300 dark:via-purple-200 dark:to-cyan-300',
      description: 'فعال‌سازی ۱۰۰٪ قانونی و اختصاصی روی ایمیل شخصی با تحویل فوری، گارانتی تعویض تا پایان اشتراک و پرداخت امن شتاب.',
      primaryBtnText: 'مشاوره هوشمند انتخاب اکانت',
      primaryBtnAction: () => window.dispatchEvent(new CustomEvent('open-advisor-widget')),
      primaryBtnIcon: Bot,
      secondaryBtnText: 'مشاهده محصولات و پلن‌ها',
      secondaryBtnAction: () => document.getElementById('products-catalog')?.scrollIntoView({ behavior: 'smooth' }),
      cardBadge: 'VIP Pass • اکانت قانونی',
      cardTitle: 'اکانت‌های اختصاصی پرمیوم',
      cardSubtitle: 'فعال‌سازی قانونی روی ایمیل شخصی شما',
      features: [
        'گارانتی کامل تعویض',
        'پشتیبانی ۲۴ ساعته',
        'پرداخت مستقیم شتاب',
        'بدون قطعی و بن‌شدن'
      ],
      tag: '100% Guaranteed',
      tagText: 'تایید هویت و اصالت لایسنس‌ها',
      bgGradients: 'from-indigo-50/90 via-purple-50/40 to-sky-50/50 dark:from-slate-900/95 dark:via-indigo-950/40 dark:to-zinc-950 border-indigo-200/80 dark:border-indigo-500/25'
    },
    {
      id: 'creative',
      badge: 'استودیو هوش مصنوعی خلق تصویر و ویدیو',
      badgeColor: 'text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-700/50',
      titleHighlight: 'خلق ایده‌ها در چند ثانیه؛',
      titleRest: ' استودیوهای حرفه‌ای تصویر و ویدیو',
      titleGradient: 'from-purple-600 via-pink-600 to-rose-500 dark:from-purple-300 dark:via-pink-200 dark:to-rose-300',
      description: 'اکانت‌های اختصاصی پرمیوم با بالاترین سهمیه خلق اثر، دسترسی نامحدود به موتورهای استودیویی و گارانتی کارکرد.',
      primaryBtnText: 'مشاهده ابزارهای خلاقیت و تصویر',
      primaryBtnAction: () => {
        setSelectedCategory('account');
        document.getElementById('products-catalog')?.scrollIntoView({ behavior: 'smooth' });
      },
      primaryBtnIcon: Palette,
      secondaryBtnText: 'مشاوره انتخاب ابزار طراحی',
      secondaryBtnAction: () => window.dispatchEvent(new CustomEvent('open-advisor-widget', { detail: { prompt: 'برای تولید تصویر و طراحی گرافیک چه اکانتی مناسب‌تر است؟' } })),
      cardBadge: 'Creative Pass • رندر نامحدود',
      cardTitle: 'ابزارهای تخصصی هنر و تصویر',
      cardSubtitle: 'بالاترین کیفیت خروجی و جنریت سریع',
      features: [
        'سهمیه کامل جنریت',
        'کیفیت Ultra-HD و 4K',
        'بدون صف و تاخیر',
        'پشتیبانی تخصصی طراحی'
      ],
      tag: 'Studio Grade',
      tagText: 'موتورهای فوتورئال و خلاقانه استودیویی',
      bgGradients: 'from-purple-50/90 via-pink-50/40 to-indigo-50/50 dark:from-zinc-950 dark:via-purple-950/50 dark:to-slate-900 border-purple-200/80 dark:border-purple-500/25'
    },
    {
      id: 'developers',
      badge: 'ویژه توسعه‌دهندگان، برنامه‌نویسان و پژوهشگران',
      badgeColor: 'text-cyan-700 dark:text-cyan-300 border-cyan-300/40 dark:border-cyan-700/50',
      titleHighlight: 'سرعت کدنویسی را ۳ برابر کنید؛',
      titleRest: ' با کردیت و لایسنس ادیتورها',
      titleGradient: 'from-cyan-600 via-teal-600 to-blue-600 dark:from-cyan-300 dark:via-teal-200 dark:to-sky-300',
      description: 'کردیت‌های رسمی با دسترسی مستقیم، بدون محدودیت توکن و قابل اتصال به VS Code و محیط‌های توسعه نرم‌افزار.',
      primaryBtnText: 'مشاهده کلیدهای API و پلن‌ها',
      primaryBtnAction: () => {
        setSelectedCategory('api');
        document.getElementById('products-catalog')?.scrollIntoView({ behavior: 'smooth' });
      },
      primaryBtnIcon: Code,
      secondaryBtnText: 'مشاوره فنی و اتصال به ادیتور',
      secondaryBtnAction: () => window.dispatchEvent(new CustomEvent('open-advisor-widget', { detail: { prompt: 'برای برنامه‌نویسی و اتصال به ادیتور چه اکانتی مناسب است؟' } })),
      cardBadge: 'Dev License • اتصال مستقیم',
      cardTitle: 'کردیت‌ها و کلیدهای توسعه',
      cardSubtitle: 'پایداری بالا و پینگ عالی برای کدنویسی',
      features: [
        'اتصال مستقیم به ادیتور',
        'کردیت رسمی و قانونی',
        'بدون قطعی سرور',
        'فعال‌سازی سریع روی حساب'
      ],
      tag: 'API & Editor Ready',
      tagText: 'سازگار با تمام محیط‌های توسعه و ترمینال',
      bgGradients: 'from-cyan-50/90 via-teal-50/40 to-blue-50/50 dark:from-slate-950 dark:via-cyan-950/40 dark:to-zinc-950 border-cyan-200/80 dark:border-cyan-500/25'
    },
    {
      id: 'festival',
      badge: 'تحویل فوری و تضمین ۱۰۰٪ اصالت سفارش',
      badgeColor: 'text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-700/50',
      titleHighlight: 'بسته‌های جامع و تخفیف‌های ویژه؛',
      titleRest: ' با تحویل آنی و تضمینی',
      titleGradient: 'from-amber-600 via-orange-600 to-rose-600 dark:from-amber-300 dark:via-orange-200 dark:to-rose-300',
      description: 'تمامی سرویس‌ها با گارانتی تعویض تا روز آخر دوره، پشتیبانی دائم تلگرام و پرداخت امن شاپرک یا کارت‌به‌کارت.',
      primaryBtnText: 'مشاهده تخفیف‌ها و آفرها',
      primaryBtnAction: () => {
        setSelectedCategory('all');
        document.getElementById('products-catalog')?.scrollIntoView({ behavior: 'smooth' });
      },
      primaryBtnIcon: Flame,
      secondaryBtnText: 'پشتیبانی و راهنمایی تلگرام',
      secondaryBtnAction: () => window.open('https://t.me/dastyar_support', '_blank'),
      cardBadge: 'Gold Warranty • گارانتی تعویض',
      cardTitle: 'ضمانت اصالت و عملکرد ۱۰۰٪',
      cardSubtitle: 'پشتیبانی بی‌وقفه تا آخرین روز اشتراک',
      features: [
        'تحویل فوری زیر ۲۴ ساعت',
        'ضمانت تعویض تا روز آخر',
        'پشتیبانی تلگرام و پیامک',
        'درگاه شاپرک و کارت‌به‌کارت'
      ],
      tag: 'Instant Fulfillment',
      tagText: 'فعال‌سازی اختصاصی بدون واسطه و سریع',
      bgGradients: 'from-amber-50/90 via-orange-50/40 to-rose-50/50 dark:from-zinc-950 dark:via-rose-950/40 dark:to-amber-950/30 border-amber-200/80 dark:border-amber-500/25'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300">
      <GlobalHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Payment Result Banners */}
        {paymentStatus === 'success' && (
          <div className="mb-8 p-5 clay-card-thick !border-emerald-500/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h3 className="font-black text-base text-emerald-600 dark:text-emerald-400 mb-1">
                پرداخت با موفقیت انجام و سفارش ثبت شد!
              </h3>
              <p className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start">
                <span>شماره سفارش: <span className="font-mono font-bold text-[var(--text-main)]">{orderId}</span></span>
                {refId && <span>شماره مرجع بانکی: <span className="font-mono font-bold text-[var(--text-main)]">{refId}</span></span>}
              </p>
            </div>
            <button
              onClick={() => navigate('/store', { replace: true })}
              className="px-5 py-2.5 clay-btn-primary font-bold text-xs shrink-0 w-full sm:w-auto"
            >
              متوجه شدم
            </button>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mb-8 p-5 clay-card-thick !border-red-500/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h3 className="font-black text-base text-red-500 mb-1">پرداخت انجام نشد</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {msg ? decodeURIComponent(msg) : 'در صورت کسر وجه از حساب شما، طبق ضوابط شبکه شاپرک مبلغ تا ۷۲ ساعت آینده بازمی‌گردد.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/store', { replace: true })}
              className="px-5 py-2.5 clay-btn text-xs font-bold shrink-0 w-full sm:w-auto"
            >
              بستن
            </button>
          </div>
        )}

        {/* Dynamic Architectural Hero Carousel Section (Hardware-Accelerated 60fps, Zero Heavy Blur) */}
        <div 
          className="mb-10 clay-card-thick rounded-3xl relative overflow-hidden shadow-xl border border-indigo-200/80 dark:border-indigo-500/25 border-t border-t-white/80 dark:border-t-white/15 transition-all duration-500"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Track Container */}
          <div className="relative w-full overflow-hidden min-h-[460px] sm:min-h-[400px] lg:min-h-[360px] p-6 sm:p-10 flex items-center">
            {heroSlides.map((slide, idx) => {
              const isActive = idx === currentSlide;
              const PrimaryIcon = slide.primaryBtnIcon;
              
              return (
                <div
                  key={slide.id}
                  className={`w-full transition-all duration-500 ease-out transform ${
                    isActive
                      ? 'opacity-100 translate-x-0 relative z-10'
                      : 'opacity-0 pointer-events-none absolute inset-0 p-6 sm:p-10 flex items-center ' +
                        (idx < currentSlide ? 'translate-x-full' : '-translate-x-full')
                  }`}
                >
                  <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
                    {/* Right: Text & Actions */}
                    <div className="space-y-4 max-w-2xl text-center lg:text-right">
                      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-surface text-xs font-black shadow-xs border ${slide.badgeColor}`}>
                        <Sparkles size={14} className="text-amber-500" />
                        <span>{slide.badge}</span>
                      </div>
                      
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-black tracking-tight leading-tight md:leading-[1.25]">
                        <span className={`bg-gradient-to-l ${slide.titleGradient} bg-clip-text text-transparent`}>
                          {slide.titleHighlight}
                        </span>
                        <br className="hidden sm:inline" />
                        <span className="text-zinc-900 dark:text-zinc-100">{slide.titleRest}</span>
                      </h1>
                      
                      <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                        {slide.description}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                        <button
                          type="button"
                          onClick={slide.primaryBtnAction}
                          className="px-6 py-3.5 clay-btn-primary font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
                        >
                          <PrimaryIcon size={18} className="text-yellow-300" />
                          <span>{slide.primaryBtnText}</span>
                        </button>

                        <button
                          type="button"
                          onClick={slide.secondaryBtnAction}
                          className="px-6 py-3.5 clay-btn font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 text-[var(--text-main)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                        >
                          <ShoppingBag size={17} />
                          <span>{slide.secondaryBtnText}</span>
                        </button>
                      </div>
                    </div>

                    {/* Left: Product Visual Card */}
                    <div className="w-full lg:w-[400px] shrink-0">
                      <div className="flex flex-col gap-3">
                        <div className="clay-card rounded-2xl p-5 border border-indigo-200/80 dark:border-indigo-700/50 shadow-xl relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 border-t border-t-white/90 dark:border-t-white/20">
                          <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-black/5 dark:border-white/10">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                تحویل فوری و تضمینی
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full clay-surface text-[var(--text-main)] border border-[var(--card-border)]">
                              {slide.cardBadge}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                                  {slide.cardTitle}
                                </h4>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {slide.cardSubtitle}
                                </span>
                              </div>
                              <div className="w-9 h-9 rounded-xl clay-btn-thick flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                                <Sparkles size={18} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                              {slide.features.map((feat, fIdx) => (
                                <div key={fIdx} className="p-2 rounded-xl clay-surface flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  <span className="truncate">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Sub Showcase Strip */}
                        <div className="px-4 py-2.5 rounded-xl clay-subcard border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                          <span className="font-bold flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-sky-500" />
                            <span>{slide.tagText}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold" dir="ltr">
                            {slide.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls: Left / Right Arrows */}
          <button
            type="button"
            onClick={prevSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full clay-btn flex items-center justify-center text-[var(--text-main)] hover:text-indigo-600 dark:hover:text-indigo-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            title="بنر قبلی"
          >
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full clay-btn flex items-center justify-center text-[var(--text-main)] hover:text-indigo-600 dark:hover:text-indigo-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            title="بنر بعدی"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Progress Pill Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full clay-surface/80 backdrop-blur-md border border-[var(--card-border)]">
            {heroSlides.map((_, dotIdx) => {
              const isDotActive = dotIdx === currentSlide;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentSlide(dotIdx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isDotActive
                      ? 'w-7 h-2 bg-indigo-600 dark:bg-indigo-400 shadow-xs'
                      : 'w-2 h-2 bg-black/25 dark:bg-white/25 hover:bg-black/50 dark:hover:bg-white/50'
                  }`}
                  title={`اسلاید ${dotIdx + 1}`}
                />
              );
            })}
          </div>

          {/* 4 Trust & Value Props Badges with Vibrant Color Identities */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-8 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl clay-subcard border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <Zap size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white">تحویل ۱ تا ۲۴ ساعت</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">فعال‌سازی قانونی و اختصاصی</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl clay-subcard border border-sky-500/30 bg-sky-50/70 dark:bg-sky-950/30 hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white">ضمانت اصالت و عملکرد</span>
                <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold">گارانتی تعویض تا پایان دوره</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl clay-subcard border border-purple-500/30 bg-purple-50/70 dark:bg-purple-950/30 hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                <CreditCard size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white">پرداخت امن بانکی</span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">درگاه شاپرک و کارت‌به‌کارت</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl clay-subcard border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 hover:scale-[1.01] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Send size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white">پشتیبانی تلگرام</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">راهنمایی و پیگیری ۲۴/۷</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Section Header with Invariant SEO Rank #7 H2 */}
        <div id="products-catalog" className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-black text-[var(--text-main)] flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته</span>
          </h2>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            تضمین اصالت • تحویل قانونی روی ایمیل
          </span>
        </div>

        {/* Tier 1: Category Navigation Tabs (Pills with generous breathing room & 1-click select) */}
        <div className="mb-4 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'همه محصولات', icon: Layers, count: counts.all },
            { id: 'account', label: 'اکانت‌های اختصاصی', icon: Sparkles, count: counts.account },
            { id: 'api', label: 'کلیدهای API', icon: Key, count: counts.api },
            { id: 'plan', label: 'پلن‌ها و بسته‌ها', icon: Zap, count: counts.plan },
            { id: 'package', label: 'پکیج‌های آموزشی', icon: BookOpen, count: counts.package },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'clay-btn-primary shadow-md scale-[1.02]'
                    : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-indigo-400/30'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-white' : 'text-indigo-500'} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-price ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'clay-surface text-[var(--text-muted)]'
                  }`}
                >
                  {usePersianDigits ? toPersianDigits(cat.count) : cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier 2: Search, Sort & Quick Filter Command Bar */}
        <div className="mb-8 p-3 sm:p-4 rounded-2xl clay-card-thick border border-[var(--card-border)] shadow-md flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Live Search */}
          <div className="relative flex-1 w-full clay-surface-inset rounded-xl flex items-center px-3 py-1.5 border border-black/5 dark:border-white/5">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، دسته‌بندی یا ویژگی‌های محصولات..."
              className="w-full bg-transparent border-none py-1.5 pr-2 pl-4 text-xs sm:text-sm font-medium text-[var(--text-main)] outline-none placeholder:text-[var(--text-dim)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[var(--text-dim)] hover:text-[var(--text-main)] p-1 shrink-0 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Controls: Quick Filter, Sort, View Mode */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 flex-wrap sm:flex-nowrap">
            {/* Instant Delivery Toggle */}
            <button
              type="button"
              onClick={() => setOnlyInstant(!onlyInstant)}
              className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                onlyInstant
                  ? 'clay-btn-primary bg-emerald-600 text-white shadow-xs'
                  : 'clay-btn text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Zap size={14} className={onlyInstant ? 'text-yellow-300' : 'text-emerald-500'} />
              <span>تحویل فوری</span>
            </button>

            {/* Sort Select */}
            <div className="h-10 px-2.5 rounded-xl clay-surface flex items-center gap-1.5 border border-[var(--card-border)] shrink-0">
              <ArrowUpDown size={14} className="text-amber-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer pr-1"
              >
                <option value="popular" className="dark:bg-zinc-900">محبوب‌ترین ⭐</option>
                <option value="newest" className="dark:bg-zinc-900">جدیدترین 🆕</option>
                <option value="price_asc" className="dark:bg-zinc-900">ارزان‌ترین 🟢</option>
                <option value="price_desc" className="dark:bg-zinc-900">گران‌ترین 💎</option>
              </select>
            </div>

            {/* View Mode Toggle (Grid / List) */}
            <div className="h-10 p-1 rounded-xl clay-surface flex items-center border border-[var(--card-border)] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'clay-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="نمایش شبکه‌ای (کارت)"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'clay-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="نمایش لیستی (فشرده)"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-bold text-[var(--text-muted)]">در حال دریافت محصولات فروشگاه...</span>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl clay-card text-center flex flex-col items-center justify-center">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button onClick={() => fetchProducts(0)} className="px-6 py-2 clay-btn-primary text-xs font-bold">
              تلاش مجدد
            </button>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 clay-card-thick rounded-3xl opacity-60">
            <Store size={48} className="mb-3 text-[var(--text-dim)]" />
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">محصولی یافت نشد</h3>
            <p className="text-xs text-[var(--text-muted)]">موردی با این فیلتر یا عبارت جستجو وجود ندارد.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-3">
            {processedProducts.map((p) => {
              let hasVariations = false;
              let minPrice = p.price;
              if (p.variations) {
                try {
                  const parsedVars = JSON.parse(p.variations);
                  if (Array.isArray(parsedVars) && parsedVars.length > 1) {
                    hasVariations = true;
                    const prices = parsedVars.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number');
                    if (prices.length > 0) minPrice = Math.min(...prices);
                  }
                } catch (e) {}
              }
              const formattedPrice = p.price 
                ? `${hasVariations ? 'از ' : ''}${parseInt(minPrice, 10).toLocaleString('fa-IR')} تومان` 
                : 'رایگان';

              return (
                <div
                  key={p.id}
                  className="group flex flex-col md:flex-row items-center justify-between p-4 sm:p-5 clay-card-thick rounded-2xl gap-4 hover:-translate-y-0.5 transition-all"
                >
                  {/* Thumbnail & Basic Info */}
                  <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                    <div 
                      onClick={() => navigate(`/store/product/${p.id}`)}
                      className="w-24 sm:w-28 h-20 rounded-xl overflow-hidden relative shrink-0 cursor-pointer border border-[var(--card-border)] bg-[var(--card-bg)]"
                    >
                      {p.bannerImage || p.image ? (
                        <img
                          src={p.bannerImage || p.image}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-accent-primary)]">
                          <Sparkles className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      {p.badge && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.2 rounded-md bg-[var(--color-accent-primary)] text-white font-bold shadow-xs">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          onClick={() => navigate(`/store/product/${p.id}`)}
                          className="text-sm sm:text-base font-black text-[var(--text-main)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer truncate"
                        >
                          {usePersianDigits ? toPersianDigits(p.title) : p.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md clay-surface text-[var(--text-muted)] shrink-0">
                          {p.category === 'plan' ? 'پلن تعرفه' : p.category === 'api' ? 'کلید API' : p.category === 'account' ? 'اکانت پرمیوم' : 'پکیج'}
                        </span>
                      </div>

                      {p.description && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 leading-relaxed">
                          {p.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-dim)] pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-emerald-500" />
                          <span>{p.deliveryTime || 'تحویل ۱ تا ۲۴ ساعت'}</span>
                        </span>
                        {p.tokenEstimate && (
                          <span className="flex items-center gap-1 text-[var(--color-accent-primary)] font-bold">
                            <Zap size={12} />
                            <span>{usePersianDigits ? toPersianDigits(p.tokenEstimate) : p.tokenEstimate}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--card-border)]">
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-[10px] text-[var(--text-muted)]">مبلغ قابل پرداخت:</span>
                      <span className="text-sm sm:text-base font-black text-[var(--color-accent-primary)] font-price">
                        {formattedPrice}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            sessionStorage.setItem('pending_checkout', JSON.stringify({ productId: p.id }));
                            window.dispatchEvent(new CustomEvent('open-auth-modal'));
                            return;
                          }
                          setSelectedProduct(p);
                        }}
                        className="py-2 px-4 clay-btn-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                      >
                        <ShoppingBag size={14} />
                        <span>خرید سریع</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/store/product/${p.id}`)}
                        className="py-2 px-3 clay-btn font-bold text-xs rounded-xl flex items-center justify-center gap-1 text-[var(--text-main)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                      >
                        <span>جزئیات</span>
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {processedProducts.map((p) => {
              let hasVariations = false;
              let minPrice = p.price;
              if (p.variations) {
                try {
                  const parsedVars = JSON.parse(p.variations);
                  if (Array.isArray(parsedVars) && parsedVars.length > 1) {
                    hasVariations = true;
                    const prices = parsedVars.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number');
                    if (prices.length > 0) minPrice = Math.min(...prices);
                  }
                } catch (e) {}
              }
              const formattedPrice = p.price 
                ? `${hasVariations ? 'از ' : ''}${parseInt(minPrice, 10).toLocaleString('fa-IR')} تومان` 
                : 'رایگان';

              return (
                <div
                  key={p.id}
                  className="group flex flex-col clay-card-thick rounded-3xl overflow-hidden transition-all hover:-translate-y-1 relative"
                >
                  {/* Image / Header Banner */}
                  <div 
                    onClick={() => navigate(`/store/product/${p.id}`)}
                    className="w-full aspect-video relative flex-shrink-0 overflow-hidden border-b border-[var(--card-border)] bg-[var(--card-bg)] cursor-pointer"
                  >
                    {p.bannerImage || p.image ? (
                      <>
                        <img
                          src={p.bannerImage || p.image}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div style={{ display: 'none' }} className="w-full h-full flex flex-col items-center justify-center text-[var(--color-accent-primary)] gap-2 bg-gradient-to-br from-[var(--color-accent-primary)]/15 to-transparent">
                          <Sparkles className="w-12 h-12 opacity-40" />
                          <span className="text-xs font-bold opacity-60">Dastyar AI</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-accent-primary)] gap-2 bg-gradient-to-br from-[var(--color-accent-primary)]/15 to-transparent">
                        <Sparkles className="w-12 h-12 opacity-40" />
                        <span className="text-xs font-bold opacity-60">Dastyar AI</span>
                      </div>
                    )}

                    {/* Category Label */}
                    <span className="absolute top-3.5 right-3.5 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--color-input-bg)]/85 text-[var(--text-main)] backdrop-blur-md border border-[var(--card-border)] shadow-sm">
                      {p.category === 'plan' ? 'پلن تعرفه' : p.category === 'api' ? 'کلید API' : p.category === 'account' ? 'اکانت پرمیوم' : 'پکیج دانلودی'}
                    </span>

                    {/* Popular / Special Badge */}
                    {p.badge && (
                      <span className="absolute top-3.5 left-3.5 text-[11px] font-black px-3 py-1 bg-[var(--color-accent-primary)] text-white rounded-full shadow-md">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3
                      onClick={() => navigate(`/store/product/${p.id}`)}
                      className={`text-base font-black mb-2 leading-snug line-clamp-2 cursor-pointer ${getProductTitleStyle(p.title, p.category)}`}
                      title={p.title}
                    >
                      {usePersianDigits ? toPersianDigits(p.title) : p.title}
                    </h3>

                    {p.tokenEstimate && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent-primary)] mb-3">
                        <Zap size={14} className="shrink-0" />
                        <span>{usePersianDigits ? toPersianDigits(p.tokenEstimate) : p.tokenEstimate}</span>
                      </div>
                    )}

                    {p.description && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-4 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {/* Features list */}
                    {p.features && (
                      <div className="mb-4 space-y-1.5 pt-3 border-t border-[var(--card-border)]">
                        {p.features.split('\n').filter(Boolean).slice(0, 3).map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{usePersianDigits ? toPersianDigits(feat.trim()) : feat.trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Price and Stock Box */}
                    <div className="mt-auto pt-4 border-t border-[var(--card-border)] flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-dim)] font-bold">مبلغ قابل پرداخت:</span>
                        <span className="text-base font-black text-[var(--color-accent-primary)] font-price">
                          {formattedPrice}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {p.deliveryTime || (p.category === 'plan' ? 'شارژ خودکار' : p.category === 'package' ? 'دانلود آنی' : '۱ تا ۲۴ ساعت')}
                      </span>
                    </div>

                    {/* Dual Action CTA Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            sessionStorage.setItem('pending_checkout', JSON.stringify({
                              productId: p.id
                            }));
                            window.dispatchEvent(new CustomEvent('open-auth-modal'));
                            return;
                          }
                          setSelectedProduct(p);
                        }}
                        className="py-2.5 clay-btn-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
                      >
                        <ShoppingBag size={14} />
                        <span>خرید سریع</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/store/product/${p.id}`)}
                        className="py-2.5 clay-btn font-bold text-xs rounded-xl flex items-center justify-center gap-1 text-[var(--text-main)] hover:text-[var(--color-accent-primary)]"
                      >
                        <span>جزئیات</span>
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <Footer />

      {/* Checkout Modal */}
      <CheckoutModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          if (id) navigate('/store', { replace: true });
        }}
      />
    </div>
  );
}
