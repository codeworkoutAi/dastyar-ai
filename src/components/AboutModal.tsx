import { X, Bot, Sparkles, Heart } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

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
 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/10 dark:to-teal-500/10"></div>
 
 <button
 onClick={() => setIsAboutOpen(false)}
 className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-zinc-900/50 clay-icon-btn transition-colors z-10"
 >
 <X className="w-5 h-5 text-zinc-500" />
 </button>

 <div className="relative pt-12 px-8 pb-8 text-center">
 <div className="mx-auto w-20 h-20 clay-surface rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 mb-6 relative">
 <div className="absolute inset-0 bg-emerald-500 opacity-20 blur-xl rounded-full animate-pulse"></div>
 <Bot className="w-10 h-10 text-emerald-600 relative z-10" />
 </div>

 <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">دستیار هوشمند</h2>
 <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mb-6 flex items-center justify-center gap-1.5">
 <Sparkles className="w-4 h-4" /> قدرت گرفته از هوش مصنوعی جمینای
 </p>

 <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-justify mb-8 text-right">
 این پلتفرم با هدف ارائه یک تجربه کاملاً بومی، سریع و بی‌نقص از هوش مصنوعی برای کاربران فارسی‌زبان طراحی شده است. ما باور داریم که دسترسی به تکنولوژی‌های روز دنیا حق همه است و تلاش می‌کنیم پیچیده‌ترین ابزارها را در ساده‌ترین و زیباترین رابط کاربری در اختیار شما قرار دهیم.
 </p>

 <div className="flex flex-col gap-3">
 <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
 توسعه داده شده با <Heart className="w-3.5 h-3.5 text-red-500" /> برای شما
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
