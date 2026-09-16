import React, { useState, useRef, useEffect } from 'react';
import {
  HamburgerMenuLinearIcon,
  SettingsMinimalisticLinearIcon,
  DownloadMinimalisticLinearIcon,
  StarsMinimalisticBoldIcon,
  Code2LinearIcon,
  GlobalLinearIcon,
  MenuDotsLinearIcon,
  BrainOutlineIcon,
  ChatRoundDotsOutlineIcon,
  AltArrowDownOutlineIcon,
  SmartphoneLinearIcon,
  DocumentTextOutlineIcon,
  EyeOutlineIcon,
  Code2OutlineIcon,
  StarsOutlineIcon,
} from '@solar-icons/react';

import { Tooltip } from './Tooltip';
import { usePWAInstall } from '../lib/usePWAInstall';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck, Coins } from 'lucide-react';
import { SmartRoutingAnimation } from './ChatBox';
import { ThemeToggle } from './ThemeToggle';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

export const SmartRoutingBadge: React.FC<{ isStreaming: boolean }> = ({ isStreaming }) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 shadow-[0_0_10px_rgba(37,99,235,0.05)] dark:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all">
      <StarsOutlineIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-[spin_4s_linear_infinite]" />
      <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 routing-glow-text tracking-wide animate-routing-text-breathe whitespace-nowrap">
        مسیریابی هوشمند
      </span>
    </div>
  );
};

export const Header: React.FC = React.memo(() => {
  const { toggleSidebar, setIsSettingsOpen, setIsExportOpen, setIsAdminOpen, setIsWalletOpen } = useUIStore();
  const { user } = useAuthStore();
  const { settings, setSettings } = useSettingsStore();
  const { activeId, conversations, isStreaming, routingState } = useChatStore();
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const getProviderInfo = () => {
    if (settings.tools.smartRouting) {
      return {
        name: <SmartRoutingBadge isStreaming={isStreaming} />,
        icon: null
      };
    }
    switch (settings.providers.activeProvider) {
      case 'gemini':
        return {
          name: 'Gemini (Flash)',
          icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg gemini-gradient-bg flex items-center justify-center shrink-0 shadow-md"><StarsMinimalisticBoldIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></div>
        };
      case 'openai':
        return {
          name: 'OpenAI (GPT)',
          icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 shadow-md"><Code2LinearIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /></div>
        };
      case 'anthropic':
        return {
          name: 'Claude (Sonnet)',
          icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 shadow-md"><Code2LinearIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /></div>
        };
      case 'custom':
        return {
          name: settings.providers.custom.modelName || 'مدل شخصی',
          icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 shadow-md"><GlobalLinearIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /></div>
        };
      default:
        return {
          name: 'هوش مصنوعی',
          icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-zinc-500/15 flex items-center justify-center shrink-0 shadow-md"><Code2LinearIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-700 dark:text-zinc-500" /></div>
        };
    }
  };

  const providerInfo = getProviderInfo();

  const dropdownModels = React.useMemo(() => {
    const roles = settings.tools.routingRoles;
    const profiles = settings.providers.custom.profiles || [];
    const getProfileModelName = (id: string) => {
      const p = profiles.find((x: any) => x.id === id);
      return p ? (p.modelName || p.name) : id;
    };

    const list = [];
    if (roles?.default) list.push({ id: roles.default, name: getProfileModelName(roles.default), icon: <BrainOutlineIcon className="w-4 h-4 shrink-0 text-indigo-400" /> });
    if (roles?.coding) list.push({ id: roles.coding, name: getProfileModelName(roles.coding), icon: <Code2OutlineIcon className="w-4 h-4 shrink-0 text-cyan-400" /> });
    if (roles?.vision) list.push({ id: roles.vision, name: getProfileModelName(roles.vision), icon: <EyeOutlineIcon className="w-4 h-4 shrink-0 text-emerald-400" /> });

    if (list.length === 0) {
      profiles.slice(0, 3).forEach((p: any) => {
        list.push({ id: p.id, name: p.modelName || p.name, icon: <Code2LinearIcon className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-400" /> });
      });
    }
    return list;
  }, [settings.tools.routingRoles, settings.providers.custom.profiles]);

  const isAnimating = isStreaming && settings.tools.smartRouting && routingState !== 'idle';

  return (
    <header className="relative flex items-center justify-center z-20 shrink-0 select-none border-b border-subtle clay-header backdrop-blur-md h-16 sm:h-18">

      {/* -------------------- Original Header Content -------------------- */}
      <div className={`absolute inset-0 px-2.5 sm:px-4 md:px-6 flex items-center justify-between w-full h-full transition-all duration-500 ease-out ${isAnimating ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}>

        {/* 1. Right Side (Start) - Sidebar Toggle & Chat Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 z-10 w-1/3 justify-start">
          <Tooltip content="منوی گفتگوها">
            <button
              id="sidebar-toggle-btn"
              onClick={() => toggleSidebar()}
              className="clay-btn w-11 h-11 flex items-center justify-center text-inherit hover:opacity-90 rounded-xl sm:rounded-2xl shrink-0"
              aria-label="Toggle Sidebar"
            >
              <HamburgerMenuLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </Tooltip>

          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="font-extrabold text-xs sm:text-base md:text-lg tracking-tight truncate flex items-center gap-1.5">
              <ChatRoundDotsOutlineIcon className="w-4 h-4 opacity-50 hidden md:block" />
              <span className="hidden sm:inline">دستیار هوشمند</span>
              <span className="sr-only">دستیار هوشمند | چت با هوش مصنوعی رایگان و فارسی</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] opacity-70 truncate hidden sm:block">
              قدرتمند شده با زبان فارسی
            </p>
          </div>
        </div>

        {/* 2. Absolute Center - Model Selector */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-40">
          <div className="pointer-events-auto min-w-[120px] max-w-[280px] sm:max-w-sm w-auto relative flex justify-center">
            <ModelSelectorDropdown />
          </div>
        </div>

        {/* 3. Left Side (End) - Tools & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 z-10 w-1/3 justify-end">

          {/* Desktop View Tools (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2 md:gap-3">

            {/* Export Button */}
            {activeConversation && activeConversation.messages.length > 0 && (
              <Tooltip content="خروجی و ذخیره گفتگو">
                <button
                  id="header-export-btn"
                  onClick={() => setIsExportOpen(true)}
                  className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl sm:rounded-2xl cursor-pointer"
                  aria-label="Export Chat"
                >
                  <DownloadMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Tooltip>
            )}

            {/* Install PWA Button */}
            {isInstallable && (
              <Tooltip content="نصب برنامه (App)">
                <button
                  onClick={install}
                  className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl sm:rounded-2xl text-blue-500 font-bold cursor-pointer"
                  aria-label="Install App"
                >
                  <SmartphoneLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Tooltip>
            )}

            {/* Wallet Balance Pill for Logged-in Users */}
            {user && (
              <Tooltip content={`موجودی کیف پول: ${(user.walletBalance || 0).toLocaleString('fa-IR')} تومان (کلیک برای شارژ سریع با مبلغ دلخواه)`}>
                <button
                  id="header-wallet-btn"
                  onClick={() => setIsWalletOpen(true)}
                  className="clay-btn h-11 px-2.5 sm:px-3 flex items-center gap-1.5 hover:opacity-90 rounded-xl sm:rounded-2xl cursor-pointer text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all active:scale-95"
                  aria-label="کیف پول و شارژ اعتبار"
                >
                  <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="hidden md:inline font-mono" dir="rtl">
                    {(user.walletBalance || 0).toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-zinc-500">تومان</span>
                  </span>
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                    +
                  </span>
                </button>
              </Tooltip>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle variant="clay" />

            {/* Admin panel button */}
            {user?.role === 'admin' && (
              <Tooltip content="تنظیمات سیستم (پنل مدیریت)">
                <button
                  id="header-admin-btn"
                  onClick={() => setIsAdminOpen(true)}
                  className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 relative rounded-xl sm:rounded-2xl cursor-pointer text-blue-600 dark:text-blue-400"
                  aria-label="Admin Settings"
                >
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Tooltip>
            )}

            {/* Settings button */}
            <Tooltip content="تنظیمات سیستم (تم، پالت رنگی، مدل‌ها و قلم)">
              <button
                id="header-settings-btn"
                onClick={() => setIsSettingsOpen(true)}
                className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 relative rounded-xl sm:rounded-2xl cursor-pointer"
                aria-label="Open Settings"
              >
                <SettingsMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Tooltip>
          </div>

          {/* Mobile Dropdown Menu (Visible on Mobile) */}
          <div className="sm:hidden flex items-center gap-1.5" ref={mobileMenuRef}>
            {/* Quick Theme Toggle on Mobile */}
            <ThemeToggle variant="clay" className="!w-10 !h-10 !rounded-xl" />

            <Tooltip content="ابزارهای بیشتر">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="clay-btn w-10 h-10 flex items-center justify-center hover:opacity-90 rounded-xl cursor-pointer"
                aria-label="More Options"
              >
                <MenuDotsLinearIcon className="w-5 h-5" />
              </button>
            </Tooltip>

            {showMobileMenu && (
              <div className="absolute top-full mt-2 left-0 w-52 clay-card shadow-2xl z-50 flex flex-col gap-1 p-2 animate-fadeIn border border-subtle" dir="rtl">
                {user && (
                  <button
                    onClick={() => { setIsWalletOpen(true); setShowMobileMenu(false); }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-right cursor-pointer text-emerald-700 dark:text-emerald-300"
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold">کیف پول و شارژ</span>
                    </div>
                    <span className="text-xs font-mono font-bold" dir="rtl">
                      {(user.walletBalance || 0).toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ت</span>
                    </span>
                  </button>
                )}

                {activeConversation && activeConversation.messages.length > 0 && (
                  <button onClick={() => { setIsExportOpen(true); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer">
                    <DownloadMinimalisticLinearIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-[var(--text-main)]">خروجی گفتگو</span>
                  </button>
                )}

                {isInstallable && (
                  <button onClick={() => { install(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer">
                    <SmartphoneLinearIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-[var(--text-main)]">نصب برنامه</span>
                  </button>
                )}

                <div className="h-px bg-[var(--border-color)] opacity-50 my-1" />

                {user?.role === 'admin' && (
                  <button onClick={() => { setIsAdminOpen(true); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold">پنل مدیریت سیستم</span>
                  </button>
                )}

                <button onClick={() => { setIsSettingsOpen(true); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer">
                  <SettingsMinimalisticLinearIcon className="w-4 h-4 text-[var(--text-main)]" />
                  <span className="text-xs font-bold text-[var(--text-main)]">تنظیمات پیشرفته</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------- Animation Content -------------------- */}
      <div className={`absolute inset-0 w-full h-full flex items-center justify-center px-4 transition-all duration-500 delay-100 ${isAnimating ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}`}>
        <div className="w-full h-full max-w-4xl flex items-center justify-center">
          <SmartRoutingAnimation routingState={isStreaming && routingState !== 'idle' ? routingState : null} />
        </div>
      </div>
    </header>
  );
});
