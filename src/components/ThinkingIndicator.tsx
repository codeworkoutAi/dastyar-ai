import React from 'react';
import { Sparkles } from 'lucide-react';

interface ThinkingIndicatorProps {
  modelName?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = React.memo(({ modelName = 'Gemini' }) => {
  return (
    <div className="flex flex-col gap-3.5 py-2 px-1 max-w-lg w-full animate-fadeIn" dir="rtl">
      {/* Header with glowing animated icon and live status */}
      <div className="flex items-center gap-3">
        {/* Glowing AI Orb */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] p-[1.5px] shadow-md shadow-blue-500/20 shrink-0">
          <div className="w-full h-full rounded-[14px] bg-[var(--bg-main)] flex items-center justify-center relative overflow-hidden">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent animate-shimmer" />
            <Sparkles className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8] animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        {/* Status Text & Model Name */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-inherit opacity-95 flex items-center gap-1.5">
              <span>در حال تفکر و پردازش...</span>
            </span>
            {/* Animated bouncing colorful dots */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4285f4] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#9b72cb] animate-bounce" style={{ animationDelay: '180ms', animationDuration: '1s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#d96570] animate-bounce" style={{ animationDelay: '360ms', animationDuration: '1s' }} />
            </div>
          </div>
          <span className="text-[11px] text-[var(--text-dim)] font-medium">
            هوش مصنوعی {modelName} در حال تحلیل درخواست و تولید پاسخ
          </span>
        </div>
      </div>

      {/* Shimmering Skeleton Lines */}
      <div className="flex flex-col gap-2 pr-11">
        <div className="h-2 rounded-full bg-slate-400/15 dark:bg-slate-500/20 w-4/5 animate-pulse" />
        <div className="h-2 rounded-full bg-slate-400/10 dark:bg-slate-500/15 w-3/5 animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="h-2 rounded-full bg-slate-400/10 dark:bg-slate-500/10 w-1/2 animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
});
