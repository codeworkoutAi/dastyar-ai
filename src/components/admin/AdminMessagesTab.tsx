import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, MailOpen, Trash2, Copy, Check, Search, 
  RefreshCw, MessageSquare, ExternalLink, Calendar, 
  User, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { parseDbDate, formatTehranDateTime } from '../../lib/dateUtils';
import { toPersianDigits } from '../../lib/persianUtils';
import { adminFetch } from '../../lib/adminApi';
import { AdminToast } from './AdminToast';
import { AdminConfirmModal } from './AdminConfirmModal';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: number;
  createdAt: string;
}

interface AdminMessagesTabProps {
  onRefreshCount?: () => void;
}

export const AdminMessagesTab: React.FC<AdminMessagesTabProps> = ({ onRefreshCount }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirm delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<ContactMessage[]>('/api/admin/contact-messages');
      setMessages(Array.isArray(data) ? data : []);
      onRefreshCount?.();
    } catch (err: any) {
      showToast(err.message || 'خطا در بارگذاری پیام‌ها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const toggleReadStatus = async (msg: ContactMessage) => {
    const newStatus = msg.isRead ? 0 : 1;
    setActionLoading(msg.id);
    try {
      await adminFetch(`/api/admin/contact-messages/${msg.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: newStatus })
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isRead: newStatus } : m))
      );
      if (selectedMessage && selectedMessage.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, isRead: newStatus });
      }
      onRefreshCount?.();
      showToast(newStatus === 1 ? 'پیام خوانده شد.' : 'پیام به وضعیت ناخوانده تغییر کرد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const executeDeleteMessage = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setIsDeleting(true);
    try {
      await adminFetch(`/api/admin/contact-messages/${id}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      setDeleteTargetId(null);
      onRefreshCount?.();
      showToast('پیام با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف پیام', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.message.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'unread') return m.isRead === 0;
      if (statusFilter === 'read') return m.isRead === 1;
      return true;
    });
  }, [messages, searchQuery, statusFilter]);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.isRead === 0).length;
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <AdminToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Reusable Confirm Delete Modal */}
      <AdminConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="حذف پیام ارتباطی"
        description="آیا از حذف این پیام اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isDanger={true}
        loading={isDeleting}
        onConfirm={executeDeleteMessage}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-bold block mb-1">کل پیام‌های دریافتی</span>
            <span className="text-2xl font-black text-[var(--text-main)]">
              {toPersianDigits(messages.length)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl clay-btn flex items-center justify-center text-blue-500">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-bold block mb-1">پیام‌های جدید (ناخوانده)</span>
            <span className={`text-2xl font-black ${unreadCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {toPersianDigits(unreadCount)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl clay-btn flex items-center justify-center text-amber-500">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-bold block mb-1">پیام‌های بررسی‌شده</span>
            <span className="text-2xl font-black text-emerald-500">
              {toPersianDigits(messages.length - unreadCount)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl clay-btn flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="clay-card p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="جستجو در نام، ایمیل یا متن پیام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl clay-input text-xs sm:text-sm text-[var(--text-main)] outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl clay-surface text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'clay-btn text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              همه ({toPersianDigits(messages.length)})
            </button>
            <button
              onClick={() => setStatusFilter('unread')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === 'unread'
                  ? 'clay-btn text-amber-500 shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              ناخوانده ({toPersianDigits(unreadCount)})
            </button>
            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'read'
                  ? 'clay-btn text-emerald-500 shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              خوانده‌شده
            </button>
          </div>

          <button
            onClick={fetchMessages}
            disabled={loading}
            className="p-2.5 rounded-xl clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages List / Table */}
      {loading ? (
        <div className="clay-card p-12 rounded-3xl text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
          <p className="text-sm font-bold text-[var(--text-muted)]">در حال دریافت پیام‌ها...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="clay-card p-12 rounded-3xl text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1">هیچ پیامی یافت نشد</h3>
          <p className="text-xs text-[var(--text-muted)]">
            {searchQuery ? 'با این عبارت جستجو پیامی پیدا نشد.' : 'هنوز هیچ پیامی از طریق فرم تماس ارسال نشده است.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const isUnread = msg.isRead === 0;

            return (
              <div
                key={msg.id}
                className={`p-5 rounded-2xl transition-all border ${
                  isUnread
                    ? 'clay-card border-blue-500/30 dark:border-blue-500/20 shadow-md'
                    : 'clay-subcard border-transparent opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnread
                          ? 'clay-btn text-blue-600 dark:text-blue-400 font-bold'
                          : 'clay-surface text-[var(--text-muted)]'
                      }`}
                    >
                      {isUnread ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                          {msg.name}
                        </span>
                        {isUnread && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/20">
                            جدید
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono" dir="ltr">
                          {msg.email}
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.email)}
                          className="hover:text-[var(--text-main)] transition-colors inline-flex items-center gap-1 text-[11px]"
                          title="کپی آدرس ایمیل"
                        >
                          {copiedEmail === msg.email ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedEmail === msg.email ? 'کپی شد' : 'کپی'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 pl-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatTehranDateTime(parseDbDate(msg.createdAt))}
                    </span>

                    {/* Action buttons */}
                    <a
                      href={`mailto:${msg.email}?subject=پاسخ به پیام شما در Dastyar AI`}
                      className="p-2 rounded-xl clay-btn text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"
                      title="پاسخ با ایمیل"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => toggleReadStatus(msg)}
                      disabled={actionLoading === msg.id}
                      className={`p-2 rounded-xl clay-btn transition-transform hover:scale-105 cursor-pointer ${
                        isUnread ? 'text-amber-500' : 'text-blue-500'
                      }`}
                      title={isUnread ? 'علامت‌گذاری به عنوان خوانده‌شده' : 'علامت‌گذاری به عنوان جدید'}
                    >
                      {isUnread ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setDeleteTargetId(msg.id)}
                      disabled={actionLoading === msg.id}
                      className="p-2 rounded-xl clay-btn text-rose-500 hover:scale-105 transition-transform cursor-pointer"
                      title="حذف پیام"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="mt-3 p-4 rounded-xl clay-surface text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap select-text">
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
