/**
 * Smart Auto Web Search Detection
 * Automatically detects when AI models need web assistance for accurate responses
 */

export interface WebSearchDecision {
  shouldSearch: boolean;
  reason: string;
  domains?: string[]; // Trusted domains to prioritize
  category: string;
}

/**
 * Detect if a query needs web search assistance
 */
export function detectWebSearchNeed(query: string): WebSearchDecision {
  const lowerQuery = query.toLowerCase();

  // ========== SKIP WEB SEARCH (LISTE SIAH) ==========
  // These categories should NOT trigger web search to save time and API costs
  const noSearchPatterns = [
    // Translation and definitions
    /(ترجمه|معنی کلمه|به انگلیسی|به فارسی|تلفظ)/i,
    // Content generation & brainstorming
    /(ایده بده|انشا بنویس|خلاصه کن|تایپ کن|نامه بنویس|تولید محتوا|متن تبلیغاتی|کپشن)/i,
    // Pure coding logic (without specific documentation requests)
    /^(write|بنویس|create|بساز).*(function|تابع|class|کلاس|component|کامپوننت|کد)/i,
    /^(دیباگ|چرا ارور|مشکل این کد|refactor|بررسی کد)/i,
    // Explanations of known concepts
    /^(explain|توضیح|what is|چیست).*(algorithm|الگوریتم|data structure|ساختمان داده|مفهوم)/i,
    // Conversational & Greetings
    /^(hi|hello|سلام|صبح بخیر|عصر بخیر|چطوری|خوبی|ممنون|مرسی|تشکر|خداحافظ)/i,
  ];

  for (const pattern of noSearchPatterns) {
    if (pattern.test(query)) {
      return {
        shouldSearch: false,
        reason: 'Model can handle this locally (Skip List matched)',
        category: 'none',
      };
    }
  }

  // ========== SPECIALIZED INTENT CATEGORIES ==========
  const intentCategories = [
    {
      id: 'finance',
      pattern: /(دلار|طلا|سکه|بیت‌کوین|تتر|یورو|پوند|درهم|دینار|ارز|بورس|سهام|آبشده|آب‌شده|لیر|انس|اونس|گرم|مثقال|نرخ|قیمت ارز|قیمت طلا)/i,
      reason: 'Live financial data needed',
      domains: [],
    },
    {
      id: 'news',
      pattern: /(خبر|اخبار|گزارش|سیاسی|فوری|آخرین اخبار|breaking|news)/i,
      reason: 'Current events or time-sensitive information',
      domains: [],
    },
    {
      id: 'weather',
      pattern: /(آب و هوا|هواشناسی|دما|باران|برف|وضعیت جاده|هوا فردا|آلودگی هوا|کیفیت هوا|weather)/i,
      reason: 'Live weather forecast needed',
      domains: [],
    },
    {
      id: 'sports',
      pattern: /(نتیجه بازی|فوتبال|استقلال|پرسپولیس|لیگ برتر|جام|والیبال|پخش زنده|المپیک|جدول رده‌بندی|مربی|گلزنان|sports|match)/i,
      reason: 'Live sports results and tables',
      domains: [],
    },
    {
      id: 'health',
      pattern: /(علائم|درمان|دارو|عوارض|بیماری|قرص|پزشک|دکتر|بیمارستان|کرونا|سرماخوردگی|تغذیه بالینی)/i,
      reason: 'Medical and health information lookup',
      domains: ['mayoclinic.org', 'webmd.com', 'who.int'],
    },
    {
      id: 'academic',
      pattern: /(مقاله|پایان‌نامه|ژورنال|کنفرانس|بورسیه|دانشگاه|پژوهش|تحقیق|دانلود کتاب|isi|paper|scholar)/i,
      reason: 'Academic research and paper lookup',
      domains: ['scholar.google.com', 'researchgate.net', 'civilica.com', 'pubmed.ncbi.nlm.nih.gov'],
    },
    {
      id: 'law',
      pattern: /(قانون|مالیات|ویزا|مهاجرت|دادگاه|دیوان عالی|بخشنامه|ثبت احوال|شکایت|پاسپورت|لاتاری|یارانه)/i,
      reason: 'Legal, governmental, or immigration guidelines',
      domains: [],
    },
    {
      id: 'auto_realestate',
      pattern: /(قیمت خودرو|ثبت نام ماشین|سایپا|ایران‌خودرو|رهن|اجاره|وام مسکن|آپارتمان|مشخصات ماشین|بنگاه)/i,
      reason: 'Real estate and automotive market pricing',
      domains: [],
    },
    {
      id: 'crypto',
      pattern: /(ایردراپ|توکنومیکس|بلاکچین|قرارداد هوشمند|تون‌کوین|نات‌کوین|استخراج|ماینینگ|همستر|crypto|airdrop)/i,
      reason: 'Cryptocurrency and Web3 news/data',
      domains: ['coinmarketcap.com', 'coindesk.com'],
    },
    {
      id: 'cooking',
      pattern: /(طرز تهیه|دستور پخت|کالری|رژیم|مواد لازم|پختن|شیرینی|آشپزی)/i,
      reason: 'Cooking recipes and nutritional info',
      domains: [],
    },
    {
      id: 'tech_reviews',
      pattern: /(بررسی|مقایسه|مشخصات فنی|بنچمارک|رونمایی|پردازنده|باتری گوشی|لپ‌تاپ|موبایل|سامسونگ|آیفون|شیائومی)/i,
      reason: 'Gadget reviews and technical specs',
      domains: ['gsmarena.com', 'zoomit.ir', 'theverge.com'],
    },
    {
      id: 'travel',
      pattern: /(بلیط|پرواز|قطار|اتوبوس|هتل|رزرو|ترافیک|آدرس|رستوران|گردشگری|سفر|نقشه)/i,
      reason: 'Travel and local services info',
      domains: [],
    },
    {
      id: 'entertainment',
      pattern: /(فیلم|سریال|سینما|بازیگر|کارگردان|باکس آفیس|اکران|دانلود آهنگ|imdb|موسیقی|کنسرت)/i,
      reason: 'Entertainment and arts info',
      domains: ['imdb.com'],
    },
    {
      id: 'calendar',
      pattern: /(اوقات شرعی|اذان|تعطیلی|مناسبت|تاریخ امروز|محرم|رمضان|عید|تقویم)/i,
      reason: 'Calendar, holidays, and religious times',
      domains: [],
    },
    {
      id: 'jobs',
      pattern: /(استخدام|حقوق وزارت کار|بیمه تامین اجتماعی|قانون کار|مصاحبه کاری|رزومه|شغل|کاریابی)/i,
      reason: 'Jobs and employment laws',
      domains: [],
    },
    {
      id: 'shopping',
      pattern: /(خرید|فروش|ارزان|دیجی‌کالا|ترب|باما|دیوار|شیپور|قیمت)/i,
      reason: 'Online shopping and market prices',
      domains: [],
    },
    {
      id: 'programming',
      pattern: /(error|exception|crashed|failed|warning|deprecated|documentation|docs|api reference|react|vue|angular|next\.js|typescript|python|django|flask|express|node\.js|tailwind|mongodb|postgresql)/i,
      reason: 'Programming docs and latest library updates',
      domains: ['stackoverflow.com', 'github.com', 'developer.mozilla.org'],
    },
  ];

  for (const cat of intentCategories) {
    if (cat.pattern.test(query)) {
      return {
        shouldSearch: true,
        reason: cat.reason,
        domains: cat.domains,
        category: cat.id,
      };
    }
  }

  // ========== DEFAULT: GENERAL QUERY ==========
  // Only search if query seems factual, informational, or time-based
  const isFactualQuery =
    /(what|چی|چه|who|کی|when|کی|where|کجا|why|چرا|how many|چند)/i.test(query) ||
    /(tell me|بگو|توضیح|توصیف|امروز|الان|امسال)/i.test(query);

  if (isFactualQuery && query.split(/\s+/).length > 3) {
    return {
      shouldSearch: true,
      reason: 'Factual query may benefit from up-to-date information',
      category: 'general',
    };
  }

  return {
    shouldSearch: false,
    reason: 'Simple query - model knowledge sufficient',
    category: 'none',
  };
}
