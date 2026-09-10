import { create } from 'zustand';
import { AppSettings } from '../types';
import { loadSettings, saveSettings, mergeSystemProfiles } from '../lib/storage';

interface SettingsState {
  settings: AppSettings;
  systemIsDark: boolean;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  syncSystemProfiles: () => Promise<void>;
  setSystemIsDark: (isDark: boolean) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),
  systemIsDark: typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  
  setSettings: (newSettings) => {
    saveSettings(newSettings);
    set({ settings: newSettings });
  },
  
  updateSettings: (updater) => {
    const newSettings = updater(get().settings);
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  syncSystemProfiles: async () => {
    try {
      const res = await fetch('/api/default-profiles');
      if (res.ok) {
        const serverProfiles = await res.json();
        if (Array.isArray(serverProfiles) && serverProfiles.length > 0) {
          get().updateSettings(prev => mergeSystemProfiles(prev, serverProfiles));
        }
      }
    } catch (err) {
      console.warn('[SettingsStore] Failed to sync system profiles:', err);
    }
  },
  
  setSystemIsDark: (isDark) => set({ systemIsDark: isDark }),

  toggleTheme: () => {
    const { settings, systemIsDark } = get();
    const isDark = settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && systemIsDark);
    const nextTheme = isDark ? 'light' : 'dark';
    const newSettings: AppSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        theme: nextTheme,
      },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },
}));
