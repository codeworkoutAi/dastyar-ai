
import { AppSettings, Conversation } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'persian_ai_conversations',
  ACTIVE_ID: 'persian_ai_active_id',
  SETTINGS: 'persian_ai_settings_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  providers: {
    activeProvider: 'gemini',
    gemini: { apiKey: '', modelName: 'gemini-3.1-flash-lite' },
    openai: { apiKey: '', modelName: 'gpt-4o-mini' },
    anthropic: { apiKey: '', modelName: 'claude-3-5-sonnet' },
    custom: { baseUrl: '', apiKey: '', modelName: '', customHeaders: '' }
  },
  persona: { systemPrompt: '', tone: 'expert', temperature: 0.7 },
  appearance: { theme: 'dark', font: 'vazir', fontSize: 16, persianNumerals: false, direction: 'rtl', uiLanguage: 'fa' },
  tools: { webSearch: false, enterToSend: true, soundEnabled: false, showPerformanceMetrics: true, smartRouting: false, routingRoles: { default: '', coding: '', vision: '' } }
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
  // Deep clone to avoid mutating state
  const copy: Conversation[] = JSON.parse(JSON.stringify(conversations));
  
  // Keep images only in the most recent conversation; replace in older conversations
  for (let i = 0; i < copy.length - 1; i++) {
    if (copy[i].messages) {
      copy[i].messages = copy[i].messages.map((msg) => {
        let hasBase64Image = false;

        // Check legacy single image
        if (msg.imageUrl?.startsWith('data:image')) {
          hasBase64Image = true;
          msg.imageUrl = undefined;
        }

        // Check new multi-image array
        if (msg.imageUrls && msg.imageUrls.some(url => url.startsWith('data:image'))) {
          hasBase64Image = true;
          msg.imageUrls = msg.imageUrls.filter(url => !url.startsWith('data:image'));
          if (msg.imageUrls.length === 0) {
            msg.imageUrls = undefined;
          }
        }

        if (hasBase64Image) {
          return {
            ...msg,
            content: msg.content + '\n\n*(تصویر جهت آزادسازی فضای ذخیره‌سازی حذف شد)*',
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
