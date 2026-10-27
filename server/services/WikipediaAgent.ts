/**
 * WikipediaAgent
 * Connects automatically to Wikipedia REST API (both Persian 'fa' and English 'en')
 * to fetch verified facts, summaries, and encyclopedic references for AI grounding.
 * Completely free, no API key required, zero quota consumption.
 */

export interface WikipediaResult {
  found: boolean;
  title?: string;
  description?: string;
  extract?: string;
  url?: string;
  lang?: 'fa' | 'en';
}

export class WikipediaAgent {
  private static readonly TIMEOUT = 2500;
  private static readonly USER_AGENT = 'DastyarAI/1.0 (https://dastyarai.com; info@dastyarai.com)';

  // --- Relevance guard -------------------------------------------------------
  // `searchTitle` blindly took `pages[0]`, so a question like "قیمت ارز چنده" was
  // reduced to "قیمت ارز" and Wikipedia happily returned an article about currencies
  // (units, history) that has nothing to do with the user's question. That irrelevant
  // summary was then injected as "اطلاعات موثق", i.e. another wrong source.
  // An article is only accepted when its title actually covers what was asked about.
  // A single shared word is not enough for a multi-word query: "قیمت ارز" must not be
  // answered with the article "ارز" (currency units and history), which is what the old
  // `pages[0]` behaviour did. A one-word query still needs only one hit.
  private static requiredOverlap(termWords: string[]): number {
    return Math.min(2, termWords.length);
  }

  /** Words too common to prove an article is about the requested entity. */
  private static readonly TITLE_STOPWORDS = new Set([
    'و', 'در', 'از', 'که', 'را', 'با', 'برای', 'است', 'هست', 'های', 'ها', 'یا', 'تا',
    'بر', 'این', 'آن', 'یک', 'هر', 'چه', 'چیست', 'کیست', 'کی', 'چه', 'چگونه', 'چطور',
    'درباره', 'راجع', 'معرفی', 'توضیح', 'تاریخچه', 'بیوگرافی', 'زندگینامه', 'تعریف',
    'مفهوم', 'بگو', 'بگید', 'لطفا', 'خلاصه', 'ویکی', 'پدیا', 'پدیای', 'دانشنامه',
    'منبع', 'مقاله', 'صفحه', 'اطلاعات', 'the', 'of', 'and', 'in', 'is', 'who', 'what',
  ]);

  /** Persian/Arabic folding so "ي"/"ی" and "ك"/"ک" compare equal. */
  private static normalize(input: string): string {
    return (input || '')
      .replace(/[\u064B-\u0652\u0670]/g, '')
      .replace(/[\u200c\u200f\u200e]/g, ' ')
      .replace(/\u064A/g, '\u06CC')
      .replace(/\u0649/g, '\u06CC')
      .replace(/\u0643/g, '\u06A9')
      .replace(/[\u0623\u0625\u0622]/g, '\u0627')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /** Content words of a text, stopwords removed. */
  private static contentWords(input: string): string[] {
    return this.normalize(input)
      .split(' ')
      .filter((w) => w.length >= 3 && !this.TITLE_STOPWORDS.has(w));
  }

  /**
   * True when the article title plausibly refers to the thing the user asked about.
   * Single-character and stopword matches are rejected; otherwise an article about
   * "قیمت ارز" would be accepted for a question about "قیمت نفت".
   */
  private static isTitleRelevant(title: string, term: string): boolean {
    const termWords = this.contentWords(term);
    if (termWords.length === 0) return false;

    const titleWords = this.contentWords(title);
    if (titleWords.length === 0) return false;

    let hits = 0;
    for (const tw of termWords) {
      if (titleWords.some((t) => t === tw || (Math.min(t.length, tw.length) >= 4 && (t.startsWith(tw) || tw.startsWith(t))))) {
        hits += 1;
      }
    }
    return hits >= this.requiredOverlap(termWords);
  }

  // --- In-memory cache -------------------------------------------------------
  // Identical definitional questions are extremely common, and the Wikipedia REST API
  // is a free but rate-limited public service. 30 minutes is plenty for encyclopedic
  // data, which changes far more slowly than news.
  private static readonly CACHE_TTL_MS = 30 * 60 * 1000;
  private static readonly CACHE_MAX = 200;
  private static readonly cache = new Map<string, { result: WikipediaResult; timestamp: number }>();

  /**
   * Clean and extract the core search subject/entity from a user query
   */
  public static extractSearchEntity(query: string): { term: string; lang: 'fa' | 'en' } {
    let text = (query || '').trim();

    // Strip common conversational or prompt boilerplate
    text = text.replace(/^(سلام|درود|لطفا|لطفاً|بی زحمت|بی‌زحمت|بگو|بفرمایید|برام بگو|می‌تونی بگی|می‌شه بگی)\s+/gi, '');
    
    // Strip Wikipedia mentions if present (though agent works even without it)
    text = text.replace(/(ویکی‌پدیا|ویکی پدیا|ویکیپدیا|wikipedia|wiki)/gi, '');

    // Strip question phrases
    text = text.replace(/(کیست|چیست|کی بود|چه کسی بود|کجاست|کجا واقع شده|چه نقشی داشت|چه کاری کرد|چگونه کار می‌کند|چطوری کار میکنه|معرفی کن|توضیح بده|درباره|در مورد|تاریخچه|زندگی‌نامه|زندگینامه|بیوگرافی|تعریف|مفهوم)\s*(\?|؟)?$/gi, '');
    text = text.replace(/^(توضیح بده درباره|در مورد|معرفی کن|تاریخچه|بیوگرافی|زندگینامه|تعریف|مفهوم|داستان)\s+/gi, '');

    text = text.trim();

    // Detect if the query is primarily English or Persian
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const lang: 'fa' | 'en' = englishChars > persianChars ? 'en' : 'fa';

    return { term: text.length > 0 ? text : query.trim(), lang };
  }

  /**
   * Detect if a user query is asking an encyclopedic, factual, scientific, biographical, or historical question
   */
  public static isEncyclopedicQuery(query: string): boolean {
    if (!query || query.trim().length < 2) return false;
    
    // Check for explicit question words or patterns
    const patterns = [
      /کیست|چیست|کی بود|چه کسی بود|چه بود/i,
      /تاریخچه|بیوگرافی|زندگینامه|زندگی‌نامه/i,
      /تعریف|مفهوم|فرمول|قانون|نظریه|تئوری/i,
      /پایتخت|جمعیت|موقعیت جغرافیایی|کجا واقع شده/i,
      /درباره\s+.+\s+(توضیح|بگو|معرفی)/i,
      /معرفی\s+.+/i,
      /در مورد\s+.+/i,
      /اختراع|کاشف|بنیان‌گذار|سازنده|نویسنده|دانشمند|فیلسوف|شاعر|پادشاه|سلسله/i,
      /who is|who was|what is|what are|explain|history of|biography of|define/i
    ];

    return patterns.some(p => p.test(query));
  }

  /**
   * Search and fetch summary from Wikipedia.
   *
   * Optimizations over the previous sequential version:
   *  - 30-minute in-memory cache, so a repeated question costs zero network calls and
   *    does not hammer the free (and rate-limited) Wikipedia API.
   *  - The Persian and English fallbacks are now fetched CONCURRENTLY instead of one
   *    after the other. The old code could spend 3 sequential requests (~18s worst
   *    case) before giving up.
   *  - Every candidate article must pass `isTitleRelevant()`. Without it a question
   *    like "قیمت ارز چنده" was answered with an encyclopedic article about currencies
   *    and injected as "اطلاعات موثق".
   */
  public static async searchAndSummarize(query: string): Promise<WikipediaResult> {
    const timeoutPromise = new Promise<WikipediaResult>((resolve) =>
      setTimeout(() => resolve({ found: false }), this.TIMEOUT)
    );
    return Promise.race([this.executeSearchAndSummarize(query), timeoutPromise]);
  }

  private static async executeSearchAndSummarize(query: string): Promise<WikipediaResult> {
    const { term, lang } = this.extractSearchEntity(query);
    if (!term || term.length < 2) {
      return { found: false };
    }

    const cacheKey = `${lang}:${this.normalize(term)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result;
    }

    /** Accept a candidate only when its title is actually about what was asked. */
    const accept = (res: WikipediaResult): WikipediaResult | null => {
      if (!res.found) return null;
      if (!this.isTitleRelevant(res.title || '', term)) {
        console.log(`[WikipediaAgent] Rejected off-topic article "${res.title}" for query "${term}"`);
        return null;
      }
      return res;
    };

    try {
      console.log(`[WikipediaAgent] Searching Wikipedia for entity: "${term}" (Primary lang: ${lang})`);

      // 1. Direct title lookup on the primary language — the cheapest and most precise path.
      const direct = accept(await this.fetchPageSummary(term, lang));
      if (direct) return this.remember(cacheKey, direct);

      // 2. Otherwise resolve the real title via fulltext search, running the Persian and
      //    English lookups at the same time instead of waiting for the first to fail.
      const otherLang: 'fa' | 'en' = lang === 'fa' ? 'en' : 'fa';
      const [primaryTitles, otherTitles] = await Promise.all([
        this.searchTitles(term, lang),
        this.searchTitles(term, otherLang),
      ]);

      const candidates: Array<{ title: string; lang: 'fa' | 'en' }> = [
        ...primaryTitles.map((title) => ({ title, lang })),
        ...otherTitles.map((title) => ({ title, lang: otherLang })),
      ];

      const results = await Promise.all(
        candidates.map(async (c) => accept(await this.fetchPageSummary(c.title, c.lang)))
      );
      const hit = results.find((r): r is WikipediaResult => r !== null);
      if (hit) return this.remember(cacheKey, hit);

      return this.remember(cacheKey, { found: false });
    } catch (err: any) {
      console.warn(`[WikipediaAgent] Search error for "${term}":`, err?.message || err);
      return { found: false };
    }
  }

  /** Store in the LRU cache and return the value. */
  private static remember(cacheKey: string, result: WikipediaResult): WikipediaResult {
    if (this.cache.size >= this.CACHE_MAX) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  /**
   * Fetch page summary using Wikipedia REST API v1
   */
  private static async fetchPageSummary(title: string, lang: 'fa' | 'en'): Promise<WikipediaResult> {
    try {
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) return { found: false };

      const data = await response.json();
      if (data && data.extract && data.extract.trim().length > 20) {
        return {
          found: true,
          title: data.title,
          description: data.description || '',
          extract: data.extract,
          url: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
          lang
        };
      }
    } catch (e) {}
    return { found: false };
  }

  /**
   * Search matching titles using the Wikipedia Search REST API.
   *
   * Previously this returned only `pages[0]` and trusted it blindly. It now returns
   * several candidates, each already filtered by `isTitleRelevant()`, so a fuzzy fulltext
   * match ("قیمت ارز" matching an article about currency units) can no longer be injected
   * as if it were an answer to the user's question.
   */
  private static async searchTitles(query: string, lang: 'fa' | 'en'): Promise<string[]> {
    try {
      const url = `https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=5`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) return [];

      const data = await response.json();
      const pages: any[] = Array.isArray(data?.pages) ? data.pages : [];

      return pages
        .map((p) => p?.title)
        .filter((title): title is string => typeof title === 'string' && title.length > 0)
        .filter((title) => this.isTitleRelevant(title, query));
    } catch (e) {}
    return [];
  }

  /**
   * Formats the Wikipedia grounding result into a clean context block for LLM prompt injection
   */
  public static formatForContext(res: WikipediaResult): string {
    if (!res.found || !res.extract) return '';

    const langName = res.lang === 'fa' ? 'فارسی' : 'انگلیسی';
    let output = `\n\n[اطلاعات دانشنامه‌ای موثق از دانشنامه ویکی‌پدیا (ویکی‌پدیای ${langName}):\n`;
    output += `عنوان: ${res.title}\n`;
    if (res.description) {
      output += `موضوع: ${res.description}\n`;
    }
    output += `چکیده مقاله:\n${res.extract.trim()}\n`;
    if (res.url) {
      output += `\n📌 منبع اصلی دانشنامه: [ویکی‌پدیا - ${res.title}](${res.url})\n`;
    }
    output += `]`;

    return output;
  }
}
