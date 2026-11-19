import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { 
  PaletteOutlineIcon, 
  UserCircleOutlineIcon, 
  CloseOutlineIcon, 
  DisketteOutlineIcon,
  SettingsOutlineIcon
} from '@solar-icons/react';
import { FontFamily, ThemeMode } from '../types';
import { Link } from 'react-router-dom';
import { toPersianDigits } from '../lib/persianUtils';
import { Wallet, LogOut, User, ArrowLeft } from 'lucide-react';

type TabType = 'appearance' | 'account';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, setIsWalletOpen } = useUIStore();
  const { settings, updateSettings } = useSettingsStore();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [tempSettings, setTempSettings] = useState(settings);

  if (!isSettingsOpen) return null;

  const onClose = () => setIsSettingsOpen(false);

  const handleSave = () => {
    updateSettings(() => tempSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl clay-modal rounded-3xl shadow-2xl border border-[var(--card-border)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 clay-btn rounded-xl text-indigo-600 dark:text-indigo-400">
              <SettingsOutlineIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "'Estedad', sans-serif" }}>
                تنظیمات کاربری
              </h2>
              <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc]">شخصی‌سازی ظاهر و مدیریت حساب</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 clay-icon-btn rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="بستن"
          >
            <CloseOutlineIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="sm:w-48 p-2.5 sm:p-3 sm:border-l border-b sm:border-b-0 border-[var(--card-border)] flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 sm:flex-none flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'appearance' 
                  ? 'clay-btn-primary text-white shadow-sm' 
                  : 'clay-btn text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <PaletteOutlineIcon className="w-4 h-4 shrink-0" />
              <span>ظاهر و پوسته</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`flex-1 sm:flex-none flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'account' 
                  ? 'clay-btn-primary text-white shadow-sm' 
                  : 'clay-btn text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <UserCircleOutlineIcon className="w-4 h-4 shrink-0" />
              <span>حساب کاربری</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {/* TAB: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Theme Mode */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      پوسته (Theme)
                    </label>
                    <select
                      value={tempSettings.appearance.theme}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        appearance: { ...tempSettings.appearance, theme: e.target.value as ThemeMode }
                      })}
                      className="w-full clay-card rounded-xl py-2.5 px-3 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-500 font-bold"
                    >
                      <option value="dark">تاریک (Dark Mode)</option>
                      <option value="light">روشن (Light Mode)</option>
                      <option value="system">پیرو سیستم (System)</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      فونت فارسی
                    </label>
                    <select
                      value={tempSettings.appearance.font}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        appearance: { ...tempSettings.appearance, font: e.target.value as FontFamily }
                      })}
                      className="w-full clay-card rounded-xl py-2.5 px-3 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-500 font-bold"
                    >
                      <option value="hybrid">✨ ترکیب هوشمند (پیش‌فرض)</option>
                      <option value="vazir">وزیرمتن (Vazirmatn)</option>
                      <option value="estedad">استعداد (Estedad)</option>
                      <option value="sahel">ساحل (Sahel)</option>
                      <option value="mikhak">میخک (Mikhak)</option>
                    </select>
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      اندازه قلم
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {tempSettings.appearance.fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="13"
                    max="20"
                    step="1"
                    value={tempSettings.appearance.fontSize}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      appearance: { ...tempSettings.appearance, fontSize: parseInt(e.target.value, 10) }
                    })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Persian Numerals Toggle */}
                <div className="flex items-center justify-between p-4 clay-card rounded-2xl">
                  <div>
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">تبدیل اعداد به فارسی</div>
                    <div className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] mt-0.5">نمایش قیمت‌ها و ارقام به صورت اعداد فارسی روان</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempSettings({
                      ...tempSettings,
                      appearance: { ...tempSettings.appearance, persianNumerals: !tempSettings.appearance.persianNumerals }
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      tempSettings.appearance.persianNumerals ? 'bg-indigo-600' : 'bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tempSettings.appearance.persianNumerals ? '-translate-x-6' : '-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Account */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-fadeIn">
                {user ? (
                  <div className="space-y-4">
                    <div className="p-4 clay-card rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 clay-btn rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-base">
                          {user.name ? user.name.charAt(0) : <User size={20} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{user.name || 'کاربر گرامی'}</h4>
                          <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] dir-ltr text-right">{user.phone || user.email || ''}</p>
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={onClose}
                        className="px-3.5 py-1.5 clay-btn font-bold text-xs text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center gap-1 hover:scale-105 transition-all"
                      >
                        <span>داشبورد</span>
                        <ArrowLeft size={13} />
                      </Link>
                    </div>

                    <div className="p-4 clay-card rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Wallet size={16} />
                        </div>
                        <div>
                          <span className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] block">موجودی کیف پول</span>
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {toPersianDigits((user.walletBalance || 0).toLocaleString('fa-IR'))} تومان
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { onClose(); setIsWalletOpen(true); }}
                        className="px-3.5 py-1.5 clay-btn-primary font-bold text-xs text-white rounded-xl shadow-xs"
                      >
                        افزایش اعتبار
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => { logout(); onClose(); }}
                      className="w-full py-2.5 clay-btn text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={14} />
                      <span>خروج از حساب کاربری</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">برای دسترسی به سوابق خرید و شارژ کیف پول وارد حساب شوید.</p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('open-auth-modal'));
                      }}
                      className="px-6 py-2.5 clay-btn-primary text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      ورود یا ثبت‌نام
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--card-border)] flex justify-end gap-2.5 shrink-0 bg-black/[0.01] dark:bg-white/[0.01]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2 rounded-xl font-bold text-xs clay-btn text-zinc-600 dark:text-zinc-400 cursor-pointer"
          >
            انصراف
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="px-6 py-2 rounded-xl font-bold text-xs clay-btn-primary text-white flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <DisketteOutlineIcon className="w-4 h-4" />
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
