import React, { useState, useEffect, useMemo } from 'react';
import {
 TrendingUp,
 TrendingDown,
 DollarSign,
 Zap,
 Users,
 MessageSquare,
 ShoppingBag,
 Calendar,
 RefreshCw,
 PieChart,
 BarChart3,
 Layers,
 ArrowUpRight,
 ArrowDownRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TimelineItem {
 date: string;
 chatCount: number;
 chatRevenueToman: number;
 storeRevenueToman: number;
 totalRevenueToman: number;
 costUsd: number;
 promptTokens: number;
 completionTokens: number;
 totalTokens: number;
 activeUsers: number;
 newUsersCount: number;
}

interface ModelDistItem {
 model: string;
 requestCount: number;
 totalTokens: number;
 totalCostUsd: number;
 totalRevenueToman: number;
}

interface DonutModelItem extends ModelDistItem {
 percentage: number;
 startAngle?: number;
 endAngle?: number;
 color: string;
}

interface AnalyticsData {
 period: string;
 days: number;
 timeline: TimelineItem[];
 modelDistribution: ModelDistItem[];
 summary: {
 totalChats: number;
 totalChatRevenueToman: number;
 totalStoreRevenueToman: number;
 totalRevenueToman: number;
 totalCostUsd: number;
 totalTokens: number;
 uniqueActiveUsers: number;
 totalOrders: number;
 totalNewUsers: number;
 };
}

export const AdminAnalyticsTab: React.FC = () => {
 const { token } = useAuthStore();
 const [period, setPeriod] = useState<'7d' | '30d' | '1y'>('30d');
 const [data, setData] = useState<AnalyticsData | null>(null);
 const [loading, setLoading] = useState(false);
 const [hoveredDay, setHoveredDay] = useState<TimelineItem | null>(null);
 const [hoveredModel, setHoveredModel] = useState<DonutModelItem | null>(null);

 useEffect(() => {
 fetchAnalytics();
 }, [period]);

 const fetchAnalytics = async () => {
 setLoading(true);
 try {
 const res = await fetch(`/api/admin/analytics-summary?period=${period}`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) {
 const json = await res.json();
 setData(json);
 }
 } catch (err) {
 console.error('Failed to fetch analytics:', err);
 } finally {
 setLoading(false);
 }
 };

 const timeline = data?.timeline || [];
 const modelDistribution = data?.modelDistribution || [];
 const summary = data?.summary;

 // Calculate estimated net profit in Tomans: Revenue - (Cost USD * Dollar Rate)
 const dollarRate = 200000; // standard fallback
 const estimatedCostToman = (summary?.totalCostUsd || 0) * dollarRate;
 const estimatedNetProfitToman = Math.max(0, (summary?.totalRevenueToman || 0) - estimatedCostToman);

 // SVG Area Chart geometry for Revenue
 const areaChartData = useMemo(() => {
 if (timeline.length === 0) return { path: '', areaPath: '', maxVal: 0, points: [] };
 const maxVal = Math.max(...timeline.map(t => t.totalRevenueToman), 1000);
 const width = 600;
 const height = 180;
 const padding = 20;

 const points = timeline.map((item, idx) => {
 const x = padding + (idx / Math.max(1, timeline.length - 1)) * (width - 2 * padding);
 const y = height - padding - (item.totalRevenueToman / maxVal) * (height - 2 * padding);
 return { x, y, item };
 });

 if (points.length === 1) {
 return { path: `M ${points[0].x} ${points[0].y}`, areaPath: '', maxVal, points };
 }

 let path = `M ${points[0].x} ${points[0].y}`;
 for (let i = 1; i < points.length; i++) {
 const prev = points[i - 1];
 const curr = points[i];
 const cx = (prev.x + curr.x) / 2;
 path += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
 }

 const first = points[0];
 const last = points[points.length - 1];
 const areaPath = `${path} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`;

 return { path, areaPath, maxVal, points };
 }, [timeline]);

 // Model Colors Palette
 const getModelColor = (modelName: string, index: number) => {
 const lower = modelName.toLowerCase();
 if (lower.includes('gemini')) return '#3b82f6'; // Blue
 if (lower.includes('gpt') || lower.includes('openai')) return '#10b981'; // Emerald
 if (lower.includes('claude') || lower.includes('anthropic')) return '#f59e0b'; // Amber
 if (lower.includes('qwen')) return '#8b5cf6'; // Violet
 if (lower.includes('llama') || lower.includes('meta')) return '#06b6d4'; // Cyan
 if (lower.includes('mistral')) return '#f97316'; // Orange
 const fallback = ['#ec4899', '#6366f1', '#14b8a6', '#84cc16'];
 return fallback[index % fallback.length];
 };

 // Donut chart calculations
 const donutData = useMemo(() => {
 const totalTokens = modelDistribution.reduce((acc, m) => acc + m.totalTokens, 0);
 if (totalTokens === 0) return [];

 let currentAngle = 0;
 return modelDistribution.map((m, idx) => {
 const percentage = (m.totalTokens / totalTokens) * 100;
 const angle = (percentage / 100) * 360;
 const item = {
 ...m,
 percentage,
 startAngle: currentAngle,
 endAngle: currentAngle + angle,
 color: getModelColor(m.model, idx)
 };
 currentAngle += angle;
 return item;
 });
 }, [modelDistribution]);

 // Maximum tokens for Bar Chart
 const maxTokens = Math.max(...timeline.map(t => t.totalTokens), 100);

 return (
 <div className="space-y-6" dir="rtl">
 {/* Header & Period Filters */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
 <div>
 <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
 <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
 <span>گزارشات تحلیلی و نمودارهای مالی</span>
 </h2>
 <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
 بررسی جامع عملکرد مالی، محبوبیت مدل‌ها، ترافیک مصرف توکن و رشد کاربران
 </p>
 </div>

 <div className="flex items-center gap-2">
 <div className="flex items-center p-1 rounded-xl clay-btn-secondary/80 border border-[var(--card-border)] text-xs font-bold">
 <button
 onClick={() => setPeriod('7d')}
 className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
 period === '7d' 
 ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-xs' 
 : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
 }`}
 >
 ۷ روز اخیر
 </button>
 <button
 onClick={() => setPeriod('30d')}
 className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
 period === '30d' 
 ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-xs' 
 : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
 }`}
 >
 ۳۰ روز اخیر
 </button>
 <button
 onClick={() => setPeriod('1y')}
 className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
 period === '1y' 
 ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-xs' 
 : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
 }`}
 >
 ۱ سال اخیر
 </button>
 </div>

 <button
 onClick={fetchAnalytics}
 disabled={loading}
 className="p-2 rounded-xl clay-btn-secondary text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
 title="بروزرسانی داده‌ها"
 >
 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {/* KPI Cards Header */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
 {/* Total Revenue */}
 <div className="p-4 rounded-2xl clay-surface flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">کل درآمد دوره</span>
 <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
 <DollarSign className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
 {(summary?.totalRevenueToman || 0).toLocaleString('fa-IR')}
 </span>
 <span className="text-xs font-medium text-zinc-400">تومان</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 flex justify-between">
 <span>چت: {(summary?.totalChatRevenueToman || 0).toLocaleString('fa-IR')} ت</span>
 <span>فروشگاه: {(summary?.totalStoreRevenueToman || 0).toLocaleString('fa-IR')} ت</span>
 </div>
 </div>

 {/* Estimated Net Profit */}
 <div className="p-4 rounded-2xl clay-surface flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">سود ناخالص تخمینی</span>
 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
 <TrendingUp className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
 {estimatedNetProfitToman.toLocaleString('fa-IR')}
 </span>
 <span className="text-xs font-medium text-zinc-400">تومان</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
 هزینه دلاری API: <span className="font-mono font-bold" dir="ltr">${(summary?.totalCostUsd || 0).toFixed(4)}</span>
 </div>
 </div>

 {/* Total Tokens & Chats */}
 <div className="p-4 rounded-2xl clay-surface flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">حجم پیام‌ها و توکن‌ها</span>
 <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
 <Zap className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
 {(summary?.totalTokens || 0).toLocaleString('fa-IR')}
 </span>
 <span className="text-xs font-medium text-zinc-400">توکن</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
 تعداد کل گفت‌وگوها: <span className="font-bold text-zinc-700 dark:text-zinc-300">{(summary?.totalChats || 0).toLocaleString('fa-IR')}</span> پیام
 </div>
 </div>

 {/* Users & Growth */}
 <div className="p-4 rounded-2xl clay-surface flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">کاربران فعال و جدید</span>
 <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
 <Users className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
 {(summary?.uniqueActiveUsers || 0).toLocaleString('fa-IR')}
 </span>
 <span className="text-xs font-medium text-zinc-400">کاربر فعال چت</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
 ثبت‌نام‌های جدید دوره: <span className="font-bold text-zinc-700 dark:text-zinc-300">{(summary?.totalNewUsers || 0).toLocaleString('fa-IR')}</span> کاربر
 </div>
 </div>
 </div>

 {/* Main Charts Grid: Revenue Trend & Model Distribution */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
 {/* Chart 1: Revenue Area Chart (2 Cols) */}
 <div className="lg:col-span-2 p-5 rounded-2xl clay-surface flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
 <TrendingUp className="w-4 h-4 text-emerald-500" />
 <span>روند درآمد روزانه پلتفرم (تومان)</span>
 </h3>
 <p className="text-[11px] text-zinc-400 mt-0.5">
 نمودار پیوسته درآمد ناشی از چت و فروش محصولات
 </p>
 </div>

 {hoveredDay && (
 <div className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex items-center gap-2">
 <span className="text-zinc-500">{hoveredDay.date}:</span>
 <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
 {hoveredDay.totalRevenueToman.toLocaleString('fa-IR')} تومان
 </span>
 </div>
 )}
 </div>

 {/* SVG Interactive Area Chart */}
 <div className="w-full overflow-hidden">
 <svg viewBox="0 0 600 180" className="w-full h-48 overflow-visible">
 <defs>
 <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
 <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
 </linearGradient>
 </defs>

 {/* Horizontal Grid lines */}
 <line x1="20" y1="20" x2="580" y2="20" stroke="#71717a" strokeOpacity="0.15" strokeDasharray="3 3" />
 <line x1="20" y1="90" x2="580" y2="90" stroke="#71717a" strokeOpacity="0.15" strokeDasharray="3 3" />
 <line x1="20" y1="160" x2="580" y2="160" stroke="#71717a" strokeOpacity="0.2" />

 {/* Area and Line */}
 {areaChartData.areaPath && (
 <path d={areaChartData.areaPath} fill="url(#revenueGrad)" />
 )}
 {areaChartData.path && (
 <path
 d={areaChartData.path}
 fill="none"
 stroke="#3b82f6"
 strokeWidth="2.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 )}

 {/* Interactive Points */}
 {areaChartData.points.map((pt, i) => (
 <circle
 key={i}
 cx={pt.x}
 cy={pt.y}
 r={hoveredDay?.date === pt.item.date ? '6' : '3.5'}
 fill={hoveredDay?.date === pt.item.date ? '#2563eb' : '#3b82f6'}
 stroke="#ffffff"
 strokeWidth="1.5"
 className="cursor-pointer transition-all duration-150"
 onMouseEnter={() => setHoveredDay(pt.item)}
 onMouseLeave={() => setHoveredDay(null)}
 />
 ))}
 </svg>
 </div>
 </div>

 <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 font-mono">
 <span>{timeline[0]?.date || ''}</span>
 <span>بازه انتخابی: {period === '7d' ? '۷ روز' : period === '30d' ? '۳۰ روز' : 'یک سال'}</span>
 <span>{timeline[timeline.length - 1]?.date || ''}</span>
 </div>
 </div>

 {/* Chart 2: Model Distribution (Donut Chart) */}
 <div className="p-5 rounded-2xl clay-surface flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
 <PieChart className="w-4 h-4 text-purple-500" />
 <span>سهم مصرف هر مدل (توکن‌ها)</span>
 </h3>
 <span className="text-[10px] text-zinc-400 font-medium">محبوب‌ترین مدل‌ها</span>
 </div>

 {donutData.length > 0 ? (
 <div className="flex flex-col items-center gap-4 my-2">
 {/* SVG Donut */}
 <div className="relative w-36 h-36">
 <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
 {donutData.map((slice, i) => {
 const radius = 40;
 const circumference = 2 * Math.PI * radius;
 const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
 // offset starts from accumulated percentage
 const strokeDashoffset = -((slice.startAngle / 360) * circumference);

 return (
 <circle
 key={i}
 cx="50"
 cy="50"
 r={radius}
 fill="transparent"
 stroke={slice.color}
 strokeWidth="14"
 strokeDasharray={strokeDasharray}
 strokeDashoffset={strokeDashoffset}
 className="cursor-pointer transition-all duration-300 hover:opacity-80"
 onMouseEnter={() => setHoveredModel(slice)}
 onMouseLeave={() => setHoveredModel(null)}
 />
 );
 })}
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
 <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
 {hoveredModel ? `${hoveredModel.percentage.toFixed(0)}%` : `${donutData.length}`}
 </span>
 <span className="text-[9px] text-zinc-400">
 {hoveredModel ? hoveredModel.model.split('-').slice(0, 2).join('-') : 'مدل فعال'}
 </span>
 </div>
 </div>

 {/* Model Legend */}
 <div className="w-full flex flex-col gap-1.5 text-xs max-h-36 overflow-y-auto pr-1">
 {donutData.map((m, idx) => (
 <div
 key={idx}
 onMouseEnter={() => setHoveredModel(m)}
 onMouseLeave={() => setHoveredModel(null)}
 className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
 hoveredModel?.model === m.model ? 'bg-zinc-200/60 dark:bg-zinc-700/50' : 'clay-icon-btn/60'
 }`}
 >
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
 <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[130px]" title={m.model}>
 {m.model}
 </span>
 </div>
 <div className="flex items-center gap-1.5 font-mono text-[11px]">
 <span className="text-zinc-500">({m.percentage.toFixed(1)}%)</span>
 <span className="font-bold text-zinc-700 dark:text-zinc-300">{m.totalTokens.toLocaleString('fa-IR')}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="py-12 text-center text-xs text-zinc-400">
 هنوز مصرف توکنی در این دوره ثبت نشده است.
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Secondary Charts: Daily Token Volume Bar Chart & User Registrations */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
 {/* Chart 3: Token Usage Volume Bars */}
 <div className="p-5 rounded-2xl clay-surface">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
 <Zap className="w-4 h-4 text-purple-500" />
 <span>حجم مصرف روزانه توکن‌ها</span>
 </h3>
 <p className="text-[11px] text-zinc-400 mt-0.5">
 ترافیک ورودی (پرامپت) و خروجی (پاسخ مدل) کاربران
 </p>
 </div>
 </div>

 <div className="h-44 flex items-end gap-1 pt-4 pb-1 overflow-x-auto">
 {timeline.map((item, idx) => {
 const heightPercent = maxTokens > 0 ? Math.max(4, (item.totalTokens / maxTokens) * 100) : 4;
 return (
 <div
 key={idx}
 className="flex-1 min-w-[10px] flex flex-col items-center gap-1 group relative cursor-pointer"
 >
 {/* Tooltip on hover */}
 <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-zinc-900 text-white text-[10px] rounded-lg p-2 z-20 whitespace-nowrap pointer-events-none">
 <span className="font-bold">{item.date}</span>
 <span className="text-purple-300">{item.totalTokens.toLocaleString('fa-IR')} توکن</span>
 <span className="text-zinc-400">{item.chatCount} پیام</span>
 </div>

 <div
 style={{ height: `${heightPercent}%` }}
 className={`w-full rounded-t-sm transition-all duration-200 ${
 item.totalTokens > 0 
 ? 'bg-purple-500 group-hover:bg-purple-400 dark:bg-purple-600 dark:group-hover:bg-purple-500' 
 : 'clay-btn-secondary/40'
 }`}
 />
 </div>
 );
 })}
 </div>

 <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 font-mono">
 <span>{timeline[0]?.date || ''}</span>
 <span>بیشترین مصرف روزانه: {maxTokens.toLocaleString('fa-IR')} توکن</span>
 <span>{timeline[timeline.length - 1]?.date || ''}</span>
 </div>
 </div>

 {/* Chart 4: User Growth / Registrations */}
 <div className="p-5 rounded-2xl clay-surface">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
 <Users className="w-4 h-4 text-amber-500" />
 <span>روند ثبت‌نام کاربران جدید</span>
 </h3>
 <p className="text-[11px] text-zinc-400 mt-0.5">
 نرخ جذب کاربر و ثبت‌نام در طول بازه انتخابی
 </p>
 </div>
 <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
 +{(summary?.totalNewUsers || 0).toLocaleString('fa-IR')} کاربر جدید
 </div>
 </div>

 <div className="h-44 flex items-end gap-1 pt-4 pb-1 overflow-x-auto">
 {timeline.map((item, idx) => {
 const maxNewUsers = Math.max(...timeline.map(t => t.newUsersCount), 5);
 const heightPercent = maxNewUsers > 0 ? Math.max(4, (item.newUsersCount / maxNewUsers) * 100) : 4;
 return (
 <div
 key={idx}
 className="flex-1 min-w-[10px] flex flex-col items-center gap-1 group relative cursor-pointer"
 >
 <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-zinc-900 text-white text-[10px] rounded-lg p-2 z-20 whitespace-nowrap pointer-events-none">
 <span className="font-bold">{item.date}</span>
 <span className="text-amber-300">+{item.newUsersCount} ثبت‌نام جدید</span>
 </div>

 <div
 style={{ height: `${heightPercent}%` }}
 className={`w-full rounded-t-sm transition-all duration-200 ${
 item.newUsersCount > 0 
 ? 'bg-amber-500 group-hover:bg-amber-400 dark:bg-amber-600 dark:group-hover:bg-amber-500' 
 : 'clay-btn-secondary/40'
 }`}
 />
 </div>
 );
 })}
 </div>

 <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 font-mono">
 <span>{timeline[0]?.date || ''}</span>
 <span>رشد پیوسته جامعه کاربران</span>
 <span>{timeline[timeline.length - 1]?.date || ''}</span>
 </div>
 </div>
 </div>
 </div>
 );
};
