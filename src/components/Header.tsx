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
} from '@solar-icons/react';
import { AppSettings, Conversation } from '../types';
import { calculateSessionStats } from '../utils/pricing';
import { Tooltip } from './Tooltip';
import { usePWAInstall } from '../lib/usePWAInstall';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';

const SmartRoutingDiagram = ({ isStreaming, routingState }: { isStreaming: boolean, routingState: 'idle' | 'general' | 'vision' | 'coding' }) => {
  let statusText = '';
  if (isStreaming) {
    if (routingState === 'vision') statusText = 'در حال پردازش تصویر...';
    else if (routingState === 'coding') statusText = 'در حال تحلیل کد...';
    else if (routingState === 'general') statusText = 'در حال پردازش متن...';
  }

  return (
    <div className="flex items-center gap-2 sm:gap-2.5" dir="ltr">
      {/* Source Node */}
      <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/15 border border-indigo-500/30 transition-all duration-300 ${isStreaming ? '' : 'opacity-70'}`}>
        <BrainOutlineIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
        {isStreaming && <span className="absolute inset-0 rounded-lg sm:rounded-xl border border-indigo-400/50 animate-ping opacity-20" />}
      </div>

      {/* Connection Path */}
      <div className="flex items-center h-[2px] w-6 sm:w-10 bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden rounded-full">
        {isStreaming && <div className="h-full w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />}
      </div>

      {/* Target Nodes (Horizontal) */}
      <div className="flex items-center gap-1 sm:gap-1.5 transition-all duration-300">
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center transition-all duration-300 ${isStreaming && routingState === 'general' ? 'scale-110 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : isStreaming ? 'opacity-30 grayscale' : 'opacity-50 grayscale'}`}>
          <DocumentTextOutlineIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 ${isStreaming && routingState === 'general' ? 'animate-pulse' : ''}`} />
        </div>
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center transition-all duration-300 ${isStreaming && routingState === 'coding' ? 'scale-110 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : isStreaming ? 'opacity-30 grayscale' : 'opacity-50 grayscale'}`}>
          <Code2OutlineIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 ${isStreaming && routingState === 'coding' ? 'animate-pulse' : ''}`} />
        </div>
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center transition-all duration-300 ${isStreaming && routingState === 'vision' ? 'scale-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : isStreaming ? 'opacity-30 grayscale' : 'opacity-50 grayscale'}`}>
          <EyeOutlineIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 ${isStreaming && routingState === 'vision' ? 'animate-pulse' : ''}`} />
        </div>
      </div>
      
      {/* Status Text (Visible only when streaming) */}
      {statusText && (
        <div className="ml-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 animate-fadeIn" dir="rtl">
          <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{statusText}</span>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = React.memo(() => {
  const { sidebarOpen, toggleSidebar, setIsSettingsOpen, setIsExportOpen } = useUIStore();
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

  const sessionStats = React.useMemo(() => {
    return calculateSessionStats(conversations || (activeConversation ? [activeConversation] : []));
  }, [conversations, activeConversation]);

  const getProviderInfo = () => {
    if (settings.tools.smartRouting) {
      return {
        name: <SmartRoutingDiagram isStreaming={isStreaming} routingState={routingState} />,
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

  return (
    <header className="relative h-16 sm:h-18 px-2.5 sm:px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none border-b border-subtle clay-header backdrop-blur-md">

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

        <div className="min-w-0 hidden sm:flex flex-col justify-center">
          <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight truncate flex items-center gap-1.5">
            <ChatRoundDotsOutlineIcon className="w-4 h-4 opacity-50 hidden md:block" />
            دستیارهوشمند
          </h1>
          <p className="text-[10px] sm:text-[11px] opacity-70 truncate">
            پشتیبانی از زبان فارسی با هوش مصنوعی
          </p>
        </div>
      </div>

      {/* 2. Absolute Center - Interactive Model Label Pill */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
        <div className="pointer-events-auto w-56 relative" ref={dropdownRef}>
          {isStreaming ? (
            <div
              className="group flex items-center justify-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl transition-all w-full"
              dir="ltr"
            >
              {providerInfo.icon ? (
                <>
                  {providerInfo.icon}
                  <span className="font-extrabold text-sm sm:text-base text-[var(--accent-text)] truncate mt-0.5">
                    {providerInfo.name}
                  </span>
                </>
              ) : (
                typeof providerInfo.name === 'string' ? (
                  <span className="font-extrabold text-sm sm:text-base text-[var(--accent-text)] truncate mt-0.5">
                    {providerInfo.name}
                  </span>
                ) : (
                  providerInfo.name
                )
              )}
              <AltArrowDownOutlineIcon className="w-3.5 h-3.5 text-[var(--text-main)] opacity-30 shrink-0" />
            </div>
          ) : (
            <Tooltip content="تغییر سریع مدل یا باز کردن تنظیمات" className="w-full">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="group flex items-center justify-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2 clay-btn rounded-xl sm:rounded-2xl hover:opacity-90 transition-all shadow-sm cursor-pointer w-full"
                dir="ltr"
              >
                {providerInfo.icon ? (
                  <>
                    {providerInfo.icon}
                    <span className="font-extrabold text-sm sm:text-base text-[var(--accent-text)] truncate mt-0.5">
                      {providerInfo.name}
                    </span>
                  </>
                ) : (
                  typeof providerInfo.name === 'string' ? (
                    <span className="font-extrabold text-sm sm:text-base text-[var(--accent-text)] truncate mt-0.5">
                      {providerInfo.name}
                    </span>
                  ) : (
                    providerInfo.name
                  )
                )}
                <AltArrowDownOutlineIcon className={`w-3.5 h-3.5 text-[var(--text-main)] opacity-50 group-hover:opacity-100 transition-all shrink-0 ${showModelDropdown ? 'rotate-180' : ''}`} />
              </button>
            </Tooltip>
          )}

          {/* Dropdown Menu */}
          {showModelDropdown && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 overflow-hidden" dir="rtl">
              <button
                onClick={() => {
                  setSettings({ ...settings, tools: { ...settings.tools, smartRouting: !settings.tools.smartRouting } });
                  setShowModelDropdown(false);
                }}
                className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer w-full text-center ${settings.tools.smartRouting ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
              >
                مسیریابی هوشمند
              </button>

              <div className="h-px bg-white dark:bg-zinc-800 my-1 mx-2" />

              {/* Models List */}
              {dropdownModels.map((model) => (
                <button
                  key={model.id}
                  dir="ltr"
                  onClick={() => {
                    const newSettings = { ...settings };
                    newSettings.tools.smartRouting = false;
                    newSettings.providers.activeProvider = 'custom';
                    newSettings.providers.custom.activeProfileId = model.id;
                    setSettings(newSettings);
                    setShowModelDropdown(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer w-full text-left ${!settings.tools.smartRouting && settings.providers.activeProvider === 'custom' && settings.providers.custom.activeProfileId === model.id ? 'bg-white dark:bg-zinc-800 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-400'}`}
                >
                  {model.icon}
                  <div className="flex flex-col min-w-0 items-start">
                    <span className="truncate w-full">{model.name}</span>
                  </div>
                </button>
              ))}

              <div className="h-px bg-white dark:bg-zinc-800 my-1 mx-2" />
              <button
                onClick={() => {
                  setShowModelDropdown(false);
                  setIsSettingsOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 cursor-pointer w-full mt-1"
              >
                <SettingsMinimalisticLinearIcon className="w-4 h-4 shrink-0" />
                تنظیمات پیشرفته...
              </button>
            </div>
          )}
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
        <div className="sm:hidden relative" ref={mobileMenuRef}>
          <Tooltip content="ابزارهای بیشتر">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl cursor-pointer"
              aria-label="More Options"
            >
              <MenuDotsLinearIcon className="w-5 h-5" />
            </button>
          </Tooltip>

          {showMobileMenu && (
            <div className="absolute top-full mt-2 left-0 w-48 clay-card shadow-2xl z-50 flex flex-col gap-1 p-2 animate-fadeIn border border-subtle" dir="rtl">
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

              <button onClick={() => { setIsSettingsOpen(true); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer">
                <SettingsMinimalisticLinearIcon className="w-4 h-4 text-[var(--text-main)]" />
                <span className="text-xs font-bold text-[var(--text-main)]">تنظیمات پیشرفته</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
