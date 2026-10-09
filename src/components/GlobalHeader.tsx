import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Store, BookOpen, MessageSquare, LogIn, User, Settings, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from './ThemeToggle';
import { useUIStore } from '../store/uiStore';
import { UIStyleToggle } from './UIStyleToggle';
import { isBazaarEnvironment } from '../lib/bazaarUtils';

export const GlobalHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { setIsAdminOpen } = useUIStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLoginClick = () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  const navLinks = [
    { name: 'چت', path: '/chat', icon: MessageSquare },
    ...(!isBazaarEnvironment() ? [{ name: 'فروشگاه', path: '/store', icon: Store }] : []),
    { name: 'وبلاگ', path: '/blog', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 clay-header backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all">
      <div className="container mx-auto px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center max-w-7xl">
        
        {/* Brand / Logo (Left column, but visually Right in RTL) */}
        <div className="flex justify-start items-center">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 clay-btn rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-lg font-black bg-[var(--gemini-gradient)] bg-clip-text text-transparent hidden sm:block" style={{ fontFamily: "'Estedad', sans-serif" }}>
              دستیار هوشمند
            </span>
          </Link>
        </div>

        {/* Center Navigation (Center column) */}
        <div className="flex justify-center items-center">
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl shrink-0">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all ${
                    isActive 
                      ? 'clay-btn-primary text-white shadow-md' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="type-badge font-bold hidden sm:block">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Tools (Right column, but visually Left in RTL) */}
        <div className="flex justify-end items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Desktop Only Tools */}
          <div className="hidden md:flex items-center gap-2">
            <UIStyleToggle variant="clay" className="!h-10 !w-10 !rounded-xl !p-0 flex items-center justify-center shrink-0" />
            <ThemeToggle variant="clay" className="!h-10 !w-10 !rounded-xl !p-0 flex items-center justify-center shrink-0" />
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="h-10 w-10 clay-btn flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-all rounded-xl shrink-0"
                title="مدیریت"
              >
                <Settings size={18} />
              </button>
            )}
          </div>

          {/* User / Login Button (Always Visible) */}
          {user ? (
            <Link
              to="/dashboard"
              className="h-9 w-9 sm:h-10 sm:w-10 clay-btn flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-xl shrink-0"
              title="داشبورد کاربری"
            >
              <User size={18} />
            </Link>
          ) : (
            <button
              onClick={handleLoginClick}
              className="h-9 w-9 sm:h-10 sm:w-10 clay-btn-primary flex items-center justify-center text-white transition-all rounded-xl shadow-md shrink-0"
              title="ورود / ثبت‌نام"
            >
              <LogIn size={18} />
            </button>
          )}

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden h-9 w-9 clay-btn flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-all rounded-xl shrink-0 relative z-50"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[70px] left-4 clay-card-thick p-4 flex flex-col gap-4 min-w-[200px] animate-fade-in z-50">
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
    </header>
  );
};