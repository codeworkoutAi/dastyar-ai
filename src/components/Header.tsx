import React from 'react';
import { 
  HamburgerMenuLineDuotoneIcon, 
  SettingsMinimalisticLineDuotoneIcon, 
  DownloadMinimalisticLineDuotoneIcon, 
  StarsMinimalisticBoldDuotoneIcon, 
  HelpLineDuotoneIcon, 
  Code2LineDuotoneIcon, 
  GlobalLineDuotoneIcon
} from '@solar-icons/react';
import { Menu, Settings as SettingsIcon, Download, Monitor, Smartphone, Sparkles, HelpCircle, Code2, Globe } from 'lucide-react';
import { AppSettings, Conversation } from '../types';
import { calculateSessionStats } from '../utils/pricing';
import { Tooltip } from './Tooltip';

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
  const sessionStats = React.useMemo(() => {
    return calculateSessionStats(conversations || (activeConversation ? [activeConversation] : []));
  }, [conversations, activeConversation]);
  const getProviderLabel = () => {
    switch (settings.providers.activeProvider) {
    case 'gemini':
      return <div className="w-5 h-5 rounded-md gemini-gradient-bg flex items-center justify-center shrink-0"><StarsMinimalisticBoldDuotoneIcon className="w-3.5 h-3.5 text-white" /></div>;
    case 'openai':
      return <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0"><Code2LineDuotoneIcon className="w-3.5 h-3.5 text-emerald-500" /></div>;
    case 'anthropic':
      return <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0"><Code2LineDuotoneIcon className="w-3.5 h-3.5 text-amber-500" /></div>;
    case 'custom':
      return <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0"><GlobalLineDuotoneIcon className="w-3.5 h-3.5 text-blue-500" /></div>;
    default:
        return 'هوش مصنوعی';
    }
  };

  return (
    <header className="h-16 sm:h-18 px-2.5 sm:px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none border-b border-subtle clay-header backdrop-blur-md">
      {/* Right side in RTL (Start) */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
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

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl gemini-gradient-bg text-white flex items-center justify-center shadow-md">
              <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--card-bg)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight truncate hidden min-[360px]:block">
                دستیار هوشمند
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold clay-btn">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span className="opacity-70 text-[11px]">مدل:</span>
                <span className="font-bold text-[var(--accent-text)]">{getProviderLabel()}</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] opacity-70 hidden md:block truncate">
              پشتیبانی از زبان فارسی با هوش مصنوعی چندمدلی
            </p>
          </div>
        </div>
      </div>

      {/* Left side in RTL (End Actions) */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
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
              <span dir="ltr" className="font-bold text-zinc-200">
                {sessionStats.totalTokens >= 1000 
                  ? `${(sessionStats.totalTokens / 1000).toFixed(1)}k` 
                  : sessionStats.totalTokens}
              </span>
              <span className="opacity-40">•</span>
              <span dir="ltr" className="text-emerald-400 font-bold">
                ~${sessionStats.totalCostUSDFormatted}
              </span>
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
    </header>
  );
};
