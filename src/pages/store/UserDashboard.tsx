import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, ShoppingBag, User as UserIcon, LifeBuoy, 
  Key, Package, CheckCircle2, XCircle, Clock, Save, Lock, LogOut,
  Receipt, Printer
} from 'lucide-react';

export const UserDashboard = () => {
  const { user, token, checkAuth, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'support'>('overview');
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redeem Code
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Profile Form
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Password Form
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '' });
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
      case 'success': return <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> تکمیل شده</span>;
      case 'pending': return <span className="px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-bold flex items-center gap-1"><Clock size={14}/> در انتظار بررسی</span>;
      case 'failed': return <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold flex items-center gap-1"><XCircle size={14}/> لغو شده</span>;
      default: return <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 text-xs font-bold">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500 mb-4">برای مشاهده داشبورد ابتدا وارد شوید.</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">ورود به حساب</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center mb-2">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-2xl mb-3 shadow-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon />}
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-white truncate w-full">{user.name || 'کاربر چت‌باکس'}</h3>
          <p className="text-xs text-zinc-500 mt-1 truncate w-full" dir="ltr">{user.phone || user.email}</p>
        </div>

        <nav className="flex flex-col gap-1 p-2 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
            <LayoutDashboard size={18} /> نمای کلی
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
            <ShoppingBag size={18} /> سفارش‌های من
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
            <UserIcon size={18} /> اطلاعات حساب
          </button>
          <button onClick={() => setActiveTab('support')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'support' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
            <LifeBuoy size={18} /> پشتیبانی
          </button>
        </nav>

        <button onClick={logout} className="flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-all border border-red-100 dark:border-red-900/50">
          <LogOut size={18} /> خروج از حساب
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LayoutDashboard className="text-blue-500"/> داشبورد کاربری</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center">
                <ShoppingBag className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-2xl font-black">{purchases.length}</span>
                <span className="text-sm text-zinc-500">کل سفارش‌ها</span>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="text-2xl font-black">{purchases.filter(p => p.paymentStatus === 'success').length}</span>
                <span className="text-sm text-zinc-500">تکمیل شده</span>
              </div>
            </div>

            {/* Redeem Section */}
            <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ردیم کد (فعال‌سازی لایسنس)
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                اگر کد لایسنس را از طریق ربات تلگرام یا پشتیبانی دریافت کرده‌اید، آن را در کادر زیر وارد کنید تا به حساب شما متصل شود.
              </p>
              <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="مثال: AAAA-BBBB-CCCC"
                  dir="ltr"
                  className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-mono"
                />
                <button 
                  type="submit" 
                  disabled={isRedeeming || !redeemCode.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shrink-0"
                >
                  {isRedeeming ? 'در حال بررسی...' : 'فعال‌سازی'}
                </button>
              </form>
              {redeemMessage && (
                <div className={`mt-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${redeemMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                  {redeemMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {redeemMessage.text}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ShoppingBag className="text-blue-500"/> تاریخچه سفارش‌ها</h2>
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-500 rounded-full animate-spin"></div></div>
            ) : purchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                <Package size={48} className="mb-4 opacity-50" />
                <p>هیچ سفارشی یافت نشد.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {purchases.map(p => (
                  <div key={p.orderId} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {p.image ? (
                        <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500"><Package size={20}/></div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm mb-1">{p.title}</h4>
                        <div className="text-xs text-zinc-500 flex items-center gap-3">
                          <span dir="ltr">{new Date(p.orderDate).toLocaleDateString('fa-IR')}</span>
                          <span>{p.amount.toLocaleString('fa-IR')} تومان</span>
                          <span className="font-mono">#{p.orderId.split('-')[1] || p.orderId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getStatusBadge(p.paymentStatus)}
                      {p.licenseKey && p.paymentStatus === 'success' && (
                        <div className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-mono border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-2 mt-1">
                          <Key size={12} /> {p.licenseKey}
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedInvoice(p)}
                        className="mt-1 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <Receipt size={14} /> مشاهده فاکتور
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fadeIn max-w-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><UserIcon className="text-blue-500"/> تنظیمات حساب کاربری</h2>
            
            <form onSubmit={handleUpdateProfile} className="mb-8 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm mb-4">اطلاعات شخصی</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">نام و نام خانوادگی</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">ایمیل</label>
                  <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500 text-sm" dir="ltr" />
                </div>
                {user.phone && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">شماره موبایل (غیرقابل تغییر)</label>
                    <input type="text" value={user.phone} disabled className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 text-sm cursor-not-allowed" dir="ltr" />
                  </div>
                )}
                
                {profileMsg && <div className={`p-3 rounded-xl text-sm ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{profileMsg.text}</div>}
                
                <button type="submit" disabled={isUpdatingProfile} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  <Save size={16} /> ذخیره اطلاعات
                </button>
              </div>
            </form>

            <form onSubmit={handleUpdatePassword} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm mb-4">تغییر رمز عبور</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">رمز عبور فعلی</label>
                  <input type="password" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500 text-sm" dir="ltr" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">رمز عبور جدید</label>
                  <input type="password" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} minLength={6} className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500 text-sm" dir="ltr" required />
                </div>
                
                {passMsg && <div className={`p-3 rounded-xl text-sm ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{passMsg.text}</div>}
                
                <button type="submit" disabled={isUpdatingPass} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  <Lock size={16} /> تغییر رمز عبور
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="animate-fadeIn max-w-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LifeBuoy className="text-blue-500"/> پشتیبانی و ارتباط با ما</h2>
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">نیاز به راهنمایی دارید؟</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-6 leading-relaxed">
                تیم پشتیبانی ما همه روزه آماده پاسخگویی به سوالات و مشکلات شماست. برای پیگیری سفارش‌ها، دریافت لایسنس یا رفع مشکلات فنی، روی دکمه زیر کلیک کنید تا از طریق پشتیبانی سایت یا تلگرام با ما در ارتباط باشید.
              </p>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md">
                <LifeBuoy size={18} /> ارتباط با پشتیبانی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedInvoice(null)}>
          <div 
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div id="invoice-print-area" className="p-8 pb-4">
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800 border-dashed">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                    <ShoppingBag className="text-blue-500" /> فروشگاه هوش مصنوعی
                  </h3>
                  <p className="text-sm text-zinc-500">فاکتور فروش کالا و خدمات دیجیتال</p>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-zinc-900 dark:text-white mb-1" dir="ltr">#{selectedInvoice.orderId.split('-')[1] || selectedInvoice.orderId}</div>
                  <div className="text-xs text-zinc-500" dir="ltr">{new Date(selectedInvoice.orderDate).toLocaleDateString('fa-IR')}</div>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">مشخصات خریدار:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{user.name || 'کاربر چت‌باکس'} ({user.phone || user.email})</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">نام محصول:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{selectedInvoice.title}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">وضعیت پرداخت:</span>
                  {getStatusBadge(selectedInvoice.paymentStatus)}
                </div>
                {selectedInvoice.licenseKey && selectedInvoice.paymentStatus === 'success' && (
                  <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm">
                    <span className="text-zinc-500 font-bold">کد لایسنس شما:</span>
                    <span className="font-mono text-center tracking-widest text-zinc-900 dark:text-white" dir="ltr">{selectedInvoice.licenseKey}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 border-dashed flex justify-between items-center">
                <span className="font-bold text-zinc-900 dark:text-white">مبلغ کل پرداخت شده:</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">{selectedInvoice.amount.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
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
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
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
