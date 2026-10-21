import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Coins, Receipt, TrendingUp, Cpu, Sparkles,
 LayoutDashboard,
 ArrowLeft
} from 'lucide-react';
import { toPersianDigits } from '../lib/persianUtils';

export const UsageAnalyticsSection: React.FC = () => {
 const [period, setPeriod] = useState<'30d' | '7d'>('30d');
 const [activeBar, setActiveBar] = useState<number | null>(null);

 // Data sets for 30d and 7d
 const data = period === '30d' ? {
 remaining: '۳٫۲M',
 requests: '۱۲,۴۸۰',
 cost: '۱۸۰K',
 bars: [
 { day: '۱', height: 75, tokens: '۲۱۰K' },
 { day: '۳', height: 85, tokens: '۲۴۰K' },
 { day: '۵', height: 45, tokens: '۱۳۰K' },
 { day: '۷', height: 95, tokens: '۲۸۰K' },
 { day: '۹', height: 60, tokens: '۱۷۰K' },
 { day: '۱۱', height: 70, tokens: '۱۹۵K' },
 { day: '۱۳', height: 35, tokens: '۹۰K' },
 { day: '۱۵', height: 80, tokens: '۲۳۰K' },
 { day: '۱۷', height: 90, tokens: '۲۶۰K' },
 { day: '۱۹', height: 50, tokens: '۱۴۰K' },
 { day: '۲۱', height: 65, tokens: '۱۸۵K' },
 { day: '۲۳', height: 40, tokens: '۱۱۰K' },
 { day: '۲۵', height: 85, tokens: '۲۵۰K' },
 { day: '۲۷', height: 75, tokens: '۲۱۵K' },
 { day: '۲۹', height: 55, tokens: '۱۶۰K' },
 ],
 models: [
 { name: 'GPT', percent: 54, color: 'from-blue-500 to-cyan-400' },
 { name: 'Claude', percent: 31, color: 'from-purple-500 to-indigo-400' },
 { name: 'سایر مدل‌ها', percent: 15, color: 'from-emerald-500 to-teal-400' }
 ]
 } : {
 remaining: '۳٫۲M',
 requests: '۳,۲۴۰',
 cost: '۴۸K',
 bars: [
 { day: 'شنبه', height: 60, tokens: '۱۶۰K' },
 { day: '۱ش', height: 80, tokens: '۲۲۰K' },
 { day: '۲ش', height: 95, tokens: '۲۷۰K' },
 { day: '۳ش', height: 50, tokens: '۱۴۰K' },
 { day: '۴ش', height: 85, tokens: '۲۴۰K' },
 { day: '۵ش', height: 70, tokens: '۱۹۰K' },
 { day: 'جمعه', height: 40, tokens: '۱۱۰K' }
 ],
 models: [
 { name: 'GPT', percent: 58, color: 'from-blue-500 to-cyan-400' },
 { name: 'Claude', percent: 28, color: 'from-purple-500 to-indigo-400' },
 { name: 'سایر مدل‌ها', percent: 14, color: 'from-emerald-500 to-teal-400' }
 ]
 };

 return (
 <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5"
 style={{ fontFamily:"'Vazirmatn', 'Estedad', sans-serif" }}
 >
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
 {/* Right Column: Title, Feature Bullets, and Direct Dashboard Button */}
 <div className="lg:col-span-6 space-y-6 text-right order-2 lg:order-1">
 {/* Badge */}
 <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold shadow-xs">
 <Sparkles size={14} />
 <span>شفافیت مصرف</span>
 </div>

 {/* Headline with Estedad */}
 <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight"
 style={{ fontFamily:"'Estedad', sans-serif" }}
 >
 همیشه بدانید چه‌قدر مصرف کرده‌اید
 </h2>

 {/* Subtext */}
 <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] leading-relaxed">
 کنسول، مصرف توکن، هزینه و تاریخچۀ پرداخت را شفاف نمایش می‌دهد تا بدون شگفتی، کنترل کامل بر استفادهٔ خود داشته باشید.
 </p>

 {/* Bullets List */}
 <div className="space-y-3.5 pt-1">
 {[
 { text: 'موجودی توکن و میزان باقی‌مانده به‌صورت لحظه‌ای', icon: Coins },
 { text: 'نمودار مصرف روزانه و روند استفاده', icon: TrendingUp },
 { text: 'تفکیک مصرف بر اساس مدل و کلید API', icon: Cpu },
 { text: 'تاریخچهٔ کامل پرداخت‌ها و فاکتورها', icon: Receipt },
 ].map((item, idx) => (
 <div key={idx} className="flex items-center gap-3 group">
 <div className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
 <item.icon size={16} />
 </div>
 <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
 {item.text}
 </span>
 </div>
 ))}
 </div>

 {/* CTA Button to User Dashboard */}
 <div className="pt-2">
 <Link
 to="/dashboard"
 aria-label="ورود به داشبورد کاربری"
 className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl clay-btn-primary-thick text-white font-black text-sm shadow-lg hover:shadow-cyan-500/25 active:scale-95 transition-all group cursor-pointer"
 style={{ fontFamily:"'Estedad', sans-serif" }}
 >
 <LayoutDashboard size={18} className="text-white/90 group-hover:scale-110 transition-transform" />
 <span>ورود به داشبورد کاربری</span>
 <ArrowLeft size={16} className="text-white/80 group-hover:-translate-x-1 transition-transform" />
 </Link>
 </div>
 </div>

 {/* Left Column: Interactive Claymorphic Dashboard Card */}
 <div className="lg:col-span-6 order-1 lg:order-2">
 <div style={{ borderRadius: '28px', fontFamily:"'Vazirmatn', sans-serif" }}
 className="clay-card-thick p-5 sm:p-7 border border-[var(--card-border)]  shadow-xl relative overflow-hidden transition-all duration-300"
 >
 {/* Top Glow Accent */}
 <div className="absolute top-0 right-1/4 w-60 h-40 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

 {/* Dashboard Header */}
 <div className="flex items-center justify-between mb-5 relative z-10">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center text-blue-600 dark:text-cyan-400">
 <Activity size={16} />
 </div>
 <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100" style={{ fontFamily:"'Estedad', sans-serif" }}>
 مصرف شما
 </h3>
 </div>

 {/* Time Period Filter Pill */}
 <div className="flex items-center bg-zinc-200/50  p-1 rounded-xl border border-[var(--card-border)]  text-xs">
 <button
 onClick={() => setPeriod('30d')}
 className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
 period === '30d' ? 'clay-btn text-blue-600 dark:text-cyan-400 shadow-xs' : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
 }`}
 >
 ۳۰ روز اخیر
 </button>
 <button
 onClick={() => setPeriod('7d')}
 className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
 period === '7d' ? 'clay-btn text-blue-600 dark:text-cyan-400 shadow-xs' : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
 }`}
 >
 ۷ روز اخیر
 </button>
 </div>
 </div>

 {/* 3 Metric Stat Boxes */}
 <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5 relative z-10">
 {/* Stat 1: Remaining Tokens */}
 <div style={{ borderRadius: '16px' }}
 className="clay-surface-inset p-3 sm:p-3.5 flex flex-col items-center justify-center text-center border border-[var(--card-border)] "
 >
 <div className="text-blue-600 dark:text-cyan-400 mb-1">
 <Coins size={16} />
 </div>
 <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100" style={{ fontFamily:"'Estedad', 'Vazirmatn', sans-serif" }}>
 {data.remaining}
 </span>
 <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
 باقی‌مانده
 </span>
 </div>

 {/* Stat 2: Requests */}
 <div style={{ borderRadius: '16px' }}
 className="clay-surface-inset p-3 sm:p-3.5 flex flex-col items-center justify-center text-center border border-[var(--card-border)] "
 >
 <div className="text-purple-600 dark:text-purple-400 mb-1">
 <Activity size={16} />
 </div>
 <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100" style={{ fontFamily:"'Estedad', 'Vazirmatn', sans-serif" }}>
 {data.requests}
 </span>
 <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
 درخواست‌ها
 </span>
 </div>

 {/* Stat 3: Cost */}
 <div style={{ borderRadius: '16px' }}
 className="clay-surface-inset p-3 sm:p-3.5 flex flex-col items-center justify-center text-center border border-[var(--card-border)] "
 >
 <div className="text-emerald-600 dark:text-emerald-400 mb-1">
 <Receipt size={16} />
 </div>
 <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100" style={{ fontFamily:"'Estedad', 'Vazirmatn', sans-serif" }}>
 {data.cost}
 </span>
 <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
 هزینه (تومان)
 </span>
 </div>
 </div>

 {/* Daily Consumption Bar Chart */}
 <div style={{ borderRadius: '18px' }}
 className="clay-surface-inset p-4 sm:p-5 mb-5 relative z-10 border border-[var(--card-border)] "
 >
 <div className="flex items-center justify-between mb-3 text-xs">
 <span className="font-bold text-zinc-700 dark:text-zinc-300">روند مصرف روزانه</span>
 <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
 میانگین <span className="font-bold text-zinc-700 dark:text-zinc-300">{toPersianDigits('200')}K</span> / روز
 </span>
 </div>

 {/* Bars Row */}
 <div className="h-28 flex items-end justify-between gap-1.5 sm:gap-2 pt-2 px-1 relative">
 {data.bars.map((bar, idx) => {
 const isHovered = activeBar === idx;
 return (
 <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
 onMouseEnter={() => setActiveBar(idx)}
 onMouseLeave={() => setActiveBar(null)}
 >
 {/* Tooltip on hover */}
 {isHovered && (
 <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold shadow-md z-20 whitespace-nowrap animate-in fade-in zoom-in-95">
 {bar.tokens}
 </div>
 )}

 {/* Bar Column */}
 <div style={{ height: `${bar.height}%`, borderRadius: '6px' }}
 className={`w-full transition-all duration-300 ${
 isHovered ? 'bg-gradient-to-t from-purple-600 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.6)] scale-x-105' : 'bg-gradient-to-t from-purple-600/80 via-indigo-500/70 to-blue-400/80 opacity-90'
 }`}
 />
 </div>
 );
 })}
 </div>
 </div>

 {/* Model Breakdown Progress Bars */}
 <div className="space-y-3 relative z-10">
 <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
 تفکیک مدل‌های مصرفی
 </span>
 <div className="space-y-2.5">
 {data.models.map((m, idx) => (
 <div key={idx} className="flex items-center gap-3 text-xs">
 {/* Model Name on Right in RTL */}
 <span className="w-16 sm:w-20 text-right font-bold text-zinc-800 dark:text-zinc-200 text-xs shrink-0"
 style={{ fontFamily:"'Vazirmatn', sans-serif" }}
 >
 {m.name}
 </span>

 {/* Horizontal Progress Bar in Middle */}
 <div className="flex-1 h-2.5 bg-zinc-200/80  rounded-full overflow-hidden p-0.5">
 <div style={{ width: `${m.percent}%` }}
 className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500 shadow-xs`}
 />
 </div>

 {/* Percentage on Left in RTL */}
 <span className="w-10 text-left font-bold text-zinc-500 dark:text-zinc-400 text-xs shrink-0"
 style={{ fontFamily:"'Vazirmatn', sans-serif" }}
 dir="ltr"
 >
 {toPersianDigits(m.percent)}٪
 </span>
 </div>
 ))}
 </div>
 </div>

 </div>
 </div>

 </div>
 </section>
 );
};
