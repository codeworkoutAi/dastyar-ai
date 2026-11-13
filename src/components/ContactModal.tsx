import { X, Send, Mail, MessageCircle } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export function ContactModal() {
  const { isContactOpen, setIsContactOpen } = useUIStore();

  if (!isContactOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md clay-modal overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="text-emerald-600" />
              ارتباط با ما
            </h2>
            <button
              onClick={() => setIsContactOpen(false)}
              className="p-2 rounded-full clay-icon-btn transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed text-right">
            برای پشتیبانی، پیگیری خرید، ارائه پیشنهادات یا همکاری می‌توانید از راه‌های زیر با ما در ارتباط باشید:
          </p>

          <div className="space-y-3">
            {/* Direct Admin Chat */}
            <a
              href="https://t.me/DastyaraiAdmin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div className="flex items-center gap-3.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">چت مستقیم با مدیریت تلگرام</h3>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5" dir="ltr">@DastyaraiAdmin</p>
                </div>
              </div>
            </a>

            {/* Telegram Support Bot */}
            <a
              href="https://t.me/FaChatBox_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all group"
            >
              <div className="flex items-center gap-3.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-900 dark:text-cyan-100 text-sm">ربات تیکتینگ ۲۴ ساعته</h3>
                  <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-0.5" dir="ltr">@FaChatBox_bot</p>
                </div>
              </div>
            </a>

            {/* Support Email */}
            <a
              href="mailto:support@dastyarai.com"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
            >
              <div className="flex items-center gap-3.5 text-right">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">ارسال ایمیل پشتیبانی</h3>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5 font-mono" dir="ltr">support@dastyarai.com</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
