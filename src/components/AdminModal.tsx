import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ShoppingBag, ShoppingCart, Users, BarChart3, 
  Coins, Newspaper, Sliders, ShieldCheck, Sparkles, AlertCircle, MessageSquare
} from 'lucide-react';
import { ShopLinearIcon, BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../store/authStore';
import { AdminProductsTab } from './admin/AdminProductsTab';
import { AdminOrdersTab } from './admin/AdminOrdersTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminNewsTab } from './admin/AdminNewsTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminFinanceTab } from './AdminFinanceTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminMessagesTab } from './admin/AdminMessagesTab';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'products' | 'orders' | 'messages' | 'users' | 'finance' | 'analytics' | 'news' | 'settings';

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const fetchBadgeCounts = useCallback(() => {
    if (!token || user?.role !== 'admin') return;

    // Fetch pending orders
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((orders: any[]) => {
        if (Array.isArray(orders)) {
          const pending = orders.filter((o) => o.paymentStatus === 'pending').length;
          setPendingOrdersCount(pending);
        }
      })
      .catch(() => {});

    // Fetch unread contact messages
    fetch('/api/admin/contact-messages', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((msgs: any[]) => {
        if (Array.isArray(msgs)) {
          const unread = msgs.filter((m) => m.isRead === 0).length;
          setUnreadMessagesCount(unread);
        }
      })
      .catch(() => {});
  }, [token, user]);

  // Fetch pending counts on open or tab change
  useEffect(() => {
    if (isOpen) {
      fetchBadgeCounts();
    }
  }, [isOpen, fetchBadgeCounts, activeTab]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user || user.role !== 'admin') return null;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'products', label: 'محصولات و بسته‌ها', icon: <BoxLinearIcon className="w-4 h-4" /> },
    { 
      id: 'orders', 
      label: 'سفارشات', 
      icon: <ShopLinearIcon className="w-4 h-4" />, 
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined 
    },
    { 
      id: 'messages', 
      label: 'پیام‌های تماس', 
      icon: <MessageSquare size={16} />, 
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined 
    },
    { id: 'users', label: 'کاربران', icon: <Users size={16} /> },
    { id: 'finance', label: 'مالی و خزانه‌داری', icon: <Coins size={16} /> },
    { id: 'analytics', label: 'آنالیتیکس و هوش مصنوعی', icon: <BarChart3 size={16} /> },
    { id: 'news', label: 'مجله و اخبار', icon: <Newspaper size={16} /> },
    { id: 'settings', label: 'تنظیمات سیستم', icon: <Sliders size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col clay-modal rounded-3xl overflow-hidden shadow-2xl relative border border-[var(--card-border)]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--card-border)] bg-[var(--card-bg)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                پنل مدیریت جامع دستیار هوشمند
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                <span>مدیر سیستم:</span>
                <span className="font-bold text-[var(--text-main)]">{user.name || user.email || 'ادمین'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 clay-btn rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title="بستن پنل مدیریت (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-5 sm:px-6 pt-3 pb-1 border-b border-[var(--card-border)] bg-[var(--card-bg)] shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max pb-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer relative ${
                    isActive
                      ? 'clay-btn-primary shadow-sm'
                      : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[var(--card-bg)]">
          {activeTab === 'products' && <AdminProductsTab />}
          {activeTab === 'orders' && <AdminOrdersTab />}
          {activeTab === 'messages' && <AdminMessagesTab onRefreshCount={fetchBadgeCounts} />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'finance' && <AdminFinanceTab />}
          {activeTab === 'analytics' && <AdminAnalyticsTab />}
          {activeTab === 'news' && <AdminNewsTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
        </div>

      </div>
    </div>
  );
};
