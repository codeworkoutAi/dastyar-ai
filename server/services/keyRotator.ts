import db from '../db/database';

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
   */
  public parseKeys(raw: string | undefined | null): string[] {
    if (!raw) return [];
    return raw
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5);
  }

  /**
   * Get all configured keys in the pool from site_settings or fallback
   */
  public getPoolKeys(): string[] {
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

  /**
   * Get next healthy API key in round-robin fashion
   */
  public getNextKey(fallbackKey: string = ''): string {
    const keys = this.getPoolKeys();
    if (keys.length === 0) {
      return fallbackKey;
    }

    const now = Date.now();
    // Filter out keys currently on cooldown
    const healthyKeys = keys.filter(k => {
      const health = this.healthMap.get(k);
      return !health || health.cooldownUntil <= now;
    });

    // If all keys are on cooldown, pick the one with earliest cooldown expiry
    const candidates = healthyKeys.length > 0 ? healthyKeys : keys;

    this.currentIndex = (this.currentIndex + 1) % candidates.length;
    return candidates[this.currentIndex] || fallbackKey;
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
