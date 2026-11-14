import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share, PlusSquare, MoreVertical, Download, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isBazaarEnvironment } from '../lib/bazaarUtils';
import { usePWAInstall } from '../lib/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

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
      <PWAInstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        isIOS={isIOS}
        isMobile={isMobile}
      />
    </>
  );
};
