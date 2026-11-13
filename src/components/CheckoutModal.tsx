import React, { useState } from 'react';
import { CloseCircleOutlineIcon, ShopLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { toPersianDigits } from '../lib/persianUtils';
import { Capacitor } from '@capacitor/core';
import { isBazaarEnvironment } from '../lib/bazaarUtils';

interface CheckoutModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  selectedVariation?: any;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, isOpen, onClose, selectedVariation }) => {
  const { user, token } = useAuthStore();
  const { settings } = useSettingsStore();
  const isBazaar = isBazaarEnvironment();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'card'>('online');
  const [trackingNumber, setTrackingNumber] = useState('');

  const effectivePrice = selectedVariation && typeof selectedVariation.price === 'number'
    ? selectedVariation.price 
    : (product?.price || 0);

  const formatPrice = (price: number) => {
    const formatted = (price || 0).toLocaleString();
    return usePersianDigits ? toPersianDigits(formatted) : formatted;
  };

  if (!isOpen || !product) return null;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          productId: product.id, 
          variationId: selectedVariation?.id,
          selectedPeriod: selectedVariation?.title,
          gateway: isBazaar ? 'bazaarpay' : 'zarinpal' 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ایجاد فاکتور');
      }

      // Redirect to mock payment gateway
      if (data.paymentUrl) {
        let targetUrl = data.paymentUrl;
        if (targetUrl.startsWith('/')) {
          const apiBase = Capacitor.isNativePlatform() ? 'https://dastyarai.com' : window.location.origin;
          targetUrl = apiBase + targetUrl;
        }
        window.location.href = targetUrl;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleManualCheckout = async () => {
    if (isBazaar) {
      setError('این روش پرداخت در نسخه کافه‌بازار پشتیبانی نمی‌شود.');
      return;
    }
    if (!trackingNumber.trim()) {
      setError('لطفاً شماره پیگیری یا ۴ رقم آخر کارت را وارد کنید.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/store/checkout-manual', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          productId: product.id, 
          variationId: selectedVariation?.id,
          selectedPeriod: selectedVariation?.title,
          trackingNumber 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ایجاد فاکتور');
      }

      // Redirect to Telegram
      const telegramUsername = 'DastyaraiAdmin';
      const prodName = `${product.title}${selectedVariation ? ` (${selectedVariation.title})` : ''}`;
      const message = encodeURIComponent(`سلام، فیش واریز سفارش ${data.orderId} برای «${prodName}» (مبلغ: ${effectivePrice.toLocaleString()} تومان) را ضمیمه این پیام ارسال می‌کنم.\nشماره پیگیری/کارت: ${trackingNumber}`);
      window.open(`https://t.me/${telegramUsername}?text=${message}`, '_blank');
      onClose();
      // Optionally reload or let user go to dashboard to see pending order
      window.location.assign('/store?tab=dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

 return (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
 onClick={!loading ? onClose : undefined}
 />
 <div className="relative w-full max-w-md max-h-[90vh] clay-modal overflow-hidden flex flex-col animate-slideUpScale">
 {/* Header */}
 <div className="flex items-center justify-between p-4 sm:p-5 pb-3.5 border-b border-[var(--card-border)]/60 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
 <ShopLinearIcon className="w-5 h-5" />
 </div>
 <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-display">تایید خرید</h2>
 </div>
 <button
 onClick={onClose}
 disabled={loading}
 className="w-9 h-9 flex items-center justify-center rounded-full clay-icon-btn text-zinc-500 transition-colors disabled:opacity-50"
 >
 <CloseCircleOutlineIcon className="w-5 h-5" />
 </button>
 </div>

 {/* Scrollable Content Body */}
 <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
 {error && (
 <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold">
 {error}
 </div>
 )}

 <div className="flex flex-col items-center gap-2.5 text-center">
 {/* Widescreen Banner Container */}
 <div className="w-full clay-card  h-28 sm:h-36 rounded-2xl overflow-hidden relative shadow-sm  clay-btn-secondary shrink-0">
 {product.bannerImage ? (
 <img src={product.bannerImage} alt={product.title} className="w-full h-full object-cover" />
 ) : product.image ? (
 <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
 <img src={product.image} alt="Background Blur" className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-40 dark:opacity-30" />
 <img src={product.image} alt={product.title} className="relative z-10 w-full h-full object-contain p-2.5 drop-shadow-md" />
 </div>
 ) : (
 <div className="w-full h-full flex items-center justify-center text-zinc-400">
 <ShopLinearIcon className="w-8 h-8 opacity-40" />
 </div>
 )}
 <span className="absolute top-2.5 right-2.5 type-badge font-bold px-2 py-0.5 bg-black/65 text-white rounded-md backdrop-blur-md shadow-xs z-20">
 {product.category === 'api' ? 'کلید API' : product.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی'}
 </span>
 </div>
 <div>
 <h3 className="font-display text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{product.title}</h3>
 </div>
 </div>

 <div className="clay-card rounded-2xl p-3.5 flex flex-col gap-2.5">
 {selectedVariation && (
 <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-[var(--card-border)]/50">
 <span className="text-zinc-600 dark:text-zinc-400 font-bold">دوره انتخابی:</span>
 <span className="font-extrabold text-blue-600 dark:text-cyan-400">{selectedVariation.title}</span>
 </div>
 )}

 <div className="flex items-center justify-between text-xs sm:text-sm">
 <span className="text-zinc-600 dark:text-zinc-400">قیمت محصول</span>
 <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
 <span>{formatPrice(effectivePrice)}</span>
 <span>تومان</span>
 </div>
 </div>

 <div className="flex items-center gap-2 mt-1">
 <input 
 type="text" 
 placeholder="کد تخفیف دارید؟" 
 className="flex-1 clay-input px-3 py-1.5 rounded-lg text-xs font-mono outline-none focus:border-blue-400"
 dir="ltr"
 />
 <button className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-600">
 اعمال
 </button>
 </div>

 <div className="w-full h-px clay-btn-secondary/50" />
 <div className="flex items-center justify-between">
 <span className="text-zinc-900 dark:text-zinc-100 font-bold text-xs sm:text-sm">مبلغ قابل پرداخت</span>
 <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 font-ui">
 <span>{formatPrice(effectivePrice)}</span>
 <span className="text-xs font-normal text-zinc-500">تومان</span>
 </div>
 </div>
 </div>

 {/* Payment Method Tabs */}
 {!isBazaar && (
 <div className="flex clay-btn-secondary p-1 rounded-xl shrink-0">
 <button onClick={() => setPaymentMethod('online')}
 className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${paymentMethod === 'online' ? 'clay-card shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
 >
 درگاه پرداخت
 </button>
 <button onClick={() => setPaymentMethod('card')}
 className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${paymentMethod === 'card' ? 'clay-card shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
 >
 کارت به کارت
 </button>
 </div>
 )}

 {(paymentMethod === 'online' || isBazaar) && (
 <div className="p-3 clay-surface rounded-xl border border-[var(--card-border)] flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300 animate-fadeIn">
 <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-sm shrink-0">
 💳
 </div>
 <div className="flex-1">
 <span className="font-bold block text-zinc-800 dark:text-zinc-200">
 {isBazaar ? 'درگاه مستقیم بازارپی (کافه‌بازار)' : 'درگاه امن بانکی شاپرک (زرین‌پال)'}
 </span>
 <span className="type-badge text-zinc-500 dark:text-zinc-400">
 {isBazaar ? 'پرداخت آنی و امن با زیرساخت بازارپی کافه‌بازار' : 'پرداخت آنی و امن با تمامی کارت‌های عضو شبکه شتاب'}
 </span>
 </div>
 </div>
 )}

 {paymentMethod === 'card' && !isBazaar && (
 <div className="flex flex-col gap-3 animate-fadeIn">
 <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center flex flex-col gap-1.5">
 <span className="text-xs text-blue-800 dark:text-blue-200">لطفا مبلغ فوق را به شماره کارت زیر واریز نمایید:</span>
 <span className="text-lg font-bold font-mono tracking-widest text-blue-900 dark:text-white select-all" dir="ltr">5894-6311-1590-7644</span>
 <span className="type-badge font-bold text-blue-700 dark:text-blue-300">به نام: علی ابراهیمی قرخلو (بانک رفاه)</span>
 </div>
 <div>
 <label className="block type-badge font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">شماره پیگیری یا ۴ رقم آخر کارت:</label>
 <input type="text" value={trackingNumber}
 onChange={(e) => setTrackingNumber(e.target.value)}
 placeholder="مثال: 123456 یا 8765"
 className="w-full clay-input  px-3.5 py-2.5 rounded-xl clay-surface  focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 outline-none text-xs sm:text-sm font-mono text-center"
 dir="ltr"
 />
 </div>
 </div>
 )}
 </div>

 {/* Sticky Modal Footer - Always 100% visible on any screen height! */}
 <div className="p-4 sm:p-5 pt-3 border-t border-[var(--card-border)] clay-surface backdrop-blur-md shrink-0 flex flex-col gap-2">
 {(paymentMethod === 'online' || isBazaar) ? (
 <button onClick={handleCheckout}
 disabled={loading}
 className="w-full py-3 clay-btn-primary text-sm sm:text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
 >
 {loading ? (
 <>
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 در حال انتقال به درگاه...
 </>
 ) : (
 'تایید و انتقال به درگاه پرداخت'
 )}
 </button>
 ) : (
 <button onClick={handleManualCheckout}
 disabled={loading || !trackingNumber.trim()}
 className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
 >
 {loading ? (
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 'ثبت پرداخت و ارسال فیش در تلگرام'
 )}
 </button>
 )}
 <p className="type-badge text-center text-zinc-500 dark:text-zinc-500">
 {(paymentMethod === 'online' || isBazaar) ? (isBazaar ? 'با کلیک روی دکمه بالا، به درگاه امن بازارپی منتقل خواهید شد.' : 'با کلیک روی دکمه بالا، به درگاه پرداخت امن منتقل خواهید شد.')
 : 'پس از ثبت، برای ارسال عکس فیش به تلگرام پشتیبانی هدایت می‌شوید.'
 }
 </p>
 </div>
 </div>
 </div>
 );
};
