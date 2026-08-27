import { create } from 'zustand';
import { AppSettings } from '../types';
import { loadSettings, saveSettings } from '../lib/storage';

interface SettingsState {
  settings: AppSettings;
  systemIsDark: boolean;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  setSystemIsDark: (isDark: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),
  systemIsDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  
  setSettings: (newSettings) => {
    saveSettings(newSettings);
    set({ settings: newSettings });
  },
  
  updateSettings: (updater) => {
    const newSettings = updater(get().settings);
    saveSettings(newSettings);
    set({ settings: newSettings });
  },
  
  setSystemIsDark: (isDark) => set({ systemIsDark: isDark }),
}));
