import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { formatTehranDate } from '../lib/dateUtils';
import { useUIStore } from '../store/uiStore';
import { Coins, X, Sparkles, CreditCard,
 ShieldCheck,
 Loader2,
 Gift,
 Zap,
 Clock,
 TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isBazaarEnvironment } from '../lib/bazaarUtils';

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
 const isBazaar = isBazaarEnvironment() || Boolean(user?.email?.endsWith('@bazaar.guest'));

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
 body: JSON.stringify({ 
  amount,
  gateway: (isBazaarEnvironment() || Boolean(user?.email?.endsWith('@bazaar.guest'))) ? 'bazaarpay' : 'zarinpal'
 })
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

 // Custom amount preset options
 const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
 <div className="relative w-full max-w-xl clay-modal overflow-hidden flex flex-col max-h-[90vh]"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)]  clay-surface-inset">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
 <Coins className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">کیف پول و مدیریت اعتبار</h2>
 <p className="text-xs text-zinc-500">شفافیت کامل در محاسبه توکن‌ها و هزینه‌ها</p>
 </div>
 </div>
 <button onClick={() => setIsWalletOpen(false)}
 className="w-9 h-9 flex items-center justify-center rounded-xl clay-icon-btn cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Balance Card Banner */}
 <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border-b border-[var(--card-border)] ">
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

 <div className="flex items-center gap-2 clay-surface backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-[var(--card-border)] text-xs">
 <Zap className="w-4 h-4 text-amber-500 shrink-0" />
 <div>
 <span className="text-zinc-500 dark:text-zinc-400 block type-badge">تخمین اعتبار باقی‌مانده:</span>
 <span className="font-bold text-zinc-800 dark:text-zinc-200" dir="ltr">
 ~{approxRemainingTokens.toLocaleString('fa-IR')} توکن
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Tab Switcher */}
 <div className="flex border-b border-[var(--card-border)]  px-5 pt-3 clay-surface-inset">
 <button
 onClick={() => setActiveTab('packages')}
 className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
 activeTab === 'packages'
 ? 'text-blue-600 dark:text-blue-400'
 : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
 }`}
 >
 شارژ و افزایش اعتبار
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

 {/* Special Offer Card / Promo Section */}
 <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 dark:border-amber-500/40 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4">
 <div className="flex items-start gap-3">
 <div className="p-2 rounded-xl bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
 <Gift className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
 پیشنهاد ویژه و آفرهای تخفیف
 </span>
 <span className="type-badge font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
 آفر فعال
 </span>
 </div>
 <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
 {currentBalance < 20000 ? (
 <span>
 موجودی شما رو به اتمام است! با هر شارژ بالای ۵۰,۰۰۰ تومان، <strong className="text-amber-600 dark:text-amber-400">۲۰٪ بونوس هدیه اعتباری</strong> به کیف پول شما اضافه می‌شود.
 </span>
 ) : (
 <span>
 اعتبار شما با تعرفه مستقیم آزاد و بدون تاریخ انقضا محاسبه می‌شود. در زمان اتمام بسته یا مناسبت‌های خاص، تخفیف‌ها و آفرهای اختصاصی در این بخش برای شما فعال خواهند شد.
 </span>
 )}
 </p>
 </div>
 </div>
 </div>

 {/* Custom Top-up Card */}
 <div className="p-4 rounded-2xl clay-card space-y-3.5">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
 <CreditCard className="w-4 h-4 text-emerald-500" />
 <span>افزایش موجودی و شارژ کیف پول (تومان)</span>
 </label>
 <span className="type-badge text-zinc-400">حداقل ۵,۰۰۰ تومان</span>
 </div>

 {/* Quick Presets */}
 <div>
 <div className="type-badge text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium">مبالغ پیشنهادی سریع:</div>
 <div className="flex flex-wrap gap-2">
 {PRESET_AMOUNTS.map((amt) => {
 const isSelected = customAmount === amt.toString();
 return (
 <button
 key={amt}
 type="button"
 onClick={() => setCustomAmount(amt.toString())}
 className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
 isSelected
 ? 'clay-btn-primary'
 : 'clay-btn-secondary text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
 }`}
 >
 {amt.toLocaleString('fa-IR')} تومان
 </button>
 );
 })}
 </div>
 </div>

 {/* Input & Action */}
 <div className="flex flex-col sm:flex-row gap-2 pt-1">
 <div className="relative flex-1">
 <input
 type="number"
 min="5000"
 step="1000"
 placeholder="مثلاً ۵۰,۰۰۰"
 value={customAmount}
 onChange={(e) => setCustomAmount(e.target.value)}
 className="w-full pl-12 pr-3 py-2.5 text-sm font-semibold clay-input rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-500"
 />
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
 تومان
 </span>
 </div>

 <button
 onClick={() => {
 const val = parseInt(customAmount, 10);
 if (val >= 5000) handlePayOnline(val, 'custom');
 }}
 disabled={rechargingPackId === 'custom' || !customAmount || parseInt(customAmount, 10) < 5000}
 className="px-5 py-2.5 clay-btn-primary text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
 >
 {rechargingPackId === 'custom' ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>در حال انتقال...</span>
 </>
 ) : (
 <>
 <CreditCard className="w-4 h-4" />
 <span>{isBazaar ? 'پرداخت مستقیم با بازارپی' : 'پرداخت آنلاین با شتاب'}</span>
 </>
 )}
 </button>
 </div>

 {/* Tokens Estimation info */}
 {customAmount && parseInt(customAmount, 10) >= 5000 && (
 <div className="type-badge text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
 <Sparkles className="w-3.5 h-3.5 text-blue-500" />
 <span>
 معادل تقریبی: <strong className="text-emerald-600 dark:text-emerald-400">{(parseInt(customAmount, 10) * 5).toLocaleString('fa-IR')} توکن چت هوشمند</strong>
 </span>
 </div>
 )}
 </div>

 {/* General Policy Note */}
 <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 type-badge">
 <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
 <span>اعتبار شما هرگز منقضی نمی‌شود و تنها به میزان مصرف کلمات و درخواست‌های ارسالی کسر می‌گردد.</span>
 </div>

 <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
 <span className="flex items-center gap-1.5">
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 {isBazaar ? 'اتصال امن به درگاه مستقیم بازارپی (کافه‌بازار)' : 'اتصال امن به درگاه رسمی شاپرک (زرین‌پال)'}
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
 <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl clay-card text-xs"
 >
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
 tx.type === 'bonus' ? 'bg-amber-500/10 text-amber-500'
 : isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'clay-btn-secondary text-zinc-600 dark:text-zinc-300'
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
 <div className="flex items-center gap-2 type-badge text-zinc-400 mt-0.5">
 <span>{formatTehranDate(tx.createdAt)}</span>
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
 <span className="type-badge text-zinc-400 block" dir="rtl">
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
