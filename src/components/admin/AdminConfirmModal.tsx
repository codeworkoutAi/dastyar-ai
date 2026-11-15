import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2, X, RefreshCw } from 'lucide-react';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  requireInputText?: string;
  inputPlaceholder?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  title,
  message,
  description,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  isDanger = true,
  isLoading,
  loading,
  requireInputText,
  inputPlaceholder,
  onConfirm,
  onClose
}) => {
  const [typedInput, setTypedInput] = useState('');

  const effectiveMessage = description || message || '';
  const effectiveConfirmText = confirmLabel || confirmText || 'بله، انجام شود';
  const effectiveCancelText = cancelLabel || cancelText || 'انصراف';
  const effectiveLoading = Boolean(loading ?? isLoading);

  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !effectiveLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, effectiveLoading, onClose]);

  if (!isOpen) return null;

  const isRequirementMet = !requireInputText || typedInput.trim() === requireInputText.trim();

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="w-full max-w-md clay-modal p-6 rounded-3xl space-y-5 shadow-2xl relative animate-scaleUp">
        {/* Close Button */}
        {!effectiveLoading && (
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-1.5 rounded-xl clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="انصراف (Esc)"
          >
            <X size={16} />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {isDanger ? <Trash2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base text-[var(--text-main)]">
              {title}
            </h4>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              عملیات مدیریتی سیستم
            </span>
          </div>
        </div>

        {/* Modal Description */}
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {effectiveMessage}
        </p>

        {/* Text Confirmation Guard Input (e.g. for RESET-DB) */}
        {requireInputText && (
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-[var(--text-muted)] block">
              جهت تایید قطعی، عبارت{' '}
              <span className="font-mono text-red-500 font-black select-all px-1.5 py-0.5 rounded-md clay-surface">
                {requireInputText}
              </span>{' '}
              را دقیقاً در کادر زیر تایپ کنید:
            </label>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={inputPlaceholder || `تایپ ${requireInputText}...`}
              className="w-full px-3.5 py-2.5 rounded-xl clay-surface text-xs font-mono font-bold text-[var(--text-main)] outline-hidden border border-red-500/30"
              dir="ltr"
              autoFocus
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--card-border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={effectiveLoading}
            className="px-4 py-2.5 clay-btn rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-zinc-500/10 transition-all cursor-pointer disabled:opacity-40"
          >
            {effectiveCancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={effectiveLoading || !isRequirementMet}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                : 'clay-btn-primary'
            }`}
          >
            {effectiveLoading && <RefreshCw size={13} className="animate-spin" />}
            <span>{effectiveConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
