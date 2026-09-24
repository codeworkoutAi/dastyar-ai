import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { 
  X, 
  BookOpen,
  Wallet,
  Cpu,
  Sparkles,
  Compass,
  FileText
} from 'lucide-react';

export const UiGuideModal: React.FC = () => {
  const { isUiGuideOpen: isOpen, setIsUiGuideOpen } = useUIStore();
  const onClose = () => setIsUiGuideOpen(false);
  const [activeSection, setActiveSection] = useState('intro');

  const contentRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'intro', title: 'معرفی پلتفرم', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'wallet', title: 'کیف پول و اعتبارات', icon: <Wallet className="w-4 h-4 text-emerald-500" /> },
    { id: 'models', title: 'هوشمند و مدل‌ها', icon: <Cpu className="w-4 h-4 text-amber-500" /> },
    { id: 'features', title: 'امکانات ویژه', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { id: 'explore', title: 'مرکز کشف', icon: <Compass className="w-4 h-4 text-blue-500" /> },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`doc-sec-${id}`);
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  };

  // Simple ScrollSpy
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const scrollPos = contentRef.current.scrollTop + 50;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(`doc-sec-${sections[i].id}`);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    const ref = contentRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => {
      if (ref) ref.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="clay-card border-subtle w-[95vw] md:w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl overflow-hidden clay-modal text-zinc-800 dark:text-zinc-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between clay-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-md shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-zinc-900 dark:text-white">دفترچه راهنمای جامع</h3>
              <p className="text-xs opacity-75">راهنمای قدم به قدم استفاده از تمامی امکانات دستیار</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Table of Contents (Right Sidebar) */}
          <div className="hidden md:flex flex-col w-64 border-l border-[var(--card-border)] bg-zinc-50/50 dark:bg-black/10 p-4 space-y-1 overflow-y-auto shrink-0">
            <span className="text-xs font-bold text-zinc-500 mb-2 px-2">فهرست عناوین</span>
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-right ${
                  activeSection === sec.id ? 'bg-blue-500 text-white shadow-md' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {sec.icon}
                {sec.title}
              </button>
            ))}
          </div>

          {/* Content Area (Left Side) */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth relative">
            <div className="max-w-3xl mx-auto space-y-16 pb-20">

              {/* Intro Section */}
              <section id="doc-sec-intro" className="space-y-4">
                <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" /> معرفی پلتفرم هوش مصنوعی
                </h2>
                <p className="text-sm leading-relaxed opacity-90 text-justify">
                  به پیشرفته‌ترین دستیار هوشمند فارسی خوش آمدید. این پلتفرم به صورت یکپارچه به قوی‌ترین مدل‌های هوش مصنوعی جهان متصل است و به شما امکان می‌دهد بدون نیاز به خرید اکانت‌های دلاری یا استفاده از ابزارهای دور زدن تحریم، به راحتی به زبان فارسی با هوش مصنوعی گفتگو کنید، تصاویر را تحلیل کنید، فایل‌های خود را آپلود کنید و از دستیار بخواهید برایتان کد بنویسد.
                </p>
              </section>

              {/* Wallet Section */}
              <section id="doc-sec-wallet" className="space-y-4">
                <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Wallet className="w-6 h-6" /> کیف پول و سیستم مصرف (Pay-As-You-Go)
                </h2>
                <p className="text-sm leading-relaxed opacity-90 text-justify">
                  سیستم مالی ما بر اساس <strong>پرداخت به میزان مصرف</strong> طراحی شده است. هیچ نیازی به خرید اشتراک‌های ماهانه نیست! شما فقط بابت تعداد کلماتی (توکن‌هایی) که تولید می‌شود هزینه می‌پردازید.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-2xl clay-surface-inset border border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">🎁 سهمیه رایگان روزانه</h4>
                    <p className="text-xs opacity-90 leading-relaxed text-justify">
                      هر کاربر پس از ورود به سیستم، <strong>۱۵ پیام رایگان</strong> در هر ۴ ساعت دریافت می‌کند. تا زمانی که این سهمیه پر نشده باشد، گفتگو با مدل‌های رایگان هیچ هزینه‌ای از کیف پول شما کسر نخواهد کرد.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl clay-surface-inset border border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">💳 تغییر خودکار به مدل پولی</h4>
                    <p className="text-xs opacity-90 leading-relaxed text-justify">
                      وقتی سهمیه رایگان تمام شد، اگر کیف پول شما شارژ داشته باشد، سیستم به صورت کاملاً خودکار و بدون قطع شدن چت، پیام‌های بعدی را با مدل پولی پردازش کرده و هزینه بسیار ناچیزی کسر می‌کند. اگر شارژ نداشته باشید، زمان باقی‌مانده تا دریافت سهمیه رایگان بعدی نمایش داده می‌شود.
                    </p>
                  </div>
                </div>
              </section>

              {/* Models Section */}
              <section id="doc-sec-models" className="space-y-4">
                <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Cpu className="w-6 h-6" /> مسیریابی هوشمند و انواع مدل‌ها
                </h2>
                <p className="text-sm leading-relaxed opacity-90 text-justify">
                  این دستیار از سیستم <strong>مسیریابی هوشمند (Smart Routing)</strong> استفاده می‌کند. به این معنی که شما نیازی نیست برای هر کاری مدل تغییر دهید! خود دستیار تشخیص می‌دهد که سوال شما نیاز به چه تخصصی دارد.
                </p>
                <div className="flex flex-col gap-3 p-5 rounded-2xl clay-btn-secondary border border-zinc-300">
                  <h4 className="font-bold mb-1">دسته‌بندی مدل‌های سیستم:</h4>
                  <ul className="list-disc list-inside text-sm space-y-3 opacity-90 pl-2">
                    <li>
                      <strong>مدل‌های پیش‌فرض (مثل GPT-4o-mini):</strong> برای چت‌های روزمره، تولید محتوا، ترجمه و مکالمات عمومی با سرعت بالا.
                    </li>
                    <li>
                      <strong>مدل‌های برنامه‌نویسی (مثل DeepSeek v3):</strong> به محض اینکه از دستیار کدنویسی بخواهید، موتور هوشمند سوال را به این مدل‌های تخصصی هدایت می‌کند.
                    </li>
                    <li>
                      <strong>مدل‌های بینایی و اسناد (مثل Gemini Flash):</strong> اگر عکسی آپلود کنید، سیستم فوراً از این مدل‌ها برای بینایی ماشین و تحلیل دقیق عکس استفاده می‌کند.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Features Section */}
              <section id="doc-sec-features" className="space-y-4">
                <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" /> امکانات ویژه سیستم
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <FileText className="w-4 h-4 text-indigo-500" /> تحلیل فایل و اسناد
                    </div>
                    <p className="text-sm opacity-80 text-justify leading-relaxed">
                      شما می‌توانید فایل‌های PDF (تا ۱۰ مگابایت)، کدهای برنامه‌نویسی، فایل‌های متنی و حتی اکسل (CSV) را آپلود کنید. دستیار به صورت خودکار محتوای آن‌ها را استخراج کرده و به سوالات شما درباره فایل پاسخ می‌دهد.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <Compass className="w-4 h-4 text-teal-500" /> جستجو در وب (Web Search)
                    </div>
                    <p className="text-sm opacity-80 text-justify leading-relaxed">
                      هوش مصنوعی در حالت عادی فقط به اطلاعات گذشته دسترسی دارد. اما اگر سوالی درباره قیمت‌های روز، اخبار جدید یا آب و هوا بپرسید، سیستم به‌طور خودکار اینترنت را جستجو می‌کند تا اطلاعات لحظه‌ای را به شما ارائه دهد.
                    </p>
                  </div>
                </div>
              </section>

              {/* Explore Section */}
              <section id="doc-sec-explore" className="space-y-4">
                <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Compass className="w-6 h-6" /> مرکز کشف (Explore Hub)
                </h2>
                <p className="text-sm leading-relaxed opacity-90 text-justify">
                  در منوی سمت راست، بخشی به نام <strong>دنیای کشف</strong> وجود دارد. در این بخش، ده‌ها دستور (Prompt) آماده و پرسونای تخصصی از پیش نوشته شده است. با انتخاب هر کدام، دستیار لحن و شخصیت خود را تغییر می‌دهد. مثلاً می‌توانید از او بخواهید نقش یک معلم زبان انگلیسی، مشاور حقوقی یا تحلیل‌گر سئو را بازی کند!
                </p>
              </section>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
