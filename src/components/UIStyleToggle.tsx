import React, { useEffect, useState } from 'react';
import { LayersMinimalisticLinearIcon } from '@solar-icons/react';
import { Tooltip } from './Tooltip';

interface UIStyleToggleProps {
  className?: string;
  variant?: 'default' | 'clay';
}

export const UIStyleToggle: React.FC<UIStyleToggleProps> = ({ className = '', variant = 'default' }) => {
  const [uiStyle, setUiStyle] = useState<'clay' | 'neumorphic'>('clay');

  useEffect(() => {
    // Initial load: check localStorage first, then fallback to current DOM attribute
    const storedStyle = localStorage.getItem('chatbox_ui_style') as 'clay' | 'neumorphic' | null;
    if (storedStyle) {
      setUiStyle(storedStyle);
      document.documentElement.setAttribute('data-ui-style', storedStyle);
    } else {
      const currentStyle = document.documentElement.getAttribute('data-ui-style') as 'clay' | 'neumorphic';
      if (currentStyle) setUiStyle(currentStyle);
    }
  }, []);

  const toggleStyle = () => {
    const nextStyle = uiStyle === 'clay' ? 'neumorphic' : 'clay';
    setUiStyle(nextStyle);
    document.documentElement.setAttribute('data-ui-style', nextStyle);
    localStorage.setItem('chatbox_ui_style', nextStyle);
  };

  const isClay = variant === 'clay';
  const baseClasses = isClay
    ? 'clay-icon-btn w-11 h-11 flex items-center justify-center rounded-xl sm:rounded-2xl cursor-pointer clay-icon'
    : 'w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer';

  return (
    <Tooltip content={uiStyle === 'clay' ? 'تغییر به استایل Neumorphic' : 'تغییر به استایل Claymorphism'}>
      <button
        onClick={toggleStyle}
        className={`${baseClasses} ${className}`}
        aria-label="Toggle UI Style"
      >
        <LayersMinimalisticLinearIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400`} />
      </button>
    </Tooltip>
  );
};
