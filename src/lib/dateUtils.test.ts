// Runtime tests for the timezone fix (AGENTS.md rule 19: tsc and vite build do NOT
// catch date/regex logic bugs).
import { describe, it, expect } from 'vitest';
import {
  parseDbDate,
  formatTehranDateTime,
  tehranDateKey,
  tehranTodayKey,
  TEHRAN_TZ,
} from './dateUtils';

describe('parseDbDate — a string without an offset is UTC', () => {
  it('treats the SQLite CURRENT_TIMESTAMP format as UTC, not local', () => {
    const d = parseDbDate('2026-10-01 21:30:00');
    // Must be 21:30 UTC regardless of the machine's timezone.
    expect(d.toISOString()).toBe('2026-10-01T21:30:00.000Z');
  });

  it('treats an ISO string with no offset as UTC', () => {
    expect(parseDbDate('2026-10-01T21:30:00').toISOString()).toBe('2026-10-01T21:30:00.000Z');
  });

  it('leaves an ISO string that already carries Z untouched', () => {
    expect(parseDbDate('2026-10-01T21:30:00Z').toISOString()).toBe('2026-10-01T21:30:00.000Z');
  });

  it('respects an explicit numeric offset', () => {
    // +03:30 is Iran standard time.
    expect(parseDbDate('2026-10-01T21:30:00+03:30').toISOString()).toBe('2026-10-01T18:00:00.000Z');
  });

  it('parses date-only strings as UTC midnight', () => {
    expect(parseDbDate('2026-10-01').toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('passes through Date objects and epoch numbers', () => {
    const d = new Date('2026-10-01T21:30:00.000Z');
    expect(parseDbDate(d).getTime()).toBe(d.getTime());
    expect(parseDbDate(1234567890).getTime()).toBe(1234567890);
  });

  it('falls back to now for empty / invalid input instead of throwing', () => {
    expect(() => parseDbDate('')).not.toThrow();
    expect(() => parseDbDate(null)).not.toThrow();
    expect(() => parseDbDate(undefined)).not.toThrow();
    expect(() => parseDbDate('not-a-date')).not.toThrow();
    expect(Number.isNaN(parseDbDate('not-a-date').getTime())).toBe(false);
  });
});

describe('Tehran rendering', () => {
  it('buckets a late-UTC transaction into the Tehran day it belongs to', () => {
    // THE BUG: 21:30 UTC on Oct 1 is 01:30 on Oct 2 in Tehran.
    // A naive date(createdAt) in SQL returns Oct 1 and mis-files the row.
    expect(tehranDateKey('2026-10-01 21:30:00')).toBe('2026-10-02');
  });

  it('renders 21:30 UTC as 01:00 the next day in Tehran (UTC+3:30)', () => {
    // Intl's fa-IR output omits the leading zero, hence ۱:۰۰ rather than ۰۱:۰۰.
    expect(formatTehranDateTime('2026-10-01 21:30:00')).toContain('۱:۰۰');
  });

  it('keeps an early-UTC transaction on the same Tehran day', () => {
    // 10:00 UTC on Oct 1 is 13:30 the same day in Tehran.
    expect(tehranDateKey('2026-10-01 10:00:00')).toBe('2026-10-01');
  });

  it('produces a sortable YYYY-MM-DD key', () => {
    expect(tehranDateKey('2026-10-01 10:00:00')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('tehranTodayKey', () => {
  it('returns a valid YYYY-MM-DD string', () => {
    expect(tehranTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('TEHRAN_TZ', () => {
  it('is the IANA zone, not a fixed offset', () => {
    expect(TEHRAN_TZ).toBe('Asia/Tehran');
  });
});
