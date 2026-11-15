import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Check, X, Trash2 } from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { formatTehranDateTime } from '../../lib/dateUtils';
import { AdminConfirmModal } from './AdminConfirmModal';
import { AdminToast } from './AdminToast';

export interface AdminReviewsSubTabProps {
  onNotify?: (message: string, isError?: boolean) => void;
  onRefreshPendingCount?: (count: number) => void;
}

export const AdminReviewsSubTab: React.FC<AdminReviewsSubTabProps> = ({
  onNotify,
  onRefreshPendingCount
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [adminReplyTexts, setAdminReplyTexts] = useState<Record<number, string>>({});
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const notify = (msg: string, isError = false) => {
    if (onNotify) {
      onNotify(msg, isError);
    } else {
      setToast({ message: msg, type: isError ? 'error' : 'success' });
    }
  };

  const fetchReviews = async (filter = reviewFilter) => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/admin/reviews' : `/api/admin/reviews?status=${filter}`;
      const data = await adminFetch<any[]>(url);
      setReviews(data || []);

      const repliesMap: Record<number, string> = {};
      (data || []).forEach((r: any) => {
        if (r.reply) repliesMap[r.id] = r.reply;
      });
      setAdminReplyTexts((prev) => ({ ...prev, ...repliesMap }));

      // Fetch pending count separately
      if (filter !== 'pending') {
        const pending = await adminFetch<any[]>('/api/admin/reviews?status=pending');
        setPendingCount(pending?.length || 0);
        onRefreshPendingCount?.(pending?.length || 0);
      } else {
        setPendingCount(data?.length || 0);
        onRefreshPendingCount?.(data?.length || 0);
      }
    } catch (err: any) {
      notify(err.message || 'خطا در بارگذاری دیدگاه‌ها', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(reviewFilter);
  }, [reviewFilter]);

  const handleUpdateStatus = async (reviewId: number, status: 'approved' | 'rejected' | 'pending', reply?: string) => {
    try {
      await adminFetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reply })
      });
      notify(
        status === 'approved'
          ? 'دیدگاه تایید شد و در صفحه محصول نمایش داده می‌شود.'
          : status === 'rejected'
          ? 'دیدگاه رد شد.'
          : 'وضعیت دیدگاه تغییر کرد.'
      );
      fetchReviews();
    } catch (err: any) {
      notify(err.message || 'خطا در تغییر وضعیت دیدگاه', true);
    }
  };

  const executeDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      setIsDeleting(true);
      await adminFetch(`/api/admin/reviews/${reviewToDelete}`, {
        method: 'DELETE'
      });
      notify('دیدگاه با موفقیت حذف شد.');
      setReviewToDelete(null);
      fetchReviews();
    } catch (err: any) {
      notify(err.message || 'خطا در حذف دیدگاه', true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(reviewToDelete)}
        title="حذف دیدگاه مشتری"
        description="آیا از حذف این دیدگاه مطمئن هستید؟ این دیدگاه برای همیشه پاک خواهد شد."
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isDanger={true}
        loading={isDeleting}
        onConfirm={executeDeleteReview}
        onClose={() => setReviewToDelete(null)}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        <button
          onClick={() => setReviewFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            reviewFilter === 'all'
              ? 'clay-btn-primary shadow-sm'
              : 'clay-btn text-[var(--text-muted)]'
          }`}
        >
          همه دیدگاه‌ها
        </button>

        <button
          onClick={() => setReviewFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            reviewFilter === 'pending'
              ? 'clay-btn-primary shadow-sm'
              : 'clay-btn text-[var(--text-muted)]'
          }`}
        >
          <span>در انتظار تایید</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setReviewFilter('approved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            reviewFilter === 'approved'
              ? 'clay-btn-primary shadow-sm'
              : 'clay-btn text-[var(--text-muted)]'
          }`}
        >
          تایید شده‌ها
        </button>

        <button
          onClick={() => setReviewFilter('rejected')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            reviewFilter === 'rejected'
              ? 'clay-btn-primary shadow-sm'
              : 'clay-btn text-[var(--text-muted)]'
          }`}
        >
          رد شده‌ها
        </button>
      </div>

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)]">
          در حال بارگذاری دیدگاه‌ها...
        </div>
      ) : reviews.length === 0 ? (
        <div className="clay-card rounded-2xl p-8 text-center text-xs text-[var(--text-muted)]">
          دیدگاهی با این وضعیت یافت نشد.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const replyText = adminReplyTexts[r.id] ?? '';

            return (
              <div
                key={r.id}
                className="clay-card p-5 rounded-2xl space-y-3.5 border-subtle hover:border-emerald-500/20 transition-all"
              >
                {/* Header: User, Product, Rating, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full clay-btn flex items-center justify-center font-bold text-xs text-emerald-500">
                      {r.user_name ? r.user_name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-main)]">
                        {r.user_name || 'کاربر مهمان'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        محصول: <span className="text-[var(--text-main)] font-semibold">{r.product_title || `شناسه #${r.product_id}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 text-amber-500" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          fill={star <= (r.rating || 5) ? 'currentColor' : 'none'}
                          className={star <= (r.rating || 5) ? 'text-amber-500' : 'text-zinc-400'}
                        />
                      ))}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : r.status === 'rejected'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {r.status === 'approved' ? 'تایید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                    </span>

                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatTehranDateTime(r.created_at)}
                    </span>
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-xs text-[var(--text-main)] leading-relaxed bg-[var(--card-bg)]/40 p-3 rounded-xl">
                  {r.comment}
                </p>

                {/* Admin Reply Area */}
                <div className="clay-subcard p-3.5 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                    پاسخ پشتیبانی / مدیریت:
                  </label>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) =>
                      setAdminReplyTexts((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    placeholder="پاسخ خود به این دیدگاه را بنویسید..."
                    className="clay-input w-full p-2.5 rounded-xl text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setReviewToDelete(r.id)}
                    className="clay-btn p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    title="حذف دیدگاه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'rejected', replyText)}
                        className="clay-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10"
                      >
                        رد دیدگاه
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(r.id, 'approved', replyText)}
                      className="clay-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تایید و ذخیره پاسخ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
