export interface DemoScenario {
  id: string;
  label: string;
  command: string;
  qwenTitle: string;
  qwenPoints: string[];
  neonTitle: string;
  neonPoints: string[];
  consensus: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'auth',
    label: 'بررسی امنیت Auth',
    command: '/council بررسی امنیت تولید OTP و توکن‌های JWT در مسیر ورود',
    qwenTitle: 'Alibaba Qwen4-Max (معماری و کد)',
    qwenPoints: [
      'استفاده از Math.random() برای OTP ناامن است؛ با crypto.randomInt(10000, 100000) جایگزین شود.',
      'محدودیت نرخ درخواست (Rate Limit) علاوه بر IP روی شماره موبایل هم اعمال شود.',
    ],
    neonTitle: 'Google Gemini 4 Neon (منطق و ریسک)',
    neonPoints: [
      'پس از ۵ تلاش ناموفق، کد OTP فعلی باطل شود تا حمله Brute-force غیرممکن گردد.',
      'پاسخ خطای ورود باید کلی باشد تا شماره کاربران ثبت‌نام‌شده افشا نشود.',
    ],
    consensus: 'اجماع شورا: جایگزینی فوری با crypto.randomInt + باطل‌سازی OTP پس از ۵ خطا.',
  },
  {
    id: 'sqlite',
    label: 'رفع قفل SQLite',
    command: '/council دلیل خطای SQLITE_BUSY در تست‌ها و درخواست‌های هم‌زمان چیست؟',
    qwenTitle: 'Alibaba Qwen4-Max (معماری و کد)',
    qwenPoints: [
      'فعال‌سازی PRAGMA journal_mode = WAL به تنهایی کافی نیست؛ PRAGMA busy_timeout = 5000 تنظیم شود.',
      'فایل دیتابیس تست‌ها باید بر اساس Worker ID ایزوله شود.',
    ],
    neonTitle: 'Google Gemini 4 Neon (منطق و ریسک)',
    neonPoints: [
      'تراکنش‌های مالی کیف پول باید کوتاه و اتمیک باشند تا قفل نوشتن طولانی نشود.',
      'در حالت همگام‌سازی Turso، اتصال اولیه نباید بوت سرور را مسدود کند.',
    ],
    consensus: 'اجماع شورا: افزودن busy_timeout=5000 + ایزوله‌سازی دیتابیس هر Worker.',
  },
  {
    id: 'react',
    label: 'بهینه‌سازی استریم React',
    command: '/council جلوگیری از افت فریم و بافر شدن استریم SSE در چت‌باکس',
    qwenTitle: 'Alibaba Qwen4-Max (معماری و کد)',
    qwenPoints: [
      'ذخیره‌سازی همگام در localStorage هنگام دریافت هر توکن باعث لگ UI می‌شود؛ فقط پایان استریم ذخیره شود.',
      'از AbortController برای لغو درخواست بالادستی هنگام بسته شدن تب استفاده کنید.',
    ],
    neonTitle: 'Google Gemini 4 Neon (منطق و ریسک)',
    neonPoints: [
      'هدر X-Accel-Buffering: no برای جلوگیری از بافرینگ کلودفلر و Nginx الزامی است.',
      'ارسال Heartbeat هر ۱۵ ثانیه از تایم‌اوت ۱۰۰ ثانیه‌ای پروکسی جلوگیری می‌کند.',
    ],
    consensus: 'اجماع شورا: ذخیره اتمیک در پایان استریم + AbortController + هدر ضدبافر.',
  },
];

export interface IdeTab {
  id: string;
  label: string;
  subtitle: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  steps: string[];
}

export const IDE_TABS: IdeTab[] = [
  {
    id: 'antigravity',
    label: 'Google Antigravity',
    subtitle: 'اتصال بومی با اسلش‌کامند /council و Smart Delta Sync',
    baseUrl: 'http://localhost:8765/v1',
    apiKey: 'tarapol-local-key',
    model: 'tarapol-council',
    steps: [
      'نرم‌افزار تَراپُل و اکستنشن کروم را اجرا کنید (تب‌های Qwen یا Gemini باز باشند).',
      'مهارت /council به‌صورت خودکار فایل‌های تغییریافته را بسته‌بندی و هم‌زمان به شورا ارسال می‌کند.',
      'در پنجره چت کافیست بنویسید: /council سوال یا بررسی معماری شما',
    ],
  },
  {
    id: 'cursor',
    label: 'Cursor AI',
    subtitle: 'استفاده از مدل‌های تفکر عمیق بدون هزینه دلاری توکن',
    baseUrl: 'http://localhost:8765/v1',
    apiKey: 'tarapol-local-key',
    model: 'gemini-4-neon',
    steps: [
      'در Cursor وارد Settings ← Models ← OpenAI API Key شوید.',
      'گزینه Override OpenAI Base URL را فعال کرده و آدرس localhost:8765/v1 را وارد کنید.',
      'مدل‌های gemini-4-neon، qwen-4-max یا tarapol-council را اضافه و انتخاب کنید.',
    ],
  },
  {
    id: 'vscode',
    label: 'VS Code / Cline / Continue',
    subtitle: 'سازگار با تمام افزونه‌های OpenAI-Compatible و MCP',
    baseUrl: 'http://localhost:8765/v1',
    apiKey: 'tarapol-local-key',
    model: 'qwen-4-max',
    steps: [
      'در تنظیمات Cline یا Roo Code ارائه‌دهنده را روی OpenAI Compatible بگذارید.',
      'Base URL را http://localhost:8765/v1 و API Key را مقدار دلخواه قرار دهید.',
      'برای استفاده از سرور MCP، آدرس استاندارد تَراپُل را در mcp_config.json ثبت کنید.',
    ],
  },
];

export interface ComparisonRow {
  metric: string;
  directApi: string;
  tarapol: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    metric: 'هزینه ماهانه توکن و اشتراک',
    directApi: '۲۰ تا ۱۰۰+ دلار در ماه (پرداخت ارزی)',
    tarapol: '۰ دلار هزینه API — یک‌بار خرید لایسنس ریالی',
  },
  {
    metric: 'دسترسی بدون تحریم و کارت ارزی',
    directApi: 'نیازمند ویزا/مسترکارت و ریسک مسدودی حساب',
    tarapol: 'بدون نیاز به کارت ارزی، با حساب رایگان وب یا اکانت شخصی',
  },
  {
    metric: 'محرمانگی سورس‌کد پروژه',
    directApi: 'ارسال کدها به سرورهای واسط یا پروکسی‌های اشتراکی',
    tarapol: '۱۰۰٪ لوکال روی سیستم شما (پورت 8765) بدون سرور میانی',
  },
  {
    metric: 'قدرت تصمیم‌گیری و عیب‌یابی',
    directApi: 'وابسته به یک مدل واحد در هر لحظه',
    tarapol: 'هم‌فکری موازی دو مدل پرچمدار و ارائه اجماع نهایی (/council)',
  },
];

export interface BentoFeature {
  id: string;
  title: string;
  description: string;
  tag: string;
}

export const BENTO_FEATURES: BentoFeature[] = [
  {
    id: 'delta',
    title: 'Smart Delta Sync هوشمند',
    description:
      'به‌جای ارسال کل مخزن و هدررفت کانتکست، تنها فایل‌های تغییریافته و مرتبط با سوال شما به‌صورت خودکار بسته‌بندی و ارسال می‌شوند.',
    tag: 'کانتکست دقیق',
  },
  {
    id: 'offline-license',
    title: 'لایسنس سخت‌افزاری آفلاین و دائمی',
    description:
      'پس از فعال‌سازی روی Machine ID سیستم، بدون نیاز به استعلام مداوم از سرور مرکزی و بدون اشتراک ماهانه برای همیشه کار می‌کند.',
    tag: 'مالکیت دائمی',
  },
  {
    id: 'safety',
    title: 'حالت ایمنی انسانی (Human Safety Mode)',
    description:
      'تعامل با مرورگر واقعی شما با مکث‌های طبیعی و بدون رفتار رباتیک انجام می‌شود تا پایداری و ایمنی حساب‌های وب در بالاترین سطح بماند.',
    tag: 'پایش مداوم',
  },
  {
    id: 'cross-platform',
    title: 'نصب مستقل در Windows · macOS · Linux',
    description:
      'بسته‌های نصبی آماده و مستقل بدون نیاز به نصب دستی پایتون یا Node.js. آماده اجرا در کمتر از ۳ دقیقه روی تمام سیستم‌عامل‌ها.',
    tag: 'v2.1 Stable',
  },
];

export interface PricingPlan {
  id: 'starter' | 'pro' | 'team';
  badge: string;
  title: string;
  subtitle: string;
  price: number;
  featured?: boolean;
  ctaLabel: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    badge: 'توسعه‌دهنده فردی',
    title: 'پلن پایه (Starter)',
    subtitle: 'مناسب برنامه‌نویسان فریلنسر برای استفاده دائمی روی یک سیستم شخصی',
    price: 390000,
    ctaLabel: 'تهیه پلن پایه',
    features: [
      'فعال‌سازی دائمی روی ۱ سیستم (Machine ID)',
      'دسترسی کامل به Gemini 4 Neon و Qwen4-Max',
      'نصب‌کننده مستقل + اکستنشن اختصاصی کروم',
      'آپدیت‌های رایگان سری نسخه ۲.x',
    ],
  },
  {
    id: 'pro',
    badge: 'پیشنهاد شورای هوش مصنوعی',
    title: 'پلن حرفه‌ای (Pro Developer)',
    subtitle: 'برای توسعه‌دهندگانی که هم روی لپ‌تاپ و هم سیستم دسکتاپ کدنویسی می‌کنند',
    price: 690000,
    featured: true,
    ctaLabel: 'تهیه پلن حرفه‌ای (پیشنهادی)',
    features: [
      'فعال‌سازی هم‌زمان روی ۲ سیستم مستقل',
      'اسلش‌کامند اختصاصی شورای هم‌فکری (/council)',
      'پشتیبانی کامل از Antigravity، Cursor و VS Code',
      'سیستم کانتکست‌ساز هوشمند (Smart Delta Sync)',
      'پشتیبانی فنی در اولویت اختصاصی',
    ],
  },
  {
    id: 'team',
    badge: 'تیم‌ها و استودیوها',
    title: 'پلن سازمانی و تیمی (Team)',
    subtitle: 'برای شرکت‌های نرم‌افزاری و تیم‌های فنی تا ۵ برنامه‌نویس',
    price: 1490000,
    ctaLabel: 'تهیه پلن تیمی',
    features: [
      'فعال‌سازی روی تا ۵ سیستم کامپیوتری مستقل',
      'پشتیبانی از اشتراک شبکه محلی و چندکاربره',
      'امکان صدور فاکتور رسمی معتبر',
      'جلسه آموزش و راه‌اندازی آنلاین اختصاصی',
    ],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const TECHNICAL_FAQS: FaqItem[] = [
  {
    q: 'آیا کدهای پروژه من به سرورهای واسط ارسال می‌شوند؟',
    a: 'خیر، به هیچ وجه. نرم‌افزار تَراپُل کاملاً به‌صورت محلی (روی رایانه شما در پورت 8765) اجرا می‌شود. ارتباط فقط میان مرورگر کروم شخصی شما و محیط توسعه برقرار است و هیچ سرور میانی یا ردیابی وجود ندارد.',
  },
  {
    q: 'آیا با خرید این محصول اشتراک پولی Gemini یا Qwen دریافت می‌کنم؟',
    a: 'خیر. تَراپُل نرم‌افزار پل ارتباطی است و از حساب مرورگر خودتان استفاده می‌کند. با این حال می‌توانید با حساب کاملاً رایگان در سایت‌های Alibaba Qwen (مدل Qwen4-Max) و DeepSeek بدون هیچ هزینه دلاری استفاده کنید و در صورت داشتن اشتراک Gemini، به Gemini 4 Neon نیز متصل شوید.',
  },
  {
    q: 'تفاوت تَراپُل با مدل‌های داخلی Antigravity یا Cursor چیست؟',
    a: 'مدل‌های داخلی ادیتور برای اجرای سریع تسک‌ها عالی هستند، اما اغلب به مدل‌های تفکر عمیق وب (مانند Gemini 4 Neon و Qwen4-Max) بدون محدودیت توکن دسترسی ندارند. تَراپُل این مدل‌ها را به‌عنوان شورای مشاور ارشد به ادیتور شما اضافه می‌کند.',
  },
  {
    q: 'با کدام محیط‌های توسعه (IDE) و اکستنشن‌ها تست شده است؟',
    a: 'تَراپُل از هر دو استاندارد OpenAI Proxy (روی http://localhost:8765/v1) و سرور MCP پشتیبانی می‌کند و با Google Antigravity، Cursor، VS Code، Cline، Roo Code، Claude Code و Continue سازگار است.',
  },
  {
    q: 'روی ویندوز، مک و لینوکس بدون پیش‌نیاز پیچیده اجرا می‌شود؟',
    a: 'بله! نسخه‌های رسمی و مستقل برای ویندوز (Tarapol-Setup-v2.1.exe)، مک (Apple Silicon & Intel) و لینوکس ارائه می‌شوند و هیچ نیازی به نصب دستی Node.js یا پایتون ندارند.',
  },
  {
    q: 'اگر ویندوز را عوض کنم لایسنس چه می‌شود؟',
    a: 'کد لایسنس به‌صورت دائمی و آفلاین روی سیستم شما فعال می‌شود و در صورت تعویض ویندوز روی همان سخت‌افزار، مجدداً با همان کلید فعال می‌گردد. در صورت ارتقای سخت‌افزار نیز از طریق پشتیبانی ریست می‌شود.',
  },
];
