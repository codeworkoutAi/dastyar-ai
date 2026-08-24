import React, { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  return (
    <div className="relative inline-flex items-center group/tip">
      {children}
      <div 
        className={`absolute ${
          position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        } left-1/2 -translate-x-1/2 hidden group-hover/tip:flex items-center pointer-events-none z-50 transition-opacity duration-150`}
      >
        <div className="bg-zinc-100 text-zinc-900 text-[11px] font-medium font-sans px-2.5 py-0.5 rounded-md shadow-sm border border-zinc-200/80 whitespace-nowrap select-none">
          {content}
        </div>
      </div>
    </div>
  );
};
