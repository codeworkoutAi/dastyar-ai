const fs = require('fs');
let content = fs.readFileSync('src/lib/storage.ts', 'utf8');

// I need to completely rewrite storage.ts to only deal with Settings and Conversations.
const newStorage = `
import { AppSettings, Conversation } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'persian_ai_conversations',
  ACTIVE_ID: 'persian_ai_active_id',
  SETTINGS: 'persian_ai_settings_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  providers: {
    activeProvider: 'gemini',
    gemini: { apiKey: '', modelName: 'gemini-2.5-flash' },
    openai: { apiKey: '', modelName: 'gpt-4o-mini' },
    anthropic: { apiKey: '', modelName: 'claude-3-5-sonnet' },
    custom: { baseUrl: '', apiKey: '', modelName: '', customHeaders: '' }
  },
  persona: { systemPrompt: '', tone: 'expert', temperature: 0.7 },
  appearance: { theme: 'dark', font: 'vazir', fontSize: 16, persianNumerals: false, direction: 'rtl', uiLanguage: 'fa' },
  tools: { webSearch: false, enterToSend: true, soundEnabled: false, showPerformanceMetrics: true }
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations.', err);
  }
}

export function loadActiveConversationId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
}

export function saveActiveConversationId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    
    // Deep merge to ensure all nested properties exist
    const parsed = JSON.parse(raw);
    return {
      providers: { ...DEFAULT_SETTINGS.providers, ...parsed.providers },
      persona: { ...DEFAULT_SETTINGS.persona, ...parsed.persona },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
      tools: { ...DEFAULT_SETTINGS.tools, ...parsed.tools }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function createNewConversation(modelName: string = 'gemini-2.5-flash'): Conversation {
  return {
    id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    title: 'گفتگوی جدید',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPinned: false,
    modelUsed: modelName,
  };
}
`;

fs.writeFileSync('src/lib/storage.ts', newStorage);
