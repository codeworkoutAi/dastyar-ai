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
import { ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UIStyleToggle } from './UIStyleToggle';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';
import { Capacitor } from '@capacitor/core';
import { isBazaarEnvironment } from '../lib/bazaarUtils';

export const SmartRoutingBadge: React.FC<{ isStreaming: boolean }> = ({ isStreaming }) => {
 return (
 <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 shadow-[0_0_10px_rgba(37,99,235,0.05)] dark:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all">
 <StarsOutlineIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-[spin_4s_linear_infinite]" />
 <span className="type-badge sm:type-meta font-bold text-blue-600 dark:text-blue-400 routing-glow-text tracking-wide animate-routing-text-breathe whitespace-nowrap">
 مسیریابی هوشمند
 </span>
 </div>
 );
};

export const Header: React.FC = React.memo(() => {
 const { toggleSidebar, setIsSettingsOpen, setIsExportOpen, setIsAdminOpen } = useUIStore();
 const { user } = useAuthStore();
 const { settings, setSettings } = useSettingsStore();
  const { activeId, conversations, isStreaming } = useChatStore();
 const activeConversation = conversations.find((c) => c.id === activeId) || null;

 const [showMobileMenu, setShowMobileMenu] = useState(false);
 const [showModelDropdown, setShowModelDropdown] = useState(false);
 const mobileMenuRef = useRef<HTMLDivElement>(null);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const { isInstallable, install } = usePWAInstall();
 const isBazaar = isBazaarEnvironment() || Capacitor.isNativePlatform();

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

 return (
 <header className="relative flex items-center justify-center z-20 shrink-0 select-none border-b border-subtle clay-header backdrop-blur-md h-16 sm:h-18">

 {/* -------------------- Header Content -------------------- */}
 <div className="px-2.5 sm:px-4 md:px-6 flex items-center justify-between w-full h-full">

 {/* 1. Right Side (Start) - Sidebar Toggle & Chat Title */}
 <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 z-10 w-[45%] sm:w-1/3 justify-start">
 <Tooltip content="منوی گفتگوها">
 <button
 id="sidebar-toggle-btn"
 onClick={() => toggleSidebar()}
 className="clay-icon-btn w-11 h-11 flex items-center justify-center text-inherit rounded-xl sm:rounded-2xl shrink-0 clay-icon"
 aria-label="Toggle Sidebar"
 >
 <HamburgerMenuLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
 </button>
 </Tooltip>

 <div className="min-w-0 flex flex-col justify-center">
 <h1 className="font-extrabold text-xs sm:text-base md:text-lg tracking-tight truncate flex items-center gap-1.5 sm:gap-2">
	<span>چت با هوش مصنوعی فارسی</span>
	</h1>
 <p className="type-badge opacity-70 truncate hidden sm:block">
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
 <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 z-10 w-[45%] sm:w-1/3 justify-end">

 {/* Desktop View Tools (Hidden on Mobile) */}
 <div className="hidden sm:flex items-center gap-1 sm:gap-2 md:gap-3">



 {/* Install PWA Button */}
 {isInstallable && (
 <Tooltip content="نصب برنامه (App)">
 <button
 onClick={install}
 className="clay-icon-btn w-11 h-11 flex items-center justify-center text-blue-500 font-bold cursor-pointer clay-icon"
 aria-label="Install App"
 >
 <SmartphoneLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
 </button>
 </Tooltip>
 )}

 {/* Theme Toggle Button */}
 <ThemeToggle variant="clay" />
 <UIStyleToggle variant="clay" />

 {/* Admin panel button */}
 {user?.role === 'admin' && (
 <Tooltip content="تنظیمات سیستم (پنل مدیریت)">
 <button
 id="header-admin-btn"
 onClick={() => setIsAdminOpen(true)}
 className="clay-icon-btn w-11 h-11 flex items-center justify-center relative rounded-xl sm:rounded-2xl cursor-pointer text-rose-500 dark:text-rose-400 clay-icon"
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
 className="clay-icon-btn w-11 h-11 flex items-center justify-center relative rounded-xl sm:rounded-2xl cursor-pointer clay-icon"
 aria-label="Open Settings"
 >
 <SettingsMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
 </button>
 </Tooltip>
 </div>

 {/* Mobile Dropdown Menu (Visible on Mobile) */}
 <div className="sm:hidden flex items-center gap-1.5" ref={mobileMenuRef}>

 <Tooltip content="ابزارهای بیشتر">
 <button
 onClick={() => setShowMobileMenu(!showMobileMenu)}
 className="clay-icon-btn w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer clay-icon"
 aria-label="More Options"
 >
 <MenuDotsLinearIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
 </button>
 </Tooltip>

 {showMobileMenu && (
    <div
      className="absolute top-full mt-2.5 left-0 w-60 sm:w-64 clay-card rounded-2xl z-50 flex flex-col p-2.5 shadow-2xl border border-subtle backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      dir="rtl"
    >
            {/* Top Appearance Controls: Symmetrical, equal-sized icon buttons on the LEFT, flush/flat */}
      <div className="flex items-center gap-2 justify-start px-0.5 pt-0.5 pb-2.5" dir="ltr">
        <ThemeToggle variant="clay" className="!w-10 !h-10 !rounded-xl shrink-0" />
        <UIStyleToggle variant="clay" className="!w-10 !h-10 !rounded-xl shrink-0" />
      </div>

      {/* Featured Install Card (Web-only) */}
      {!isBazaar && (
        <button
          onClick={() => { install(); setShowMobileMenu(false); }}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-all text-right cursor-pointer mb-1.5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <SmartphoneLinearIcon className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[var(--text-main)] truncate">نصب اپلیکیشن</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">سریع‌تر و روان‌تر</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            نصب
          </span>
        </button>
      )}

      {/* Tools Section */}
      <div className="flex flex-col gap-1 border-t border-subtle pt-1.5">
        <button
          onClick={() => { setIsSettingsOpen(true); setShowMobileMenu(false); }}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <SettingsMinimalisticLinearIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-[var(--text-main)]">تنظیمات پیشرفته</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => { setIsAdminOpen(true); setShowMobileMenu(false); }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">پنل مدیریت سیستم</span>
          </button>
        )}
      </div>
    </div>
  )}
 </div>
 </div>
 </div>

 </header>
 );
});
