import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import {
  isKeyBlacklisted,
  blacklistKey,
  unblacklistKey,
  resetBlacklist,
  cleanupExpired,
  getKeyStats,
  DEFAULT_TTL_429,
  DEFAULT_TTL_AUTH,
} from '../keyHealthService';
import { getGeminiKeyFromPool } from '../utils';
import db from '../../db/database';
import { initializeSchema } from '../../db/schema';

describe('keyHealthService – 429 & Auth Key Blacklisting', () => {
  beforeAll(() => {
    initializeSchema();
  });

  beforeEach(() => {
    resetBlacklist();
  });

  afterEach(() => {
    resetBlacklist();
  });

  it('initially reports keys as not blacklisted', () => {
    expect(isKeyBlacklisted('test-key-1')).toBe(false);
    expect(isKeyBlacklisted('test-key-2')).toBe(false);
  });

  it('correctly blacklists a key on 429 and reports it as blacklisted', () => {
    blacklistKey('test-key-429', '429');
    expect(isKeyBlacklisted('test-key-429')).toBe(true);
    expect(isKeyBlacklisted('other-key')).toBe(false);
  });

  it('correctly blacklists a key on 401/403 with 24-hour default TTL', () => {
    blacklistKey('test-key-401', '401');
    blacklistKey('test-key-403', '403');
    expect(isKeyBlacklisted('test-key-401')).toBe(true);
    expect(isKeyBlacklisted('test-key-403')).toBe(true);
  });

  it('allows unblacklisting a key manually', () => {
    blacklistKey('test-key-to-unblacklist', '429');
    expect(isKeyBlacklisted('test-key-to-unblacklist')).toBe(true);
    unblacklistKey('test-key-to-unblacklist');
    expect(isKeyBlacklisted('test-key-to-unblacklist')).toBe(false);
  });

  it('lazily expires keys after TTL expires', () => {
    // Blacklist with custom short TTL (50ms)
    blacklistKey('short-ttl-key', '429', 50);
    expect(isKeyBlacklisted('short-ttl-key')).toBe(true);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(isKeyBlacklisted('short-ttl-key')).toBe(false);
        resolve();
      }, 70);
    });
  });

  it('cleanupExpired removes expired keys from the blacklist', () => {
    blacklistKey('expired-key-1', '429', 20);
    blacklistKey('active-key-2', '429', 60000);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        cleanupExpired();
        // expired key should be swept
        expect(isKeyBlacklisted('expired-key-1')).toBe(false);
        // active key should still remain
        expect(isKeyBlacklisted('active-key-2')).toBe(true);
        resolve();
      }, 40);
    });
  });

  it('getKeyStats returns accurate total, blacklisted, and available counts', () => {
    blacklistKey('stat-key-1', '429');
    blacklistKey('stat-key-2', '401');
    blacklistKey('stat-key-3', '403');

    const stats = getKeyStats(10);
    expect(stats.total).toBe(10);
    expect(stats.blacklisted).toBe(3);
    expect(stats.available).toBe(7);
  });

  it('logs a warning when available keys are less than 50% of total pool', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup pool in database with 4 keys
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
      'pool-key-A\npool-key-B\npool-key-C\npool-key-D'
    );

    try {
      // Blacklist 3 of 4 keys (75% blacklisted, available = 1 < 50%)
      blacklistKey('pool-key-A', '429');
      blacklistKey('pool-key-B', '429');
      blacklistKey('pool-key-C', '429');

      const selected = getGeminiKeyFromPool();
      expect(selected).toBe('pool-key-D');

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[KeyPool] WARNING: 3/4 keys blacklisted. Only 1 available.')
      );
    } finally {
      consoleWarnSpy.mockRestore();
      // Restore original site_settings
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
          originalSetting.value
        );
      }
    }
  });

  it('simulates mock 429: blacklisted key is skipped in next round-robin turn', () => {
    // Setup 3 test keys in DB pool
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
      'key-alpha\nkey-beta\nkey-gamma'
    );

    try {
      // Step 1: Simulate first usage
      const first = getGeminiKeyFromPool();
      expect(['key-alpha', 'key-beta', 'key-gamma']).toContain(first);

      // Step 2: First key receives a 429 quota exhaustion error
      blacklistKey(first!, '429');
      expect(isKeyBlacklisted(first!)).toBe(true);

      // Step 3: Next selections must NEVER return the blacklisted key
      for (let i = 0; i < 5; i++) {
        const next = getGeminiKeyFromPool();
        expect(next).not.toBe(first);
        expect(['key-alpha', 'key-beta', 'key-gamma']).toContain(next);
      }
    } finally {
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
          originalSetting.value
        );
      }
    }
  });

  it('throws Persian error when ALL keys in pool are blacklisted', () => {
    const originalSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
    db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
      'dead-key-1\ndead-key-2'
    );

    try {
      blacklistKey('dead-key-1', '429');
      blacklistKey('dead-key-2', '429');

      expect(() => {
        getGeminiKeyFromPool();
      }).toThrow('در حال حاضر ظرفیت سرویس تکمیل است. لطفاً چند دقیقه دیگر تلاش کنید.');
    } finally {
      if (originalSetting?.value) {
        db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('gemini_keys_pool', ?)").run(
          originalSetting.value
        );
      }
    }
  });
});
