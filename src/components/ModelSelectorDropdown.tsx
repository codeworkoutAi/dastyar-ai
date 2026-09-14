import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { getModelDetails } from './CustomProviderCards';
import { CustomProfile } from '../types';

export const ModelSelectorDropdown: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get active profile ID
  let activeProfileId = settings.providers.activeProvider === 'custom' ? settings.providers.custom.activeProfileId : null;
  if (settings.tools.smartRouting) {
    activeProfileId = settings.tools.routingRoles?.default || activeProfileId;
  }

  // Gather profiles. We only want to show System Default profiles in the main dropdown (to hide BYOK).
  const allProfiles = settings.providers.custom.profiles || [];
  const systemProfiles = allProfiles.filter(p => p.isSystemDefault);

  // Group into Free and Pro
  const freeProfiles: CustomProfile[] = [];
  const proProfiles: CustomProfile[] = [];

  systemProfiles.forEach(p => {
    const details = getModelDetails({ id: p.modelName, name: p.name });
    if (details.isFree) {
      freeProfiles.push(p);
    } else {
      proProfiles.push(p);
    }
  });

  // Find the currently active profile
  const activeProfile = allProfiles.find(p => p.id === activeProfileId);
  const activeDetails = activeProfile ? getModelDetails({ id: activeProfile.modelName, name: activeProfile.name }) : null;

  const handleSelect = (profileId: string) => {
    updateSettings(s => ({
      ...s,
      tools: { ...s.tools, smartRouting: false },
      providers: {
        ...s.providers,
        activeProvider: 'custom',
        custom: {
          ...s.providers.custom,
          activeProfileId: profileId,
        },
      },
    }));
    setIsOpen(false);
  };

  const handleToggleSmartRouting = () => {
    updateSettings(s => ({
      ...s,
      tools: { ...s.tools, smartRouting: !s.tools.smartRouting },
    }));
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getProviderIconUrl = (modelName: string) => {
    const lower = modelName.toLowerCase();
    if (lower.includes('deepseek')) return "/icons/deepseek.svg";
    if (lower.includes('qwen') || lower.includes('qwq')) return "/icons/qwen.svg";
    if (lower.includes('gpt') || lower.includes('openai') || lower.includes('o1') || lower.includes('o3') || lower.includes('o4')) return "/icons/openai.svg";
    if (lower.includes('gemini') || lower.includes('gemma')) return "/icons/gemini.svg";
    if (lower.includes('claude') || lower.includes('anthropic')) return "/icons/claude.svg";
    if (lower.includes('llama') || lower.includes('meta')) return "/icons/meta.svg";
    if (lower.includes('mistral') || lower.includes('codestral')) return "/icons/mistral.svg";
    if (lower.includes('cohere')) return "/icons/cohere.svg";
    if (lower.includes('hugging') || lower.includes('allam')) return "/icons/huggingface.svg";
    return "/icons/bot.svg";
  };

  const renderProfileItem = (p: CustomProfile) => {
    const details = getModelDetails({ id: p.modelName, name: p.name });
    const isSelected = p.id === activeProfileId && !settings.tools.smartRouting;
    const iconUrl = getProviderIconUrl(p.modelName + ' ' + p.name);
    
    return (
      <button
        key={p.id}
        onClick={() => handleSelect(p.id)}
        className={`w-full text-right flex items-center justify-between p-3 rounded-xl transition-colors ${
          isSelected ? 'bg-blue-50/80 dark:bg-blue-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
        }`}
      >
        <div className="flex gap-3 items-center w-full">
          <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center overflow-hidden shadow-xs">
            <img src={iconUrl} alt="Model Icon" className="w-5 h-5 object-contain" />
          </div>
          <div className="flex flex-col gap-1 items-start flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {p.name || p.modelName}
              </span>
              {details.isFree && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  رایگان
                </span>
              )}
            </div>
            {details.description && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right line-clamp-2 leading-relaxed">
                {details.description}
              </span>
            )}
          </div>
        </div>
        {isSelected && <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-colors backdrop-blur-md shadow-sm ${
          settings.tools.smartRouting 
            ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/20' 
            : 'bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-black/40'
        }`}
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight">مدل فعلی</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-sm leading-tight ${settings.tools.smartRouting ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
              {settings.tools.smartRouting ? 'مسیریابی هوشمند' : (activeProfile ? (activeProfile.name || activeProfile.modelName) : 'انتخاب مدل')}
            </span>
            {!settings.tools.smartRouting && activeDetails?.isFree && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">رایگان</span>
            )}
          </div>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-2 overflow-x-hidden flex flex-col gap-3 rtl">
          
          <button
            onClick={handleToggleSmartRouting}
            className={`w-full text-right flex items-center justify-between p-3 rounded-xl transition-colors ${
              settings.tools.smartRouting ? 'bg-blue-50/80 dark:bg-blue-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex flex-col gap-1 items-start">
              <span className={`font-bold text-sm ${settings.tools.smartRouting ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                مسیریابی هوشمند (خودکار)
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right leading-relaxed">
                انتخاب خودکار بهترین مدل بر اساس نوع درخواست شما (کدنویسی، تصویر، چت روزمره).
              </span>
            </div>
            {settings.tools.smartRouting && <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />}
          </button>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 mx-2" />
          
          {freeProfiles.length > 0 && (
            <div>
              <div className="px-3 pb-1.5 mb-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5">
                🎁 مدل‌های رایگان (روزمره)
              </div>
              <div className="flex flex-col gap-1">
                {freeProfiles.map(renderProfileItem)}
              </div>
            </div>
          )}

          {proProfiles.length > 0 && (
            <div>
              <div className="px-3 pb-1.5 mb-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5">
                🚀 مدل‌های حرفه‌ای (پولی)
              </div>
              <div className="flex flex-col gap-1">
                {proProfiles.map(renderProfileItem)}
              </div>
            </div>
          )}

          {freeProfiles.length === 0 && proProfiles.length === 0 && (
            <div className="p-4 text-center text-sm text-zinc-500">
              هیچ مدلی یافت نشد.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
