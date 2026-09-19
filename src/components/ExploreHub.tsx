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
import { getModelIntro } from './ChatBox';
import { getModelDetails } from './CustomProviderCards';

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

 const [activeTab, setActiveTab] = useState<'models' | 'prompts' | 'images'>('models');
 const [selectedCategory, setSelectedCategory] = useState<string>('coding');

 if (!isExploreOpen) return null;

 // Active Model and Info
 const activeProvider = settings.providers.activeProvider;
 let currentActiveProfileId = settings.providers.custom.activeProfileId;
 if (settings.tools.smartRouting) {
 currentActiveProfileId = settings.tools.routingRoles?.default || currentActiveProfileId;
 }

 const activeCustomProfile = settings.providers.custom.profiles?.find(
 (p) => p.id === currentActiveProfileId
 );
 const activeModelId =
 activeProvider === 'custom'
 ? activeCustomProfile?.modelName || 'gpt-4o-mini'
 : settings.providers[activeProvider]?.modelName || activeProvider;
 const activeProfileName =
 activeProvider === 'custom'
 ? activeCustomProfile?.name || 'پروفایل سفارشی'
 : activeProvider;

 const currentDetails = getModelDetails({ id: activeModelId, name: activeProfileName });
 const currentIntro = getModelIntro(activeModelId, currentDetails);

 // Switch active profile
 const handleSelectProfile = (profileId: string) => {
 updateSettings((s) => ({
 ...s,
 tools: {
 ...s.tools,
 smartRouting: false, // Turn off smart routing to honor explicit model selection
 },
 providers: {
 ...s.providers,
 activeProvider: 'custom',
 custom: {
 ...s.providers.custom,
 activeProfileId: profileId,
 },
 },
 }));
 };

 const handleSelectFreeModel = (modelId: string, providerId: 'gemini' | 'custom', title: string, baseUrl?: string) => {
 updateSettings((s) => {
 const newSettings = { ...s };
 newSettings.tools.smartRouting = false;

 if (providerId === 'gemini') {
 newSettings.providers.activeProvider = 'gemini';
 if (!newSettings.providers.gemini) newSettings.providers.gemini = { apiKey: '', modelName: modelId };
 newSettings.providers.gemini.modelName = modelId;
 // Don't overwrite apiKey if they have one, just in case, but usually this is for users without one
 } else {
 newSettings.providers.activeProvider = 'custom';
 const profileId = `free_${modelId}`;
 const existingProfileIndex = newSettings.providers.custom.profiles.findIndex(p => p.id === profileId);
 const profile = {
 id: profileId,
 name: title,
 modelName: modelId,
 baseUrl: baseUrl || 'https://api.groq.com/openai/v1',
 apiKey: '', // Backend will inject
 customHeaders: ''
 };

 if (existingProfileIndex >= 0) {
 newSettings.providers.custom.profiles[existingProfileIndex] = profile;
 } else {
 newSettings.providers.custom.profiles.push(profile);
 }
 newSettings.providers.custom.activeProfileId = profileId;
 }
 return newSettings;
 });
 };

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
 <div className="relative w-full clay-card  max-w-4xl max-h-[90vh] flex flex-col rounded-3xl clay-surface  overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans">
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
 تخصص‌های مدل‌ها، ایده‌های هوشمند، بانک پرامپت و استودیو تصویرسازی
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
 onClick={() => setActiveTab('models')}
 className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
 activeTab === 'models'
 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
 : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 clay-icon-btn/50'
 }`}
 >
 <BrainOutlineIcon className="w-4 h-4" />
 مدل‌ها و هوش فعال
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('prompts')}
 className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
 activeTab === 'prompts'
 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
 : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 clay-icon-btn/50'
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
 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
 : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 clay-icon-btn/50'
 }`}
 >
 <GalleryOutlineIcon className="w-4 h-4" />
 جادوی تصویرسازی
 </button>
 </div>

 {/* Scrollable Content Body */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {/* TAB 1: MODELS & ACTIVE CAPABILITIES */}
 {activeTab === 'models' && (
 <div className="space-y-6">
 {/* Active Model Spotlight */}
 <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:via-zinc-900/80 dark:to-zinc-900/90 border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

 <div className="relative z-10">
 <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4 text-center sm:text-right">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
 {currentDetails.isCoding ? (
 <Code2OutlineIcon className="w-7 h-7" />
 ) : currentDetails.isReasoning ? (
 <BrainOutlineIcon className="w-7 h-7" />
 ) : currentDetails.isVision ? (
 <EyeOutlineIcon className="w-7 h-7" />
 ) : (
 <StarsOutlineIcon className="w-7 h-7" />
 )}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
 <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
 مدل جاری
 </span>
 <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
 {currentIntro.title}
 </h3>
 <span className="text-[11px] font-mono px-2 py-0.5 rounded-full clay-input  text-zinc-700 dark:text-zinc-300">
 {currentDetails.providerLabel}
 </span>
 {currentDetails.isFree && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
 🎁 رایگان
 </span>
 )}
 </div>

 <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans">
 {currentIntro.bio}
 </p>
 </div>
 </div>

 {/* Specialty Tags */}
 <div className="flex flex-wrap items-center gap-2 pt-3.5 border-t border-[var(--card-border)] mt-4">
 <span className="text-[11px] text-zinc-700 dark:text-zinc-400 font-medium ml-1">تخصص‌های مدل:</span>
 {currentDetails.tags.map((tag, idx) => (
 <span
 key={idx}
 className={`text-[11px] px-2.5 py-1 rounded-xl font-medium flex items-center gap-1.5 ${
 tag.type === 'coding'
 ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
 : tag.type === 'vision'
 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
 : tag.type === 'reasoning'
 ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
 : tag.type === 'fast'
 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
 : 'clay-surface text-zinc-700 dark:text-zinc-300 border border-zinc-300 '
 }`}
 >
 {tag.label}
 </span>
 ))}
 {currentDetails.contextFormatted && (
 <span className="text-[11px] px-2.5 py-1 rounded-xl clay-surface text-zinc-700 dark:text-zinc-300 border border-zinc-300  font-mono">
 حافظه: {currentDetails.contextFormatted}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Free Default Models */}
 <div>
 <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-3 px-1 flex items-center gap-1.5"><StarsOutlineIcon className="w-4 h-4 text-emerald-500" /> مدل‌های عمومی و رایگان (بدون نیاز به کلید):</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
 {[
 { id: 'gemini-3.1-flash-lite', provider: 'custom', name: 'Gemini 3.1 Flash Lite', tag: 'عمومی و سریع', baseUrl: 'https://generativelanguage.googleapis.com', isVision: true, isReasoning: false, isCoding: false, isFree: true, isFast: true },
 { id: 'openai/gpt-oss-120b', provider: 'custom', name: 'GPT OSS 120B', tag: 'قدرتمند (Groq)', baseUrl: 'https://api.groq.com/openai/v1', isVision: false, isReasoning: false, isCoding: true, isFree: true, isFast: true },
 { id: 'qwen/qwen3.6-27b', provider: 'custom', name: 'Qwen 3.6 27B', tag: 'فوق سریع (Groq)', baseUrl: 'https://api.groq.com/openai/v1', isVision: false, isReasoning: false, isCoding: false, isFree: true, isFast: true }
 ].map((fm) => {
 const isSelected = (fm.provider === 'custom' && activeProvider === 'custom' && activeCustomProfile?.modelName === fm.id);
 return (
 <div
 key={fm.id}
 onClick={() => handleSelectFreeModel(fm.id, fm.provider as any, fm.name, fm.baseUrl)}
 className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
 isSelected
 ? 'clay-modal border-indigo-500 dark:border-indigo-500 shadow-md shadow-indigo-500/10'
 : 'clay-surface/50 hover:clay-surface border-[var(--card-border)] hover:border-zinc-300 '
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{fm.name}</span>
 {isSelected && (
 <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 font-bold">
 فعال
 </span>
 )}
 </div>
 <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">رایگان</span>
 </div>
 <div className="text-[11px] text-zinc-700 dark:text-zinc-400 font-mono truncate mb-3" dir="ltr">
 {fm.id}
 </div>
 <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--card-border)]/60">
 <span className="text-[10px] px-2 py-0.5 rounded-lg clay-surface text-zinc-700 dark:text-zinc-300">{fm.tag}</span>
 {fm.isVision && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-500">بینایی 👀</span>}
 {fm.isCoding && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-500">کدنویسی 💻</span>}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Other Configured Models / Profiles */}
 <div>
 <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-3 px-1">سایر مدل‌ها و پروفایل‌های پیکربندی‌شده:</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {settings.providers.custom.profiles?.map((profile) => {
 const isSelected = profile.id === currentActiveProfileId;
 const pDetails = getModelDetails({ id: profile.modelName, name: profile.name });

 return (
 <div
 key={profile.id}
 onClick={() => handleSelectProfile(profile.id)}
 className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
 isSelected
 ? 'clay-modal border-indigo-500 dark:border-indigo-500 shadow-md shadow-indigo-500/10'
 : 'clay-surface/50 hover:clay-surface border-[var(--card-border)] hover:border-zinc-300 '
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{profile.name}</span>
 {isSelected && (
 <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 font-bold">
 فعال
 </span>
 )}
 </div>
 <span className="text-[11px] text-zinc-700 dark:text-zinc-400 font-mono">{pDetails.providerLabel}</span>
 </div>

 <div className="text-[11px] text-zinc-700 dark:text-zinc-400 font-mono truncate mb-3" dir="ltr">
 {profile.modelName}
 </div>

 <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--card-border)]/60">
 {pDetails.tags.map((t, idx) => (
 <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg clay-surface text-zinc-700 dark:text-zinc-300">
 {t.label}
 </span>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}

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
 ? 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400 shadow-sm'
 : 'bg-white dark:clay-card-thick border-[var(--card-border)] dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:clay-surface dark:hover:bg-zinc-800/50'
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
 className="p-5 rounded-2xl clay-surface/60 border border-[var(--card-border)] hover:border-purple-500/40 hover:clay-surface transition-all flex flex-col justify-between group"
 >
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-purple-400 transition-colors">
 {p.title}
 </span>
 <span className="text-[10px] px-2 py-0.5 rounded-full clay-surface text-zinc-700 dark:text-zinc-400">
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
 className="group relative p-5 rounded-3xl text-right flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-[var(--card-border)] clay-surface/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-purple-500/40"
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
 className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer relative z-10"
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
