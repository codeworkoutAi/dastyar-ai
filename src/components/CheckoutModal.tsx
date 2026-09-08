import React, { useState } from 'react';
import { CloseCircleOutlineIcon, ShopLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { toPersianDigits } from '../lib/persianUtils';

interface CheckoutModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, isOpen, onClose }) => {
  const { user, token } = useAuthStore();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'card'>('online');
  const [trackingNumber, setTrackingNumber] = useState('');

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
        body: JSON.stringify({ productId: product.id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ایجاد فاکتور');
      }

      // Redirect to mock payment gateway
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleManualCheckout = async () => {
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
        body: JSON.stringify({ productId: product.id, trackingNumber })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ایجاد فاکتور');
      }

      // Redirect to Telegram
      const telegramUsername = 'DastyaraiAdmin';
      const message = encodeURIComponent(`سلام، فیش واریز سفارش ${data.orderId} (مبلغ: ${product.price.toLocaleString()} تومان) را ضمیمه این پیام ارسال می‌کنم.\nشماره پیگیری/کارت: ${trackingNumber}`);
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
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={!loading ? onClose : undefined}
      />
      
      <div className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUpScale">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShopLinearIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-display">تایید خرید</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors disabled:opacity-50"
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
            <div className="w-full h-28 sm:h-36 rounded-2xl overflow-hidden relative shadow-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 shrink-0">
              {product.bannerImage ? (
                <img 
                  src={product.bannerImage} 
                  alt={product.title} 
                  className="w-full h-full object-cover" 
                />
              ) : product.image ? (
                <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                  <img 
                    src={product.image} 
                    alt="Background Blur" 
                    className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-40 dark:opacity-30" 
                  />
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="relative z-10 w-full h-full object-contain p-2.5 drop-shadow-md" 
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <ShopLinearIcon className="w-8 h-8 opacity-40" />
                </div>
              )}
              <span className="absolute top-2.5 right-2.5 text-[10.5px] font-bold px-2 py-0.5 bg-black/65 text-white rounded-md backdrop-blur-md shadow-xs z-20">
                {product.category === 'api' ? 'کلید API' : product.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی'}
              </span>
            </div>
            
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{product.title}</h3>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">قیمت محصول</span>
              <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <span>{formatPrice(product.price)}</span>
                <span>تومان</span>
              </div>
            </div>
            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700/50" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold text-xs sm:text-sm">مبلغ قابل پرداخت</span>
              <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 font-ui">
                <span>{formatPrice(product.price)}</span>
                <span className="text-xs font-normal text-zinc-500">تومان</span>
              </div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setPaymentMethod('online')}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${paymentMethod === 'online' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              درگاه پرداخت
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${paymentMethod === 'card' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              کارت به کارت
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="flex flex-col gap-3 animate-fadeIn">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center flex flex-col gap-1.5">
                <span className="text-xs text-blue-800 dark:text-blue-200">لطفا مبلغ فوق را به شماره کارت زیر واریز نمایید:</span>
                <span className="text-lg font-bold font-mono tracking-widest text-blue-900 dark:text-white select-all" dir="ltr">5894-6311-1590-7644</span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">به نام: علی ابراهیمی قرخلو (بانک رفاه)</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">شماره پیگیری یا ۴ رقم آخر کارت:</label>
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثال: 123456 یا 8765"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 outline-none text-xs sm:text-sm font-mono text-center"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer - Always 100% visible on any screen height! */}
        <div className="p-4 sm:p-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shrink-0 flex flex-col gap-2">
          {paymentMethod === 'online' ? (
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
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
            <button 
              onClick={handleManualCheckout}
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
          
          <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-500">
            {paymentMethod === 'online' 
              ? 'با کلیک روی دکمه بالا، به درگاه پرداخت امن منتقل خواهید شد.'
              : 'پس از ثبت، برای ارسال عکس فیش به تلگرام پشتیبانی هدایت می‌شوید.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
