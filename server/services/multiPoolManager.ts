import db from '../db/database';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type FailureReason = '429' | '401' | '403' | 'timeout' | 'error';

export interface KeyRecord {
  key: string;
  provider: string;
  state: CircuitState;
  lastUsed: number;
  rateLimitedUntil: number;
  failureCount: number;
  successCount: number;
  modelQuotas: Map<string, number>; // model -> expiry timestamp (ms)
}

export interface PoolStats {
  total: number;
  ready: number;
  cooling: number;
  quarantined: number;
}

export const DEFAULT_TTL_429_RPM = 60 * 1000; // 60 seconds for RPM limits
export const DEFAULT_TTL_429_DAILY = 24 * 60 * 60 * 1000; // 24 hours for daily RPD / token quotas
export const DEFAULT_TTL_AUTH = 24 * 60 * 60 * 1000; // 24 hours for invalid/unauthorized keys

/**
 * MultiPoolManager handles credential pools for multiple LLM providers (Gemini, Groq, etc.)
 * with zero-latency in-memory circuit breaking, LRU key pacing, and automated failover.
 */
export class MultiPoolManager {
  private pools: Map<string, Map<string, KeyRecord>> = new Map();
  private poolCacheDirty: Map<string, boolean> = new Map();
  private lastSyncTime: Map<string, number> = new Map();
  private readonly CACHE_TTL_MS = 30 * 1000; // Sync with DB settings every 30s max if not dirty

  constructor() {
    // Setup background sweep every 2 minutes
    const timer = setInterval(() => {
      this.sweepExpiredQuarantines();
    }, 2 * 60 * 1000);
    if (timer.unref) {
      timer.unref();
    }
  }

  /**
   * Invalidates in-memory cache for a provider pool so next acquire reloads from DB.
   */
  public invalidatePool(provider: string): void {
    this.poolCacheDirty.set(provider.toLowerCase(), true);
  }

  /**
   * Ensures the provider's key records are loaded in memory from site_settings / env.
   */
  private syncPoolFromStorage(provider: string): void {
    const prov = provider.toLowerCase();
    const now = Date.now();
    const isDirty = this.poolCacheDirty.get(prov) ?? true;
    const lastSync = this.lastSyncTime.get(prov) ?? 0;

    if (!isDirty && now - lastSync < this.CACHE_TTL_MS && this.pools.has(prov)) {
      return;
    }

    let existingRecords = this.pools.get(prov);
    if (!existingRecords) {
      existingRecords = new Map<string, KeyRecord>();
      this.pools.set(prov, existingRecords);
    }

    let rawKeys: string[] = [];

    try {
      const settingKey = `${prov}_keys_pool`;
      const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(settingKey) as any;
      if (row && typeof row.value === 'string') {
        const parsed = row.value.split('\n').map((k: string) => k.trim()).filter(Boolean);
        rawKeys.push(...parsed);
      }
    } catch (err) {
      console.warn(`[MultiPoolManager] Failed to read ${prov}_keys_pool from site_settings:`, err);
    }

    // Fallbacks from environment for providers if pool in DB is empty
    if (rawKeys.length === 0) {
      if (prov === 'groq') {
        const envKey = process.env.DEFAULT_GROQ_KEY || process.env.GROQ_API_KEY;
        if (envKey) rawKeys.push(envKey.trim());
      } else if (prov === 'gemini') {
        const envKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY;
        if (envKey) rawKeys.push(envKey.trim());
      }
    }

    // Deduplicate
    const uniqueKeys = new Set(rawKeys.filter(k => Boolean(k) && typeof k === 'string'));

    // Remove keys that are no longer in storage
    for (const key of Array.from(existingRecords.keys())) {
      if (!uniqueKeys.has(key)) {
        existingRecords.delete(key);
      }
    }

    // Add or preserve existing records
    for (const key of uniqueKeys) {
      if (!existingRecords.has(key)) {
        existingRecords.set(key, {
          key,
          provider: prov,
          state: 'CLOSED',
          lastUsed: 0,
          rateLimitedUntil: 0,
          failureCount: 0,
          successCount: 0,
          modelQuotas: new Map(),
        });
      }
    }

    this.poolCacheDirty.set(prov, false);
    this.lastSyncTime.set(prov, now);
  }

  /**
   * O(1) In-Memory Key Pre-Filtering & Acquisition:
   * 1. Eliminates OPEN (quarantined) keys in 0ms.
   * 2. Evaluates HALF_OPEN probe candidates.
   * 3. Sorts by lastUsed ascending (LRU Paced Balancer) to maximize interval between requests.
   * Returns selected key string, or null if no healthy keys are currently available.
   */
  public acquireHealthyKey(provider: string, excludeKeys: string[] = [], targetModel?: string): string | null {
    const prov = provider.toLowerCase();
    this.syncPoolFromStorage(prov);

    const recordsMap = this.pools.get(prov);
    if (!recordsMap || recordsMap.size === 0) {
      return null;
    }

    const now = Date.now();
    const excludedSet = new Set(excludeKeys);
    const modelKey = targetModel ? targetModel.toLowerCase() : undefined;

    const healthyCandidates: KeyRecord[] = [];

    for (const record of recordsMap.values()) {
      if (excludedSet.has(record.key)) continue;

      // 1. Check model-scoped quota if specified
      if (modelKey && record.modelQuotas.has(modelKey)) {
        const modelExpiry = record.modelQuotas.get(modelKey)!;
        if (now < modelExpiry) {
          continue; // Model-scoped rate limit still active
        } else {
          record.modelQuotas.delete(modelKey);
        }
      }

      // 2. Check global circuit state
      if (record.state === 'OPEN') {
        if (now >= record.rateLimitedUntil) {
          // Cooldown expired: move to HALF_OPEN to probe
          record.state = 'HALF_OPEN';
          healthyCandidates.push(record);
        } else {
          // Still quarantined -> Skip instantly
          continue;
        }
      } else {
        // CLOSED or HALF_OPEN
        healthyCandidates.push(record);
      }
    }

    if (healthyCandidates.length === 0) {
      return null;
    }

    // 3. Paced Key Balancer: Sort by least recently used (LRU)
    healthyCandidates.sort((a, b) => a.lastUsed - b.lastUsed);

    const selected = healthyCandidates[0];
    selected.lastUsed = now;
    return selected.key;
  }

  /**
   * Records a successful turn, closing the circuit and resetting failure counts.
   */
  public recordSuccess(key: string, provider: string): void {
    const prov = provider.toLowerCase();
    let recordsMap = this.pools.get(prov);
    if (!recordsMap) {
      recordsMap = new Map();
      this.pools.set(prov, recordsMap);
    }

    let record = recordsMap.get(key);
    if (!record) {
      record = {
        key,
        provider: prov,
        state: 'CLOSED',
        lastUsed: Date.now(),
        rateLimitedUntil: 0,
        failureCount: 0,
        successCount: 1,
        modelQuotas: new Map(),
      };
      recordsMap.set(key, record);
      return;
    }

    record.state = 'CLOSED';
    record.failureCount = 0;
    record.successCount++;
    record.lastUsed = Date.now();
  }

  /**
   * Records a key failure (e.g. 429 quota exhaustion, 401 invalid key, 403 forbidden).
   * Instantly trips circuit to OPEN state to prevent any subsequent request from hitting it.
   */
  public recordFailure(
    key: string,
    provider: string,
    reason: FailureReason = '429',
    ttlMs?: number,
    model?: string
  ): void {
    const prov = provider.toLowerCase();
    this.syncPoolFromStorage(prov);

    let recordsMap = this.pools.get(prov);
    if (!recordsMap) {
      recordsMap = new Map();
      this.pools.set(prov, recordsMap);
    }

    let record = recordsMap.get(key);
    if (!record) {
      record = {
        key,
        provider: prov,
        state: 'CLOSED',
        lastUsed: 0,
        rateLimitedUntil: 0,
        failureCount: 0,
        successCount: 0,
        modelQuotas: new Map(),
      };
      recordsMap.set(key, record);
    }

    record.failureCount++;
    const now = Date.now();

    const isDaily = reason === '429' && (ttlMs !== undefined ? ttlMs > 60000 : false);
    const defaultTtl = reason === '429' ? (isDaily ? DEFAULT_TTL_429_DAILY : DEFAULT_TTL_429_RPM) : DEFAULT_TTL_AUTH;
    const finalTtl = ttlMs !== undefined ? ttlMs : defaultTtl;

    if (model && reason === '429') {
      // Model-scoped rate limit
      record.modelQuotas.set(model.toLowerCase(), now + finalTtl);
      const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '***';
      console.warn(`[MultiPoolManager] Blacklisted key ${masked} (${prov}) for model ${model} (TTL: ${Math.round(finalTtl / 1000)}s)`);
    } else {
      // Global key quarantine
      record.state = 'OPEN';
      record.rateLimitedUntil = now + finalTtl;
      const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '***';
      console.warn(`[MultiPoolManager] Quarantined key ${masked} (${prov}) globally for ${reason} (TTL: ${Math.round(finalTtl / 1000)}s)`);
    }
  }

  /**
   * Manually unblocks a key in the pool (e.g. on admin update or testing).
   */
  public unquarantineKey(key: string, provider: string, model?: string): void {
    const prov = provider.toLowerCase();
    const recordsMap = this.pools.get(prov);
    if (!recordsMap) return;

    const record = recordsMap.get(key);
    if (!record) return;

    if (model) {
      record.modelQuotas.delete(model.toLowerCase());
    } else {
      record.state = 'CLOSED';
      record.failureCount = 0;
      record.rateLimitedUntil = 0;
      record.modelQuotas.clear();
    }
  }

  /**
   * Checks if a key is currently blocked globally or for a specific model.
   */
  public isKeyBlocked(key: string, provider: string, model?: string): boolean {
    const prov = provider.toLowerCase();
    const recordsMap = this.pools.get(prov);
    if (!recordsMap) return false;

    const record = recordsMap.get(key);
    if (!record) return false;

    const now = Date.now();

    if (model && record.modelQuotas.has(model.toLowerCase())) {
      const expiry = record.modelQuotas.get(model.toLowerCase())!;
      if (now < expiry) return true;
      record.modelQuotas.delete(model.toLowerCase());
    }

    if (record.state === 'OPEN') {
      if (now < record.rateLimitedUntil) return true;
      record.state = 'HALF_OPEN';
    }

    return false;
  }

  /**
   * Returns live diagnostic statistics for a specific provider pool.
   */
  public getPoolStats(provider: string): PoolStats {
    const prov = provider.toLowerCase();
    this.syncPoolFromStorage(prov);

    const recordsMap = this.pools.get(prov);
    if (!recordsMap || recordsMap.size === 0) {
      return { total: 0, ready: 0, cooling: 0, quarantined: 0 };
    }

    const now = Date.now();
    let ready = 0;
    let cooling = 0;
    let quarantined = 0;

    for (const record of recordsMap.values()) {
      if (record.state === 'OPEN' && now < record.rateLimitedUntil) {
        quarantined++;
      } else {
        // Ready vs Cooling (used in last 60 seconds)
        if (now - record.lastUsed < 60 * 1000) {
          cooling++;
        } else {
          ready++;
        }
      }
    }

    return {
      total: recordsMap.size,
      ready,
      cooling,
      quarantined,
    };
  }

  /**
   * Returns diagnostic statistics across all registered provider pools.
   */
  public getAllPoolStats(): Record<string, PoolStats> {
    const result: Record<string, PoolStats> = {};
    const providers = ['gemini', 'groq'];
    for (const prov of providers) {
      result[prov] = this.getPoolStats(prov);
    }
    return result;
  }

  /**
   * Periodic garbage collector sweeping expired quarantines.
   */
  public sweepExpiredQuarantines(): void {
    const now = Date.now();
    for (const recordsMap of this.pools.values()) {
      for (const record of recordsMap.values()) {
        if (record.state === 'OPEN' && now >= record.rateLimitedUntil) {
          record.state = 'HALF_OPEN';
        }
        for (const [m, exp] of record.modelQuotas.entries()) {
          if (now >= exp) {
            record.modelQuotas.delete(m);
          }
        }
      }
    }
  }

  /**
   * Resets all internal in-memory state (useful for tests).
   */
  public resetAll(): void {
    this.pools.clear();
    this.poolCacheDirty.clear();
    this.lastSyncTime.clear();
  }
}

// Singleton global pool manager
export const multiPoolManager = new MultiPoolManager();
