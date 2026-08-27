import crypto from 'crypto';

export interface CachedResponse {
  chunk: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  imageUrl?: string;
  imageUrls?: string[];
  timestamp: number;
}
export const responseCache = new Map<string, CachedResponse>();
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 500;

export function computeCacheKey(messages: Array<{ role: string; content: string; imageUrl?: string }>, model: string, systemPrompt?: string): string {
  const normalized = messages.map(m => ({
    r: m.role,
    c: (m.content || '').trim().toLowerCase(),
    img: m.imageUrl ? m.imageUrl.slice(0, 100) : ''
  }));
  const rawKey = JSON.stringify({ m: normalized, mod: model, s: (systemPrompt || '').trim() });
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function setCachedResponse(key: string, data: CachedResponse): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, data);
}
