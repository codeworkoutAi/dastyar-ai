import {
 BrainOutlineIcon,
 ChatRoundDotsOutlineIcon,
 CloseOutlineIcon,
 Code2OutlineIcon,
 CompassOutlineIcon,
 DocumentTextOutlineIcon,
 EyeOutlineIcon,
 GalleryOutlineIcon,
 LightbulbOutlineIcon,
 PenOutlineIcon,
 StarsOutlineIcon
} from '@solar-icons/react';
import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';

interface PromptCategory {
 id: string;
 title: string;
 icon: React.ReactNode;
 prompts: {
 title: string;
 description: string;
 prompt: string;
 tag: string;
 }[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
 {
 id: 'coding',
 title: 'برنامه‌نویسی و مهندسی نرم‌افزار',
 icon: <Code2OutlineIcon className="w-5 h-5 text-cyan-400" />,
 prompts: [
 {
 title: 'طراحی معماری میکروسرویس',
 description: 'طراحی ساختار سیستم مقیاس‌پذیر با کشینگ چندلایه و مدیریت پیام‌ها.',
 prompt: 'یک سیستم توزیع‌شده با ترافیک بالا در نظر بگیر. ساختار معماری، نحوه کشینگ داده‌ها با Redis و مدیریت رویدادها را با Go یا Node.js تحلیل و پیاده‌سازی کن.',
 tag: 'معماری و بک‌اند',
 },
 {
 title: 'دیباگ و ریفکتور کد',
 description: 'بررسی باگ‌ها، رفتارهای همزمان (Race Conditions) و بهینه‌سازی سرعت.',
 prompt: 'این قطعه کد را خط به خط بررسی کن، نقاط ضعف امنیتی و باگ‌های احتمالی آن را پیدا کن و نسخه بهینه‌سازی‌شده را بنویس:',
 tag: 'دیباگ و بهینه‌سازی',
 },
 {
 title: 'طراحی رابط کاربری React & Tailwind',
 description: 'کامپوننت مدرن، تعاملی، واکنش‌گرا و سازگار با زبان فارسی (RTL).',
 prompt: 'یک کامپوننت مدرن در React با Tailwind CSS بساز که دارای انیمیشن ملایم، پشتیبانی کامل از دارک‌مود و راست‌چین (RTL) باشد.',
 tag: 'فرانت‌اند',
 },
 ],
 },
 {
 id: 'persian-writing',
 title: 'نگارش، ویرایش و ادبیات فارسی',
 icon: <PenOutlineIcon className="w-5 h-5 text-purple-400" />,
 prompts: [
 {
 title: 'نگارش نامه رسمی و سازمانی',
 description: 'متن محترمانه، شیوا و استاندارد برای مکاتبات تجاری و اداری.',
 prompt: 'یک نامه رسمی و محترمانه برای درخواست همکاری مشترک تجاری بنویس که لحن حرفه‌ای و اثرگذار داشته باشد.',
 tag: 'مکاتبات اداری',
 },
 {
 title: 'تولید محتوای جذاب و بلاگ‌پست',
 description: 'مقاله‌ای سئومحور، روان و جذاب برای جذب مخاطب در شبکه‌های اجتماعی.',
 prompt: 'یک مقاله جذاب و علمی درباره آینده هوش مصنوعی و تاثیر آن بر بهره‌وری شغلی به زبان فارسی سلیس بنویس.',
 tag: 'تولید محتوا',
 },
 {
 title: 'ویرایش ساختاری و اصلاح نیم‌فاصله',
 description: 'اصلاح غلط‌های املایی، نگارشی و ساختاری متن با رعایت دقیق دستور زبان فارسی.',
 prompt: 'متن زیر را از نظر ویرایشی، استفاده درست از نیم‌فاصله‌ها و روانی لحن بازنویسی و تصحیح کن:',
 tag: 'ویراستاری',
 },
 ],
 },
 {
 id: 'analysis',
 title: 'خلاصه‌سازی، تحلیل داده و استدلال',
 icon: <DocumentTextOutlineIcon className="w-5 h-5 text-amber-400" />,
 prompts: [
 {
 title: 'استخراج نکات کلیدی و نقشه ذهنی',
 description: 'تبدیل متن‌های طولانی به خلاصه ساختاریافته و دسته‌بندی‌شده.',
 prompt: 'متن زیر را به ۵ نکته کلیدی اصلی خلاصه کن و یک نتیجه‌گیری کاربردی ارائه بده:',
 tag: 'خلاصه‌سازی',
 },
 {
 title: 'تحلیل SWOT و فرصت‌های کسب‌وکار',
 description: 'بررسی نقاط قوت، ضعف، فرصت‌ها و تهدیدهای یک ایده استارتاپی.',
 prompt: 'یک تحلیل جامع SWOT برای یک سرویس آنلاین هوش مصنوعی در بازار ایران ارائه بده.',
 tag: 'استراتژی و بیزینس',
 },
 ],
 },
 {
 id: 'brainstorming',
 title: 'ایده‌پردازی و حل خلاقانه مسئله',
 icon: <LightbulbOutlineIcon className="w-5 h-5 text-emerald-400" />,
 prompts: [
 {
 title: 'ایده‌های خلاقانه برای محصول',
 description: '۱۰ ایده نوآورانه همراه با مزیت رقابتی و بررسی چالش‌ها.',
 prompt: '۱۰ ایده نوآورانه و خلاقانه برای بهبود تجربه کاربری در اپلیکیشن‌های گفتگو با هوش مصنوعی پیشنهاد بده.',
 tag: 'نوآوری',
 },
 ],
 },
];

const EXPLORE_IMAGE_PREVIEWS = [
 {
 id: 'realism',
 title: 'پرتره فوق‌واقع‌گرایانه (8K Realism)',
 engine: 'flux',
 icon: '📸',
 desc: 'عکس ماکرو و فوق‌واقع‌گرایانه از چشم یک گربه جنگلی که انعکاس یک کهکشان پر از ستاره در مردمک آن پیداست. نورپردازی دراماتیک، بافت بی‌نظیر، وضوح 8k.',
 category: 'عکاسی ماکرو',
 },
 {
 id: 'anime',
 title: 'انیمه سینمایی (Anime Aesthetics)',
 engine: 'flux-anime',
 icon: '🌸',
 desc: 'یک شاهکار انیمه‌ای به سبک ماکوتو شینکای. دختری با شمشیر شیشه‌ای روی سقف یک قطار شناور در آسمان. قطره‌های باران و پرتوهای نور خورشید.',
 category: 'سبک انیمه',
 },
 {
 id: '3d',
 title: 'رندر سه‌بعدی کیوت (3D Pixar Style)',
 engine: 'flux-3d',
 icon: '🧸',
 desc: 'رندر سه‌بعدی شاهکار به سبک پیکسار. یک اژدهای کوچک و بسیار بامزه که با خوشحالی در حال خوردن یک پیتزای بزرگ است. نورپردازی استودیو.',
 category: 'رندر سه‌بعدی',
 },
];

export const ExploreHub: React.FC = () => {
 const { isExploreOpen, setIsExploreOpen, setIsImageStudioOpen, setImageStudioInitial } = useUIStore();
 const { settings, updateSettings } = useSettingsStore();
 const { createChat, sendMessage } = useChatStore();

 const [activeTab, setActiveTab] = useState<'prompts' | 'images'>('prompts');
 const [selectedCategory, setSelectedCategory] = useState<string>('coding');

 if (!isExploreOpen) return null;

 
 const handleUsePrompt = (promptText: string) => {
 setIsExploreOpen(false);
 createChat();
 setTimeout(() => {
 sendMessage(promptText);
 }, 100);
 };

 const handleOpenStudioWithPrompt = (prompt: string, engine: string) => {
 setIsExploreOpen(false);
 setImageStudioInitial({ prompt, engine });
 setIsImageStudioOpen(true);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
 <div className="relative w-full clay-card max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans">
 {/* Top Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)] clay-surface/60">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
 <CompassOutlineIcon className="w-6 h-6" />
 </div>
 <div>
 <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
 مرکز کاوش و مدل‌ها
 <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
 Explore Hub
 </span>
 </h2>
 <p className="text-xs text-zinc-700 dark:text-zinc-400 mt-0.5">
 بانک پرامپت‌های تخصصی و استودیو ایده‌های تصویرسازی
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setIsExploreOpen(false)}
 className="p-2 rounded-xl text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 clay-icon-btn/80 transition-colors cursor-pointer"
 aria-label="Close Explore Hub"
 >
 <CloseOutlineIcon className="w-5 h-5" />
 </button>
 </div>

 {/* Tab Navigation */}
 <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--card-border)]/60 clay-surface/30">
 

 <button
 type="button"
 onClick={() => setActiveTab('prompts')}
 className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
 activeTab === 'prompts'
 ? 'clay-btn-primary text-white'
 : 'clay-btn border border-[var(--card-border)] text-[var(--text-main)]'
 }`}
 >
 <LightbulbOutlineIcon className="w-4 h-4" />
 بانک پرامپت و ایده‌ها
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('images')}
 className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
 activeTab === 'images'
 ? 'clay-btn-primary text-white'
 : 'clay-btn border border-[var(--card-border)] text-[var(--text-main)]'
 }`}
 >
 <GalleryOutlineIcon className="w-4 h-4" />
 جادوی تصویرسازی
 </button>
 </div>

 {/* Scrollable Content Body */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">

 {/* TAB 2: PROMPT LIBRARY */}
 {activeTab === 'prompts' && (
 <div className="space-y-6">
 {/* Category Filter Chips */}
 <div className="flex flex-wrap items-center gap-2">
 {PROMPT_CATEGORIES.map((cat) => (
 <button
 key={cat.id}
 type="button"
 onClick={() => setSelectedCategory(cat.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${
 selectedCategory === cat.id
 ? 'clay-btn-primary border-purple-500/50 text-white shadow-sm'
 : 'clay-btn border border-[var(--card-border)] text-[var(--text-main)]'
 }`}
 >
 <span className="chat-emoji">{cat.icon}</span>
 {cat.title}
 </button>
 ))}
 </div>

 {/* Prompts Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {PROMPT_CATEGORIES.find((c) => c.id === selectedCategory)?.prompts.map((p, idx) => (
 <div
 key={idx}
 className="p-5 rounded-2xl clay-card border border-[var(--card-border)] hover:border-purple-500/40 transition-all flex flex-col justify-between group"
 >
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-purple-400 transition-colors">
 {p.title}
 </span>
 <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100/80 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">
 {p.tag}
 </span>
 </div>
 <p className="text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed mb-4">
 {p.description}
 </p>
 </div>

 <button
 type="button"
 onClick={() => handleUsePrompt(p.prompt)}
 className="w-full py-2 px-3 rounded-xl bg-purple-600/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
 >
 <ChatRoundDotsOutlineIcon className="w-4 h-4" />
 شروع گفتگو با این پرامپت
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* TAB 3: IMAGE PROMPTS */}
 {activeTab === 'images' && (
 <div className="space-y-4">
 <p className="text-xs text-zinc-700 dark:text-zinc-400">
 با کلیک روی هر ایده، پرامپت مستقیماً وارد استودیو هوشمند تصویرسازی می‌شود:
 </p>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {EXPLORE_IMAGE_PREVIEWS.map((item) => (
 <div
 key={item.id}
 className="group relative p-5 rounded-3xl text-right flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-[var(--card-border)] clay-card hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-purple-500/40"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors pointer-events-none" />

 <div className="relative z-10 mb-4">
 <div className="flex items-center gap-3 mb-3">
 <span className="text-3xl chat-emoji">{item.icon}</span>
 <div>
 <span className="text-[10px] text-purple-400 font-bold">{item.category}</span>
 <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.title}</h4>
 </div>
 </div>
 <p className="text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed line-clamp-3">
 {item.desc}
 </p>
 </div>

 <button
 type="button"
 onClick={() => handleOpenStudioWithPrompt(item.desc, item.engine)}
 className="w-full py-2.5 px-3 rounded-xl clay-btn-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer relative z-10"
 >
 <GalleryOutlineIcon className="w-4 h-4" />
 ساخت تصویر در استودیو
 </button>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
