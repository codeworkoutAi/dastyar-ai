/**
 * Landing Page Content Configuration
 * All hardcoded content extracted from LandingPage.tsx for centralized management
 * Compatible with Admin CMS for dynamic content overrides
 */

// ============================================================================
// SECTION: Hero Section
// ============================================================================
export const landingHeroConfig = {
  enabled: true,
  featurePill: 'پلتفرم جامع هوش مصنوعی فارسی',
  title: 'دسترسی مستقیم و بدون واسطه به <br className="hidden sm:inline" /><span className="text-[#2563eb] dark:text-white">برترین هوش‌های مصنوعی</span> جهان',
  subtitle: 'بدون نیاز به خرید اشتراک‌های ماهانه دلاری یا دغدغه فیلترشکن؛ با پرچمداران Claude 3.5، GPT-4o و Gemini به فارسی گفتگو کنید و هزینه را به اندازه مصرف واقعی به تومان بپردازید.',
  bannerTitle: 'یک کلید برای تمام پرچمداران جهان',
  bannerSubtitle: 'بدون نیاز به ده‌ها اکانت ارزی. پلتفرم ما جامع‌ترین درگاه را با پشتیبانی کامل از تمامی مدل‌های قدرتمند هوش مصنوعی در اختیار شما قرار می‌دهد.',
  bannerBtnText: 'شروع',
  bannerBtnLink: '/chat',
  models: [
{
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'پرچم‌دار همه‌کاره',
      color: '#10a37f',
      icon: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A6.0651 6.0651 0 0 0 19.0192 19.818a5.9847 5.9847 0 0 0 3.9977-2.9 6.0462 6.0462 0 0 0-.735-7.0968zM8.7505 18.2588a4.5078 4.5078 0 0 1-2.4828-4.2238l.0047-.1165 4.5492 2.627v5.253a4.5204 4.5204 0 0 1-2.0711-3.5397zm-3.518-7.9044a4.5078 4.5078 0 0 1 1.0506-4.739 4.4962 4.4962 0 0 1 3.5332-1.2828L5.2671 6.959v5.254l-4.5492-2.6264zm10.0526-7.234a4.5078 4.5078 0 0 1 4.2238 2.4828 4.4962 4.4962 0 0 1-.225 3.7388L14.7347 6.716 10.1855 4.089v-5.253a4.5078 4.5078 0 0 1 5.1016 1.8344zm3.4897 7.9044a4.5078 4.5078 0 0 1-1.0506 4.739 4.4962 4.4962 0 0 1-3.5332 1.2828l4.5492-2.6264V9.022l4.5492 2.6264zm-10.0526 7.234a4.5078 4.5078 0 0 1-4.2238-2.4828 4.4962 4.4962 0 0 1 .225-3.7388L9.2653 17.284 13.8145 19.911v5.253a4.5078 4.5078 0 0 1-5.1016-1.8344zm3.4897 7.9044a4.5078 4.5078 0 0 1-4.2238-2.4828 4.4962 4.4962 0 0 1 .225-3.7388L9.2653 17.284 13.8145 19.911v5.253a4.5078 4.5078 0 0 1-5.1016-1.8344zm-10.0526 7.234a4.5078 4.5078 0 0 1-4.2238-2.4828 4.4962 4.4962 0 0 1 .225-3.7388L9.2653 17.284 13.8145 19.911v5.253a4.5078 4.5078 0 0 1-5.1016-1.8344zm-10.0526 7.234a4.5078 4.5078 0 0 1-4.2238-2.4828 4.4962 4.4962 0 0 1 .225-3.7388L9.2653 17.284 13.8145 19.911v5.253a4.5078 4.5078 0 0 1-5.1016-1.8344z'
    },
    {
      id: 'claude-3.5',
      name: 'Claude 3.5',
      provider: 'Anthropic',
      description: 'استاد نگارش و ادبیات',
      color: '#d97757',
      icon: 'M18.8 20.5H22L12 3H8.8L-0 20.5H3.2L12 4.6L18.8 20.5ZM12.2 16.5H15.4L13.8 13.3L12.2 16.5Z'
    },
    {
      id: 'gemini-2.0',
      name: 'Gemini 2.0',
      provider: 'Google',
      description: 'تحلیل چندرسانه‌ای و سرعت',
      color: '#4285f4',
      icon: 'M12.025 24C12.025 17.5 17.5 12.025 24 12.025C17.5 12.025 12.025 6.5 12.025 0C12.025 6.5 6.5 12.025 0 12.025C6.5 12.025 12.025 17.5 12.025 24Z'
    },
    {
      id: 'flux-8k',
      name: 'Flux 8K',
      provider: 'Black Forest',
      description: 'موتور گرافیکی هایپررئال',
      color: '#ec4899',
      icon: 'M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM15 11H11V15H9V11H7V9H9V7H11V9H15V11Z'
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      description: 'کدنویسی و استدلال',
      color: '#2563eb',
      icon: 'M12 21.5c-5.238 0-9.5-4.262-9.5-9.5S6.762 2.5 12 2.5s9.5 4.262 9.5 9.5-4.262 9.5-9.5 9.5zm0-17C7.86 4.5 4.5 7.86 4.5 12s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zM12 17c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z'
    }
  ],
  };

// ============================================================================
// SECTION: Features (Bento Grid)
// ============================================================================
export const landingFeaturesConfig = {
  enabled: true,
  title: 'امکانات پیشرفته و قابلیت‌های اصلی',
  subtitle: 'تمام نیازمندی‌های حرفه‌ای هوش مصنوعی از ترجمه و نگارش تا کدنویسی و تولید تصویر در یک سیستم یکپارچه.',
  cards: [
    {
      id: 'multi-model',
      title: 'دسترسی همزمان به برترین مدل‌های جهان',
      subtitle: 'سوییچ آسان میان Claude 3.5 Sonnet، GPT-4o، Google Gemini 2.0 و DeepSeek-V3. با قابلیت سوییچ هوشمند، سیستم به طور خودکار نوع سوال شما را تشخیص داده و کار را به خبره‌ترین مدل واگذار می‌کند.',
      icon: 'Cpu',
      badge: 'مدل‌های پرچمدار',
      models: [
        { name: 'Claude 3.5', subtitle: 'استاد نگارش و ادبیات', color: 'indigo' },
        { name: 'GPT-4o', subtitle: 'پرچم‌دار همه‌کاره', color: 'charcoal' },
        { name: 'Gemini 2.0', subtitle: 'تحلیل چندرسانه‌ای و سرعت', color: 'gold-noglow' },
        { name: 'DeepSeek V3', subtitle: 'کدنویسی و استدلال', color: 'rose-noglow' }
      ]
    },
    {
      id: 'no-vpn',
      title: 'بدون فیلترشکن و پرداخت ریالی',
      subtitle: 'بدون نیاز به ویزاکارت یا نگرانی از قطع شدن ارتباط؛ با کلیه کارت‌های عضو شتاب کیف پول خود را شارژ کنید و فقط به اندازه مصرف کلمات هزینه بپردازند.',
      icon: 'ShieldCheck',
      badge: 'پرداخت شتاب',
      features: ['بدون فیلترشکن', 'پرداخت ریالی', 'اعتبار منقضی نمی‌شود']
    },
    {
      id: 'doc-analysis',
      title: 'تحلیل اسناد و فایل‌های سنگین',
      subtitle: 'آپلود مستقیم کتاب‌ها و مقالات علمی PDF تا سقف ۵۰ مگابایت، فایل‌های کدنویسی و فایل‌های اکسل جهت تلخیص، استخراج اطلاعات و پرسش و پاسخ.',
      icon: 'FileText',
      badge: 'تحلیل اسناد',
      features: ['PDF تا ۵۰ مگابایت', 'کدهای برنامه‌نویسی', 'فایل‌های اکسل', 'تلخیص و تحلیل']
    },
    {
      id: 'image-studio',
      title: 'استودیوی تصویرساز هایپررئال با زبان فارسی',
      subtitle: 'ایده‌ها و توصیف‌های خود را به زبان فارسی بنویسید؛ سیستم پرامپت شما را از نظر هنری و نورپردازی بهینه نموده و با موتورهای پیشرفته Flux تصاویری با وضوح ۸K تحویل می‌دهد.',
      icon: 'ImageIcon',
      badge: 'استودیو تصویر',
      features: ['پرامپت فارسی', 'موتور Flux', 'رایزولوشن ۸K', 'نورپردازی هنری']
    }
  ]
};

// ============================================================================
// SECTION: Manifesto
// ============================================================================
export const landingManifestoConfig = {
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

// ============================================================================
// SECTION: Professions & Prompts
// ============================================================================
export const landingProfessionsConfig = {
  enabled: true,
  badge: 'TARGET AUDIENCE & USE CASES',
  title: 'دستیار هوشمند؛ همراه تخصصی کدام حرفه‌هاست؟',
  subtitle: 'برای هر تخصص، یک پرامپت آماده طراحی شده است؛ کافیست کلیک کنید تا پاسخ آن را مستقیماً در چت‌باکس بسنجید.',
  cards: [
    {
      id: 'academic',
      title: 'دانشجویان، اساتید و پژوهشگران',
      icon: 'GraduationCap',
      image: '/images/professions/academic.jpg',
      badge: 'پژوهش و دانشگاه',
      desc: 'تحلیل مقالات ISI، استخراج فصول و ساختار پایان‌نامه، ترجمه تخصصی روان و رفرنس‌دهی علمی.',
      prompt: 'یک ساختار استاندارد ۵ فصلی برای پروپوزال کارشناسی ارشد با موضوع "کاربرد هوش مصنوعی در بهینه‌سازی سیستم‌های مالی" تنظیم کن و فرضیات پژوهش را بنویس.'
    },
    {
      id: 'developer',
      title: 'برنامه‌نویسان و مهندسان نرم‌افزار',
      icon: 'Terminal',
      image: '/images/professions/developer.jpg',
      badge: 'فناوری و توسعه',
      desc: 'دیباگ سریع خطاهای کدنویسی، نگارش کوئری‌های SQL و معماری پروژه‌های نرم‌افزاری با استدلال عمیق.',
      prompt: 'یک کامپوننت React با تایپ‌اسکریپت برای پیاده‌سازی Infinite Scroll بنویس که با Intersection Observer کار کند و مدیریت خطای شبکه داشته باشد.'
    },
    {
      id: 'content',
      title: 'تولیدکنندگان محتوا و متخصصان سئو',
      icon: 'PenTool',
      image: '/images/professions/content.jpg',
      badge: 'تولید محتوا و سئو',
      desc: 'نگارش مقالات سئوشده ۲,۰۰۰ کلمه‌ای با لحن کاملاً فاخر و روان فارسی، سناریونویسی و ایده‌پردازی تقویم.',
      prompt: 'یک ساختار مقاله جامع ۲۰۰۰ کلمه‌ای سئوشده با تگ‌های H2 و H3 درباره "راهنمای جامع سئو معنایی (Semantic SEO) در سال ۲۰۲۶" تدوین کن.'
    },
    {
      id: 'legal',
      title: 'وکلا، کارشناسان حقوقی و مدیران قرارداد',
      icon: 'Scale',
      image: '/images/professions/legal.jpg',
      badge: 'حقوق و قراردادها',
      desc: 'تحلیل بندبه‌بند قراردادهای تجاری و پیمانکاری، کشف تعهدات و ریسک‌های پنهان، و تنظیم پیش‌نویس لوایح رسمی.',
      prompt: 'مهم‌ترین بندهای رفع تعهد و جریمه دیرکرد (Liquidated Damages) را در یک قرارداد توسعه نرم‌افزار همراه با تبصره فورس‌ماژور بنویس.'
    },
    {
      id: 'business',
      title: 'مدیران، استارتاپ‌ها و تحلیل‌گران بازار',
      icon: 'TrendingUp',
      image: '/images/professions/business.jpg',
      badge: 'کسب‌وکار و استراتژی',
      desc: 'تحلیل گزارش‌های فروش و اکسل، تدوین طرح کسب‌وکار (Business Plan) و مکاتبات رسمی تجاری.',
      prompt: 'یک ایمیل رسمی و متقاعدکننده به مدیرعامل یک شرکت همکار بنویس و پیشنهاد جلسه استراتژیک برای همکاری تجاری مشترک را مطرح کن.'
    },
    {
      id: 'medical',
      title: 'پزشکان، داروسازان و محققان سلامت',
      icon: 'Stethoscope',
      image: '/images/professions/medical.jpg',
      badge: 'پزشکی و سلامت',
      desc: 'خلاصه‌سازی پژوهش‌های بالینی و ژورنال‌های معتبر، ترجمه دقیق اصطلاحات و تنظیم مطالعات موردی.',
      prompt: 'جدیدترین پروتکل‌های بالینی در مدیریت دیابت نوع ۲ بر اساس استانداردهای ADA را به صورت دسته‌بندی‌شده و خلاصه بالینی شرح بده.'
    }
  ]
};

// ============================================================================
// SECTION: Gallery Images
// ============================================================================
export const landingGalleryConfig = {
  enabled: true,
  images: [
    {
      src: '/images/gallery/journal-cover.jpg',
      title: 'طراحی جلد ژورنال علمی',
      tag: 'انتشارات پژوهشی',
      prompt: 'Minimalist abstract scientific journal cover art, elegant synaptic neural network pathways connecting soft glowing data nodes, deep navy slate and warm gold tones, refined clean scientific illustration, calm and uncluttered'
    },
    {
      src: '/images/gallery/tech-editorial.jpg',
      title: 'تصویر شاخص وبلاگ فناوری',
      tag: 'سئو و تولید محتوا',
      prompt: 'Clean modern isometric editorial tech blog illustration, minimalist floating geometric cubes and digital paper workflow diagrams, matte titanium finish, soft diffused studio light, uncluttered, professional aesthetic'
    },
    {
      src: '/images/gallery/legal-emblem.jpg',
      title: 'تندیس مفهومی حقوق و عدالت',
      tag: 'حقوقی و سازمانی',
      prompt: 'Minimalist modern 3D sculptural emblem of justice balance scales, matte dark stone and brushed gold brass accents, clean minimalist dark studio background, elegant corporate symbol, uncluttered'
    },
    {
      src: '/images/gallery/business-trends.jpg',
      title: 'تصویرسازی تحلیل رشد مالی',
      tag: 'گزارش‌های شرکتی',
      prompt: 'Minimalist 3D architectural financial analytics chart, subtle glowing upward curved graph line on dark navy slate pedestal, refined glass milestone cubes, corporate growth indicator, clean studio lighting, uncluttered'
    },
    {
      src: '/images/gallery/academic-book.jpg',
      title: 'طراحی جلد کتاب مرجع دانشگاهی',
      tag: 'آموزش عالی',
      prompt: 'Refined modern academic textbook cover art, minimalist abstract geometric composition of intersecting arches and steps representing knowledge and education, warm ivory and rich slate blue, elegant and serene'
    },
    {
      src: '/images/gallery/biotech-dna.jpg',
      title: 'تصویرسازی زیست‌فناوری و ژنتیک',
      tag: 'پزشکی و سلامت',
      prompt: 'Clean minimalist 3D medical visualization of a glowing DNA double helix structure, floating in pristine clinical atmosphere with soft cyan and white luminous glow, ultra-clean laboratory background, uncluttered'
    }
  ]
};

// ============================================================================
// SECTION: Pricing
// ============================================================================
export const landingPricingConfig = {
  enabled: true,
  badge: 'TRANSPARENT PRICING',
  title: 'تعرفه‌ها بر اساس تومان و سهمیه توکن',
  subtitle: 'بدون کسر ماهانه خودکار و بدون هزینه‌های مخفی. هر بسته مستقیماً به کیف پول شما اضافه می‌شود و تاریخ انقضا ندارد.',
  freeCard: {
    id: 'free-welcome',
    title: 'هدیه ثبت‌نام',
    price: 'رایگان',
    rawPrice: 0,
    badge: 'هدیه بدون قیدوشرط',
    tokenEstimate: '~۱۵۰,۰۰۰ توکن سهمیه',
    messagesCount: 'حدود ۱۵۰ تا ۲۰۰ پیام کامل',
    desc: 'بلافاصله پس از ثبت‌نام به کیف پول شما واریز می‌شود تا قدرت مدل‌ها را آزادانه آزمایش کنید.',
    features: ['دسترسی کامل به تمام مدل‌ها', 'بدون نیاز به کارت بانکی', 'تحلیل اسناد و جستجوی زنده وب'],
    isPopular: false,
    ctaText: 'شروع با اعتبار هدیه'
  },
  plans: [
    {
      id: 'bronze',
      title: 'بسته برنزی (استارتر)',
      price: '۴۹,۰۰۰',
      rawPrice: 49000,
      badge: 'مقرون‌به‌صرفه',
      tokenEstimate: '~۴۰۰,۰۰۰ توکن سهمیه',
      messagesCount: 'حدود ۳۰۰ تا ۴۰۰ پاسخ هوشمند',
      desc: 'انتخابی عالی برای پاسخ به سوالات درسی، نگارش ایمیل و خلاصه مقالات هفتگی.',
      features: ['دسترسی به Claude 3.5 و GPT-4o', 'بدون تاریخ انقضا', 'محاسبه شفاف و دقیق به اندازه مصرف'],
      isPopular: false,
      ctaText: 'خرید بسته برنزی'
    },
    {
      id: 'silver',
      title: 'بسته نقره‌ای',
      price: '۱۴۹,۰۰۰',
      rawPrice: 149000,
      creditGranted: '۱۸۰,۰۰۰ تومان',
      badge: 'پرفروش‌ترین (۲۰٪ شارژ هدیه)',
      tokenEstimate: '~۱,۸۰۰,۰۰۰ توکن سهمیه',
      messagesCount: 'معادل بیش از ۱,۵۰۰ پاسخ مفصل',
      desc: 'محبوب‌ترین انتخاب برای نویسندگان، پژوهشگران، وکلا و تولیدکنندگان محتوا.',
      features: ['۲۰٪ اعتبار رایگان اضافه', 'تحلیل عمیق کتاب و اسناد PDF', 'استودیوی تصویرسازی بدون سقف', 'پشتیبانی در اولویت'],
      isPopular: true
    },
    {
      id: 'gold',
      title: 'بسته طلایی (حرفه‌ای)',
      price: '۳۴۹,۰۰۰',
      rawPrice: 349000,
      creditGranted: '۴۵۰,۰۰۰ تومان',
      badge: 'بیشترین ارزش (۳۰٪ شارژ هدیه)',
      tokenEstimate: '~۵,۵۰۰,۰۰۰ توکن سهمیه',
      messagesCount: 'معادل بیش از ۵,۰۰۰ پیام عمیق',
      desc: 'ویژه توسعه‌دهندگان، معماران نرم‌افزار، تحلیل‌گران داده و تیم‌های کاری.',
      features: ['۳۰٪ شارژ تشویقی نقدی', 'بالاترین اولویت سرعت پردازش', 'کدنویسی پیچیده و تحلیل دیتاست', 'اعتبار بدون انقضا'],
      isPopular: false
    }
  ],
  customTopupBanner: {
    enabled: true,
    title: 'پلن‌های ثابت مناسب شما نیست؟ شارژ با هر مبلغ دلخواه',
    desc: 'کیف پول خود را به هر میزانی که مایلید (حداقل ۵,۰۰۰ تومان) شارژ کنید و فقط به ازای توکن‌های مصرفی کسر اعتبار شوید.',
    btnText: 'شارژ با مبلغ دلخواه'
  }
};

// ============================================================================
// SECTION: FAQs
// ============================================================================
export const landingFaqsConfig = {
  enabled: true,
  badge: 'FREQUENTLY ASKED QUESTIONS',
  title: 'پرسش‌ها و پاسخ‌های متداول',
  subtitle: 'پاسخ جامع و شفاف به کلیه سوالات شما درباره نحوه استفاده، هزینه‌ها و امکانات هوش مصنوعی',
  faqs: [
    {
      q: 'دستیار هوشمند چیست و چگونه کار می‌کند؟',
      a: 'دستیار هوشمند یک پلتفرم پیشرفته و یکپارچه برای دسترسی مستقیم به قدرتمندترین هوش‌های مصنوعی جهان مانند Claude 3.5، GPT-4o و Gemini است. بدون نیاز به فیلترشکن، خرید شماره مجازی یا کارت اعتباری خارجی، می‌توانید با زبان فارسی با این مدل‌ها گفتگو کرده، فایل و کتاب‌های PDF را تحلیل نموده یا در استودیو تصویرسازی کنید.'
    },
    {
      q: 'تفاوت سیستم پرداخت بر اساس مصرف واقعی (Pay-As-You-Go) با خرید اکانت‌های دلاری چیست؟',
      a: 'در خرید اشتراک‌های ماهانه خارجی، کاربر باید ماهیانه بیش از ۲۰ دلار (حدود ۱ میلیون و ۸۰۰ هزار تومان) پرداخت کند و با خطر مسدود شدن اکانت و دردسر فیلترشکن روبه‌رو است. در دستیار هوشمند، نیازی به پرداخت ماهانه سنگین نیست؛ با کارت بانکی شتاب حساب خود را شارژ می‌کنید و به ازای هر پیام، فقط هزینه چند تک‌تومانی توکن‌های ورودی و خروجی کسر می‌گردد. این اعتبار هیچ‌گاه منقضی نمی‌شود.'
    },
    {
      q: 'توکن چیست و هر پیام چقدر توکن مصرف می‌کند؟',
      a: 'توکن کوچک‌ترین واحد محاسباتی در مدل‌های هوش مصنوعی است (تقریباً هر ۱۰۰۰ توکن معادل ۷۵۰ کلمه انگلیسی یا حدود ۵۰۰ کلمه فارسی است). برای یک سوال و جواب متداول، بین ۲۰۰ تا ۸۰۰ توکن مصرف می‌شود که هزینه آن در مدل‌های اقتصادی معمولاً کمتر از ۱۰۰ تا ۲۰۰ تک‌تومان است.'
    },
    {
      q: 'آیا برای استفاده از دستیار هوشمند به فیلترشکن یا شماره خارجی نیاز است؟',
      a: 'خیر، به هیچ عنوان. سرورهای این پلتفرم مستقیماً به سریع‌ترین درگاه‌های رسمی متصل هستند و از داخل ایران بدون نیاز به فیلترشکن، با نهایت سرعت لود و تاخیر پینگ زیر ۳۰۰ میلی‌ثانیه کار می‌کنند. ثبت‌نام نیز با شماره همراه ایران یا ایمیل در چند ثانیه انجام می‌شود.'
    },
    {
      q: 'چه مدل‌هایی از هوش مصنوعی در دسترس هستند؟',
      a: 'شما به طور همزمان به پرچمداران هوش مصنوعی جهان دسترسی دارید: Claude 3.5 Sonnet (سلطان نگارش و کدنویسی)، GPT-4o (پرچمدار همه‌کاره OpenAI)، Gemini 2.0 Flash (فوق‌سریع گوگل)، DeepSeek-V3 (هوش استدلالی و ریاضیاتی)، Qwen 2.5 72B و استودیوی تصویرسازی هنری Flux.'
    },
    {
      q: 'سیستم سوییچ هوشمند (Smart Routing) چیست و چه کاربردی دارد؟',
      a: 'دستیار هوشمند مجهز به موتور تشخیص قصد کاربر (Intent Detection) است. اگر سوال کدنویسی بپرسید، سیستم درخواست را به بهترین مدل برنامه‌نویسی هدایت می‌کند؛ اگر درخواست نگارش متن رسمی یا ترجمه داشته باشید، از ادبی‌ترین مدل استفاده می‌کند؛ و اگر نیاز به جستجوی وب باشد، داده‌های زنده اینترنت را جستجو می‌کند.'
    },
    {
      q: 'آیا امکان آپلود و تحلیل فایل‌های PDF و کد وجود دارد؟',
      a: 'بله. می‌توانید فایل‌های کتاب و اسناد PDF، فایل‌های متنی، پروژه‌های کدنویسی (پایتون، جاوااسکریپت و...)، اکسل و تصاویر را آپلود کنید. هوش مصنوعی متن و ساختار فایل را استخراج کرده و به سوالات تحلیلی، ترجمه یا خلاصه مقالات با بالاترین دقت پاسخ می‌دهد.'
    },
    {
      q: 'استودیوی تصویرساز چگونه کار می‌کند و آیا زبان فارسی را می‌فهمد؟',
      a: 'بله، کاملاً. شما می‌توانید توصیف خود از تصویر مورد نظرتان را به زبان شیرین فارسی بنویسید. سیستم ابتدا پرامپت شما را از نظر هنری، زاویه دوربین، نورپردازی و رزولوشن غنی‌سازی کرده و سپس با موتورهای پیشرفته تصویرسازی (Flux و SDXL)، تصاویر هایپررئال ۸K خلق می‌کند.'
    },
    {
      q: 'حریم خصوصی و امنیت گفتگوها چگونه تضمین می‌شود؟',
      a: 'تمامی تبادلات اطلاعاتی از طریق پروتکل رمزنگاری پیشرفته SSL صورت می‌پذیرد. تاریخچه گفتگوها در فضای امن ذخیره شده و به هیچ عنوان در اختیار اشخاص یا سازمان‌های ثالث قرار نمی‌گیرد و برای آموزش مدل‌های عمومی استفاده نمی‌شود.'
    },
    {
      q: 'نحوه شارژ حساب و درگاه‌های پرداخت چگونه است؟',
      a: 'شارژ حساب با تمام کارت‌های عضو شتاب از طریق درگاه‌های پرداخت معتبر شاپرکی امکان‌پذیر است. موجودی بلافاصله پس از پرداخت به کیف پول کاربر اضافه شده و صورت‌حساب دقیق و شفاف هر تراکنش در بخش مالی و داشبورد کاربری در دسترس است.'
    }
  ]
};

// ============================================================================
// SECTION: CTA Banner
// ============================================================================
export const landingCtaConfig = {
  enabled: true,
  title: 'همین حالا گفتگوی هوشمند را شروع کنید',
  desc: 'ثبت‌نام در کمتر از ۳۰ ثانیه بدون نیاز به وارد کردن کارت بانکی؛ بلافاصله وارد محیط چت شوید و قدرت مدل‌های برتر هوش مصنوعی جهان را تجربه کنید.',
  primaryBtnText: 'ورود به محیط چت',
  primaryBtnLink: '/chat',
  secondaryBtnText: 'مشاهده تعرفه‌ها',
  secondaryBtnLink: '/store'
};

// ============================================================================
// SECTION: SEO & Schema
// ============================================================================
export const landingSeoConfig = {
  title: 'دستیار هوشمند | چت با هوش مصنوعی فارسی، Claude 3.5، GPT-4o و استودیو تصویرساز',
  description: 'پلتفرم جامع هوش مصنوعی فارسی بدون فیلترشکن. دسترسی مستقیم به Claude 3.5 Sonnet، GPT-4o، Gemini 2.0 Flash و استودیو تولید تصویر همراه با پرداخت شتاب و دسترسی فوق‌سریع.',
  keywords: 'هوش مصنوعی فارسی, چت با هوش مصنوعی, چت جی پی تی بدون فیلترشکن, کلود فارسی, خرید توکن هوش مصنوعی, تولید تصویر هوش مصنوعی, هوش مصنوعی رایگان, دستیار هوشمند',
  canonical: 'https://dastyarai.com/',
  softwareSchema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'دستیار هوشمند | پلتفرم هوش مصنوعی فارسی',
    url: 'https://dastyarai.com',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    inLanguage: 'fa-IR',
    description: 'دستیار هوشمند فارسی با پشتیبانی از مدل‌های Claude 3.5 Sonnet، GPT-4o، Gemini 2.0، استودیو تصویرساز Flux و پرداخت ریالی بدون فیلترشکن.',
    featureList: [
      'گفتگوی فارسی روان با برترین مدل‌های هوش مصنوعی جهان',
      'اتصال مستقیم بدون نیاز به فیلترشکن یا شماره مجازی',
      'دسترسی سریع و تست رایگان مدل‌های پیشرو هوش مصنوعی',
      'مدل پرداخت ریالی Pay-As-You-Go به اندازه مصرف واقعی کلمات',
      'تحلیل عمیق اسناد متنی، کتاب و فایل‌های PDF',
      'استودیوی تصویرساز هایپررئال با پرامپت فارسی',
      'سوییچ و روتینگ هوشمند بر اساس هدف کاربر'
    ],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IRR',
      lowPrice: '0',
      highPrice: '3490000',
      offerCount: '4'
    }
  }
};

// ============================================================================
// SECTION: Demo Scenarios
// ============================================================================
export const landingDemoScenarios = [
  {
    id: 'contract',
    label: 'نگارش حقوقی و اداری',
    icon: 'FileText',
    model: 'Claude 3.5 Sonnet',
    modelBadge: 'قدرتمندترین مدل ادبی و استدلال',
    userPrompt: 'یک پیش‌نویس قرارداد محرمانگی اطلاعات (NDA) رسمی و حقوقی برای همکاری دو شرکت نرم‌افزاری تنظیم کن.',
    aiResponse: `**قرارداد عدم افشای اطلاعات محرمانه (NDA)**

**ماده ۱ - طرفین قرارداد:**
این توافق‌نامه فی‌مابین شرکت الف (افشاکننده) و شرکت ب (دریافت‌کننده) با شرایط ذیل منعقد می‌گردد:

**ماده ۲ - موضوع قرارداد:**
حفظ محرمانگی کامل کلیه داده‌های فنی، سورس‌کدها، مستندات معماری و اسرار تجاری مبادله‌شده.

**ماده ۳ - تعهدات دریافت‌کننده:**
دریافت‌کننده متعهد است بالاترین تدابیر امنیتی را اعمال نموده و بدون موافقت کتبی قبلی، هیچ بخشی از داده‌ها را در اختیار اشخاص ثالث قرار ندهد.`
  },
  {
    id: 'coding',
    label: 'کدنویسی و مهندسی نرم‌افزار',
    icon: 'Code2',
    model: 'DeepSeek-V3 / GPT-4o',
    modelBadge: 'متخصص الگوریتم و توسعه',
    userPrompt: 'یک سیستم ریت‌لیمیت برای کنترل سهمیه توکن‌ها بر اساس دقیقه در تایپ‌اسکریپت بنویس.',
    aiResponse: `\`\`\`typescript
interface TokenLimiter {
  maxTokensPerMinute: number;
  consumed: number;
  resetAt: number;
}

export function checkTokenQuota(limiter: TokenLimiter, tokensNeeded: number): boolean {
  const now = Date.now();
  if (now > limiter.resetAt) {
    limiter.consumed = 0;
    limiter.resetAt = now + 60_000;
  }
  if (limiter.consumed + tokensNeeded <= limiter.maxTokensPerMinute) {
    limiter.consumed += tokensNeeded;
    return true; // مجاز به پردازش
  }
  return false; // سهمیه این بازه تکمیل است
}
\`\`\``
  },
  {
    id: 'vision',
    label: 'استودیوی تصویرساز فارسی',
    icon: 'ImageIcon',
    model: 'Flux.1 Hyperreal',
    modelBadge: 'موتور گرافیکی هایپررئال',
    userPrompt: 'پرتره سینمایی یک سردار باستانی ایران با زره سایبرنتیک و شمشیر پلاسمایی فیروزه‌ای در شبی بارانی',
    aiResponse: `✅ **درخواست تحلیل شد و به پرامپت مهندسی‌شده تبدیل گردید:**
\`Cinematic portrait of an ancient Persian warrior in cybernetic high-tech battle armor, engraved golden Farvahar patterns, glowing cyan energy lines, holding plasma scimitar, atmospheric smoke, 8k photorealism\`

🖼️ تصویر با رزولوشن 8K و بیشترین جزئیات نوری در استودیو خلق گردید.`
  }
];

// ============================================================================
// SECTION: Gallery Images (Professional Showcase)
// ============================================================================
export const landingGalleryImages = [
  {
    src: '/images/gallery/journal-cover.jpg',
    title: 'طراحی جلد ژورنال علمی',
    tag: 'انتشارات پژوهشی',
    prompt: 'Minimalist abstract scientific journal cover art, elegant synaptic neural network pathways connecting soft glowing data nodes, deep navy slate and warm gold tones, refined clean scientific illustration, calm and uncluttered'
  },
  {
    src: '/images/gallery/tech-editorial.jpg',
    title: 'تصویر شاخص وبلاگ فناوری',
    tag: 'سئو و تولید محتوا',
    prompt: 'Clean modern isometric editorial tech blog illustration, minimalist floating geometric cubes and digital paper workflow diagrams, matte titanium finish, soft diffused studio light, uncluttered, professional aesthetic'
  },
  {
    src: '/images/gallery/legal-emblem.jpg',
    title: 'تندیس مفهومی حقوق و عدالت',
    tag: 'حقوقی و سازمانی',
    prompt: 'Minimalist modern 3D sculptural emblem of justice balance scales, matte dark stone and brushed gold brass accents, clean minimalist dark studio background, elegant corporate symbol, uncluttered'
  },
  {
    src: '/images/gallery/business-trends.jpg',
    title: 'تصویرسازی تحلیل رشد مالی',
    tag: 'گزارش‌های شرکتی',
    prompt: 'Minimalist 3D architectural financial analytics chart, subtle glowing upward curved graph line on dark navy slate pedestal, refined glass milestone cubes, corporate growth indicator, clean studio lighting, uncluttered'
  },
  {
    src: '/images/gallery/academic-book.jpg',
    title: 'طراحی جلد کتاب مرجع دانشگاهی',
    tag: 'آموزش عالی',
    prompt: 'Refined modern academic textbook cover art, minimalist abstract geometric composition of intersecting arches and steps representing knowledge and education, warm ivory and rich slate blue, elegant and serene'
  },
  {
    src: '/images/gallery/biotech-dna.jpg',
    title: 'تصویرسازی زیست‌فناوری و ژنتیک',
    tag: 'پزشکی و سلامت',
    prompt: 'Clean minimalist 3D medical visualization of a glowing DNA double helix structure, floating in pristine clinical atmosphere with soft cyan and white luminous glow, ultra-clean laboratory background, uncluttered'
  }
];

// ============================================================================
// SECTION: Gallery Settings
// ============================================================================
export const landingGallerySettings = {
  enabled: true,
  badge: 'AI IMAGE STUDIO SHOWCASE • انیمیشن تعاملی',
  showViewButton: true
};

// ============================================================================
// SECTION: Analytics (UsageAnalyticsSection - imported component)
// ============================================================================
export const landingAnalyticsConfig = {
  enabled: true
};

// ============================================================================
// EXPORT ALL CONFIGS
// ============================================================================
export const landingPageContent = {
  hero: landingHeroConfig,
  features: landingFeaturesConfig,
  manifesto: landingManifestoConfig,
  professions: landingProfessionsConfig,
  gallery: landingGalleryConfig,
  gallerySettings: landingGallerySettings,
  pricing: landingPricingConfig,
  faqs: landingFaqsConfig,
  cta: landingCtaConfig,
  seo: landingSeoConfig,
  demoScenarios: landingDemoScenarios,
  galleryImages: landingGalleryImages,
  analytics: landingAnalyticsConfig
};

export type LandingPageContent = typeof landingPageContent;