
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
  imageUrl?: string;
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

export interface MultiProviderConfig {
  activeProvider: 'gemini' | 'openai' | 'anthropic' | 'custom';
  gemini: { apiKey: string; modelName: string };
  openai: { apiKey: string; modelName: string };
  anthropic: { apiKey: string; modelName: string };
  custom: { baseUrl: string; apiKey: string; modelName: string; customHeaders: string };
}

export interface AppSettings {
  providers: MultiProviderConfig;
  persona: { systemPrompt: string; tone: 'friendly' | 'formal' | 'expert'; temperature: number };
  appearance: { theme: 'dark' | 'light' | 'system'; font: string; fontSize: number; persianNumerals: boolean; direction: 'rtl' | 'ltr' | 'auto'; uiLanguage: 'fa' | 'en' };
  tools: { webSearch: boolean; enterToSend: boolean; soundEnabled: boolean; showPerformanceMetrics: boolean };
}
