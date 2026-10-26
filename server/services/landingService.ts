import db, { syncDatabase } from '../db/database.js';

// ==========================================
// 1. DEFAULT FACTORY VALUES (Fallback Data)
// ==========================================

export const DEFAULT_LANDING_VISIBILITY = {
  hero: true,
  features: true,
  manifesto: true,
  professions: true,
  gallery: true,
  analytics: true,
  pricing: true,
  faqs: true,
  cta: true
};

export const DEFAULT_LANDING_HERO = {
  enabled: true,
  featurePill: 'نسل جدید هوش مصنوعی فارسی',
  title: 'دسترسی مستقیم و بدون واسطه به برترین هوش‌های مصنوعی جهان',
  subtitle: 'بدون نیاز به خرید اشتراک‌های ماهانه دلاری؛ با دستیار هوش مصنوعی به زبان فارسی گفتگو کنید و هزینه را به اندازه مصرف واقعی به تومان بپردازید.',
  bannerTitle: 'یک کلید برای تمام پرچمداران جهان',
  bannerSubtitle: 'بدون نیاز به ده‌ها اکانت ارزی. پلتفرم ما جامع‌ترین درگاه را با پشتیبانی کامل از تمامی مدل‌های قدرتمند هوش مصنوعی در اختیار شما قرار می‌دهد.',
  bannerBtnText: 'شروع رایگان گفتگو',
  bannerBtnLink: '/chat'
};

export const DEFAULT_LANDING_FEATURES = {
  enabled: true,
  badge: 'امکانات و مدل‌های هوش مصنوعی',
  title: 'مجموعه‌ای یکپارچه از برترین ابزارهای هوش مصنوعی دنیا',
  subtitle: 'تجربه‌ای بدون مرز و متناسب با نیازهای کاری، تحصیلی و هنری شما در یک پلتفرم بومی و امن'
};

export const DEFAULT_LANDING_MANIFESTO = {
  enabled: true,
  badge: 'بیانیه شفافیت و فلسفه طراحی',
  title: 'ابزار کار واقعی یا اسباب سرگرمی؟ چرا تمرکز ما بر کارایی و حل مسائل روزمره است',
  subtitle: 'امروزه بسیاری از سرویس‌ها به سمت قابلیت‌های جانبی و پرهزینه‌ای مانند ساخت تصاویر، کلیپ‌های ویدیویی یا ویرایش‌های پیچیده گرافیکی رفته‌اند. هرچند این قابلیت‌ها جذابیت‌های بصری دارند، اما تجربه کاربردی نشان می‌دهد:',
  reasons: [
    {
      id: 'r1',
      icon: 'Coins',
      title: 'مصرف بسیار بالای اعتبار و هزینه‌های سنگین',
      desc: 'تولید یک کلیپ کوتاه چندثانیه‌ای یا تصویرسازی‌های سنگین، بخش عمده‌ای از اعتبار کاربر را به یک‌باره مصرف می‌کند؛ در حالی که همان میزان اعتبار می‌تواند پاسخگوی صدها پرسش علمی و پژوهشی باشد.'
    },
    {
      id: 'r2',
      icon: 'Zap',
      title: 'زمان انتظار طولانی و عدم قطعیت در خروجی',
      desc: 'فناوری‌های تولید ویدیو و پردازش‌های سنگین گرافیکی به دلیل ماهیت پیچیده، با تأخیرهای چنددقیقه‌ای و گاه نتایج غیردقیق همراه هستند که برای محیط‌های جدی کاری و تحصیلی بهینه نیستند.'
    },
    {
      id: 'r3',
      icon: 'ShieldCheck',
      title: 'تعهد ما به بازدهی و بهره‌وری پایدار',
      desc: 'ما تمام توان مهندسی خود را بر توسعه یک دستیار پایدار، با پاسخ‌دهی فوق‌سریع و درک عمیق زبان فارسی متمرکز کرده‌ایم تا هر ریال از اعتبار شما، مستقیماً صرف پیشرفت کار و صرفه‌جویی در زمان شود.'
    }
  ]
};

export const DEFAULT_LANDING_PROFESSIONS_SETTINGS = {
  enabled: true,
  badge: 'تخصص‌ها و کاربردهای واقعی',
  title: 'پلتفرمی طراحی‌شده برای حرفه‌ای‌ها و دانشگاهیان',
  subtitle: 'از نگارش مقالات علمی تا مهندسی نرم‌افزار؛ دستیار هوشمند در کنار شماست.'
};

export const DEFAULT_LANDING_PROFESSIONS = [
  {
    id: 'academic',
    title: 'دانشجویان، اساتید و پژوهشگران',
    icon: 'GraduationCap',
    image: '/images/professions/academic.webp',
    badge: 'پژوهش و دانشگاه',
    accentColor: 'amber',
    desc: 'تحلیل مقالات ISI، استخراج فصول و ساختار پایان‌نامه، ترجمه تخصصی روان و رفرنس‌دهی علمی.',
    prompt: 'یک ساختار استاندارد ۵ فصلی برای پروپوزال کارشناسی ارشد با موضوع "کاربرد هوش مصنوعی در بهینه‌سازی سیستم‌های مالی" تنظیم کن و فرضیات پژوهش را بنویس.',
    enabled: true,
    order: 1
  },
  {
    id: 'developer',
    title: 'برنامه‌نویسان و مهندسان نرم‌افزار',
    icon: 'Terminal',
    image: '/images/professions/developer.webp',
    badge: 'فناوری و توسعه',
    accentColor: 'indigo',
    desc: 'دیباگ سریع خطاهای کدنویسی، نگارش کوئری‌های SQL و معماری پروژه‌های نرم‌افزاری با استدلال عمیق.',
    prompt: 'یک کامپوننت React با تایپ‌اسکریپت برای پیاده‌سازی Infinite Scroll بنویس که با Intersection Observer کار کند و مدیریت خطای شبکه داشته باشد.',
    enabled: true,
    order: 2
  },
  {
    id: 'content',
    title: 'تولیدکنندگان محتوا و متخصصان سئو',
    icon: 'PenTool',
    image: '/images/professions/content.webp',
    badge: 'بازاریابی و رسانه',
    accentColor: 'emerald',
    desc: 'تدوین تقویم محتوایی، ایده‌پردازی سناریوهای ویدیویی، نگارش مقالات سئوشده و بازنویسی متون فارسی.',
    prompt: 'یک ساختار مقاله جامع ۲۰۰۰ کلمه‌ای سئوشده با تگ‌های H2 و H3 درباره "راهنمای جامع سئو معنایی در سال ۲۰۲۶" تدوین کن.',
    enabled: true,
    order: 3
  },
  {
    id: 'lawyer',
    title: 'مدیران، مشاوران و وکلا',
    icon: 'Scale',
    image: '/images/professions/legal.webp',
    badge: 'حقوقی و سازمانی',
    accentColor: 'purple',
    desc: 'بررسی مفاد قراردادها، نگارش صورتجلسات رسمی، مکاتبات اداری پیشرفته و تحلیل سناریوهای حقوقی.',
    prompt: 'یک پیش‌نویس قرارداد محرمانگی اطلاعات (NDA) دوجانبه برای همکاری استارتاپ نرم‌افزاری با سرمایه‌گذار بنویس.',
    enabled: true,
    order: 4
  },
  {
    id: 'medical',
    title: 'پزشکان و کادر درمان',
    icon: 'Stethoscope',
    image: '/images/professions/medical.webp',
    badge: 'سلامت و درمان',
    accentColor: 'emerald',
    desc: 'مرور گایدلاین‌های بالینی، خلاصه پرونده و فرمولاسیون پاسخ‌های مستند پزشکی به فارسی روان.',
    prompt: 'مرور سیستماتیک پروتکل‌های درمانی مرحله اول دیابت نوع ۲ بر اساس راهنماهای بالینی ADA سال ۲۰۲۶ را خلاصه کن.',
    enabled: true,
    order: 5
  },
  {
    id: 'finance',
    title: 'فعالان مالی و تحلیل‌گران بازار',
    icon: 'TrendingUp',
    image: '/images/professions/business.webp',
    badge: 'سرمایه‌گذاری و مالی',
    accentColor: 'amber',
    desc: 'تحلیل داده‌های آماری، مدل‌سازی ریسک، گزارش‌های تحلیلی بورس و هوش تجاری کسب‌وکار.',
    prompt: 'فرمول‌های کلیدی ارزیابی ریسک اعتباری مشتریان در بانکداری خرد را همراه با تحلیل نسبت‌های مالی تشریح کن.',
    enabled: true,
    order: 6
  }
];

export const DEFAULT_LANDING_GALLERY_SETTINGS = {
  enabled: true,
  badge: 'استودیو تصویرساز هایپررئال',
  title: 'خلق شاهکارهای بصری با پرامپت فارسی',
  subtitle: 'با موتورهای قدرتمند Flux.1 و SDXL تصاویری با رزولوشن 8K و بیشترین جزئیات نوری تولید کنید.'
};

export const DEFAULT_LANDING_GALLERY = [
  {
    id: 'g1',
    src: '/images/gallery/journal-cover.webp',
    title: 'طراحی جلد ژورنال علمی',
    tag: 'انتشارات پژوهشی',
    prompt: 'Minimalist abstract scientific journal cover art, elegant synaptic neural network pathways connecting soft glowing data nodes, deep navy slate and warm gold tones, refined clean scientific illustration, calm and uncluttered'
  },
  {
    id: 'g2',
    src: '/images/gallery/tech-editorial.webp',
    title: 'تصویرسازی سرمقاله فناوری',
    tag: 'مجلات و نشریات',
    prompt: 'Thoughtful conceptual editorial illustration of human cognition merging with AI data streams, elegant geometric architecture, high contrast natural directional lighting, subtle textures, minimal design aesthetic'
  },
  {
    id: 'g3',
    src: '/images/gallery/legal-emblem.webp',
    title: 'تندیس مفهومی حقوق و عدالت',
    tag: 'حقوقی و سازمانی',
    prompt: 'Minimalist modern 3D sculptural emblem of justice balance scales, matte dark stone and brushed gold brass accents, clean minimalist dark studio background, elegant corporate symbol, uncluttered'
  },
  {
    id: 'g4',
    src: '/images/gallery/business-trends.webp',
    title: 'تصویرسازی تحلیل رشد مالی',
    tag: 'گزارش‌های شرکتی',
    prompt: 'Minimalist 3D architectural financial analytics chart, subtle glowing upward curved graph line on dark navy slate pedestal, refined glass milestone cubes, corporate growth indicator, clean studio lighting, uncluttered'
  },
  {
    id: 'g5',
    src: '/images/gallery/academic-book.webp',
    title: 'طراحی جلد کتاب مرجع دانشگاهی',
    tag: 'آموزش عالی',
    prompt: 'Refined modern academic textbook cover art, minimalist abstract geometric composition of intersecting arches and steps representing knowledge and education, warm ivory and rich slate blue, elegant and serene'
  },
  {
    id: 'g6',
    src: '/images/gallery/biotech-dna.webp',
    title: 'تصویرسازی زیست‌فناوری و ژنتیک',
    tag: 'پزشکی و سلامت',
    prompt: 'Clean minimalist 3D medical visualization of a glowing DNA double helix structure, floating in pristine clinical atmosphere with soft cyan and white luminous glow, ultra-clean laboratory background, uncluttered'
  }
];

export const DEFAULT_LANDING_ANALYTICS_SETTINGS = {
  enabled: true,
  badge: 'شفافیت و مدیریت هوشمند',
  title: 'محاسبه دقیق و شفاف مصرف توکن و اعتبار',
  subtitle: 'هزینه واقعی هر پیام و کسر دقیق بر اساس مصرف؛ بدون هزینه‌های پنهان یا اشتراک‌های اجباری.'
};

export const DEFAULT_LANDING_PRICING_HEADER = {
  enabled: true,
  badge: 'TRANSPARENT PRICING',
  title: 'تعرفه‌ها بر اساس تومان و سهمیه توکن',
  subtitle: 'بدون کسر ماهانه خودکار و بدون هزینه‌های مخفی. هر بسته مستقیماً به کیف پول شما اضافه می‌شود و تاریخ انقضا ندارد.',
  customTopupBanner: {
    enabled: true,
    title: 'پلن‌های ثابت مناسب شما نیست؟ شارژ با هر مبلغ دلخواه',
    desc: 'کیف پول خود را به هر میزانی که مایلید (حداقل ۵,۰۰۰ تومان) شارژ کنید و فقط به ازای توکن‌های مصرفی کسر اعتبار شوید.',
    btnText: 'شارژ با مبلغ دلخواه'
  },
  securityNote: {
    creditText: 'شارژ آنی کیف پول بلافاصله پس از پرداخت شتاب',
    gatewayText: 'تسویه امن با درگاه‌های رسمی بانکی شاپرک'
  }
};

export const DEFAULT_LANDING_FAQS_SETTINGS = {
  enabled: true,
  badge: 'پاسخ به سوالات شما',
  title: 'پرسش‌های متداول درباره پلتفرم دستیار هوشمند',
  subtitle: 'همه چیز درباره امنیت، مدل‌ها، شارژ حساب و نحوه استفاده را در اینجا بیابید.'
};

export const DEFAULT_LANDING_FAQS = [
  {
    q: 'تفاوت «دستیار هوشمند» با خرید اکانت‌های دلاری چیست؟',
    a: 'در پلتفرم ما نیازی به پرداخت ارزی (۲۰ دلار در ماه)، پرداخت هزینه کردیت‌کارت واسطه یا نگرانی بابت مسدودسازی اکانت ندارید. شما با ریال پرداخت می‌کنید، به آخرین نسخه پرچمداران جهان دسترسی دارید و تنها به ازای میزان مصرف واقعی‌تان هزینه می‌پردازید.'
  },
  {
    q: 'کدام مدل‌های هوش مصنوعی در این سیستم پشتیبانی می‌شوند؟',
    a: 'جدیدترین نسخه‌های Claude 3.5 Sonnet، GPT-4o و o1-mini از OpenAI، Gemini 2.0 Flash و 1.5 Pro از گوگل، DeepSeek-V3، مدل‌های متن‌باز قدرتمند Qwen 2.5 و Llama 3.3 و همچنین موتورهای تصویرساز هایپررئال Flux.1 و SDXL.'
  },
  {
    q: 'آیا برای استفاده نیاز به فعال‌بودن ابزارهای جانبی یا دور زدن تحریم است؟',
    a: 'خیر. تمامی سرورهای پردازشی پلتفرم در لایه واسط ابری مستقل قرار دارند و کاربران در سراسر ایران بدون هیچ‌گونه افت سرعت و با دسترسی مستقیم از ایران می‌توانند با حداکثر پایداری گفتگو کنند.'
  },
  {
    q: 'آیا اعتبار خریداری‌شده در بسته‌ها تاریخ انقضا دارد؟',
    a: 'خیر. اعتبار حساب شما هرگز منقضی نمی‌شود و تا هر زمانی که توکن‌های بسته مصرف نشوند در کیف پول شما باقی خواهد ماند.'
  },
  {
    q: 'اعتبار هدیه ثبت‌نام چگونه فعال می‌شود؟',
    a: 'بلافاصله پس از ورود با شماره موبایل یا ایمیل، مبلغ ۵۰,۰۰۰ تومان اعتبار اولیه رایگان بدون هیچ قید و شرطی به کیف پول شما اضافه می‌شود تا پیش از خرید، کیفیت تمام مدل‌ها را بررسی کنید.'
  }
];

export const DEFAULT_LANDING_CTA = {
  enabled: true,
  title: 'همین حالا با ۵۰,۰۰۰ تومان هدیه شروع کنید',
  desc: 'ثبت‌نام در کمتر از ۳۰ ثانیه و شروع بدون پرداخت اولیه؛ بلافاصله وارد محیط چت شوید و لذت کار با هوش مصنوعی را تجربه کنید.',
  primaryBtnText: 'ورود به محیط چت',
  primaryBtnLink: '/chat',
  secondaryBtnText: 'مشاهده فروشگاه',
  secondaryBtnLink: '/store',
  theme: 'dark'
};

export const DEFAULT_LANDING_GIFT_CARD = {
  enabled: true,
  title: 'هدیه ثبت‌نام',
  price: 'رایگان',
  badge: 'هدیه بدون قیدوشرط',
  tokenEstimate: '~۱۵۰,۰۰۰ توکن سهمیه',
  messagesCount: 'حدود ۱۵۰ تا ۲۰۰ پیام کامل',
  desc: 'بلافاصله پس از ثبت‌نام به کیف پول شما واریز می‌شود تا قدرت مدل‌ها را آزادانه آزمایش کنید.',
  features: [
    'دسترسی کامل به تمام مدل‌ها',
    'شروع بدون پرداخت اولیه',
    'تحلیل اسناد و جستجوی زنده وب'
  ],
  ctaText: 'شروع با اعتبار هدیه'
};

export const DEFAULT_STORE_DESIGN = {
  heroTitle: 'فروشگاه اشتراک‌ها و ابزارهای هوش مصنوعی',
  heroSubtitle: 'خرید مستقیم لایسنس‌های بین‌المللی، اشتراک‌های پرمیوم و اکانت‌های اختصاصی با تحویل آنی و ضمانت بازگشت وجه.',
  announcementBar: {
    enabled: true,
    text: 'تخفیف ویژه جشنواره بهاره روی تمام اشتراک‌های ماهانه!',
    link: '/store'
  }
};

export const DEFAULT_BLOG_DESIGN = {
  headerTitle: 'مجله تخصصی و آخرین اخبار هوش مصنوعی',
  headerSubtitle: 'تحلیل‌های عمیق، مقالات آموزشی، تازه‌های فناوری و کاربردهای هوش مصنوعی در ایران و جهان.',
  featuredPostId: null,
  trendingTags: ['هوش مصنوعی', 'فناوری', 'آموزش', 'پژوهش', 'کدنویسی', 'سئو']
};

export const DEFAULT_FOOTER_SETTINGS = {
  brandTitle: 'دستیار هوشمند',
  brandDesc: 'پنجره‌ای رو به آینده. همراه هوشمند شما برای خلق، یادگیری و کشف ناشناخته‌ها در دنیای بی‌کران هوش مصنوعی.',
  supportEmail: 'info@dastyarai.com',
  telegramChannel: 'https://t.me/dastyaraigroup/1',
  copyrightText: 'دستیار هوشمند. تمامی حقوق محفوظ است.'
};

// ==========================================
// 2. IN-MEMORY CACHE ENGINE
// ==========================================

let cache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache for public visitors

function getCached(key: string) {
  const item = cache[key];
  if (item && item.expiry > Date.now()) {
    return item.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  cache[key] = { data, expiry: Date.now() + CACHE_TTL_MS };
}

export function clearDesignCache() {
  cache = {};
}

// ==========================================
// 3. READ & WRITE DATABASE HELPERS
// ==========================================

function normalizeAssetPaths(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    return data.replace(/\/images\/professions\/([^."']+)\.(jpg|jpeg|png)/gi, '/images/professions/$1.webp')
               .replace(/\/images\/gallery\/([^."']+)\.(jpg|jpeg|png)/gi, '/images/gallery/$1.webp');
  }
  if (Array.isArray(data)) {
    return data.map(normalizeAssetPaths);
  }
  if (typeof data === 'object') {
    const res: any = {};
    for (const key of Object.keys(data)) {
      res[key] = normalizeAssetPaths(data[key]);
    }
    return res;
  }
  return data;
}

export function getSectionData(sectionKey: string, defaultValue: any) {
  const cached = getCached(sectionKey);
  if (cached) return cached;

  try {
    const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(sectionKey) as any;
    if (row && row.value) {
      try {
        const parsed = JSON.parse(row.value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
          const merged = { ...defaultValue, ...parsed };
          if (sectionKey === 'landing_hero') {
            if (!merged.title || !merged.title.trim()) merged.title = defaultValue.title;
            if (!merged.featurePill || !merged.featurePill.trim()) merged.featurePill = defaultValue.featurePill;
          }
          const normalized = normalizeAssetPaths(merged);
          setCached(sectionKey, normalized);
          return normalized;
        }
        const normalized = normalizeAssetPaths(parsed);
        setCached(sectionKey, normalized);
        return normalized;
      } catch (e) {
        console.warn(`[LandingService] JSON parse error for ${sectionKey}, using fallback:`, e);
      }
    }
  } catch (err) {
    console.error(`[LandingService] DB error reading ${sectionKey}:`, err);
  }

  const normalizedDefault = normalizeAssetPaths(defaultValue);
  setCached(sectionKey, normalizedDefault);
  return normalizedDefault;
}

export function saveSectionData(sectionKey: string, value: any) {
  const stringified = JSON.stringify(value);
  db.prepare('INSERT OR REPLACE INTO site_settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)').run(
    sectionKey,
    stringified
  );
  syncDatabase();
  clearDesignCache();
  return value;
}

export function resetSectionData(sectionKey: string) {
  let defaultVal: any = null;
  if (sectionKey === 'landing_visibility') defaultVal = DEFAULT_LANDING_VISIBILITY;
  else if (sectionKey === 'landing_hero') defaultVal = DEFAULT_LANDING_HERO;
  else if (sectionKey === 'landing_features') defaultVal = DEFAULT_LANDING_FEATURES;
  else if (sectionKey === 'landing_manifesto') defaultVal = DEFAULT_LANDING_MANIFESTO;
  else if (sectionKey === 'landing_professions') defaultVal = DEFAULT_LANDING_PROFESSIONS;
  else if (sectionKey === 'landing_professions_settings') defaultVal = DEFAULT_LANDING_PROFESSIONS_SETTINGS;
  else if (sectionKey === 'landing_gallery') defaultVal = DEFAULT_LANDING_GALLERY;
  else if (sectionKey === 'landing_gallery_settings') defaultVal = DEFAULT_LANDING_GALLERY_SETTINGS;
  else if (sectionKey === 'landing_analytics') defaultVal = DEFAULT_LANDING_ANALYTICS_SETTINGS;
  else if (sectionKey === 'landing_pricing_header') defaultVal = DEFAULT_LANDING_PRICING_HEADER;
  else if (sectionKey === 'landing_faqs') defaultVal = DEFAULT_LANDING_FAQS;
  else if (sectionKey === 'landing_faqs_settings') defaultVal = DEFAULT_LANDING_FAQS_SETTINGS;
  else if (sectionKey === 'landing_cta') defaultVal = DEFAULT_LANDING_CTA;
  else if (sectionKey === 'landing_gift_card') defaultVal = DEFAULT_LANDING_GIFT_CARD;
  else if (sectionKey === 'store_design') defaultVal = DEFAULT_STORE_DESIGN;
  else if (sectionKey === 'blog_design') defaultVal = DEFAULT_BLOG_DESIGN;
  else if (sectionKey === 'footer_settings') defaultVal = DEFAULT_FOOTER_SETTINGS;

  if (defaultVal !== null) {
    saveSectionData(sectionKey, defaultVal);
    return defaultVal;
  }
  return null;
}

export function getFullSiteDesign() {
  return {
    visibility: getSectionData('landing_visibility', DEFAULT_LANDING_VISIBILITY),
    hero: getSectionData('landing_hero', DEFAULT_LANDING_HERO),
    features: getSectionData('landing_features', DEFAULT_LANDING_FEATURES),
    manifesto: getSectionData('landing_manifesto', DEFAULT_LANDING_MANIFESTO),
    professions: getSectionData('landing_professions', DEFAULT_LANDING_PROFESSIONS),
    professionsSettings: getSectionData('landing_professions_settings', DEFAULT_LANDING_PROFESSIONS_SETTINGS),
    gallery: getSectionData('landing_gallery', DEFAULT_LANDING_GALLERY),
    gallerySettings: getSectionData('landing_gallery_settings', DEFAULT_LANDING_GALLERY_SETTINGS),
    analytics: getSectionData('landing_analytics', DEFAULT_LANDING_ANALYTICS_SETTINGS),
    pricingHeader: getSectionData('landing_pricing_header', DEFAULT_LANDING_PRICING_HEADER),
    faqs: getSectionData('landing_faqs', DEFAULT_LANDING_FAQS),
    faqsSettings: getSectionData('landing_faqs_settings', DEFAULT_LANDING_FAQS_SETTINGS),
    cta: getSectionData('landing_cta', DEFAULT_LANDING_CTA),
    giftCard: getSectionData('landing_gift_card', DEFAULT_LANDING_GIFT_CARD),
    store: getSectionData('store_design', DEFAULT_STORE_DESIGN),
    blog: getSectionData('blog_design', DEFAULT_BLOG_DESIGN),
    footer: getSectionData('footer_settings', DEFAULT_FOOTER_SETTINGS)
  };
}
