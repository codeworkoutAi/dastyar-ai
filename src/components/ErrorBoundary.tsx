import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
 <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
 <div className="max-w-md w-full p-8 rounded-3xl clay-modal text-center">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-6">
 <AlertTriangle className="w-8 h-8" />
 </div>
 
 <h2 className="text-xl font-bold mb-3">یک خطای غیرمنتظره رخ داد</h2>
 <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
 برای بهبود تجربه و بارگذاری مجدد بخش‌های برنامه، لطفاً صفحه را بازنشانی کنید.
 </p>

 <button
 onClick={this.handleReload}
 className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all shadow-md hover: flex items-center justify-center gap-2 cursor-pointer active:scale-98"
 >
 <RefreshCw className="w-4 h-4 animate-spin-once" />
 <span>بارگذاری مجدد صفحه</span>
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
