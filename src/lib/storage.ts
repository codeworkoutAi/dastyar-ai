
import { AppSettings, Conversation, CustomProfile } from '../types';
import { encryptAPIKeys, decryptAPIKeys } from './crypto';
import { getInitialUserIdFromToken } from '../store/authStore';

const initialUid = getInitialUserIdFromToken();
let currentUserScope = initialUid ? `uc_${10000 + initialUid}` : 'guest';

export function setCurrentUserScope(userId?: number | null): void {
  currentUserScope = userId ? `uc_${10000 + userId}` : 'guest';
}

export function getCurrentUserScope(): string {
  return currentUserScope;
}

function getConversationsKey(): string {
  return `persian_ai_conversations_${currentUserScope}`;
}

function getActiveIdKey(): string {
  return `persian_ai_active_id_${currentUserScope}`;
}

const STORAGE_KEYS = {
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
      activeProfileId: 'free_default',
      profiles: [] 
    }
  },
  persona: { systemPrompt: '', tone: 'expert', temperature: 0.7 },
  appearance: { theme: 'dark', font: 'hybrid', fontSize: 14, persianNumerals: true, direction: 'rtl', uiLanguage: 'fa' },
  tools: { 
    webSearch: true, 
    enterToSend: true, 
    soundEnabled: false, 
    showPerformanceMetrics: true, 
    smartRouting: true, 
    reasoningMode: false,
    routingRoles: { 
      default: 'free_default', 
      coding: 'free_coding', 
      vision: 'free_vision' 
    } 
  }
};

export function loadConversations(): Conversation[] {
  try {
    const key = getConversationsKey();
    let raw = localStorage.getItem(key);
    if (!raw && currentUserScope === 'guest') {
      const legacy = localStorage.getItem('persian_ai_conversations');
      if (legacy) raw = legacy;
    }
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
  const key = getConversationsKey();
  try {
    localStorage.setItem(key, JSON.stringify(conversations));
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn('LocalStorage quota exceeded. Stripping images from older conversations...');
      try {
        const cleaned = stripOlderImages(conversations);
        localStorage.setItem(key, JSON.stringify(cleaned));
        return;
      } catch (retryErr) {
        console.error('Failed to save conversations even after stripping images.', retryErr);
      }
    }
    console.error('Failed to save conversations.', err);
  }
}

export function loadActiveConversationId(): string | null {
  return localStorage.getItem(getActiveIdKey());
}

export function saveActiveConversationId(id: string | null): void {
  const key = getActiveIdKey();
  if (id) {
    localStorage.setItem(key, id);
  } else {
    localStorage.removeItem(key);
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

    // Migration: ensure persianNumerals defaults to true if not explicitly migrated
    if (localStorage.getItem('fa_chat_persian_numerals_default_v1') !== 'true') {
      merged.appearance.persianNumerals = true;
      try {
        localStorage.setItem('fa_chat_persian_numerals_default_v1', 'true');
      } catch {}
    }

    // Migration: ensure font defaults to 'hybrid' if not explicitly migrated
    if (localStorage.getItem('fa_chat_font_hybrid_default_v1') !== 'true') {
      merged.appearance.font = 'hybrid';
      try {
        localStorage.setItem('fa_chat_font_hybrid_default_v1', 'true');
      } catch {}
    }

    // Migration: update default font size to 14
    if (localStorage.getItem('fa_chat_font_size_default_14_v3') !== 'true') {
      if (merged.appearance.fontSize === 16 || merged.appearance.fontSize === 15 || !merged.appearance.fontSize) {
        merged.appearance.fontSize = 14;
      }
      try {
        localStorage.setItem('fa_chat_font_size_default_14_v3', 'true');
      } catch {}
    }

    // Migration: ensure clean 6-profile system architecture & purge legacy cached cards (v4 to fix JSON cache)
    if (localStorage.getItem('fa_chat_profiles_clean_v4') !== 'true') {
      merged.providers.custom.profiles = [];
      merged.providers.custom.activeProfileId = 'free_default';
      merged.tools.routingRoles = {
        default: 'free_default',
        coding: 'free_coding',
        vision: 'free_vision'
      };
      try {
        localStorage.setItem('fa_chat_profiles_clean_v4', 'true');
      } catch {}
    }

    if (!merged.providers.custom.profiles) {
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

export function mergeSystemProfiles(currentSettings: AppSettings, serverProfiles: CustomProfile[]): AppSettings {
  if (!serverProfiles || !Array.isArray(serverProfiles) || serverProfiles.length === 0) {
    return currentSettings;
  }

  // Pure 6 platform profiles - no legacy zombie or user-entered BYOK profiles
  const formattedServerProfiles: CustomProfile[] = serverProfiles.map(sp => ({
    ...sp,
    apiKey: '', // System keys remain securely on server
    isSystemDefault: true
  }));

  const newProfiles = formattedServerProfiles;

  // Active profile handling: default to free_default or first profile
  let activeProfileId = currentSettings.providers.custom.activeProfileId;
  if (!newProfiles.some(p => p.id === activeProfileId) || activeProfileId.startsWith('sys-') || activeProfileId.startsWith('auto_')) {
    activeProfileId = newProfiles.find(p => p.id === 'free_default')?.id || newProfiles[0]?.id || '';
  }

  // Update routing roles strictly to the free profiles
  const routingRoles = { ...currentSettings.tools.routingRoles };
  const freeDefault = newProfiles.find(p => p.id === 'free_default' || p.role === 'default');
  const freeCoding = newProfiles.find(p => p.id === 'free_coding' || p.role === 'coding');
  const freeVision = newProfiles.find(p => p.id === 'free_vision' || p.role === 'vision');

  if (freeDefault) routingRoles.default = freeDefault.id;
  if (freeCoding) routingRoles.coding = freeCoding.id;
  if (freeVision) routingRoles.vision = freeVision.id;

  // Sync active profile fields if active profile is in newProfiles
  const activeProfile = newProfiles.find(p => p.id === activeProfileId);
  const updatedCustom = {
    ...currentSettings.providers.custom,
    profiles: newProfiles,
    activeProfileId,
    ...(activeProfile ? {
      baseUrl: activeProfile.baseUrl,
      modelName: activeProfile.modelName,
      customHeaders: activeProfile.customHeaders
    } : {})
  };

  return {
    ...currentSettings,
    providers: {
      ...currentSettings.providers,
      custom: updatedCustom
    },
    tools: {
      ...currentSettings.tools,
      routingRoles
    }
  };
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
