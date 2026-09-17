import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { 
 X, 
 BookOpen,
 Image as ImageIcon,
 Key,
 Cpu,
 Keyboard,
 Settings
} from 'lucide-react';

export const UiGuideModal: React.FC = () => {
 const { isUiGuideOpen: isOpen, setIsUiGuideOpen } = useUIStore();
 const onClose = () => setIsUiGuideOpen(false);
 const [activeSection, setActiveSection] = useState('intro');

 const contentRef = useRef<HTMLDivElement>(null);

 const sections = [
 { id: 'intro', title: 'شروع کار با دستیار', icon: <BookOpen className="w-4 h-4" /> },
 { id: 'api', title: 'تنظیمات API (مهم)', icon: <Key className="w-4 h-4 text-amber-500" /> },
 { id: 'models', title: 'مدیریت مدل‌ها', icon: <Cpu className="w-4 h-4" /> },
 { id: 'image', title: 'استودیو تصویر', icon: <ImageIcon className="w-4 h-4" /> },
 { id: 'shortcuts', title: 'کلیدهای میانبر', icon: <Keyboard className="w-4 h-4" /> },
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
 <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
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
 <div className="hidden md:flex flex-col w-64 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/10 p-4 space-y-1 overflow-y-auto shrink-0">
 <span className="text-xs font-bold text-zinc-500 mb-2 px-2">فهرست عناوین</span>
 {sections.map(sec => (
 <button
 key={sec.id}
 onClick={() => scrollToSection(sec.id)}
 className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-right ${
 activeSection === sec.id 
 ? 'bg-blue-500 text-white shadow-md' 
 : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
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
 <BookOpen className="w-6 h-6" /> شروع کار با دستیار
 </h2>
 <p className="text-sm leading-relaxed opacity-90 text-justify">
 به دستیار هوشمند فارسی خوش آمدید. این محیط برای تعامل سریع و حرفه‌ای با پیشرفته‌ترین مدل‌های هوش مصنوعی (مثل Gemini) طراحی شده است. 
 شما می‌توانید متن بفرستید، عکس و فایل آپلود کنید و با سرعت بالا جواب بگیرید. 
 برای شروع کافیست در کادر پایین صفحه پیام خود را بنویسید یا از گزینه‌های"بانک ایده‌های سریع" در نوار کناری استفاده کنید.
 </p>
 <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl">
 <span className="font-bold text-blue-700 dark:text-blue-300">نکته طلایی:</span>
 <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">تمام گفتگوهای شما فقط در حافظه مرورگر خودتان (Local Storage) ذخیره می‌شود و حریم خصوصی شما کاملاً محفوظ است.</p>
 </div>
 </section>

 {/* API Section */}
 <section id="doc-sec-api" className="space-y-4">
 <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
 <Key className="w-6 h-6" /> تنظیمات API (مرحله ضروری)
 </h2>
 <p className="text-sm leading-relaxed opacity-90 text-justify">
 برای اینکه دستیار بتواند به سوالات شما پاسخ دهد، نیازمند متصل شدن به مغز هوش مصنوعی از طریق کلید امنیتی (API Key) است.
 اگر تاکنون این کلید را وارد نکرده‌اید، روی آیکون <strong>تنظیمات (چرخدنده)</strong> در بالای صفحه کلیک کنید.
 </p>
 <div className="flex flex-col gap-3 p-5 rounded-2xl clay-btn-secondary border border-zinc-300 dark:border-zinc-700">
 <h4 className="font-bold">مراحل دریافت کلید جمنای (Gemini):</h4>
 <ol className="list-decimal list-inside text-sm space-y-2 opacity-80 pl-2">
 <li>وارد سایت <strong>Google AI Studio</strong> شوید (نیاز به نرم‌افزار تغییر آی‌پی دارد).</li>
 <li>روی دکمه‌ی <strong>Get API Key</strong> کلیک کنید.</li>
 <li>گزینه‌ی <strong>Create API Key in new project</strong> را انتخاب کنید.</li>
 <li>کلید طولانی ساخته شده را کپی کرده و در بخش تنظیمات برنامه قرار دهید.</li>
 </ol>
 {/* Placeholder for the GIF idea we discussed */}
 <div className="mt-4 aspect-video rounded-xl bg-black/10 dark:bg-black/40 border border-[var(--card-border)] flex items-center justify-center relative overflow-hidden group">
 <span className="text-xs font-bold opacity-50 flex flex-col items-center gap-2">
 <Settings className="w-6 h-6" />
 (محل قرارگیری ویدیو / گیف آموزشی)
 </span>
 </div>
 </div>
 </section>

 {/* Models Section */}
 <section id="doc-sec-models" className="space-y-4">
 <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
 <Cpu className="w-6 h-6" /> مدیریت و انتخاب مدل‌ها
 </h2>
 <p className="text-sm leading-relaxed opacity-90 text-justify">
 در بالای صفحه، کنار دکمه تنظیمات، می‌توانید مدل هوش مصنوعی را تغییر دهید.
 به‌طور پیش‌فرض، مدل <strong>Gemini 1.5 Flash</strong> برای سرعت بالا و <strong>Gemini 1.5 Pro</strong> برای کارهای پیچیده نظیر تحلیل کدهای برنامه‌نویسی و مقالات علمی در دسترس هستند.
 </p>
 </section>

 {/* Image Studio Section */}
 <section id="doc-sec-image" className="space-y-4">
 <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-2">
 <ImageIcon className="w-6 h-6" /> استودیو تصویر (Image Studio)
 </h2>
 <p className="text-sm leading-relaxed opacity-90 text-justify">
 با کلیک روی آیکون پالت رنگ در بالای صفحه، وارد استودیوی تولید تصویر می‌شوید. 
 در آنجا با نوشتن توضیحات دقیق (به زبان انگلیسی یا فارسی) می‌توانید تصاویری بسیار با کیفیت خلق کنید.
 همچنین امکان تنظیم ابعاد تصویر (مربع، پرتره، منظره) در آن بخش وجود دارد.
 </p>
 </section>

 {/* Shortcuts Section */}
 <section id="doc-sec-shortcuts" className="space-y-4">
 <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
 <Keyboard className="w-6 h-6" /> کلیدهای میانبر سریع
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
 <div className="p-3 clay-btn-secondary rounded-xl flex items-center justify-between text-sm">
 <span>ارسال پیام</span>
 <kbd className="px-2 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-[var(--card-border)] font-mono text-xs">Enter</kbd>
 </div>
 <div className="p-3 clay-btn-secondary rounded-xl flex items-center justify-between text-sm">
 <span>خط جدید</span>
 <kbd className="px-2 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-[var(--card-border)] font-mono text-xs">Shift + Enter</kbd>
 </div>
 <div className="p-3 clay-btn-secondary rounded-xl flex items-center justify-between text-sm">
 <span>توقف تولید متن</span>
 <kbd className="px-2 py-1 bg-white dark:bg-black rounded-md shadow-sm border border-[var(--card-border)] font-mono text-xs">Esc</kbd>
 </div>
 </div>
 </section>

 </div>
 </div>

 </div>
 </div>
 </div>
 );
};
