import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import db from '../../db/database';
import { multiPoolManager, CircuitState } from '../multiPoolManager';

describe('MultiPoolManager – Multi-Pool Circuit Breaker & Zero-Lag Routing', () => {
  beforeEach(() => {
    multiPoolManager.resetAll();
  });

  afterEach(() => {
    multiPoolManager.resetAll();
  });

  it('loads keys from site_settings into provider pool and selects via LRU', () => {
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'groq_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('groq_keys_pool', ?)").run(
      'gsk_key_1\ngsk_key_2\ngsk_key_3'
    );
    multiPoolManager.invalidatePool('groq');

    try {
      const first = multiPoolManager.acquireHealthyKey('groq');
      expect(first).toBeDefined();
      expect(['gsk_key_1', 'gsk_key_2', 'gsk_key_3']).toContain(first);

      const second = multiPoolManager.acquireHealthyKey('groq');
      expect(second).toBeDefined();
      expect(second).not.toBe(first);

      const stats = multiPoolManager.getPoolStats('groq');
      expect(stats.total).toBe(3);
      expect(stats.quarantined).toBe(0);
    } finally {
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('groq_keys_pool', ?)").run(originalSetting.value);
      } else {
        db.prepare("DELETE FROM site_settings WHERE key = 'groq_keys_pool'").run();
      }
      multiPoolManager.invalidatePool('groq');
    }
  });

  it('instantly quarantines failing keys (Circuit OPEN) and skips them in 0ms', () => {
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
      'key_alpha\nkey_beta'
    );
    multiPoolManager.invalidatePool('gemini');

    try {
      // Simulate 429 failure on key_alpha
      multiPoolManager.recordFailure('key_alpha', 'gemini', '429', 60000);
      expect(multiPoolManager.isKeyBlocked('key_alpha', 'gemini')).toBe(true);

      // Subsequent acquire must pick key_beta without touching key_alpha
      const key = multiPoolManager.acquireHealthyKey('gemini');
      expect(key).toBe('key_beta');

      // Now fail key_beta as well
      multiPoolManager.recordFailure('key_beta', 'gemini', '429', 60000);
      expect(multiPoolManager.acquireHealthyKey('gemini')).toBeNull();

      const stats = multiPoolManager.getPoolStats('gemini');
      expect(stats.total).toBe(2);
      expect(stats.quarantined).toBe(2);
    } finally {
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(originalSetting.value);
      }
      multiPoolManager.invalidatePool('gemini');
    }
  });

  it('supports model-scoped rate limits without blocking key for other models', () => {
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run('single_key');
    multiPoolManager.invalidatePool('gemini');

    try {
      // Blacklist for 'gemini-3.6-flash' only
      multiPoolManager.recordFailure('single_key', 'gemini', '429', 60000, 'gemini-3.6-flash');

      // Should be blocked for gemini-3.6-flash
      expect(multiPoolManager.isKeyBlocked('single_key', 'gemini', 'gemini-3.6-flash')).toBe(true);
      expect(multiPoolManager.acquireHealthyKey('gemini', [], 'gemini-3.6-flash')).toBeNull();

      // Should NOT be blocked for gemini-3.5-flash-lite
      expect(multiPoolManager.isKeyBlocked('single_key', 'gemini', 'gemini-3.5-flash-lite')).toBe(false);
      expect(multiPoolManager.acquireHealthyKey('gemini', [], 'gemini-3.5-flash-lite')).toBe('single_key');
    } finally {
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(originalSetting.value);
      }
      multiPoolManager.invalidatePool('gemini');
    }
  });

  it('recovers key to HALF_OPEN after cooldown expires', () => {
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'groq_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('groq_keys_pool', ?)").run('temp_fail_key');
    multiPoolManager.invalidatePool('groq');

    try {
      // Quarantine with 0ms TTL (expired immediately)
      multiPoolManager.recordFailure('temp_fail_key', 'groq', '429', 0);

      // Should be re-acquired as HALF_OPEN candidate
      const recovered = multiPoolManager.acquireHealthyKey('groq');
      expect(recovered).toBe('temp_fail_key');

      // Recording success closes circuit
      multiPoolManager.recordSuccess('temp_fail_key', 'groq');
      expect(multiPoolManager.isKeyBlocked('temp_fail_key', 'groq')).toBe(false);
    } finally {
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('groq_keys_pool', ?)").run(originalSetting.value);
      } else {
        db.prepare("DELETE FROM site_settings WHERE key = 'groq_keys_pool'").run();
      }
      multiPoolManager.invalidatePool('groq');
    }
  });

  it('aggregates statistics across all provider pools', () => {
    const allStats = multiPoolManager.getAllPoolStats();
    expect(allStats.gemini).toBeDefined();
    expect(allStats.groq).toBeDefined();
    expect(typeof allStats.gemini.total).toBe('number');
    expect(typeof allStats.groq.total).toBe('number');
  });
});
