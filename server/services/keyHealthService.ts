import db from '../db/database';

export type BlacklistReason = '429' | '401' | '403';

// In-memory map: key -> expiry timestamp (ms)
const blacklistMap = new Map<string, number>();
const reasonMap = new Map<string, BlacklistReason>();

export const DEFAULT_TTL_429 = 60 * 60 * 1000; // 1 hour
export const DEFAULT_TTL_AUTH = 24 * 60 * 60 * 1000; // 24 hours for 401/403

/**
 * Checks if a key is currently blacklisted.
 * If the key has expired, it is lazily removed and returns false.
 */
export function isKeyBlacklisted(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const expiry = blacklistMap.get(key);
  if (expiry === undefined) return false;

  if (Date.now() >= expiry) {
    blacklistMap.delete(key);
    reasonMap.delete(key);
    return false;
  }
  return true;
}

/**
 * Blacklists a key for the specified reason and TTL.
 * Default TTL: 1 hour for 429 (rate/quota limit), 24 hours for 401/403 (invalid key / permission denied).
 */
export function blacklistKey(key: string, reason: BlacklistReason = '429', ttlMs?: number): void {
  if (!key || typeof key !== 'string') return;
  const ttl = ttlMs !== undefined ? ttlMs : (reason === '429' ? DEFAULT_TTL_429 : DEFAULT_TTL_AUTH);
  const expiry = Date.now() + ttl;
  blacklistMap.set(key, expiry);
  reasonMap.set(key, reason);

  const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '***';
  console.warn(`[KeyPool] Blacklisted key ${masked} for ${reason} (TTL: ${Math.round(ttl / 1000)}s)`);
}

/**
 * Manually unblacklists a key (e.g. for testing or key rotation).
 */
export function unblacklistKey(key: string): void {
  blacklistMap.delete(key);
  reasonMap.delete(key);
}

/**
 * Clears the entire blacklist map (useful in tests).
 */
export function resetBlacklist(): void {
  blacklistMap.clear();
  reasonMap.clear();
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
