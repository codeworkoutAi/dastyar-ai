

/**
 * SmartWebAgent with enhanced error handling, retry logic, and graceful degradation
 */
export class SmartWebAgent {
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_RETRY_DELAY = 500; // ms
  private static readonly TIMEOUT_MAIN = 5000; // ms
  private static readonly TIMEOUT_DEEP = 4000; // ms
  private static readonly TIMEOUT_API = 4500; // ms

  /**
   * Exponential backoff retry helper with jitter
   */
  private static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.INITIAL_RETRY_DELAY,
    context: string = 'operation'
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError';
        const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');

        if (isLastAttempt) {
          console.warn(`[WebSearch] ${context} failed after ${retries} attempts:`, error.message);
          return null;
        }

        // Only retry on timeout or network errors, not on 4xx/5xx responses
        if (!isTimeout && !isNetworkError) {
          console.warn(`[WebSearch] ${context} non-retryable error:`, error.message);
          return null;
        }

        const jitter = Math.random() * 200;
        const backoffDelay = delay * Math.pow(2, attempt - 1) + jitter;
        console.log(`[WebSearch] ${context} retry ${attempt}/${retries} after ${Math.round(backoffDelay)}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
    return null;
  }

  static async processQuery(query: string, trustedDomains?: string[]): Promise<string> {
    if (!query || query.trim().length < 2) return '';

    // ==========================================
    // 1. Skip List (Prevent unnecessary searches)
    // ==========================================
    const isConversationalOrSkip = query.match(/(ترجمه|معنی کلمه|به انگلیسی|به فارسی|تلفظ|ایده بده|انشا بنویس|خلاصه کن|تایپ کن|نامه بنویس|تولید محتوا|متن تبلیغاتی|کپشن|بنویس|create|بساز|تابع|class|کلاس|component|کامپوننت|کد|دیباگ|چرا ارور|مشکل این کد|refactor|بررسی کد|explain|توضیح|what is|چیست|الگوریتم|data structure|ساختمان داده|مفهوم|hi|hello|سلام|صبح بخیر|عصر بخیر|چطوری|خوبی|ممنون|مرسی|تشکر|خداحافظ)/i);
    
    // Also skip very short conversational queries unless they ask for something specific like price or weather
    const wordCount = query.trim().split(/\s+/).length;
    const isShortGeneral = wordCount <= 3 && !query.match(/(دلار|طلا|سکه|بیت‌کوین|تتر|قیمت|یورو|پوند|بورس|خبر|اخبار|امروز|فوری|هوا|باران|نتیجه بازی|فوتبال|بازی|اذان|تعطیلی|محرم)/i);

    if (isConversationalOrSkip || isShortGeneral) {
      console.log('[WebSearch] Skipping web search for non-factual or conversational query.');
      return '';
    }

    // ==========================================
    // 2. Intent Detection (15+ Specialized Categories)
    // ==========================================
    let intent = 'General';
    if (/(دلار|طلا|سکه|بیت‌کوین|تتر|یورو|پوند|درهم|دینار|ارز|بورس|سهام|آبشده|آب‌شده|لیر|انس|اونس|گرم|مثقال|نرخ|قیمت ارز|قیمت طلا)/i.test(query)) intent = 'Finance';
    else if (/(ایردراپ|توکنومیکس|بلاکچین|قرارداد هوشمند|تون‌کوین|نات‌کوین|استخراج|ماینینگ|همستر|crypto|airdrop)/i.test(query)) intent = 'Crypto';
    else if (/(علائم|درمان|دارو|عوارض|بیماری|قرص|پزشک|دکتر|بیمارستان|کرونا|سرماخوردگی|تغذیه بالینی)/i.test(query)) intent = 'Health';
    else if (/(قانون|مالیات|ویزا|مهاجرت|دادگاه|دیوان عالی|بخشنامه|ثبت احوال|شکایت|پاسپورت|لاتاری|یارانه)/i.test(query)) intent = 'Law';
    else if (/(مقاله|پایان‌نامه|ژورنال|کنفرانس|بورسیه|دانشگاه|پژوهش|تحقیق|دانلود کتاب|isi|paper|scholar)/i.test(query)) intent = 'Academic';
    else if (/(قیمت خودرو|ثبت نام ماشین|سایپا|ایران‌خودرو|رهن|اجاره|وام مسکن|آپارتمان|مشخصات ماشین|بنگاه)/i.test(query)) intent = 'AutoRealEstate';
    else if (/(بررسی|مقایسه|مشخصات فنی|بنچمارک|رونمایی|پردازنده|باتری گوشی|لپ‌تاپ|موبایل|سامسونگ|آیفون|شیائومی)/i.test(query)) intent = 'TechReviews';
    else if (/(طرز تهیه|دستور پخت|کالری|رژیم|مواد لازم|پختن|شیرینی|آشپزی)/i.test(query)) intent = 'Cooking';
    else if (/(آب و هوا|هواشناسی|دما|باران|برف|وضعیت جاده|هوا فردا|آلودگی هوا|کیفیت هوا|weather)/i.test(query)) intent = 'Weather';
    else if (/(نتیجه بازی|فوتبال|استقلال|پرسپولیس|لیگ برتر|جام|والیبال|پخش زنده|المپیک|جدول رده‌بندی|مربی|گلزنان|sports|match)/i.test(query)) intent = 'Sports';
    else if (/(اوقات شرعی|اذان|تعطیلی|مناسبت|تاریخ امروز|محرم|رمضان|عید|تقویم)/i.test(query)) intent = 'Calendar';
    else if (/(استخدام|حقوق وزارت کار|بیمه تامین اجتماعی|قانون کار|مصاحبه کاری|رزومه|شغل|کاریابی)/i.test(query)) intent = 'Jobs';
    else if (/(فیلم|سریال|سینما|بازیگر|کارگردان|باکس آفیس|اکران|دانلود آهنگ|imdb|موسیقی|کنسرت)/i.test(query)) intent = 'Entertainment';
    else if (/(بلیط|پرواز|قطار|اتوبوس|هتل|رزرو|ترافیک|آدرس|رستوران|گردشگری|سفر|نقشه)/i.test(query)) intent = 'Travel';
    else if (/(خبر|اخبار|گزارش|سیاسی|فوری|آخرین اخبار|breaking|news)/i.test(query)) intent = 'News';
    else if (/(خرید|فروش|ارزان|دیجی‌کالا|ترب|باما|دیوار|شیپور|قیمت)/i.test(query)) intent = 'Shopping';
    else if (/(error|exception|crashed|failed|warning|deprecated|documentation|docs|api reference|react|vue|angular|next\.js|typescript|python|django|flask|express|node\.js|tailwind|mongodb|postgresql)/i.test(query)) intent = 'Programming';

    console.log('[WebSearch] Intent:', intent, 'Query:', query.substring(0, 50));
    if (trustedDomains && trustedDomains.length > 0) {
      console.log('[WebSearch] Prioritizing domains:', trustedDomains.slice(0, 3).join(', '));
    }

    // Build search query with domain prioritization for specific intents
    let searchQuery = query;
    if (trustedDomains && trustedDomains.length > 0 && (intent === 'Programming' || intent === 'TechReviews' || intent === 'Academic')) {
      // Add site: operator to prioritize trusted domains
      const domainQuery = trustedDomains.slice(0, 3).map(d => `site:${d}`).join(' OR ');
      searchQuery = `${query} (${domainQuery})`;
    }

    // ==========================================
    // 3. Fetch Web Results (Bing)
    // ==========================================
    const searchUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(searchQuery);
    const html = await this.retryWithBackoff(
      async () => {
        const res = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept-Language': 'fa,en-US;q=0.9,en;q=0.8'
          },
          signal: AbortSignal.timeout(this.TIMEOUT_MAIN)
        });

        if (!res.ok) {
          throw new Error(`Bing search returned ${res.status}`);
        }

        return await res.text();
      },
      this.MAX_RETRIES,
      this.INITIAL_RETRY_DELAY,
      'Bing search'
    );

    if (!html) {
      console.warn('[WebSearch] Bing search failed, returning empty');
      return '';
    }

    const titles = [...html.matchAll(/<h2[^>]*><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a><\/h2>/gi)];
    const snippets = [...html.matchAll(/<div class="b_caption[^>]*>([\s\S]*?)<\/div>/gi)];

    let firstUrl: string | null = null;
    let resultsText = '';
    const limit = Math.min(titles.length, snippets.length, 5);

    for (let i = 0; i < limit; i++) {
      let rawUrl = titles[i][1].replace(/&amp;/g, '&');
      if (rawUrl.includes('aclick') || rawUrl.includes('adurl')) continue;

      const uMatch = rawUrl.match(/&u=a1([^&]+)/);
      if (uMatch) {
        try {
          rawUrl = Buffer.from(uMatch[1], 'base64').toString('utf8');
        } catch (e) {}
      }

      if (!firstUrl) firstUrl = rawUrl;
      const title = titles[i][2].replace(/<[^>]+>/g, '').trim();
      const snippet = snippets[i][1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      resultsText += `[لینک: ${rawUrl}]\nعنوان: ${title}\nخلاصه: ${snippet}\n\n`;
    }

    // ==========================================
    // 4. Deep Scrape (For specific intents where detail is needed)
    // ==========================================
    let deepText = '';
    const deepScrapeIntents = ['Finance', 'News', 'Programming', 'Academic', 'Law', 'Health', 'General'];
    if (firstUrl && deepScrapeIntents.includes(intent)) {
      const pageHtml = await this.retryWithBackoff(
        async () => {
          const pageRes = await fetch(firstUrl!, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(this.TIMEOUT_DEEP)
          });
          if (!pageRes.ok) throw new Error(`Page fetch returned ${pageRes.status}`);
          return await pageRes.text();
        },
        2,
        this.INITIAL_RETRY_DELAY,
        'Deep page scrape'
      );

      if (pageHtml) {
        let cleaned = pageHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        deepText = cleaned.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);
      }
    }

    let finalPrompt = '\n\n[نتایج جستجوی زنده وب (Smart Web Agent):\n' + resultsText;
    if (deepText) {
      finalPrompt += '\n--- محتوای متن استخراج شده از سایت اول ---\n' + deepText + '\n';
    }
    finalPrompt += ']\n\n';

    // ==========================================
    // 5. Finance-Specific Data (Wallex API)
    // ==========================================
    if (intent === 'Finance') {
      const wallexData = await this.retryWithBackoff(
        async () => {
          const res = await fetch('https://api.wallex.ir/v1/markets', { signal: AbortSignal.timeout(this.TIMEOUT_API) });
          if (!res.ok) throw new Error(`Wallex API returned ${res.status}`);
          return await res.json();
        },
        2, this.INITIAL_RETRY_DELAY, 'Wallex API'
      );

      if (wallexData) {
        const usdt = wallexData?.result?.symbols?.USDTTMN?.stats?.lastPrice;
        if (usdt) {
          finalPrompt += `\n[داده‌های زنده و قطعی بازار]\nقیمت لحظه‌ای دلار آزاد (معادل تتر): ${Number(usdt).toLocaleString('fa-IR')} تومان (منبع قطعی: والکس)\n`;
        }
      }
    }

    // ==========================================
    // 6. Inject Persona & Formatter Instructions
    // ==========================================
    switch (intent) {
      case 'Finance':
        finalPrompt += 'دستورالعمل هوشمند: شما یک تحلیل‌گر ارشد مالی هستید. قیمت‌ها را مستقیماً از [داده‌های زنده و قطعی بازار] بخوانید و به صورت عدد مشخص اعلام کنید.';
        break;
      case 'Crypto':
        finalPrompt += 'دستورالعمل هوشمند: شما یک تحلیل‌گر حرفه‌ای رمزارز و بلاکچین هستید. اطلاعات را تخصصی، دقیق و با لحنی حرفه‌ای ارائه دهید.';
        break;
      case 'Health':
        finalPrompt += 'دستورالعمل هوشمند: شما یک دستیار هوشمند پزشکی هستید. اطلاعات دارویی و درمانی را خلاصه کنید اما حتماً در پایان یک هشدار شفاف بدهید که "این اطلاعات جایگزین مراجعه به پزشک متخصص نیست".';
        break;
      case 'Law':
        finalPrompt += 'دستورالعمل هوشمند: شما یک مشاور حقوقی و اداری هستید. قوانین و بخشنامه‌ها را شفاف توضیح دهید اما تاکید کنید که برای کارهای رسمی نیاز به مشاوره با وکیل است.';
        break;
      case 'Academic':
        finalPrompt += 'دستورالعمل هوشمند: شما یک دستیار پژوهشی دانشگاهی هستید. پاسخ خود را کاملاً علمی، بی‌طرفانه و با استناد به مقالات یافت شده ارائه دهید.';
        break;
      case 'TechReviews':
        finalPrompt += 'دستورالعمل هوشمند: شما یک متخصص تکنولوژی هستید. در صورت مقایسه بین دو محصول، حتماً خروجی خود را در قالب یک **جدول مقایسه‌ای مرتب (Markdown Table)** ارائه دهید.';
        break;
      case 'Cooking':
        finalPrompt += 'دستورالعمل هوشمند: شما یک سرآشپز حرفه‌ای هستید. ابتدا لیست مواد لازم را با بولت‌پوینت و سپس مراحل پخت را به صورت شماره‌گذاری شده و واضح بنویسید.';
        break;
      case 'Weather':
        finalPrompt += 'دستورالعمل هوشمند: شما یک کارشناس هواشناسی هستید. وضعیت آب و هوا، دما و شرایط جوی را به صورت دقیق و کاربردی به کاربر اعلام کنید.';
        break;
      case 'Sports':
        finalPrompt += 'دستورالعمل هوشمند: شما یک گزارشگر ورزشی هستید. نتایج مسابقات، گلزنان یا جدول لیگ را دقیقاً از روی نتایج جستجو استخراج کرده و به صورت مرتب و جذاب اعلام کنید.';
        break;
      case 'Jobs':
        finalPrompt += 'دستورالعمل هوشمند: شما یک مشاور منابع انسانی هستید. اخبار مربوط به قانون کار، بیمه یا حداقل حقوق را به صورت ساده و قابل فهم لیست کنید.';
        break;
      case 'AutoRealEstate':
        finalPrompt += 'دستورالعمل هوشمند: شما یک کارشناس بازار خودرو و مسکن هستید. قیمت‌های روز را با دقت از متن استخراج کنید و به صورت لیستی منظم ارائه دهید.';
        break;
      case 'News':
        finalPrompt += 'دستورالعمل هوشمند: شما یک خبرنگار بی‌طرف هستید. خبرهای روز را به صورت دقیق خلاصه کنید. اگر اطلاعات ضدونقیض است، منابع مختلف را مقایسه کنید.';
        break;
      case 'Programming':
        finalPrompt += 'دستورالعمل هوشمند: شما یک مهندس نرم‌افزار ارشد هستید. کدهای به‌روزی بنویسید که با آخرین نسخه‌های کتابخانه‌ها سازگار باشد. مستقیماً به راه‌حل بروید و توضیحات اضافه ندهید.';
        break;
      case 'Shopping':
        finalPrompt += 'دستورالعمل هوشمند: شما یک دستیار خرید هستید. فقط قیمت‌ها و فروشگاه‌های موجود را به طور خلاصه و در قالب یک لیست مرتب برای کاربر بنویسید.';
        break;
      case 'Calendar':
        finalPrompt += 'دستورالعمل هوشمند: شما یک دستیار تقویم و اوقات شرعی هستید. مناسبت‌ها یا زمان دقیق اذان را مشخصاً و بدون حاشیه اعلام کنید.';
        break;
      default:
        finalPrompt += 'دستورالعمل هوشمند: با استفاده از نتایج زنده وب، پاسخی دقیق، مستند و به زبان فارسی شیوا ارائه دهید.';
    }

    return finalPrompt;
  }
}
