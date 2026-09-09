import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, ShoppingBag, User as UserIcon, LifeBuoy, 
  Key, Package, CheckCircle2, XCircle, Clock, Save, Lock, LogOut,
  Receipt, Printer, ArrowRight, Home, ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const UserDashboard = () => {
  const { user, token, checkAuth, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'support'>('overview');
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Milo',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Bella'
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
  }, [token]);

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
      case 'success': return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14}/> تکمیل شده</span>;
      case 'pending': return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs font-bold flex items-center gap-1.5"><Clock size={14}/> در انتظار بررسی</span>;
      case 'failed': return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-xs font-bold flex items-center gap-1.5"><XCircle size={14}/> لغو شده</span>;
      default: return <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 text-xs font-bold">{status}</span>;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-10 text-center shadow-xl shadow-zinc-200/20 dark:shadow-none">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">دسترسی غیرمجاز</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">برای مشاهده پنل کاربری اختصاصی خود ابتدا باید وارد حساب کاربری شوید.</p>
          <button 
            onClick={() => {
              navigate('/');
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-auth-modal')), 500);
            }} 
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            ورود به حساب کاربری
          </button>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            <ArrowRight size={16} /> بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header (Shown only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />)}
          </div>
          <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{user.name || 'کاربر چت‌باکس'}</span>
        </div>
        <Link to="/" className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          <ArrowRight size={20} />
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 md:h-screen md:sticky md:top-0 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hide-scrollbar overflow-y-auto">
        
        {/* User Profile Summary (Desktop) */}
        <div className="hidden md:flex flex-col items-center text-center p-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative mb-4 group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 p-1">
              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <UserIcon className="w-10 h-10 text-blue-500 opacity-50" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              پنل کاربری
            </div>
          </div>
          <h3 className="font-black text-lg text-zinc-900 dark:text-white truncate w-full px-2">{user.name || 'کاربر عزیز'}</h3>
          <p className="text-xs text-zinc-500 mt-1.5 truncate w-full px-4 font-mono" dir="ltr">{user.phone || user.email}</p>
        </div>

        {/* Navigation Links */}
        <div className="flex md:flex-col gap-2 p-4 md:p-6 overflow-x-auto md:overflow-visible">
          <button onClick={() => setActiveTab('overview')} className={`flex shrink-0 md:w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            <LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'} /> نمای کلی
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex shrink-0 md:w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            <ShoppingBag size={18} className={activeTab === 'orders' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'} /> تاریخچه سفارش‌ها
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex shrink-0 md:w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            <UserIcon size={18} className={activeTab === 'profile' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'} /> تنظیمات حساب
          </button>
          <button onClick={() => setActiveTab('support')} className={`flex shrink-0 md:w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'support' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
            <LifeBuoy size={18} className={activeTab === 'support' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'} /> پشتیبانی
          </button>
        </div>

        <div className="mt-auto p-4 md:p-6 flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Home size={18} /> بازگشت به چت
          </Link>
          <Link to="/store" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ExternalLink size={18} /> فروشگاه محصولات
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-3.5 mt-2 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-all">
            <LogOut size={18} /> خروج از حساب
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {activeTab === 'overview' && (
            <div className="animate-fadeIn">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-2">سلام، {user.name?.split(' ')[0] || 'کاربر عزیز'} 👋</h1>
                <p className="text-zinc-500 dark:text-zinc-400">به پنل مدیریت یکپارچه حساب کاربری خود خوش آمدید.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 block mb-1">تعداد کل سفارش‌ها</span>
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">{purchases.length}</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ShoppingBag size={32} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 block mb-1">سفارش‌های موفق</span>
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">{purchases.filter(p => p.paymentStatus === 'success').length}</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={32} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Redeem Section */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-900/80 dark:to-blue-900/80 rounded-3xl shadow-xl shadow-blue-600/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
                
                <div className="relative z-10">
                  <h3 className="font-black text-xl md:text-2xl mb-3 text-white flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl"><Key className="w-6 h-6 text-white" /></div>
                    ردیم کد (فعال‌سازی لایسنس)
                  </h3>
                  <p className="text-blue-100 mb-6 text-sm md:text-base leading-relaxed max-w-2xl">
                    کد لایسنس خریداری شده از طریق تلگرام یا سایر پلتفرم‌ها را در کادر زیر وارد کنید تا خدمات به حساب فعلی شما متصل شود.
                  </p>
                  <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                    <input 
                      type="text" 
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      placeholder="مثال: X7Y9-ABCD-1234"
                      dir="ltr"
                      className="flex-1 px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 outline-none transition-all font-mono tracking-widest"
                    />
                    <button 
                      type="submit" 
                      disabled={isRedeeming || !redeemCode.trim()}
                      className="px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-black transition-all disabled:opacity-50 shadow-lg shrink-0"
                    >
                      {isRedeeming ? 'در حال بررسی...' : 'فعال‌سازی کد'}
                    </button>
                  </form>
                  {redeemMessage && (
                    <div className={`mt-5 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 max-w-xl backdrop-blur-md ${redeemMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' : 'bg-red-500/30 text-red-100 border border-red-400/30'}`}>
                      {redeemMessage.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      {redeemMessage.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><ShoppingBag size={24} /></div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">تاریخچه سفارش‌ها</h2>
              </div>
              
              {loading ? (
                <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin"></div></div>
              ) : purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400">
                  <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                    <Package size={40} className="opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">هنوز سفارشی ثبت نکرده‌اید!</h3>
                  <p>محصولات هوش مصنوعی ما در فروشگاه منتظر شما هستند.</p>
                  <Link to="/store" className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">بازدید از فروشگاه</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {purchases.map(p => (
                    <div key={p.orderId} className="p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start md:items-center gap-5">
                        {p.image ? (
                          <img src={p.image} className="w-16 h-16 rounded-2xl object-cover shadow-sm shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0"><Package size={24}/></div>
                        )}
                        <div>
                          <h4 className="font-bold text-base md:text-lg mb-2 text-zinc-900 dark:text-white">{p.title}</h4>
                          <div className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="flex items-center gap-1.5"><Clock size={14}/> <span dir="ltr">{new Date(p.orderDate).toLocaleDateString('fa-IR')}</span></span>
                            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-bold">{p.amount.toLocaleString('fa-IR')} تومان</span>
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xs">#{p.orderId.split('-')[1] || p.orderId}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-start md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-0 border-zinc-100 dark:border-zinc-800">
                        {getStatusBadge(p.paymentStatus)}
                        
                        {p.trackingNumber && (
                          <div className="text-xs bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 px-3 py-2 rounded-xl font-mono border border-zinc-200 dark:border-zinc-700 w-full md:w-auto text-center">
                            پیگیری: {p.trackingNumber}
                          </div>
                        )}
                        
                        {p.licenseKey && p.paymentStatus === 'success' && (
                          <div className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-xl font-mono border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center gap-2 w-full md:w-auto">
                            <Key size={14} /> <span className="tracking-wider">{p.licenseKey}</span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setSelectedInvoice(p)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 mt-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-colors"
                        >
                          <Receipt size={16} /> فاکتور
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-fadeIn max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><UserIcon size={24} /></div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">تنظیمات حساب کاربری</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handleUpdateProfile} className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">اطلاعات شخصی</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">نام و نام خانوادگی</label>
                      <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">آواتار من</label>
                      <div className="flex flex-wrap gap-4">
                        {defaultAvatars.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setProfileData({...profileData, avatar: url})}
                            className={`relative p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 ${
                              (profileData.avatar === url || (!profileData.avatar && i === 0))
                                ? 'bg-blue-100 dark:bg-blue-900/40 shadow-inner'
                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <img src={url} alt={`avatar-${i}`} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-zinc-700 shadow-sm" />
                            {(profileData.avatar === url || (!profileData.avatar && i === 0)) && (
                              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 border-2 border-white dark:border-zinc-900">
                                <CheckCircle2 size={12} strokeWidth={4} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">آدرس ایمیل</label>
                      <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all" dir="ltr" />
                    </div>
                    {user.phone && (
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">شماره موبایل (تایید شده)</label>
                        <input type="text" value={user.phone} disabled className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-sm cursor-not-allowed opacity-80" dir="ltr" />
                      </div>
                    )}
                    
                    {profileMsg && <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{profileMsg.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>} {profileMsg.text}</div>}
                    
                    <button type="submit" disabled={isUpdatingProfile} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-blue-600/20">
                      <Save size={18} /> {isUpdatingProfile ? 'در حال ذخیره...' : 'ذخیره اطلاعات شخصی'}
                    </button>
                  </div>
                </form>

                <form onSubmit={handleUpdatePassword} className="p-6 md:p-8 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 h-fit">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">تغییر رمز عبور</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">رمز عبور فعلی</label>
                      <input type="password" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 text-sm transition-all" dir="ltr" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">رمز عبور جدید</label>
                      <input type="password" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} minLength={6} className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 text-sm transition-all" dir="ltr" required />
                    </div>
                    
                    {passMsg && <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{passMsg.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>} {passMsg.text}</div>}
                    
                    <button type="submit" disabled={isUpdatingPass} className="w-full py-3.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-lg">
                      <Lock size={18} /> {isUpdatingPass ? 'در حال ثبت...' : 'بروزرسانی رمز عبور'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="animate-fadeIn max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><LifeBuoy size={24} /></div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">پشتیبانی پلتفرم</h2>
              </div>
              
              <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LifeBuoy size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4">چگونه می‌توانیم به شما کمک کنیم؟</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-10 max-w-lg mx-auto leading-relaxed">
                  تیم پشتیبانی ما همه روزه آماده پاسخگویی به سوالات و مشکلات شماست. برای پیگیری سفارش‌ها، دریافت لایسنس یا رفع مشکلات فنی، با ما در ارتباط باشید.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:-translate-y-1">
                    <LifeBuoy size={20} /> ارسال پیام به پشتیبانی
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedInvoice(null)}>
          <div 
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-black/50 border border-zinc-200 dark:border-zinc-800 overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div id="invoice-print-area" className="p-8 pb-4">
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800 border-dashed">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                    <ShoppingBag className="text-blue-500" /> چت‌باکس
                  </h3>
                  <p className="text-sm text-zinc-500">فاکتور کالا و خدمات دیجیتال</p>
                </div>
                <div className="text-left bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
                  <div className="text-sm font-bold text-zinc-900 dark:text-white mb-1" dir="ltr">#{selectedInvoice.orderId.split('-')[1] || selectedInvoice.orderId}</div>
                  <div className="text-xs text-zinc-500" dir="ltr">{new Date(selectedInvoice.orderDate).toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <span className="font-bold text-zinc-500">خریدار:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{user.name || 'کاربر چت‌باکس'} ({user.phone || user.email})</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <span className="font-bold text-zinc-500">نام محصول:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedInvoice.title}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <span className="font-bold text-zinc-500">وضعیت پرداخت:</span>
                  {getStatusBadge(selectedInvoice.paymentStatus)}
                </div>
                {selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (
                  <div className="flex flex-col gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-sm mt-4">
                    <span className="font-bold text-blue-900 dark:text-blue-200">کد لایسنس اختصاصی شما:</span>
                    <span className="font-mono text-center tracking-[0.3em] text-lg font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-zinc-900 py-3 rounded-xl shadow-sm" dir="ltr">{selectedInvoice.licenseKey}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 border-dashed flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/30 -mx-8 px-8 py-6 -mb-4">
                <span className="font-bold text-zinc-500">مبلغ کل پرداخت شده:</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedInvoice.amount.toLocaleString('fa-IR')} <span className="text-sm font-bold text-zinc-500">تومان</span></span>
              </div>
            </div>

            <div className="p-5 bg-zinc-100 dark:bg-zinc-900/80 flex flex-col sm:flex-row justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-white hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
              >
                <Printer size={18} /> چاپ رسید
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
