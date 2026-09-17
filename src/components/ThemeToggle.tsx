import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { Tooltip } from './Tooltip';

interface ThemeToggleProps {
 variant?: 'clay' | 'minimal';
 className?: string;
 tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
 showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
 variant = 'minimal',
 className = '',
 tooltipPosition = 'bottom',
 showLabel = false,
}) => {
 const { settings, systemIsDark, toggleTheme } = useSettingsStore();

 const isDarkMode =
 settings.appearance.theme === 'dark' ||
 (settings.appearance.theme === 'system' && systemIsDark);

 const tooltipText = isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره';

 const baseButtonClasses =
 variant === 'clay'
 ? 'clay-btn w-11 h-11 flex items-center justify-center hover:opacity-90 rounded-xl sm:rounded-2xl cursor-pointer relative overflow-hidden group transition-all duration-300'
 : 'p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 border border-[var(--card-border)] bg-white/70 dark:bg-zinc-900/70 shadow-sm backdrop-blur-md cursor-pointer flex items-center justify-center gap-2 group';

 return (
 <Tooltip content={tooltipText} position={tooltipPosition}>
 <button
 onClick={toggleTheme}
 className={`${baseButtonClasses} ${className}`}
 aria-label={tooltipText}
 title={tooltipText}
 type="button"
 >
 <div className="relative w-5 h-5 flex items-center justify-center">
 {/* Sun icon for dark mode (click to switch to light) */}
 <Sun
 className={`w-[19px] h-[19px] text-amber-400 absolute transition-all duration-500 transform ${
 isDarkMode
 ? 'rotate-0 scale-100 opacity-100'
 : 'rotate-90 scale-0 opacity-0'
 }`}
 />
 {/* Moon icon for light mode (click to switch to dark) */}
 <Moon
 className={`w-[19px] h-[19px] text-indigo-600 dark:text-indigo-400 absolute transition-all duration-500 transform ${
 isDarkMode
 ? '-rotate-90 scale-0 opacity-0'
 : 'rotate-0 scale-100 opacity-100'
 }`}
 />
 </div>
 {showLabel && (
 <span className="text-xs font-bold">
 {isDarkMode ? 'حالت روشن' : 'حالت تیره'}
 </span>
 )}
 </button>
 </Tooltip>
 );
};
