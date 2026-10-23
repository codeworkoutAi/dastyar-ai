import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Home, Store, Settings, Key, CheckCircle2, XCircle, BookOpen, Package, Zap, Sparkles, ChevronLeft } from 'lucide-react';
import { CheckoutModal } from '../../components/CheckoutModal';
import { ProductDetailsModal } from '../../components/ProductDetailsModal';
import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ThemeToggle';
import { GlobalHeader } from '../../components/GlobalHeader';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';


export function StoreFront() {
 const { id } = useParams<{ id: string }>();
 const { setIsAdminOpen } = useUIStore();
 const { settings } = useSettingsStore();
 const usePersianDigits = settings?.appearance?.persianNumerals ?? false;
 const [selectedProduct, setSelectedProduct] = useState<any>(null);
 const [detailsProduct, setDetailsProduct] = useState<any>(null);

 const formatPrice = (price: number) => {
 const formatted = (price || 0).toLocaleString();
 return usePersianDigits ? toPersianDigits(formatted) : formatted;
 };
 const { user } = useAuthStore();
 const [products, setProducts] = useState<any[]>([]);
 const [selectedCategory, setSelectedCategory] = useState<string>('all');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();

  const getProductTitleStyle = (title: string, category?: string) => {
    const t = title.toLowerCase();
    if (category === 'plan' || t.includes('بسته') || t.includes('پلن')) {
      if (t.includes('طلا') || t.includes('طلایی') || t.includes('gold') || t.includes('حرفه‌ای')) {
        return 'bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent font-black drop-shadow-xs';
      }
      if (t.includes('نقره') || t.includes('نقره‌ای') || t.includes('silver')) {
        return 'bg-gradient-to-l from-slate-200 via-zinc-100 to-slate-300 bg-clip-text text-transparent font-black drop-shadow-xs';
      }
      if (t.includes('برنز') || t.includes('برنزی') || t.includes('bronze') || t.includes('استارتر')) {
        return 'bg-gradient-to-l from-amber-600 via-orange-400 to-amber-500 bg-clip-text text-transparent font-black drop-shadow-xs';
      }
    }
    // Other products: beautiful vibrant theme gradient (replacing generic blue)
    return 'clay-news-title font-bold drop-shadow-xs';
  };

 const paymentStatus = searchParams.get('payment');
 const orderId = searchParams.get('orderId');
 const refId = searchParams.get('refId');
 const msg = searchParams.get('msg');

 useEffect(() => {
 fetchProducts();
 }, []);

 useEffect(() => {
 const currentProduct = detailsProduct || selectedProduct;
 if (currentProduct) {
 const priceText = currentProduct.price ? `${currentProduct.price.toLocaleString('fa-IR')} تومان` : 'رایگان';
 const prodCanonical = `${window.location.origin}/store/${currentProduct.id}`;
 const priceRials = (currentProduct.price || 0) * 10;

 setPageSeo({
 title: `خرید ${currentProduct.title} | فروشگاه هوش مصنوعی`,
 description: `خرید آنلاین ${currentProduct.title} - قیمت: ${priceText}. تحویل فوری با پشتیبانی تخصصی در دستیار هوشمند.`,
 canonical: prodCanonical,
 ogImage: currentProduct.bannerImage || currentProduct.image,
 ogType: 'product',
 schema: {
 '@context': 'https://schema.org',
 '@graph': [
 {
 '@type': 'Product',
 name: currentProduct.title,
 description: currentProduct.description || currentProduct.title,
 image: currentProduct.bannerImage || currentProduct.image ? [currentProduct.bannerImage || currentProduct.image] : undefined,
 sku: `AI-PROD-${currentProduct.id}`,
 brand: {
 '@type': 'Brand',
 name: 'دستیار هوشمند'
 },
 offers: {
 '@type': 'Offer',
 price: priceRials,
 priceCurrency: 'IRR',
 availability: 'https://schema.org/InStock',
 url: prodCanonical,
 seller: {
 '@type': 'Organization',
 name: 'دستیار هوشمند'
 }
 }
 },
 {
 '@type': 'BreadcrumbList',
 itemListElement: [
 { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
 { '@type': 'ListItem', position: 2, name: 'فروشگاه', item: `${window.location.origin}/store` },
 { '@type': 'ListItem', position: 3, name: currentProduct.title, item: prodCanonical }
 ]
 }
 ]
 }
 });
 } else {
 setPageSeo({
 title: 'فروشگاه ابزارهای هوش مصنوعی | دستیار هوشمند',
 description: 'فروشگاه تخصصی هوش مصنوعی: خرید اکانت‌های اختصاصی ChatGPT Plus، کلیدهای API معتبر و پکیج‌های آموزشی با پرداخت ریالی و تحویل فوری.',
 canonical: `${window.location.origin}/store`,
 ogType: 'website',
 schema: {
 '@context': 'https://schema.org',
 '@graph': [
 {
 '@type': 'Store',
 name: 'فروشگاه هوش مصنوعی دستیار هوشمند',
 description: 'فروشگاه تخصصی هوش مصنوعی: خرید اکانت‌های اختصاصی ChatGPT Plus، کلیدهای API معتبر و پکیج‌های آموزشی با پرداخت ریالی و تحویل فوری.',
 url: `${window.location.origin}/store`,
 image: `${window.location.origin}/pwa-512x512.png`,
 hasOfferCatalog: {
 '@type': 'OfferCatalog',
 name: 'محصولات و خدمات هوش مصنوعی',
 itemListElement: products.slice(0, 12).map(p => ({
 '@type': 'Offer',
 itemOffered: {
 '@type': 'Product',
 name: p.title,
 url: `${window.location.origin}/store/${p.id}`
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
 }
 }, [detailsProduct, selectedProduct, products]);

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
 const isNetworkError = rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('networkerror') || rawMsg.toLowerCase().includes('abort');
 setError(isNetworkError ? 'عدم برقراری ارتباط با سرور. لطفاً فیلترشکن یا اتصال اینترنت خود را بررسی نمایید.' : (err.message || 'خطای سرور'));
 setLoading(false);
 }
 };
return (
  <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300">
  <GlobalHeader />

<main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
  <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
  <h1 className="text-2xl font-bold mb-2">فروشگاه ابزارهای هوش مصنوعی</h1>
  <p className="text-[var(--color-text-muted)]">کلید API، اکانت پرمیوم و دوره‌های آموزشی.</p>
  </div>
  </div>

  {/* Cross-linking Banner to Blog */}
  <div className="mb-8 p-6 clay-card-thick flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
  <div className="flex items-center gap-4">
  <div className="w-12 h-12 rounded-full bg-[var(--color-accent-primary)]/10 dark:bg-[var(--color-accent-primary)]/20 flex items-center justify-center shrink-0">
  <BookOpen className="w-6 h-6 text-[var(--color-accent-primary)]" />
  </div>
  <div>
  <h3 className="type-h4 font-bold mb-1">آموزش استفاده از ابزارها</h3>
  <p className="type-secondary">نحوه اتصال API و استفاده از مدل‌ها را در مجله هوش مصنوعی بخوانید.</p>
  </div>
  </div>
  <Link 
  to="/blog"
  className="px-5 py-2.5 clay-btn-primary-thick font-bold type-secondary shrink-0 w-full sm:w-auto text-center"
  >
  مشاهده آموزش‌ها
  </Link>
  </div>

{paymentStatus === 'success' && (
  <div className="mb-8 p-4 clay-card-thick !border-[var(--color-accent-primary)]/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale">
  <div className="w-12 h-12 rounded-badge bg-[var(--color-accent-primary)]/10 dark:bg-[var(--color-accent-primary)]/20 flex items-center justify-center shrink-0">
  <CheckCircle2 className="w-6 h-6 text-[var(--color-accent-text)]" />
  </div>
  <div className="flex-1 text-center sm:text-right">
  <h3 className="font-bold text-[var(--color-accent-text)] dark:text-[var(--color-accent-text)] mb-1">پرداخت با موفقیت تأیید شد!</h3>
  <p className="type-secondary text-[var(--color-accent-text)] flex flex-wrap items-center gap-x-3 gap-y-1">
  <span>شماره سفارش: <span className="font-mono font-bold">{orderId}</span></span>
  {refId && <span>شماره تراکنش بانکی: <span className="font-mono font-bold">{refId}</span></span>}
  </p>
  </div>
  <button 
  onClick={() => navigate('/store', { replace: true })}
  className="px-4 py-2 clay-btn-thick text-[var(--color-accent-text)] dark:text-[var(--color-accent-text)] type-secondary font-bold shrink-0 w-full sm:w-auto cursor-pointer"
  >
  متوجه شدم
  </button>
  </div>
  )}

{paymentStatus === 'failed' && (
  <div className="mb-8 p-4 clay-card-thick !border-[var(--color-error-border)]/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale">
  <div className="w-12 h-12 rounded-badge bg-[var(--color-error-bg)] flex items-center justify-center shrink-0">
  <XCircle className="w-6 h-6 text-[var(--color-error-text)]" />
  </div>
  <div className="flex-1 text-center sm:text-right">
  <h3 className="font-bold text-[var(--color-error-text)] mb-1">پرداخت ناموفق بود</h3>
  <p className="type-secondary text-[var(--color-error-text)]">
  {msg ? decodeURIComponent(msg) : 'در صورت کسر وجه از حساب شما، مبلغ تا ۷۲ ساعت آینده به کارت شما بازخواهد گشت.'}
  </p>
  </div>
  <button 
  onClick={() => navigate('/store', { replace: true })}
  className="px-4 py-2 bg-[var(--color-error-bg)] text-[var(--color-error-text)] rounded-btn type-secondary font-bold hover:bg-[var(--color-error-bg)]/80 transition-colors shrink-0 w-full sm:w-auto cursor-pointer"
  >
  بستن
  </button>
  </div>
  )}

 <>
{loading ? (
  <div className="flex items-center justify-center h-48">
  <div className="w-10 h-10 border-2 border-[var(--card-border)] border-t-[var(--color-accent-primary)] rounded-badge animate-spin" />
  </div>
  ) : error ? (
  <div className="p-6 rounded-card bg-[var(--color-error-bg)] text-[var(--color-error-text)] font-bold flex flex-col items-center justify-center h-48">
  <p>{error}</p>
  <button onClick={() => fetchProducts(0)} className="mt-4 px-4 py-2 bg-[var(--color-error-bg)] text-[var(--color-error-text)] rounded-btn text-sm">تلاش مجدد</button>
  </div>
  ) : products.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-64 opacity-60 clay-card-thick">
  <Store size={48} className="mb-4" />
  <h2 className="type-h2 mb-2">هنوز محصولی اضافه نشده است</h2>
  </div>
  ) : (
 <div className="space-y-6">
 {/* Category Filter Tabs */}
 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
{[
  { id: 'all', label: 'همه محصولات' },
  { id: 'plan', label: 'پلن‌ها و بسته‌ها' },
  { id: 'account', label: 'اکانت‌های پرمیوم' },
  { id: 'api', label: 'کلیدهای API' },
  { id: 'package', label: 'پکیج‌های آموزشی' },
  ].map((cat) => (
  <button
  key={cat.id}
  onClick={() => setSelectedCategory(cat.id)}
  className={`px-4 py-2 rounded-btn type-badge font-bold whitespace-nowrap transition-all cursor-pointer ${
  selectedCategory === cat.id
  ? 'clay-btn-primary-thick'
  : 'clay-btn-thick'
  }`}
  >
  {cat.label}
  </button>
  ))}
 </div>

 {/* Products Grid (Dynamic Self-Healing Layout) */}
{(() => {
  const filtered = products.filter(p => selectedCategory === 'all' || p.category === selectedCategory);
  if (filtered.length === 0) {
    return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60 clay-card-thick">
    <Store size={40} className="mb-3" />
    <p className="type-secondary font-bold">محصولی در این دسته‌بندی یافت نشد.</p>
    </div>
    );
  }

  const gridLayout = filtered.length === 1
  ? 'max-w-md mx-auto grid grid-cols-1 gap-6'
  : filtered.length === 2
  ? 'max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6'
  : filtered.length === 3
  ? 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
  : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

  return (
  <div className={`${gridLayout} transition-all duration-300`}>
  {filtered.map(p => (
  <div 
  key={p.id} 
  className="group flex flex-col clay-card-thick overflow-hidden cursor-pointer transition-all hover:-translate-y-1" 
  onClick={() => navigate(`/store/product/${p.id}`)}
  >
  <div className="w-full aspect-video relative flex-shrink-0 overflow-hidden border-b border-[var(--card-border)] bg-[var(--card-bg)]">
  {p.bannerImage || p.image ? (
  <img src={p.bannerImage || p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
  ) : p.category === 'plan' ? (
  <div className="w-full h-full bg-[var(--gemini-gradient-subtle)] flex flex-col items-center justify-center text-[var(--color-accent-primary)] dark:text-[var(--color-accent-primary)] gap-2">
  <Sparkles className="w-12 h-12 opacity-40" />
  <span className="type-badge font-bold opacity-60">اشتراک ویژه</span>
  </div>
  ) : (
  <div className="w-full h-full flex items-center justify-center">
  <Store className="w-12 h-12 opacity-30" />
  </div>
  )}
  
  <span className="absolute top-3.5 right-3.5 type-badge font-bold px-2.5 py-1 rounded-btn bg-[var(--color-input-bg)]/80 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] backdrop-blur-md border border-[var(--card-border)] shadow-xs">
  {p.category === 'plan' ? 'پلن تعرفه' : p.category === 'api' ? 'کلید API' : p.category === 'account' ? 'اکانت پرمیوم' : 'پکیج'}
  </span>

  {p.badge && (
  <span className="absolute top-3.5 left-3.5 type-badge font-black px-2.5 py-1 bg-[var(--color-accent-primary)] text-white rounded-btn shadow-sm">
  {p.badge}
  </span>
  )}
  </div>
  
  <div className="flex flex-col flex-1 p-5">
  <h3 className={`type-h3 mb-2 leading-tight line-clamp-2 ${getProductTitleStyle(p.title, p.category)}`} title={p.title}>
                    {usePersianDigits ? toPersianDigits(p.title) : p.title}
                  </h3>

  {p.tokenEstimate && (
  <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-primary)] dark:text-[var(--color-accent-primary)] mb-2.5">
  <Zap size={13} className="shrink-0" />
  <span>{usePersianDigits ? toPersianDigits(p.tokenEstimate) : p.tokenEstimate}</span>
  </div>
  )}

  {p.description && (
  <p className="type-secondary text-[var(--color-text-muted)] line-clamp-2 mb-4 leading-relaxed opacity-80">{p.description}</p>
  )}

  {p.category === 'plan' && p.features && (
  <div className="mb-4 space-y-1.5 pt-1 border-t border-[var(--card-border)] ">
  {p.features.split('\n').filter(Boolean).slice(0, 3).map((feat: string, idx: number) => (
  <div key={idx} className="flex items-center gap-1.5 text-xs">
  <CheckCircle2 size={13} className="text-[var(--color-accent-primary)] shrink-0" />
  <span className="truncate">{usePersianDigits ? toPersianDigits(feat.trim()) : feat.trim()}</span>
  </div>
  ))}
  </div>
  )}
  

  </div>
    <div className="mt-auto pt-4 pb-4 border-t border-[var(--card-border)] flex justify-start px-4">
      <span className="flex items-center gap-1 type-meta font-bold text-[var(--color-accent-primary)] opacity-85 group-hover:opacity-100 transition-opacity">
        مشاهده جزئیات محصول
        <ChevronLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
      </span>
    </div>
  </div>
  ))}
  </div>
  );
  })()}
 </div>
 )}
 </>
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



