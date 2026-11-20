import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Store, BookOpen, LogIn, User, Settings, Menu, X, Smartphone, Wallet, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from './ThemeToggle';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { toPersianDigits } from '../lib/persianUtils';
import { UIStyleToggle } from './UIStyleToggle';
import { isBazaarEnvironment } from '../lib/bazaarUtils';
import { usePWAInstall } from '../lib/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

export const GlobalHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { setIsAdminOpen, setIsWalletOpen } = useUIStore();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;
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
    ...(!isBazaar ? [{ name: 'فروشگاه', path: '/', icon: Store }] : []),
    { name: 'وبلاگ و مقالات', path: '/blog', icon: BookOpen },
    { name: 'دستیار AI', path: '/ai-assistant', icon: Sparkles },
  ];

  return (
    <header className="sticky top-2 sm:top-3 z-50 px-3 sm:px-4 md:px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto rounded-2xl md:rounded-3xl clay-card-thick backdrop-blur-2xl bg-white/85 dark:bg-zinc-900/85 border border-white/60 dark:border-white/10 shadow-lg px-3 sm:px-5 h-16 md:h-18 flex items-center justify-between gap-3">
        
        {/* Right Zone: Official Brand & Logo Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" aria-label="صفحه اصلی Dastyar AI" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl clay-btn-thick flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shadow-xs">
              <Bot className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <span 
                className="text-base sm:text-lg md:text-xl font-black bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent tracking-tight leading-none"
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                Dastyar AI
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide hidden sm:block mt-1">
                دستیار هوشمند فارسی
              </span>
            </div>
          </Link>
        </div>

        {/* Center Zone: Segmented Navigation Dock */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <nav className="flex items-center gap-1 p-1 rounded-2xl clay-surface border border-[var(--card-border)] shadow-xs">
            {navLinks.map((link) => {
              const isActive = link.path === '/' 
                ? (location.pathname === '/' || location.pathname.startsWith('/store'))
                : location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200 select-none text-xs md:text-sm font-bold ${
                    isActive 
                      ? 'clay-btn-primary text-white shadow-xs font-black' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* AI Shopping Advisor Trigger Pill */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-advisor-widget'))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl clay-btn text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-xs border border-indigo-200/50 dark:border-indigo-800/40"
            title="گفتگو با مشاور هوشمند خرید"
          >
            <Sparkles size={15} className="text-amber-500 animate-pulse" />
            <span className="whitespace-nowrap">مشاور خرید</span>
          </button>
        </div>

        {/* Left Zone: User Wallet & Gadgets Dock */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* User Wallet Pill */}
          {user && (
            <button
              type="button"
              onClick={() => setIsWalletOpen(true)}
              className="h-10 px-3 clay-btn rounded-xl md:rounded-2xl flex items-center gap-2 text-xs font-bold text-[var(--text-main)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-xs select-none border border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/20"
              title="مشاهده موجودی و افزایش اعتبار کیف پول"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                <Wallet size={13} />
              </div>
              <span className="font-price font-black text-xs sm:text-sm">
                {usePersianDigits ? toPersianDigits((user.walletBalance || 0).toLocaleString()) : (user.walletBalance || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-normal hidden sm:inline">تومان</span>
            </button>
          )}

          {/* User Profile or Login */}
          {user ? (
            <Link
              to="/dashboard"
              className="h-10 w-10 clay-btn rounded-xl md:rounded-2xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs"
              title="داشبورد کاربری"
            >
              <User size={18} />
            </Link>
          ) : (
            <button
              onClick={handleLoginClick}
              className="h-10 px-4 clay-btn-primary rounded-xl md:rounded-2xl flex items-center gap-1.5 text-xs font-bold text-white shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
              title="ورود / ثبت‌نام"
            >
              <LogIn size={16} />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}

          {/* Consolidated Gadgets Capsule (Desktop Only: Theme, 3D Style, PWA, Admin) */}
          <div className="hidden md:flex items-center gap-0.5 p-1 rounded-xl md:rounded-2xl clay-surface border border-[var(--card-border)] shadow-xs">
            <ThemeToggle 
              variant="minimal" 
              className="!h-8 !w-8 !p-0 !rounded-lg !border-0 !shadow-none hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center" 
            />
            <UIStyleToggle 
              variant="default" 
              className="!h-8 !w-8 !p-0 !rounded-lg !border-0 !shadow-none hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center" 
            />
            {!isStandalone && !isBazaar && (
              <button
                onClick={promptOrGuide}
                className="h-8 w-8 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title="نصب اپلیکیشن (PWA)"
              >
                <Smartphone size={16} />
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="h-8 w-8 flex items-center justify-center text-rose-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title="پنل مدیریت"
              >
                <Settings size={16} />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden h-10 w-10 clay-btn flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-all rounded-xl shrink-0"
            aria-label="باز کردن منوی ناوبری"
          >
            {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto clay-card-thick rounded-2xl p-4 flex flex-col gap-3 shadow-xl animate-fade-in border border-[var(--card-border)] backdrop-blur-2xl bg-white/95 dark:bg-zinc-900/95">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-1 pb-3 border-b border-black/5 dark:border-white/10">
            {navLinks.map((link) => {
              const isActive = link.path === '/' 
                ? (location.pathname === '/' || location.pathname.startsWith('/store'))
                : location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive 
                      ? 'clay-btn-primary text-white' 
                      : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-advisor-widget'));
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all text-right"
            >
              <Sparkles size={16} className="text-amber-500" />
              <span>مشاور هوشمند خرید</span>
            </button>
          </nav>

          {/* Mobile Gadgets & Settings */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-[var(--text-muted)]">تم و ظاهر صفحه:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl clay-surface">
              <ThemeToggle variant="minimal" className="!h-8 !w-8 !p-0 !rounded-lg" />
              <UIStyleToggle variant="default" className="!h-8 !w-8 !p-0 !rounded-lg" />
            </div>
          </div>

          {!isStandalone && !isBazaar && (
            <button
              onClick={() => { promptOrGuide(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400"
            >
              <span className="flex items-center gap-2">
                <Smartphone size={16} />
                نصب نسخه وب‌اپلیکیشن (PWA)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20">نصب رایگان</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => { setIsAdminOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400"
            >
              <span className="flex items-center gap-2">
                <Settings size={16} />
                پنل مدیریت سیستم
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20">ادمین</span>
            </button>
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
