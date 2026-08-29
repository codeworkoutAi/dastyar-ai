import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './storage';
import { AppSettings } from '../types';

describe('Storage Utility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should load default settings when localStorage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should save and load custom settings properly', () => {
    const customSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      providers: {
        ...DEFAULT_SETTINGS.providers,
        gemini: { apiKey: 'TEST_API_KEY', modelName: 'test-model' }
      }
    };
    
    saveSettings(customSettings);
    
    const loaded = loadSettings();
    expect(loaded.providers.gemini?.apiKey).toBe('TEST_API_KEY');
    expect(loaded.providers.gemini?.modelName).toBe('test-model');
  });

  it('should fallback to defaults on corrupted JSON', () => {
    localStorage.setItem('persian_ai_settings_v2', '{ corrupted_json: ');
    
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});
