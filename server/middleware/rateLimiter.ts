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
