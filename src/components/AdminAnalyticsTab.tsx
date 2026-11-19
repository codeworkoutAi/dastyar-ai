import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  RefreshCw,
  BarChart3,
  PackageCheck
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

interface AnalyticsData {
  period: string;
  days: number;
  dollarRate?: number;
  sellingRate?: number;
  timeline: TimelineItem[];
  summary: {
    dollarRate?: number;
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
  const summary = data?.summary;

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

  // Max store revenue for bar chart
  const maxStoreDaily = Math.max(...timeline.map(t => t.storeRevenueToman || t.totalRevenueToman), 10000);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Period Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
        <div>
          <h2 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <span>آمار، گزارشات مالی و شاخص‌های رشد فروشگاه</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            بررسی جامع گردش مالی فروشگاه، تعداد سفارشات، روند درآمد و نرخ جذب مشتریان جدید
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl clay-surface text-xs font-bold gap-1">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '7d' ? 'clay-btn-primary font-bold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '30d' ? 'clay-btn-primary font-bold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              ۳۰ روز اخیر
            </button>
            <button
              onClick={() => setPeriod('1y')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '1y' ? 'clay-btn-primary font-bold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              ۱ سال اخیر
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 rounded-xl clay-btn transition-colors cursor-pointer text-[var(--text-main)]"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">کل گردش مالی دوره</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[var(--text-main)] font-mono">
                {(summary?.totalRevenueToman || 0).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-[var(--text-dim)]">تومان</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)] flex justify-between">
            <span>فروشگاه: {(summary?.totalStoreRevenueToman || 0).toLocaleString('fa-IR')} ت</span>
            <span>کیف پول: {(summary?.totalChatRevenueToman || 0).toLocaleString('fa-IR')} ت</span>
          </div>
        </div>

        {/* Store Sales Revenue */}
        <div className="p-5 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">فروش مستقیم محصولات</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {(summary?.totalStoreRevenueToman || 0).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-[var(--text-dim)]">تومان</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            سفارشات موفق پرداخت‌شده درگاه و کارت
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">کل سفارشات ثبت‌شده</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[var(--text-main)] font-mono">
                {(summary?.totalOrders || 0).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-[var(--text-dim)]">سفارش</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            اکانت‌ها و لایسنس‌های خریداری‌شده
          </div>
        </div>

        {/* Users & Growth */}
        <div className="p-5 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">کاربران جدید ثبت‌نامی</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[var(--text-main)] font-mono">
                {(summary?.totalNewUsers || 0).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-[var(--text-dim)]">کاربر جدید</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            رشد کاربران عضو پلتفرم در دوره
          </div>
        </div>
      </div>

      {/* Main Revenue Area Chart */}
      <div className="p-5 rounded-2xl clay-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>روند پیوسته درآمد روزانه پلتفرم (تومان)</span>
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              نمودار تغییرات روزانه گردش مالی و فروش محصولات
            </p>
          </div>

          {hoveredDay && (
            <div className="px-3 py-1 rounded-xl clay-surface border border-[var(--card-border)] text-xs flex items-center gap-2">
              <span className="text-[var(--text-muted)]">{hoveredDay.date}:</span>
              <span className="font-bold text-[var(--color-accent-primary)] font-mono">
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
            <line x1="20" y1="20" x2="580" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
            <line x1="20" y1="90" x2="580" y2="90" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
            <line x1="20" y1="160" x2="580" y2="160" stroke="currentColor" strokeOpacity="0.15" />

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

        <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] pt-2 border-t border-[var(--card-border)] font-mono">
          <span>{timeline[0]?.date || ''}</span>
          <span>بازه انتخابی: {period === '7d' ? '۷ روز' : period === '30d' ? '۳۰ روز' : 'یک سال'}</span>
          <span>{timeline[timeline.length - 1]?.date || ''}</span>
        </div>
      </div>

      {/* Secondary Charts: Daily Store Sales & User Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Store Sales Bars */}
        <div className="p-5 rounded-2xl clay-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>فروش روزانه فروشگاه (تومان)</span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                حجم فروش مستقیم سفارشات در هر روز
              </p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1 pt-4 pb-1 overflow-x-auto custom-scrollbar">
            {timeline.map((item, idx) => {
              const dailyVal = item.storeRevenueToman || item.totalRevenueToman;
              const heightPercent = maxStoreDaily > 0 ? Math.max(4, (dailyVal / maxStoreDaily) * 100) : 4;
              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[10px] flex flex-col items-center gap-1 group relative cursor-pointer"
                >
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[var(--color-input-bg)] text-[var(--text-main)] border border-[var(--card-border)] shadow-lg text-[10px] rounded-xl p-2 z-20 whitespace-nowrap pointer-events-none">
                    <span className="font-bold">{item.date}</span>
                    <span className="text-emerald-400 font-mono">{dailyVal.toLocaleString('fa-IR')} تومان</span>
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      dailyVal > 0 ? 'bg-emerald-500 group-hover:bg-emerald-400 dark:bg-emerald-600 dark:group-hover:bg-emerald-500' : 'bg-[var(--card-border)]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] pt-3 border-t border-[var(--card-border)] font-mono">
            <span>{timeline[0]?.date || ''}</span>
            <span>پیک فروش روزانه: {maxStoreDaily.toLocaleString('fa-IR')} تومان</span>
            <span>{timeline[timeline.length - 1]?.date || ''}</span>
          </div>
        </div>

        {/* User Growth / Registrations */}
        <div className="p-5 rounded-2xl clay-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                <span>روند ثبت‌نام کاربران جدید</span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                نرخ جذب کاربر و ثبت‌نام در طول بازه انتخابی
              </p>
            </div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
              +{(summary?.totalNewUsers || 0).toLocaleString('fa-IR')} کاربر جدید
            </div>
          </div>

          <div className="h-44 flex items-end gap-1 pt-4 pb-1 overflow-x-auto custom-scrollbar">
            {timeline.map((item, idx) => {
              const maxNewUsers = Math.max(...timeline.map(t => t.newUsersCount), 5);
              const heightPercent = maxNewUsers > 0 ? Math.max(4, (item.newUsersCount / maxNewUsers) * 100) : 4;
              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[10px] flex flex-col items-center gap-1 group relative cursor-pointer"
                >
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[var(--color-input-bg)] text-[var(--text-main)] border border-[var(--card-border)] shadow-lg text-[10px] rounded-xl p-2 z-20 whitespace-nowrap pointer-events-none">
                    <span className="font-bold">{item.date}</span>
                    <span className="text-amber-400 font-mono">+{item.newUsersCount} ثبت‌نام جدید</span>
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      item.newUsersCount > 0 ? 'bg-amber-500 group-hover:bg-amber-400 dark:bg-amber-600 dark:group-hover:bg-amber-500' : 'bg-[var(--card-border)]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] pt-3 border-t border-[var(--card-border)] font-mono">
            <span>{timeline[0]?.date || ''}</span>
            <span>رشد پیوسته جامعه کاربران</span>
            <span>{timeline[timeline.length - 1]?.date || ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
