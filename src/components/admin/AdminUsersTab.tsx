import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, User, Mail, Phone, Trash2, 
  AlertCircle, CheckCircle2, X, Wallet, Shield, ShieldAlert,
  ArrowUpRight, ArrowDownLeft, Lock, Plus
} from 'lucide-react';
import { BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { formatTehranDate } from '../../lib/dateUtils';

interface UserItem {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  telegramId?: string;
  role: 'user' | 'admin';
  isArchived?: number;
  walletBalance?: number;
  botState?: string;
  createdAt: string;
}

export const AdminUsersTab: React.FC = () => {
  const { token, user: currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Wallet adjustment modal
  const [adjustingUser, setAdjustingUser] = useState<UserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت لیست کاربران');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      showFeedback(err.message || 'خطای سرور در بارگذاری کاربران', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (userId: number, mode: 'delete' | 'archive') => {
    const isDelete = mode === 'delete';
    const message = isDelete
      ? 'این کاربر و تمام اطلاعات او (سفارش‌ها، تراکنش‌ها، سهمیه‌ها و گفتگوها) به طور کامل حذف خواهد شد. ادامه می‌دهید؟'
      : 'حساب کاربر بایگانی می‌شود: دسترسی ورود بسته شده اما سوابق مالی و تراکنش‌ها حفظ می‌شود. ادامه می‌دهید؟';

    if (!window.confirm(message)) return;

    try {
      setLoading(true);
      const url = isDelete ? `/api/admin/users/${userId}` : `/api/admin/users/${userId}?archive=true`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در حذف/بایگانی کاربر');

      showFeedback(isDelete ? 'کاربر با موفقیت حذف قطعی شد.' : 'کاربر با موفقیت بایگانی شد.');
      fetchUsers();
    } catch (err: any) {
      showFeedback(err.message, 'error');
      setLoading(false);
    }
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const numAmount = parseInt(adjustAmount.replace(/\D/g, ''), 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      showFeedback('مبلغ وارد شده نامعتبر است.', 'error');
      return;
    }

    try {
      setAdjustLoading(true);
      const res = await fetch(`/api/admin/users/${adjustingUser.id}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: adjustType === 'credit' ? numAmount : -numAmount,
          description: adjustReason.trim() || (adjustType === 'credit' ? 'شارژ دستی توسط مدیریت' : 'کسر دستی توسط مدیریت')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تغییر موجودی');

      showFeedback(`موجودی کاربر با موفقیت ${adjustType === 'credit' ? 'افزایش' : 'کاهش'} یافت.`);
      setAdjustingUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ucId = `uc-${10000 + u.id}`;
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.includes(q);
      const matchTg = u.telegramId?.includes(q);
      const matchId = u.id.toString() === q || ucId.includes(q);
      return matchName || matchEmail || matchPhone || matchTg || matchId;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] shadow-xl min-w-[320px] p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-slideUpScale ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
            : 'bg-red-500/15 text-red-500 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-main)]">مدیریت کاربران و دسترسی‌ها</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">جستجو، مدیریت موجودی کیف پول، نقش‌ها و حذف حساب کاربری</p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 clay-btn font-bold text-xs rounded-xl transition-all self-start sm:self-auto"
          title="بروزرسانی لیست کاربران"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl clay-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'all' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            همه کاربران ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'user' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            کاربران عادی ({users.filter(u => u.role === 'user').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'admin' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            مدیران ({users.filter(u => u.role === 'admin').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو (نام، ایمیل، تلفن، شناسه، تلگرام)..."
            className="w-full pr-10 pl-4 py-2 rounded-xl clay-surface text-xs outline-none transition-all placeholder:text-[var(--text-dim)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-main)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-52 clay-surface rounded-2xl">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-[var(--text-muted)] font-bold">در حال بارگذاری کاربران...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3 clay-card rounded-2xl opacity-60">
          <BoxLinearIcon className="w-12 h-12 text-[var(--text-dim)]" />
          <span className="text-sm font-bold text-[var(--text-main)]">کاربری با این مشخصات یافت نشد.</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl clay-card">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b border-[var(--card-border)] clay-surface text-xs font-black text-[var(--text-muted)]">
                <th className="px-4 py-3.5">شناسه</th>
                <th className="px-4 py-3.5">نام / هویت</th>
                <th className="px-4 py-3.5">اطلاعات تماس</th>
                <th className="px-4 py-3.5">ربات تلگرام</th>
                <th className="px-4 py-3.5">موجودی کیف پول</th>
                <th className="px-4 py-3.5">نقش</th>
                <th className="px-4 py-3.5">تاریخ عضویت</th>
                <th className="px-4 py-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredUsers.map((u) => {
                const isMe = u.id === currentUser?.id;
                const isAdmin = u.role === 'admin';

                return (
                  <tr key={u.id} className="hover:bg-[var(--color-input-bg)]/50 transition-colors">
                    {/* ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-black text-[var(--text-dim)]">
                        UC-{10000 + u.id}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--text-main)]">{u.name || 'کاربر بدون نام'}</span>
                        {isMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            حساب شما
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs text-[var(--text-muted)]">
                        {u.phone && (
                          <div className="flex items-center gap-1 font-mono text-[11px]" dir="ltr">
                            <Phone size={12} className="text-[var(--text-dim)]" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                        {u.email && (
                          <div className="flex items-center gap-1 font-mono text-[11px]" dir="ltr">
                            <Mail size={12} className="text-[var(--text-dim)]" />
                            <span className="truncate max-w-[160px]">{u.email}</span>
                          </div>
                        )}
                        {!u.phone && !u.email && <span className="text-[11px] text-[var(--text-dim)]">ندارد</span>}
                      </div>
                    </td>

                    {/* Telegram */}
                    <td className="px-4 py-3.5">
                      {u.telegramId ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md w-fit">
                            {u.telegramId}
                          </span>
                          {u.botState === 'support' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 w-fit">
                              پشتیبانی
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-dim)]">متصل نیست</span>
                      )}
                    </td>

                    {/* Wallet Balance */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-[var(--text-main)]">
                          {usePersianDigits ? toPersianDigits((u.walletBalance || 0).toLocaleString()) : (u.walletBalance || 0).toLocaleString()} تومان
                        </span>
                        <button
                          onClick={() => setAdjustingUser(u)}
                          className="p-1 clay-btn rounded-md text-[var(--color-accent-primary)] hover:scale-105 transition-transform"
                          title="تغییر موجودی کیف پول"
                        >
                          <Wallet size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {u.isArchived ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                          بایگانی‌شده
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          isAdmin 
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' 
                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {isAdmin ? 'مدیر سیستم' : 'کاربر عادی'}
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {formatTehranDate(u.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Archive mode */}
                        <button
                          onClick={() => removeUser(u.id, 'archive')}
                          disabled={isMe || isAdmin}
                          className="p-2 clay-btn rounded-xl text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="بایگانی حساب (حفظ سوابق مالی)"
                        >
                          <BoxLinearIcon className="w-4 h-4" />
                        </button>

                        {/* Real Hard Delete */}
                        <button
                          onClick={() => removeUser(u.id, 'delete')}
                          disabled={isMe || isAdmin}
                          className="p-2 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="حذف قطعی کاربر و تمام داده‌هایش"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Wallet Balance Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md clay-modal p-6 rounded-3xl relative shadow-2xl">
            <button
              onClick={() => setAdjustingUser(null)}
              className="absolute top-5 left-5 p-2 clay-btn rounded-xl text-[var(--text-dim)] hover:text-[var(--text-main)]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[var(--card-border)]">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-[var(--text-main)]">تعدیل موجودی کیف پول</h4>
                <span className="text-xs text-[var(--text-muted)]">
                  کاربر: <span className="font-bold text-[var(--text-main)]">{adjustingUser.name || `ID #${adjustingUser.id}`}</span>
                </span>
              </div>
            </div>

            <form onSubmit={handleWalletAdjustSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 rounded-xl clay-surface">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    adjustType === 'credit' ? 'clay-btn-primary' : 'text-[var(--text-muted)]'
                  }`}
                >
                  <ArrowUpRight size={14} />
                  <span>افزایش موجودی (شارژ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    adjustType === 'debit' ? 'bg-red-500 text-white shadow-sm' : 'text-[var(--text-muted)]'
                  }`}
                >
                  <ArrowDownLeft size={14} />
                  <span>کسر موجودی</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">مبلغ (تومان)</label>
                <input
                  type="text"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="مثال: 50000"
                  className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm font-mono outline-none"
                  dir="ltr"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">دلیل یا توضیحات سند</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="مثال: پاداش تست سیستم یا جبران خطای تراکنش"
                  className="w-full px-4 py-2.5 rounded-xl clay-surface text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="px-4 py-2 clay-btn text-xs font-bold rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2 clay-btn-primary text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {adjustLoading ? 'در حال ثبت...' : 'ثبت در کیف پول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
