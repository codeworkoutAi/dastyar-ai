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
import { SmartRoutingAnimation } from './ChatBox';
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
 const { activeId, conversations, isStreaming, routingState } = useChatStore();
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

 const isAnimating = isStreaming && settings.tools.smartRouting && routingState !== 'idle';

 return (
 <header className="relative flex items-center justify-center z-20 shrink-0 select-none border-b border-subtle clay-header backdrop-blur-md h-16 sm:h-18">

 {/* -------------------- Original Header Content -------------------- */}
 <div className={`absolute inset-0 px-2.5 sm:px-4 md:px-6 flex items-center justify-between w-full h-full transition-all duration-500 ease-out ${isAnimating ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}>

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
 <span>دستیار هوشمند</span>
 <span className="sr-only">دستیار هوشمند | چت با هوش مصنوعی رایگان و فارسی</span>
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
  <div className="absolute top-full mt-2 left-0 w-52 clay-card z-50 flex flex-col gap-1 p-2 animate-fadeIn border border-subtle" dir="rtl">
  
  <div className="flex items-center justify-around p-2 mb-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
     <ThemeToggle variant="clay" className="!w-10 !h-10 !rounded-xl" />
     <UIStyleToggle variant="clay" className="!w-10 !h-10 !rounded-xl" />
  </div>

  {!isBazaar && (
 <button onClick={() => { install(); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer">
 <SmartphoneLinearIcon className="w-4 h-4 text-emerald-500" />
 <span className="text-xs font-bold text-[var(--text-main)]">نصب اپلیکیشن دستیار</span>
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
