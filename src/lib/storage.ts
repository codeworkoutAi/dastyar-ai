
import { AppSettings, Conversation } from '../types';
import { encryptAPIKeys, decryptAPIKeys } from './crypto';

const STORAGE_KEYS = {
  CONVERSATIONS: 'persian_ai_conversations',
  ACTIVE_ID: 'persian_ai_active_id',
  SETTINGS: 'persian_ai_settings_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  providers: {
    activeProvider: 'custom',
    gemini: { apiKey: '', modelName: 'gemini-3.1-flash-lite' },
    openai: { apiKey: '', modelName: 'gpt-4o-mini' },
    anthropic: { apiKey: '', modelName: 'claude-3-5-sonnet' },
    custom: { 
      baseUrl: '', 
      apiKey: '', 
      modelName: '', 
      customHeaders: '', 
      activeProfileId: 'default-groq-llama-3-8b',
      profiles: [
        {
          id: 'default-groq-llama-3-8b',
          name: 'Llama 3 8B (رایگان)',
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: '',
          modelName: 'llama3-8b-8192',
          customHeaders: ''
        },
        {
          id: 'default-groq-llama-3-70b',
          name: 'Llama 3 70B (رایگان)',
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: '',
          modelName: 'llama3-70b-8192',
          customHeaders: ''
        },
        {
          id: 'default-gemini-1-5-flash',
          name: 'Gemini 1.5 Flash (رایگان)',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
          apiKey: '',
          modelName: 'gemini-1.5-flash',
          customHeaders: ''
        }
      ] 
    }
  },
  persona: { systemPrompt: '', tone: 'expert', temperature: 0.7 },
  appearance: { theme: 'dark', font: 'vazir', fontSize: 16, persianNumerals: false, direction: 'rtl', uiLanguage: 'fa' },
  tools: { 
    webSearch: true, 
    enterToSend: true, 
    soundEnabled: false, 
    showPerformanceMetrics: true, 
    smartRouting: true, 
    routingRoles: { 
      default: 'default-groq-llama-3-8b', 
      coding: 'default-groq-llama-3-70b', 
      vision: 'default-gemini-1-5-flash' 
    } 
  }
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

function stripOlderImages(conversations: Conversation[]): Conversation[] {
  const copy: Conversation[] = JSON.parse(JSON.stringify(conversations));
  for (let i = 0; i < copy.length - 1; i++) {
    if (copy[i].messages) {
      copy[i].messages = copy[i].messages.map(msg => {
        let hasBase64Image = false;
        if (msg.imageUrl?.startsWith('data:image')) {
          hasBase64Image = true;
          msg.imageUrl = undefined;
        }
        if (hasBase64Image) {
          return {
            ...msg,
            content: msg.content + "\n\n*(????? ??? ??)*",
          };
        }
        return msg;
      });
    }
  }
  return copy;
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn('LocalStorage quota exceeded. Stripping images from older conversations...');
      try {
        const cleaned = stripOlderImages(conversations);
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(cleaned));
        return;
      } catch (retryErr) {
        console.error('Failed to save conversations even after stripping images.', retryErr);
      }
    }
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

// Simple obfuscation to prevent casual localStorage scanning
function encodeSettings(json: string): string {
  const b64 = btoa(encodeURIComponent(json));
  let result = '';
  for (let i = 0; i < b64.length; i++) {
    result += String.fromCharCode(b64.charCodeAt(i) ^ 0x55);
  }
  return 'ENC:' + result;
}

function decodeSettings(encoded: string): string | null {
  if (!encoded.startsWith('ENC:')) return encoded; // Legacy plain text
  try {
    const data = encoded.slice(4);
    let unshifted = '';
    for (let i = 0; i < data.length; i++) {
      unshifted += String.fromCharCode(data.charCodeAt(i) ^ 0x55);
    }
    return decodeURIComponent(atob(unshifted));
  } catch {
    return null;
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;

    const decoded = decodeSettings(raw);
    if (!decoded) return DEFAULT_SETTINGS;

    // Deep merge to ensure all nested properties exist
    const parsed = JSON.parse(decoded);
    const merged = {
      providers: { ...DEFAULT_SETTINGS.providers, ...parsed.providers },
      persona: { ...DEFAULT_SETTINGS.persona, ...parsed.persona },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
      tools: { ...DEFAULT_SETTINGS.tools, ...parsed.tools }
    };
    
    merged.providers.custom = { ...DEFAULT_SETTINGS.providers.custom, ...(parsed.providers?.custom || {}) };

    // Migrate legacy custom config to a profile if it has a baseUrl but no profiles array
    if (merged.providers.custom.baseUrl && (!merged.providers.custom.profiles || merged.providers.custom.profiles.length === 0)) {
      const legacyId = 'profile-' + Date.now().toString(36);
      merged.providers.custom.profiles = [{
        id: legacyId,
        name: 'پروفایل پیش‌فرض',
        baseUrl: merged.providers.custom.baseUrl,
        apiKey: merged.providers.custom.apiKey,
        modelName: merged.providers.custom.modelName,
        customHeaders: merged.providers.custom.customHeaders,
      }];
      merged.providers.custom.activeProfileId = legacyId;
    } else if (!merged.providers.custom.profiles) {
      merged.providers.custom.profiles = [];
    }

    // Decrypt API keys before returning to application
    return decryptAPIKeys(merged);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    // Encrypt API keys before saving to localStorage
    const encrypted = encryptAPIKeys(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, encodeSettings(JSON.stringify(encrypted)));
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


export function getStorageUsage(): { 
  usedBytes: number; 
  usedKb: string; 
  usedMb: string; 
  totalKb: number; 
  percent: number; 
  conversationsCount: number; 
  messagesCount: number; 
  count: number; 
} {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        total += (key.length + val.length) * 2;
      }
    }
    const usedKbNum = total / 1024;
    const maxCapacityKb = 5 * 1024;
    const percentage = Math.min(100, Math.max(0, (usedKbNum / maxCapacityKb) * 100));
    const convs = loadConversations();
    const msgsCount = convs.reduce((acc, c) => acc + (c.messages ? c.messages.length : 0), 0);
    return {
      usedBytes: total,
      usedKb: usedKbNum.toFixed(1),
      usedMb: (usedKbNum / 1024).toFixed(2),
      totalKb: maxCapacityKb,
      percent: Math.round(percentage * 10) / 10,
      conversationsCount: convs.length,
      messagesCount: msgsCount,
      count: convs.length,
    };
  } catch {
    return {
      usedBytes: 0,
      usedKb: '0.0',
      usedMb: '0.00',
      totalKb: 5120,
      percent: 0,
      conversationsCount: 0,
      messagesCount: 0,
      count: 0,
    };
  }
}
