import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Store, ShieldCheck, Zap } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ProductDetailsModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: (product: any) => void;
}

const faqs = [
  {
    q: 'تحویل محصول چقدر زمان می‌برد؟',
    a: 'تمامی سفارشات به صورت آنی و خودکار پس از پرداخت موفق در صندوقچه خریدهای شما قرار می‌گیرند.'
  },
  {
    q: 'چگونه از کلید API استفاده کنم؟',
    a: 'کافیست کلید خریداری شده را کپی کرده و در بخش "تنظیمات > ارائه‌دهندگان" قرار دهید.'
  },
  {
    q: 'آیا اکانت‌ها گارانتی دارند؟',
    a: 'بله، تمامی اکانت‌های پرمیوم دارای ضمانت تعویض تا پایان دوره هستند.'
  }
];

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose, onBuy }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUpScale max-h-[90vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md rounded-full text-zinc-600 dark:text-zinc-300 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {/* Header Image */}
          <div className="w-full h-56 sm:h-72 bg-zinc-100 dark:bg-zinc-800 relative shrink-0 overflow-hidden">
            {product.bannerImage ? (
              <img src={product.bannerImage} alt={product.title} className="w-full h-full object-cover" />
            ) : product.image ? (
              <div className="w-full h-full relative flex items-center justify-center">
                <img src={product.image} alt="Background Blur" className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-50 dark:opacity-40" />
                <img src={product.image} alt={product.title} className="relative z-10 w-full h-full object-contain p-6 drop-shadow-2xl" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 relative z-10">
                <Store className="w-16 h-16 opacity-30" />
                <span className="text-sm font-medium opacity-50">بدون تصویر</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 right-6 left-6">
              <span className="inline-block mb-2 text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-lg shadow-sm">
                {product.category === 'api' ? 'کلید API' : product.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {product.title}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                توضیحات محصول
              </h3>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                <MarkdownRenderer content={product.longDescription || product.description || 'توضیحاتی برای این محصول ثبت نشده است.'} />
              </div>
            </div>

            {/* Features (Static for now, can be dynamic later) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">تحویل آنی</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">بلافاصله پس از پرداخت</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">تضمین کیفیت</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">پشتیبانی و گارانتی معتبر</p>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                سوالات متداول
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <button 
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 text-right">{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-5 h-5 text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col w-full sm:w-auto text-center sm:text-right">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">مبلغ قابل پرداخت:</span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {product.price.toLocaleString()} <span className="text-sm font-normal text-zinc-500">تومان</span>
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              انصراف
            </button>
            <button 
              onClick={() => {
                onBuy(product);
                onClose();
              }}
              disabled={product.category !== 'package' && product.stock <= 0}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.category !== 'package' && product.stock <= 0 ? 'ناموجود' : 'ادامه به پرداخت'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
