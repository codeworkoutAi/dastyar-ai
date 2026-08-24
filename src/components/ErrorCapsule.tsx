import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCw, Settings, X } from 'lucide-react';

interface ErrorCapsuleProps {
  error: {
    message: string;
    timestamp: number;
  } | null;
  onDismiss: () => void;
  onRetry: () => void;
  onOpenSettings?: () => void;
  durationSeconds?: number;
}

export const ErrorCapsule: React.FC<ErrorCapsuleProps> = ({
  error,
  onDismiss,
  onRetry,
  onOpenSettings,
  durationSeconds = 15,
}) => {
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
        className={`pointer-events-auto w-full max-w-sm sm:max-w-md relative overflow-hidden rounded-2xl bg-zinc-900/95 dark:bg-zinc-900/95 border border-zinc-700/80 text-zinc-100 shadow-2xl backdrop-blur-2xl p-4 sm:p-4.5 flex flex-col gap-3.5 transition-all duration-300 transform ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
        }`}
      >
        {/* Top Header & Message */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs sm:text-[13px] text-zinc-100 mb-1 flex items-center gap-1.5">
                <span>عدم برقراری ارتباط با مدل هوش مصنوعی</span>
              </h5>
              <p className="text-[12px] sm:text-[12.5px] text-zinc-300 leading-relaxed break-words font-normal">
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
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 -mt-0.5"
            title="بستن اعلان"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-xs">
          <span className="text-[11px] text-zinc-400 font-normal">
            ⏱️ حذف خودکار (۱۵ ثانیه)
          </span>

          <div className="flex items-center gap-2 mr-auto">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium cursor-pointer transition-all border border-zinc-700 active:scale-95 shadow-xs"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>تنظیمات مدل</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRetry}
              className="bg-zinc-800 hover:bg-zinc-700 text-rose-400 hover:text-rose-300 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-medium cursor-pointer transition-all border border-rose-500/30 active:scale-95 shadow-xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>تلاش مجدد</span>
            </button>
          </div>
        </div>

        {/* 15-second shrinking countdown bar */}
        <div className="w-full bg-zinc-800/80 h-1 rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
          <div
            className="bg-rose-500/60 h-full rounded-full animate-error-progress"
            style={{ animationDuration: `${durationSeconds}s` }}
          />
        </div>
      </div>
    </div>
  );
};
