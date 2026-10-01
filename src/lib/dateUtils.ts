/**
 * Central date/timezone handling. Read this before touching any date code.
 *
 * THE BUG THIS FIXES
 * -----------------
 * Every `createdAt` in the database is written by SQLite's `CURRENT_TIMESTAMP`,
 * which is **UTC**, stored as `'YYYY-MM-DD HH:MM:SS'` with no timezone marker.
 *
 * Passing that string straight to `new Date(str)` is the trap. The engine does NOT
 * treat it as UTC — it parses it as **local time**. So:
 *
 *   stored: 2026-10-01 21:30:00   (UTC)
 *   new Date(...) on a Tehran machine -> 18:00 UTC, displayed as 21:30 Tehran
 *
 * A 3h30m error, in the wrong direction, on every transaction, order and signup
 * date. It is invisible in development (the dev box happened to be on Tehran time,
 * where the round-trip looks correct) and wrong in production.
 *
 * The rule: **a string without an offset is UTC.** `parseDbDate` makes that
 * explicit, and every display site must render with `timeZone: TEHRAN_TZ` rather
 * than relying on the machine's locale. A user in Iran sees Tehran time regardless
 * of where the server runs (Render is UTC).
 */

export const TEHRAN_TZ = 'Asia/Tehran';

/**
 * Parse a database timestamp string into a correct Date.
 *
 * Handles the three shapes that actually occur:
 *   - `2026-10-01 21:30:00`   SQLite CURRENT_TIMESTAMP / DEFAULT (UTC, no marker)
 *   - `2026-10-01T21:30:00Z`  already ISO with Z
 *   - `2026-10-01T21:30:00+03:30` already ISO with an offset
 *   - a JS Date / epoch number, passed through
 */
export function parseDbDate(value: string | number | Date | null | undefined): Date {
  if (value === null || value === undefined || value === '') return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  let str = String(value).trim();

  // Date-only, e.g. news rows that only carry a day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00Z`);
  }

  // `YYYY-MM-DD HH:MM:SS` -> treat as UTC, NOT local.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    return new Date(str.replace(' ', 'T') + 'Z');
  }

  // ISO without any offset -> also UTC.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    return new Date(str + 'Z');
  }

  // Already carries Z or ±HH:MM — hand it to the engine untouched.
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** Full date + time in Tehran, e.g. «۱۴۰۵/۷/۹، ۲۱:۳۰:۰۰». */
export function formatTehranDateTime(value: string | number | Date | null | undefined): string {
  return parseDbDate(value).toLocaleString('fa-IR', { timeZone: TEHRAN_TZ });
}

/** Date only in Tehran. */
export function formatTehranDate(value: string | number | Date | null | undefined): string {
  return parseDbDate(value).toLocaleDateString('fa-IR', { timeZone: TEHRAN_TZ });
}

/** Time only in Tehran. */
export function formatTehranTime(value: string | number | Date | null | undefined): string {
  return parseDbDate(value).toLocaleTimeString('fa-IR', {
    timeZone: TEHRAN_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compact order date used in the orders table. */
export function formatTehranShortDate(value: string | number | Date | null | undefined): string {
  return parseDbDate(value).toLocaleDateString('fa-IR', {
    timeZone: TEHRAN_TZ,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

/** `YYYY-MM-DD` in Tehran — for grouping charts on the client. */
export function tehranDateKey(value: string | number | Date | null | undefined): string {
  // en-CA renders as YYYY-MM-DD, which sorts lexicographically.
  return parseDbDate(value).toLocaleDateString('en-CA', { timeZone: TEHRAN_TZ });
}

/**
 * Current Tehran "today" as `YYYY-MM-DD`, for building day buckets client-side.
 * Used instead of `new Date()` + local getters so the timeline matches the server.
 */
export function tehranTodayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TEHRAN_TZ });
}
