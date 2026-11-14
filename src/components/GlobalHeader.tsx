import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Store, BookOpen, MessageSquare, LogIn, User, Settings, Menu, X, Smartphone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from './ThemeToggle';
import { useUIStore } from '../store/uiStore';
import { UIStyleToggle } from './UIStyleToggle';
import { isBazaarEnvironment } from '../lib/bazaarUtils';
import { usePWAInstall } from '../lib/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

export const GlobalHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { setIsAdminOpen } = useUIStore();
  const { isStandalone, isIOS, isMobile, isGuideOpen, setIsGuideOpen, promptOrGuide } = usePWAInstall();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLoginClick = () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  const isBazaar = isBazaarEnvironment() || Boolean(user?.email?.endsWith('@bazaar.guest'));

  const navLinks = [
    { name: 'چت', path: '/chat', icon: MessageSquare },
    ...(!isBazaar ? [{ name: 'فروشگاه', path: '/store', icon: Store }] : []),
    { name: 'وبلاگ', path: '/blog', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 clay-header backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all">
      <div className="container mx-auto px-4 h-16 md:h-20 grid grid-cols-[1fr_auto_1fr] items-center max-w-7xl">
        
        {/* Brand / Logo (Left column, but visually Right in RTL) */}
        <div className="flex justify-start items-center">
          <Link to="/" aria-label="صفحه اصلی دستیار هوشمند" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 clay-btn rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Bot className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-lg md:text-xl font-black bg-[var(--gemini-gradient)] bg-clip-text text-transparent hidden sm:block" style={{ fontFamily: "'Estedad', sans-serif" }}>
              دستیار هوشمند
            </span>
          </Link>
        </div>

        {/* Center Navigation (Center column) */}
        <div className="flex justify-center items-center">
          <nav className="flex items-center gap-1 sm:gap-2 md:gap-2.5 bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 md:p-2 rounded-2xl md:rounded-2xl shrink-0 border border-black/5 dark:border-white/5 shadow-xs">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-label={link.name === 'چت' ? 'شروع گفتگو با دستیار هوشمند' : link.name}
                  className={`flex items-center justify-center gap-1.5 md:gap-2.5 px-2.5 sm:px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-xl transition-all duration-200 select-none ${
                    isActive 
                      ? 'clay-btn-primary text-white shadow-md font-black scale-100' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 font-bold hover:scale-[1.03] active:scale-95'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 shrink-0" />
                  <span className="text-xs md:text-sm font-bold md:font-black hidden sm:block whitespace-nowrap">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Tools (Right column, but visually Left in RTL) */}
        <div className="flex justify-end items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Desktop Only Tools */}
          <div className="hidden md:flex items-center gap-2">
            {!isStandalone && !isBazaar && (
              <button
                onClick={promptOrGuide}
                className="h-10 w-10 md:h-11 md:w-11 clay-btn flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all rounded-xl md:rounded-2xl shrink-0 cursor-pointer"
                title="نصب اپلیکیشن (PWA)"
                aria-label="نصب اپلیکیشن"
              >
                <Smartphone size={19} />
              </button>
            )}
            <UIStyleToggle variant="clay" className="!h-10 !w-10 md:!h-11 md:!w-11 !rounded-xl md:!rounded-2xl !p-0 flex items-center justify-center shrink-0" />
            <ThemeToggle variant="clay" className="!h-10 !w-10 md:!h-11 md:!w-11 !rounded-xl md:!rounded-2xl !p-0 flex items-center justify-center shrink-0" />
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="h-10 w-10 md:h-11 md:w-11 clay-btn flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-all rounded-xl md:rounded-2xl shrink-0"
                title="مدیریت"
                aria-label="پنل مدیریت"
              >
                <Settings size={19} />
              </button>
            )}
          </div>

          {/* User / Login Button (Always Visible) */}
          {user ? (
            <Link
              to="/dashboard"
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 clay-btn flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-xl md:rounded-2xl shrink-0"
              title="داشبورد کاربری"
              aria-label="داشبورد کاربری"
            >
              <User size={19} />
            </Link>
          ) : (
            <button
              onClick={handleLoginClick}
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 clay-btn-primary flex items-center justify-center text-white transition-all rounded-xl md:rounded-2xl shadow-md shrink-0"
              title="ورود / ثبت‌نام"
              aria-label="ورود یا ثبت‌نام در دستیار هوشمند"
            >
              <LogIn size={19} />
            </button>
          )}

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden h-9 w-9 clay-btn flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-all rounded-xl shrink-0 relative z-50"
            aria-label="باز کردن منوی ناوبری"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[70px] left-4 clay-card-thick p-4 flex flex-col gap-4 min-w-[200px] animate-fade-in z-50">
           {!isStandalone && !isBazaar && (
             <button
               onClick={() => { promptOrGuide(); setIsMobileMenuOpen(false); }}
               className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
             >
               <span className="flex items-center gap-2">
                 <Smartphone size={16} />
                 نصب اپلیکیشن
               </span>
               <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">نصب</span>
             </button>
           )}
           <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--text-main)]">تغییر ظاهر</span>
              <UIStyleToggle variant="clay" className="!h-9 !w-9 !rounded-xl !p-0 flex items-center justify-center" />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--text-main)]">تغییر تم</span>
              <ThemeToggle variant="clay" className="!h-9 !w-9 !rounded-xl !p-0 flex items-center justify-center" />
           </div>
           {user?.role === 'admin' && (
             <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-sm font-bold text-rose-500">پنل مدیریت</span>
                <button onClick={() => { setIsAdminOpen(true); setIsMobileMenuOpen(false); }} className="h-9 w-9 clay-btn flex items-center justify-center rounded-xl">
                  <Settings size={18} className="text-rose-500" />
                </button>
             </div>
           )}
        </div>
      )}

      <PWAInstallGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        isIOS={isIOS}
        isMobile={isMobile}
      />
    </header>
  );
};