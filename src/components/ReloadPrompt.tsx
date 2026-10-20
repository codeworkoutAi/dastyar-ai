import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isBazaarEnvironment } from '../lib/bazaarUtils';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // SW Registered successfully
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Strictly guard: Never show in native Capacitor app, Cafe Bazaar builds, or if refresh is not needed
  if (!needRefresh || Capacitor.isNativePlatform() || isBazaarEnvironment()) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) {
      console.warn('Cache purge error:', e);
    }
    await updateServiceWorker(true);
  };

  return (
    <aside 
      aria-label="اعلان به‌روزرسانی برنامه"
      className="fixed top-18 sm:top-20 inset-x-0 mx-auto z-40 w-[92%] sm:w-auto sm:max-w-md pointer-events-auto animate-slideDown"
      dir="rtl"
    >
      <div className="clay-card rounded-2xl p-2.5 sm:p-3 shadow-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e293b] flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500">
            <RefreshCcw className="w-4 h-4 animate-spin" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">نسخه جدید دستیار آماده است</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-300">برای اعمال تغییرات به‌روزرسانی کنید</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleUpdate}
            className="clay-btn clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
          >
            <span>به‌روزرسانی</span>
          </button>
          <button
            onClick={close}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            aria-label="بستن اعلان به‌روزرسانی"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};