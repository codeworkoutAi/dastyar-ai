import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Sparkles, MessageSquare, Globe, Image as ImageIcon, Zap, ArrowLeft, ShieldCheck, Gift, Coins, CheckCircle2 } from 'lucide-react';

export const GuestLanding: React.FC = () => {
 const setAuthModalOpen = useAuthStore(state => state.setAuthModalOpen);

 const topModels = [
 { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', role: 'استاد استدلال، کدنویسی و تحلیل عمیق', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-500' },
 { name: 'GPT-4o', provider: 'OpenAI', role: 'پاسخ‌های خلاقانه، همه‌کاره و فوق‌سریع', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-500' },
 { name: 'Gemini 2.0 Flash', provider: 'Google', role: 'دید چندوجهی، تحلیل فایل و جستجوی آنی', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-500' },
 ];

 const features = [
 {
 icon: <Coins className="w-5 h-5 text-amber-500" />,
 title: 'پرداخت دقیقاً به اندازه مصرف (Pay-As-You-Go)',
 description: 'دیگر نیازی به خرید اشتراک‌های دلاری گران‌قیمت ماهانه ندارید. حساب خود را به تومان شارژ کنید و فقط به اندازه توکن مصرفی هر چت هزینه بپردازید.'
 },
 {
 icon: <Gift className="w-5 h-5 text-emerald-500" />,
 title: 'اعتبار هدیه برای شروع',
 description: 'بلافاصله پس از ثبت‌نام اولیه، اعتبار هدیه رایگان دریافت کنید تا کیفیت و سرعت شگفت‌انگیز مدل‌ها را خودتان بسنجید.'
 },
 {
 icon: <Globe className="w-5 h-5 text-blue-500" />,
 title: 'جستجوی زنده در وب فارسی و جهانی',
 description: 'اتصال مستقیم به منابع اینترنت برای دریافت دقیق‌ترین و به‌روزترین رویدادها، مقالات و اخبار دنیا در کسری از ثانیه.'
 },
 {
 icon: <ImageIcon className="w-5 h-5 text-purple-500" />,
 title: 'استودیوی خلق تصویر و تحلیل فایل',
 description: 'تولید تصاویر هنری با موتورهای هوشمند و امکان آپلود و گفتگو پیرامون اسناد، کدهای برنامه‌نویسی و تصاویر.'
 }
 ];

 return (
 <div className="flex flex-col items-center justify-center min-h-full w-full clay-app-bg relative overflow-hidden px-4 py-8">
 {/* Background Decorative Elements */}
 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
 <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 dark:bg-blue-600/20 blur-[130px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
 <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/10 dark:bg-purple-600/20 blur-[130px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
 <div className="absolute top-[35%] left-[30%] w-[35%] h-[35%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[110px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
 </div>

 <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center mt-8 md:mt-12">
 {/* Top Badges */}
 <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 animate-slideDown">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300/60 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
 <Sparkles className="w-4 h-4 text-emerald-500" />
 <span>دسترسی مستقیم و پرسرعت به برترین هوش‌های مصنوعی جهان</span>
 </div>

 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
 <ShieldCheck className="w-4 h-4" />
 <span>پرداخت ریالی عضو شتاب • بدون نیاز به ویزاکارت</span>
 </div>
 </div>

 {/* Hero Title */}
 <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-4 drop-shadow-sm leading-tight">
 دسترسی مستقیم به برترین <br className="hidden sm:block" />
 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 dark:from-blue-400 dark:via-purple-400 dark:to-emerald-400">
 هوش‌های مصنوعی جهان
 </span>
 </h1>

 <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium leading-relaxed mb-8">
 بدون نیاز به خرید اکانت‌های دلاری گران‌قیمت یا فیلترشکن، با بهترین مدل‌های جهان گفتگو کنید و هزینه را دقیقاً به اندازه توکن مصرفی به تومان بپردازید.
 </p>

 {/* CTA Button */}
 <div className="mb-12 animate-slideUp flex flex-col items-center">
 <button
 onClick={() => setAuthModalOpen(true)}
 className="group relative inline-flex items-center gap-3 clay-btn-primary-thick px-8 py-4 text-base sm:text-lg cursor-pointer overflow-hidden clay-icon"
 >
 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <Sparkles className="w-5 h-5 text-amber-400 dark:text-amber-500" />
 <span className="relative">ورود و دریافت هدیه خوش‌آمدگویی</span>
 <ArrowLeft className="w-5 h-5 relative group-hover:-translate-x-1 transition-transform" />
 </button>
 <div className="mt-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 <span>ثبت‌نام سریع با شماره موبایل یا گوگل در کمتر از ۳۰ ثانیه</span>
 </div>
 </div>

 {/* Top Models Showcase Carousel / Cards */}
 <div className="w-full mb-12">
 <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
 <span className="w-8 h-[1px] bg-zinc-300 dark:bg-zinc-700"></span>
 <span>مجهز به جدیدترین مدل‌های روز دنیا</span>
 <span className="w-8 h-[1px] bg-zinc-300 dark:bg-zinc-700"></span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {topModels.map((m, idx) => (
 <div
 key={idx}
 className={`p-4 clay-card border backdrop-blur-xl text-right flex flex-col justify-between`}
 >
 <div>
 <span className="type-badge font-bold opacity-75 uppercase">{m.provider}</span>
 <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{m.name}</h4>
 </div>
 <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 font-medium leading-relaxed">
 {m.role}
 </p>
 </div>
 ))}
 </div>
 </div>

 {/* Features Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 w-full animate-slideUp" style={{ animationDelay: '0.2s' }}>
 {features.map((feature, idx) => (
 <div key={idx} className="flex items-start gap-4 p-5 clay-card text-right transition-all"
 >
 <div className="flex-shrink-0 w-11 h-11 rounded-2xl clay-surface flex items-center justify-center shadow-inner clay-icon">
 {feature.icon}
 </div>
 <div className="flex-1">
 <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">{feature.title}</h3>
 <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
 {feature.description}
 </p>
 </div>
 </div>
 ))}
 </div>

 </div>
 </div>
 );
};
