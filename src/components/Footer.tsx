import { Link } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { Send, Twitter, Github, Bot, Settings, Book, MessageSquare, ShoppingBag } from 'lucide-react';

export function Footer() {
  const { setIsAboutOpen, setIsContactOpen, setIsSettingsOpen } = useUIStore();

  return (
    <footer className="relative mt-20 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4 text-right">
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-emerald-600" />
              <h2 className="text-xl font-black bg-gradient-to-l from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                دستیار هوشمند
              </h2>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
              پنجره‌ای رو به آینده. همراه هوشمند شما برای خلق، یادگیری و کشف ناشناخته‌ها در دنیای بی‌کران هوش مصنوعی.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-right">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">دسترسی سریع</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:-translate-x-1 inline-flex items-center gap-2">
                  <MessageSquare size={14} /> چت هوشمند
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:-translate-x-1 inline-flex items-center gap-2">
                  <Book size={14} /> مجله مقالات
                </Link>
              </li>
              <li>
                <Link to="/store" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:-translate-x-1 inline-flex items-center gap-2">
                  <ShoppingBag size={14} /> فروشگاه
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform / Contact */}
          <div className="space-y-4 text-right">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">پلتفرم ما</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <button onClick={() => setIsAboutOpen(true)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:-translate-x-1 inline-flex items-center gap-2">
                  <Bot size={14} /> درباره ما
                </button>
              </li>
              <li>
                <button onClick={() => setIsContactOpen(true)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:-translate-x-1 inline-flex items-center gap-2">
                  <Send size={14} /> ارتباط با ما
                </button>
              </li>
              <li>
                <button onClick={() => setIsSettingsOpen(true)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:-translate-x-1 inline-flex items-center gap-2">
                  <Settings size={14} /> تنظیمات سیستم
                </button>
              </li>
            </ul>
          </div>

          {/* Trust Seal (eNamad) - Left Column */}
          <div className="space-y-4 flex flex-col items-start md:items-start text-right">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">نماد اعتماد</h3>
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
              <a referrerPolicy="origin" target="_blank" href="https://trustseal.enamad.ir/?id=7675736&Code=Gx87lRnRBjSnMfkfeXWDlWi88ZzK41Oj" className="inline-block">
                <img referrerPolicy="origin" src="https://trustseal.enamad.ir/logo.aspx?id=7675736&Code=Gx87lRnRBjSnMfkfeXWDlWi88ZzK41Oj" alt="نماد تجارت الکترونیکی (اینماد)" style={{ cursor: 'pointer', width: '105px', height: 'auto' }} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 font-medium">
            © {new Date().getFullYear()} دستیار هوشمند. تمامی حقوق محفوظ است.
          </p>
          
          <div className="flex items-center gap-4 text-zinc-400">
            <a href="#" className="p-2 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full transition-all hover:scale-110">
              <Send size={18} />
            </a>
            <a href="#" className="p-2 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-all hover:scale-110">
              <Twitter size={18} />
            </a>
            <a href="#" className="p-2 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all hover:scale-110">
              <Github size={18} />
            </a>
          </div>
          
          <p className="text-xs text-zinc-500 font-medium md:hidden lg:block">
            ساخته شده با ❤️ و ☕
          </p>
        </div>
      </div>
    </footer>
  );
}
