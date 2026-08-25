import React, { useState, useRef, useEffect } from 'react';
import { 
  HamburgerMenuLineDuotoneIcon, 
  SettingsMinimalisticLineDuotoneIcon, 
  DownloadMinimalisticLineDuotoneIcon, 
  StarsMinimalisticBoldDuotoneIcon, 
  HelpLineDuotoneIcon, 
  Code2LineDuotoneIcon, 
  GlobalLineDuotoneIcon,
  MenuDotsLineDuotoneIcon
} from '@solar-icons/react';
import { Monitor, Smartphone, MessageSquare, ChevronDown } from 'lucide-react';
import { AppSettings, Conversation } from '../types';
import { calculateSessionStats } from '../utils/pricing';
import { Tooltip } from './Tooltip';
import { usePWAInstall } from '../lib/usePWAInstall';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenImageStudio: () => void;
  onOpenUiGuide?: () => void;
  settings: AppSettings;
  activeConversation: Conversation | null;
  conversations?: Conversation[];
  platformMode: 'windows' | 'android';
  setPlatformMode: (mode: 'windows' | 'android') => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  onNewChat,
  onOpenSettings,
  onOpenExport,
  onOpenImageStudio,
  onOpenUiGuide,
  settings,
  activeConversation,
  conversations,
  platformMode,
  setPlatformMode,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sessionStats = React.useMemo(() => {
    return calculateSessionStats(conversations || (activeConversation ? [activeConversation] : []));
  }, [conversations, activeConversation]);

  const getProviderInfo = () => {
    switch (settings.providers.activeProvider) {
    case 'gemini':
      return { 
        name: 'Gemini (Flash)',
        icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg gemini-gradient-bg flex items-center justify-center shrink-0 shadow-md"><StarsMinimalisticBoldDuotoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></div> 
      };
    case 'openai':
      return { 
        name: 'OpenAI (GPT)',
        icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 shadow-md"><Code2LineDuotoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /></div> 
      };
    case 'anthropic':
      return { 
        name: 'Claude (Sonnet)',
        icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 shadow-md"><Code2LineDuotoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /></div> 
      };
    case 'custom':
      return { 
        name: settings.providers.custom.modelName || 'مدل شخصی',
        icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 shadow-md"><GlobalLineDuotoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /></div> 
      };
    default:
        return { 
          name: 'هوش مصنوعی',
          icon: <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-zinc-500/15 flex items-center justify-center shrink-0 shadow-md"><Code2LineDuotoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" /></div> 
        };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <header className="relative h-16 sm:h-18 px-2.5 sm:px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none border-b border-subtle clay-header backdrop-blur-md">
      
      {/* 1. Right Side (Start) - Sidebar Toggle & Chat Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 z-10 w-1/3 justify-start">
        <Tooltip content="منوی گفتگوها">
          <button
            id="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="clay-btn w-11 h-11 flex items-center justify-center text-inherit hover:opacity-90 rounded-xl sm:rounded-2xl shrink-0"
            aria-label="Toggle Sidebar"
          >
            <HamburgerMenuLineDuotoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </Tooltip>

        <div className="min-w-0 hidden sm:flex flex-col justify-center">
          <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight truncate flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 opacity-50 hidden md:block" />
            {activeConversation?.title || 'دستیار هوشمند'}
          </h1>
          <p className="text-[10px] sm:text-[11px] opacity-70 truncate">
            پشتیبانی از زبان فارسی با هوش مصنوعی
          </p>
        </div>
      </div>

      {/* 2. Absolute Center - Interactive Model Label Pill */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
        <div className="pointer-events-auto max-w-[50%] sm:max-w-[40%]">
          <Tooltip content="برای تغییر مدل کلیک کنید">
            <button 
              onClick={onOpenSettings}
              className="group flex items-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2 clay-btn rounded-xl sm:rounded-2xl hover:opacity-90 transition-all min-w-0 shadow-sm"
              dir="ltr"
            >
              {providerInfo.icon}
              <span className="font-extrabold text-sm sm:text-base text-[var(--accent-text)] truncate mt-0.5">
                {providerInfo.name}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--text-main)] opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 3. Left Side (End) - Tools & Mobile Menu */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 z-10 w-1/3 justify-end">
        
        {/* Desktop View Tools (Hidden on Mobile) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* Platform View Toggle */}
          <div className="hidden xl:flex items-center p-1 clay-input-box rounded-2xl text-xs">
            <Tooltip content="نمای ویندوز (دسکتاپ)">
              <button
                onClick={() => setPlatformMode('windows')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  platformMode === 'windows'
                    ? 'clay-btn font-bold shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>ویندوز</span>
              </button>
            </Tooltip>

            <Tooltip content="نمای اندروید (موبایل)">
              <button
                onClick={() => setPlatformMode('android')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  platformMode === 'android'
                    ? 'clay-btn font-bold shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>اندروید</span>
              </button>
            </Tooltip>
          </div>

          {/* Export Button */}
          {activeConversation && activeConversation.messages.length > 0 && (
            <Tooltip content="خروجی و ذخیره گفتگو">
              <button
                id="header-export-btn"
                onClick={onOpenExport}
                className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl sm:rounded-2xl"
                aria-label="Export Chat"
              >
                <DownloadMinimalisticLineDuotoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Tooltip>
          )}

          {/* Image Studio button */}
          <Tooltip content="استودیوی پیشرفته ساخت تصویر (Midjourney, DALL-E, SD, Flux)">
            <button
              id="header-image-studio-btn"
              onClick={onOpenImageStudio}
              className="clay-btn w-11 lg:w-auto lg:px-3 h-11 flex items-center justify-center hover:opacity-90 gap-1.5 text-purple-400 font-bold text-xs rounded-xl sm:rounded-2xl"
              aria-label="Image Generation Studio"
            >
              <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-pulse" />
              <span className="hidden lg:inline">استودیوی تصویر</span>
            </button>
          </Tooltip>

          {/* UI Guide button */}
          {onOpenUiGuide && (
            <Tooltip content="راهنمای تصویری و نقشه اجزای برنامه (UI Map)">
              <button
                id="header-ui-guide-btn"
                onClick={onOpenUiGuide}
                className="clay-btn w-11 lg:w-auto lg:px-3 h-11 flex items-center justify-center hover:opacity-90 gap-1.5 text-blue-600 dark:text-sky-400 font-bold text-xs rounded-xl sm:rounded-2xl"
                aria-label="UI Visual Guide"
              >
                <HelpLineDuotoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden 2xl:inline">نقشه اجزا</span>
              </button>
            </Tooltip>
          )}

          {/* Live Session Usage Analytics Pill */}
          {sessionStats.totalTokens > 0 && (
            <Tooltip content={`آمار کل نشست: ${sessionStats.totalTokens.toLocaleString('fa-IR')} توکن • هزینه کل: ~$${sessionStats.totalCostUSDFormatted}`}>
              <button
                id="header-session-stats-btn"
                onClick={onOpenSettings}
                className="hidden md:flex items-center gap-1.5 px-3 h-11 clay-btn rounded-xl sm:rounded-2xl text-xs font-mono select-none"
                aria-label="Session Stats"
              >
                <span className="text-amber-400 text-sm">⚡</span>
                <span dir="ltr" className="font-bold text-[var(--text-main)]">
                  {sessionStats.totalTokens >= 1000 
                    ? `${(sessionStats.totalTokens / 1000).toFixed(1)}k` 
                    : sessionStats.totalTokens}
                </span>
                <span className="opacity-40">•</span>
                <span dir="ltr" className="text-emerald-500 font-bold">
                  ~${sessionStats.totalCostUSDFormatted}
                </span>
              </button>
            </Tooltip>
          )}

          {/* Install PWA Button */}
          {isInstallable && (
            <Tooltip content="نصب برنامه (App)">
              <button
                onClick={install}
                className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl sm:rounded-2xl text-blue-500 font-bold"
                aria-label="Install App"
              >
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Tooltip>
          )}

          {/* Settings button */}
          <Tooltip content="تنظیمات سیستم (تم، پالت رنگی، مدل‌ها و قلم)">
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 relative rounded-xl sm:rounded-2xl"
              aria-label="Open Settings"
            >
              <SettingsMinimalisticLineDuotoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              {true && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-400 rounded-full ring-2 ring-[var(--card-bg)] shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* Mobile Dropdown Menu (Visible on Mobile) */}
        <div className="sm:hidden relative" ref={mobileMenuRef}>
          <Tooltip content="ابزارهای بیشتر">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl"
              aria-label="More Options"
            >
              <MenuDotsLineDuotoneIcon className="w-5 h-5" />
            </button>
          </Tooltip>

          {showMobileMenu && (
            <div className="absolute top-full mt-2 left-0 w-48 clay-card shadow-2xl z-50 flex flex-col gap-1 p-2 animate-fadeIn border border-subtle" dir="rtl">
              <button onClick={() => { onOpenImageStudio(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right">
                <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-[var(--text-main)]">استودیو تصویر</span>
              </button>
              
              {activeConversation && activeConversation.messages.length > 0 && (
                <button onClick={() => { onOpenExport(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right">
                  <DownloadMinimalisticLineDuotoneIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-[var(--text-main)]">خروجی گفتگو</span>
                </button>
              )}

              {isInstallable && (
                <button onClick={() => { install(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-[var(--text-main)]">نصب برنامه</span>
                </button>
              )}

              {onOpenUiGuide && (
                <button onClick={() => { onOpenUiGuide(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right">
                  <HelpLineDuotoneIcon className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-[var(--text-main)]">نقشه اجزا</span>
                </button>
              )}

              <div className="h-px bg-[var(--border-color)] opacity-50 my-1" />

              <button onClick={() => { onOpenSettings(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right">
                <SettingsMinimalisticLineDuotoneIcon className="w-4 h-4 text-[var(--text-main)]" />
                <span className="text-xs font-bold text-[var(--text-main)]">تنظیمات پیشرفته</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
