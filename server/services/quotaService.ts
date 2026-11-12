import { getSiteSettingNumber } from './settingsService';

/**
 * Returns the guest trial message limit before login is required (default 15).
 */
export function getGuestQuotaLimit(): number {
  return getSiteSettingNumber('free_daily_limit_guest', 15);
}

/**
 * Returns the free message quota limit based on channel and user identity.
 * - Guest (no userId): free_daily_limit_guest (default 15)
 * - Logged-in users on free models: unlimited (Infinity)
 */
export function getQuotaLimit(userId?: number | null, _userSource?: string): number {
  if (!userId) {
    return getGuestQuotaLimit();
  }
  return Infinity;
}
