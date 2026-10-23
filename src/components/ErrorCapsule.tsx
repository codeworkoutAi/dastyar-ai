import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCw, Settings, X, Coins, LogIn } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
export const ErrorCapsule: React.FC = React.memo(() => {
  const { activeError: error, setActiveError, regenerate } = useChatStore();
  const { setIsSettingsOpen, setIsWalletOpen } = useUIStore();
  const onDismiss = () => setActiveError(null);
  const onRetry = () => {
    setActiveError(null);
    regenerate();
  };
  const onOpenSettings = () => {
    setActiveError(null);
    setIsSettingsOpen(true);
  };
  const onOpenWallet = () => {
    setActiveError(null);
    setIsWalletOpen(true);
  };
  const durationSeconds = 15;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, durationSeconds * 1000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [error, durationSeconds, onDismiss]);

  if (!error) return null;

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 select-none ${
        visible ? 'opacity-100 backdrop-blur-xs' : 'opacity-0 backdrop-blur-none'
      }`}
    >
      <div
        className={`pointer-events-auto w-full max-w-sm sm:max-w-md relative overflow-hidden rounded-2xl clay-card border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl p-4 sm:p-5 flex flex-col gap-3.5 transition-all duration-300 transform shadow-xl ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
        }`}
      >
        {/* Top Header & Message */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold type-h4 text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                <span>خطای برقراری ارتباط با مدل هوش مصنوعی</span>
              </h5>
              <p className="type-meta text-zinc-700 dark:text-zinc-300 leading-relaxed break-words font-normal">
                {error.message}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 200);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0 -mt-0.5"
            title="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--card-border)] text-xs">
          <span className="type-badge text-zinc-500 dark:text-zinc-400 font-normal">
            ⏳ خودکار بسته می‌شود
          </span>

          <div className="flex items-center gap-2 mr-auto">
            {(!useAuthStore.getState().isAuthenticated || error.message?.includes('مهمان')) ? (
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  useAuthStore.getState().setAuthModalOpen(true);
                }}
                className="clay-btn clay-btn-primary text-white text-xs px-3.5 py-1.5 rounded-btn flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                <span>ورود و دریافت ۱۵ پیام رایگان</span>
              </button>
            ) : (error.insufficientBalance || error.message?.includes('کیف پول') || error.message?.includes('اعتبار')) ? (
              <button
                type="button"
                onClick={onOpenWallet}
                className="clay-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-btn flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm active:scale-95"
              >
                <Coins className="w-3.5 h-3.5 text-white" />
                <span>شارژ فوری کیف پول</span>
              </button>
            ) : onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="clay-btn text-zinc-700 dark:text-zinc-200 text-xs px-3 py-1.5 rounded-btn flex items-center gap-1.5 font-medium cursor-pointer transition-all active:scale-95 border-subtle"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>تنظیمات مدل</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRetry}
              className="clay-btn text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs px-3.5 py-1.5 rounded-btn flex items-center gap-1.5 font-medium cursor-pointer transition-all active:scale-95 border border-rose-500/20"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>تلاش مجدد</span>
            </button>
          </div>
        </div>

        {/* 15-second shrinking countdown bar */}
        <div className="w-full clay-surface h-1 rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
          <div
            className="bg-rose-500/60 h-full rounded-full animate-error-progress"
            style={{ animationDuration: `${durationSeconds}s` }}
          />
        </div>
      </div>
    </div>
  );
});
