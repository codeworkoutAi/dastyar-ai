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
import { Monitor, Smartphone, MessageSquare } from 'lucide-react';
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
  isStreaming?: boolean;
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
  isStreaming = false,
}) => {
  const [showTools, setShowTools] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  const sessionStats = React.useMemo(() => {
    return calculateSessionStats(conversations || (activeConversation ? [activeConversation] : []));
  }, [conversations, activeConversation]);

  // Click outside to close tools menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setShowTools(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProviderInfo = () => {
    switch (settings.providers.activeProvider) {
    case 'gemini':
      return { 
        icon: <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
        glowClass: 'from-purple-500/20 to-blue-500/20'
      };
    case 'openai':
      return {
        icon: <Code2LineDuotoneIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
        glowClass: 'from-emerald-500/20 to-teal-500/20'
      };
    case 'anthropic':
      return {
        icon: <Code2LineDuotoneIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
        glowClass: 'from-amber-500/20 to-orange-500/20'
      };
    case 'custom':
      return {
        icon: <GlobalLineDuotoneIcon className="w-4 h-4 text-sky-500 dark:text-sky-400" />,
        glowClass: 'from-sky-500/20 to-blue-500/20'
      };
    default:
        return {
          icon: <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4 text-zinc-500" />,
          glowClass: 'from-zinc-500/20 to-zinc-500/20'
        };
    }
  };

  const providerInfo = getProviderInfo();
  const chatTitle = activeConversation?.title || 'دستیار هوشمند';

  return (
    <header className="relative h-16 sm:h-[4.5rem] flex items-center justify-between z-30 shrink-0 select-none overflow-visible">
      {/* Absolute Ambient Mesh Background */}
      <div className="absolute inset-0 bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-2xl border-b border-black/5 dark:border-white/[0.08] transition-colors duration-500" />
      
      {/* Subtle Glow based on active model */}
      <div className={`absolute inset-0 bg-gradient-to-r ${providerInfo.glowClass} opacity-30 dark:opacity-40 pointer-events-none transition-all duration-1000`} />

      {/* Neon Streaming Progress Bar */}
      {isStreaming && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 dark:via-purple-400 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}

      {/* Header Content Container */}
      <div className="relative w-full px-3 sm:px-6 flex items-center justify-between">
        
        {/* RIGHT: Menu & Title (RTL) */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Tooltip content="منوی گفتگوها (سایدبار)">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all shrink-0"
            >
              <HamburgerMenuLineDuotoneIcon className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="flex flex-col min-w-0 justify-center">
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 opacity-50 hidden sm:block" />
              {chatTitle}
            </h1>
            {isStreaming && (
              <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-purple-400 font-medium animate-pulse">
                در حال پاسخ‌گویی...
              </span>
            )}
          </div>
        </div>

        {/* LEFT: Smart Chip & More Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0" dir="ltr">
          
          {/* Smart Chip (Model + Token Stats) */}
          <Tooltip content={`مدل فعال: ${settings.providers.activeProvider} \n کل توکن‌ها: ${sessionStats.totalTokens.toLocaleString('fa-IR')} (~$${sessionStats.totalCostUSDFormatted})`}>
            <button 
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-2 sm:px-3 h-9 sm:h-10 bg-white/60 dark:bg-black/40 hover:bg-white/90 dark:hover:bg-black/60 border border-black/5 dark:border-white/10 rounded-xl sm:rounded-2xl transition-all shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-black/5 dark:bg-white/5 shrink-0">
                {providerInfo.icon}
              </div>
              {sessionStats.totalTokens > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-medium text-zinc-600 dark:text-zinc-300">
                  <span>{sessionStats.totalTokens >= 1000 ? `${(sessionStats.totalTokens / 1000).toFixed(1)}k` : sessionStats.totalTokens}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span className="text-emerald-600 dark:text-emerald-400">${sessionStats.totalCostUSDFormatted}</span>
                </div>
              )}
            </button>
          </Tooltip>

          {/* Tools Menu (Dropdown) */}
          <div className="relative" ref={toolsRef}>
            <Tooltip content="ابزارها و تنظیمات">
              <button
                onClick={() => setShowTools(!showTools)}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all"
              >
                <MenuDotsLineDuotoneIcon className="w-6 h-6" />
              </button>
            </Tooltip>

            {/* Dropdown Popover */}
            {showTools && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn" dir="rtl">
                <div className="p-1.5 flex flex-col gap-0.5">
                  {/* Image Studio */}
                  <button onClick={() => { onOpenImageStudio(); setShowTools(false); }} className="flex items-center gap-3 w-full p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors text-right">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">استودیو تصویر</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Midjourney, DALL-E, Flux</span>
                    </div>
                  </button>

                  {/* Export */}
                  {activeConversation && activeConversation.messages.length > 0 && (
                    <button onClick={() => { onOpenExport(); setShowTools(false); }} className="flex items-center gap-3 w-full p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors text-right">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <DownloadMinimalisticLineDuotoneIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">خروجی گفتگو</span>
                    </button>
                  )}

                  {/* UI Guide */}
                  {onOpenUiGuide && (
                    <button onClick={() => { onOpenUiGuide(); setShowTools(false); }} className="flex items-center gap-3 w-full p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors text-right">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <HelpLineDuotoneIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">راهنمای تصویری اجزا</span>
                    </button>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mx-1">
                    <button 
                      onClick={() => setPlatformMode('windows')} 
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${platformMode === 'windows' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      ویندوز
                    </button>
                    <button 
                      onClick={() => setPlatformMode('android')} 
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${platformMode === 'android' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      اندروید
                    </button>
                  </div>

                  {/* Settings */}
                  <button onClick={() => { onOpenSettings(); setShowTools(false); }} className="flex items-center gap-3 w-full p-2.5 mt-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors text-right">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <SettingsMinimalisticLineDuotoneIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">تنظیمات پیشرفته</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
