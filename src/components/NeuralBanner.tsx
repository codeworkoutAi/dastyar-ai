import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PATHS = [
 'M 40 100 Q 120 100 200 40 L 380 40', // Row 0 -> Claude 3.5
 'M 40 100 L 200 100 L 380 100', // Row 1 -> DeepSeek
 'M 40 100 Q 120 100 200 160 L 380 160', // Row 2 -> GPT-4o Vision
];

export const NeuralBanner: React.FC = () => {
 const [activeRow, setActiveRow] = useState<number>(2);

 // Auto-switch between the 3 routing states every 3.5 seconds
 useEffect(() => {
 const timer = setInterval(() => {
 setActiveRow((prev) => (prev + 1) % 3);
 }, 3500);
 return () => clearInterval(timer);
 }, []);

 return (
 <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 rounded-3xl dark: mb-12 border border-zinc-200/80 dark:border-emerald-900/30 group font-sans transition-colors">
 
 {/* CSS Keyframes scoped to standard class names */}
 <style>{`
 @keyframes banner-source-breathe {
 0% { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); transform: scale(1); }
 100% { filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8)); transform: scale(1.05); }
 }
 @keyframes banner-target-breathe {
 0% { transform: scale(1.05); filter: drop-shadow(0 0 8px rgba(192, 132, 252, 0.4)); }
 100% { transform: scale(1.15); filter: drop-shadow(0 0 25px rgba(216, 180, 254, 0.9)); }
 }
 @keyframes banner-model-breathe {
 0% { transform: scale(1.05); filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4)); }
 100% { transform: scale(1.15); filter: drop-shadow(0 0 25px rgba(56, 189, 248, 0.9)); }
 }
 @keyframes bannerPulseFire {
 0% { stroke-dashoffset: 240; opacity: 0; }
 15% { opacity: 1; }
 50% { stroke-dashoffset: 0; opacity: 1; }
 85% { opacity: 1; }
 100% { stroke-dashoffset: -240; opacity: 0; }
 }
 
 .anim-source { animation: banner-source-breathe 2.5s ease-in-out infinite alternate; }
 .anim-target { animation: banner-target-breathe 2.5s ease-in-out infinite alternate; }
 .anim-model { animation: banner-model-breathe 2.5s ease-in-out infinite alternate; }
 
 .pulse-glow {
 stroke: #d8b4fe; stroke-width: 5; fill: none; stroke-linecap: round;
 stroke-dasharray: 120; stroke-dashoffset: 240;
 animation: bannerPulseFire 2.8s infinite ease-out;
 filter: drop-shadow(0 0 8px #c084fc) blur(2px); opacity: 0.8;
 }
 .pulse-core {
 stroke: #ffffff; stroke-width: 1.5; fill: none; stroke-linecap: round;
 stroke-dasharray: 120; stroke-dashoffset: 240;
 animation: bannerPulseFire 2.8s infinite ease-out;
 filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px #d8b4fe);
 }
 .base-path { stroke: rgba(0, 0, 0, 0.08); stroke-width: 2; fill: none; }
 :is(.dark) .base-path { stroke: rgba(255, 255, 255, 0.06); }
 `}</style>

 <div className="flex flex-col items-center justify-center relative z-10 min-h-[350px] p-6 md:p-12">
 
 {/* Top Visual Column (SVG Animation) */}
 <div className="w-full relative min-h-[220px] md:min-h-[260px] flex items-center justify-center mb-6 md:mb-10">
 
 {/* Background Glow */}
 <div className="absolute w-64 h-64 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

 {/* Absolute centering flex container to prevent RTL transform issues */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 {/* Scale container */}
 <div className="scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 pointer-events-auto origin-center">
 
 {/* The exact 500x200 canvas */}
 <div className="relative w-[500px] h-[200px]" dir="ltr">
 
 {/* SVG Layer using robust Tailwind absolute classes */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 500 200">
 <path d="M 40 100 Q 120 100 200 40" className="base-path" /> 
 <path d="M 40 100 L 200 100" className="base-path" /> 
 <path d="M 40 100 Q 120 100 200 160" className="base-path" /> 

 <path d="M 200 40 L 380 40" className="base-path" />
 <path d="M 200 100 L 380 100" className="base-path" />
 <path d="M 200 160 L 380 160" className="base-path" />

 {/* Active Pulse (Switches dynamically with activeRow) */}
 <path key={`glow-${activeRow}`} d={PATHS[activeRow]} className="pulse-glow" />
 <path key={`core-${activeRow}`} d={PATHS[activeRow]} className="pulse-core" />
 </svg>

 {/* Source Node (Exact Original Lightbulb Icon) */}
 <div 
 className="absolute w-12 h-12 p-2.5 rounded-full flex items-center justify-center z-10 bg-emerald-500/15 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border border-emerald-400/40 dark:border-emerald-700 shadow-[inset_0_0_15px_rgba(52,211,153,0.2)] anim-source" 
 style={{ left: 16, top: 76 }}
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
 </div>

 {/* Modality Node 1 (Row 0, top 16 - Text Icon / متنی) */}
 <div 
 className={`absolute w-12 h-12 p-3 rounded-full flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 0
 ? 'bg-purple-50 dark:bg-zinc-950 text-purple-600 dark:text-purple-300 border-purple-400/70 dark:border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.3)] dark:shadow-[inset_0_0_15px_rgba(192,132,252,0.3)] anim-target'
 : 'clay-surface text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
 }`}
 style={{ left: 176, top: 16 }}
 title="متن و محتوا"
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
 </svg>
 </div>

 {/* Modality Node 2 (Row 1, top 76 - Code Icon / کد) */}
 <div 
 className={`absolute w-12 h-12 p-3 rounded-full flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 1
 ? 'bg-purple-50 dark:bg-zinc-950 text-purple-600 dark:text-purple-300 border-purple-400/70 dark:border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.3)] dark:shadow-[inset_0_0_15px_rgba(192,132,252,0.3)] anim-target'
 : 'clay-surface text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
 }`}
 style={{ left: 176, top: 76 }}
 title="کدنویسی و توسعه"
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3m8-6l4 3-4 3m-5-8l-2 10" />
 </svg>
 </div>

 {/* Modality Node 3 (Row 2, top 136 - Image Icon / تصویری) */}
 <div 
 className={`absolute w-12 h-12 p-3 rounded-full flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 2
 ? 'bg-purple-50 dark:bg-zinc-950 text-purple-600 dark:text-purple-300 border-purple-400/70 dark:border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.3)] dark:shadow-[inset_0_0_15px_rgba(192,132,252,0.3)] anim-target'
 : 'clay-surface text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
 }`}
 style={{ left: 176, top: 136 }}
 title="تحلیل تصویر و بینایی"
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
 <rect x="3" y="3" width="18" height="18" rx="2.5" />
 <circle cx="8.5" cy="8.5" r="1.5" />
 <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
 </svg>
 </div>

 {/* Model Node 1 (Row 0, top 16 - DeepSeek / متن) */}
 <div 
 className={`absolute w-12 h-12 p-3 rounded-full flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 0
 ? 'bg-sky-50 dark:bg-slate-950 text-sky-600 dark:text-sky-400 border-sky-400/70 dark:border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.3)] dark:shadow-[inset_0_0_15px_rgba(56,189,248,0.2)] anim-model'
 : 'clay-surface text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
 }`}
 style={{ left: 356, top: 16 }}
 >
 <span className="font-bold text-[11px]">DS</span>
 <div 
 className={`absolute whitespace-nowrap text-xs font-['Vazirmatn'] transition-all duration-300 ${
 activeRow === 0
 ? 'font-bold text-sky-600 dark:text-sky-400 drop-shadow-sm'
 : 'font-normal text-zinc-500 dark:text-zinc-600'
 }`} 
 style={{ left: 60 }}
 >
 DeepSeek
 </div>
 </div>

 {/* Model Node 2 (Row 1, top 76 - Claude 3.5 / کد) */}
 <div 
 className={`absolute w-12 h-12 p-3 rounded-full flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 1
 ? 'bg-sky-50 dark:bg-slate-950 text-sky-600 dark:text-sky-400 border-sky-400/70 dark:border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.3)] dark:shadow-[inset_0_0_15px_rgba(56,189,248,0.2)] anim-model'
 : 'clay-surface text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
 }`}
 style={{ left: 356, top: 76 }}
 >
 <span className="font-bold text-sm">C</span>
 <div 
 className={`absolute whitespace-nowrap text-xs font-['Vazirmatn'] transition-all duration-300 ${
 activeRow === 1
 ? 'font-bold text-sky-600 dark:text-sky-400 drop-shadow-sm'
 : 'font-normal text-zinc-500 dark:text-zinc-600'
 }`} 
 style={{ left: 60 }}
 >
 Claude 3.5
 </div>
 </div>

 {/* Model Node 3 (Row 2, top 136 - Exact Original Icon) */}
 <div 
 className={`absolute w-12 h-12 p-3 rounded-full flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 2
 ? 'bg-sky-50 dark:bg-slate-950 text-sky-600 dark:text-sky-400 border-sky-400/70 dark:border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.3)] dark:shadow-[inset_0_0_15px_rgba(56,189,248,0.2)] anim-model'
 : 'clay-surface text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
 }`}
 style={{ left: 356, top: 136 }}
 >
 <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2057 5.9847 5.9847 0 0 0 3.998-2.9001 6.0557 6.0557 0 0 0-.7478-7.0731z"/></svg>
 <div 
 className={`absolute whitespace-nowrap text-xs font-['Vazirmatn'] transition-all duration-300 ${
 activeRow === 2
 ? 'font-bold text-sky-600 dark:text-sky-400 drop-shadow-sm'
 : 'font-normal text-zinc-500 dark:text-zinc-600'
 }`} 
 style={{ left: 60 }}
 >
 GPT-4o Vision
 </div>
 </div>

 </div>
 </div>
 </div>
 </div>

 {/* Bottom Content Column (Text & CTA) */}
 <div className="w-full max-w-3xl flex flex-col items-center justify-center text-center z-20">
 <div className="flex items-center gap-2 mb-4 justify-center">
 <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center">
 <Sparkles className="text-emerald-600 dark:text-emerald-400" size={20} />
 </div>
 <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">مسیریابی هوشمند چت‌باکس</span>
 </div>
 
 <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
 قدرتِ انتخابِ هوشمند؛ <br className="hidden md:block" /> محدود به یک مدل نباشید!
 </h2>
 
 <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
 چت‌باکسِ ما فراتر از یک چتِ ساده است. ما مجهز به یک موتور مسیریابِ هوشمند (Smart Router) هستیم که در کسری از ثانیه، بهترین هوش مصنوعی را برای حل چالشِ شما انتخاب و فعال می‌کند. تجربه‌ای یکپارچه از کدهای بی‌نقص تا تحلیل‌های عمیق.
 </p>
 
 <div className="flex justify-center">
 <Link 
 to="/" 
 className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 shadow-[0_4px_14px_rgba(5,150,105,0.35)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.5)] hover:-translate-y-0.5"
 >
 کشف قدرتِ چت‌باکس
 <ArrowLeft size={18} />
 </Link>
 </div>
 </div>

 </div>
 </div>
 );
};
