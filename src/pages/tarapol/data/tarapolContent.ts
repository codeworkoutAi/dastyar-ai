export interface IdeQuickConfig {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  hint: string;
}

export const IDE_CONFIGS: IdeQuickConfig[] = [
  {
    id: 'antigravity',
    label: 'Antigravity',
    baseUrl: 'http://localhost:8765/v1',
    model: 'tarapol-council',
    hint: 'دستور /council در چت',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    baseUrl: 'http://localhost:8765/v1',
    model: 'gemini-4-neon',
    hint: 'Override OpenAI Base URL',
  },
  {
    id: 'vscode',
    label: 'VS Code / Cline',
    baseUrl: 'http://localhost:8765/v1',
    model: 'qwen-4-max',
    hint: 'OpenAI Compatible + MCP',
  },
];

export interface BentoCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  span: string;
}

export const BENTO_CARDS: BentoCard[] = [
  {
    id: 'license',
    title: 'لایسنس سخت‌افزاری آفلاین',
    subtitle: 'یک‌بار خرید، مالکیت همیشگی',
    image: '/images/tarapol/bento-license.webp',
    span: 'md:col-span-7',
  },
  {
    id: 'privacy',
    title: 'حریم خصوصی ۱۰۰٪ لوکال',
    subtitle: 'بدون ارسال کد به سرور واسط',
    image: '/images/tarapol/bento-privacy.webp',
    span: 'md:col-span-5',
  },
  {
    id: 'context',
    title: 'همگام‌سازی هوشمند فایل‌ها',
    subtitle: 'ارسال خودکار تغییرات پروژه',
    image: '/images/tarapol/bento-context.webp',
    span: 'md:col-span-5',
  },
  {
    id: 'speed',
    title: 'پروکسی پرسرعت ۸۷۶۵',
    subtitle: 'اجرا روی ویندوز، مک و لینوکس',
    image: '/images/tarapol/bento-speed.webp',
    span: 'md:col-span-7',
  },
];

export interface PricingPlan {
  id: 'starter' | 'pro' | 'team';
  badge: string;
  title: string;
  price: number;
  featured?: boolean;
  ctaLabel: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    badge: 'شخصی',
    title: 'پایه (Starter)',
    price: 390000,
    ctaLabel: 'خرید لایسنس پایه',
    features: [
      'فعال‌سازی روی ۱ سیستم',
      'Gemini 4 Neon + Qwen4-Max',
      'آپدیت رایگان نسخه ۲.x',
    ],
  },
  {
    id: 'pro',
    badge: 'پیشنهاد شورا',
    title: 'حرفه‌ای (Pro)',
    price: 690000,
    featured: true,
    ctaLabel: 'خرید پلن حرفه‌ای',
    features: [
      'فعال‌سازی روی ۲ سیستم',
      'اسلش‌کامند /council',
      'Antigravity + Cursor + VS Code',
    ],
  },
  {
    id: 'team',
    badge: 'تیمی',
    title: 'سازمانی (Team)',
    price: 1490000,
    ctaLabel: 'خرید پلن تیمی',
    features: [
      'فعال‌سازی تا ۵ سیستم',
      'اشتراک شبکه محلی',
      'پشتیبانی و فاکتور رسمی',
    ],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const TECHNICAL_FAQS: FaqItem[] = [
  {
    q: 'آیا کدهای پروژه به سرور واسط ارسال می‌شوند؟',
    a: 'خیر؛ تَراپُل کاملاً محلی روی پورت 8765 اجرا می‌شود و ارتباط فقط بین ادیتور و مرورگر خودتان است.',
  },
  {
    q: 'آیا نیاز به خرید اشتراک دلاری جداگانه است؟',
    a: 'خیر؛ با حساب رایگان Qwen و DeepSeek بدون هزینه دلاری کار می‌کند و اکانت شخصی Gemini را هم پشتیبانی می‌کند.',
  },
  {
    q: 'روی ویندوز، مک و لینوکس بدون پیش‌نیاز اجرا می‌شود؟',
    a: 'بله؛ فایل نصبی مستقل برای هر سه سیستم‌عامل بدون نیاز به نصب دستی Node.js یا پایتون ارائه می‌شود.',
  },
  {
    q: 'در صورت تعویض ویندوز لایسنس حفظ می‌شود؟',
    a: 'بله؛ لایسنس آفلاین روی سخت‌افزار شما ثبت می‌شود و پس از نصب مجدد ویندوز با همان کلید فعال می‌گردد.',
  },
];
