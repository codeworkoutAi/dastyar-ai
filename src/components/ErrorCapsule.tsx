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
      className={`px-3 sm:px-4 w-full max-w-2xl mx-auto transition-all duration-300 transform z-30 select-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/95 dark:bg-zinc-950/95 border border-red-500/35 text-zinc-100 shadow-[0_10px_35px_-5px_rgba(239,68,68,0.25)] backdrop-blur-xl p-3 sm:p-3.5 flex flex-col gap-2.5">
        {/* Top Header & Message */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs sm:text-[13px] text-red-300 mb-0.5 flex items-center gap-1.5">
                <span>عدم برقراری ارتباط با مدل هوش مصنوعی</span>
              </h5>
              <p className="text-[12px] sm:text-[13px] text-zinc-300/95 leading-relaxed break-words font-normal">
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
            className="text-zinc-400 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
            title="بستن اعلان"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs">
          <span className="text-[11px] text-zinc-400/80 font-normal">
            ⏱️ حذف خودکار تا چند لحظه دیگر
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
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all border border-red-500/30 active:scale-95 shadow-xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>تلاش مجدد</span>
            </button>
          </div>
        </div>

        {/* Animated 15-second shrinking countdown bar */}
        <div className="w-full bg-red-500/10 h-1 rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
          <div
            className="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full animate-error-progress"
            style={{ animationDuration: `${durationSeconds}s` }}
          />
        </div>
      </div>
    </div>
  );
};
