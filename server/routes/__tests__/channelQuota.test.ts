import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import db from '../../db/database';
import { initializeSchema } from '../../db/schema';
import { setCurrentUserScope, getCurrentUserScope, saveConversations, loadConversations, saveActiveConversationId, loadActiveConversationId } from '../../../src/lib/storage';
import { Conversation } from '../../../src/types';

beforeAll(() => {
  initializeSchema();
}, 30000);

describe('Channel & Guest Quota Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has seeded channel-specific limits in site_settings', () => {
    const guestLimit = (db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_limit_guest'").get() as any)?.value;
    const userLimit = (db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_limit_user'").get() as any)?.value;
    const telegramLimit = (db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_limit_telegram'").get() as any)?.value;
    const bazaarLimit = (db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_limit_bazaar'").get() as any)?.value;

    expect(guestLimit).toBe('3');
    expect(userLimit).toBe('15');
    expect(telegramLimit).toBe('20');
    expect(bazaarLimit).toBe('30');
  });

  it('has source and deviceFingerprint columns in users table', () => {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as any[];
    const columnNames = tableInfo.map(col => col.name);

    expect(columnNames).toContain('source');
    expect(columnNames).toContain('deviceFingerprint');
  });

  it('enforces Layer Zero: guest sessions are NOT persisted to localStorage', () => {
    setCurrentUserScope(null); // sets scope to 'guest'
    expect(getCurrentUserScope()).toBe('guest');

    const testConversation: Conversation = {
      id: 'conv-test-123',
      title: 'تست مهمان',
      messages: [{ id: 'm1', role: 'user', content: 'سلام مهمان', timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveConversations([testConversation]);
    saveActiveConversationId('conv-test-123');

    // Storage should not have saved them
    expect(loadConversations()).toEqual([]);
    expect(loadActiveConversationId()).toBeNull();
  });

  it('persists conversations for authenticated users', () => {
    setCurrentUserScope(999); // sets scope to 'uc_10999'
    expect(getCurrentUserScope()).toBe('uc_10999');

    const testConversation: Conversation = {
      id: 'conv-user-456',
      title: 'گفتگوی کاربر ثبت نام شده',
      messages: [{ id: 'm1', role: 'user', content: 'سلام کاربر', timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveConversations([testConversation]);
    saveActiveConversationId('conv-user-456');

    const loaded = loadConversations();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('conv-user-456');
    expect(loadActiveConversationId()).toBe('conv-user-456');
  });
});
