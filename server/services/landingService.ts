import db, { syncDatabase } from '../db/database.js';

// ==========================================
// 1. DEFAULT FACTORY VALUES (Fallback Data)
// ==========================================

export const DEFAULT_LANDING_MANIFESTO = {
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

export const DEFAULT_LANDING_PROFESSIONS = [
  {
    id: 'academic',
    title: 'دانشجویان، اساتید و پژوهشگران',
    icon: 'GraduationCap',
    image: '/images/professions/academic.jpg',
    badge: 'پژوهش و دانشگاه',
    accentColor: 'amber', // amber, indigo, emerald, purple, slate
    desc: 'تحلیل مقالات ISI، استخراج فصول و ساختار پایان‌نامه، ترجمه تخصصی روان و رفرنس‌دهی علمی.',
    prompt: 'یک ساختار استاندارد ۵ فصلی برای پروپوزال کارشناسی ارشد با موضوع "کاربرد هوش مصنوعی در بهینه‌سازی سیستم‌های مالی" تنظیم کن و فرضیات پژوهش را بنویس.',
    enabled: true,
    order: 1
  },
  {
    id: 'developer',
    title: 'برنامه‌نویسان و مهندسان نرم‌افزار',
    icon: 'Terminal',
    image: '/images/professions/developer.jpg',
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
    image: '/images/professions/content.jpg',
    badge: 'تولید محتوا و سئو',
    accentColor: 'purple',
    desc: 'نگارش مقالات سئوشده ۲,۰۰۰ کلمه‌ای با لحن کاملاً فاخر و روان فارسی، سناریونویسی و ایده‌پردازی تقویم.',
    prompt: 'یک ساختار مقاله جامع ۲۰۰۰ کلمه‌ای سئوشده با تگ‌های H2 و H3 درباره "راهنمای جامع سئو معنایی (Semantic SEO) در سال ۲۰۲۶" تدوین کن.',
    enabled: true,
    order: 3
  },
  {
    id: 'legal',
    title: 'وکلا، کارشناسان حقوقی و مدیران قرارداد',
    icon: 'Scale',
    image: '/images/professions/legal.jpg',
    badge: 'حقوق و قراردادها',
    accentColor: 'amber',
    desc: 'تحلیل بندبه‌بند قراردادهای تجاری و پیمانکاری، کشف تعهدات و ریسک‌های پنهان، و تنظیم پیش‌نویس لوایح رسمی.',
    prompt: 'مهم‌ترین بندهای رفع تعهد و جریمه دیرکرد (Liquidated Damages) را در یک قرارداد توسعه نرم‌افزار همراه با تبصره فورس‌ماژور بنویس.',
    enabled: true,
    order: 4
  },
  {
    id: 'business',
    title: 'مدیران، استارتاپ‌ها و تحلیل‌گران بازار',
    icon: 'TrendingUp',
    image: '/images/professions/business.jpg',
    badge: 'کسب‌وکار و استراتژی',
    accentColor: 'slate',
    desc: 'تحلیل گزارش‌های فروش و اکسل، تدوین طرح کسب‌وکار (Business Plan) و مکاتبات رسمی تجاری.',
    prompt: 'یک ایمیل رسمی و متقاعدکننده به مدیرعامل یک شرکت همکار بنویس و پیشنهاد جلسه استراتژیک برای همکاری تجاری مشترک را مطرح کن.',
    enabled: true,
    order: 5
  },
  {
    id: 'medical',
    title: 'پزشکان، داروسازان و محققان سلامت',
    icon: 'Stethoscope',
    image: '/images/professions/medical.jpg',
    badge: 'پزشکی و سلامت',
    accentColor: 'emerald',
    desc: 'خلاصه‌سازی پژوهش‌های بالینی و ژورنال‌های معتبر، ترجمه دقیق اصطلاحات و تنظیم مطالعات موردی.',
    prompt: 'جدیدترین پروتکل‌های بالینی در مدیریت دیابت نوع ۲ بر اساس استانداردهای ADA را به صورت دسته‌بندی‌شده و خلاصه بالینی شرح بده.',
    enabled: true,
    order: 6
  }
];

export const DEFAULT_LANDING_FAQS = [
  {
    q: 'اعتبار هدیه ۵۰,۰۰۰ تومانی اولیه چیست و چگونه دریافت می‌شود؟',
    a: 'به محض ثبت‌نام اولیه با شماره موبایل یا ایمیل، مبلغ ۵۰,۰۰۰ تومان اعتبار نقدی بلافاصله و به‌صورت خودکار به کیف پول شما شارژ می‌شود. با این اعتبار می‌توانید حدود ۱۵۰ تا ۲۰۰ پیام کامل با بهترین مدل‌های جهان (مانند Claude 3.5 و GPT-4o) ارسال نمایید و سرعت و هوش سیستم را بدون پرداخت هیچ هزینه‌ای بسنجید.'
  },
  {
    q: 'تفاوت سیستم پرداخت بر اساس مصرف واقعی (Pay-As-You-Go) با خرید اکانت‌های دلاری چیست؟',
    a: 'در خرید اشتراک‌های ماهانه خارجی، کاربر باید ماهیانه بیش از ۲۰ دلار (حدود ۱ میلیون و ۸۰۰ هزار تومان) پرداخت کند و با خطر مسدود شدن اکانت و دردسر فیلترشکن روبه‌رو است. در دستیار هوشمند، نیازی به پرداخت ماهانه سنگین نیست؛ با کارت بانکی شتاب حساب خود را شارژ می‌کنید و به ازای هر پیام، فقط هزینه چند تک‌تومانی توکن‌های ورودی و خروجی کسر می‌گردد. این اعتبار هیچ‌گاه منقضی نمی‌شود.'
  },
  {
    q: 'آیا برای اتصال به دستیار هوشمند نیاز به فیلترشکن (VPN) است؟',
    a: 'خیر، به هیچ وجه. تمامی زیرساخت‌ها، سرورهای واسط و درگاه‌های پردازشی سیستم در ایران و لبه‌های شبکه پرسرعت داخلی بدون نیاز به فعال‌سازی هرگونه VPN در دسترس است و بدون قطعی و با پینگ تک‌رقمی پاسخ‌ها را دریافت می‌کنید.'
  },
  {
    q: 'آیا برای برنامه‌نویسی و کارهای سنگین دانشگاهی مناسب است؟',
    a: 'قطعاً. دستیار هوشمند به مدل‌های قدرتمند استدلالی دسترسی دارد و با درک بیش از ۳۰ زبان برنامه‌نویسی و امکان تحلیل مقالات دانشگاهی لاتین و فارسی، دستیاری تخصصی برای پژوهشگران، مهندسان نرم‌افزار و دانشجویان است.'
  },
  {
    q: 'استودیوی تصویرساز چگونه کار می‌کند و آیا زبان فارسی را می‌فهمد؟',
    a: 'بله، کاملاً. شما می‌توانید توصیف خود از تصویر مورد نظرتان را به زبان شیرین فارسی بنویسید. سیستم ابتدا پرامپت شما را از نظر هنری، زاویه دوربین، نورپردازی و رزولوشن غنی‌سازی کرده و سپس با موتورهای پیشرفته تصویرسازی، تصاویر هایپررئال خلق می‌کند.'
  },
  {
    q: 'حریم خصوصی و امنیت گفتگوها چگونه تضمین می‌شود؟',
    a: 'تمامی تبادلات اطلاعاتی از طریق پروتکل رمزنگاری پیشرفته SSL صورت می‌پذیرد. تاریخچه گفتگوها در فضای امن ذخیره شده و به هیچ عنوان در اختیار اشخاص یا سازمان‌های ثالث قرار نمی‌گیرد و برای آموزش مدل‌های عمومی استفاده نمی‌شود.'
  },
  {
    q: 'نحوه شارژ حساب و درگاه‌های پرداخت چگونه است؟',
    a: 'شارژ حساب با تمام کارت‌های عضو شتاب از طریق درگاه‌های پرداخت معتبر شاپرکی امکان‌پذیر است. موجودی بلافاصله پس از پرداخت به کیف پول کاربر اضافه شده و صورت‌حساب دقیق و شفاف هر تراکنش در بخش مالی و داشبورد کاربری در دسترس است.'
  }
];

export const DEFAULT_STORE_DESIGN = {
  heroTitle: 'فروشگاه اشتراک و لایسنس‌های اختصاصی هوش مصنوعی',
  heroSubtitle: 'خرید مستقیم و آنی اکانت‌های پریمیوم ChatGPT Plus، Claude Pro، Midjourney و ابزارهای پرچم‌دار با تحویل خودکار و پشتیبانی تضمینی.',
  announcementBar: {
    enabled: true,
    text: '🎁 به مناسبت ارتقای سرورها: تمامی بسته‌ها شامل شارژ هدیه ویژه و پشتیبانی فوری تلگرام می‌باشند.',
    link: '/store'
  }
};

export const DEFAULT_BLOG_DESIGN = {
  headerTitle: 'مجله تخصصی و آخرین اخبار هوش مصنوعی',
  headerSubtitle: 'تحلیل‌های عمیق، مقالات آموزشی، تازه‌های فناوری و کاربردهای هوش مصنوعی در ایران و جهان.',
  featuredPostId: null, // If set, this article is featured at top
  trendingTags: ['هوش مصنوعی', 'فناوری', 'آموزش', 'پژوهش', 'کدنویسی', 'سئو']
};

export const DEFAULT_LANDING_CTA = {
  title: 'همین حالا با ۵۰,۰۰۰ تومان هدیه شروع کنید',
  desc: 'ثبت‌نام در کمتر از ۳۰ ثانیه بدون نیاز به وارد کردن کارت بانکی؛ بلافاصله وارد محیط چت شوید و لذت کار با برترین مدل‌های جهان را تجربه کنید.',
  primaryBtnText: 'ورود به محیط چت',
  primaryBtnLink: '/chat',
  secondaryBtnText: 'مشاهده فروشگاه',
  secondaryBtnLink: '/store',
  theme: 'dark' // dark, white, indigo, slate, emerald
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
    'بدون نیاز به کارت بانکی',
    'تحلیل اسناد و جستجوی زنده وب'
  ],
  ctaText: 'شروع با اعتبار هدیه'
};

export const DEFAULT_LANDING_HERO = {
  featurePill: '۵۰,۰۰۰ تومان اعتبار نقدی هدیه | بدون نیاز به فیلترشکن و پرداخت ریالی',
  title: 'دسترسی مستقیم و بدون واسطه به برترین هوش‌های مصنوعی جهان',
  subtitle: 'بدون نیاز به خرید اشتراک‌های ماهانه دلاری یا دغدغه فیلترشکن؛ با پرچمداران Claude 3.5، GPT-4o و Gemini به فارسی گفتگو کنید و هزینه را به اندازه مصرف واقعی به تومان بپردازید.',
  primaryBtnText: 'شروع گفتگو با ۵۰ هزار تومان هدیه',
  primaryBtnLink: '/chat',
  secondaryBtnText: 'مشاهده بسته‌ها و تعرفه‌ها',
  secondaryBtnLink: '#pricing',
  demoScenarios: [
    {
      id: 'contract',
      label: 'نگارش حقوقی و اداری',
      icon: 'FileText',
      model: 'Claude 3.5 Sonnet',
      modelBadge: 'ادبی و رسمی',
      userPrompt: 'یک ساختار استاندارد ۵ فصلی برای پروپوزال کارشناسی ارشد با موضوع "کاربرد هوش مصنوعی در بهینه‌سازی سیستم‌های مالی" تنظیم کن و فرضیات پژوهش را بنویس.',
      aiResponse: 'عنوان پیشنهادی پایان‌نامه:\nطراحی الگوریتم ترکیبی هوش مصنوعی در مدیریت ریسک سبد سرمایه‌گذاری...\n\nفصل ۱: کلیات تحقیق و بیان مسئله\nفصل ۲: ادبیات نظری و پیشینه پژوهش‌های بین‌المللی\nفصل ۳: روش‌شناسی و متدولوژی مدل یادگیری عمیق\nفصل ۴: تحلیل تجربی و شبیه‌سازی داده‌های واقعی\nفصل ۵: نتیجه‌گیری، بحث و پیشنهادات کاربردی'
    },
    {
      id: 'developer',
      label: 'برنامه‌نویسی و مهندسی',
      icon: 'Terminal',
      model: 'GPT-4o (OpenAI)',
      modelBadge: 'کدنویسی عمیق',
      userPrompt: 'یک کامپوننت React با تایپ‌اسکریپت برای پیاده‌سازی Infinite Scroll بنویس که با Intersection Observer کار کند و مدیریت خطای شبکه داشته باشد.',
      aiResponse: 'import React, { useEffect, useRef, useState } from "react";\n\nexport const InfiniteList: React.FC<{ fetchMore: () => Promise<void> }> = ({ fetchMore }) => {\n  const loaderRef = useRef<HTMLDivElement>(null);\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    const observer = new IntersectionObserver(async (entries) => {\n      if (entries[0].isIntersecting && !loading) {\n        setLoading(true);\n        await fetchMore();\n        setLoading(false);\n      }\n    }, { threshold: 0.8 });\n\n    if (loaderRef.current) observer.observe(loaderRef.current);\n    return () => observer.disconnect();\n  }, [fetchMore, loading]);\n\n  return <div ref={loaderRef}>{loading ? "در حال دریافت..." : null}</div>;\n};'
    },
    {
      id: 'academic',
      label: 'پژوهش و دانشگاه',
      icon: 'GraduationCap',
      model: 'Gemini 2.0 Flash',
      modelBadge: 'فوق سریع و تحلیلی',
      userPrompt: 'مهم‌ترین نوآوری‌های مقاله توجه همه آن چیزی است که نیاز دارید (Attention Is All You Need) را در ۳ پاراگراف کوتاه خلاصه کن.',
      aiResponse: '۱. حذف ساختار بازگشتی (Recurrent): این مقاله با جایگزینی شبکه‌های RNN با مکانیزم توجه چندسره (Multi-Head Self-Attention)، پردازش موازی کل توالی را ممکن ساخت.\n\n۲. سرعت آموزش فوق‌العاده: موازی‌سازی باعث شد زمان آموزش مدل‌ها نسبت به ساختارهای ترتیبی پیشین تا ۱۰ برابر کاهش یابد.\n\n۳. مقیاس‌پذیری عظیم: این معماری زیربنای مدل‌های بزرگ زبانی امروزی از جمله GPT، Claude و Gemini شد.'
    },
    {
      id: 'content',
      label: 'تولید محتوا و سئو',
      icon: 'PenTool',
      model: 'DeepSeek-V3',
      modelBadge: 'استدلال پیشرفته',
      userPrompt: 'یک ساختار مقاله جامع ۲۰۰۰ کلمه‌ای سئوشده با تگ‌های H2 و H3 درباره "راهنمای جامع سئو معنایی در سال ۲۰۲۶" تدوین کن.',
      aiResponse: 'H1: راهنمای جامع سئو معنایی (Semantic SEO) در سال ۲۰۲۶: استراتژی رتبه‌بندی با هوش مصنوعی\n\n- H2: سئو معنایی چیست و چرا موتورهای جستجو به آن تکیه می‌کنند؟\n  - H3: تفاوت تطابق کلیدواژه‌ای سنتی با درک معنایی مفاهیم\n  - H3: گراف دانش (Knowledge Graph) گوگل چگونه کار می‌کند؟\n\n- H2: ۴ گام عملی برای پیاده‌سازی سئو معنایی در محتوای فارسی\n  - H3: کلاسترینگ موضوعی (Topic Clusters) و پیلار پیج‌ها\n  - H3: بهینه‌سازی برای جستجوی صوتی و مکالمه‌ای هوش مصنوعی'
    }
  ]
};

export const DEFAULT_LANDING_GALLERY = [
  {
    id: 'g1',
    src: '/images/gallery/journal-cover.jpg',
    title: 'طراحی جلد ژورنال علمی',
    tag: 'انتشارات پژوهشی',
    prompt: 'Minimalist abstract scientific journal cover art, elegant synaptic neural network pathways connecting soft glowing data nodes, deep navy slate and warm gold tones, refined clean scientific illustration, calm and uncluttered'
  },
  {
    id: 'g2',
    src: '/images/gallery/tech-editorial.jpg',
    title: 'تصویر شاخص وبلاگ فناوری',
    tag: 'سئو و تولید محتوا',
    prompt: 'Clean modern isometric editorial tech blog illustration, minimalist floating geometric cubes and digital paper workflow diagrams, matte titanium finish, soft diffused studio light, uncluttered, professional aesthetic'
  },
  {
    id: 'g3',
    src: '/images/gallery/legal-emblem.jpg',
    title: 'تندیس مفهومی حقوق و عدالت',
    tag: 'حقوقی و سازمانی',
    prompt: 'Minimalist modern 3D sculptural emblem of justice balance scales, matte dark stone and brushed gold brass accents, clean minimalist dark studio background, elegant corporate symbol, uncluttered'
  },
  {
    id: 'g4',
    src: '/images/gallery/business-trends.jpg',
    title: 'تصویرسازی تحلیل رشد مالی',
    tag: 'گزارش‌های شرکتی',
    prompt: 'Minimalist 3D architectural financial analytics chart, subtle glowing upward curved graph line on dark navy slate pedestal, refined glass milestone cubes, corporate growth indicator, clean studio lighting, uncluttered'
  },
  {
    id: 'g5',
    src: '/images/gallery/academic-book.jpg',
    title: 'طراحی جلد کتاب مرجع دانشگاهی',
    tag: 'آموزش عالی',
    prompt: 'Refined modern academic textbook cover art, minimalist abstract geometric composition of intersecting arches and steps representing knowledge and education, warm ivory and rich slate blue, elegant and serene'
  },
  {
    id: 'g6',
    src: '/images/gallery/biotech-nature.jpg',
    title: 'تصویرسازی تلفیق طبیعت و بیوتکنولوژی',
    tag: 'محیط زیست و سلامت',
    prompt: 'Hyperrealistic botanical science visual, transparent glass plant cell structures infused with micro-circuitry, soft morning natural sunlight, deep emerald moss background, pristine scientific clarity'
  }
];

export const DEFAULT_LANDING_PRICING_HEADER = {
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

export const DEFAULT_FOOTER_SETTINGS = {
  brandTitle: 'دستیار هوشمند',
  brandDesc: 'پنجره‌ای رو به آینده. همراه هوشمند شما برای خلق، یادگیری و کشف ناشناخته‌ها در دنیای بی‌کران هوش مصنوعی.',
  supportEmail: 'support@dastyarai.com',
  telegramChannel: 'https://t.me/dastyarai',
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

export function getSectionData(sectionKey: string, defaultValue: any) {
  const cached = getCached(sectionKey);
  if (cached) return cached;

  try {
    const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(sectionKey) as any;
    if (row && row.value) {
      try {
        const parsed = JSON.parse(row.value);
        setCached(sectionKey, parsed);
        return parsed;
      } catch (e) {
        console.warn(`[LandingService] JSON parse error for ${sectionKey}, using fallback:`, e);
      }
    }
  } catch (err) {
    console.error(`[LandingService] DB error reading ${sectionKey}:`, err);
  }

  setCached(sectionKey, defaultValue);
  return defaultValue;
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
  if (sectionKey === 'landing_hero') defaultVal = DEFAULT_LANDING_HERO;
  else if (sectionKey === 'landing_manifesto') defaultVal = DEFAULT_LANDING_MANIFESTO;
  else if (sectionKey === 'landing_professions') defaultVal = DEFAULT_LANDING_PROFESSIONS;
  else if (sectionKey === 'landing_gallery') defaultVal = DEFAULT_LANDING_GALLERY;
  else if (sectionKey === 'landing_pricing_header') defaultVal = DEFAULT_LANDING_PRICING_HEADER;
  else if (sectionKey === 'landing_faqs') defaultVal = DEFAULT_LANDING_FAQS;
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
    hero: getSectionData('landing_hero', DEFAULT_LANDING_HERO),
    manifesto: getSectionData('landing_manifesto', DEFAULT_LANDING_MANIFESTO),
    professions: getSectionData('landing_professions', DEFAULT_LANDING_PROFESSIONS),
    gallery: getSectionData('landing_gallery', DEFAULT_LANDING_GALLERY),
    pricingHeader: getSectionData('landing_pricing_header', DEFAULT_LANDING_PRICING_HEADER),
    faqs: getSectionData('landing_faqs', DEFAULT_LANDING_FAQS),
    cta: getSectionData('landing_cta', DEFAULT_LANDING_CTA),
    giftCard: getSectionData('landing_gift_card', DEFAULT_LANDING_GIFT_CARD),
    store: getSectionData('store_design', DEFAULT_STORE_DESIGN),
    blog: getSectionData('blog_design', DEFAULT_BLOG_DESIGN),
    footer: getSectionData('footer_settings', DEFAULT_FOOTER_SETTINGS)
  };
}
