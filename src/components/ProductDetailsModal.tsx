import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Store, ShieldCheck, Zap } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useSettingsStore } from '../store/settingsStore';
import { toPersianDigits } from '../lib/persianUtils';

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
 a: 'کافیست کلید خریداری شده را کپی کرده و در بخش"تنظیمات > ارائه‌دهندگان" قرار دهید.'
 },
 {
 q: 'آیا اکانت‌ها گارانتی دارند؟',
 a: 'بله، تمامی اکانت‌های پرمیوم دارای ضمانت تعویض تا پایان دوره هستند.'
 }
];

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose, onBuy }) => {
 const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
 const { settings } = useSettingsStore();
 const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

 if (!isOpen || !product) return null;

 const formatPrice = (price: number) => {
 const formatted = (price || 0).toLocaleString();
 return usePersianDigits ? toPersianDigits(formatted) : formatted;
 };

 return (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
 onClick={onClose}
 />

 {/* Modal */}
 <div className="relative w-full max-w-xl clay-card rounded-3xl overflow-hidden flex flex-col animate-slideUpScale max-h-[88vh] border border-[var(--card-border)]">
 {/* Close Button */}
 <button onClick={onClose}
 className="absolute top-3.5 left-3.5 z-50 p-2 clay-surface hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md rounded-full text-zinc-600 dark:text-zinc-300 transition-colors shadow-sm"
 title="بستن"
 >
 <X className="w-4 h-4" />
 </button>

 <div className="overflow-y-auto custom-scrollbar flex-1">
 {/* Header Image */}
 <div className="w-full h-48 sm:h-60 clay-btn-secondary relative shrink-0 overflow-hidden">
 {product.bannerImage ? (
 <img src={product.bannerImage} alt={product.title} className="w-full h-full object-cover" />
 ) : product.image ? (
 <div className="w-full h-full relative flex items-center justify-center">
 <img src={product.image} alt="Background Blur" className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-50 dark:opacity-40" />
 <img src={product.image} alt={product.title} className="relative z-10 w-full h-full object-contain p-4 drop-" />
 </div>
 ) : (
 <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 relative z-10">
 <Store className="w-12 h-12 opacity-30" />
 <span className="text-xs font-medium opacity-50">بدون تصویر</span>
 </div>
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
 <div className="absolute bottom-3.5 right-5 left-5">
 <div className="flex items-center gap-2 mb-1.5 flex-wrap">
 <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 bg-blue-600 text-white rounded-md shadow-sm">
 {product.category === 'plan' ? 'پلن تعرفه' : product.category === 'api' ? 'کلید API' : product.category === 'account' ? 'اکانت پرمیوم' : 'پکیج آموزشی'}
 </span>
 {product.badge && (
 <span className="inline-block text-[11px] font-black px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md shadow-sm">
 {product.badge}
 </span>
 )}
 {product.tokenEstimate && (
 <span className="inline-block text-[11px] font-medium px-2 py-0.5 bg-zinc-800/80 text-blue-300 rounded-md border border-blue-500/30">
 {usePersianDigits ? toPersianDigits(product.tokenEstimate) : product.tokenEstimate}
 </span>
 )}
 </div>
 <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug drop-shadow-sm">
 {usePersianDigits ? toPersianDigits(product.title) : product.title}
 </h2>
 </div>
 </div>

 {/* Content */}
 <div className="p-5 sm:p-6 space-y-6">
 {/* Description */}
 <div>
 <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2.5 flex items-center gap-2">
 <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
 توضیحات محصول
 </h3>
 <div className="clay-surface p-4 rounded-2xl border border-[var(--card-border)]  prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
 <MarkdownRenderer content={product.longDescription || product.description || 'توضیحاتی برای این محصول ثبت نشده است.'} />
 </div>
 </div>

 {/* Features */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="flex items-center gap-3 p-3 clay-surface rounded-xl border border-[var(--card-border)]">
 <div className="p-2 bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
 <Zap className="w-4 h-4" />
 </div>
 <div>
 <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">تحویل آنی</h4>
 <p className="text-[11px] text-zinc-500 mt-0.5">بلافاصله پس از پرداخت</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-3 clay-surface rounded-xl border border-[var(--card-border)]">
 <div className="p-2 bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
 <ShieldCheck className="w-4 h-4" />
 </div>
 <div>
 <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">تضمین کیفیت</h4>
 <p className="text-[11px] text-zinc-500 mt-0.5">پشتیبانی و گارانتی معتبر</p>
 </div>
 </div>
 </div>

 {/* FAQs */}
 <div>
 <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
 <span className="w-1 h-5 bg-purple-600 rounded-full"></span>
 سوالات متداول
 </h3>
 <div className="space-y-2.5">
 {faqs.map((faq, idx) => (
 <div key={idx} className="border border-[var(--card-border)] rounded-xl overflow-hidden transition-all duration-300"
 >
 <button onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
 className="w-full flex items-center justify-between p-3 sm:p-3.5 clay-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
 >
 <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">{faq.q}</span>
 {openFaqIndex === idx ? (
 <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mr-2" />
 ) : (
 <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mr-2" />
 )}
 </button>
 {openFaqIndex === idx && (
 <div className="p-3 sm:p-3.5 clay-card border-t border-[var(--card-border)] ">
 <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="p-4 sm:p-5 clay-surface border-t border-[var(--card-border)]  flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
 <div className="flex flex-col w-full sm:w-auto text-center sm:text-right">
 <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">مبلغ قابل پرداخت:</span>
 <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
 {formatPrice(product.price)} <span className="text-xs font-normal text-zinc-500">تومان</span>
 </span>
 </div>
 <div className="flex items-center gap-2.5 w-full sm:w-auto">
 <button onClick={onClose}
 className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl clay-surface text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-bold border border-[var(--card-border)] hover:clay-surface dark:hover:bg-zinc-700 transition-colors"
 >
 انصراف
 </button>
 <button onClick={() => {
 onBuy(product);
 onClose();
 }}
 disabled={product.category !== 'package' && product.category !== 'plan' && product.stock <= 0}
 style={{ borderRadius:"12px" }} className="flex-1 sm:flex-none px-6 py-2.5 clay-btn-primary-thick text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:-translate-y-0.5"
 >
 {product.category !== 'package' && product.category !== 'plan' && product.stock <= 0 ? 'ناموجود' : 'ادامه به پرداخت'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
};
