import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Home, Store, Settings, Key, CheckCircle2, XCircle, BookOpen, Package } from 'lucide-react';
import { CheckoutModal } from '../../components/CheckoutModal';
import { ProductDetailsModal } from '../../components/ProductDetailsModal';
import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ThemeToggle';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentStatus = searchParams.get('payment');
  const orderId = searchParams.get('orderId');

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
        title: 'فروشگاه هوش مصنوعی | خرید اکانت ChatGPT Plus، کلیدهای API و آموزش‌ها',
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

  const fetchProducts = async () => {
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
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/" 
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400 shrink-0"
              title="بازگشت به چت"
              aria-label="بازگشت به چت"
            >
              <Home size={20} />
            </Link>
            <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-1.5 sm:gap-2 truncate">
              <Store size={22} className="text-blue-600 shrink-0" />
              <span>فروشگاه</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user && (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-bold transition-colors"
                title="داشبورد کاربری"
              >
                داشبورد
              </Link>
            )}
            <ThemeToggle variant="minimal" />
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Settings size={15} />
                <span>مدیریت</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">محصولات دیجیتال</h2>
            <p className="text-zinc-500 dark:text-zinc-400">کلید API، اکانت پرمیوم و دوره‌های آموزشی.</p>
          </div>
        </div>

        {/* Cross-linking Banner to Blog */}
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">آموزش استفاده از ابزارها</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">نحوه اتصال API و استفاده از مدل‌ها را در مجله هوش مصنوعی بخوانید.</p>
            </div>
          </div>
          <Link 
            to="/blog"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shrink-0 w-full sm:w-auto text-center"
          >
            مشاهده آموزش‌ها
          </Link>
        </div>

        {paymentStatus === 'success' && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">پرداخت با موفقیت انجام شد!</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">شماره سفارش: <span className="font-mono">{orderId}</span></p>
            </div>
            <button 
              onClick={() => navigate('/store', { replace: true })}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shrink-0 w-full sm:w-auto"
            >
              متوجه شدم
            </button>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">پرداخت ناموفق بود</h3>
              <p className="text-sm text-red-600 dark:text-red-400">در صورت کسر وجه، مبلغ تا ۷۲ ساعت آینده به حساب شما بازخواهد گشت.</p>
            </div>
            <button 
              onClick={() => navigate('/store', { replace: true })}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shrink-0 w-full sm:w-auto"
            >
              بستن
            </button>
          </div>
        )}

        <>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold flex flex-col items-center justify-center h-48">
                <p>{error}</p>
                <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm">تلاش مجدد</button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 opacity-50 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <Store size={48} className="mb-4" />
                <h2 className="text-xl font-bold mb-2">هنوز محصولی اضافه نشده است</h2>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => (
                  <div key={p.id} className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden cursor-pointer" onClick={() => setDetailsProduct(p)}>
                    <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 relative flex-shrink-0">
                      {p.bannerImage || p.image ? (
                        <img src={p.bannerImage || p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Store className="w-12 h-12 opacity-30" />
                        </div>
                      )}
                      <span className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 rounded-lg shadow-sm backdrop-blur-sm">
                        {p.category === 'api' ? 'کلید API' : p.category === 'account' ? 'اکانت پرمیوم' : 'پکیج'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2 leading-tight line-clamp-2" title={p.title}>{p.title}</h3>
                      {p.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{p.description}</p>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-zinc-500 mb-1">مبلغ پرداختی</span>
                          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(p.price)} <span className="text-xs font-normal text-zinc-500">تومان</span></span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              window.dispatchEvent(new CustomEvent('open-auth-modal'));
                            } else {
                              setSelectedProduct(p);
                              navigate(`/store/${p.id}`);
                            }
                          }}
                          disabled={p.category !== 'package' && p.stock <= 0}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {p.category !== 'package' && p.stock <= 0 ? 'ناموجود' : 'خرید'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={detailsProduct}
        isOpen={!!detailsProduct}
        onClose={() => setDetailsProduct(null)}
        onBuy={(p) => {
          if (!user) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
          } else {
            setSelectedProduct(p);
            navigate(`/store/${p.id}`);
          }
        }}
      />
    </div>
  );
}
