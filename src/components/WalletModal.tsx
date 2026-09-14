import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { 
  Coins, 
  X, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  CreditCard,
  Zap,
  TrendingDown,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WalletModal: React.FC = () => {
  const { isWalletOpen, setIsWalletOpen } = useUIStore();
  const { user, token, setWalletBalance } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');
  const [walletData, setWalletData] = useState<{
    walletBalance: number;
    sellingRate: number;
    transactions: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [rechargingPackId, setRechargingPackId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (isWalletOpen && token) {
      fetchWalletData();
    }
  }, [isWalletOpen, token]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
        if (typeof data.walletBalance === 'number') {
          setWalletBalance(data.walletBalance);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wallet info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnline = async (amount: number, packId?: string) => {
    if (!token) {
      setIsWalletOpen(false);
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    setPayError(null);
    setRechargingPackId(packId || 'custom');
    try {
      const res = await fetch('/api/store/wallet-topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err: any) {
      setPayError(err.message || 'خطا در ارتباط با درگاه پرداخت');
      setRechargingPackId(null);
    }
  };

  if (!isWalletOpen) return null;

  const currentBalance = user?.walletBalance ?? walletData?.walletBalance ?? 0;
  const sellingRate = walletData?.sellingRate || 200000;
  // Estimate tokens: sellingRate Tomans = 1,000,000 tokens of standard model
  const approxRemainingTokens = Math.max(0, Math.round((currentBalance / sellingRate) * 1_000_000));

  const rechargePacks = [
    {
      id: 'pack-20k',
      amount: 20000,
      title: 'بسته پایه',
      tokenEstimate: 'حدود ۱۰۰,۰۰۰ توکن',
      description: 'مناسب برای کارهای روزمره و پرسش‌های سریع',
      badge: null,
      color: 'blue'
    },
    {
      id: 'pack-50k',
      amount: 50000,
      title: 'بسته استاندارد',
      tokenEstimate: 'حدود ۲۵۰,۰۰۰ توکن',
      description: 'پرطرفدارترین بسته برای پژوهش و کدنویسی',
      badge: 'محبوب‌ترین',
      color: 'emerald'
    },
    {
      id: 'pack-100k',
      amount: 100000,
      title: 'بسته پیشرفته',
      tokenEstimate: 'حدود ۵۰۰,۰۰۰ توکن',
      description: 'برای استفاده فشرده از مدل‌های برتر مثل Claude و GPT-4o',
      badge: null,
      color: 'purple'
    },
    {
      id: 'pack-200k',
      amount: 200000,
      title: 'بسته حرفه‌ای',
      tokenEstimate: 'بیش از ۱,۰۰۰,۰۰۰ توکن',
      description: 'حداکثر ظرفیت برای پردازش اسناد حجیم و پروژه‌های سنگین',
      badge: 'به‌صرفه‌ترین',
      color: 'amber'
    }
  ];

  const handleSelectPackage = (pack: typeof rechargePacks[0]) => {
    setIsWalletOpen(false);
    // Navigate to store or open checkout with message
    navigate('/store');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">کیف پول و مدیریت اعتبار</h2>
              <p className="text-xs text-zinc-500">شفافیت کامل در محاسبه توکن‌ها و هزینه‌ها</p>
            </div>
          </div>
          <button 
            onClick={() => setIsWalletOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card Banner */}
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">موجودی فعلی حساب:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {currentBalance.toLocaleString('fa-IR')}
                </span>
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">تومان</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">تخمین اعتبار باقی‌مانده:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200" dir="ltr">
                  ~{approxRemainingTokens.toLocaleString('fa-IR')} توکن
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 pt-3 bg-zinc-50/30 dark:bg-zinc-900/30">
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'packages'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            بسته‌های شارژ اعتباری
            {activeTab === 'packages' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'history'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            تاریخچه تراکنش‌ها و مصرف
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'packages' ? (
            <div className="space-y-4">
              {payError && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs">
                  {payError}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
                <span>بدون اشتراک ماهیانه؛ اعتبار شما هرگز منقضی نمی‌شود و تنها به ازای کلماتی که چت می‌کنید مصرف می‌گردد.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rechargePacks.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => handlePayOnline(pack.amount, pack.id)}
                    className="relative flex flex-col justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer group"
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-md">
                        {pack.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{pack.title}</span>
                        <div className="flex items-baseline gap-1 text-blue-600 dark:text-blue-400 font-black text-base">
                          <span>{pack.amount.toLocaleString('fa-IR')}</span>
                          <span className="text-xs font-normal">تومان</span>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1" dir="rtl">
                        {pack.tokenEstimate}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {pack.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-[-2px] transition-transform">
                      <span>{rechargingPackId === pack.id ? 'در حال اتصال به درگاه...' : 'پرداخت آنلاین و شارژ'}</span>
                      {rechargingPackId === pack.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Amount Recharge */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                  یا شارژ با مبلغ دلخواه (تومان):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    placeholder="حداقل ۵,۰۰۰ تومان"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(customAmount, 10);
                      if (val >= 5000) handlePayOnline(val, 'custom');
                    }}
                    disabled={rechargingPackId === 'custom' || !customAmount || parseInt(customAmount, 10) < 5000}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {rechargingPackId === 'custom' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    <span>پرداخت با شتاب</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  اتصال به درگاه رسمی شاپرک (زرین‌پال)
                </span>
                <button
                  onClick={() => {
                    setIsWalletOpen(false);
                    navigate('/store');
                  }}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  مشاهده همه محصولات فروشگاه
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12 text-zinc-400 text-xs">در حال بارگذاری تراکنش‌ها...</div>
              ) : walletData?.transactions && walletData.transactions.length > 0 ? (
                walletData.transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          tx.type === 'bonus' 
                            ? 'bg-amber-500/10 text-amber-500'
                            : isPositive 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                        }`}>
                          {tx.type === 'bonus' ? (
                            <Sparkles className="w-4 h-4" />
                          ) : isPositive ? (
                            <CreditCard className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                            {tx.description || (isPositive ? 'افزایش موجودی' : `مصرف چت (${tx.model || 'عمومی'})`)}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>{new Date(tx.createdAt).toLocaleDateString('fa-IR')}</span>
                            {tx.promptTokens + tx.completionTokens > 0 && (
                              <>
                                <span>•</span>
                                <span>{(tx.promptTokens + tx.completionTokens).toLocaleString('fa-IR')} توکن</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className={`font-black font-mono text-sm block ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'
                        }`} dir="ltr">
                          {isPositive ? `+${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()}`} تومان
                        </span>
                        <span className="text-[10px] text-zinc-400 block" dir="rtl">
                          مانده: {tx.balanceAfter?.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  هنوز تراکنشی در حساب شما ثبت نشده است.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
