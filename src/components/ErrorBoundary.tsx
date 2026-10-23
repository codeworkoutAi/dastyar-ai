import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
 children: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
 public state: State = {
 hasError: false,
 error: null,
 };

 public static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
 }

 public handleReload = () => {
 window.location.reload();
 };

 public render() {
 if (this.state.hasError) {
 return (
 <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 clay-surface text-zinc-900 dark:text-zinc-100 font-sans">
 <div className="max-w-md w-full p-8 rounded-3xl clay-modal text-center">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-6">
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
   <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
 </svg>
 </div>
 <h2 className="text-xl font-bold mb-3">یک خطای غیرمنتظره رخ داد</h2>
 <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
 برای بهبود تجربه و بارگذاری مجدد بخش‌های برنامه، لطفاً صفحه را بازنشانی کنید.
 </p>

 <button
 onClick={this.handleReload}
 className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all shadow-md hover: flex items-center justify-center gap-2 cursor-pointer active:scale-98"
 >
 <svg className="w-4 h-4 animate-spin-once" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
   <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
 </svg>
 <span>بارگذاری مجدد صفحه</span>
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
