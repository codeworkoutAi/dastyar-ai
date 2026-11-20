import { X, Bot, Sparkles, Heart, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { Link } from 'react-router-dom';

export function AboutModal() {
  const { isAboutOpen, setIsAboutOpen } = useUIStore();

  if (!isAboutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md clay-modal overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10"></div>
        <button
          onClick={() => setIsAboutOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full clay-icon-btn transition-colors z-10"
        >
          <X className="w-5 h-5 text-zinc-500" />
        </button>

        <div className="relative pt-12 px-8 pb-8 text-center">
          <div className="mx-auto w-20 h-20 clay-subcard rounded-2xl flex items-center justify-center border border-[var(--card-border)] mb-6 relative">
            <div className="absolute inset-0 bg-blue-500 opacity-20 blur-xl rounded-full animate-pulse"></div>
            <Bot className="w-10 h-10 text-blue-600 relative z-10" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
            Dastyar AI
          </h2>
          <p className="text-blue-600 dark:text-blue-400 text-sm font-bold mb-5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> فروشگاه تخصصی ابزارها و اکانت‌های قانونی هوش مصنوعی
          </p>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-justify mb-6 text-right">
            Dastyar AI مرجع تخصصی ارائه اکانت‌های اختصاصی، قانونی و لایسنس‌های معتبر ابزارهای برتر هوش مصنوعی در ایران است. کلیه محصولات به صورت ۱۰۰٪ قانونی و اختصاصی بر روی ایمیل شخصی شما فعال شده و دارای ضمانت تعویض در تمام طول مدت اشتراک، پرداخت امن شاپرک و مشاور هوشمند ۲۴ ساعته خرید هستند.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/about"
              onClick={() => setIsAboutOpen(false)}
              className="w-full py-2.5 px-4 clay-btn-primary text-white text-xs sm:text-sm font-bold rounded-xl text-center shadow-md transition-all"
            >
              مطالعه بیانیه کامل و درباره ما
            </Link>
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5 mt-2">
              توسعه داده شده با <Heart className="w-3.5 h-3.5 text-red-500" /> برای همراهان ایرانی
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
