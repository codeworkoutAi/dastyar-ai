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
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{product.price.toLocaleString()} تومان</span>
            </div>
            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700/50" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">مبلغ قابل پرداخت</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{product.price.toLocaleString()} تومان</span>
            </div>
          </div>

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
          
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
            با کلیک روی دکمه بالا، به درگاه پرداخت امن منتقل خواهید شد.
          </p>
        </div>
      </div>
    </div>
  );
};
