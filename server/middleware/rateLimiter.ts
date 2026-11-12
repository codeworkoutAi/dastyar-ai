import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';
import { extractOptionalUser } from './auth';

export const modelTestRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 10, // Max 10 requests per IP per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    success: false,
    error: 'تعداد درخواست‌های تست مدل بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر دوباره تلاش کنید.',
  },
});

export const aiRouteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد درخواست‌های هوش مصنوعی بیش از حد مجاز است. لطفاً یک دقیقه دیگر دوباره تلاش کنید.',
  },
});

const getGuestIpKey = (req: Request) => ipKeyGenerator(req.ip || '127.0.0.1');

const getAuthenticatedUserKey = (req: Request) => {
  const user = extractOptionalUser(req);
  return user?.id ? `user:${user.id}` : getGuestIpKey(req);
};

export const guestChatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per IP per minute for unauthenticated guest trial
  keyGenerator: getGuestIpKey,
  skip: (req) => Boolean(extractOptionalUser(req)?.id),
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد درخواست‌های گفت‌وگوی مهمان بیش از حد مجاز است. لطفاً یک دقیقه دیگر تلاش کنید یا وارد حساب خود شوید.',
  },
});

export const guestChatHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Anti-spam: max 30 guest messages per IP per hour
  keyGenerator: getGuestIpKey,
  skip: (req) => Boolean(extractOptionalUser(req)?.id),
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'برای جلوگیری از اسپم، محدودیت ساعتی مهمان پر شده است. لطفاً وارد حساب کاربری خود شوید یا کمی بعد تلاش کنید.',
  },
});

// Keyed by verified userId (not IP) so Iranian users sharing mobile/VPN IPs never throttle each other.
export const userChatMinuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12, // Anti-spam: max 12 messages per user per minute
  keyGenerator: getAuthenticatedUserKey,
  skip: (req) => {
    const user = extractOptionalUser(req);
    return !user?.id || user.role === 'admin';
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'سرعت ارسال پیام‌های شما بیش از حد مجاز است. لطفاً چند لحظه مکث کنید و دوباره تلاش کنید.',
  },
});

export const userChatHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 80, // Anti-spam: max 80 messages per user per hour
  keyGenerator: getAuthenticatedUserKey,
  skip: (req) => {
    const user = extractOptionalUser(req);
    return !user?.id || user.role === 'admin';
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد پیام‌های ارسالی در یک ساعت گذشته به سقف ضداسپم رسید. لطفاً کمی استراحت کنید و ساعتی دیگر ادامه دهید.',
  },
});

export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // Max 120 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  // express-rate-limit cannot trust X-Forwarded-For when the app sits behind a proxy
  // it does not control; trusting it would let any client spoof a fresh IP per request
  // and reset the counter. See aiRouteLimiter for the same reasoning.
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد درخواست‌های پنل مدیریت بیش از حد مجاز است. لطفاً یک دقیقه دیگر تلاش کنید.',
  },
});

// Expensive read-only reports (analytics charts, per-user usage aggregation) run
// 8+ aggregate queries over wallet_transactions. They are read-only but heavy, so
// they get a much tighter budget than the general admin surface. Without this a
// single loop in the client, or a script, can drain the server.
export const adminReportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 report requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد درخواست‌های گزارش‌گیری بیش از حد مجاز است. لطفاً یک دقیقه دیگر تلاش کنید.',
  },
});

// provider-live-balances makes up to two outbound HTTP calls per configured key
// (3s timeout each) on every call. Unbounded, it turns the admin endpoint into an
// amplifier against the providers' own APIs.
export const adminExternalQueryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 external provider queries per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد استعلام‌های آنلاین بیش از حد مجاز است. لطفاً یک دقیقه دیگر تلاش کنید.',
  },
});

export const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد تلاش‌های ورود با گوگل بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  },
});

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 contact form submissions per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    error: 'تعداد پیام‌های ارسالی بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.',
  },
});

