
export type Role = 'user' | 'assistant' | 'system';

export interface MessageMetrics {
  ttftMs?: number;
  totalTimeMs?: number;
  tokensPerSec?: number;
  charCount?: number;
  exactTotalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  approxTokens?: number;
  estimatedCostUSD?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  fileContext?: string;   // Hidden context for massive file extraction (e.g. 100-page PDF text)
  imageUrl?: string;      // Single image attachment for manual /image command
  timestamp: number;
  modelUsed?: string;
  isStreaming?: boolean;
  isImageGen?: boolean;
  error?: boolean;
  errorMessage?: string;
  metrics?: MessageMetrics;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  tags?: string[];
  modelUsed?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontFamily = 'vazir' | 'sahel' | 'estedad' | 'mikhak';

export interface CustomProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  customHeaders: string;
  latencyMs?: number;
}

export interface MultiProviderConfig {
  activeProvider: 'gemini' | 'openai' | 'anthropic' | 'custom';
  gemini: { apiKey: string; modelName: string };
  openai: { apiKey: string; modelName: string };
  anthropic: { apiKey: string; modelName: string };
  custom: { 
    baseUrl: string; 
    apiKey: string; 
    modelName: string; 
    customHeaders: string;
    profiles?: CustomProfile[];
    activeProfileId?: string;
  };
}

export interface AppSettings {
  providers: MultiProviderConfig;
  persona: { systemPrompt: string; tone: 'friendly' | 'formal' | 'expert'; temperature: number };
  appearance: { theme: ThemeMode; font: FontFamily; fontSize: number; persianNumerals: boolean; direction: 'rtl' | 'ltr' | 'auto'; uiLanguage: 'fa' | 'en' };
  tools: { 
    webSearch: boolean; 
    enterToSend: boolean; 
    soundEnabled: boolean; 
    showPerformanceMetrics: boolean; 
    smartRouting: boolean; 
    routingRoles?: { 
      default: string; defaultProvider?: string;
      coding: string; codingProvider?: string;
      vision: string; visionProvider?: string;
    } 
  };
}
