import React from 'react';

export type ClayButtonVariant = 'primary' | 'secondary' | 'emerald' | 'amber' | 'danger' | 'icon' | 'text';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: ClayButtonVariant;
 children: React.ReactNode;
 className?: string;
}

export function ClayButton({ variant = 'primary', children, className = '', ...props }: ClayButtonProps) {
 let baseClass = 'clay-btn';
 switch (variant) {
 case 'primary':
 baseClass = 'clay-btn-primary-thick';
 break;
 case 'secondary':
 baseClass = 'clay-btn-thick';
 break;
 case 'emerald':
 baseClass = 'clay-btn-emerald-thick';
 break;
 case 'amber':
 baseClass = 'clay-btn-amber-thick';
 break;
 case 'danger':
 // Using clay-btn-thick with red text as destructive action
 baseClass = 'clay-btn-thick text-rose-500 hover:text-rose-600';
 break;
 case 'icon':
 baseClass = 'clay-icon-btn';
 break;
 case 'text':
 baseClass = ''; // no background/clay class, just inherits text styling
 break;
 }

// Base styling for all buttons to keep consistency
  let defaultClasses = 'px-4 py-2 rounded-btn text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  if (variant === 'icon') {
    defaultClasses = 'w-8 h-8 rounded-icon-btn flex items-center justify-center transition-colors';
  } else if (variant === 'text') {
    defaultClasses = 'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'; // minimal styles for text links
  } else {
    defaultClasses += ' shadow-xs';
  }

 return (
 <button className={`${baseClass} ${defaultClasses} ${className}`} {...props}>
 {children}
 </button>
 );
}
