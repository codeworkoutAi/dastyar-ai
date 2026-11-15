import React, { useState, useEffect, useRef } from 'react';
import { Coins, TrendingUp, TrendingDown, Plus, Trash2, Save, CheckCircle2, AlertCircle, RefreshCw, Zap, DollarSign, Layers, User, Clock, Receipt,
 Gift,
 CreditCard,
 ShieldCheck,
 Loader2,
 Users,
 Smartphone
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PromoCodesManager } from './PromoCodesManager';
import { toPersianDigits } from '../lib/persianUtils';
import { formatTehranDate, formatTehranDateTime, formatTehranTime } from '../lib/dateUtils';
import { AdminToast } from './admin/AdminToast';
import { AdminConfirmModal } from './admin/AdminConfirmModal';

export const AdminFinanceTab: React.FC = () => {
 const { token } = useAuthStore();
 const purchaseSectionRef = useRef<HTMLDivElement>(null);

 const [summary, setSummary] = useState<any>(null);
 const [transactions, setTransactions] = useState<any[]>([]);
 const [totalCount, setTotalCount] = useState(0);
 const [usageRows, setUsageRows] = useState<any[]>([]);
 const [usageSearch, setUsageSearch] = useState('');
 const [loading, setLoading] = useState(false);
 const [actionLoading, setActionLoading] = useState(false);
 const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
 const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [txTypeFilter, setTxTypeFilter] = useState('all');
 const [dateFilter, setDateFilter] = useState('all');
 const [sortFilter, setSortFilter] = useState('newest'); // newest, oldest, alpha_asc, alpha_desc
 const [page, setPage] = useState(1);
 const LIMIT = 50;

 // Settings state (read-only in Finance; managed in Settings Tab)
 const [sellingRate, setSellingRate] = useState('200000');

 // New purchase form
 const [isAddingPurchase, setIsAddingPurchase] = useState(false);
 const [purchaseProvider, setPurchaseProvider] = useState('');
 const [purchaseAmountUsd, setPurchaseAmountUsd] = useState('');
 const [purchaseCostToman, setPurchaseCostToman] = useState('');
 const [purchaseNotes, setPurchaseNotes] = useState('');

 // Live Provider Balances
 const [liveBalances, setLiveBalances] = useState<any[]>([]);
 const [liveLoading, setLiveLoading] = useState(false);

 useEffect(() => {
 fetchData();
 fetchLiveBalances();
 }, []);

 const fetchLiveBalances = async () => {
 setLiveLoading(true);
 try {
 const res = await fetch('/api/admin/provider-live-balances', {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) {
 const data = await res.json();
 setLiveBalances(data);
 }
 } catch (err) {
 console.error('Failed to fetch live balances:', err);
 } finally {
 setLiveLoading(false);
 }
 };

 // Debounced live search
 useEffect(() => {
 setPage(1); // Reset page on filter change
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
 if (sumData.sellingRateToman) {
 setSellingRate(String(sumData.sellingRateToman));
 }
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

 const fetchUsageSummary = async (q = usageSearch) => {
  try {
    const url = new URL(window.location.origin + '/api/admin/user-usage-summary');
    if (q) url.searchParams.append('search', q);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setUsageRows(await res.json());
  } catch (err) {
    console.error('Failed to fetch usage summary:', err);
  }
};

 useEffect(() => {
  const t = setTimeout(() => { fetchUsageSummary(usageSearch); }, 400);
  return () => clearTimeout(t);
 }, [usageSearch]);

 const handleAddPurchase = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!purchaseProvider || !purchaseAmountUsd || !purchaseCostToman) {
 setFeedback({ type: 'error', text: 'لطفاً نام تأمین‌کننده، مبلغ دلاری و مبلغ پرداختی تومانی را وارد کنید.' });
 return;
 }

 setActionLoading(true);
 setFeedback(null);
 try {
 const res = await fetch('/api/admin/purchases', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 providerName: purchaseProvider,
 amountUsd: parseFloat(purchaseAmountUsd),
 costToman: parseInt(purchaseCostToman, 10),
 notes: purchaseNotes
 })
 });

 if (!res.ok) {
 const errData = await res.json();
 throw new Error(errData.error || 'خطا در ثبت خرید');
 }

 setFeedback({ type: 'success', text: 'فاکتور خرید دلاری با موفقیت ثبت شد.' });
 setIsAddingPurchase(false);
 setPurchaseProvider('');
 setPurchaseAmountUsd('');
 setPurchaseCostToman('');
 setPurchaseNotes('');
 fetchData();
 } catch (err: any) {
 setFeedback({ type: 'error', text: err.message || 'خطا در ثبت خرید' });
 } finally {
 setActionLoading(false);
 }
 };

 const handleDeletePurchase = (id: string) => {
   setPurchaseToDelete(id);
 };

 const executeDeletePurchase = async () => {
   if (!purchaseToDelete) return;
   try {
     setIsDeletingPurchase(true);
     const res = await fetch(`/api/admin/purchases/${purchaseToDelete}`, {
       method: 'DELETE',
       headers: { Authorization: `Bearer ${token}` }
     });
     if (res.ok) {
       setFeedback({ type: 'success', text: 'رکورد خرید با موفقیت حذف شد.' });
       setPurchaseToDelete(null);
       fetchData();
     } else {
       const d = await res.json().catch(() => ({}));
       setFeedback({ type: 'error', text: d.error || 'خطا در حذف رکورد' });
     }
   } catch (err: any) {
     setFeedback({ type: 'error', text: err.message || 'خطا در حذف رکورد' });
   } finally {
     setIsDeletingPurchase(false);
   }
 };

 const currentUnitRate = (parseFloat(purchaseAmountUsd) > 0 && parseInt(purchaseCostToman, 10) > 0)
 ? Math.round(parseInt(purchaseCostToman, 10) / parseFloat(purchaseAmountUsd))
 : 0;

 const currentSellingRateNum = parseInt(sellingRate, 10) || 200000;
 const hasPurchases = (summary?.totalPurchasedUsd || 0) > 0;
 const avgBuyRate = summary?.averagePurchaseRateToman || 0;
 const profitMarginPercent = (hasPurchases && avgBuyRate > 0) ? Math.round(((currentSellingRateNum - avgBuyRate) / avgBuyRate) * 100) : 0;

 const exportToCSV = () => {
   if (!transactions || transactions.length === 0) {
     setFeedback({ type: 'error', text: 'داده‌ای برای خروجی گرفتن وجود ندارد.' });
     return;
   }

 const headers = ['کد کاربری', 'نام کاربر', 'ایمیل/تلفن', 'مدل/بخش', 'نوع تراکنش', 'مقدار توکن', 'مبلغ (تومان)', 'مانده پس از تراکنش', 'تاریخ'];
 const rows = transactions.map((tx: any) => {
 const userCode = `UC-${10000 + tx.userId}`;
 const name = tx.userName || 'بدون نام';
 const contact = tx.userEmail || tx.userPhone || tx.userTelegramId || '';
 const model = tx.model || tx.type || '';
 const type = tx.amount > 0 ? 'افزایش اعتبار' : 'مصرف';
 const tokens = tx.tokensUsed || 0;
 const amount = tx.amount || 0;
 const balance = tx.balanceAfter || 0;
 const date = formatTehranDateTime(tx.createdAt);

 return [userCode, name, contact, model, type, tokens, amount, balance, date].map(val => `"${val}"`).join(',');
 });

 const csvContent = [headers.join(','), ...rows].join('\n');
 const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
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
 <td>${tx.model || tx.type || '-'}</td>
 <td dir="ltr" style="color: ${isPositive ? 'green' : 'inherit'}">${isPositive ? '+' : ''}${tx.amount.toLocaleString()}</td>
 <td>${tx.balanceAfter ? tx.balanceAfter.toLocaleString() : '-'}</td>
 <td dir="ltr">${formatTehranDateTime(tx.createdAt)}</td>
 </tr>
 `;
 }).join('');

 const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
 <meta charset="UTF-8" />
 <title>گزارش تراکنش‌ها</title>
 <style>
 @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
 body { font-family: 'Vazirmatn', sans-serif; padding: 20px; direction: rtl; }
 h2 { text-align: center; margin-bottom: 20px; }
 table { width: 100%; border-collapse: collapse; font-size: 12px; }
 th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
 th { background-color: #f4f4f5; }
 @media print {
 @page { size: A4 portrait; margin: 1cm; }
 button { display: none; }
 }
 </style>
</head>
<body>
 <h2>گزارش تراکنش‌ها و مصرف توکن</h2>
 <table>
 <thead>
 <tr>
 <th>کاربر</th>
 <th>اطلاعات تماس</th>
 <th>نوع/مدل</th>
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

 const iframe = document.createElement('iframe');
 iframe.style.position = 'fixed';
 iframe.style.right = '-10000px';
 iframe.style.bottom = '-10000px';
 document.body.appendChild(iframe);

 const doc = iframe.contentWindow?.document;
 if (doc) {
 doc.open();
 doc.write(html);
 doc.close();

 // Wait for font loading/rendering before printing
 setTimeout(() => {
 iframe.contentWindow?.focus();
 iframe.contentWindow?.print();
 // Remove iframe after printing
 setTimeout(() => {
 document.body.removeChild(iframe);
 }, 1000);
 }, 500);
  } else {
    document.body.removeChild(iframe);
    setFeedback({ type: 'error', text: 'خطا در ایجاد خروجی چاپ.' });
  }
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

   {/* Confirmation Modal for Purchase Deletion */}
   <AdminConfirmModal
     isOpen={Boolean(purchaseToDelete)}
     title="حذف فاکتور خرید دلاری"
     description="آیا از حذف این رکورد خرید مطمئن هستید؟ این عملیات غیرقابل بازگشت است."
     confirmLabel="بله، حذف کن"
     cancelLabel="انصراف"
     isDanger={true}
     loading={isDeletingPurchase}
     onConfirm={executeDeletePurchase}
     onClose={() => setPurchaseToDelete(null)}
   />

 {/* Live Provider API Balances Widget */}
 {liveBalances && liveBalances.length > 0 && (
 <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
 <DollarSign className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-bold text-xs text-[var(--text-main)]">
 استعلام لایو موجودی کلید {liveBalances[0].providerName}:
 </span>
 <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">
 ${liveBalances[0].remainingUsd.toFixed(2)}
 </span>
 <span className="text-[11px] text-[var(--text-muted)] font-mono">
 (سقف: ${liveBalances[0].hardLimitUsd} | مصرف: ${liveBalances[0].totalUsedUsd.toFixed(2)})
 </span>
 {liveBalances[0].baseTokens !== undefined && (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono" dir="rtl">
 <span>~{liveBalances[0].baseTokens.toLocaleString('fa-IR')} توکن سهمیه</span>
 {liveBalances[0].economyTokens ? (
 <span className="text-[10px] text-[var(--text-muted)] font-normal">
 (معادل ~{(liveBalances[0].economyTokens / 1000000).toFixed(1)}M توکن در مدل‌های اقتصادی)
 </span>
 ) : null}
 </span>
 )}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
 این موجودی به صورت زنده و مستقیم از سرور تأمین‌کننده ({liveBalances[0].baseUrl}) با API Key استعلام شده است.
 {liveBalances[0].baseTokens ? ` (هر ۱ دلار = ۵۰۰٬۰۰۰ واحد سهمیه پایه One-API)` : ''}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={fetchLiveBalances}
 disabled={liveLoading}
 className="px-4 py-2 rounded-xl clay-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
 <span>بروزرسانی استعلام</span>
 </button>
 {!hasPurchases && (
 <button
 onClick={() => {
 setPurchaseProvider(liveBalances[0].providerName);
 setPurchaseAmountUsd(String(liveBalances[0].hardLimitUsd || liveBalances[0].remainingUsd));
 setIsAddingPurchase(true);
 purchaseSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
 }}
 className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 transition-all"
 >
 <span>ثبت در مخزن حسابداری</span>
 </button>
 )}
 </div>
 </div>
 )}

 {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
 {/* Total USD Purchased */}
 <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-[var(--text-muted)]">مخزن کلیدها (خریداری شده)</span>
 <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
 <DollarSign className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1.5 mt-1">
 <span className="text-2xl font-black text-[var(--text-main)] font-mono" dir="ltr">
 ${(summary?.totalPurchasedUsd || 0).toFixed(2)}
 </span>
 <span className="text-xs font-medium text-zinc-400">اعتبار دلاری</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]  flex items-center justify-between">
 <span>پرداخت کل: <span className="font-bold text-[var(--text-main)]">{(summary?.totalSpentToman || 0).toLocaleString('fa-IR')}</span> تومان</span>
 {!hasPurchases && (
 <button
 type="button"
 onClick={() => {
 setIsAddingPurchase(true);
 purchaseSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
 }}
 className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
 >
 + ثبت فاکتور خرید
 </button>
 )}
 </div>
 </div>

 {/* Average Buy Rate vs Selling Rate */}
 <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-[var(--text-muted)]">نرخ خرید vs نرخ فروش</span>
 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
 <TrendingUp className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1.5 mt-1">
 <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">
 {hasPurchases ? `+${profitMarginPercent}%` : '—'}
 </span>
 <span className="text-xs font-medium text-zinc-400">حاشیه سود</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)]  flex justify-between items-center">
 <span>خرید: <b className="text-[var(--text-main)]">{hasPurchases ? `${avgBuyRate.toLocaleString('fa-IR')} ت` : 'ثبت نشده'}</b></span>
 <span>فروش: <b className="text-[var(--text-main)]">{currentSellingRateNum.toLocaleString('fa-IR')} ت</b></span>
 </div>
 </div>

 {/* Consumed USD / Tokens */}
 <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-[var(--text-muted)]">مصرف کاربران</span>
 <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
 <Zap className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1.5 mt-1">
 <span className="text-2xl font-black text-[var(--text-main)] font-mono" dir="ltr">
 ${(summary?.totalConsumedUsd || 0).toFixed(4)}
 </span>
 <span className="text-xs font-medium text-zinc-400">دلار</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)] ">
 معادل <span className="font-bold text-[var(--text-main)]">{(summary?.totalTokensUsed || 0).toLocaleString('fa-IR')}</span> توکن چت
 </div>
 </div>

 {/* Remaining Treasury USD */}
 <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-[var(--text-muted)]">مانده اعتبار در مخزن</span>
 <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
 <Coins className="w-4 h-4" />
 </div>
 </div>
 <div className="flex items-baseline gap-1.5 mt-1">
 <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono" dir="ltr">
 ${(summary?.remainingTreasuryUsd || 0).toFixed(2)}
 </span>
 <span className="text-xs font-medium text-zinc-400">باقی‌مانده</span>
 </div>
 </div>
 <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)] ">
 درآمد کسر شده: <span className="font-bold text-[var(--text-main)]">{(summary?.totalDeductedToman || 0).toLocaleString('fa-IR')}</span> تومان
          </div>
        </div>

        {/* Subsidized Free Usage Monitoring */}
        <div className="p-4 rounded-2xl clay-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">یارانه و سهمیه رایگان</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono" dir="ltr">
                {(summary?.freeStats?.totalFreeCostToman || 0).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs font-medium text-zinc-400">تومان یارانه</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-2.5 pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
            <span>{toPersianDigits(summary?.freeStats?.totalFreeMessages || 0)} پیام چت</span>
            <span>~{toPersianDigits(Math.round((summary?.freeStats?.totalFreeTokens || 0) / 1000))}K توکن</span>
          </div>
        </div>
      </div>

  {/* Promo Codes Manager */}
  <div className="mb-6">
    <PromoCodesManager />
  </div>

  {/* Settings Info Card (Single Source of Truth: AdminSettingsTab) */}
  <div className="p-4 rounded-2xl clay-subcard flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6">
    <div className="flex items-center gap-2.5 text-[var(--text-main)]">
      <Receipt className="w-4 h-4 text-[var(--color-accent-primary)] shrink-0" />
      <span>
        نرخ فروش دلار API، درگاه‌های بانکی (زرین‌پال و بازارپی) و سهمیه‌های مصرف در تب <strong>تنظیمات یکپارچه</strong> مدیریت می‌شوند.
      </span>
    </div>
    <div className="flex items-center gap-2 font-mono text-xs shrink-0">
      <span className="text-[var(--text-muted)]">نرخ فعال سیستم:</span>
      <span className="font-bold text-[var(--color-accent-primary)]">{currentSellingRateNum.toLocaleString('fa-IR')} تومان</span>
    </div>
  </div>

  {/* API Purchases Management Section */}
 <div ref={purchaseSectionRef} className="p-5 rounded-2xl clay-card space-y-4">
 <div className="flex items-center justify-between border-b border-[var(--card-border)]  pb-3">
 <div className="flex items-center gap-2">
 <Layers className="w-5 h-5 text-emerald-500" />
 <div>
 <h3 className="text-sm font-bold text-[var(--text-main)]">فاکتورهای خرید ارز و کلیدهای API</h3>
 <p className="text-[11px] text-zinc-500">ثبت خریدهای مختلف شما از ری‌سلرها و محاسبه خودکار قیمت تمام‌شده</p>
 </div>
 </div>
 <button
 onClick={() => setIsAddingPurchase(!isAddingPurchase)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 <span>{isAddingPurchase ? 'بستن فرم' : 'ثبت فاکتور جدید'}</span>
 </button>
 </div>

 {/* Add Purchase Form */}
 {isAddingPurchase && (
 <form onSubmit={handleAddPurchase} className="p-4 rounded-2xl clay-surface space-y-3 animate-slideDown">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
 <div>
 <label className="font-bold text-[var(--text-main)] block mb-1">نام تأمین‌کننده / پرووایدر:</label>
 <input
 type="text"
 value={purchaseProvider}
 onChange={(e) => setPurchaseProvider(e.target.value)}
 placeholder="مثلاً: ری‌سلر ایرانی A، صرافی، ..."
 required
 className="w-full px-3 py-2 rounded-xl clay-surface focus:border-blue-500 outline-none"
 />
 </div>

 <div>
 <label className="font-bold text-[var(--text-main)] block mb-1">مقدار دلار خریداری‌شده ($):</label>
 <input
 type="number"
 step="0.01"
 value={purchaseAmountUsd}
 onChange={(e) => setPurchaseAmountUsd(e.target.value)}
 placeholder="20"
 required
 className="w-full px-3 py-2 rounded-xl clay-surface font-mono focus:border-blue-500 outline-none"
 />
 </div>

 <div>
 <label className="font-bold text-[var(--text-main)] block mb-1">مبلغ پرداختی شما به تومان:</label>
 <input
 type="number"
 value={purchaseCostToman}
 onChange={(e) => setPurchaseCostToman(e.target.value)}
 placeholder="1000000"
 required
 className="w-full px-3 py-2 rounded-xl clay-surface font-mono focus:border-blue-500 outline-none"
 />
 </div>
 </div>

 {currentUnitRate > 0 && (
 <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
 <span>محاسبه خودکار سیستم: قیمت تمام‌شده هر ۱ دلار خرید =</span>
 <span className="text-sm font-black font-mono">{currentUnitRate.toLocaleString('fa-IR')} تومان</span>
 </div>
 )}

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setIsAddingPurchase(false)}
 className="px-3 py-1.5 rounded-xl clay-btn text-[var(--text-muted)] text-xs font-bold"
 >
 انصراف
 </button>
 <button
 type="submit"
 disabled={actionLoading}
 className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50"
 >
 ثبت فاکتور
 </button>
 </div>
 </form>
 )}

 {/* Purchases Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-xs text-right">
 <thead>
 <tr className="border-b border-[var(--card-border)]  text-zinc-400">
 <th className="py-2.5 px-3">تأمین‌کننده</th>
 <th className="py-2.5 px-3">مبلغ دلاری</th>
 <th className="py-2.5 px-3">پرداختی تومانی</th>
 <th className="py-2.5 px-3">نرخ هر دلار</th>
 <th className="py-2.5 px-3">تاریخ</th>
 <th className="py-2.5 px-3 text-center">عملیات</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--card-border)]">
 {summary?.purchases && summary.purchases.length > 0 ? (
 summary.purchases.map((p: any) => (
 <tr key={p.id} className="hover:bg-[var(--color-input-bg)]/40">
 <td className="py-2.5 px-3 font-bold text-[var(--text-main)]">{p.providerName}</td>
 <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-bold" dir="ltr">${p.amountUsd}</td>
 <td className="py-2.5 px-3 font-mono">{p.costToman.toLocaleString('fa-IR')} تومان</td>
 <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{p.unitRateToman.toLocaleString('fa-IR')} ت</td>
 <td className="py-2.5 px-3 text-zinc-400">{formatTehranDate(p.createdAt)}</td>
 <td className="py-2.5 px-3 text-center">
 <button
 onClick={() => handleDeletePurchase(p.id)}
 className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
 title="حذف فاکتور"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="py-8 text-center text-zinc-400">
 هنوز فاکتور خریدی ثبت نشده است. با دکمه «ثبت فاکتور جدید» اولین خرید ارزی خود را وارد کنید.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Aggregated per-user consumption */}
 <div className="p-5 rounded-2xl clay-card space-y-4">
  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[var(--card-border)] pb-4 gap-3">
   <div className="flex items-center gap-2">
    <Users className="w-5 h-5 text-blue-500" />
    <h3 className="text-sm font-bold text-[var(--text-main)]">تجمیع مصرف کاربران</h3>
   </div>
   <div className="flex items-center gap-2 w-full sm:w-auto">
    <input
     type="text"
     placeholder="جستجوی نام، موبایل یا کد کاربری (UC-10027)..."
     value={usageSearch}
     onChange={(e) => setUsageSearch(e.target.value)}
     className="w-full sm:w-72 px-3 py-1.5 rounded-xl clay-surface text-xs focus:outline-none focus:border-blue-500 transition-colors"
    />
    <button
     onClick={() => fetchUsageSummary(usageSearch)}
     className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer shrink-0"
     title="بروزرسانی"
    >
     <RefreshCw className="w-4 h-4" />
    </button>
   </div>
  </div>

  <div className="overflow-x-auto">
   <table className="w-full text-xs text-right">
    <thead>
     <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)]">
      <th className="py-3 px-3.5 font-bold">کاربر</th>
      <th className="py-3 px-3.5 font-bold">پیام</th>
      <th className="py-3 px-3.5 font-bold">توکن کل</th>
      <th className="py-3 px-3.5 font-bold">یارانه رایگان</th>
      <th className="py-3 px-3.5 font-bold">مصرفی (تومان)</th>
      <th className="py-3 px-3.5 font-bold">هزینه (دلار)</th>
      <th className="py-3 px-3.5 font-bold">آخرین استفاده</th>
     </tr>
    </thead>
    <tbody className="divide-y divide-[var(--card-border)]">
     {usageRows.length > 0 ? (
      usageRows.map((r: any) => (
       <tr key={r.userId} className="hover:bg-[var(--color-input-bg)]/40 transition-colors">
        <td className="py-3 px-3.5">
         <div className="flex flex-col gap-0.5">
          <span className="font-bold text-[var(--text-main)]">
           {r.userName || r.userEmail || r.userPhone || 'بدون نام'}
          </span>
          <span className="text-[11px] text-zinc-400">
           کد کاربری: <span className="font-mono font-semibold text-[var(--text-muted)]">UC-{toPersianDigits(10000 + r.userId)}</span>
          </span>
         </div>
        </td>
        <td className="py-3 px-3.5 font-semibold text-[var(--text-main)]">
         {toPersianDigits(r.messageCount)}
        </td>
        <td className="py-3 px-3.5">
         <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-[var(--text-main)]">{toPersianDigits(r.totalTokens)}</span>
          <span className="text-[10px] text-zinc-400">
           {toPersianDigits(r.promptTokens)} ورودی / {toPersianDigits(r.completionTokens)} خروجی
          </span>
         </div>
        </td>
        <td className="py-3 px-3.5">
         {r.freeMessages > 0 ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400">{toPersianDigits(r.freeMessages)} پیام</span>
         ) : (
          <span className="text-zinc-400">—</span>
         )}
        </td>
        <td className="py-3 px-3.5 font-bold text-[var(--text-main)]">
         {toPersianDigits(r.paidToman + r.imageToman)}
        </td>
        <td className="py-3 px-3.5 font-semibold text-zinc-600 dark:text-zinc-300">
         {Number(r.costUsd || 0).toFixed(4)}
        </td>
        <td className="py-3 px-3.5 text-[var(--text-muted)]">
         {r.lastUsedAt ? formatTehranDate(r.lastUsedAt) : '—'}
        </td>
       </tr>
      ))
     ) : (
      <tr>
       <td colSpan={7} className="py-8 text-center text-zinc-400">
        مصرفی برای نمایش وجود ندارد.
       </td>
      </tr>
     )}
    </tbody>
   </table>
  </div>
 </div>

 {/* User Usage Logs */}
 <div className="p-5 rounded-2xl clay-card space-y-4">
 <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-[var(--card-border)]  pb-4 gap-4">
 <div className="flex items-center gap-2">
 <Clock className="w-5 h-5 text-purple-500" />
 <h3 className="text-sm font-bold text-[var(--text-main)]">آخرین تراکنش‌ها و مصرف توکن</h3>
 </div>
 <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto flex-wrap">
 <div className="relative w-full sm:w-64">
 <input type="text" placeholder="جستجوی لایو کاربر، ID یا مدل..."
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
 <option value="all">همه تراکنش‌ها</option>
 <option value="deposit">افزایش اعتبار (+)</option>
 <option value="deduct">مصرف (-)</option>
                <option value="free_usage">یارانه و سهمیه رایگان (۰ تومان)</option>
                <option value="image_usage">تصویرسازی استودیویی</option>
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
 className="h-9 flex items-center justify-center px-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
 title="چاپ / دانلود PDF"
 >
 <span>PDF / چاپ</span>
 </button>
 <button
 onClick={exportToCSV}
 className="h-9 flex items-center justify-center px-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
 title="دانلود اکسل / CSV"
 >
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
 <tr className="border-b border-[var(--card-border)]  text-[var(--text-muted)]">
 <th className="py-3 px-3.5 font-bold">کاربر</th>
 <th className="py-3 px-3.5 font-bold">نوع / مدل</th>
 <th className="py-3 px-3.5 font-bold">توکن مصرفی</th>
 <th className="py-3 px-3.5 font-bold">مبلغ تراکنش</th>
 <th className="py-3 px-3.5 font-bold">مانده حساب</th>
 <th className="py-3 px-3.5 font-bold">تاریخ</th>
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
 <span className="inline-flex items-center px-2 py-0.5 rounded-md clay-btn text-[var(--text-main)] font-mono text-[11px] font-medium">
 {tx.model || tx.description || tx.type}
 </span>
 </td>
 <td className="py-3 px-3.5">
 {tx.promptTokens + tx.completionTokens > 0 ? (
 <div className="flex items-center gap-1">
 <span className="font-semibold text-[var(--text-main)] text-xs">
 {(tx.promptTokens + tx.completionTokens).toLocaleString('fa-IR')}
 </span>
 <span className="text-[10px] text-zinc-400">توکن</span>
 </div>
 ) : (
 <span className="text-zinc-400">—</span>
 )}
 </td>
 <td className="py-3 px-3.5">
 <div className="flex items-center gap-1">
 <span className={`font-bold text-xs ${
 isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'
 }`}>
 {isPositive ? `+${Math.abs(tx.amount).toLocaleString('fa-IR')}` : `-${Math.abs(tx.amount).toLocaleString('fa-IR')}`}
 </span>
 <span className="text-[10px] text-zinc-400">تومان</span>
 </div>
 </td>
 <td className="py-3 px-3.5">
 <div className="flex items-center gap-1">
 <span className="font-semibold text-zinc-600 dark:text-zinc-300 text-xs">
 {tx.balanceAfter != null ? tx.balanceAfter.toLocaleString('fa-IR') : '—'}
 </span>
 <span className="text-[10px] text-zinc-400">ت</span>
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
 <td colSpan={6} className="py-8 text-center text-zinc-400">
 هنوز تراکنشی ثبت نشده است.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Controls */}
 <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)] ">
 <button
 onClick={() => setPage(p => Math.max(1, p - 1))}
 disabled={page === 1}
 className="px-3 py-1.5 text-xs font-bold rounded-lg clay-btn text-[var(--text-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 صفحه قبل
 </button>
 <span className="text-xs font-mono text-[var(--text-muted)]">
 صفحه {toPersianDigits(page)} از {toPersianDigits(Math.max(1, Math.ceil(totalCount / LIMIT)))}
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
