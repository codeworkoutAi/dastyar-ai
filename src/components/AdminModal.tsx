import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { 
  X, ShoppingBag, ShoppingCart, Users, BarChart3, 
  Coins, Newspaper, Sliders, ShieldCheck, Sparkles, AlertCircle, MessageSquare, RefreshCw
} from 'lucide-react';
import { ShopLinearIcon, BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../store/authStore';
import { adminFetch } from '../lib/adminApi';
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

// Dedicated Error Boundary for Admin Tabs so a crash in a tab doesn't unmount the entire app
interface TabErrorBoundaryProps {
  children: ReactNode;
  activeTab: string;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminTabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[AdminTabErrorBoundary] Crash in tab "${this.props.activeTab}":`, error, errorInfo);
  }

  componentDidUpdate(prevProps: TabErrorBoundaryProps) {
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="p-8 clay-card rounded-2xl text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[var(--text-main)]">
            خطایی در بارگذاری این بخش رخ داد
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            {this.state.error?.message || 'یک خطای غیرمنتظره در رندر تب رخ داده است.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const fetchBadgeCounts = useCallback(async () => {
    if (!isOpen || user?.role !== 'admin') return;

    // Fetch pending orders
    try {
      const orders = await adminFetch<any[]>('/api/admin/orders');
      if (Array.isArray(orders)) {
        const pending = orders.filter((o) => o.paymentStatus === 'pending').length;
        setPendingOrdersCount(pending);
      }
    } catch {
      // Non-critical badge count
    }

    // Fetch unread contact messages
    try {
      const msgs = await adminFetch<any[]>('/api/admin/contact-messages');
      if (Array.isArray(msgs)) {
        const unread = msgs.filter((m) => m.isRead === 0).length;
        setUnreadMessagesCount(unread);
      }
    } catch {
      // Non-critical badge count
    }
  }, [isOpen, user]);

  // Fetch pending counts on open
  useEffect(() => {
    if (isOpen) {
      fetchBadgeCounts();
    }
  }, [isOpen, fetchBadgeCounts]);

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
    { id: 'analytics', label: 'آنالیتیکس و مدل‌ها', icon: <BarChart3 size={16} /> },
    { id: 'news', label: 'مجله و اخبار', icon: <Newspaper size={16} /> },
    { id: 'settings', label: 'تنظیمات سیستم', icon: <Sliders size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-7xl h-[92vh] flex flex-col clay-modal rounded-3xl overflow-hidden shadow-2xl relative border border-[var(--card-border)]">
        
        {/* Compact Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[var(--card-border)] bg-[var(--card-bg)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--text-main)]">
                  پنل مدیریت دستیار هوشمند
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  نسخه مدیریت v2
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                <span>مدیر سیستم:</span>
                <span className="font-semibold text-[var(--text-main)]">{user.name || user.email || 'ادمین'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 clay-btn rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title="بستن پنل مدیریت (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile/Tablet Horizontal Scrollable Tab Bar (< lg) */}
        <div className="lg:hidden px-4 pt-2.5 pb-2 border-b border-[var(--card-border)] bg-[var(--card-bg)] shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer relative ${
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

        {/* Main Body: Desktop Vertical Sidebar (RTL: right side) + Tab Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sleek Vertical Sidebar (Hidden on < lg) */}
          <aside className="hidden lg:flex flex-col w-60 shrink-0 border-l border-[var(--card-border)] bg-[var(--card-bg)]/80 p-3.5 space-y-1.5 overflow-y-auto custom-scrollbar select-none">
            <div className="text-[11px] font-bold text-[var(--text-muted)] px-3 py-1 mb-1">
              بخش‌های مدیریتی
            </div>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'clay-btn-primary shadow-sm'
                      : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Active Tab Content Container with TabErrorBoundary */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[var(--card-bg)]">
            <AdminTabErrorBoundary activeTab={activeTab}>
              {activeTab === 'products' && <AdminProductsTab />}
              {activeTab === 'orders' && <AdminOrdersTab onRefreshCount={fetchBadgeCounts} />}
              {activeTab === 'messages' && <AdminMessagesTab onRefreshCount={fetchBadgeCounts} />}
              {activeTab === 'users' && <AdminUsersTab />}
              {activeTab === 'finance' && <AdminFinanceTab />}
              {activeTab === 'analytics' && <AdminAnalyticsTab />}
              {activeTab === 'news' && <AdminNewsTab />}
              {activeTab === 'settings' && <AdminSettingsTab />}
            </AdminTabErrorBoundary>
          </main>
        </div>

      </div>
    </div>
  );
};
