import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share, PlusSquare, MoreVertical, Download, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isBazaarEnvironment } from '../lib/bazaarUtils';
import { usePWAInstall } from '../lib/usePWAInstall';

const DISMISS_KEY = 'pwa_install_banner_dismissed_until';
const DISMISS_HOURS = 24; // 24 hours polite reminder

export const PWAInstallBanner: React.FC = () => {
  const { isStandalone, isIOS, isMobile, hasDeferredPrompt, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check dismiss persistence in localStorage
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      const expireTime = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(expireTime));
    } catch {
      // Ignore localStorage write failures
    }
  };

  const handleInstallClick = async () => {
    if (hasDeferredPrompt) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setIsDismissed(true);
        return;
      }
    }
    // If not supported directly by browser (e.g. iOS Safari), open the simple guide modal
    setShowGuide(true);
  };

  // Strictly guard:
  // 1. Only show floating banner on mobile screens
  // 2. Never show in native Capacitor app or Cafe Bazaar builds
  // 3. Never show if already running as standalone installed app
  // 4. Never show if temporarily dismissed within 24 hours
  if (!isMobile || Capacitor.isNativePlatform() || isBazaarEnvironment() || isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      <aside
        aria-label="اعلان نصب وب‌اپلیکیشن"
        className="fixed top-18 sm:top-20 inset-x-0 mx-auto z-30 w-[92%] max-w-sm pointer-events-auto animate-slideDown"
        dir="rtl"
      >
        {/* Distinct solid background with clean contrast: Slate-800 in dark, White in light */}
        <div className="clay-card rounded-2xl p-2.5 sm:p-3 shadow-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e293b] flex items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                نصب اپلیکیشن دستیار
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                سریع‌تر و روان‌تر
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="clay-btn clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نصب</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
              aria-label="بستن اعلان نصب"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Visual Guide Modal for iOS Safari / Non-prompt browsers */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          dir="rtl"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="relative w-full max-w-sm clay-modal rounded-3xl p-5 shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-right animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {isIOS ? 'راهنمای نصب در آیفون (iOS)' : 'راهنمای افزودن به صفحه اصلی'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="بستن راهنما"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <p className="text-slate-500 dark:text-slate-400">
                  برای نصب دستیار هوشمند روی آیفون در مرورگر Safari، این مراحل ساده را طی کنید:
                </p>

                <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ۱
                  </div>
                  <div>
                    در نوار پایین مرورگر Safari، دکمه اشتراک‌گذاری (
                    <Share className="inline w-3.5 h-3.5 text-blue-500 mx-1 align-baseline" />
                    <span className="font-bold">Share</span>) را لمس کنید.
                  </div>
                </div>

                <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ۲
                  </div>
                  <div>
                    در منوی باز شده، به پایین اسکرول کنید و گزینه (
                    <PlusSquare className="inline w-3.5 h-3.5 text-emerald-500 mx-1 align-baseline" />
                    <span className="font-bold">Add to Home Screen</span> یا افزودن به صفحه اصلی) را انتخاب کنید.
                  </div>
                </div>

                <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ۳
                  </div>
                  <div>
                    در گوشه بالای صفحه روی گزینه <span className="font-bold text-blue-500">Add</span> بزنید. آیکون برنامه به صفحه گوشی شما اضافه خواهد شد.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <p className="text-slate-500 dark:text-slate-400">
                  برای نصب برنامه از طریق مرورگر گوشی، این مراحل را دنبال کنید:
                </p>

                <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ۱
                  </div>
                  <div>
                    در بالاترین قسمت صفحه، روی منوی سه‌نقطه مرورگر (
                    <MoreVertical className="inline w-3.5 h-3.5 text-zinc-400 mx-0.5 align-baseline" />
                    کنار آدرس سایت) بزنید.
                  </div>
                </div>

                <div className="clay-surface rounded-xl p-3 flex items-start gap-2.5 border border-subtle">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ۲
                  </div>
                  <div>
                    در منوی بازشده مرورگر، گزینه <span className="font-bold text-emerald-500">«نصب برنامه»</span> یا{' '}
                    <span className="font-bold">«افزودن به صفحه اصلی»</span> (Install app / Add to Home screen) را انتخاب کنید.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="clay-btn clay-btn-primary w-full mt-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>متوجه شدم</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
