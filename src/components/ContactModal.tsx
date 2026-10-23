import { X, Send, Mail, MessageCircle } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export function ContactModal() {
 const { isContactOpen, setIsContactOpen } = useUIStore();

 if (!isContactOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-md animate-in fade-in duration-200">
 <div className="relative w-full max-w-md clay-modal overflow-hidden animate-in zoom-in-95 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="p-6 md:p-8">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
 <MessageCircle className="text-emerald-600" />
 ارتباط با ما
 </h2>
 <button
 onClick={() => setIsContactOpen(false)}
 className="p-2 rounded-full clay-icon-btn transition-colors"
 >
 <X className="w-5 h-5 text-zinc-500" />
 </button>
 </div>

 <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed text-right">
 برای پشتیبانی، ارائه پیشنهادات و یا همکاری می‌توانید از طریق یکی از راه‌های زیر با ما در ارتباط باشید. ما همیشه مشتاق شنیدن صدای شما هستیم!
 </p>

 <div className="space-y-4">
 <a href="https://t.me/dastyaraigroup/1" target="_blank" rel="noopener noreferrer"
 className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
 >
 <div className="flex items-center gap-4 text-right">
 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
 <Send className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">پشتیبانی تلگرام</h3>
 <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">پاسخگویی سریع و گروه کاربران</p>
 </div>
 </div>
 </a>

 <a href="mailto:info@dastyarai.com" className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
 >
 <div className="flex items-center gap-4 text-right">
 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
 <Mail className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">ارسال ایمیل</h3>
 <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-mono" dir="ltr">info@dastyarai.com</p>
 </div>
 </div>
 </a>
 </div>
 </div>
 </div>
 </div>
 );
}
