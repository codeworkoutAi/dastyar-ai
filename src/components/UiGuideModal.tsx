import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';

import { 
  X, 
  Layers, 
  Layout, 
  Menu, 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  Mic, 
  Code, 
  Info, 
  CheckCircle2 
} from 'lucide-react';



interface ComponentZone {
  id: string;
  name: string;
  codeName: string;
  category: string;
  description: string;
  subElements: string[];
  tips: string;
  color: string;
}

export const UiGuideModal: React.FC = () => {
  const { isUiGuideOpen: isOpen, setIsUiGuideOpen } = useUIStore();
  const onClose = () => setIsUiGuideOpen(false);
  const [selectedZone, setSelectedZone] = useState<string>('header');

  if (!isOpen) return null;

  const zones: Record<string, ComponentZone> = {
    header: {
      id: 'header',
      name: 'هدر بالا (نوار عنوان و دسترسی سریع)',
      codeName: 'Header',
      category: 'ساختار اصلی (Layout)',
      description: 'نوار بالایی ثابت صفحه شامل دکمه‌های ناوبری اصلی، انتخاب مدل، استودیوها و تنظیمات.',
      subElements: [
        'دکمه منوی گفتگوها (Toggle Sidebar)',
        'لوگو و عنوان اصلی (دستیار هوشمند)',
        'بج نام مدل فعال (Active Model Badge)',
        'دکمه حالت ویندوز / موبایل (Platform Toggle)',
        'دکمه استودیو ساخت تصویر (Image Studio)',
        'دکمه خروجی گرفتن (Export Modal)',
        'دکمه تنظیمات عمومی و هوش مصنوعی (Settings Modal)'
      ],
      tips: 'اگر می‌خواهید رنگ هدر، اندازه لوگو یا چیدمان دکمه‌های بالای صفحه تغییر کند، نام «هدر» یا «Header» را بیاورید.',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400'
    },
    sidebar: {
      id: 'sidebar',
      name: 'سایدبار (نوار کناری تاریخچه گفتگوها)',
      codeName: 'Sidebar',
      category: 'ساختار اصلی (Layout)',
      description: 'پنل کشویی سمت راست که تاریخچه تمام چت‌ها، جستجو در گفتگوها و مدیریت چت‌ها در آن قرار دارد.',
      subElements: [
        'دکمه گفتگوی جدید (New Chat)',
        'کادر جستجو در پیام‌ها و عنوان‌ها (Search)',
        'لیست دسته‌بندی‌شده گفتگوها (پین‌شده، امروز، دیروز، هفته قبل)',
        'دکمه‌های تغییر نام، پین و حذف هر چت (Rename / Pin / Delete)',
        'نوار پایین وضعیت حافظه و دکمه پاکسازی همه (Clear All History)'
      ],
      tips: 'برای تغییر عرض سایدبار، نحوه دسته‌بندی تاریخچه یا دکمه‌های هر چت، به «سایدبار» یا «Sidebar» اشاره کنید.',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-600 dark:text-purple-400'
    },
    chatbox: {
      id: 'chatbox',
      name: 'محیط پیام‌ها و گفتگو (جریان چت)',
      codeName: 'ChatBox',
      category: 'هسته چت (Chat Core)',
      description: 'فضای اصلی میانی که تمام حباب‌های پیام کاربر و هوش مصنوعی در آن به ترتیب نمایش داده می‌شوند.',
      subElements: [
        'صفحه خوش‌آمدگویی و کارت‌های پرامپت پیشنهادی (Welcome Screen)',
        'حباب پیام کاربر با بج زمان و تصویر (User Bubble)',
        'حباب پاسخ هوش مصنوعی (AI Bubble)',
        'نشانگر در حال فکر و تایپ (Thinking & Typing Indicator)',
        'نوار ابزار زیر پاسخ: کپی، خواندن صوتی، تولید مجدد و لایک/دیس‌لایک',
        'دکمه شناور پرش به آخرین پیام (Scroll To Bottom)'
      ],
      tips: 'برای تغییر رنگ حباب‌ها، انیمیشن پاسخ، فونت متون پیام یا دکمه‌های زیر هر پاسخ، بگویید «بخش پیام‌ها» یا «ChatBox».',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
    },
    input: {
      id: 'input',
      name: 'کادر ورود متن و ارسال پیام',
      codeName: 'MessageInput',
      category: 'تعامل و ورودی (Input)',
      description: 'نوار پایینی شناور صفحه برای نوشتن پیام، آپلود عکس، ضبط صدا و دکمه ارسال.',
      subElements: [
        'فیلد ورودی متن چندخطی خودکار (Auto-growing Textarea)',
        'پیش‌نمایش تصویر الصاق شده با دکمه حذف',
        'دکمه آپلود تصویر از سیستم (Attach Image)',
        'دکمه ضبط صدا و تبدیل گفتار به متن (Voice Mic)',
        'کارت پرامپت‌های سریع بالای ورودی (Quick Prompts)',
        'دکمه بزرگ ارسال پیام با افکت فعال/غیرفعال (Send Button)'
      ],
      tips: 'برای تغییر شکل کادر ورودی، دکمه ارسال، میکروفون یا میانبرهای کیبورد، از «کادر پیام» یا «MessageInput» نام ببرید.',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400'
    },
    markdown: {
      id: 'markdown',
      name: 'رندر محتوا، جدول‌ها و کدها',
      codeName: 'MarkdownRenderer',
      category: 'نمایش داده (Content)',
      description: 'موتور فرمت‌بندی هوشمند متون فارسی و انگلیسی، کدهای برنامه‌نویسی و فرمول‌ها.',
      subElements: [
        'بلاک‌های کد برنامه‌نویسی با نوار عنوان، کپی و دانلود (Code Block)',
        'جدول‌های داده با استایل مدرن و خطوط تفکیک (Tables)',
        'فرمول‌های ریاضی و نمادهای علمی (LaTeX / KaTeX)',
        'کادرهای پیام ویژه: نکته (Note)، هشدار (Warning)، پیشنهاد (Tip)',
        'لیست‌های بالت‌دار و شماره‌گذاری شده راست‌به‌چپ (Lists)'
      ],
      tips: 'برای تغییر تم باکس کدها، رنگ جدول‌ها، خطوط نقل‌قول یا فرمول‌های ریاضی، بگویید «رندر مارک‌داون» یا «MarkdownRenderer».',
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400'
    },
    modals: {
      id: 'modals',
      name: 'پنجره‌های شناور (تنظیمات، خروجی، ساخت تصویر)',
      codeName: 'Modals & Studios',
      category: 'امکانات جانبی (Features)',
      description: 'پنجره‌های دیالوگ پیشرفته برای سفارشی‌سازی کل برنامه و ذخیره‌سازی داده‌ها.',
      subElements: [
        'پنجره تنظیمات (SettingsModal): انتخاب فونت فارسی، دما، کلید API و صدا',
        'پنجره خروجی گرفتن (ExportModal): دانلود گفتگو به صورت PDF، JSON و Markdown',
        'استودیوی تولید تصویر (ImageGenStudio): پرامپت‌نویسی و ساخت عکس با Gemini'
      ],
      tips: 'برای افزودن امکانات جدید به تنظیمات یا اضافه کردن فرمت‌های خروجی جدید، نام پنجره مدنظر را ذکر کنید.',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-600 dark:text-cyan-400'
    }
  };

  const currentZone = zones[selectedZone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="clay-card border-subtle w-[95vw] md:w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-3xl shadow-2xl overflow-hidden bg-[var(--card-bg)] text-[var(--text-main)]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-subtle flex items-center justify-between bg-white/5 dark:bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] text-white shadow-md shrink-0">
              <Layout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-lg flex items-center gap-2 truncate">
                راهنمای تصویری اجزای رابط کاربری (UI Map)
              </h3>
              <p className="text-[11px] sm:text-xs opacity-75 truncate">
                روی هر بخش کلیک کنید تا نام فنی و نحوه ویرایش آن را ببینید.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="clay-btn p-2 rounded-xl text-inherit hover:opacity-80 transition-opacity shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (Visual Screen Wireframe Map) - 7 cols */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <span className="text-xs font-bold text-inherit opacity-85 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-sky-300" />
              نمای کلی صفحه نمایش (روی بخش‌ها کلیک کنید):
            </span>

            {/* Visual Interactive Screen Mockup */}
            <div className="p-3 rounded-2xl bg-black/10 dark:bg-black/40 border border-subtle flex flex-col gap-2 relative select-none">
              
              {/* 1. Header Mockup */}
              <div 
                onClick={() => setSelectedZone('header')}
                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedZone === 'header' 
                    ? 'border-blue-500 bg-blue-500/15 shadow-md scale-[1.01]' 
                    : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold">۱</div>
                  <span className="text-xs font-bold text-blue-700 dark:text-sky-300 flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5" />
                    هدر بالا (Header)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
                  <span className="px-1.5 py-0.5 rounded bg-white/10">منو</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10">عنوان</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10">تنظیمات</span>
                </div>
              </div>

              {/* Main Content Area (Sidebar + Chat Area) */}
              <div className="grid grid-cols-12 gap-2 h-56">
                
                {/* 2. Sidebar Mockup */}
                <div 
                  onClick={() => setSelectedZone('sidebar')}
                  className={`col-span-4 p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedZone === 'sidebar' 
                      ? 'border-purple-500 bg-purple-500/15 shadow-md scale-[1.01]' 
                      : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-3 h-3 rounded-md bg-purple-500 flex items-center justify-center text-[9px] text-white font-bold">۲</div>
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 truncate">
                      <Menu className="w-3 h-3 shrink-0" />
                      سایدبار
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 opacity-70">
                    <div className="h-4 rounded bg-purple-500/20 text-[9px] flex items-center justify-center font-bold">چت جدید +</div>
                    <div className="h-3 rounded bg-purple-500/10"></div>
                    <div className="h-3 rounded bg-purple-500/10"></div>
                    <div className="h-3 rounded bg-purple-500/10"></div>
                  </div>
                  <div className="h-3 rounded bg-purple-500/20 text-[8px] flex items-center justify-center text-center">
                    تاریخچه چت‌ها
                  </div>
                </div>

                {/* 3. Chat Area Mockup */}
                <div 
                  onClick={() => setSelectedZone('chatbox')}
                  className={`col-span-8 p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedZone === 'chatbox' 
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-md scale-[1.01]' 
                      : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-md bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold">۳</div>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        محیط پیام‌ها (ChatBox)
                      </span>
                    </div>
                  </div>
                  
                  {/* User Message Mini Mock */}
                  <div className="flex justify-start">
                    <div className="px-2 py-1 rounded-lg bg-blue-600/20 text-[9px] text-inherit max-w-[80%]">
                      پیام کاربر (User Bubble)
                    </div>
                  </div>

                  {/* AI Message Mini Mock */}
                  <div className="flex justify-end">
                    <div className="px-2 py-1 rounded-lg bg-emerald-500/20 text-[9px] text-inherit max-w-[85%] border border-emerald-500/30">
                      پاسخ هوش مصنوعی (AI Bubble) + دکمه‌ها
                    </div>
                  </div>

                  {/* Markdown badge inside */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone('markdown');
                    }}
                    className="p-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[9px] text-rose-700 dark:text-rose-300 flex items-center justify-between font-bold"
                  >
                    <span>۵. بلاک‌های کد، جداول و متون (Markdown)</span>
                    <Code className="w-3 h-3" />
                  </div>
                </div>

              </div>

              {/* 4. Message Input Mockup */}
              <div 
                onClick={() => setSelectedZone('input')}
                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedZone === 'input' 
                    ? 'border-amber-500 bg-amber-500/15 shadow-md scale-[1.01]' 
                    : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-amber-500 flex items-center justify-center text-[9px] text-white font-bold">۴</div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    کادر ورود متن و ارسال (MessageInput)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 flex items-center gap-1">
                    <Mic className="w-2.5 h-2.5" /> صدا
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 flex items-center gap-1">
                    <ImageIcon className="w-2.5 h-2.5" /> عکس
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/30 font-bold text-amber-800 dark:text-amber-200">
                    ارسال
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Filter Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1">
              {Object.values(zones).map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSelectedZone(z.id)}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center truncate ${
                    selectedZone === z.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'clay-btn border-subtle text-inherit hover:opacity-90'
                  }`}
                >
                  {z.codeName}
                </button>
              ))}
            </div>

          </div>

          {/* Right Column (Detailed Breakdown of Selected Component) - 5 cols */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-white/5 dark:bg-black/15 p-4 rounded-2xl border border-subtle">
            
            {/* Header of details */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-sky-300">
                  {currentZone.category}
                </span>
                <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-sky-400">
                  &lt;{currentZone.codeName} /&gt;
                </span>
              </div>
              <h4 className="font-extrabold text-base text-inherit mt-1">
                {currentZone.name}
              </h4>
              <p className="text-xs opacity-80 leading-relaxed">
                {currentZone.description}
              </p>
            </div>

            {/* Sub-elements list */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-inherit opacity-90 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                اجزای تشکیل‌دهنده این بخش:
              </span>
              <ul className="space-y-1.5 pr-2">
                {currentZone.subElements.map((item, idx) => (
                  <li key={idx} className="text-xs opacity-85 flex items-start gap-1.5 leading-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How to request changes */}
            <div className="mt-auto p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1">
              <span className="text-[11px] font-bold text-blue-700 dark:text-sky-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                نحوه سفارش تغییرات:
              </span>
              <p className="text-[11px] opacity-85 leading-relaxed text-inherit">
                {currentZone.tips}
              </p>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-subtle flex items-center justify-between bg-white/5 dark:bg-black/20 text-xs">
          <span className="opacity-75 text-[11px]">
            همچنین می‌توانید از هر بخش اسکرین‌شات بگیرید یا نام آن را در چت تایپ کنید.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white/80 font-bold transition-colors"
          >
            متوجه شدم
          </button>
        </div>

      </div>
    </div>
  );
};
