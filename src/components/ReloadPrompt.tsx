import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 animate-fadeIn shadow-2xl">
      <div className="bg-blue-600/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center gap-4 border border-blue-400/30">
        <div className="flex-1 text-sm font-medium">
          {offlineReady ? (
            <span>برنامه برای کار در حالت آفلاین آماده است.</span>
          ) : (
            <span>نسخه جدیدی از دستیار آماده است. برای اعمال رفرش کنید.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>به‌روزرسانی</span>
            </button>
          )}
          <button
            onClick={close}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="بستن اعلان به‌روزرسانی"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};