import db from '../db/database';

export type BlacklistReason = '429' | '401' | '403';

// In-memory map: key -> expiry timestamp (ms) for global blacklist (401/403 or general 429)
const blacklistMap = new Map<string, number>();
const reasonMap = new Map<string, BlacklistReason>();

// Model-scoped blacklist: `${key}:${model}` -> expiry timestamp (ms) for model-specific quota (429)
const modelBlacklistMap = new Map<string, number>();

// In-memory map: key -> last used timestamp (ms) for LRU distribution
const lastUsedMap = new Map<string, number>();

export const DEFAULT_TTL_429 = 60 * 1000; // 60 seconds (1 minute cooldown matching Gemini free tier RPM reset)
export const DEFAULT_TTL_429_DAILY = 24 * 60 * 60 * 1000; // 24 hours for daily RPD limits
export const DEFAULT_TTL_AUTH = 24 * 60 * 60 * 1000; // 24 hours for 401/403

/**
 * Checks if a key is currently blacklisted globally or for a specific model.
 * If the key has expired, it is lazily removed and returns false.
 */
export function isKeyBlacklisted(key: string, model?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const now = Date.now();

  // 1. Check global blacklist
  const globalExpiry = blacklistMap.get(key);
  if (globalExpiry !== undefined) {
    if (now >= globalExpiry) {
      blacklistMap.delete(key);
      reasonMap.delete(key);
    } else {
      return true;
    }
  }

  // 2. Check model-scoped blacklist if model is specified
  if (model) {
    const modelKey = `${key}:${model.toLowerCase()}`;
    const modelExpiry = modelBlacklistMap.get(modelKey);
    if (modelExpiry !== undefined) {
      if (now >= modelExpiry) {
        modelBlacklistMap.delete(modelKey);
      } else {
        return true;
      }
    }
  }

  return false;
}

/**
 * Blacklists a key for the specified reason and TTL.
 * Can be scoped to a specific model (for model-specific 429 quotas).
 */
export function blacklistKey(key: string, reason: BlacklistReason = '429', ttlMs?: number, model?: string): void {
  if (!key || typeof key !== 'string') return;
  const ttl = ttlMs !== undefined ? ttlMs : (reason === '429' ? DEFAULT_TTL_429 : DEFAULT_TTL_AUTH);
  const expiry = Date.now() + ttl;

  if (model && reason === '429') {
    const modelKey = `${key}:${model.toLowerCase()}`;
    modelBlacklistMap.set(modelKey, expiry);
    const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '***';
    console.warn(`[KeyPool] Blacklisted key ${masked} on model ${model} for ${reason} (TTL: ${Math.round(ttl / 1000)}s)`);
  } else {
    blacklistMap.set(key, expiry);
    reasonMap.set(key, reason);
    const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '***';
    console.warn(`[KeyPool] Blacklisted key ${masked} globally for ${reason} (TTL: ${Math.round(ttl / 1000)}s)`);
  }
}

/**
 * Manually unblacklists a key (e.g. for testing or key rotation).
 */
export function unblacklistKey(key: string, model?: string): void {
  if (model) {
    modelBlacklistMap.delete(`${key}:${model.toLowerCase()}`);
  } else {
    blacklistMap.delete(key);
    reasonMap.delete(key);
  }
}

/**
 * Records that a key was just used, updating its LRU timestamp.
 */
export function recordKeyUsage(key: string): void {
  if (!key || typeof key !== 'string') return;
  lastUsedMap.set(key, Date.now());
}

/**
 * Returns the timestamp when the key was last used (or 0 if never used).
 */
export function getKeyLastUsed(key: string): number {
  return lastUsedMap.get(key) || 0;
}

/**
 * Clears the entire blacklist map (useful in tests).
 */
export function resetBlacklist(): void {
  blacklistMap.clear();
  reasonMap.clear();
  modelBlacklistMap.clear();
  lastUsedMap.clear();
}

/**
 * Sweeps and deletes all expired keys from the in-memory map.
 */
export function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, expiry] of blacklistMap.entries()) {
    if (now >= expiry) {
      blacklistMap.delete(key);
      reasonMap.delete(key);
    }
  }
  for (const [key, expiry] of modelBlacklistMap.entries()) {
    if (now >= expiry) {
      modelBlacklistMap.delete(key);
    }
  }
}

/**
 * Returns key statistics: total keys in pool, currently blacklisted, and available.
 */
export function getKeyStats(totalKeys?: number): { total: number; blacklisted: number; available: number } {
  cleanupExpired();
  const blacklisted = blacklistMap.size;
  let total = totalKeys;

  if (total === undefined) {
    try {
      const row = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
      if (row && row.value) {
        const keys = row.value.split('\n').map((k: string) => k.trim()).filter(Boolean);
        total = keys.length;
      }
    } catch {
      total = 0;
    }
  }

  const finalTotal = total ?? 0;
  const available = Math.max(0, finalTotal - blacklisted);
  return { total: finalTotal, blacklisted, available };
}

// Background cleanup interval: runs every 5 minutes
const cleanupTimer = setInterval(() => {
  cleanupExpired();
}, 5 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}
