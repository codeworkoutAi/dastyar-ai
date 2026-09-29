import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, ShieldCheck, Zap, HelpCircle, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';
import { CheckoutModal } from '../../components/CheckoutModal';
import { useAuthStore } from '../../store/authStore';
import { Footer } from '../../components/Footer';
import { GlobalHeader } from '../../components/GlobalHeader';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store/products');
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات محصول');
      const data = await res.json();
      const found = data.find((p: any) => p.id.toString() === id);
      if (found) {
        setProduct(found);
        
        // Setup SEO dynamically
setPageSeo({
          title: `خرید ${found.title} | فروشگاه هوش مصنوعی`,
          description: found.description || found.title,
          ogImage: (found.bannerImage || found.image) || undefined,
          schema: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: found.title,
            sku: `AI-PROD-${found.id}`,
            brand: {
              '@type': 'Brand',
              name: 'فروشگاه هوش مصنوعی'
            },
            offers: {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: found.title,
                url: `${window.location.origin}/store/product/${found.id}`
              },
              price: (found.price || 0) * 10,
              priceCurrency: 'IRR',
              availability: (found.stock > 0 || found.category === 'plan' || found.category === 'package') ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            }
          }
        });
      } else {
        setError('محصول مورد نظر یافت نشد');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-[var(--color-text-main)] font-bold">{error || 'محصول پیدا نشد'}</p>
        <button onClick={() => navigate('/store')} className="clay-btn-primary px-6 py-2">بازگشت به فروشگاه</button>
      </div>
    );
  }

  let parsedFaqs = [];
  try {
    if (product.faqs) {
      parsedFaqs = JSON.parse(product.faqs);
    }
  } catch (e) {}

  const priceText = product.price ? `${product.price.toLocaleString('fa-IR')} تومان` : 'رایگان';

  const handleBuyClick = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
    } else {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300">
      <GlobalHeader />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in relative z-10 min-h-screen">
      {/* Header Breadcrumb */}
      <button 
        onClick={() => navigate('/store')}
        className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        بازگشت به فروشگاه
      </button>

      {/* Split Layout Content */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* Right Column: Details (RTL so Right is main content) */}
        <div className="flex-1 order-2 lg:order-1 w-full">
          {/* Hero Banner Area */}
          <div className="w-full mb-8">
            <div className="w-full aspect-video rounded-2xl overflow-hidden relative mb-4 group shadow-lg border border-[var(--card-border)] bg-[var(--card-bg)]">
              <span className="absolute top-4 right-4 z-10 inline-block px-3 py-1.5 bg-[var(--color-accent-primary)] text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg">
                {product.badge || (product.category === 'plan' ? 'اشتراک پرمیوم' : product.category === 'api' ? 'کلید API' : 'محصول اختصاصی')}
              </span>
              {(product.bannerImage || product.image) ? (
                <img src={product.bannerImage || product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-primary)]/5 flex items-center justify-center">
                  <Zap className="w-24 h-24 text-[var(--color-accent-primary)]/50" />
                </div>
              )}
            </div>
            <div className="px-2 space-y-3">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] leading-snug">{product.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                  <Zap className="w-3.5 h-3.5" /> تحویل آنی
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] text-xs font-bold rounded-full border border-[var(--color-accent-primary)]/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> ضمانت و پشتیبانی
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full border border-blue-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> اورجینال
                </span>
              </div>
            </div>
          </div>

          <div className="clay-card-thick p-6 sm:p-8 space-y-8">
            
            {/* Short Description */}
            {product.description && (
              <div>
                <h3 className="font-bold text-lg text-[var(--color-text-main)] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--color-accent-primary)]" />
                  خلاصه ویژگی‌ها
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-loose">
                  {product.description}
                </p>
              </div>
            )}

          </div>
        </div>
        
        {/* Left Column: Sticky Buy Box (RTL so Left is sidebar) */}
        <div className="w-full lg:w-[350px] shrink-0 order-1 lg:order-2 z-10">
          <div className="sticky top-24 clay-card-thick border-2 border-[var(--color-accent-primary)] p-6 space-y-6 animate-slideUpScale relative overflow-hidden shadow-[0_8px_32px_-8px_var(--color-accent-primary)]" style={{ animationDelay: '0.1s' }}>
            
            {/* Highlight Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-primary)]/10 to-transparent pointer-events-none" />

            <div className="text-center pb-6 border-b border-[var(--card-border)] relative z-10">
              <span className="text-sm font-bold text-[var(--color-text-muted)] block mb-2">مبلغ قابل پرداخت:</span>
              <div className="text-3xl font-black text-[var(--color-accent-primary)] drop-shadow-md flex items-center justify-center gap-2">
                {usePersianDigits ? toPersianDigits(priceText) : priceText}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold p-3 bg-[var(--color-input-bg)] rounded-xl border border-[var(--card-border)]">
                <span className="text-[var(--color-text-muted)]">وضعیت موجودی:</span>
                <span className={product.stock > 0 || product.category === 'plan' || product.category === 'package' ? 'text-emerald-500' : 'text-red-500'}>
                  {product.stock > 0 || product.category === 'plan' || product.category === 'package' ? 'موجود' : 'ناموجود'}
                </span>
              </div>
              
              {product.tokenEstimate && (
                <div className="flex items-center justify-between text-xs font-bold p-3 bg-[var(--color-input-bg)] rounded-xl border border-[var(--card-border)]">
                  <span className="text-[var(--color-text-muted)]">تخمین توکن:</span>
                  <span className="text-[var(--color-text-main)] font-mono">{usePersianDigits ? toPersianDigits(product.tokenEstimate) : product.tokenEstimate}</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleBuyClick}
              disabled={product.category !== 'package' && product.category !== 'plan' && product.stock <= 0}
              className="w-full clay-btn-primary py-4 text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.category !== 'package' && product.category !== 'plan' && product.stock <= 0 
                ? 'ناموجود' 
                : 'خرید'}
            </button>
            
            <p className="text-center text-[10px] text-[var(--color-text-dim)] pt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              پرداخت امن از طریق درگاه رسمی
            </p>
          </div>
        </div>
      </div>

      {/* Full Width Details Area */}
      <div className="mt-6 w-full">
        <div className="clay-card-thick p-6 sm:p-8 space-y-8">
            
            {/* Long Description (Markdown) */}
            {product.longDescription && (
              <div className="max-w-6xl mx-auto w-full">
                <h3 className="font-bold text-xl text-[var(--color-text-main)] mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <Zap className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  توضیحات کامل محصول
                </h3>
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-loose text-[var(--color-text-muted)]">
                  <MarkdownRenderer content={product.longDescription} />
                </div>
              </div>
            )}

            {/* Features List */}
            {product.features && (
              <div className="max-w-6xl mx-auto w-full pt-4">
                <h3 className="font-bold text-xl text-[var(--color-text-main)] mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <CheckCircle2 className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  مزایای کلیدی
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {product.features.split('\n').filter(Boolean).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[var(--color-text-main)] bg-[var(--color-input-bg)] p-4 rounded-xl border border-[var(--card-border)] shadow-sm">
                      <CheckCircle2 size={18} className="text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{usePersianDigits ? toPersianDigits(feat.trim()) : feat.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Delivery Guide Card */}
          {product.deliveryGuide && (
            <div className="clay-card-thick guide-card p-6 sm:p-8 mt-6">
              <div className="max-w-6xl mx-auto w-full">
                <h3 className="font-bold text-xl text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-blue-200/50 dark:border-blue-800/50 pb-3">
                  <span className="text-xl">📌</span>
                  راهنمای گام‌به‌گام و مهم فعال‌سازی
                </h3>
                <div className="prose prose-sm sm:prose-base max-w-none text-blue-950 dark:text-blue-100/90 prose-p:leading-loose prose-strong:text-blue-900 dark:prose-strong:text-blue-300">
                  <MarkdownRenderer content={product.deliveryGuide} />
                </div>
              </div>
            </div>
          )}
          
          {/* FAQs */}
          {parsedFaqs.length > 0 && (
            <div className="clay-card-thick p-6 sm:p-8 mt-6">
              <div className="max-w-6xl mx-auto w-full">
                <h3 className="font-bold text-xl text-[var(--color-text-main)] mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <HelpCircle className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  سوالات متداول
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  {parsedFaqs.map((faq: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`clay-surface-inset rounded-xl overflow-hidden border border-[var(--card-border)] transition-all duration-300 ${activeFaq === idx ? 'border-[var(--color-accent-primary)]/30' : ''}`}
                    >
                      <button 
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-right cursor-pointer"
                      >
                        <span className="font-bold text-sm text-[var(--color-text-main)]">{faq.q}</span>
                        <ChevronLeft className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-300 ${activeFaq === idx ? '-rotate-90 text-[var(--color-accent-primary)]' : ''}`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 pt-0 text-sm text-[var(--color-text-muted)] leading-loose">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
        </div>


      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        product={product} 
      />
      
      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
}

