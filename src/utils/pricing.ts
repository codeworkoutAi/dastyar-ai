import { Conversation } from '../types';

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
  label?: string;
}

/**
 * Official Pricing rates per 1,000,000 tokens in USD (as of 2025/2026)
 */
export const MODEL_PRICING_RATES: Record<string, ModelPricing> = {
  // Google Gemini Models
  'gemini-3.1-flash-lite': { inputPer1M: 0.075, outputPer1M: 0.30, label: 'Gemini 3.1 Flash Lite' },
  'gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, label: 'Gemini 2.5 Flash' },
  'gemini-2.5-flash-lite': { inputPer1M: 0.075, outputPer1M: 0.30, label: 'Gemini 2.5 Flash Lite' },
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00, label: 'Gemini 2.5 Pro' },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, label: 'Gemini 1.5 Flash' },
  'gemini-1.5-flash-8b': { inputPer1M: 0.0375, outputPer1M: 0.15, label: 'Gemini 1.5 Flash-8B' },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00, label: 'Gemini 1.5 Pro' },
  'gemini-flash': { inputPer1M: 0.075, outputPer1M: 0.30, label: 'Gemini Flash' },
  'gemini-pro': { inputPer1M: 1.25, outputPer1M: 5.00, label: 'Gemini Pro' },

  // DeepSeek Models
  'deepseek-chat': { inputPer1M: 0.14, outputPer1M: 0.28, cachedInputPer1M: 0.014, label: 'DeepSeek V3 (Chat)' },
  'deepseek-reasoner': { inputPer1M: 0.55, outputPer1M: 2.19, cachedInputPer1M: 0.14, label: 'DeepSeek R1 (Reasoner)' },
  'deepseek-coder': { inputPer1M: 0.14, outputPer1M: 0.28, label: 'DeepSeek Coder' },

  // OpenAI Models
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.00, label: 'GPT-4o' },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, label: 'GPT-4o Mini' },
  'gpt-4-turbo': { inputPer1M: 10.00, outputPer1M: 30.00, label: 'GPT-4 Turbo' },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50, label: 'GPT-3.5 Turbo' },
  'o1': { inputPer1M: 15.00, outputPer1M: 60.00, label: 'OpenAI o1' },
  'o1-mini': { inputPer1M: 1.10, outputPer1M: 4.40, label: 'OpenAI o1 Mini' },
  'o3-mini': { inputPer1M: 1.10, outputPer1M: 4.40, label: 'OpenAI o3 Mini' },

  // Anthropic Claude Models
  'claude-3-5-sonnet': { inputPer1M: 3.00, outputPer1M: 15.00, label: 'Claude 3.5 Sonnet' },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.00, outputPer1M: 15.00, label: 'Claude 3.5 Sonnet' },
  'claude-3-5-haiku': { inputPer1M: 0.80, outputPer1M: 4.00, label: 'Claude 3.5 Haiku' },
  'claude-3-5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4.00, label: 'Claude 3.5 Haiku' },
  'claude-3-opus': { inputPer1M: 15.00, outputPer1M: 75.00, label: 'Claude 3 Opus' },

  // OpenRouter & Open Source Defaults
  'meta-llama/llama-3.3-70b-instruct': { inputPer1M: 0.40, outputPer1M: 0.40, label: 'Llama 3.3 70B' },
  'qwen/qwen-2.5-72b-instruct': { inputPer1M: 0.35, outputPer1M: 0.40, label: 'Qwen 2.5 72B' },
};

export const DEFAULT_FALLBACK_PRICING: ModelPricing = {
  inputPer1M: 0.15,
  outputPer1M: 0.60,
  label: 'Default Model',
};

/**
 * Returns the pricing configuration for a given model name
 */
export function getPricingForModel(modelName?: string): ModelPricing {
  if (!modelName) return DEFAULT_FALLBACK_PRICING;

  const normalized = modelName.toLowerCase().trim();

  // Exact match
  if (MODEL_PRICING_RATES[normalized]) {
    return MODEL_PRICING_RATES[normalized];
  }

  // Substring matching for version variations
  if (normalized.includes('deepseek-reasoner') || normalized.includes('r1')) {
    return MODEL_PRICING_RATES['deepseek-reasoner'];
  }
  if (normalized.includes('deepseek')) {
    return MODEL_PRICING_RATES['deepseek-chat'];
  }

  if (normalized.includes('o1-mini') || normalized.includes('o3-mini')) {
    return MODEL_PRICING_RATES['o3-mini'];
  }
  if (normalized.includes('o1')) {
    return MODEL_PRICING_RATES['o1'];
  }
  if (normalized.includes('gpt-4o-mini')) {
    return MODEL_PRICING_RATES['gpt-4o-mini'];
  }
  if (normalized.includes('gpt-4o') || normalized.includes('gpt-4')) {
    return MODEL_PRICING_RATES['gpt-4o'];
  }

  if (normalized.includes('claude-3-5-sonnet') || normalized.includes('sonnet')) {
    return MODEL_PRICING_RATES['claude-3-5-sonnet'];
  }
  if (normalized.includes('claude-3-5-haiku') || normalized.includes('haiku')) {
    return MODEL_PRICING_RATES['claude-3-5-haiku'];
  }

  if (normalized.includes('pro')) {
    return MODEL_PRICING_RATES['gemini-2.5-pro'];
  }
  if (normalized.includes('flash') || normalized.includes('gemini')) {
    return MODEL_PRICING_RATES['gemini-2.5-flash'];
  }

  return DEFAULT_FALLBACK_PRICING;
}

/**
 * Persian-compatible lightweight token estimator heuristic.
 * Persian and RTL non-ASCII Unicode characters typically translate to ~2.2 - 2.8 chars per BPE token,
 * while Latin/ASCII code characters average ~3.8 - 4.0 chars per token.
 */
export function estimateTokenCount(text?: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  let nonAsciiChars = 0;
  let asciiChars = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code > 127) {
      nonAsciiChars++;
    } else {
      asciiChars++;
    }
  }

  // Non-ASCII (Persian/Arabic) token estimate (~2.4 chars per token)
  const nonAsciiTokens = nonAsciiChars / 2.4;
  // ASCII (English/code/numbers) token estimate (~3.8 chars per token)
  const asciiTokens = asciiChars / 3.8;

  return Math.max(1, Math.round(nonAsciiTokens + asciiTokens));
}

/**
 * Calculates estimated USD cost based on prompt and completion token counts
 */
export function calculateEstimatedCostUSD(
  modelName: string | undefined,
  promptTokens: number = 0,
  completionTokens: number = 0
): number {
  const pricing = getPricingForModel(modelName);
  const inputCost = (promptTokens * pricing.inputPer1M) / 1_000_000;
  const outputCost = (completionTokens * pricing.outputPer1M) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Formats a raw numeric USD cost into a clean, human-readable string.
 * Example outputs: "< 0.00001", "0.00018", "0.0042", "0.012"
 */
export function formatCostUSD(costUSD: number): string {
  if (costUSD <= 0) return '0.00000';
  if (costUSD < 0.00001) return '< 0.00001';
  if (costUSD < 0.001) return costUSD.toFixed(5);
  if (costUSD < 0.01) return costUSD.toFixed(4);
  return costUSD.toFixed(3);
}

/**
 * Aggregates all token usage, latency metrics, and costs for a list of conversations
 */
export function calculateSessionStats(conversations: Conversation[]): {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUSDNum: number;
  totalCostUSDFormatted: string;
  totalAiResponses: number;
  avgLatencyMs: number;
} {
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCostUSDNum = 0;
  let totalAiResponses = 0;
  let totalLatencyMs = 0;

  for (const conv of conversations) {
    if (!conv.messages) continue;
    for (const msg of conv.messages) {
      if (msg.role === 'assistant') {
        totalAiResponses++;
        const metrics = msg.metrics;
        
        const pTokens = metrics?.promptTokens ?? estimateTokenCount('prompt sample');
        const cTokens = metrics?.completionTokens ?? metrics?.exactTotalTokens ?? metrics?.approxTokens ?? estimateTokenCount(msg.content);
        const totalMsgTokens = metrics?.exactTotalTokens ?? (pTokens + cTokens);
        
        totalPromptTokens += pTokens;
        totalCompletionTokens += cTokens;
        totalTokens += totalMsgTokens;

        if (metrics?.totalTimeMs) {
          totalLatencyMs += metrics.totalTimeMs;
        }

        const cost = calculateEstimatedCostUSD(msg.modelUsed, pTokens, cTokens);
        totalCostUSDNum += cost;
      }
    }
  }

  const avgLatencyMs = totalAiResponses > 0 ? Math.round(totalLatencyMs / totalAiResponses) : 0;

  return {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCostUSDNum,
    totalCostUSDFormatted: formatCostUSD(totalCostUSDNum),
    totalAiResponses,
    avgLatencyMs,
  };
}
