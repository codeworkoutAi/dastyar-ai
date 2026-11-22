import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { 
  Store, CheckCircle2, XCircle, BookOpen, Package, Zap, Sparkles, 
  ChevronLeft, Search, X, ShieldCheck, CreditCard, Send, ShoppingBag, 
  ArrowUpDown, Wallet, Plus, Info, Bot, MessageSquare, Clock,
  LayoutGrid, List, Layers, Key, ChevronRight
} from 'lucide-react';
import { CheckoutModal } from '../../components/CheckoutModal';
import { Footer } from '../../components/Footer';
import { GlobalHeader } from '../../components/GlobalHeader';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';
import { toProductSlug } from '../../lib/slugUtils';

export function StoreFront() {
  const { id, category } = useParams<{ id?: string; category?: string }>();
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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % 3);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + 3) % 3);

  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
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
    if (category) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory('all');
    }
  }, [category]);

  useEffect(() => {
    const isRoot = window.location.pathname === '/';
    const isCategory = Boolean(category);

    const categoryMeta: Record<string, { title: string; description: string; name: string }> = {
      account: {
        title: 'خرید اکانت قانونی و اشتراک پرمیوم هوش مصنوعی | Dastyar AI',
        description: 'خرید انواع اکانت قانونی و اشتراک پرمیوم ابزارهای پیشرفته هوش مصنوعی با تحویل فوری، پشتیبانی و گارانتی تعویض در فروشگاه Dastyar AI.',
        name: 'اکانت‌های اختصاصی'
      },
      api: {
        title: 'خرید کلید API و کردیت اختصاصی توسعه‌دهندگان هوش مصنوعی | Dastyar AI',
        description: 'خرید کلیدهای API اختصاصی و کردیت‌های پرسرعت برنامه‌نویسی و اتصال به محیط‌های توسعه هوش مصنوعی با ضمانت اصالت در Dastyar AI.',
        name: 'کلیدهای API'
      },
      plan: {
        title: 'خرید پلن‌ها و بسته‌های اعتباری هوش مصنوعی | Dastyar AI',
        description: 'شارژ کیف پول و خرید پلن‌ها و بسته‌های اعتباری هوش مصنوعی بدون انقضا با فعال‌سازی آنی در فروشگاه Dastyar AI.',
        name: 'پلن‌ها و بسته‌ها'
      },
      package: {
        title: 'پکیج‌ها و دوره‌های کاربردی هوش مصنوعی | Dastyar AI',
        description: 'جامع‌ترین پکیج‌ها و دوره‌های آموزشی و کاربردی هوش مصنوعی برای ارتقای مهارت‌ها و کسب‌وکار در Dastyar AI.',
        name: 'پکیج‌های آموزشی'
      }
    };

    const currentCatInfo = category ? categoryMeta[category] : null;

    const pageTitle = currentCatInfo
      ? currentCatInfo.title
      : 'Dastyar AI | فروشگاه تخصصی ابزارها و اکانت‌های هوش مصنوعی';

    const pageDesc = currentCatInfo
      ? currentCatInfo.description
      : 'فروشگاه تخصصی هوش مصنوعی Dastyar AI: خرید اکانت قانونی و اختصاصی، شارژ کیف پول، کلیدهای API و پکیج‌های آموزشی با تحویل سریع، ضمانت کامل و مشاور هوشمند خرید.';

    const canonicalUrl = isCategory
      ? `${window.location.origin}/store/category/${category}`
      : (isRoot ? `${window.location.origin}/` : `${window.location.origin}/store`);

    const breadcrumbItems = [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
      { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: `${window.location.origin}/store` }
    ];

    if (currentCatInfo && category) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: currentCatInfo.name,
        item: `${window.location.origin}/store/category/${category}`
      });
    }

    setPageSeo({
      title: pageTitle,
      description: pageDesc,
      canonical: canonicalUrl,
      ogType: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'OnlineStore',
            name: currentCatInfo ? `${currentCatInfo.name} | فروشگاه Dastyar AI` : 'فروشگاه تخصصی هوش مصنوعی Dastyar AI',
            description: pageDesc,
            url: canonicalUrl,
            image: `${window.location.origin}/pwa-512x512.png`,
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: currentCatInfo ? currentCatInfo.name : 'محصولات و خدمات هوش مصنوعی',
              itemListElement: products
                .filter(p => !category || p.category === category)
                .slice(0, 12)
                .map((p) => ({
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Product',
                    name: p.title,
                    url: `${window.location.origin}/store/product/${p.id}/${toProductSlug(p.title)}`
                  },
                  price: (p.price || 0) * 10,
                  priceCurrency: 'IRR'
                }))
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems
          }
        ]
      }
    });
  }, [products, category]);

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

  const heroBanners = [
    {
      id: 'accounts',
      image: '/images/banners/banner-accounts.webp',
      badge: '✨ اکانت‌های قانونی پرمیوم',
      title: 'خرید قانونی و مطمئن اشتراک ابزارهای برتر هوش مصنوعی',
      subtitle: 'فعال‌سازی ۱۰۰٪ اختصاصی روی ایمیل شخصی شما با تحویل فوری و گارانتی تعویض',
      ctaText: 'مشاهده و خرید اکانت‌ها',
      category: 'account' as const,
    },
    {
      id: 'creative',
      image: '/images/banners/banner-creative.webp',
      badge: '🎨 ابزارهای خلاقیت و طراحی',
      title: 'استودیوهای حرفه‌ای خلق تصویر و ویدیو',
      subtitle: 'دسترسی نامحدود به برترین موتورهای هوش مصنوعی با بالاترین سهمیه رندر',
      ctaText: 'مشاهده پلن‌های استودیویی',
      category: 'account' as const,
    },
    {
      id: 'developer',
      image: '/images/banners/banner-developer.webp',
      badge: '⚡ ویژه توسعه‌دهندگان و برنامه‌نویسان',
      title: 'کلیدهای API و کردیت‌های پرسرعت کدنویسی',
      subtitle: 'اتصال مستقیم به VS Code و محیط‌های توسعه با پینگ عالی و بدون قطعی',
      ctaText: 'مشاهده کلیدهای API',
      category: 'api' as const,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300">
      <GlobalHeader />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-[1400px]">
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

        {/* Dedicated Hero Carousel Banner Box (Frame Only, Fixed Height, Zero-Jump) */}
        <div 
          className="relative w-full h-[230px] sm:h-[290px] md:h-[350px] lg:h-[390px] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-[var(--card-border)] clay-card select-none group"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Banner Slides */}
          {heroBanners.map((banner, idx) => {
            const isCurrent = idx === currentSlide;
            return (
              <div
                key={banner.id}
                onClick={() => {
                  setSelectedCategory(banner.category);
                  navigate(`/store/category/${banner.category}`);
                  document.getElementById('products-catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out cursor-pointer ${
                  isCurrent
                    ? 'opacity-100 z-10 scale-100 pointer-events-auto'
                    : 'opacity-0 z-0 scale-[1.03] pointer-events-none'
                }`}
              >
                {/* Background Banner Image */}
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading="eager"
                  draggable={false}
                />

                {/* Dark Vignette & Gradient for RTL Persian readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/40 to-black/85 dark:to-zinc-950/90" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-14 lg:px-16 max-w-2xl text-right z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-black/30 backdrop-blur-md text-white text-[11px] sm:text-xs font-black w-fit mb-2 sm:mb-3 border border-white/20 shadow-xs">
                    <span>{banner.badge}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 sm:mb-3 drop-shadow-sm">
                    {banner.title}
                  </h2>

                  <p className="text-xs sm:text-sm md:text-base text-zinc-200 line-clamp-2 mb-4 sm:mb-5 max-w-xl font-medium leading-relaxed drop-shadow-xs">
                    {banner.subtitle}
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:bg-zinc-100 transition-colors">
                      <ShoppingBag size={16} />
                      <span>{banner.ctaText}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('open-advisor-widget'));
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/25 transition-colors"
                    >
                      <Bot size={16} className="text-yellow-300" />
                      <span className="hidden sm:inline">مشاوره هوشمند</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Navigation Controls: Left / Right Arrows (Strictly Inside Carousel Frame) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg opacity-80 group-hover:opacity-100"
            title="بنر قبلی"
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg opacity-80 group-hover:opacity-100"
            title="بنر بعدی"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Progress Pill Indicators (Strictly Inside Carousel Frame at bottom) */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
            {heroBanners.map((_, dotIdx) => {
              const isDotActive = dotIdx === currentSlide;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(dotIdx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isDotActive
                      ? 'w-7 h-2 bg-white shadow-xs'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`اسلاید ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* 4 Trust & Value Props Badges - Permanently Fixed Outside & Below Carousel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5 mb-10">
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

        {/* Spacing preserved + Invariant SEO Rank #7 H2 for crawlers (sr-only) */}
        <div id="products-catalog" className="h-4 sm:h-5" aria-hidden="true" />
        <h2 className="sr-only">دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته</h2>

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
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id === 'all') {
                    navigate('/store');
                  } else {
                    navigate(`/store/category/${cat.id}`);
                  }
                }}
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
                      onClick={() => navigate(`/store/product/${p.id}/${toProductSlug(p.title)}`)}
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
                          onClick={() => navigate(`/store/product/${p.id}/${toProductSlug(p.title)}`)}
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
                        disabled={p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0)}
                        onClick={() => {
                          if (p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0)) return;
                          if (!user) {
                            sessionStorage.setItem('pending_checkout', JSON.stringify({ productId: p.id }));
                            window.dispatchEvent(new CustomEvent('open-auth-modal'));
                            return;
                          }
                          setSelectedProduct(p);
                        }}
                        className="py-2 px-4 clay-btn-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ShoppingBag size={14} />
                        <span>{p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0) ? 'ناموجود' : 'خرید سریع'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/store/product/${p.id}/${toProductSlug(p.title)}`)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-4.5 xl:gap-5">
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
                <Link
                  key={p.id}
                  to={`/store/product/${p.id}/${toProductSlug(p.title)}`}
                  className="group flex flex-col clay-card-thick rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative block border border-[var(--card-border)] bg-[var(--card-bg)]"
                >
                  {/* Image / Header Banner */}
                  <div className="w-full aspect-[16/10] relative flex-shrink-0 overflow-hidden border-b border-[var(--card-border)] bg-[var(--card-bg)]">
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
                          <Sparkles className="w-10 h-10 opacity-40" />
                          <span className="text-xs font-bold opacity-60">Dastyar AI</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-accent-primary)] gap-2 bg-gradient-to-br from-[var(--color-accent-primary)]/15 to-transparent">
                        <Sparkles className="w-10 h-10 opacity-40" />
                        <span className="text-xs font-bold opacity-60">Dastyar AI</span>
                      </div>
                    )}

                    {/* Category Label */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-input-bg)]/85 text-[var(--text-main)] backdrop-blur-md border border-[var(--card-border)] shadow-xs">
                      {p.category === 'plan' ? 'پلن تعرفه' : p.category === 'api' ? 'کلید API' : p.category === 'account' ? 'اکانت پرمیوم' : 'پکیج دانلودی'}
                    </span>

                    {/* Popular / Special / Out of Stock Badge */}
                    {p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0) ? (
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 bg-red-500/90 text-white rounded-full shadow-xs">
                        ناموجود
                      </span>
                    ) : p.badge ? (
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 bg-[var(--color-accent-primary)] text-white rounded-full shadow-xs">
                        {p.badge}
                      </span>
                    ) : null}

                    {/* Subtle Hover Action Overlay */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                        <span>{p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0) ? 'ناموجود' : 'مشاهده و سفارش'}</span>
                        <ChevronLeft size={13} className={p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0) ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'} />
                      </span>
                    </div>
                  </div>

                  {/* Body Content (Ultra-Compact & High Contrast) */}
                  <div className="p-3.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                    <div className="h-10 sm:h-11 flex items-start overflow-hidden">
                      <h3
                        className={`text-sm sm:text-sm font-black leading-snug line-clamp-2 break-words text-right w-full group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${getProductTitleStyle(p.title, p.category)}`}
                        title={p.title}
                        dir="rtl"
                      >
                        {usePersianDigits ? toPersianDigits(p.title) : p.title}
                      </h3>
                    </div>

                    {/* Price on a Single Clean Line (Delivery Badge Removed) */}
                    <div className="pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] text-[var(--text-dim)] font-bold shrink-0">قیمت:</span>
                        <span className="text-sm font-black text-[var(--color-accent-primary)] font-price truncate">
                          {formattedPrice}
                        </span>
                      </div>

                      {p.status === 'out_of_stock' || (p.stock !== undefined && p.stock <= 0) ? (
                        <span className="text-xs sm:text-[11px] font-bold text-red-500 flex items-center gap-0.5 shrink-0">
                          <span>ناموجود</span>
                        </span>
                      ) : (
                        <span className="text-xs sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 shrink-0 group-hover:-translate-x-1 transition-transform">
                          <span>مشاهده</span>
                          <ChevronLeft size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
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
