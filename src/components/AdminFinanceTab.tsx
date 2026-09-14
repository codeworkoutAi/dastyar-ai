import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  DollarSign, 
  Layers, 
  User, 
  Clock, 
  Receipt,
  Gift,
  CreditCard,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AdminFinanceTab: React.FC = () => {
  const { token } = useAuthStore();
  const purchaseSectionRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('newest'); // newest, oldest, alpha_asc, alpha_desc
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  // Settings state
  const [sellingRate, setSellingRate] = useState('200000');
  const [welcomeBonus, setWelcomeBonus] = useState('50000');
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState(true);
  const [freeKeyPool, setFreeKeyPool] = useState('');

  // Zarinpal Gateway state
  const [zarinpalMerchantId, setZarinpalMerchantId] = useState('');
  const [zarinpalSandbox, setZarinpalSandbox] = useState(false);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [detectedServerIp, setDetectedServerIp] = useState<string | null>(null);

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
    fetchSettings();
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
        setTransactions(txData);
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
        setTransactions(txData);
      }
    } catch (err: any) {
      console.error('Failed to fetch finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const [resSettings, resGateway] = await Promise.all([
        fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/gateway-status', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resSettings.ok) {
        const settings = await resSettings.json();
        if (settings.api_dollar_rate) setSellingRate(settings.api_dollar_rate);
        if (settings.welcome_bonus_amount) setWelcomeBonus(settings.welcome_bonus_amount);
        if (settings.welcome_bonus_enabled) setWelcomeBonusEnabled(settings.welcome_bonus_enabled === 'true');
        if (settings.free_key_pool) setFreeKeyPool(settings.free_key_pool);
        if (settings.zarinpal_merchant_id) setZarinpalMerchantId(settings.zarinpal_merchant_id);
        if (settings.zarinpal_sandbox !== undefined) setZarinpalSandbox(settings.zarinpal_sandbox === 'true');
      }
      if (resGateway.ok) {
        const gw = await resGateway.json();
        if (gw.merchantId) setZarinpalMerchantId(gw.merchantId);
        if (gw.sandbox !== undefined) setZarinpalSandbox(gw.sandbox);
        if (gw.serverIp) setDetectedServerIp(gw.serverIp);
        setGatewayEnabled(gw.enabled);
      }
    } catch (err) {}
  };

  const handleSaveSettings = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await Promise.all([
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'api_dollar_rate', value: sellingRate })
        }),
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'welcome_bonus_amount', value: welcomeBonus })
        }),
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'welcome_bonus_enabled', value: String(welcomeBonusEnabled) })
        }),
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'free_key_pool', value: freeKeyPool })
        }),
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'zarinpal_merchant_id', value: zarinpalMerchantId.trim() })
        }),
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'zarinpal_sandbox', value: String(zarinpalSandbox) })
        })
      ]);

      setGatewayEnabled(zarinpalMerchantId.trim().length >= 30);
      setFeedback({ type: 'success', text: 'تنظیمات مالی و درگاه زرین‌پال با موفقیت ذخیره شد.' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در ذخیره تنظیمات' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestGateway = async () => {
    setTestingGateway(true);
    setGatewayTestResult(null);
    try {
      const res = await fetch('/api/admin/test-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ merchantId: zarinpalMerchantId.trim(), sandbox: zarinpalSandbox })
      });
      const data = await res.json();
      setGatewayTestResult(data);
    } catch (err: any) {
      setGatewayTestResult({ valid: false, message: 'خطا در برقراری ارتباط با سرور: ' + err.message });
    } finally {
      setTestingGateway(false);
    }
  };

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

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('آیا از حذف این رکورد خرید مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/admin/purchases/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFeedback({ type: 'success', text: 'رکورد با موفقیت حذف شد.' });
        fetchData();
      }
    } catch (err) {}
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
      alert('داده‌ای برای خروجی گرفتن وجود ندارد.');
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
      const date = new Date(tx.createdAt).toLocaleString('fa-IR');

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
      alert('داده‌ای برای خروجی گرفتن وجود ندارد.');
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
          <td dir="ltr">${new Date(tx.createdAt).toLocaleString('fa-IR')}</td>
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
      alert('خطا در ایجاد خروجی چاپ.');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Feedback notice */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
        </div>
      )}

      {/* Live Provider API Balances Widget */}
      {liveBalances && liveBalances.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  استعلام لایو موجودی کلید {liveBalances[0].providerName}:
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">
                  ${liveBalances[0].remainingUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  (سقف کل: ${liveBalances[0].hardLimitUsd} | مصرف‌شده: ${liveBalances[0].totalUsedUsd.toFixed(2)})
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                این موجودی به صورت زنده و مستقیم از سرور تأمین‌کننده ({liveBalances[0].baseUrl}) با API Key استعلام شده است.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchLiveBalances}
              disabled={liveLoading}
              className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total USD Purchased */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">مخزن کلیدها (خریداری شده)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono" dir="ltr">
                ${(summary?.totalPurchasedUsd || 0).toFixed(2)}
              </span>
              <span className="text-xs font-medium text-zinc-400">اعتبار دلاری</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-between">
            <span>پرداخت کل: <span className="font-bold text-zinc-700 dark:text-zinc-300">{(summary?.totalSpentToman || 0).toLocaleString('fa-IR')}</span> تومان</span>
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
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">نرخ خرید vs نرخ فروش</span>
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
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 flex justify-between items-center">
            <span>خرید: <b className="text-zinc-700 dark:text-zinc-300">{hasPurchases ? `${avgBuyRate.toLocaleString('fa-IR')} ت` : 'ثبت نشده'}</b></span>
            <span>فروش: <b className="text-zinc-700 dark:text-zinc-300">{currentSellingRateNum.toLocaleString('fa-IR')} ت</b></span>
          </div>
        </div>

        {/* Consumed USD / Tokens */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">مصرف کاربران</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono" dir="ltr">
                ${(summary?.totalConsumedUsd || 0).toFixed(4)}
              </span>
              <span className="text-xs font-medium text-zinc-400">دلار</span>
            </div>
          </div>
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
            معادل <span className="font-bold text-zinc-700 dark:text-zinc-300">{(summary?.totalTokensUsed || 0).toLocaleString('fa-IR')}</span> توکن چت
          </div>
        </div>

        {/* Remaining Treasury USD */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">مانده اعتبار در مخزن</span>
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
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
            درآمد کسر شده: <span className="font-bold text-zinc-700 dark:text-zinc-300">{(summary?.totalDeductedToman || 0).toLocaleString('fa-IR')}</span> تومان
          </div>
        </div>
      </div>

      {/* Currency & Business Settings Section */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">تنظیمات تبدیل ارز و تعرفه کاربران</h3>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تنظیمات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Selling Rate */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                نرخ فروش هر ۱ دلار API به کاربران (تومان):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={sellingRate}
                  onChange={(e) => setSellingRate(e.target.value)}
                  placeholder="200000"
                  className="w-full pl-14 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <span className="absolute left-3.5 top-2.5 text-zinc-400 dark:text-zinc-500 text-xs font-medium select-none pointer-events-none">تومان</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
              سیستم هزینه توکن‌های هر پیام را با این نرخ به تومان تبدیل و کسر می‌کند.
            </p>
          </div>

          {/* Welcome Bonus Amount */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                مبلغ اعتبار هدیه ثبت‌نام (تومان):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={welcomeBonus}
                  onChange={(e) => setWelcomeBonus(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-14 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <span className="absolute left-3.5 top-2.5 text-zinc-400 dark:text-zinc-500 text-xs font-medium select-none pointer-events-none">تومان</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="bonus-enable"
                checked={welcomeBonusEnabled}
                onChange={(e) => setWelcomeBonusEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="bonus-enable" className="text-zinc-600 dark:text-zinc-400 text-xs font-medium cursor-pointer">
                اعتبار هدیه خوش‌آمدگویی فعال باشد
              </label>
            </div>
          </div>

          {/* Free Key Pool Info */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                استخر کلیدهای رایگان (Round-Robin):
              </label>
              <textarea
                rows={2}
                value={freeKeyPool}
                onChange={(e) => setFreeKeyPool(e.target.value)}
                placeholder="کلیدهای متعدد Gemini یا Groq را با کاما یا خط جدید وارد کنید..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
              سیستم به نوبت (Round-Robin) از این کلیدها استفاده کرده و سقف درخواست را تقسیم می‌کند.
            </p>
          </div>
        </div>
      </div>

      {/* ZarinPal Payment Gateway Section */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-black">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">درگاه پرداخت اینترنتی شاپرک (زرین‌پال)</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  gatewayEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {gatewayEnabled ? 'درگاه متصل و فعال' : 'غیرفعال (درگاه آزمایشی)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">پذیرش پرداخت‌های ریالی کاربران با تمامی کارت‌های بانکی عضو شبکه شتاب (REST API v4)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestGateway}
              disabled={testingGateway || !zarinpalMerchantId.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {testingGateway ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
              <span>تست اتصال به زرین‌پال</span>
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ذخیره مرچنت</span>
            </button>
          </div>
        </div>

        {gatewayTestResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            gatewayTestResult.valid
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300'
          }`}>
            {gatewayTestResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <span>{gatewayTestResult.message}</span>
          </div>
        )}

        {detectedServerIp && (
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>آی‌پی عمومی این سرور برای ثبت در زرین‌پال:</span>
              <code className="font-mono font-bold bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700 select-all" dir="ltr">
                {detectedServerIp}
              </code>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(detectedServerIp);
                alert(`آی‌پی ${detectedServerIp} کپی شد.`);
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              کپی این آی‌پی
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Merchant ID */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              کد مرچنت درگاه (Merchant ID):
            </label>
            <input
              type="text"
              dir="ltr"
              value={zarinpalMerchantId}
              onChange={(e) => setZarinpalMerchantId(e.target.value)}
              placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              شناسه ۳۶ کاراکتری اختصاصی درگاه زرین‌پال شما برای هدایت مستقیم به صفحه پرداخت شاپرک.
            </p>
          </div>

          {/* Sandbox Toggle */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                محیط آزمایشی (Sandbox):
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sandbox-toggle"
                  checked={zarinpalSandbox}
                  onChange={(e) => setZarinpalSandbox(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sandbox-toggle" className="text-zinc-700 dark:text-zinc-300 text-xs font-medium cursor-pointer">
                  استفاده از سرور تست زرین‌پال (Sandbox)
                </label>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              برای درگاه واقعی متصل به حساب بانکی، این گزینه باید غیرفعال باشد.
            </p>
          </div>
        </div>
      </div>

      {/* API Purchases Management Section */}
      <div ref={purchaseSectionRef} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">فاکتورهای خرید ارز و کلیدهای API</h3>
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
          <form onSubmit={handleAddPurchase} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/30 space-y-3 animate-slideDown">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">نام تأمین‌کننده / پرووایدر:</label>
                <input
                  type="text"
                  value={purchaseProvider}
                  onChange={(e) => setPurchaseProvider(e.target.value)}
                  placeholder="مثلاً: ری‌سلر ایرانی A، صرافی، ..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">مقدار دلار خریداری‌شده ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchaseAmountUsd}
                  onChange={(e) => setPurchaseAmountUsd(e.target.value)}
                  placeholder="20"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">مبلغ پرداختی شما به تومان:</label>
                <input
                  type="number"
                  value={purchaseCostToman}
                  onChange={(e) => setPurchaseCostToman(e.target.value)}
                  placeholder="1000000"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono"
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
                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold"
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
              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400">
                <th className="py-2.5 px-3">تأمین‌کننده</th>
                <th className="py-2.5 px-3">مبلغ دلاری</th>
                <th className="py-2.5 px-3">پرداختی تومانی</th>
                <th className="py-2.5 px-3">نرخ هر دلار</th>
                <th className="py-2.5 px-3">تاریخ</th>
                <th className="py-2.5 px-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
              {summary?.purchases && summary.purchases.length > 0 ? (
                summary.purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">{p.providerName}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-bold" dir="ltr">${p.amountUsd}</td>
                    <td className="py-2.5 px-3 font-mono">{p.costToman.toLocaleString('fa-IR')} تومان</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{p.unitRateToman.toLocaleString('fa-IR')} ت</td>
                    <td className="py-2.5 px-3 text-zinc-400">{new Date(p.createdAt).toLocaleDateString('fa-IR')}</td>
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

      {/* User Usage Logs */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">آخرین تراکنش‌ها و مصرف توکن</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto flex-wrap">
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="جستجوی لایو کاربر، ID یا مدل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex w-full sm:w-auto gap-2 flex-wrap items-center">
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="h-9 px-2.5 flex-1 sm:flex-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
              >
                <option value="all">همه تراکنش‌ها</option>
                <option value="deposit">افزایش اعتبار (+)</option>
                <option value="deduct">مصرف (-)</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-2.5 flex-1 sm:flex-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
              >
                <option value="all">همه زمان‌ها</option>
                <option value="today">۲۴ ساعت گذشته</option>
                <option value="week">هفته گذشته</option>
                <option value="month">ماه گذشته</option>
              </select>

              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="h-9 px-2.5 flex-1 sm:flex-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
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
              <tr className="border-b border-zinc-200 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-3.5 font-bold">کاربر</th>
                <th className="py-3 px-3.5 font-bold">نوع / مدل</th>
                <th className="py-3 px-3.5 font-bold">توکن مصرفی</th>
                <th className="py-3 px-3.5 font-bold">مبلغ تراکنش</th>
                <th className="py-3 px-3.5 font-bold">مانده حساب</th>
                <th className="py-3 px-3.5 font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                            {tx.userName || tx.userEmail || tx.userPhone || 'بدون نام'}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-normal">
                            کد کاربری: <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">UC-{10000 + tx.userId}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 font-mono text-[11px] font-medium">
                          {tx.model || tx.description || tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        {tx.promptTokens + tx.completionTokens > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
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
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
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
                        <div className="flex flex-col text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                          <span>{new Date(tx.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('fa-IR')}</span>
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
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700/60">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            صفحه قبل
          </button>
          
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            صفحه {page}
          </span>
          
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!transactions || transactions.length < LIMIT}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            صفحه بعد
          </button>
        </div>
      </div>
    </div>
  );
};
