import db from '../db/database';

/**
 * Retrieves a string setting from site_settings table with fallback.
 */
export function getSiteSetting(key: string, defaultValue: string = ''): string {
  try {
    const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key) as { value?: string } | undefined;
    if (row && row.value !== undefined && row.value !== null) {
      return row.value;
    }
  } catch (err) {
    console.warn(`[SettingsService] Failed to read setting "${key}":`, err);
  }
  return defaultValue;
}

/**
 * Retrieves a numeric setting from site_settings table with fallback.
 */
export function getSiteSettingNumber(key: string, defaultValue: number): number {
  const str = getSiteSetting(key, String(defaultValue));
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
