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
 <div className="relative w-full overflow-hidden clay-card-thick rounded-3xl mb-12 border border-[var(--card-border)]  group font-sans transition-all shadow-md">
 {/* CSS Keyframes scoped to theme emerald/teal pulse */}
 <style>{`
 @keyframes banner-source-breathe {
 0% { filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.4)); transform: scale(1); }
 100% { filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.8)); transform: scale(1.05); }
 }
 @keyframes banner-target-breathe {
 0% { transform: scale(1.03); filter: drop-shadow(0 0 6px rgba(45, 212, 191, 0.4)); }
 100% { transform: scale(1.12); filter: drop-shadow(0 0 20px rgba(45, 212, 191, 0.9)); }
 }
 @keyframes banner-model-breathe {
 0% { transform: scale(1.03); filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4)); }
 100% { transform: scale(1.12); filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.9)); }
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
 stroke: #2dd4bf; stroke-width: 5; fill: none; stroke-linecap: round;
 stroke-dasharray: 120; stroke-dashoffset: 240;
 animation: bannerPulseFire 2.8s infinite ease-out;
 filter: drop-shadow(0 0 8px #14b8a6) blur(2px); opacity: 0.85;
 }
 .pulse-core {
 stroke: #ffffff; stroke-width: 1.5; fill: none; stroke-linecap: round;
 stroke-dasharray: 120; stroke-dashoffset: 240;
 animation: bannerPulseFire 2.8s infinite ease-out;
 filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px #2dd4bf);
 }
 .base-path { stroke: rgba(0, 0, 0, 0.08); stroke-width: 2; fill: none; }
 :is(.dark) .base-path { stroke: rgba(255, 255, 255, 0.08); }
 `}</style>

 <div className="flex flex-col items-center justify-center relative z-10 min-h-[350px] p-6 md:p-12">
 {/* Top Visual Column (SVG Animation) */}
 <div className="w-full relative min-h-[220px] md:min-h-[260px] flex items-center justify-center mb-6 md:mb-10">
 {/* Background Glow */}
 <div className="absolute w-72 h-72 bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

 {/* Absolute centering flex container */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 {/* Scale container */}
 <div className="scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 pointer-events-auto origin-center">
 {/* The exact 500x200 canvas */}
 <div className="relative w-[500px] h-[200px]" dir="ltr">
 {/* SVG Layer */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 500 200">
 <path d="M 40 100 Q 120 100 200 40" className="base-path" /> <path d="M 40 100 L 200 100" className="base-path" /> <path d="M 40 100 Q 120 100 200 160" className="base-path" /> <path d="M 200 40 L 380 40" className="base-path" />
 <path d="M 200 100 L 380 100" className="base-path" />
 <path d="M 200 160 L 380 160" className="base-path" />

 {/* Active Pulse */}
 <path key={`glow-${activeRow}`} d={PATHS[activeRow]} className="pulse-glow" />
 <path key={`core-${activeRow}`} d={PATHS[activeRow]} className="pulse-core" />
 </svg>

 {/* Source Node (Lightbulb Icon) */}
 <div style={{ left: 16, top: 76, borderRadius: '14px' }}
 className="absolute w-12 h-12 p-2.5 flex items-center justify-center z-10 clay-btn bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 anim-source" >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
 </div>

 {/* Modality Node 1 (Text Icon) */}
 <div style={{ left: 176, top: 16, borderRadius: '14px' }}
 className={`absolute w-12 h-12 p-3 flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 0
 ? 'clay-btn bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-400/80 shadow-[0_0_15px_rgba(45,212,191,0.4)] anim-target'
 : 'clay-btn text-zinc-400 dark:text-zinc-500 border-[var(--card-border)] '
 }`}
 title="متن و محتوا"
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
 </svg>
 </div>

 {/* Modality Node 2 (Code Icon) */}
 <div style={{ left: 176, top: 76, borderRadius: '14px' }}
 className={`absolute w-12 h-12 p-3 flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 1
 ? 'clay-btn bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-400/80 shadow-[0_0_15px_rgba(45,212,191,0.4)] anim-target'
 : 'clay-btn text-zinc-400 dark:text-zinc-500 border-[var(--card-border)] '
 }`}
 title="کدنویسی و توسعه"
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3m8-6l4 3-4 3m-5-8l-2 10" />
 </svg>
 </div>

 {/* Modality Node 3 (Image Icon) */}
 <div style={{ left: 176, top: 136, borderRadius: '14px' }}
 className={`absolute w-12 h-12 p-3 flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 2
 ? 'clay-btn bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-400/80 shadow-[0_0_15px_rgba(45,212,191,0.4)] anim-target'
 : 'clay-btn text-zinc-400 dark:text-zinc-500 border-[var(--card-border)] '
 }`}
 title="تحلیل تصویر و بینایی"
 >
 <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
 <rect x="3" y="3" width="18" height="18" rx="2.5" />
 <circle cx="8.5" cy="8.5" r="1.5" />
 <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
 </svg>
 </div>

 {/* Model Node 1 (DeepSeek) */}
 <div style={{ left: 356, top: 16, borderRadius: '14px' }}
 className={`absolute w-12 h-12 p-3 flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 0
 ? 'clay-btn bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.4)] anim-model'
 : 'clay-btn text-zinc-400 dark:text-zinc-500 border-[var(--card-border)] '
 }`}
 >
 <span className="font-bold text-[11px]">DS</span>
 <div className={`absolute whitespace-nowrap text-xs font-['Vazirmatn'] transition-all duration-300 ${
 activeRow === 0
 ? 'font-bold text-cyan-600 dark:text-cyan-300 drop-shadow-sm'
 : 'font-normal text-zinc-500 dark:text-zinc-600'
 }`} style={{ left: 60 }}
 >
 DeepSeek
 </div>
 </div>

 {/* Model Node 2 (Claude 3.5) */}
 <div style={{ left: 356, top: 76, borderRadius: '14px' }}
 className={`absolute w-12 h-12 p-3 flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 1
 ? 'clay-btn bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.4)] anim-model'
 : 'clay-btn text-zinc-400 dark:text-zinc-500 border-[var(--card-border)] '
 }`}
 >
 <span className="font-bold text-sm">C</span>
 <div className={`absolute whitespace-nowrap text-xs font-['Vazirmatn'] transition-all duration-300 ${
 activeRow === 1
 ? 'font-bold text-cyan-600 dark:text-cyan-300 drop-shadow-sm'
 : 'font-normal text-zinc-500 dark:text-zinc-600'
 }`} style={{ left: 60 }}
 >
 Claude 3.5
 </div>
 </div>

 {/* Model Node 3 (GPT-4o Vision) */}
 <div style={{ left: 356, top: 136, borderRadius: '14px' }}
 className={`absolute w-12 h-12 p-3 flex items-center justify-center z-10 transition-all duration-500 border ${
 activeRow === 2
 ? 'clay-btn bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.4)] anim-model'
 : 'clay-btn text-zinc-400 dark:text-zinc-500 border-[var(--card-border)] '
 }`}
 >
 <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2057 5.9847 5.9847 0 0 0 3.998-2.9001 6.0557 6.0557 0 0 0-.7478-7.0731z"/></svg>
 <div className={`absolute whitespace-nowrap text-xs font-['Vazirmatn'] transition-all duration-300 ${
 activeRow === 2
 ? 'font-bold text-cyan-600 dark:text-cyan-300 drop-shadow-sm'
 : 'font-normal text-zinc-500 dark:text-zinc-600'
 }`} style={{ left: 60 }}
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
 <div style={{ borderRadius: '12px' }} className="clay-btn px-4 py-1.5 border border-emerald-500/30 flex items-center gap-2 mb-4">
 <Sparkles className="text-emerald-600 dark:text-emerald-400" size={16} />
 <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs">مسیریابی هوشمند چت‌باکس</span>
 </div>
 <h2 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 leading-tight clay-news-title">
 قدرتِ انتخابِ هوشمند؛ <br className="hidden md:block" /> محدود به یک مدل نباشید!
 </h2>
 <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
 چت‌باکسِ ما فراتر از یک چتِ ساده است. ما مجهز به یک موتور مسیریابِ هوشمند (Smart Router) هستیم که در کسری از ثانیه، بهترین هوش مصنوعی را برای حل چالشِ شما انتخاب و فعال می‌کند. تجربه‌ای یکپارچه از کدهای بی‌نقص تا تحلیل‌های عمیق.
 </p>
 <div className="flex justify-center">
 <Link to="/" style={{ borderRadius: '14px' }}
 className="inline-flex items-center gap-2.5 clay-btn-primary-thick text-white font-bold py-3.5 px-8 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-0.5 text-sm"
 >
 <span>کشف قدرتِ چت‌باکس</span>
 <ArrowLeft size={18} />
 </Link>
 </div>
 </div>

 </div>
 </div>
 );
};
