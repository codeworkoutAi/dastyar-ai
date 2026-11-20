import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  Receipt,
  ShoppingBag,
  Download,
  Printer
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PromoCodesManager } from './PromoCodesManager';
import { toPersianDigits } from '../lib/persianUtils';
import { formatTehranDate, formatTehranDateTime, formatTehranTime } from '../lib/dateUtils';
import { AdminToast } from './admin/AdminToast';

export const AdminFinanceTab: React.FC = () => {
  const { token } = useAuthStore();

  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('newest');
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    fetchData();
  }, []);

  // Debounced search & filter
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      fetchTransactionsOnly(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, txTypeFilter, dateFilter, sortFilter]);

  useEffect(() => {
    if (page > 1) {
      fetchTransactionsOnly(page);
    }
  }, [page]);

  const fetchTransactionsOnly = async (pageToFetch = page) => {
    try {
      const url = new URL(window.location.origin + '/api/admin/wallet-transactions');
      url.searchParams.append('limit', LIMIT.toString());
      url.searchParams.append('offset', ((pageToFetch - 1) * LIMIT).toString());
      if (searchQuery) url.searchParams.append('search', searchQuery);
      if (txTypeFilter !== 'all') url.searchParams.append('type', txTypeFilter);
      if (dateFilter !== 'all') url.searchParams.append('date', dateFilter);
      if (sortFilter !== 'newest') url.searchParams.append('sort', sortFilter);

      const txRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
        setTotalCount(txData.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(window.location.origin + '/api/admin/wallet-transactions');
      url.searchParams.append('limit', LIMIT.toString());
      url.searchParams.append('offset', ((page - 1) * LIMIT).toString());
      if (searchQuery) url.searchParams.append('search', searchQuery);
      if (txTypeFilter !== 'all') url.searchParams.append('type', txTypeFilter);
      if (dateFilter !== 'all') url.searchParams.append('date', dateFilter);
      if (sortFilter !== 'newest') url.searchParams.append('sort', sortFilter);

      const [sumRes, txRes] = await Promise.all([
        fetch('/api/admin/financial-summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
        setTotalCount(txData.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentSellingRateNum = summary?.sellingRateToman || 200000;

  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) {
      setFeedback({ type: 'error', text: 'داده‌ای برای خروجی گرفتن وجود ندارد.' });
      return;
    }

    const headers = ['کد کاربری', 'نام کاربر', 'تماس', 'عنوان / شرح تراکنش', 'نوع', 'مبلغ (تومان)', 'مانده پس از تراکنش', 'تاریخ'];
    const rows = transactions.map((tx: any) => {
      const userCode = `UC-${10000 + tx.userId}`;
      const name = tx.userName || 'بدون نام';
      const contact = tx.userEmail || tx.userPhone || tx.userTelegramId || '';
      const title = tx.description || tx.model || tx.type || '';
      const type = tx.amount > 0 ? 'افزایش اعتبار' : 'کسر / خرید';
      const amount = tx.amount || 0;
      const balance = tx.balanceAfter || 0;
      const date = formatTehranDateTime(tx.createdAt);

      return [userCode, name, contact, title, type, amount, balance, date].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!transactions || transactions.length === 0) {
      setFeedback({ type: 'error', text: 'داده‌ای برای خروجی گرفتن وجود ندارد.' });
      return;
    }

    const rowsHtml = transactions.map((tx: any) => {
      const isPositive = tx.amount > 0;
      return `
        <tr>
          <td>UC-${10000 + tx.userId}<br/><small>${tx.userName || 'بدون نام'}</small></td>
          <td>${tx.userEmail || tx.userPhone || tx.userTelegramId || '-'}</td>
          <td>${tx.description || tx.model || tx.type || '-'}</td>
          <td dir="ltr" style="color: ${isPositive ? 'green' : 'inherit'}">${isPositive ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}</td>
          <td>${tx.balanceAfter ? tx.balanceAfter.toLocaleString() : '-'}</td>
          <td dir="ltr">${formatTehranDateTime(tx.createdAt)}</td>
        </tr>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>گزارش تراکنش‌های مالی - ${formatTehranDate(new Date())}</title>
  <style>
    body { font-family: Tahoma, Vazirmatn, sans-serif; padding: 20px; font-size: 12px; color: #111; }
    h2 { margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: right; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h2>گزارش جامع تراکنش‌ها و مالی سیستم</h2>
  <div>تاریخ خروجی: ${formatTehranDateTime(new Date())}</div>
  <table>
    <thead>
      <tr>
        <th>کاربر</th>
        <th>تماس</th>
        <th>شرح تراکنش</th>
        <th>مبلغ (تومان)</th>
        <th>مانده حساب</th>
        <th>تاریخ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      setFeedback({ type: 'error', text: 'پنجره پاپ‌آپ چاپ مسدود شده است.' });
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 500);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification */}
      {feedback && (
        <AdminToast 
          message={feedback.text} 
          type={feedback.type} 
          onClose={() => setFeedback(null)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
        <div>
          <h2 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span>مدیریت مالی و تراکنش‌های کیف پول</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            مشاهده گردش حساب کاربران، کدهای تخفیف، نرخ دلار فروشگاه و گزارشات تراکنش‌ها
          </p>
        </div>

        <button
          onClick={() => { setPage(1); fetchData(); }}
          disabled={loading}
          className="p-2.5 rounded-xl clay-btn transition-colors cursor-pointer text-[var(--text-main)]"
          title="بروزرسانی داده‌ها"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Deducted / Spent */}
        <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">کل درآمد کسرشده کاربران</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {(summary?.totalDeductedToman || 0).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-zinc-400">تومان</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            مجموع خریدهای موفق از موجودی
          </div>
        </div>

        {/* Selling Rate */}
        <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">نرخ فعال تبدیل دلار سیستم</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {currentSellingRateNum.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-zinc-400">تومان</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            قابل تنظیم در تب تنظیمات سیستم
          </div>
        </div>

        {/* Total Transactions Count */}
        <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">تعداد کل تراکنش‌ها</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-[var(--text-main)] font-mono">
                {totalCount.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-zinc-400">تراکنش</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            واریزی‌ها، خریدها و بونوس‌ها
          </div>
        </div>

        {/* API Treasury Balance */}
        <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">مانده اعتبار مخزن API</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono" dir="ltr">
                ${(summary?.remainingTreasuryUsd || 0).toFixed(2)}
              </span>
              <span className="text-xs font-medium text-zinc-400">دلار باقی‌مانده</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]">
            خریداری‌شده: ${(summary?.totalPurchasedUsd || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Promo Codes Manager */}
      <div className="mb-6">
        <PromoCodesManager />
      </div>

      {/* Settings Info Card */}
      <div className="p-4 rounded-2xl clay-subcard flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6">
        <div className="flex items-center gap-2.5 text-[var(--text-main)]">
          <Receipt className="w-4 h-4 text-[var(--color-accent-primary)] shrink-0" />
          <span>
            درگاه‌های پرداخت (زرین‌پال و بازارپی)، نرخ ارز سیستم و کلیدهای هوش مصنوعی در تب <strong>تنظیمات سیستم</strong> مدیریت می‌شوند.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          <span className="text-[var(--text-muted)]">نرخ فعال:</span>
          <span className="font-bold text-[var(--color-accent-primary)]">{currentSellingRateNum.toLocaleString('fa-IR')} تومان</span>
        </div>
      </div>

      {/* User Transactions Table */}
      <div className="p-5 rounded-2xl clay-card space-y-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-[var(--card-border)] pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">ریز تراکنش‌های کاربران و کیف پول</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto flex-wrap">
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="جستجوی نام، تلفن یا کد کاربری..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl clay-surface text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex w-full sm:w-auto gap-2 flex-wrap items-center">
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="h-9 px-2.5 flex-1 sm:flex-none clay-surface rounded-xl text-xs font-medium text-[var(--text-main)] outline-none cursor-pointer"
              >
                <option value="all">تراکنش‌های مالی (شارژ و خرید)</option>
                <option value="deposit">افزایش اعتبار / شارژ (+)</option>
                <option value="deduct">کسر از حساب / خرید (-)</option>
                <option value="bonus">بونوس و هدیه</option>
                <option value="free_usage">لاگ سهمیه رایگان چت (قدیمی)</option>
                <option value="all_with_system">همه رکوردها (با لاگ سیستم)</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-2.5 flex-1 sm:flex-none clay-surface rounded-xl text-xs font-medium text-[var(--text-main)] outline-none cursor-pointer"
              >
                <option value="all">همه زمان‌ها</option>
                <option value="today">۲۴ ساعت گذشته</option>
                <option value="week">هفته گذشته</option>
                <option value="month">ماه گذشته</option>
              </select>

              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="h-9 px-2.5 flex-1 sm:flex-none clay-surface rounded-xl text-xs font-medium text-[var(--text-main)] outline-none cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="alpha_asc">الفبا (صعودی)</option>
                <option value="alpha_desc">الفبا (نزولی)</option>
              </select>

              <div className="flex gap-1.5 items-center shrink-0">
                <button
                  onClick={exportToPDF}
                  className="h-9 flex items-center justify-center px-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold text-xs transition-all cursor-pointer whitespace-nowrap gap-1"
                  title="چاپ / دانلود PDF"
                >
                  <Printer size={14} />
                  <span>چاپ</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="h-9 flex items-center justify-center px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs transition-all cursor-pointer whitespace-nowrap gap-1"
                  title="دانلود اکسل / CSV"
                >
                  <Download size={14} />
                  <span>اکسل</span>
                </button>
              </div>

              <button
                onClick={() => { setPage(1); fetchData(); }}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="بروزرسانی دستی"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)]">
                <th className="py-3 px-3.5 font-bold">کاربر</th>
                <th className="py-3 px-3.5 font-bold">شرح / عنوان تراکنش</th>
                <th className="py-3 px-3.5 font-bold">مبلغ تراکنش</th>
                <th className="py-3 px-3.5 font-bold">مانده حساب</th>
                <th className="py-3 px-3.5 font-bold">تاریخ و ساعت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[var(--color-input-bg)]/40 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[var(--text-main)] text-xs">
                            {tx.userName || tx.userEmail || tx.userPhone || 'بدون نام'}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-normal">
                            کد کاربری: <span className="font-mono font-semibold text-[var(--text-muted)]">UC-{10000 + tx.userId}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md clay-btn text-[var(--text-main)] text-[11px] font-medium">
                          {tx.description || tx.model || tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1">
                          <span className={`font-bold text-xs font-price ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {isPositive ? `+${Math.abs(tx.amount).toLocaleString('fa-IR')}` : `-${Math.abs(tx.amount).toLocaleString('fa-IR')}`}
                          </span>
                          <span className="text-[10px] text-zinc-400">تومان</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-300 text-xs font-price">
                            {tx.balanceAfter != null ? tx.balanceAfter.toLocaleString('fa-IR') : '—'}
                          </span>
                          <span className="text-[10px] text-zinc-400">تومان</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col text-[11px] text-[var(--text-muted)] leading-tight">
                          <span>{formatTehranTime(tx.createdAt)}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">{formatTehranDate(tx.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    هنوز تراکنشی ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold rounded-lg clay-btn text-[var(--text-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            صفحه قبل
          </button>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            صفحه {toPersianDigits(page)} از {toPersianDigits(Math.ceil(totalCount / LIMIT) || 1)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * LIMIT >= totalCount}
            className="px-3 py-1.5 text-xs font-bold rounded-lg clay-btn text-[var(--text-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            صفحه بعد
          </button>
        </div>
      </div>
    </div>
  );
};
