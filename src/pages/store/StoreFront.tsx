import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { 
  Store, CheckCircle2, XCircle, BookOpen, Package, Zap, Sparkles, 
  ChevronLeft, Search, X, ShieldCheck, CreditCard, Send, ShoppingBag, 
  ArrowUpDown, Wallet, Plus, Info
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
  const { user } = useAuthStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setPageSeo({
      title: 'فروشگاه ابزارهای هوش مصنوعی و بسته‌های اعتباری | Dastyar AI',
      description: 'فروشگاه تخصصی هوش مصنوعی: خرید بسته‌های اعتباری، اکانت‌های اختصاصی، کلیدهای API و پکیج‌های آموزشی با تحویل آنی و پشتیبانی کامل.',
      canonical: `${window.location.origin}/store`,
      ogType: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Store',
            name: 'فروشگاه هوش مصنوعی دستیار هوشمند',
            description: 'فروشگاه تخصصی هوش مصنوعی: خرید بسته‌های اعتباری، اکانت‌های اختصاصی، کلیدهای API و پکیج‌های آموزشی با تحویل آنی.',
            url: `${window.location.origin}/store`,
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
  }, [products, selectedCategory, searchQuery, sortBy]);

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

        {/* Hero Banner Section */}
        <div className="mb-8 p-6 sm:p-8 clay-card-thick rounded-3xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] text-xs font-bold border border-[var(--color-accent-primary)]/20">
                <Sparkles size={14} />
                <span>ویترین رسمی ابزارها و بسته‌های هوش مصنوعی</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight leading-snug">
                فروشگاه ابزارهای هوش مصنوعی و بسته‌های اعتباری
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                خرید مستقیم شارژ چت‌باکس با تحویل آنی، اکانت‌های اختصاصی پرمیوم، توکن‌های توسعه‌دهندگان و پکیج‌های آموزشی جامع.
              </p>
            </div>

            {/* User Wallet Status Widget */}
            {user ? (
              <div className="p-4 sm:p-5 rounded-2xl clay-surface shrink-0 flex flex-col gap-3 min-w-[260px] border border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Wallet size={15} className="text-[var(--color-accent-primary)]" />
                    موجودی کیف پول شما:
                  </span>
                  <Link to="/dashboard" className="text-[11px] font-bold text-[var(--color-accent-primary)] hover:underline">
                    داشبورد
                  </Link>
                </div>
                <div className="text-xl font-black text-[var(--text-main)]">
                  {usePersianDigits ? toPersianDigits((user.walletBalance || 0).toLocaleString()) : (user.walletBalance || 0).toLocaleString()} <span className="text-xs font-normal text-[var(--text-muted)]">تومان</span>
                </div>
                <button
                  onClick={() => setIsWalletOpen(true)}
                  className="w-full py-2 clay-btn-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>شارژ سریع کیف پول</span>
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl clay-surface shrink-0 flex flex-col gap-2 min-w-[260px]">
                <span className="text-xs font-bold text-[var(--text-main)]">حساب کاربری دارید؟</span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  با ورود به حساب، تاریخچه سفارشات و لایسنس‌های شما در داشبورد ذخیره می‌شود.
                </p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                  className="mt-1 py-2 clay-btn font-bold text-xs rounded-xl text-[var(--color-accent-primary)]"
                >
                  ورود یا ثبت‌نام
                </button>
              </div>
            )}
          </div>

          {/* 4 Trust & Value Props Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-2.5 p-2 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Zap size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[var(--text-main)]">تحویل ۱ تا ۲۴ ساعت</span>
                <span className="text-[10px] text-[var(--text-dim)]">فعال‌سازی قانونی و اختصاصی</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[var(--text-main)]">ضمانت اصالت و عملکرد</span>
                <span className="text-[10px] text-[var(--text-dim)]">گارانتی کامل اشتراک‌ها</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <CreditCard size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[var(--text-main)]">پرداخت امن بانکی</span>
                <span className="text-[10px] text-[var(--text-dim)]">درگاه شاپرک و کارت‌به‌کارت</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Send size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[var(--text-main)]">پشتیبانی تلگرام</span>
                <span className="text-[10px] text-[var(--text-dim)]">راهنمایی تخصصی فعال‌سازی</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'همه محصولات', count: counts.all },
                { id: 'plan', label: 'پلن‌ها و بسته‌ها', count: counts.plan },
                { id: 'account', label: 'اکانت‌های اختصاصی', count: counts.account },
                { id: 'api', label: 'کلیدهای API', count: counts.api },
                { id: 'package', label: 'پکیج‌های آموزشی', count: counts.package },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'clay-btn-primary shadow-sm'
                      : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[var(--color-input-bg)] text-[var(--text-dim)]'
                  }`}>
                    {usePersianDigits ? toPersianDigits(cat.count) : cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Sort Dropdown */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در محصولات..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl clay-surface text-xs outline-none transition-all placeholder:text-[var(--text-dim)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-main)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="popular">محبوب‌ترین</option>
                  <option value="newest">جدیدترین</option>
                  <option value="price_asc">ارزان‌ترین</option>
                  <option value="price_desc">گران‌ترین</option>
                </select>
              </div>
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
                        <span className="text-base font-black text-[var(--color-accent-primary)]">
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

        {/* Cross-linking Educational Banner to Blog */}
        <div className="mt-12 p-6 sm:p-8 clay-card-thick rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-[var(--text-main)] mb-1">راهنمای استفاده و آموزش ابزارها</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                نحوه اتصال کلیدهای API به ادیتورها، مهندسی پرامپت و ترفندهای هوش مصنوعی را در مجله ما بخوانید.
              </p>
            </div>
          </div>
          <Link
            to="/blog"
            className="px-6 py-3 clay-btn-primary font-bold text-xs rounded-xl shrink-0 w-full sm:w-auto text-center"
          >
            مشاهده آموزش‌های مجله
          </Link>
        </div>
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
