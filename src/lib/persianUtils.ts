// Persian typography and localization utilities

export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  const str = String(input);
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

// Check if a string primarily contains Arabic/Persian characters based on character ratio and content patterns
export function isRtlText(text: string): boolean {
  if (!text || text.trim() === '') return true;

  // If text starts with code block or structured json, treat as LTR
  const trimmed = text.trim();
  if (
    trimmed.startsWith('```') || 
    trimmed.startsWith('{') || 
    trimmed.startsWith('[') || 
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html')
  ) {
    // Check if there is significant Persian commentary outside the technical header
    const cleanNoCode = trimmed.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '').replace(/https?:\/\/\S+/g, '').trim();
    if (!cleanNoCode) return false;
    text = cleanNoCode;
  }

  // Remove markdown formatting symbols, URLs, inline code tags, numbers, and punctuation
  const clean = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[0-9۰-۹#*_\-+=|\\/<>[\]{}():;.,!?"'`~]/g, '')
    .trim();

  if (!clean) return true; // Default for empty/punctuation-only is RTL in Persian context

  const rtlChars = clean.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const ltrChars = clean.match(/[a-zA-Z]/g);

  const rtlCount = rtlChars ? rtlChars.length : 0;
  const ltrCount = ltrChars ? ltrChars.length : 0;

  // If no letters of either alphabet detected, default to true
  if (rtlCount === 0 && ltrCount === 0) return true;

  // If predominantly Latin letters (e.g. English, code keywords), return false (LTR)
  // If Persian character count is at least 30% of total alphabetic chars, consider RTL
  const totalLetters = rtlCount + ltrCount;
  return (rtlCount / totalLetters) >= 0.3;
}

export function detectContentDirection(text: string): { dir: 'rtl' | 'ltr'; textAlign: 'right' | 'left' } {
  const isRtl = isRtlText(text);
  return {
    dir: isRtl ? 'rtl' : 'ltr',
    textAlign: isRtl ? 'right' : 'left',
  };
}

export function formatPersianRelativeTime(timestamp: number, usePersianDigits: boolean = true): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // in seconds

  let result = '';
  if (diff < 30) {
    result = 'همین الان';
    return result;
  }
  if (diff < 60) {
    result = `${diff} ثانیه پیش`;
  } else if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    result = `${mins} دقیقه پیش`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    result = `${hours} ساعت پیش`;
  } else if (diff < 86400 * 7) {
    const days = Math.floor(diff / 86400);
    result = days === 1 ? 'دیروز' : `${days} روز پیش`;
  } else {
    const d = new Date(timestamp);
    result = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  return usePersianDigits ? toPersianDigits(result) : result;
}

export function formatPersianDateTime(timestamp: number, usePersianDigits: boolean = true): string {
  const d = new Date(timestamp);
  const dateStr = d.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const full = `${dateStr} - ساعت ${timeStr}`;
  return usePersianDigits ? toPersianDigits(full) : full;
}

export const PERSIAN_STARTER_PROMPTS = [
  {
    id: '1',
    title: 'برنامه‌نویسی و حل مسئله',
    prompt: 'یک کد پایتون برای مدیریت صف وظایف نامتقارن با مدیریت خطا برای من بنویس و خط به خط توضیح بده.',
    icon: 'code',
  },
  {
    id: '2',
    title: 'نگارش و ویرایش متن فارسی',
    prompt: 'لطفاً یک متن رسمی و محترمانه برای درخواست همکاری سازمانی با لحن حرفه‌ای بنویس.',
    icon: 'file-text',
  },
  {
    id: '3',
    title: 'ایده‌پردازی و تحلیل ایده',
    prompt: '۵ ایده نوآورانه برای استارتاپ‌های حوزه آموزش آنلاین با تمرکز بر تعامل کاربران پیشنهاد بده.',
    icon: 'sparkles',
  },
  {
    id: '4',
    title: 'خلاصه‌سازی و تحلیل نکات کلیدی',
    prompt: 'نکات کلیدی و اصول پایه‌ای معماری میکروسرویس‌ها در مقایسه با مونولیت را در قالب جدول مقایسه‌ای شرح بده.',
    icon: 'list-checks',
  },
];

export const MODEL_PRESETS = [
  {
    provider: 'gemini_default' as const,
    name: 'Gemini 3.6 Flash (پیش‌فرض)',
    model: 'gemini-3.6-flash',
    baseUrl: '',
    description: 'مدل پرسرعت و هوشمند نسل جدید گوگل برای گفتگو و متون',
  },
  {
    provider: 'gemini_default' as const,
    name: 'Gemini 3.5 Flash Lite (فوق سریع)',
    model: 'gemini-3.5-flash-lite',
    baseUrl: '',
    description: 'مدل بسیار سبک و پرسرعت گوگل برای پاسخ‌های آنی',
  },
  {
    provider: 'deepseek' as const,
    name: 'DeepSeek Chat (V3)',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
    description: 'مدل عمومی بسیار سریع و قدرتمند DeepSeek V3 با پشتیبانی عالی فارسی',
  },
  {
    provider: 'deepseek' as const,
    name: 'DeepSeek Reasoner (R1)',
    model: 'deepseek-reasoner',
    baseUrl: 'https://api.deepseek.com',
    description: 'مدل تفکر عمیق و استدلال ریاضی و برنامه‌نویسی DeepSeek R1',
  },
  {
    provider: 'openai' as const,
    name: 'OpenAI (GPT-4o Mini)',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    description: 'مدل اقتصادی و سریع شرکت OpenAI',
  },
  {
    provider: 'openai' as const,
    name: 'OpenAI (GPT-4o)',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    description: 'مدل پرچمدار رسمی OpenAI با قابلیت‌های پیشرفته استدلال',
  },
  {
    provider: 'openai' as const,
    name: 'OpenAI (o3-mini)',
    model: 'o3-mini',
    baseUrl: 'https://api.openai.com/v1',
    description: 'مدل استدلال و تفکر عمیق شرکت OpenAI با سرعت بالا',
  },
  {
    provider: 'openrouter' as const,
    name: 'OpenRouter (Llama 3.3 70B)',
    model: 'meta-llama/llama-3.3-70b-instruct',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'دسترسی به صدها مدل اوپن‌سورس و تجاری از درگاه یکپارچه',
  },
  {
    provider: 'openrouter' as const,
    name: 'OpenRouter (Claude 3.5 Sonnet)',
    model: 'anthropic/claude-3.5-sonnet',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'مدل فوق‌العاده هوشمند آنتروپیک از درگاه OpenRouter',
  },
  {
    provider: 'gemini_default' as const,
    name: 'Gemini Flash Latest (پایدار)',
    model: 'gemini-flash-latest',
    baseUrl: '',
    description: 'نسخه فوق‌العاده پایدار و با دسترسی بسیار بالا بدون وقفه',
  },
  {
    provider: 'gemini_default' as const,
    name: 'Gemini 3.1 Pro (استدلال عمیق)',
    model: 'gemini-3.1-pro-preview',
    baseUrl: '',
    description: 'قدرتمندترین مدل استدلال و کدنویسی عمیق گوگل',
  },
  {
    provider: 'openai_compatible' as const,
    name: 'Router.Cheap (دروازه هوشمند ارزان)',
    model: 'anthropic/claude-3.5-sonnet',
    baseUrl: 'https://router.cheap/v1',
    description: 'سرویس هوشمند مسیریابی و ارزان‌سازی اینفرس هوش مصنوعی',
  },
  {
    provider: 'openai_compatible' as const,
    name: 'Ollama محلی (Local)',
    model: 'llama3:latest',
    baseUrl: 'http://localhost:11434/v1',
    description: 'اجرای محلی روی سیستم شخصی بدون ارسال داده به اینترنت',
  },
  {
    provider: 'custom' as const,
    name: 'اندپوینت اختصاصی / پروکسی سفارشی',
    model: 'custom-model',
    baseUrl: 'https://my-proxy-api.com/v1',
    description: 'پیکربندی دستی Base URL، هدرهای سفارشی، کلید و نام مدل دلخواه شما',
  },
];

// Helper to translate and format any technical error into clear, friendly Persian
export function formatPersianErrorMessage(err: unknown): string {
  if (!err) return 'خطای نامشخص در برقراری ارتباط با مدل هوش مصنوعی.';
  const msg = typeof err === 'string' ? err : ((err as Error).message || String(err));
  const lower = msg.toLowerCase();

  // Location / Region Restriction & Sanctions
  if (
    lower.includes('location is not supported') ||
    lower.includes('location_not_supported') ||
    lower.includes('region not supported') ||
    lower.includes('country not supported') ||
    lower.includes('unsupported country') ||
    lower.includes('geographical restriction') ||
    lower.includes('geo-restriction') ||
    lower.includes('blocked region')
  ) {
    return 'دسترسی به این مدل از این موقعیت مکانی با محدودیت منطقه‌ای (تحریم) مواجه است. لطفاً ارتباط سرور/فیلترشکن را بررسی کرده یا از مدل‌های دیگر (مانند DeepSeek یا OpenRouter) استفاده فرمایید.';
  }

  // 1. Quota / Rate limit (429)
  if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('rate limit') || lower.includes('rate_limit_exceeded')) {
    return 'سقف مجاز تعداد درخواست‌های این مدل (Quota / Rate Limit) به پایان رسیده است. لطفاً چند لحظه بعد مجدداً تلاش کنید یا در بخش تنظیمات مدل دیگری (مانند Gemini Flash Lite) را انتخاب نمایید.';
  }

  // 2. Insufficient balance (402)
  if (lower.includes('402') || lower.includes('insufficient balance') || lower.includes('insufficient_quota')) {
    return 'موجودی یا اعتبار حساب کاربری شما در سرویس‌دهنده کافی نیست. لطفاً حساب خود را شارژ کرده یا مدل دیگری را انتخاب فرمایید.';
  }

  // 3. Invalid API Key / Unauthorized (401 / 403)
  if (lower.includes('401') || lower.includes('403') || lower.includes('invalid api key') || lower.includes('unauthorized') || lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('authentication fails')) {
    return 'کلید دسترسی (API Key) وارد شده نامعتبر، منقضی یا بدون مجوز است. لطفاً از طریق آیکون چرخ‌دنده ⚙️ در بالای صفحه، کلید صحیح را وارد کنید.';
  }

  // 4. Service unavailable / Overloaded (503)
  if (lower.includes('503') || lower.includes('high demand') || lower.includes('unavailable') || lower.includes('overloaded') || lower.includes('server_error')) {
    return 'سرورهای هوش مصنوعی در حال حاضر با ترافیک و حجم بالای کاربران مواجه هستند (کد ۵۰۳). لطفاً چند لحظه بعد دکمه «تلاش مجدد» را بزنید.';
  }

  // 5. Network / Offline / Disconnect / Timeout
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('aborted')
  ) {
    return 'ارتباط با سرور یا اینترنت برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کرده و دکمه «تلاش مجدد» را بزنید.';
  }

  // 6. Model not found or not available (404 / Model Not Available)
  if (
    lower.includes('404') ||
    lower.includes('not found') ||
    lower.includes('model_not_found') ||
    lower.includes('model not exist') ||
    lower.includes('not exist') ||
    lower.includes('not available') ||
    lower.includes('is not available') ||
    lower.includes('unknown model') ||
    lower.includes('invalid model') ||
    lower.includes('unsupported model')
  ) {
    return 'مدل انتخابی (یا نسخه مدل وارد شده) در سرویس‌دهنده در دسترس نیست یا نام آن تغییر کرده است. لطفاً از طریق آیکون چرخ‌دنده ⚙️ در بالای صفحه، مدل دیگری را انتخاب فرمایید.';
  }

  // 7. If text is already in Persian, clean up any internal prefixes
  if (/[\u0600-\u06FF]/.test(msg)) {
    return msg.replace(/^Error:\s*/i, '').trim();
  }

  // Fallback for any other English error without showing technical request IDs
  const cleanSnippet = msg.replace(/\(request id:[^)]+\)/gi, '').replace(/https?:\/\/\S+/gi, '').trim();
  return `خطا در پردازش مدل هوش مصنوعی (${cleanSnippet.length > 80 ? cleanSnippet.slice(0, 80) + '...' : cleanSnippet}). لطفاً دکمه «تلاش مجدد» را بزنید یا مدل دیگری را در تنظیمات انتخاب کنید.`;
}
