import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, RefreshCw, CheckCircle2, XCircle, AlertCircle, X, 
  Trash2, Copy, Check, ExternalLink, Key, Eye, Clock, ShieldCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ShopLinearIcon, BoxLinearIcon, CardTransferLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits } from '../../lib/persianUtils';
import { formatTehranDateTime } from '../../lib/dateUtils';
import { adminFetch } from '../../lib/adminApi';
import { AdminToast } from './AdminToast';
import { AdminConfirmModal } from './AdminConfirmModal';

interface OrderItem {
  id: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  productId: number;
  productTitle?: string;
  productCategory?: string;
  amount: number;
  paymentStatus: 'pending' | 'success' | 'failed';
  paymentMethod?: string;
  trackingNumber?: string;
  cardPan?: string;
  authority?: string;
  refId?: string;
  licenseId?: number;
  licenseKey?: string;
  deliveryGuide?: string;
  createdAt: string;
}

const isWalletTopupOrder = (o: { id: string; productCategory?: string; productTitle?: string }) => {
  return o.id.startsWith('TOP-') || 
    o.productCategory === 'wallet_topup' || 
    o.productCategory === 'plan' ||
    Boolean(o.productTitle && o.productTitle.includes('کیف پول'));
};

interface AdminOrdersTabProps {
  onRefreshCount?: () => void;
}

const ORDERS_PAGE_SIZE = 25;

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ onRefreshCount }) => {
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [ordersPage, setOrdersPage] = useState<number>(1);

  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const selectedOrderIdRef = useRef<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [customLicenseInput, setCustomLicenseInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Delete confirmation
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset pagination on filter changes
  useEffect(() => {
    setOrdersPage(1);
  }, [searchQuery, statusFilter, paymentMethodFilter]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminFetch<OrderItem[]>('/api/admin/orders');
      setOrders(data);
    } catch (err: any) {
      showToast(err.message || 'خطا در بارگذاری سفارشات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'success' | 'failed' | 'pending') => {
    try {
      setActionLoadingId(orderId);
      await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      showToast(
        status === 'success' 
          ? 'وضعیت سفارش به پرداخت موفق تغییر یافت و دسترسی/شارژ اعمال شد.' 
          : 'وضعیت سفارش به ناموفق تغییر کرد.',
        'success'
      );

      await fetchOrders();
      onRefreshCount?.();
      if (selectedOrderIdRef.current === orderId) {
        const updated = await adminFetch<OrderItem>(`/api/admin/orders/${orderId}`);
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAssignLicense = async (orderId: string) => {
    if (!customLicenseInput.trim()) {
      showToast('لطفاً متن لایسنس، کلید یا لینک فعال‌سازی را وارد کنید.', 'error');
      return;
    }
    try {
      setActionLoadingId(orderId);
      await adminFetch(`/api/admin/orders/${orderId}/assign-license`, {
        method: 'POST',
        body: JSON.stringify({ licenseKey: customLicenseInput.trim() })
      });

      showToast('لایسنس با موفقیت به خریدار اختصاص داده شد و پیام اطلاع‌رسانی ارسال گردید.', 'success');
      setCustomLicenseInput('');
      await fetchOrders();

      const updated = await adminFetch<OrderItem>(`/api/admin/orders/${orderId}`);
      setSelectedOrder(updated);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDeleteOrder = async () => {
    if (!orderToDelete) return;
    const orderId = orderToDelete;
    try {
      setIsDeleting(true);
      await adminFetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });

      showToast('سفارش با موفقیت حذف شد.', 'success');
      setOrderToDelete(null);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      await fetchOrders();
      onRefreshCount?.();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    // Status filter
    if (statusFilter !== 'all' && o.paymentStatus !== statusFilter) return false;
    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      const pm = (o.paymentMethod || '').toLowerCase();
      if (paymentMethodFilter === 'card' && pm !== 'card') return false;
      if (paymentMethodFilter === 'zarinpal' && pm !== 'zarinpal' && pm !== 'online') return false;
      if (paymentMethodFilter === 'bazaarpay' && pm !== 'bazaarpay') return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.id?.toLowerCase().includes(q);
      const matchUser = (o.userPhone || o.userEmail || o.userName || '').toLowerCase().includes(q);
      const matchProd = (o.productTitle || '').toLowerCase().includes(q);
      const matchKey = (o.licenseKey || '').toLowerCase().includes(q);
      const matchTrack = (o.trackingNumber || o.cardPan || o.refId || '').toLowerCase().includes(q);
      return matchId || matchUser || matchProd || matchKey || matchTrack;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE));
  const currentPage = Math.min(ordersPage, totalPages);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PAGE_SIZE, currentPage * ORDERS_PAGE_SIZE);

  const pendingCount = orders.filter(o => o.paymentStatus === 'pending').length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast */}
      {toast && (
        <AdminToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Reusable Confirm Delete Modal */}
      <AdminConfirmModal
        isOpen={Boolean(orderToDelete)}
        title="حذف سفارش"
        description="آیا از حذف این سفارش مطمئن هستید؟ با حذف سفارش، رکورد مربوطه از لیست حذف خواهد شد. این عملیات غیرقابل بازگشت است."
        confirmLabel="حذف قطعی"
        cancelLabel="انصراف"
        isDanger={true}
        loading={isDeleting}
        onConfirm={executeDeleteOrder}
        onClose={() => setOrderToDelete(null)}
      />

      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center shrink-0">
            <ShopLinearIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[var(--text-main)]">سفارشات و تراکنش‌های فروشگاه</h3>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                  {usePersianDigits ? toPersianDigits(pendingCount) : pendingCount} در انتظار بررسی
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">مدیریت پرداخت‌های آنلاین، فیش‌های کارت‌به‌کارت و تخصیص لایسنس</p>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 clay-btn font-bold text-xs rounded-xl transition-all self-start sm:self-auto"
          title="تازه‌سازی لیست"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl clay-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all' ? 'clay-btn-primary' : 'clay-btn'
            }`}
          >
            همه ({usePersianDigits ? toPersianDigits(orders.length) : orders.length})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-md'
                : 'clay-btn text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            <span>در انتظار تایید</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[10px] rounded-full">
                {usePersianDigits ? toPersianDigits(pendingCount) : pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'success' ? 'clay-btn-primary' : 'clay-btn text-emerald-500'
            }`}
          >
            موفق ({usePersianDigits ? toPersianDigits(orders.filter(o => o.paymentStatus === 'success').length) : orders.filter(o => o.paymentStatus === 'success').length})
          </button>

          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'failed' ? 'clay-btn-primary' : 'clay-btn text-red-500'
            }`}
          >
            ناموفق ({usePersianDigits ? toPersianDigits(orders.filter(o => o.paymentStatus === 'failed').length) : orders.filter(o => o.paymentStatus === 'failed').length})
          </button>
        </div>

        {/* Controls: Payment Method Filter + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl clay-surface text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
          >
            <option value="all">همه روش‌ها</option>
            <option value="zarinpal">درگاه شاپرک</option>
            <option value="bazaarpay">بازارپی</option>
            <option value="card">کارت‌به‌کارت</option>
          </select>

          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سفارش، خریدار، کد..."
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
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-52 clay-subcard rounded-2xl">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-[var(--text-muted)] font-bold">در حال دریافت لیست سفارشات...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3 clay-card rounded-2xl opacity-60">
          <BoxLinearIcon className="w-12 h-12 text-[var(--text-dim)]" />
          <span className="text-sm font-bold text-[var(--text-main)]">سفارشی با این مشخصات یافت نشد.</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl clay-card">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--card-bg)] text-xs font-black text-[var(--text-muted)]">
                  <th className="px-4 py-3.5">شماره سفارش</th>
                  <th className="px-4 py-3.5">خریدار</th>
                  <th className="px-4 py-3.5">محصول / بسته</th>
                  <th className="px-4 py-3.5">مبلغ (تومان)</th>
                  <th className="px-4 py-3.5">روش پرداخت</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5">لایسنس</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {paginatedOrders.map((o) => {
                  const isPending = o.paymentStatus === 'pending';
                  const isProcessing = actionLoadingId === o.id;

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-[var(--color-input-bg)]/50 transition-colors ${
                        isPending ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-black text-[var(--text-main)]">
                          <span>{o.id}</span>
                          <button
                            onClick={() => copyToClipboard(o.id, `ord-${o.id}`)}
                            className="p-1 hover:text-[var(--color-accent-primary)] text-[var(--text-dim)]"
                            title="کپی شناسه سفارش"
                          >
                            {copiedKey === `ord-${o.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-[var(--text-main)]">{o.userName || 'کاربر مهمان/سایت'}</span>
                          <span className="text-[11px] text-[var(--text-dim)] font-mono" dir="ltr">
                            {o.userPhone || o.userEmail || `User #${o.userId}`}
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col text-xs max-w-[180px]">
                          <span className="font-bold text-[var(--text-main)] truncate" title={o.productTitle}>
                            {o.productTitle}
                          </span>
                          <span className="text-[10px] text-[var(--color-accent-primary)] font-bold">
                            {o.productCategory === 'plan' ? 'بسته تعرفه' : o.productCategory === 'package' ? 'پکیج دانلودی' : o.productCategory === 'api' ? 'کلید API' : 'اکانت پرمیوم'}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-black text-xs text-[var(--text-main)]">
                          {usePersianDigits ? toPersianDigits(o.amount.toLocaleString('fa-IR')) : o.amount.toLocaleString('fa-IR')}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          o.paymentMethod === 'card'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : o.paymentMethod === 'bazaarpay'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {o.paymentMethod === 'card' ? 'کارت‌به‌کارت' : o.paymentMethod === 'bazaarpay' ? 'بازارپی' : 'درگاه شاپرک'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          o.paymentStatus === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : o.paymentStatus === 'pending'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {o.paymentStatus === 'success' ? 'موفق' : o.paymentStatus === 'pending' ? 'در انتظار بررسی' : 'ناموفق'}
                        </span>
                      </td>

                      {/* License / Access */}
                      <td className="px-4 py-3.5">
                        {o.licenseKey ? (
                          <div className="flex items-center gap-1 text-xs font-mono max-w-[120px]">
                            <span className="truncate text-[var(--color-accent-primary)] font-bold" dir="ltr">{o.licenseKey}</span>
                            <button
                              onClick={() => copyToClipboard(o.licenseKey!, `lic-${o.id}`)}
                              className="p-1 hover:text-[var(--text-main)] text-[var(--text-dim)] shrink-0"
                              title="کپی لایسنس"
                            >
                              {copiedKey === `lic-${o.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : isWalletTopupOrder(o) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            شارژ مستقیم کیف‌پول
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-dim)]">تخصیص‌نیافته</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                          {formatTehranDateTime(o.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              selectedOrderIdRef.current = o.id;
                              setSelectedOrder(o);
                            }}
                            className="p-2 clay-btn rounded-xl text-[var(--text-muted)] hover:text-[var(--color-accent-primary)] transition-all"
                            title="مشاهده فاکتور و جزئیات"
                          >
                            <Eye size={15} />
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, 'success')}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1"
                              title="تایید فیش و فعال‌سازی سفارش"
                            >
                              <CheckCircle2 size={13} />
                              <span>تایید</span>
                            </button>
                          )}

                          <button
                            onClick={() => setOrderToDelete(o.id)}
                            className="p-2 clay-btn rounded-xl text-[var(--text-dim)] hover:text-red-500 transition-all"
                            title="حذف سفارش"
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
                نمایش صفحه {usePersianDigits ? toPersianDigits(currentPage) : currentPage} از {usePersianDigits ? toPersianDigits(totalPages) : totalPages} ({usePersianDigits ? toPersianDigits(filteredOrders.length) : filteredOrders.length} سفارش)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="clay-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>قبلی</span>
                </button>

                <button
                  onClick={() => setOrdersPage(p => Math.min(totalPages, p + 1))}
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

      {/* Order Details / Action Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl clay-modal p-6 rounded-3xl space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-2">
                <ShopLinearIcon className="w-6 h-6 text-[var(--color-accent-primary)]" />
                <h4 className="font-black text-sm text-[var(--text-main)]">
                  جزئیات سفارش <span className="font-mono text-xs font-bold text-[var(--color-accent-primary)]">#{selectedOrder.id}</span>
                </h4>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  selectedOrderIdRef.current = null;
                }}
                className="p-1.5 rounded-xl clay-btn text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Product and Payment Summary */}
              <div className="p-4 rounded-2xl clay-subcard space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">محصول سفارش:</span>
                  <span className="text-[var(--text-main)] font-black">{selectedOrder.productTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">مبلغ کل پرداختی:</span>
                  <span className="text-emerald-500 font-black text-sm">
                    {usePersianDigits ? toPersianDigits(selectedOrder.amount.toLocaleString('fa-IR')) : selectedOrder.amount.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">روش و درگاه پرداخت:</span>
                  <span className="font-bold text-[var(--text-main)]">
                    {selectedOrder.paymentMethod === 'card' ? 'کارت‌به‌کارت مستقیم' : selectedOrder.paymentMethod === 'bazaarpay' ? 'درگاه سریع بازارپی' : 'درگاه شاپرک (زرین‌پال)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">وضعیت فعلی سفارش:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    selectedOrder.paymentStatus === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : selectedOrder.paymentStatus === 'pending'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {selectedOrder.paymentStatus === 'success' ? 'پرداخت شده / تکمیل' : selectedOrder.paymentStatus === 'pending' ? 'در انتظار بررسی مدیریت' : 'ناموفق / رد شده'}
                  </span>
                </div>
              </div>

              {/* Customer and Verification Info */}
              <div className="p-4 rounded-2xl clay-subcard space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">خریدار:</span>
                  <span className="text-[var(--text-main)] font-bold">{selectedOrder.userName || 'کاربر سایت'}</span>
                </div>
                {selectedOrder.userPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-bold">تلفن:</span>
                    <span className="text-[var(--text-main)] font-mono" dir="ltr">{selectedOrder.userPhone}</span>
                  </div>
                )}
                {selectedOrder.userEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-bold">ایمیل:</span>
                    <span className="text-[var(--text-main)] font-mono" dir="ltr">{selectedOrder.userEmail}</span>
                  </div>
                )}
                {selectedOrder.trackingNumber && (
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                    <span className="text-[var(--text-muted)] font-bold">شماره پیگیری / ۴ رقم کارت:</span>
                    <span className="font-mono font-black text-amber-500 text-sm" dir="ltr">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
                {selectedOrder.refId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-bold">کد پیگیری شاپرک / مرجع:</span>
                    <span className="font-mono text-emerald-500 font-bold" dir="ltr">{selectedOrder.refId}</span>
                  </div>
                )}
              </div>

              {/* License / Allocation Section */}
              <div className="p-4 rounded-2xl clay-subcard space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Key size={14} className="text-[var(--color-accent-primary)]" />
                    نوع تحویل و وضعیت لایسنس:
                  </span>
                </div>

                {isWalletTopupOrder(selectedOrder) ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                      <CheckCircle2 size={16} />
                      <span>شارژ مستقیم و خودکار کیف پول (بدون نیاز به لایسنس)</span>
                    </div>
                    <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                      این سفارش مربوط به شارژ نقدی کیف پول حساب کاربری است. با پرداخت موفق، اعتبار مستقیماً به موجودی کیف پول کاربر اضافه شده و نیازی به صدور، تخصیص یا ارسال کلید لایسنس ندارد.
                    </p>
                  </div>
                ) : selectedOrder.licenseKey ? (
                  <div className="flex items-center justify-between p-3 rounded-xl clay-card">
                    <span className="font-mono text-xs font-bold text-[var(--color-accent-primary)] select-all" dir="ltr">
                      {selectedOrder.licenseKey}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.licenseKey!, 'modal-lic')}
                      className="p-1.5 clay-btn rounded-lg text-xs"
                    >
                      {copiedKey === 'modal-lic' ? 'کپی شد!' : 'کپی'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[var(--text-muted)]">
                      هنوز لایسنسی به این سفارش اختصاص داده نشده است. می‌توانید یک کلید یا لینک را وارد کرده و ثبت نمایید:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customLicenseInput}
                        onChange={(e) => setCustomLicenseInput(e.target.value)}
                        placeholder="کلید لایسنس، پسورد یا لینک دانلود..."
                        className="flex-1 px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                        dir="ltr"
                      />
                      <button
                        onClick={() => handleAssignLicense(selectedOrder.id)}
                        disabled={actionLoadingId === selectedOrder.id}
                        className="px-4 py-2 clay-btn-primary rounded-xl font-bold text-xs shrink-0"
                      >
                        تخصیص
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--card-border)]">
                {selectedOrder.paymentStatus === 'pending' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'success')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md hover:bg-emerald-600 transition-all"
                  >
                    تایید پرداخت و فعال‌سازی
                  </button>
                )}
                {selectedOrder.paymentStatus !== 'failed' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'failed')}
                    className="px-4 py-2.5 clay-btn text-red-500 font-bold text-xs rounded-xl"
                  >
                    علامت‌گذاری به عنوان لغو/ناموفق
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    selectedOrderIdRef.current = null;
                  }}
                  className="px-4 py-2.5 clay-btn font-bold text-xs rounded-xl"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
