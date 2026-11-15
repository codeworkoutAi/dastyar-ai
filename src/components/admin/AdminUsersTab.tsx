import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, User, Mail, Phone, Trash2, 
  AlertCircle, CheckCircle2, X, Wallet, Shield, ShieldAlert,
  ArrowUpRight, ArrowDownLeft, Lock, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { formatTehranDate } from '../../lib/dateUtils';
import { adminFetch } from '../../lib/adminApi';
import { AdminToast } from './AdminToast';
import { AdminConfirmModal } from './AdminConfirmModal';

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

const USERS_PAGE_SIZE = 25;

export const AdminUsersTab: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [usersPage, setUsersPage] = useState<number>(1);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Delete / Archive confirmation modal
  const [confirmTarget, setConfirmTarget] = useState<{
    userId: number;
    userName: string;
    mode: 'delete' | 'archive';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wallet adjustment modal
  const [adjustingUser, setAdjustingUser] = useState<UserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset pagination on filter changes
  useEffect(() => {
    setUsersPage(1);
  }, [searchQuery, roleFilter]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminFetch<UserItem[]>('/api/admin/users');
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || 'خطای سرور در بارگذاری کاربران', 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeRemoveUser = async () => {
    if (!confirmTarget) return;
    const { userId, mode } = confirmTarget;
    const isDelete = mode === 'delete';

    try {
      setIsDeleting(true);
      const url = isDelete ? `/api/admin/users/${userId}` : `/api/admin/users/${userId}?archive=true`;
      await adminFetch(url, { method: 'DELETE' });

      showToast(isDelete ? 'کاربر با موفقیت حذف قطعی شد.' : 'کاربر با موفقیت بایگانی شد.', 'success');
      setConfirmTarget(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'خطا در عملیات کاربر', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const numAmount = parseInt(adjustAmount.replace(/\D/g, ''), 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('مبلغ وارد شده نامعتبر است.', 'warning');
      return;
    }

    try {
      setAdjustLoading(true);
      await adminFetch(`/api/admin/users/${adjustingUser.id}/wallet`, {
        method: 'POST',
        body: JSON.stringify({
          amount: adjustType === 'credit' ? numAmount : -numAmount,
          description: adjustReason.trim() || (adjustType === 'credit' ? 'شارژ دستی توسط مدیریت' : 'کسر دستی توسط مدیریت')
        })
      });

      showToast(`موجودی کاربر با موفقیت ${adjustType === 'credit' ? 'افزایش' : 'کاهش'} یافت.`, 'success');
      setAdjustingUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'خطا در ویرایش موجودی', 'error');
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
  const currentPage = Math.min(usersPage, totalPages);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PAGE_SIZE, currentPage * USERS_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <AdminToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirmation Modal for Delete or Archive */}
      <AdminConfirmModal
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.mode === 'delete' ? 'حذف قطعی حساب کاربر' : 'بایگانی حساب کاربر'}
        description={
          confirmTarget?.mode === 'delete'
            ? `آیا از حذف کامل حساب کاربر «${confirmTarget?.userName}» اطمینان دارید؟ تمام سفارش‌ها، تراکنش‌ها، سهمیه‌ها و پیام‌های گفتگو به طور قطعی پاک خواهند شد.`
            : `آیا مایلید حساب کاربر «${confirmTarget?.userName}» را بایگانی کنید؟ دسترسی ورود مسدود خواهد شد اما سوابق مالی و تراکنش‌ها حفظ می‌گردند.`
        }
        confirmLabel={confirmTarget?.mode === 'delete' ? 'بله، حذف قطعی' : 'بایگانی حساب'}
        cancelLabel="انصراف"
        isDanger={confirmTarget?.mode === 'delete'}
        loading={isDeleting}
        onConfirm={executeRemoveUser}
        onClose={() => setConfirmTarget(null)}
      />

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
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'all' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            همه کاربران ({usePersianDigits ? toPersianDigits(users.length) : users.length})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'user' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            کاربران عادی ({usePersianDigits ? toPersianDigits(users.filter(u => u.role === 'user').length) : users.filter(u => u.role === 'user').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'admin' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            مدیران ({usePersianDigits ? toPersianDigits(users.filter(u => u.role === 'admin').length) : users.filter(u => u.role === 'admin').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام، ایمیل، موبایل یا شناسه..."
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
        <div className="flex flex-col items-center justify-center h-52 clay-subcard rounded-2xl">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-[var(--text-muted)] font-bold">در حال دریافت اطلاعات کاربران...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3 clay-card rounded-2xl opacity-60">
          <BoxLinearIcon className="w-12 h-12 text-[var(--text-dim)]" />
          <span className="text-sm font-bold text-[var(--text-main)]">کاربری با این مشخصات یافت نشد.</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl clay-card">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--card-bg)] text-xs font-black text-[var(--text-muted)]">
                  <th className="px-4 py-3.5">کاربر</th>
                  <th className="px-4 py-3.5">اطلاعات تماس</th>
                  <th className="px-4 py-3.5">موجودی کیف پول</th>
                  <th className="px-4 py-3.5">نقش</th>
                  <th className="px-4 py-3.5">تاریخ عضویت</th>
                  <th className="px-4 py-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {paginatedUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isMe = currentUser?.id === u.id;
                  const balance = u.walletBalance ?? 0;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--color-input-bg)]/50 transition-colors"
                    >
                      {/* Name / ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin 
                              ? 'bg-purple-500/15 text-purple-600 border border-purple-500/20' 
                              : 'bg-[var(--card-border)] text-[var(--text-main)]'
                          }`}>
                            {isAdmin ? <Shield size={16} /> : (u.name ? u.name.charAt(0) : 'U')}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[var(--text-main)]">
                                {u.name || 'بدون نام'}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                                  شما
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[var(--text-dim)] font-mono" dir="ltr">
                              ID: #{u.id} (UC-{10000 + u.id})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 text-xs">
                          {u.phone ? (
                            <span className="flex items-center gap-1.5 text-[var(--text-main)] font-mono text-[11px]" dir="ltr">
                              <Phone size={11} className="text-[var(--text-dim)]" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-dim)]">بدون شماره همراه</span>
                          )}
                          {u.email && (
                            <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[11px]" dir="ltr">
                              <Mail size={11} className="text-[var(--text-dim)]" />
                              {u.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wallet Balance */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-emerald-500">
                            {usePersianDigits ? toPersianDigits(balance.toLocaleString('fa-IR')) : balance.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-[10px] text-[var(--text-dim)]">تومان</span>
                          <button
                            onClick={() => {
                              setAdjustingUser(u);
                              setAdjustAmount('');
                              setAdjustReason('');
                              setAdjustType('credit');
                            }}
                            className="p-1 rounded-lg clay-btn text-[var(--text-dim)] hover:text-emerald-500 hover:scale-105 transition-all"
                            title="تعدیل یا شارژ موجودی کیف پول"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Role & Status */}
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
                            onClick={() => setConfirmTarget({ userId: u.id, userName: u.name || `User #${u.id}`, mode: 'archive' })}
                            disabled={isMe || isAdmin}
                            className="p-2 clay-btn rounded-xl text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="بایگانی حساب (حفظ سوابق مالی)"
                          >
                            <BoxLinearIcon className="w-4 h-4" />
                          </button>

                          {/* Real Hard Delete */}
                          <button
                            onClick={() => setConfirmTarget({ userId: u.id, userName: u.name || `User #${u.id}`, mode: 'delete' })}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-3 border-t border-subtle">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                نمایش صفحه {usePersianDigits ? toPersianDigits(currentPage) : currentPage} از {usePersianDigits ? toPersianDigits(totalPages) : totalPages} ({usePersianDigits ? toPersianDigits(filteredUsers.length) : filteredUsers.length} کاربر)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="clay-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>قبلی</span>
                </button>

                <button
                  onClick={() => setUsersPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="clay-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
              <div className="flex gap-2 p-1 rounded-xl clay-subcard">
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
