import rateLimit from 'express-rate-limit';

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

