import React, { useState, useRef } from 'react';

interface TooltipProps {
 content: React.ReactNode;
 children: React.ReactNode;
 position?: 'top' | 'bottom' | 'left' | 'right';
 align?: 'center' | 'start' | 'end';
 className?: string;
 delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = React.memo(({
 content,
 children,
 position = 'bottom',
 align = 'center',
 className = '',
 delay = 200,
}) => {
 const [isVisible, setIsVisible] = useState(false);
 const timerRef = useRef<NodeJS.Timeout | null>(null);

 if (!content) {
 return <>{children}</>;
 }

 const handleMouseEnter = () => {
 timerRef.current = setTimeout(() => {
 setIsVisible(true);
 }, delay);
 };

 const handleMouseLeave = () => {
 if (timerRef.current) {
 clearTimeout(timerRef.current);
 }
 setIsVisible(false);
 };

 // Position & Alignment classes
 const getPositionClass = () => {
 if (position === 'top') {
 if (align === 'start') return 'bottom-full right-0 mb-2.5';
 if (align === 'end') return 'bottom-full left-0 mb-2.5';
 return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5';
 }
 if (position === 'bottom') {
 if (align === 'start') return 'top-full right-0 mt-2.5';
 if (align === 'end') return 'top-full left-0 mt-2.5';
 return 'top-full left-1/2 -translate-x-1/2 mt-2.5';
 }
 if (position === 'left') {
 return 'right-full top-1/2 -translate-y-1/2 mr-2.5';
 }
 if (position === 'right') {
 return 'left-full top-1/2 -translate-y-1/2 ml-2.5';
 }
 return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5';
 };

 return (
 <div
 className={`relative inline-flex items-center justify-center ${className}`}
 onMouseEnter={handleMouseEnter}
 onMouseLeave={handleMouseLeave}
 onFocus={handleMouseEnter}
 onBlur={handleMouseLeave}
 >
 {children}
 {isVisible && (
 <div
 role="tooltip"
 className={`absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 text-[11px] font-medium leading-tight rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 text-zinc-100 dark:text-zinc-100 shadow-xl backdrop-blur-md animate-fadeIn ${getPositionClass()}`}
 >
 {content}
 </div>
 )}
 </div>
 );
});
