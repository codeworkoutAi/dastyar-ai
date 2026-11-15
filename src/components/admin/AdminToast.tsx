import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface AdminToastFeedback {
  type: 'success' | 'warning' | 'error';
  text: string;
}

export interface AdminToastProps {
  feedback?: AdminToastFeedback | null;
  message?: string;
  type?: 'success' | 'warning' | 'error';
  onClose: () => void;
}

export const AdminToast: React.FC<AdminToastProps> = ({
  feedback,
  message,
  type = 'success',
  onClose
}) => {
  const text = message || feedback?.text;
  const toastType = type || feedback?.type || 'success';

  if (!text) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] shadow-xl min-w-[320px] max-w-md p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-slideUpScale ${
        toastType === 'success'
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          : toastType === 'warning'
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
          : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {toastType === 'success' ? (
          <CheckCircle2 size={18} className="shrink-0" />
        ) : (
          <AlertCircle size={18} className="shrink-0" />
        )}
        <span className="leading-relaxed">{text}</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:opacity-75 transition-opacity shrink-0 cursor-pointer"
        title="بستن پیام"
      >
        <X size={15} />
      </button>
    </div>
  );
};
