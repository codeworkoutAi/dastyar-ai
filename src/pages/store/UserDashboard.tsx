import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { 
  ShoppingBag, User as UserIcon, LifeBuoy, 
  Key, Package, CheckCircle2, XCircle, Clock, Save, Lock, LogOut,
  Receipt, Printer, ArrowRight, Home, ExternalLink, ShieldCheck, ChevronLeft,
  Wallet, Zap, Coins, Cpu, MessageSquare, Plus, ArrowUpRight, ArrowDownLeft,
  Filter, Sparkles, RefreshCw, BarChart2, Gift, CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toPersianDigits } from '../../lib/persianUtils';

export const UserDashboard = () => {
  const { user, token, checkAuth, logout, setWalletBalance } = useAuthStore();
  const { setIsWalletOpen } = useUIStore();
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wallet & Usage Stats
  const [walletData, setWalletData] = useState<{
    walletBalance: number;
    hasReceivedWelcomeBonus: boolean;
    sellingRate: number;
    stats: {
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      totalSpentToman: number;
      totalMessages: number;
      modelBreakdown: { model: string; messageCount: number; tokens: number; costToman: number }[];
    };
    transactions: any[];
  } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'orders' | 'redeem'>('wallet');
  const [txFilter, setTxFilter] = useState<'all' | 'chat' | 'deposits'>('all');

  const navigate = useNavigate();

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
      await checkAuth(); // Refresh user data
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 size={14}/> تکمیل شده</span>;
      case 'pending': return <span className="px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs font-semibold flex items-center gap-1.5"><Clock size={14}/> در انتظار بررسی</span>;
      case 'failed': return <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5"><XCircle size={14}/> لغو شده</span>;
      default: return <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 text-xs font-semibold">{status}</span>;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-8 text-center shadow-xl shadow-zinc-200/40 dark:shadow-none">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">دسترسی غیرمجاز</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">برای مشاهده پنل کاربری اختصاصی خود ابتدا باید وارد حساب کاربری شوید.</p>
          <button 
            onClick={() => {
              navigate('/');
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-auth-modal')), 500);
            }} 
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            ورود به حساب کاربری
          </button>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            <ArrowRight size={16} /> بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 font-sans pb-16 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <ArrowRight size={18} />
          </Link>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white hidden sm:block">داشبورد کاربری</h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <Link to="/store" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
            <ExternalLink size={16} /> <span className="hidden sm:inline">فروشگاه</span>
          </Link>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700"></div>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-2">
            <LogOut size={16} /> <span className="hidden sm:inline">خروج</span>
          </button>
          <div className="flex items-center gap-3 mr-2">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-sm">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-zinc-400" />}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-8 space-y-6">
        
        {/* Row 1: Welcome & Quick Action Bar */}
        <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white mb-1.5 flex items-center gap-2">
              <span>خوش آمدید، {user.name?.split(' ')[0] || 'کاربر عزیز'}</span>
              <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
              مرکز مدیریت یکپارچه حساب کاربری، مانده کیف پول، مصرف توکن‌های هوش مصنوعی و سفارش‌های فروشگاه.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <MessageSquare size={15} />
              <span>ورود به چت‌باکس</span>
            </Link>
            <button
              onClick={() => setIsWalletOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>شارژ کیف پول</span>
            </button>
          </div>
        </div>

        {/* Row 2: 4 Key Metric Cards (KPI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Wallet Balance */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 hover:dark:border-emerald-500/40 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <Wallet size={16} className="text-emerald-600 dark:text-emerald-400" />
                موجودی کیف پول
              </span>
              <button
                onClick={() => setIsWalletOpen(true)}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                شارژ سریع
              </button>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {toPersianDigits((user.walletBalance ?? walletData?.walletBalance ?? 0).toLocaleString('fa-IR'))}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">تومان</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-zinc-800 mt-2">
              <span>مدل پرداختی:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Pay-As-You-Go</span>
            </div>
          </div>

          {/* Card 2: Total Tokens */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent dark:bg-zinc-900 border border-blue-200/80 dark:border-zinc-800 hover:dark:border-blue-500/40 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                کل توکن‌های مصرفی
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 dark:border dark:border-blue-800/40 text-blue-700 dark:text-blue-400 font-bold">
                تجمعی
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {toPersianDigits((walletData?.stats?.totalTokens || 0).toLocaleString('fa-IR'))}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">توکن</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-blue-100 dark:border-zinc-800 mt-2">
              <span>ورودی: {toPersianDigits((walletData?.stats?.promptTokens || 0).toLocaleString('fa-IR'))}</span>
              <span>خروجی: {toPersianDigits((walletData?.stats?.completionTokens || 0).toLocaleString('fa-IR'))}</span>
            </div>
          </div>

          {/* Card 3: Total Spent */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent dark:bg-zinc-900 border border-purple-200/80 dark:border-zinc-800 hover:dark:border-purple-500/40 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-400 flex items-center gap-1.5">
                <Coins size={16} className="text-purple-600 dark:text-purple-400" />
                کل هزینه کسر شده
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 dark:border dark:border-purple-800/40 text-purple-700 dark:text-purple-400 font-bold">
                چت AI
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl lg:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                {toPersianDigits((walletData?.stats?.totalSpentToman || 0).toLocaleString('fa-IR'))}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">تومان</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-purple-100 dark:border-zinc-800 mt-2">
              <span>میانگین هر پیام:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {walletData?.stats?.totalMessages ? toPersianDigits(Math.round((walletData.stats.totalSpentToman / walletData.stats.totalMessages)).toLocaleString('fa-IR')) : '۰'} ت
              </span>
            </div>
          </div>

          {/* Card 4: Total Messages */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:bg-zinc-900 border border-amber-200/80 dark:border-zinc-800 hover:dark:border-amber-500/40 shadow-xs flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <MessageSquare size={16} className="text-amber-600 dark:text-amber-400" />
                گفتگوهای انجام‌شده
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 dark:border dark:border-amber-800/40 text-amber-700 dark:text-amber-400 font-bold">
                پیام‌ها
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {toPersianDigits((walletData?.stats?.totalMessages || 0).toLocaleString('fa-IR'))}
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">پیام</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-amber-100 dark:border-zinc-800 mt-2">
              <span>سفارش‌های فروشگاه:</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">{toPersianDigits(purchases.length)} مورد</span>
            </div>
          </div>
        </div>

        {/* Row 3: Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Account Settings */}
          <div className="flex flex-col gap-6">
            
            {/* Profile Card */}
            <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col gap-6">
              
              {/* Profile Section */}
              <div>
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <UserIcon size={16} className="text-blue-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">اطلاعات کاربری</h3>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">انتخاب آواتار</label>
                    <div className="flex flex-wrap gap-1.5">
                      {defaultAvatars.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setProfileData({...profileData, avatar: url})}
                          className={`relative p-1 rounded-full transition-all ${
                            (profileData.avatar === url || (!profileData.avatar && i === 0))
                              ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <img src={url} alt={`avatar-${i}`} className="w-7 h-7 rounded-full bg-white dark:bg-zinc-700" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">نام شما</label>
                    <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs transition-all text-zinc-900 dark:text-zinc-100" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">ایمیل</label>
                    <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs transition-all text-left text-zinc-900 dark:text-zinc-100" dir="ltr" />
                  </div>
                  {user.phone && (
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">شماره موبایل</label>
                      <input type="text" value={user.phone} disabled className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-xs text-left opacity-70" dir="ltr" />
                    </div>
                  )}
                  
                  {profileMsg && <div className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>{profileMsg.type === 'success' ? <CheckCircle2 size={13}/> : <XCircle size={13}/>} {profileMsg.text}</div>}
                  
                  <button type="submit" disabled={isUpdatingProfile} className="w-full py-2.5 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 hover:shadow-md disabled:opacity-50">
                    <Save size={14} /> {isUpdatingProfile ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </button>
                </form>
              </div>
            </div>

            {/* Security Card */}
            <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col gap-6">
              {/* Password Section */}
              <div>
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <ShieldCheck size={16} className="text-zinc-500 dark:text-zinc-400" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">امنیت حساب</h3>
                </div>
                
                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">رمز عبور فعلی</label>
                    <input type="password" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs transition-all text-zinc-900 dark:text-zinc-100" dir="ltr" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">رمز عبور جدید</label>
                    <input type="password" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} minLength={6} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs transition-all text-zinc-900 dark:text-zinc-100" dir="ltr" required />
                  </div>
                  
                  {passMsg && <div className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>{passMsg.type === 'success' ? <CheckCircle2 size={13}/> : <XCircle size={13}/>} {passMsg.text}</div>}
                  
                  <button type="submit" disabled={isUpdatingPass} className="w-full py-2.5 mt-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 transition-all disabled:opacity-50">
                    <Lock size={14} /> {isUpdatingPass ? 'در حال ثبت...' : 'تغییر رمز عبور'}
                  </button>
                </form>
              </div>
              
            </div>
            
          </div>

          {/* Right Column: Segmented Tabs & Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Segmented Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Zap size={15} className={activeTab === 'wallet' ? 'text-blue-500' : ''} />
                <span>مصرف توکن و کیف پول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Package size={15} className={activeTab === 'orders' ? 'text-blue-500' : ''} />
                <span>سفارش‌ها ({toPersianDigits(purchases.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('redeem')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'redeem'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Key size={15} className={activeTab === 'redeem' ? 'text-blue-500' : ''} />
                <span>فعال‌سازی کد</span>
              </button>
            </div>

            {/* TAB 1: Token Usage & Wallet Transactions */}
            {activeTab === 'wallet' && (
              <div className="flex flex-col gap-6">
                {/* Model Breakdown Section */}
                {walletData?.stats?.modelBreakdown && walletData.stats.modelBreakdown.length > 0 && (
                  <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <BarChart2 size={16} className="text-indigo-500" />
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white">تفکیک مصرف بر اساس مدل‌های هوش مصنوعی</h3>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {toPersianDigits(walletData.stats.modelBreakdown.length)} مدل فعال
                      </span>
                    </div>

                    <div className="space-y-4">
                      {walletData.stats.modelBreakdown.map((mb, idx) => {
                        const pct = walletData.stats.totalTokens > 0 
                          ? Math.round((mb.tokens / walletData.stats.totalTokens) * 100) 
                          : 0;
                        const colors = [
                          'from-blue-500 to-indigo-600',
                          'from-purple-500 to-pink-600',
                          'from-emerald-500 to-teal-600',
                          'from-amber-500 to-orange-600'
                        ];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={mb.model} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 dir-ltr">{mb.model}</span>
                              <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                                <span>{toPersianDigits(mb.messageCount)} پیام</span>
                                <span>•</span>
                                <span>{toPersianDigits(mb.tokens.toLocaleString('fa-IR'))} توکن</span>
                                <span>•</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {toPersianDigits(mb.costToman.toLocaleString('fa-IR'))} تومان
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                                style={{ width: `${Math.max(4, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Transactions Table Section */}
                <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col min-h-[420px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                      <Clock size={16} className="text-zinc-500 dark:text-zinc-400" />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">ریز تراکنش‌ها و تاریخچه مصرف</h3>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTxFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          txFilter === 'all'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        همه
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxFilter('chat')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          txFilter === 'chat'
                            ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        مصرف چت
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxFilter('deposits')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          txFilter === 'deposits'
                            ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        واریزی و هدیه
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 -mr-1 space-y-2.5 hide-scrollbar">
                    {walletLoading ? (
                      <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    ) : !walletData?.transactions || walletData.transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center mb-3">
                          <Zap size={24} />
                        </div>
                        <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">هنوز تراکنشی ثبت نشده است</h4>
                        <p className="text-xs text-zinc-500 max-w-sm mb-4 leading-relaxed">
                          با ۵۰,۰۰۰ تومان اعتبار هدیه رایگان خود، اولین گفتگوی هوشمند را با مدل‌های پیشرفته آغاز کنید.
                        </p>
                        <Link
                          to="/chat"
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
                        >
                          شروع گفتگو در چت‌باکس
                        </Link>
                      </div>
                    ) : (
                      walletData.transactions
                        .filter(tx => {
                          if (txFilter === 'chat') return tx.type === 'chat_usage';
                          if (txFilter === 'deposits') return tx.type !== 'chat_usage';
                          return true;
                        })
                        .map(tx => {
                          const isChat = tx.type === 'chat_usage';
                          const isBonus = tx.type === 'welcome_bonus';

                          return (
                            <div
                              key={tx.id}
                              className="p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-white dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    isChat
                                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                      : isBonus
                                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                                  }`}
                                >
                                  {isChat ? <Cpu size={18} /> : isBonus ? <Gift size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                                      {isChat ? `پردازش هوش مصنوعی (${tx.model || 'عمومی'})` : tx.description || 'تراکنش کیف پول'}
                                    </h4>
                                    {isChat && tx.model && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono dir-ltr">
                                        {tx.model}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
                                    <span dir="ltr">
                                      {new Date(tx.createdAt).toLocaleDateString('fa-IR', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    {isChat && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          {toPersianDigits((tx.promptTokens || 0) + (tx.completionTokens || 0))} توکن
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-2 sm:pt-0">
                                <span
                                  className={`text-xs font-black ${
                                    isChat
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isChat ? '-' : '+'}
                                  {toPersianDigits(Math.abs(tx.amount).toLocaleString('fa-IR'))} تومان
                                </span>
                                <span className="text-[10px] text-zinc-400 font-medium">
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
              <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex-1 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <Package size={16} className="text-zinc-500 dark:text-zinc-400" />
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">تاریخچه سفارش‌های فروشگاه</h3>
                  </div>
                  <Link to="/store" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    مشاهده فروشگاه <ChevronLeft size={12} />
                  </Link>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 -mr-2 space-y-3 hide-scrollbar">
                  {loading ? (
                    <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                  ) : purchases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 text-zinc-400">
                        <ShoppingBag size={20} />
                      </div>
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">هیچ سفارشی ثبت نشده است</p>
                      <p className="text-[11px] text-zinc-400">اولین خرید خود را از فروشگاه انجام دهید.</p>
                    </div>
                  ) : (
                    purchases.map(p => (
                      <div key={p.orderId} className="p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-white dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0"><Package size={18}/></div>
                          )}
                          <div>
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white mb-1">{p.title}</h4>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                              <span dir="ltr">{new Date(p.orderDate).toLocaleDateString('fa-IR')}</span>
                              <span className="font-bold">{p.amount.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-2.5 sm:pt-0">
                          {getStatusBadge(p.paymentStatus)}
                          
                          <button 
                            onClick={() => setSelectedInvoice(p)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            <Receipt size={12} /> فاکتور
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Redeem License Section */}
            {activeTab === 'redeem' && (
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-zinc-900 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 border border-indigo-950/40 dark:border-zinc-700/80 shadow-md text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-1.5 flex items-center gap-2">
                      <Key size={18} className="text-blue-400" />
                      فعال‌سازی لایسنس (Redeem)
                    </h3>
                    <p className="text-zinc-300 dark:text-zinc-400 text-[11px] leading-relaxed max-w-md">
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
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-zinc-400 focus:bg-white/15 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all font-mono text-sm"
                    />
                    <button 
                      type="submit" 
                      disabled={isRedeeming || !redeemCode.trim()}
                      className="px-5 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isRedeeming ? '...' : 'فعال‌سازی'}
                    </button>
                  </form>
                </div>
                
                {redeemMessage && (
                  <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${redeemMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {redeemMessage.type === 'success' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                    {redeemMessage.text}
                  </div>
                )}
              </div>
            )}

            {/* Support Card */}
            <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-right">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <LifeBuoy size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">نیاز به راهنمایی دارید؟</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">تیم پشتیبانی ما همیشه آماده کمک به شماست.</p>
                </div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
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
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div id="invoice-print-area" className="p-6">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 border-dashed">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                    <ShoppingBag className="text-blue-500 w-5 h-5" /> چت‌باکس
                  </h3>
                  <p className="text-xs text-zinc-500">فاکتور کالا و خدمات دیجیتال</p>
                </div>
                <div className="text-left bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white mb-1" dir="ltr">#{selectedInvoice.orderId.split('-')[1] || selectedInvoice.orderId}</div>
                  <div className="text-[10px] text-zinc-500" dir="ltr">{new Date(selectedInvoice.orderDate).toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                  <span className="font-semibold text-zinc-500">نام محصول:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedInvoice.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                  <span className="font-semibold text-zinc-500">وضعیت پرداخت:</span>
                  {getStatusBadge(selectedInvoice.paymentStatus)}
                </div>
                {selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (
                  <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 mt-4">
                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">کد لایسنس اختصاصی شما:</span>
                    <span className="font-mono text-center tracking-widest text-base font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 py-2 rounded-lg" dir="ltr">{selectedInvoice.licenseKey}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 border-dashed flex justify-between items-center">
                <span className="text-sm font-semibold text-zinc-500">مبلغ کل:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedInvoice.amount.toLocaleString('fa-IR')} <span className="text-xs font-semibold text-zinc-500">تومان</span></span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3 rounded-b-3xl">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white hover:bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
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
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white flex justify-center items-center gap-2 transition-colors"
              >
                <Printer size={16} /> چاپ فاکتور
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
