import React, { useState, useEffect } from 'react';
import { ArrowRight, Key, Trash2, AlertCircle } from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { AdminConfirmModal } from './AdminConfirmModal';
import { AdminToast } from './AdminToast';

export interface AdminLicenseManagerProps {
  product: { id: number; title: string };
  onClose?: () => void;
  onBack?: () => void;
  onNotify?: (message: string, isError?: boolean) => void;
}

export const AdminLicenseManager: React.FC<AdminLicenseManagerProps> = ({
  product,
  onClose,
  onBack,
  onNotify
}) => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLicensesText, setNewLicensesText] = useState('');
  const [licenseToDelete, setLicenseToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const handleClose = () => {
    if (onBack) onBack();
    else if (onClose) onClose();
  };

  const notify = (msg: string, isError = false) => {
    if (onNotify) {
      onNotify(msg, isError);
    } else {
      setToast({ message: msg, type: isError ? 'error' : 'success' });
    }
  };

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const data = await adminFetch<any[]>(`/api/admin/products/${product.id}/licenses`);
      setLicenses(data || []);
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [product.id]);

  const handleAddBatchLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicensesText.trim()) return;

    const lines = newLicensesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    try {
      setLoading(true);
      const res = await adminFetch<any>(`/api/admin/products/${product.id}/licenses/batch`, {
        method: 'POST',
        body: JSON.stringify({ keys: lines })
      });

      notify(`${res.count || lines.length} لایسنس جدید با موفقیت اضافه شد.`);
      setNewLicensesText('');
      fetchLicenses();
    } catch (err: any) {
      notify(err.message || 'خطا در افزودن لایسنس‌ها', true);
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteLicense = async () => {
    if (!licenseToDelete) return;
    try {
      setIsDeleting(true);
      await adminFetch(`/api/admin/licenses/${licenseToDelete}`, {
        method: 'DELETE'
      });
      notify('لایسنس با موفقیت حذف شد.');
      setLicenseToDelete(null);
      fetchLicenses();
    } catch (err: any) {
      notify(err.message || 'خطا در حذف لایسنس', true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(licenseToDelete)}
        title="حذف لایسنس"
        description="آیا از حذف این لایسنس اطمینان دارید؟ اگر این لایسنس به کاربری اختصاص داده شده باشد، امکان حذف آن وجود نخواهد داشت."
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isDanger={true}
        loading={isDeleting}
        onConfirm={executeDeleteLicense}
        onClose={() => setLicenseToDelete(null)}
      />

      {/* Header with Back button */}
      <div className="flex items-center justify-between border-b border-subtle pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="clay-btn p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="بازگشت به لیست محصولات"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-base text-[var(--text-main)] flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-500" />
              <span>مدیریت لایسنس‌های محصول:</span>
              <span className="text-emerald-500">{product.title}</span>
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              شناسه محصول: {product.id}
            </span>
          </div>
        </div>
      </div>

      {/* Batch Add Form */}
      <form onSubmit={handleAddBatchLicenses} className="clay-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--text-main)] block">
            افزودن دسته‌ای لایسنس‌ها یا کدهای فعال‌سازی (هر خط یک لایسنس)
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            موجودی فعلی: {licenses.filter((l) => !l.is_used).length} استفاده‌نشده / {licenses.length} کل
          </span>
        </div>

        <textarea
          rows={4}
          value={newLicensesText}
          onChange={(e) => setNewLicensesText(e.target.value)}
          placeholder="XXXX-YYYY-ZZZZ-1111&#10;XXXX-YYYY-ZZZZ-2222&#10;..."
          className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
          dir="ltr"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !newLicensesText.trim()}
            className="clay-btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-40"
          >
            {loading ? 'در حال افزودن...' : 'ثبت دسته‌ای لایسنس‌ها'}
          </button>
        </div>
      </form>

      {/* Licenses Table */}
      <div className="clay-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-subtle flex items-center justify-between">
          <h4 className="font-bold text-xs text-[var(--text-main)]">
            فهرست لایسنس‌های ثبت‌شده ({licenses.length})
          </h4>
        </div>

        {licenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            هنوز لایسنسی برای این محصول ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-subtle text-[var(--text-muted)] font-semibold">
                  <th className="p-3">شناسه</th>
                  <th className="p-3">کد / لایسنس</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">شماره سفارش مربوطه</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-zinc-500/5 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[var(--text-muted)]">
                      #{lic.id}
                    </td>
                    <td className="p-3 font-mono font-bold text-[var(--text-main)]" dir="ltr">
                      {lic.license_key}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lic.is_used
                            ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}
                      >
                        {lic.is_used ? 'استفاده‌شده' : 'موجود (آماده تخصیص)'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[var(--text-muted)]" dir="ltr">
                      {lic.order_id || '—'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setLicenseToDelete(lic.id)}
                        disabled={Boolean(lic.is_used)}
                        className="p-1.5 rounded-lg clay-btn text-[var(--text-muted)] hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed"
                        title={lic.is_used ? 'لایسنس مصرف‌شده قابل حذف نیست' : 'حذف لایسنس'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
