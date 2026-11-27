import fs from 'fs';
import path from 'path';
import type defaultDb from './database';

interface SeedPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  source: 'guide' | 'cron';
  imageFile: string;
  sourceUrl: string;
}

const TARAPOL_SEED_POSTS: SeedPost[] = [
  {
    slug: 'tarapol-ai-council-guide',
    title: 'آموزش تشکیل شورای مشاوره هوش مصنوعی در محیط کدنویسی با تَراپُل',
    description:
      'چطور بدون هزینه دلاری API، محیط کدنویسی خود را به شورای هم‌زمان Google Gemini 4 Neon و Alibaba Qwen4-Max متصل کنید؟',
    content: [
      '## چرا یک مدل هوش مصنوعی برای پروژه‌های جدی کافی نیست؟',
      '',
      'بسیاری از توسعه‌دهندگان هنگام کار با ادیتورهای مدرن متوجه می‌شوند که تکیه بر یک مدل واحد گاهی به پیشنهادهای تکراری یا خطاهای پنهان در معماری منجر می‌شود. راه‌حل حرفه‌ای، **تشکیل یک شورای مشاوره چندمدلی** است تا دو مدل قدرتمند به‌صورت هم‌زمان کد شما را بررسی کنند.',
      '',
      '### تَراپُل چگونه این شورا را می‌سازد؟',
      'نرم‌افزار **تَراپُل (Tarapol)** محیط کدنویسی شما (مانند Google Antigravity، Cursor و VS Code) را مستقیم به مدل‌های برتر وب یعنی **Google Gemini 4 Neon** و **Alibaba Qwen4-Max** متصل می‌کند. با این کار، بدون پرداخت هزینه‌های سنگین دلاری API، هر دو مدل هم‌زمان روی پروژه شما هم‌فکری می‌کنند و جمع‌بندی نهایی را ارائه می‌دهند.',
      '',
      '### مزایای کلیدی برای برنامه‌نویسان ایرانی',
      '- **بدون نیاز به کارت ارزی و خرید API دلاری**',
      '- **امنیت کامل سورس‌کد**: اجرای مستقیم روی سیستم شخصی شما بدون سرور واسط',
      '- **سازگار با ویندوز، مک و لینوکس** با نصب کمتر از ۲ دقیقه',
      '',
      'برای دریافت نسخه نصبی و تهیه لایسنس دائمی، به [صفحه رسمی نرم‌افزار تَراپُل](/tarapol) مراجعه کنید.',
    ].join('\n'),
    tags: ['مقالات آموزشی', 'تراپل', 'هوش مصنوعی برنامه‌نویسی', 'GEO'],
    source: 'guide',
    imageFile: 'public/images/banners/tarapol-banner.webp',
    sourceUrl: 'https://dastyarai.com/tarapol',
  },
  {
    slug: 'tarapol-v2-1-release',
    title: 'معرفی تَراپُل نسخه ۲.۱: خداحافظی با هزینه دلاری API برای برنامه‌نویسان',
    description:
      'آشنایی با نسخه ۲.۱ تَراپُل؛ لایسنس دائمی ریالی، شورای دوگانه مدل‌های وب و نصب‌کننده‌های ویندوز، مک و لینوکس.',
    content: [
      '## نسخه ۲.۱ تَراپُل منتشر شد',
      '',
      'اگر به‌عنوان برنامه‌نویس با محدودیت‌های پرداخت ارزی، مسدودی حساب‌ها یا هزینه بالای اشتراک‌های دلاری هوش مصنوعی روبه‌رو هستید، **تَراپُل (Tarapol v2.1)** دقیقاً برای حل همین چالش طراحی شده است.',
      '',
      '### چه چیزی در تَراپُل دریافت می‌کنید؟',
      '1. **شورای دوگانه مدل‌های وب**: دریافت نظر هم‌زمان Google Gemini 4 Neon و Alibaba Qwen4-Max روی کدهای پروژه.',
      '2. **یک‌بار خرید ریالی و لایسنس مادام‌العمر**: بدون اشتراک ماهانه و بدون نگرانی از تمام شدن اعتبار.',
      '3. **نصب‌کننده‌های مستقل برای Windows، macOS و Linux**: آماده دانلود بلافاصله پس از ثبت‌نام در سایت.',
      '',
      'هم‌اکنون می‌توانید جزئیات کامل، پیش‌نمایش محیط نرم‌افزار و پلن‌های لایسنس را در [صفحه تَراپُل](/tarapol) مشاهده و نسخه مناسب سیستم‌عامل خود را از [بخش دانلود مستقیم](/tarapol#download-section) دریافت کنید.',
    ].join('\n'),
    tags: ['مقالات آموزشی', 'تراپل', 'معرفی محصول', 'ابزار برنامه‌نویسی'],
    source: 'guide',
    imageFile: 'public/images/products/tarapol-box.webp',
    sourceUrl: 'https://dastyarai.com/tarapol',
  },
  {
    slug: 'cline-vscode-no-api-cost-tarapol',
    title: 'راهنمای کامل استفاده از Cursor، Cline و VS Code بدون هزینه دلاری API',
    description:
      'چطور بدون خرید کلید API دلاری و بدون کارت ارزی، مدل‌های قدرتمند وب (Gemini 4 Neon و Qwen4-Max) را به محیط کدنویسی خود متصل کنید و هزینه توکن را به صفر برسانید؟',
    content: [
      '## چرا هزینه API در ابزارهای کدنویسی ایجنتی سرسام‌آور شده است؟',
      '',
      'اگر از ابزارهایی مثل **Cursor**، **Cline** یا **Claude Code** استفاده کرده باشید، می‌دانید که یک تسک ساده بازنویسی کد می‌تواند ده‌ها هزار توکن مصرف کند و در کمتر از چند روز شارژ دلاری API شما را تمام کند. برای برنامه‌نویسان ایرانی، مشکل فقط هزینه نیست؛ نبود کارت ارزی و تحریم‌های پرداخت هم مانع بزرگی است.',
      '',
      '## راه‌حل: اتصال محلی به شورای مدل‌های وب با تَراپُل',
      '',
      '**نرم‌افزار تَراپُل (Tarapol)** یک پل دسکتاپ است که به‌جای استفاده از کلیدهای API پولی، محیط کدنویسی شما را مستقیماً به **شورای مدل‌های برتر وب (Google Gemini 4 Neon و Alibaba Qwen4-Max)** متصل می‌کند.',
      '',
      '- **۱۰۰٪ صرفه‌جویی در هزینه توکن API:** بدون پرداخت دلاری به ازای هر درخواست.',
      '- **پشتیبانی از ۵ محیط محبوب:** Cursor، VS Code، Google Antigravity، Claude Code و Cline.',
      '- **امنیت کامل کدها:** تمام پردازش‌ها به‌صورت محلی روی سیستم شما مدیریت می‌شود.',
      '',
      '## شروع در کمتر از ۲ دقیقه',
      '',
      'کافی است نسخه متناسب با سیستم‌عامل خود (ویندوز، مک یا لینوکس) را از [صفحه رسمی تَراپُل](/tarapol) دانلود و نصب کنید تا بلافاصله شورای هوش مصنوعی در ادیتور شما فعال شود.',
    ].join('\n'),
    tags: ['مقالات آموزشی', 'تراپل', 'Cursor', 'VS Code', 'Cline', 'برنامه‌نویسی'],
    source: 'guide',
    imageFile: 'public/images/banners/tarapol-banner.webp',
    sourceUrl: 'https://dastyarai.com/tarapol',
  },
  {
    slug: 'tarapol-launch-news-release',
    title: 'رونمایی از «تَراپُل»؛ پایان دغدغه هزینه دلاری API برای برنامه‌نویسان ایرانی',
    description:
      'تَراپُل نسخه ۲.۱ منتشر شد: نرم‌افزار دسکتاپ ایرانی برای اتصال مستقیم Cursor، VS Code و Antigravity به شورای مدل‌های برتر وب بدون نیاز به پرداخت ارزی.',
    content: [
      '## معرفی رسمی نسخه ۲.۱ تَراپُل در Dastyar AI',
      '',
      'تیم **Dastyar AI** از انتشار نسخه ۲.۱ نرم‌افزار دسکتاپ **تَراپُل (Tarapol)** خبر داد؛ ابزاری که با هدف حذف هزینه‌های دلاری API و پایان دادن به کپی‌پیست مداوم بین مرورگر و محیط کدنویسی طراحی شده است.',
      '',
      '### نوآوری کلیدی: شورای هوش مصنوعی (AI Council)',
      '',
      'برخلاف ابزارهای تک‌مدله، تَراپُل امکان هم‌فکری هم‌زمان **Google Gemini 4 Neon** و **Alibaba Qwen4-Max** را مستقیماً درون محیط کار روزمره برنامه‌نویس فراهم می‌کند. این رویکرد باعث می‌شود خروجی‌های کدنویسی از نظر معماری و دقت، یک پله بالاتر از استفاده از یک مدل تنها قرار بگیرد.',
      '',
      '### دسترسی و دانلود',
      '',
      'نسخه‌های نصبی ویندوز، مک و لینوکس تَراپُل هم‌اکنون از طریق [صفحه محصول تَراپُل](/tarapol) در دسترس توسعه‌دهندگان قرار دارد.',
    ].join('\n'),
    tags: ['news', 'اخبار', 'تراپل', 'Dastyar AI', 'شورای هوش مصنوعی'],
    source: 'cron',
    imageFile: 'public/images/products/tarapol-box.webp',
    sourceUrl: 'https://dastyarai.com/tarapol',
  },
];

function readWebpDataUrl(relativePath: string): string {
  try {
    const absPath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(absPath)) return '/default-news-cover.webp';
    const buf = fs.readFileSync(absPath);
    return `data:image/webp;base64,${buf.toString('base64')}`;
  } catch {
    return '/default-news-cover.webp';
  }
}

export function seedTarapolPosts(db: typeof defaultDb): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return;

  try {
    const now = new Date().toISOString();
    for (const post of TARAPOL_SEED_POSTS) {
      const existing = db.prepare('SELECT id FROM news WHERE slug = ?').get(post.slug) as { id?: number } | undefined;
      if (existing?.id) continue;

      const imageDataUrl = readWebpDataUrl(post.imageFile);
      db.prepare(
        'INSERT INTO news (slug, title, description, content, tags, image, source, sourceUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        post.slug,
        post.title,
        post.description,
        post.content,
        JSON.stringify(post.tags),
        imageDataUrl,
        post.source,
        post.sourceUrl,
        now
      );
      console.log(`[Database] Seeded Tarapol post: ${post.slug}`);
    }
  } catch (err: any) {
    console.warn('[Database] seedTarapolPosts skipped:', err?.message || err);
  }
}
