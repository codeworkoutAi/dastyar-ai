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
      className={`px-3 w-full max-w-lg mx-auto transition-all duration-300 transform z-30 select-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="relative overflow-hidden rounded-xl bg-zinc-900/95 dark:bg-zinc-950/95 border border-zinc-700/60 dark:border-zinc-800 text-zinc-100 shadow-md backdrop-blur-md p-2.5 sm:p-3 flex flex-col gap-2">
        {/* Top Header & Message */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-zinc-200 leading-relaxed break-words font-normal">
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
            className="text-zinc-400 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer shrink-0 -mt-0.5"
            title="بستن اعلان"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
          <span className="text-[10.5px] text-zinc-500 font-normal">
            ⏱️ حذف خودکار (۱۵ ثانیه)
          </span>

          <div className="flex items-center gap-1.5 mr-auto">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-normal cursor-pointer transition-all border border-zinc-700/70 active:scale-95"
              >
                <Settings className="w-3 h-3 text-zinc-400" />
                <span>تنظیمات مدل</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRetry}
              className="bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium cursor-pointer transition-all border border-red-500/20 active:scale-95"
            >
              <RotateCw className="w-3 h-3" />
              <span>تلاش مجدد</span>
            </button>
          </div>
        </div>

        {/* Ultra-slim 15-second shrinking countdown bar */}
        <div className="w-full bg-zinc-800 h-0.5 rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
          <div
            className="bg-red-400/60 h-full rounded-full animate-error-progress"
            style={{ animationDuration: `${durationSeconds}s` }}
          />
        </div>
      </div>
    </div>
  );
};
