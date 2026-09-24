import db from '../db/database';

export interface PoolKey {
  apiKey: string;
  baseUrl: string;
}

interface KeyHealth {
  key: string;
  cooldownUntil: number;
  failureCount: number;
}

class KeyRotatorService {
  private healthMap = new Map<string, KeyHealth>();
  private currentIndex = 0;

  /**
   * Parse keys from a string (separated by newline, comma, semicolon, or spaces)
   * Supports 'baseUrl|apiKey' format
   */
  public parseKeys(raw: string | undefined | null): PoolKey[] {
    if (!raw) return [];
    return raw
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5)
      .map(k => {
        if (k.includes('|')) {
          const parts = k.split('|');
          const p1 = parts[0].trim();
          const p2 = parts[1].trim();
          if (p1.startsWith('http')) {
            return { baseUrl: p1, apiKey: p2 };
          } else {
            return { baseUrl: p2, apiKey: p1 };
          }
        }
        return { baseUrl: 'https://router.cheap/v1', apiKey: k };
      });
  }

  /**
   * Get all configured keys in the pool from site_settings or fallback
   */
  public getPoolKeys(): PoolKey[] {
    try {
      const row = db.prepare("SELECT value FROM site_settings WHERE key = 'free_key_pool'").get() as any;
      if (row && row.value) {
        const parsed = this.parseKeys(row.value);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Fallbacks from environment variables if any
    const envPool = this.parseKeys(process.env.FREE_KEY_POOL);
    if (envPool.length > 0) return envPool;

    return [];
  }

  public getHealthyKeys(): PoolKey[] {
    const keys = this.getPoolKeys();
    if (keys.length === 0) return [];
    
    const now = Date.now();
    const healthyKeys = keys.filter(k => {
      const health = this.healthMap.get(k.apiKey);
      return !health || health.cooldownUntil <= now;
    });

    // If all keys are on cooldown, return all keys so we can at least try
    if (healthyKeys.length === 0) return keys;

    // Rotate the healthy keys so we don't always check the same first key (Load Balancing)
    this.currentIndex = (this.currentIndex + 1) % healthyKeys.length;
    return [...healthyKeys.slice(this.currentIndex), ...healthyKeys.slice(0, this.currentIndex)];
  }

  /**
   * Get next healthy API key in round-robin fashion
   */
  public getNextKey(fallbackKey: string = ''): PoolKey | null {
    const keys = this.getPoolKeys();
    if (keys.length === 0) {
      return fallbackKey ? { apiKey: fallbackKey, baseUrl: 'https://router.cheap/v1' } : null;
    }

    const now = Date.now();
    // Filter out keys currently on cooldown
    const healthyKeys = keys.filter(k => {
      const health = this.healthMap.get(k.apiKey);
      return !health || health.cooldownUntil <= now;
    });

    // If all keys are on cooldown, pick the one with earliest cooldown expiry
    const candidates = healthyKeys.length > 0 ? healthyKeys : keys;

    this.currentIndex = (this.currentIndex + 1) % candidates.length;
    return candidates[this.currentIndex] || null;
  }

  /**
   * Mark a key as rate-limited (429) to temporarily skip it
   */
  public reportRateLimit(key: string, cooldownSeconds: number = 60): void {
    if (!key) return;
    const now = Date.now();
    const existing = this.healthMap.get(key) || { key, cooldownUntil: 0, failureCount: 0 };
    existing.cooldownUntil = now + cooldownSeconds * 1000;
    existing.failureCount += 1;
    this.healthMap.set(key, existing);
    console.warn(`[KeyRotator] ⚠️ Key ...${key.slice(-6)} on cooldown for ${cooldownSeconds}s (fails: ${existing.failureCount})`);
  }

  /**
   * Reset health for a key if a request succeeded
   */
  public reportSuccess(key: string): void {
    if (this.healthMap.has(key)) {
      const existing = this.healthMap.get(key)!;
      existing.failureCount = 0;
    }
  }
}

export const keyRotator = new KeyRotatorService();
