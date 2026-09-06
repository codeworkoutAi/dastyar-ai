import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Home, Store, Settings, Key, CheckCircle2, XCircle, BookOpen, Package } from 'lucide-react';
import { CheckoutModal } from '../../components/CheckoutModal';
import { ProductDetailsModal } from '../../components/ProductDetailsModal';
import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const VaultSection = () => {
  const { token } = useAuthStore();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('برای مشاهده خریدها ابتدا وارد حساب کاربری خود شوید.');
      return;
    }
    fetch('/api/store/purchases', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPurchases(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    try {
      setIsRedeeming(true);
      setRedeemMessage(null);
      const res = await fetch('/api/store/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey: redeemCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در فعال‌سازی کد');
      
      setRedeemMessage({ type: 'success', text: data.message });
      setRedeemCode('');
      
      // Refresh purchases
      const purchasesRes = await fetch('/api/store/purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const purchasesData = await purchasesRes.json();
      setPurchases(purchasesData);
      
    } catch (err: any) {
      setRedeemMessage({ type: 'error', text: err.message });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div></div>;
  
  if (error) return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-3xl mt-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 mb-4"><Package className="w-8 h-8" /></div>
      <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error}</p>
      <button onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg">ورود به حساب</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Redeem Section */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ردیم کد (فعال‌سازی لایسنس)
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          اگر کد لایسنس را از طریق ربات تلگرام یا پشتیبانی دریافت کرده‌اید، آن را در کادر زیر وارد کنید تا به حساب شما متصل شود.
        </p>
        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="مثال: AAAA-BBBB-CCCC"
            dir="ltr"
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-mono"
          />
          <button 
            type="submit" 
            disabled={isRedeeming || !redeemCode.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shrink-0"
          >
            {isRedeeming ? 'در حال بررسی...' : 'فعال‌سازی'}
          </button>
        </form>
        {redeemMessage && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${redeemMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
            {redeemMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {redeemMessage.text}
          </div>
        )}
      </div>

      <h3 className="font-bold text-lg pt-4 text-zinc-900 dark:text-zinc-100">تاریخچه خریدها</h3>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 opacity-50 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Package className="w-12 h-12 mb-3 text-zinc-400" />
          <p className="text-zinc-500 font-medium">شما هنوز خریدی انجام نداده‌اید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {purchases.map((p, idx) => (
            <div key={idx} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
              <div className="flex items-start gap-4">
                {p.image ? (
                  <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex justify-center items-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1 truncate" title={p.title}>{p.title}</h4>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <span className="font-mono">{p.orderDate ? new Date(p.orderDate).toLocaleDateString('fa-IR') : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.amount.toLocaleString()} تومان</span>
                  </div>
                </div>
              </div>
              
              {p.category !== 'package' && p.licenseKey ? (
                <div className="mt-auto p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between gap-3 border border-zinc-200 dark:border-zinc-800 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                  <div className="flex-1 overflow-x-auto no-scrollbar">
                    <span className="font-mono text-sm tracking-wider text-zinc-800 dark:text-zinc-200" dir="ltr">{p.licenseKey}</span>
                  </div>
                  <button onClick={() => handleCopy(p.licenseKey)} className="text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl whitespace-nowrap hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors shrink-0">
                    {copiedKey === p.licenseKey ? 'کپی شد!' : 'کپی کلید'}
                  </button>
                </div>
              ) : p.category === 'package' ? (
                 <div className="mt-auto p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-between gap-3 border border-blue-100 dark:border-blue-800/30">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">آماده دانلود</span>
                  <button className="text-white text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl whitespace-nowrap transition-colors shrink-0 shadow-sm">
                    لینک دانلود
                  </button>
                </div>
              ) : (
                <div className="mt-auto p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-between gap-3 border border-red-100 dark:border-red-800/30">
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">در انتظار صدور لایسنس...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function StoreFront() {
  const { id } = useParams<{ id: string }>();
  const { setIsAdminOpen } = useUIStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailsProduct, setDetailsProduct] = useState<any>(null);
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'purchases'>('products');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentStatus = searchParams.get('payment');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    fetchProducts();
  }, []);

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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
              title="بازگشت به چت"
            >
              <Home size={20} />
            </Link>
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Store size={24} className="text-blue-600" />
              فروشگاه هوش مصنوعی
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="minimal" />
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Settings size={16} />
                مدیریت فروشگاه
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
          <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/50 p-1.5 rounded-xl shrink-0">
            <button 
              onClick={() => setActiveTab('products')} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              فروشگاه
            </button>
            <button 
              onClick={() => setActiveTab('purchases')} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'purchases' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              خریدهای من
            </button>
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

        {activeTab === 'purchases' ? (
          <VaultSection />
        ) : (
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
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
                          <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{p.price.toLocaleString()} <span className="text-xs font-normal text-zinc-500">تومان</span></span>
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
