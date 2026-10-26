import { getSiteSettingNumber } from './settingsService';

/**
 * Returns the free message quota limit based on channel and user identity.
 * - Guest (no userId): free_daily_limit_guest (default 3)
 * - Bazaar app user: free_daily_limit_bazaar (default 30)
 * - Telegram bot user: free_daily_limit_telegram (default 20)
 * - Web logged-in user: free_daily_limit_user (default 15)
 */
export function getQuotaLimit(userId?: number | null, userSource?: string): number {
  if (!userId) {
    return getSiteSettingNumber('free_daily_limit_guest', 3);
  }
  if (userSource === 'bazaar') {
    return getSiteSettingNumber('free_daily_limit_bazaar', 30);
  }
  if (userSource === 'telegram') {
    return getSiteSettingNumber('free_daily_limit_telegram', 20);
  }
  return getSiteSettingNumber('free_daily_limit_user', 15);
}
