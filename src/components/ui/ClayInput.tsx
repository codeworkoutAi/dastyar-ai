import React, { forwardRef } from 'react';

interface ClayInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
 multiline?: boolean;
 label?: string;
 error?: string;
 className?: string;
}

export const ClayInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, ClayInputProps>(
 ({ multiline = false, label, error, className = '', ...props }, ref) => {
 const Component = multiline ? 'textarea' : 'input';
 const baseClass = `clay-inset-thick w-full px-4 py-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
 multiline ? 'resize-y min-h-[80px]' : ''
 } ${className}`;

 return (
 <div className="flex flex-col gap-1.5 w-full">
 {label && <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mr-1">{label}</label>}
 {multiline ? (
 <textarea
 ref={ref as React.Ref<HTMLTextAreaElement>}
 className={baseClass}
 {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
 />
 ) : (
 <input
 ref={ref as React.Ref<HTMLInputElement>}
 className={baseClass}
 {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
 />
 )}
 {error && <span className="text-[10px] text-rose-500 font-medium px-1">{error}</span>}
 </div>
 );
 }
);

ClayInput.displayName = 'ClayInput';
