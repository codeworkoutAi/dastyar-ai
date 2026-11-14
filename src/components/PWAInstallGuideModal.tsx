import React from 'react';
import { Smartphone, X, Share, PlusSquare, MoreVertical, CheckCircle2, MonitorDown } from 'lucide-react';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS?: boolean;
  isMobile?: boolean;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS = false,
  isMobile = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm clay-modal rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-right animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              {isMobile ? <Smartphone className="w-4.5 h-4.5" /> : <MonitorDown className="w-4.5 h-4.5" />}
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {isIOS ? 'راهنمای نصب در آیفون (iOS)' : isMobile ? 'راهنمای نصب در اندروید' : 'راهنمای نصب برنامه در رایانه'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="بستن راهنما"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <p className="text-slate-500 dark:text-slate-400">
              برای نصب وب‌اپلیکیشن دستیار روی آیفون در مرورگر Safari:
            </p>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۱
              </div>
              <div>
                در نوار پایین Safari، دکمه اشتراک‌گذاری (
                <Share className="inline w-3.5 h-3.5 text-blue-500 mx-1 align-baseline" />
                <span className="font-bold">Share</span>) را لمس کنید.
              </div>
            </div>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۲
              </div>
              <div>
                منو را به پایین بکشید و گزینه (
                <PlusSquare className="inline w-3.5 h-3.5 text-emerald-500 mx-1 align-baseline" />
                <span className="font-bold">Add to Home Screen</span> یا افزودن به صفحه اصلی) را انتخاب کنید.
              </div>
            </div>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۳
              </div>
              <div>
                در بالای صفحه روی دکمه <span className="font-bold text-blue-500">Add</span> بزنید. آیکون دستیار روی صفحه گوشی شما ظاهر می‌شود.
              </div>
            </div>
          </div>
        ) : isMobile ? (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <p className="text-slate-500 dark:text-slate-400">
              برای نصب برنامه روی گوشی‌های اندروید (کروم، سامسونگ یا سایر مرورگرها):
            </p>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۱
              </div>
              <div>
                در بالای مرورگر، روی منوی سه‌نقطه (
                <MoreVertical className="inline w-3.5 h-3.5 text-zinc-400 mx-0.5 align-baseline" />
                کنار آدرس سایت) ضربه بزنید.
              </div>
            </div>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۲
              </div>
              <div>
                گزینه <span className="font-bold text-emerald-500">«نصب برنامه»</span> یا{' '}
                <span className="font-bold">«افزودن به صفحه اصلی»</span> (Install app / Add to Home screen) را لمس کنید.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <p className="text-slate-500 dark:text-slate-400">
              برای نصب دستیار هوشمند به عنوان یک اپلیکیشن مستقل در ویندوز یا مک:
            </p>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۱
              </div>
              <div>
                در انتهای نوار آدرس مرورگر (سمت راست یا چپ)، روی آیکون کوچک <span className="font-bold text-blue-500">نصب (Install)</span> یا علامت دانلود کلیک کنید.
              </div>
            </div>

            <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                ۲
              </div>
              <div>
                همچنین می‌توانید از منوی سه‌نقطه مرورگر کروم، گزینه <span className="font-bold text-emerald-500">«Install Dastyar AI»</span> را انتخاب فرمایید.
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="clay-btn clay-btn-primary w-full mt-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>متوجه شدم</span>
        </button>
      </div>
    </div>
  );
};
