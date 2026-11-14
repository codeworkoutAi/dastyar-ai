import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPrompt) {
      return window.__deferredPrompt;
    }
    return null;
  });
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed PWA)
    const checkStandalone = () => {
      const isWindowStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return Boolean(isWindowStandalone || isNavigatorStandalone);
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    // Check iOS device
    const ua = window.navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isAppleDevice);

    // Check Mobile
    const checkIsMobile = () => {
      return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent) || window.innerWidth < 768;
    };
    setIsMobile(checkIsMobile());

    // If early event was already caught in index.html head script
    if (window.__deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt);
      setIsInstallable(true);
    }

    const handlePromptReady = () => {
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
        setIsInstallable(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__deferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      window.__deferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);
    if (!promptEvent) {
      return 'unsupported';
    }
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setIsStandalone(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') window.__deferredPrompt = null;
      }
      return choice.outcome;
    } catch (err) {
      console.warn('PWA install prompt failed:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  const promptOrGuide = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstallable(false);
          setIsStandalone(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') window.__deferredPrompt = null;
          return 'accepted';
        }
        return choice.outcome;
      } catch (err) {
        console.warn('Native PWA prompt failed, opening visual guide:', err);
      }
    }
    // Fallback: If native prompt unavailable (iOS Safari, Firefox, or Chrome prompt not ready), show visual guide
    setIsGuideOpen(true);
    return 'unsupported';
  }, [deferredPrompt]);

  return {
    isInstallable: isInstallable || Boolean(deferredPrompt) || Boolean(typeof window !== 'undefined' && window.__deferredPrompt),
    isStandalone,
    isIOS,
    isMobile,
    hasDeferredPrompt: Boolean(deferredPrompt) || Boolean(typeof window !== 'undefined' && window.__deferredPrompt),
    isGuideOpen,
    setIsGuideOpen,
    install,
    promptOrGuide,
  };
}