import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { 
  ShoppingBag, User as UserIcon, LifeBuoy, 
  Key, Package, CheckCircle2, XCircle, Clock, Save, Lock, LogOut,
  Receipt, Printer, ArrowRight, Home, ExternalLink, ShieldCheck, ChevronLeft, ChevronRight,
  Wallet, Zap, Coins, Cpu, MessageSquare, Plus, ArrowUpRight, ArrowDownLeft,
  Filter, Sparkles, RefreshCw, BarChart2, Gift, CreditCard,
  Search, Code, Eye, Copy, Store
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toPersianDigits } from '../../lib/persianUtils';
import { formatTehranDate, formatTehranDateTime, formatTehranShortDate } from '../../lib/dateUtils';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { GlobalHeader } from '../../components/GlobalHeader';
import { isBazaarEnvironment } from '../../lib/bazaarUtils';

export const UserDashboard = () => {
  const { user, token, checkAuth, logout, setWalletBalance } = useAuthStore();
  const { setIsWalletOpen } = useUIStore();
  const isBazaar = isBazaarEnvironment();
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wallet State
  const [walletData, setWalletData] = useState<{
    walletBalance: number;
    hasReceivedWelcomeBonus: boolean;
    sellingRate: number;
    transactions: any[];
  } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'wallet' | 'redeem'>('orders');
  const [txFilter, setTxFilter] = useState<'all' | 'deposits' | 'purchases'>('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const paidOrderId = searchParams.get('orderId');
  const paidRefId = searchParams.get('refId');
  const paidAmount = searchParams.get('amount');

  const navigate = useNavigate();



  useEffect(() => {
    if (paymentStatus === 'success') {
      fetchWalletData();
      fetchPurchases();
    }
  }, [paymentStatus]);

  // Redeem Code
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Profile Form
  const [profileData, setProfileData] = useState({ name: '', email: '', avatar: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const defaultAvatars = [
    '/avatars/avatar-1.svg',
    '/avatars/avatar-2.svg',
    '/avatars/avatar-3.svg',
    '/avatars/avatar-4.svg',
    '/avatars/avatar-5.svg',
    '/avatars/avatar-6.svg'
  ];

  // Password Form
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '', avatar: user.avatar || '' });
    }
  }, [user]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchPurchases();
    fetchWalletData();
  }, [token]);

  const fetchWalletData = async () => {
    if (!token) return;
    setWalletLoading(true);
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
      console.error('Error fetching wallet stats:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store/purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت سفارش‌ها');
      setPurchases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    try {
      setIsRedeeming(true);
      setRedeemMessage(null);
      const res = await fetch('/api/store/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey: redeemCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در فعال‌سازی کد');
      
      setRedeemMessage({ type: 'success', text: data.message });
      setRedeemCode('');
      fetchPurchases();
    } catch (err: any) {
      setRedeemMessage({ type: 'error', text: err.message });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بروزرسانی');
      setProfileMsg({ type: 'success', text: data.message });
      await checkAuth();
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPass(true);
    setPassMsg(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(passData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تغییر رمز عبور');
      setPassMsg({ type: 'success', text: data.message });
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const getStatusBadge = (status: string, licenseKey?: string, fulfillmentStatus?: string) => {
    if (status === 'success') {
      if (licenseKey || fulfillmentStatus === 'delivered') {
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14}/> تحویل شده</span>;
      }
      return <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5"><Clock size={14}/> در حال آماده‌سازی اکانت</span>;
    }
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5"><Clock size={14}/> در انتظار پرداخت</span>;
      case 'failed': return <span className="px-2.5 py-1 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5"><XCircle size={14}/> لغو شده</span>;
      default: return <span className="px-2.5 py-1 rounded-xl clay-btn-thick text-[#525d75] dark:text-[#9aa5bc] text-xs font-bold">{status}</span>;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen clay-landing-bg items-center justify-center p-6 font-sans transition-colors duration-300" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
        <div className="w-full max-w-md clay-card-thick p-8 text-center shadow-xl border border-[var(--card-border)] ">
          <div className="w-16 h-16 clay-btn-thick text-blue-600 dark:text-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-black dark:text-white mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>دسترسی به داشبورد</h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] mb-8 leading-relaxed">برای مشاهده وضعیت مصرف، کیف پول و مدیریت حساب کاربری ابتدا باید وارد شوید.</p>
          <button 
            onClick={() => {
              navigate('/');
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-auth-modal')), 500);
            }} 
            className="w-full py-3.5 clay-btn-primary-thick text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            ورود به حساب کاربری
          </button>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-xs font-bold text-[#525d75] dark:text-[#9aa5bc] hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <ArrowRight size={14} /> بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen clay-landing-bg font-sans pb-16 transition-colors duration-300" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
      {/* Top Navbar: Clean full-width glassmorphic header matching Blog/Store */}
      <GlobalHeader />

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        
        {/* Payment Result Alert Banner */}
        {paymentStatus === 'success' && (
          <div className="p-4 sm:p-5 rounded-3xl clay-card-thick border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-300" style={{ fontFamily: "'Estedad', sans-serif" }}>
                  {isBazaar ? 'پرداخت شما با موفقیت در بازارپی تأیید شد!' : 'پرداخت شما با موفقیت تأیید شد!'}
                </h4>
                <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-0.5">
                  {paidAmount ? `مبلغ ${toPersianDigits(Number(paidAmount).toLocaleString('fa-IR'))} تومان به کیف پول شما اضافه شد.` : 'کیف پول شما با موفقیت شارژ شد.'}
                  {paidOrderId && <span className="mr-2 font-mono text-[11px]">سفارش: {paidOrderId}</span>}
                  {paidRefId && <span className="mr-2 font-mono text-[11px]">پیگیری: {paidRefId}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('payment');
                next.delete('orderId');
                next.delete('refId');
                next.delete('amount');
                setSearchParams(next);
              }}
              className="px-3 py-1.5 clay-btn-thick text-xs font-bold text-zinc-600 dark:text-zinc-300 rounded-xl cursor-pointer"
            >
              بستن
            </button>
          </div>
        )}

        {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
          <div className="p-4 sm:p-5 rounded-3xl clay-card-thick border border-red-500/30 bg-red-500/10 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <XCircle size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm text-red-700 dark:text-red-300" style={{ fontFamily: "'Estedad', sans-serif" }}>
                  {paymentStatus === 'cancelled' ? 'پرداخت توسط شما لغو شد.' : 'تراکنش پرداخت ناموفق بود.'}
                </h4>
                <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-0.5">
                  هیچ مبلغی از حساب شما کسر نشده است. می‌توانید مجدداً اقدام به پرداخت نمایید.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('payment');
                setSearchParams(next);
              }}
              className="px-3 py-1.5 clay-btn-thick text-xs font-bold text-zinc-600 dark:text-zinc-300 rounded-xl cursor-pointer"
            >
              بستن
            </button>
          </div>
        )}

        {/* Row 1: Welcome & Quick Action Bar (Claymorphic) */}
        <div className="p-6 md:p-7 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-lg md:text-2xl font-black dark:text-white flex items-center gap-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
              <span>خوش آمدید، {user.name?.split(' ')[0] || 'کاربر عزیز'}</span>
              <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs md:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed max-w-2xl">
              مرکز مدیریت یکپارچه حساب کاربری، مانده کیف پول، مصرف توکن‌های هوش مصنوعی و سفارش‌های فروشگاه.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1 md:pt-0">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl clay-btn-thick text-[var(--text-main)] text-xs font-black transition-all cursor-pointer active:scale-95"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>مشاور هوشمند</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl clay-btn-primary-thick text-white text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <Store size={15} />
              <span>فروشگاه</span>
            </Link>
            <button
              onClick={() => setIsWalletOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl clay-btn-emerald-thick text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <Plus size={15} />
              <span>شارژ کیف پول</span>
            </button>
          </div>
        </div>

        {/* Row 2: 4 Key Store Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Wallet Balance (Emerald / Teal) */}
          <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Wallet size={15} />
                </div>
                <span>موجودی کیف پول</span>
              </span>
              <button
                onClick={() => setIsWalletOpen(true)}
                className="clay-pill-thick px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:scale-105 flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus size={12} />
                <span>شارژ سریع</span>
              </button>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                {toPersianDigits((user.walletBalance ?? walletData?.walletBalance ?? 0).toLocaleString('fa-IR'))}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">تومان</span>
            </div>
            <div className="text-[11px] flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5 mt-2">
              <span className="text-[#525d75] dark:text-[#9aa5bc]">وضعیت اعتبار:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">فعال (بدون انقضا)</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)] shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-blue-600 dark:text-cyan-400">
                  <Package size={15} />
                </div>
                <span>کل سفارش‌ها</span>
              </span>
              <span className="clay-pill-thick text-[10px] px-2.5 py-0.5 text-blue-600 dark:text-cyan-400 font-bold">
                فروشگاه
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl lg:text-3xl font-black text-blue-600 dark:text-cyan-400 tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                {toPersianDigits(purchases.length)}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">سفارش</span>
            </div>
            <div className="text-[11px] flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5 mt-2 text-[#525d75] dark:text-[#9aa5bc]">
              <span>مجموع خرید:</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400">
                {toPersianDigits(purchases.reduce((acc, p) => acc + (p.paymentStatus === 'success' ? (p.amount || 0) : 0), 0).toLocaleString('fa-IR'))} ت
              </span>
            </div>
          </div>

          {/* Card 3: Delivered Orders */}
          <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)] shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <CheckCircle2 size={15} />
                </div>
                <span>اکانت‌های تحویل‌شده</span>
              </span>
              <span className="clay-pill-thick text-[10px] px-2.5 py-0.5 text-teal-600 dark:text-teal-400 font-bold">
                فعال
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl lg:text-3xl font-black text-teal-600 dark:text-teal-400 tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                {toPersianDigits(purchases.filter(p => p.licenseKey || p.fulfillmentStatus === 'delivered').length)}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">لایسنس</span>
            </div>
            <div className="text-[11px] flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5 mt-2 text-[#525d75] dark:text-[#9aa5bc]">
              <span>پشتیبانی و گارانتی:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">۱۰۰٪ فعال</span>
            </div>
          </div>

          {/* Card 4: Preparing Orders */}
          <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)] shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock size={15} />
                </div>
                <span>در حال آماده‌سازی</span>
              </span>
              <span className="clay-pill-thick text-[10px] px-2.5 py-0.5 text-amber-600 dark:text-amber-400 font-bold">
                پیگیری
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                {toPersianDigits(purchases.filter(p => p.paymentStatus === 'success' && !p.licenseKey && p.fulfillmentStatus !== 'delivered').length)}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">سفارش</span>
            </div>
            <div className="text-[11px] flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5 mt-2 text-[#525d75] dark:text-[#9aa5bc]">
              <span>زمان میانگین تحویل:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">۱ تا ۲۴ ساعت</span>
            </div>
          </div>

        </div>

        {/* Row 3: Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Account Settings (Profile & Security) */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            
            {/* Profile Card */}
            <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg flex flex-col gap-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
                <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-blue-500">
                  <UserIcon size={15} />
                </div>
                <h3 className="font-black text-sm dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>اطلاعات کاربری</h3>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Fixed Avatar Picker: Clean 6-Column Single Row Grid */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    انتخاب آواتار
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {defaultAvatars.map((url, i) => {
                      const isSelected = profileData.avatar === url || (!profileData.avatar && i === 0);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setProfileData({...profileData, avatar: url})}
                          className={`relative p-1 rounded-2xl transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'clay-btn-thick ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 scale-105 shadow-md shadow-blue-500/25 bg-blue-500/10'
                              : 'clay-btn-thick opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          title={`آواتار ${i + 1}`}
                        >
                          <img src={url} alt={`avatar-${i}`} className="w-8 h-8 rounded-xl object-cover bg-white " />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">نام شما</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={e => setProfileData({...profileData, name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-2xl clay-inset-thick outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-xs transition-all border border-transparent font-medium" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">ایمیل</label>
                  <input 
                    type="email" 
                    value={profileData.email} 
                    onChange={e => setProfileData({...profileData, email: e.target.value})} 
                    className="w-full px-4 py-3 rounded-2xl clay-inset-thick outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-xs transition-all border border-transparent font-medium text-left" 
                    dir="ltr" 
                  />
                </div>

                {user.phone && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">شماره موبایل</label>
                    <input 
                      type="text" 
                      value={user.phone} 
                      disabled 
                      className="w-full px-4 py-3 rounded-2xl clay-inset-thick text-xs text-left opacity-70 cursor-not-allowed" 
                      dir="ltr" 
                    />
                  </div>
                )}
                
                {profileMsg && (
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'}`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 size={15}/> : <XCircle size={15}/>} 
                    <span>{profileMsg.text}</span>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile} 
                  className="w-full py-3 mt-1 clay-btn-primary-thick text-white rounded-2xl text-xs font-black flex justify-center items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: "'Estedad', sans-serif" }}
                >
                  <Save size={15} /> 
                  <span>{isUpdatingProfile ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
                </button>
              </form>
            </div>

            {/* Security Card: Fixed Button Color & Clay Styling */}
            <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg flex flex-col gap-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-black/5 dark:border-white/5">
                <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-blue-500">
                  <ShieldCheck size={15} />
                </div>
                <h3 className="font-black text-sm dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>امنیت حساب</h3>
              </div>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">رمز عبور فعلی</label>
                  <input 
                    type="password" 
                    value={passData.currentPassword} 
                    onChange={e => setPassData({...passData, currentPassword: e.target.value})} 
                    className="w-full px-4 py-3 rounded-2xl clay-inset-thick outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-xs transition-all border border-transparent" 
                    dir="ltr" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">رمز عبور جدید</label>
                  <input 
                    type="password" 
                    value={passData.newPassword} 
                    onChange={e => setPassData({...passData, newPassword: e.target.value})} 
                    minLength={6} 
                    className="w-full px-4 py-3 rounded-2xl clay-inset-thick outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-xs transition-all border border-transparent" 
                    dir="ltr" 
                    required 
                  />
                </div>
                
                {passMsg && (
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'}`}>
                    {passMsg.type === 'success' ? <CheckCircle2 size={15}/> : <XCircle size={15}/>} 
                    <span>{passMsg.text}</span>
                  </div>
                )}
                
                {/* Fixed Color: True Clay Button with Proper Contrast */}
                <button 
                  type="submit" 
                  disabled={isUpdatingPass} 
                  className="w-full py-3 mt-1 clay-btn-thick text-blue-600 dark:text-cyan-400 font-extrabold rounded-2xl text-xs flex justify-center items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-98 disabled:opacity-50 border border-blue-500/20"
                  style={{ fontFamily: "'Estedad', sans-serif" }}
                >
                  <Lock size={15} /> 
                  <span>{isUpdatingPass ? 'در حال ثبت...' : 'تغییر رمز عبور'}</span>
                </button>
              </form>
            </div>
            
          </div>

          {/* Right Column: Segmented Tabs & Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6 order-1 lg:order-2">
            
            {/* Segmented Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl clay-inset-thick border border-black/5 dark:border-white/5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'clay-btn-thick text-blue-600 dark:text-cyan-400 shadow-sm'
                    : 'text-[#525d75] dark:text-[#9aa5bc] hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Package size={15} className={activeTab === 'orders' ? 'text-blue-500 dark:text-cyan-400' : ''} />
                <span>سفارش‌ها و لایسنس‌ها ({toPersianDigits(purchases.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'clay-btn-thick text-blue-600 dark:text-cyan-400 shadow-sm'
                    : 'text-[#525d75] dark:text-[#9aa5bc] hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Wallet size={15} className={activeTab === 'wallet' ? 'text-blue-500 dark:text-cyan-400' : ''} />
                <span>کیف پول و تراکنش‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('redeem')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'redeem'
                    ? 'clay-btn-thick text-blue-600 dark:text-cyan-400 shadow-sm'
                    : 'text-[#525d75] dark:text-[#9aa5bc] hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Gift size={15} className={activeTab === 'redeem' ? 'text-blue-500 dark:text-cyan-400' : ''} />
                <span>کارت هدیه و فعال‌سازی کد</span>
              </button>
            </div>

            {/* TAB 1: Store Orders History (Default & Primary Focus) */}
            {activeTab === 'orders' && (
              <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)] shadow-lg flex-1 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <Package size={15} />
                    </div>
                    <h3 className="font-black text-sm dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                      سفارش‌های فعال و لایسنس‌های من
                    </h3>
                  </div>
                  {!isBazaar && (
                    <Link to="/store" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-cyan-400 flex items-center gap-1">
                      <span>مشاهده فروشگاه</span> <ChevronLeft size={14} />
                    </Link>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 -mr-2 space-y-3 hide-scrollbar">
                  {loading ? (
                    <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-[var(--card-border)] border-t-blue-600 rounded-full animate-spin"></div></div>
                  ) : purchases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-14 h-14 clay-btn-thick rounded-2xl flex items-center justify-center mb-3 shadow-xs text-zinc-500">
                        <ShoppingBag size={20} />
                      </div>
                      <p className="text-xs font-bold dark:text-white mb-1">هنوز سفارشی ثبت نشده است</p>
                      <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] mb-4">می‌توانید اکانت‌های مورد نیاز خود را از فروشگاه خریداری کنید.</p>
                      <Link
                        to="/store"
                        className="px-5 py-2.5 rounded-2xl clay-btn-primary-thick text-white text-xs font-black shadow-md shadow-blue-500/20"
                        style={{ fontFamily: "'Estedad', sans-serif" }}
                      >
                        ورود به فروشگاه
                      </Link>
                    </div>
                  ) : (
                    purchases.map(p => (
                      <div key={p.orderId} className="p-4 rounded-2xl clay-inset-thick flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0" alt="order" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl clay-btn-thick flex items-center justify-center shrink-0 text-zinc-500"><Package size={18}/></div>
                          )}
                          <div>
                            <h4 className="font-bold text-xs dark:text-white mb-1">{p.title}</h4>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                              <span dir="ltr">{formatTehranDate(p.orderDate)}</span>
                              <span>•</span>
                              <span className="font-bold text-zinc-700 dark:text-zinc-300">{p.amount.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between border-t border-black/5 dark:border-white/5 sm:border-0 pt-2 sm:pt-0">
                          {getStatusBadge(p.paymentStatus, p.licenseKey, p.fulfillmentStatus)}
                          
                          <div className="flex items-center gap-1.5">
                            {p.paymentStatus === 'pending' && !isBazaar && (
                              <a 
                                href={`/api/store/mock-payment?orderId=${p.orderId}`}
                                className="flex items-center gap-1 px-2.5 py-1.5 clay-btn-primary-thick text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer hover:scale-105"
                              >
                                <CreditCard size={12} /> پرداخت آنلاین
                              </a>
                            )}
                            <button 
                              onClick={() => setSelectedInvoice(p)}
                              className="flex items-center gap-1.5 px-3 py-1.5 clay-btn-thick rounded-xl text-[11px] font-bold transition-all cursor-pointer hover:scale-105"
                            >
                              <Receipt size={12} /> فاکتور
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Wallet Transactions */}
            {activeTab === 'wallet' && (
              <div className="flex flex-col gap-6">
                
                {/* Transactions Table Section */}
                <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)] shadow-lg flex flex-col min-h-[420px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        <Clock size={15} />
                      </div>
                      <h3 className="font-black text-sm dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                        تاریخچه تراکنش‌های کیف پول
                      </h3>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1 clay-inset-thick p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTxFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          txFilter === 'all'
                            ? 'clay-btn-thick text-zinc-900 dark:text-white shadow-xs'
                            : 'text-[#525d75] hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        همه
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxFilter('deposits')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          txFilter === 'deposits'
                            ? 'clay-btn-thick text-emerald-600 dark:text-emerald-400 shadow-xs'
                            : 'text-[#525d75] hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        شارژ و واریزی
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxFilter('purchases')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          txFilter === 'purchases'
                            ? 'clay-btn-thick text-blue-600 dark:text-cyan-400 shadow-xs'
                            : 'text-[#525d75] hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        خریدها
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 -mr-1 space-y-3 hide-scrollbar">
                    {walletLoading ? (
                      <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-2 border-[var(--card-border)] border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    ) : !walletData?.transactions || walletData.transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 clay-btn-thick text-emerald-500 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                          <Wallet size={24} />
                        </div>
                        <h4 className="font-bold text-sm mb-1 dark:text-white">هنوز تراکنشی ثبت نشده است</h4>
                        <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] max-w-sm mb-4 leading-relaxed">
                          می‌توانید موجودی کیف پول خود را برای خرید سریع‌تر اکانت‌ها شارژ نمایید.
                        </p>
                        <button
                          onClick={() => setIsWalletOpen(true)}
                          className="px-5 py-2.5 rounded-2xl clay-btn-primary-thick text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                          style={{ fontFamily: "'Estedad', sans-serif" }}
                        >
                          شارژ کیف پول
                        </button>
                      </div>
                    ) : (
                      walletData.transactions
                        .filter(tx => {
                          if (txFilter === 'deposits') return tx.type === 'deposit' || tx.type === 'welcome_bonus';
                          if (txFilter === 'purchases') return tx.type === 'store_purchase' || tx.type === 'chat_usage';
                          return true;
                        })
                        .map(tx => {
                          const isPurchase = tx.type === 'store_purchase' || tx.type === 'chat_usage';
                          const isBonus = tx.type === 'welcome_bonus';

                          return (
                            <div
                              key={tx.id}
                              className="p-4 rounded-2xl clay-inset-thick flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-2xl clay-btn-thick flex items-center justify-center shrink-0 ${
                                    isPurchase
                                      ? 'text-blue-600 dark:text-cyan-400'
                                      : isBonus
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-teal-600 dark:text-teal-400'
                                  }`}
                                >
                                  {isPurchase ? <ShoppingBag size={18} /> : isBonus ? <Gift size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs dark:text-white">
                                    {tx.description || (isPurchase ? 'پرداخت سفارش فروشگاه' : 'تراکنش کیف پول')}
                                  </h4>
                                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
                                    <span dir="ltr">
                                      {formatTehranDateTime(tx.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between border-t border-black/5 dark:border-white/5 sm:border-0 pt-2 sm:pt-0">
                                <span
                                  className={`text-xs font-black ${
                                    isPurchase
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isPurchase ? '-' : '+'}
                                  {toPersianDigits(Math.abs(tx.amount).toLocaleString('fa-IR'))} تومان
                                </span>
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                  مانده: {toPersianDigits(Number(tx.balanceAfter || 0).toLocaleString('fa-IR'))} ت
                                </span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Store Orders History */}
            {activeTab === 'orders' && (
              <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg flex-1 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl clay-btn-thick flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <Package size={15} />
                    </div>
                    <h3 className="font-black text-sm dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                      تاریخچه سفارش‌های فروشگاه
                    </h3>
                  </div>
                  {!isBazaar && (
                    <Link to="/store" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-cyan-400 flex items-center gap-1">
                      <span>مشاهده فروشگاه</span> <ChevronLeft size={14} />
                    </Link>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 -mr-2 space-y-3 hide-scrollbar">
                  {loading ? (
                    <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-[var(--card-border)] border-t-blue-600 rounded-full animate-spin"></div></div>
                  ) : purchases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-14 h-14 clay-btn-thick rounded-2xl flex items-center justify-center mb-3 shadow-xs text-zinc-500">
                        <ShoppingBag size={20} />
                      </div>
                      <p className="text-xs font-bold dark:text-white mb-1">هیچ سفارشی ثبت نشده است</p>
                      <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc]">اولین خرید خود را از فروشگاه انجام دهید.</p>
                    </div>
                  ) : (
                    purchases.map(p => (
                      <div key={p.orderId} className="p-4 rounded-2xl clay-inset-thick flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0" alt="order" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl clay-btn-thick flex items-center justify-center shrink-0 text-zinc-500"><Package size={18}/></div>
                          )}
                          <div>
                            <h4 className="font-bold text-xs dark:text-white mb-1">{p.title}</h4>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                              <span dir="ltr">{formatTehranDate(p.orderDate)}</span>
                              <span>•</span>
                              <span className="font-bold text-zinc-700 dark:text-zinc-300">{p.amount.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between border-t border-black/5 dark:border-white/5 sm:border-0 pt-2 sm:pt-0">
                          {getStatusBadge(p.paymentStatus, p.licenseKey, p.fulfillmentStatus)}
                          
                          <div className="flex items-center gap-1.5">
                            {p.paymentStatus === 'pending' && !isBazaar && (
                              <a 
                                href={`/api/store/mock-payment?orderId=${p.orderId}`}
                                className="flex items-center gap-1 px-2.5 py-1.5 clay-btn-primary-thick text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer hover:scale-105"
                              >
                                <CreditCard size={12} /> پرداخت آنلاین
                              </a>
                            )}
                            <button 
                              onClick={() => setSelectedInvoice(p)}
                              className="flex items-center gap-1.5 px-3 py-1.5 clay-btn-thick rounded-xl text-[11px] font-bold transition-all cursor-pointer hover:scale-105"
                            >
                              <Receipt size={12} /> فاکتور
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Redeem License Section */}
            {activeTab === 'redeem' && (
              <div className="p-5 md:p-6 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex-1">
                    <h3 className="font-black text-base mb-1.5 flex items-center gap-2 dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                      <Key size={18} className="text-blue-500 dark:text-cyan-400" />
                      <span>فعال‌سازی لایسنس (Redeem)</span>
                    </h3>
                    <p className="text-[#525d75] dark:text-[#9aa5bc] text-xs leading-relaxed max-w-md">
                      اگر کدی از طریق تلگرام یا سایر پلتفرم‌ها دریافت کرده‌اید، برای اتصال خدمات به این حساب وارد کنید.
                    </p>
                  </div>
                  
                  <form onSubmit={handleRedeem} className="flex-1 flex flex-col sm:flex-row gap-2.5 w-full">
                    <input 
                      type="text" 
                      value={redeemCode} 
                      onChange={(e) => setRedeemCode(e.target.value)} 
                      placeholder="X7Y9-ABCD-1234" 
                      dir="ltr" 
                      className="flex-1 px-4 py-3 rounded-2xl clay-inset-thick outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-xs transition-all border border-transparent font-mono"
                    />
                    <button 
                      type="submit" 
                      disabled={isRedeeming || !redeemCode.trim()} 
                      className="px-6 py-3 clay-btn-primary-thick text-white rounded-2xl font-black text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                      style={{ fontFamily: "'Estedad', sans-serif" }}
                    >
                      {isRedeeming ? '...' : 'فعال‌سازی'}
                    </button>
                  </form>
                </div>
                
                {redeemMessage && (
                  <div className={`mt-4 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${redeemMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'}`}>
                    {redeemMessage.type === 'success' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                    <span>{redeemMessage.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Support Card (Full Claymorphic Redesign) */}
            <div className="p-6 rounded-3xl clay-card-thick border border-[var(--card-border)]  shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
              <div className="flex items-center gap-4 text-center sm:text-right">
                <div className="w-13 h-13 clay-btn-thick text-blue-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center shrink-0 mx-auto sm:mx-0 shadow-xs">
                  <LifeBuoy size={24} />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base dark:text-white mb-1" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    نیاز به راهنمایی دارید؟
                  </h4>
                  <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                    تیم پشتیبانی ما همیشه آماده پاسخگویی و راهنمایی به شماست.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))}
                className="w-full sm:w-auto px-6 py-3 clay-btn-primary-thick text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 hover:shadow-cyan-500/25 transition-all cursor-pointer shrink-0 active:scale-95"
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                ارسال پیام
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedInvoice(null)}>
          <div 
            className="w-full max-w-2xl clay-modal overflow-y-auto max-h-[90vh] p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--card-border)] custom-scrollbar" 
            onClick={e => e.stopPropagation()}
          >
            <div id="invoice-print-area">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-black/5 dark:border-white/5 border-dashed">
                <div>
                  <h3 className="text-lg font-black dark:text-white flex items-center gap-2 mb-1" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    <ShoppingBag className="text-blue-500 w-5 h-5" /> چت‌باکس
                  </h3>
                  <p className="text-xs text-[#525d75] dark:text-[#9aa5bc]">فاکتور کالا و خدمات دیجیتال</p>
                </div>
                <div className="text-left clay-inset-thick p-2.5 rounded-xl">
                  <div className="text-xs font-bold dark:text-white mb-1" dir="ltr">#{selectedInvoice.orderId.split('-')[1] || selectedInvoice.orderId}</div>
                  <div className="text-[10px] text-zinc-500" dir="ltr">{formatTehranShortDate(selectedInvoice.orderDate)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-3 clay-inset-thick rounded-xl">
                  <span className="font-semibold text-[#525d75] dark:text-[#9aa5bc]">نام محصول:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{selectedInvoice.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 clay-inset-thick rounded-xl">
                  <span className="font-semibold text-[#525d75] dark:text-[#9aa5bc]">وضعیت پرداخت:</span>
                  {getStatusBadge(selectedInvoice.paymentStatus, selectedInvoice.licenseKey, selectedInvoice.fulfillmentStatus)}
                </div>
                {!selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (
                  <div className="flex flex-col gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mt-4 text-xs font-semibold text-blue-800 dark:text-blue-300">
                    <span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-cyan-400">
                      <Clock size={15} />
                      سفارش شما در حال آماده‌سازی و تحویل است
                    </span>
                    <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                      مشخصات اکانت یا لایسنس شما توسط پشتیبانی در حال آماده‌سازی است و به زودی در همین بخش و از طریق تلگرام و پیامک تحویل خواهد شد.
                    </p>
                  </div>
                )}
                {selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (
                  <div className="flex flex-col gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mt-4">
                    <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">{selectedInvoice.licenseKey.startsWith('http') ? 'لینک فعال‌سازی اختصاصی شما:' : 'کد لایسنس اختصاصی شما:'}
                    </span>
                    {selectedInvoice.licenseKey.startsWith('http') ? (
                      <div className="relative group">
                        <a 
                          href={selectedInvoice.licenseKey}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] sm:text-xs leading-relaxed break-all font-semibold text-blue-700 dark:text-cyan-300 hover:text-blue-800 dark:hover:text-cyan-200 hover:underline underline-offset-4 clay-inset-thick p-3 sm:px-4 sm:py-3 pe-12 sm:pe-14 rounded-xl transition-all block" 
                          dir="ltr"
                        >
                          {selectedInvoice.licenseKey}
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(selectedInvoice.licenseKey);
                            const el = e.currentTarget;
                            const originalHTML = el.innerHTML;
                            el.innerHTML = '<span class="text-[10px] font-sans">کپی شد</span>';
                            setTimeout(() => { el.innerHTML = originalHTML; }, 2000);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-2 p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-cyan-400 rounded-lg transition-colors border border-blue-500/20 flex items-center justify-center min-w-[32px] min-h-[32px]"
                          title="کپی لینک"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-center tracking-widest text-base font-bold text-blue-600 dark:text-cyan-400 clay-inset-thick py-2.5 rounded-xl select-all" dir="ltr">{selectedInvoice.licenseKey}</span>
                    )}
                  </div>
                )}
                
                {selectedInvoice.deliveryGuide && selectedInvoice.paymentStatus === 'success' && selectedInvoice.licenseKey && (
                  <div className="flex flex-col gap-2 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mt-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      راهنمای تحویل و استفاده:
                    </span>
                    <div className="text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-300 leading-normal prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-sm prose-p:text-[11px]">
                      <MarkdownRenderer content={selectedInvoice.deliveryGuide} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 border-dashed flex justify-between items-center">
                <span className="text-sm font-semibold text-[#525d75] dark:text-[#9aa5bc]">مبلغ کل:</span>
                <span className="text-lg font-black text-blue-600 dark:text-cyan-400" style={{ fontFamily: "'Estedad', sans-serif" }}>
                  {selectedInvoice.amount.toLocaleString('fa-IR')} <span className="text-xs font-bold">تومان</span>
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 px-4 py-3 rounded-2xl font-bold text-xs clay-btn-thick text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                بستن
              </button>
              <button 
                onClick={() => {
                  const printContent = document.getElementById('invoice-print-area');
                  const originalBody = document.body.innerHTML;
                  if (printContent) {
                    document.body.innerHTML = printContent.innerHTML;
                    window.print();
                    document.body.innerHTML = originalBody;
                    window.location.reload();
                  }
                }}
                className="flex-1 px-4 py-3 rounded-2xl font-bold text-xs clay-btn-primary-thick text-white flex justify-center items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Printer size={15} /> چاپ فاکتور
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





