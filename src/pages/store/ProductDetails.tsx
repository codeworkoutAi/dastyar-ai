import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, ChevronDown, CheckCircle2, ShieldCheck, 
  Zap, HelpCircle, AlertCircle, Star, MessageSquare, Send, Clock, UserCheck, MessageCircle 
} from 'lucide-react';
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
  const { user, token } = useAuthStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Variations state
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);

  // Reviews state (Anti-spam moderation)
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 5.0, totalReviews: 0 });
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
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

        // Parse variations if available
        if (found.variations) {
          try {
            const parsed = JSON.parse(found.variations);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setVariations(parsed);
              setSelectedVariation(parsed[0]);
            }
          } catch (e) {}
        }
        
        // Setup SEO dynamically
        setPageSeo({
          title: `خرید ${found.title} | Dastyar AI`,
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

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const [revRes, statsRes] = await Promise.all([
        fetch(`/api/store/products/${id}/reviews`),
        fetch(`/api/store/products/${id}/rating-summary`)
      ]);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setRatingStats(statsData);
      }
    } catch (e) {}
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    if (!newComment.trim() || newComment.trim().length < 5) {
      setReviewFeedback({ type: 'error', message: 'لطفاً حداقل ۵ کاراکتر در متن دیدگاه خود وارد نمایید.' });
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewFeedback(null);
      const res = await fetch(`/api/store/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating, comment: newComment.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت دیدگاه');
      }

      setReviewFeedback({ type: 'success', message: data.message || 'دیدگاه شما با موفقیت ثبت شد و پس از بررسی تایید خواهد شد.' });
      setNewComment('');
      setNewRating(5);
    } catch (err: any) {
      setReviewFeedback({ type: 'error', message: err.message || 'خطا در ثبت دیدگاه' });
    } finally {
      setSubmittingReview(false);
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

  const effectivePrice = selectedVariation && typeof selectedVariation.price === 'number'
    ? selectedVariation.price 
    : (product.price || 0);

  const priceText = effectivePrice > 0 
    ? `${effectivePrice.toLocaleString('fa-IR')} تومان` 
    : 'رایگان';

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
          className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors mb-6 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          بازگشت به فروشگاه
        </button>

        {/* Split Layout Content */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* Right Column: Details (RTL so Right is main content) */}
          <div className="flex-1 order-2 lg:order-1 w-full">
            {/* Hero Banner Area */}
            <div className="w-full mb-8">
              <div className="w-full aspect-video rounded-3xl overflow-hidden relative mb-4 group shadow-lg border border-[var(--card-border)] bg-[var(--card-bg)]">
                <span className="absolute top-4 right-4 z-10 inline-block px-3.5 py-1.5 bg-[var(--color-accent-primary)] text-white text-xs sm:text-sm font-black rounded-full shadow-lg">
                  {product.badge || (product.category === 'plan' ? 'اشتراک پرمیوم' : product.category === 'api' ? 'کلید API' : 'محصول اختصاصی')}
                </span>
                {(product.bannerImage || product.image) ? (
                  <>
                    <img
                      src={product.bannerImage || product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div style={{ display: 'none' }} className="w-full h-full bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-primary)]/5 flex items-center justify-center">
                      <Zap className="w-24 h-24 text-[var(--color-accent-primary)]/50" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-primary)]/5 flex items-center justify-center">
                    <Zap className="w-24 h-24 text-[var(--color-accent-primary)]/50" />
                  </div>
                )}
              </div>
              <div className="px-2 space-y-3">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] leading-snug">{product.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-xs font-bold rounded-full border border-blue-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>تحویل: {product.deliveryTime || '۱ تا ۲۴ ساعت کاری'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] text-xs font-bold rounded-full border border-[var(--color-accent-primary)]/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> ضمانت و فعال‌سازی قانونی
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>امتیاز {usePersianDigits ? toPersianDigits(ratingStats.averageRating) : ratingStats.averageRating} ({usePersianDigits ? toPersianDigits(ratingStats.totalReviews) : ratingStats.totalReviews} نظر)</span>
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
                    خلاصه ویژگی‌ها و معرفی
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-loose">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Left Column: Sticky Buy Box (RTL so Left is sidebar) */}
          <div className="w-full lg:w-[360px] shrink-0 order-1 lg:order-2 z-10">
            <div className="sticky top-24 clay-card-thick border-2 border-[var(--color-accent-primary)] p-6 space-y-5 animate-slideUpScale relative overflow-hidden shadow-[0_8px_32px_-8px_var(--color-accent-primary)]">
              
              {/* Highlight Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-primary)]/10 to-transparent pointer-events-none" />

              <div className="text-center pb-5 border-b border-[var(--card-border)] relative z-10">
                <span className="text-xs font-bold text-[var(--color-text-muted)] block mb-2">مبلغ قابل پرداخت:</span>
                <div className="text-3xl font-black text-[var(--color-accent-primary)] drop-shadow-md flex items-center justify-center gap-2">
                  {usePersianDigits ? toPersianDigits(priceText) : priceText}
                </div>
              </div>

              {/* Variations Selector (Periods / Durations) */}
              {variations.length > 0 && (
                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-bold text-[var(--color-text-muted)] block">
                    انتخاب دوره زمانی و اشتراک:
                  </label>
                  <div className="flex flex-col gap-2">
                    {variations.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariation(v)}
                        className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                          selectedVariation?.id === v.id
                            ? 'clay-btn-primary text-white border-transparent shadow-md'
                            : 'clay-surface border-[var(--card-border)] text-[var(--text-main)] hover:border-[var(--color-accent-primary)]/40'
                        }`}
                      >
                        <span className="text-xs font-bold">{v.title}</span>
                        <span className="text-xs font-black">
                          {usePersianDigits ? toPersianDigits(v.price.toLocaleString('fa-IR')) : v.price.toLocaleString('fa-IR')} ت
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2.5 relative z-10">
                <div className="flex items-center justify-between text-xs font-bold p-3 bg-[var(--color-input-bg)] rounded-xl border border-[var(--card-border)]">
                  <span className="text-[var(--color-text-muted)]">زمان و نحوه تحویل:</span>
                  <span className="text-blue-600 dark:text-cyan-400 flex items-center gap-1 font-bold">
                    <Clock size={13} />
                    {product.deliveryTime || '۱ تا ۲۴ ساعت کاری'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold p-3 bg-[var(--color-input-bg)] rounded-xl border border-[var(--card-border)]">
                  <span className="text-[var(--color-text-muted)]">وضعیت موجودی:</span>
                  <span className={product.stock > 0 || product.category === 'plan' || product.category === 'package' ? 'text-emerald-500' : 'text-red-500'}>
                    {product.stock > 0 || product.category === 'plan' || product.category === 'package' ? 'موجود و آماده فعال‌سازی' : 'ناموجود'}
                  </span>
                </div>
                
                {product.tokenEstimate && (
                  <div className="flex items-center justify-between text-xs font-bold p-3 bg-[var(--color-input-bg)] rounded-xl border border-[var(--card-border)]">
                    <span className="text-[var(--color-text-muted)]">اعتبار / ویژگی:</span>
                    <span className="text-[var(--color-text-main)] font-semibold">{usePersianDigits ? toPersianDigits(product.tokenEstimate) : product.tokenEstimate}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleBuyClick}
                disabled={product.category !== 'package' && product.category !== 'plan' && product.stock <= 0}
                className="w-full clay-btn-primary py-4 text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {product.category !== 'package' && product.category !== 'plan' && product.stock <= 0 
                  ? 'ناموجود' 
                  : 'تایید و شروع خرید'}
              </button>

              {/* Direct Telegram Support Button */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center flex flex-col gap-2 relative z-10">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300">
                  نیاز به مشاوره یا هماهنگی پیش از خرید؟
                </span>
                <a
                  href="https://t.me/DastyaraiAdmin"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle size={15} />
                  <span>ارتباط مستقیم در تلگرام (@DastyaraiAdmin)</span>
                </a>
              </div>
              
              <p className="text-center text-[10px] text-[var(--color-text-dim)] pt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                پرداخت آنلاین با شاپرک و کارت‌به‌کارت بانکی
              </p>
            </div>
          </div>
        </div>

        {/* Full Width Details Area */}
        <div className="mt-8 w-full space-y-6">
          <div className="clay-card-thick p-6 sm:p-8 space-y-8">
            {/* Long Description (Markdown) */}
            {product.longDescription && (
              <div className="max-w-6xl mx-auto w-full">
                <h3 className="font-bold text-xl text-[var(--color-text-main)] mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <Zap className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  توضیحات و مشخصات جامع محصول
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
                  مزایای کلیدی این سرویس
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {product.features.split('\n').filter(Boolean).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[var(--color-text-main)] bg-[var(--color-input-bg)] p-4 rounded-xl border border-[var(--card-border)] shadow-sm">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{usePersianDigits ? toPersianDigits(feat.trim()) : feat.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Guide Card */}
          {product.deliveryGuide && (
            <div className="clay-card-thick guide-card p-6 sm:p-8">
              <div className="max-w-6xl mx-auto w-full">
                <h3 className="font-bold text-xl text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-blue-200/50 dark:border-blue-800/50 pb-3">
                  <span className="text-xl">📌</span>
                  راهنمای گام‌به‌گام فعال‌سازی و دریافت سفارش
                </h3>
                <div className="prose prose-sm sm:prose-base max-w-none text-blue-950 dark:text-blue-100/90 prose-p:leading-loose prose-strong:text-blue-900 dark:prose-strong:text-blue-300">
                  <MarkdownRenderer content={product.deliveryGuide} />
                </div>
              </div>
            </div>
          )}
          
          {/* FAQs */}
          {parsedFaqs.length > 0 && (
            <div className="clay-card-thick p-6 sm:p-8">
              <div className="max-w-6xl mx-auto w-full">
                <h3 className="font-bold text-xl text-[var(--color-text-main)] mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <HelpCircle className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  پرسش‌های متداول خریداران
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  {parsedFaqs.map((faq: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`clay-subcard rounded-xl overflow-hidden border border-[var(--card-border)] transition-all duration-300 ${activeFaq === idx ? 'border-[var(--color-accent-primary)]/30' : ''}`}
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

          {/* User Reviews & Feedback (Anti-Spam System) */}
          <div className="clay-card-thick p-6 sm:p-8">
            <div className="max-w-6xl mx-auto w-full space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                <h3 className="font-bold text-xl text-[var(--color-text-main)] flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  دیدگاه‌ها و تجربیات خریداران
                </h3>
                <div className="flex items-center gap-2 bg-[var(--color-input-bg)] px-3 py-1.5 rounded-full border border-[var(--card-border)]">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-bold text-[var(--text-main)]">
                    میانگین امتیاز: {usePersianDigits ? toPersianDigits(ratingStats.averageRating) : ratingStats.averageRating} از ۵
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ({usePersianDigits ? toPersianDigits(ratingStats.totalReviews) : ratingStats.totalReviews} دیدگاه تاییدشده)
                  </span>
                </div>
              </div>

              {/* Review Form */}
              <div className="clay-subcard p-5 sm:p-6 rounded-2xl border border-[var(--card-border)] space-y-4">
                <h4 className="font-bold text-sm text-[var(--text-main)]">ثبت دیدگاه یا تجربه شما درباره این محصول</h4>
                
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {reviewFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-bold ${reviewFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                        {reviewFeedback.message}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[var(--text-muted)]">امتیاز شما:</span>
                      <div className="flex items-center gap-1" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star 
                              className={`w-5 h-5 ${star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-600'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="تجربه خود را درباره فعال‌سازی، کیفیت و کارایی این محصول بنویسید..."
                        rows={3}
                        className="w-full clay-input p-3 rounded-xl text-xs sm:text-sm outline-none resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
                        🛡️ جهت جلوگیری از اسپم، دیدگاه‌ها پس از تایید مدیریت منتشر می‌شوند. درج لینک، شماره تماس و آیدی تلگرام ممنوع است.
                      </p>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="clay-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>{submittingReview ? 'در حال ثبت...' : 'ارسال دیدگاه'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-[var(--color-input-bg)] rounded-xl border border-[var(--card-border)]">
                    <span className="text-xs text-[var(--text-muted)]">برای ثبت دیدگاه و امتیازدهی، لطفاً وارد حساب خود شوید.</span>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                      className="clay-btn-primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      ورود به حساب
                    </button>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="clay-subcard p-4 sm:p-5 rounded-2xl border border-[var(--card-border)] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center font-bold text-xs">
                            {rev.userName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--text-main)] block">{rev.userName}</span>
                            {rev.isVerifiedBuyer && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                <UserCheck size={12} /> خریدار تاییدشده
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1" dir="ltr">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={13} 
                              className={i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-600'} 
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                        {rev.comment}
                      </p>

                      {/* Official Admin Reply */}
                      {rev.reply && (
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-1 mt-2">
                          <span className="text-[11px] font-bold text-blue-700 dark:text-cyan-400 block">
                            پاسخ پشتیبانی دستیار:
                          </span>
                          <p className="text-xs text-[var(--text-main)] leading-relaxed">
                            {rev.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[var(--text-dim)] space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-bold">هنوز دیدگاهی برای این محصول ثبت نشده است.</p>
                    <p className="text-[11px]">اولین نفری باشید که تجربه خود را با دیگران به اشتراک می‌گذارد!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <CheckoutModal 
          isOpen={isCheckoutOpen} 
          onClose={() => setIsCheckoutOpen(false)} 
          product={product} 
          selectedVariation={selectedVariation}
        />
        
        <div className="mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}
