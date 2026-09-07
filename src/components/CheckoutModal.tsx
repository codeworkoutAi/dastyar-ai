import React, { useState } from 'react';
import { CloseCircleOutlineIcon, ShopLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../store/authStore';

interface CheckoutModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, isOpen, onClose }) => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'card'>('online');
  const [trackingNumber, setTrackingNumber] = useState('');

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
      const telegramUsername = 'FaChatBox_bot';
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
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUpScale">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShopLinearIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">تایید خرید</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors disabled:opacity-50"
          >
            <CloseCircleOutlineIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-4 text-center">
            {product.image ? (
              <img src={product.image} alt={product.title} className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-zinc-200 dark:border-zinc-800" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <ShopLinearIcon className="w-8 h-8 opacity-50" />
              </div>
            )}
            
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{product.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{product.category === 'api' ? 'کلید API' : product.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی'}</p>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">قیمت محصول</span>
              <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <span>{product.price.toLocaleString()}</span>
                <span>تومان</span>
              </div>
            </div>
            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700/50" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">مبلغ قابل پرداخت</span>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>{product.price.toLocaleString()}</span>
                <span>تومان</span>
              </div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button 
              onClick={() => setPaymentMethod('online')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === 'online' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              درگاه پرداخت
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === 'card' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              کارت به کارت
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center flex flex-col gap-2">
                <span className="text-sm text-blue-800 dark:text-blue-200">لطفا مبلغ فوق را به شماره کارت زیر واریز نمایید:</span>
                <span className="text-xl font-bold font-mono tracking-widest text-blue-900 dark:text-white" dir="ltr">1234-5678-1234-5678</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">به نام: مدیریت چت باکس</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">شماره پیگیری یا ۴ رقم آخر کارت:</label>
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثال: 123456 یا 8765"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 outline-none text-sm font-mono text-center"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'online' ? (
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'ثبت پرداخت و ارسال فیش در تلگرام'
              )}
            </button>
          )}
          
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
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
