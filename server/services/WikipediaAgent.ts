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
  private static readonly TIMEOUT = 6000;
  private static readonly USER_AGENT = 'DastyarAI/1.0 (https://dastyarai.com; info@dastyarai.com)';

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
   * Search and fetch summary from Wikipedia (first Persian, then English fallback if applicable)
   */
  public static async searchAndSummarize(query: string): Promise<WikipediaResult> {
    const { term, lang } = this.extractSearchEntity(query);
    if (!term || term.length < 2) {
      return { found: false };
    }

    try {
      console.log(`[WikipediaAgent] Searching Wikipedia for entity: "${term}" (Primary lang: ${lang})`);

      // 1. Try primary language
      let res = await this.fetchPageSummary(term, lang);
      if (res.found) return res;

      // 2. If not found in primary and it was Persian, try searching via fulltext API in Persian
      if (lang === 'fa') {
        const searchTitle = await this.searchTitle(term, 'fa');
        if (searchTitle) {
          res = await this.fetchPageSummary(searchTitle, 'fa');
          if (res.found) return res;
        }

        // 3. Fallback to English if Persian had no results
        const enTitle = await this.searchTitle(term, 'en');
        if (enTitle) {
          res = await this.fetchPageSummary(enTitle, 'en');
          if (res.found) return res;
        }
      } else {
        // Primary was English, search title
        const searchTitle = await this.searchTitle(term, 'en');
        if (searchTitle) {
          res = await this.fetchPageSummary(searchTitle, 'en');
          if (res.found) return res;
        }
      }

      return { found: false };
    } catch (err: any) {
      console.warn(`[WikipediaAgent] Search error for "${term}":`, err?.message || err);
      return { found: false };
    }
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
   * Search matching title using Wikipedia Search REST API
   */
  private static async searchTitle(query: string, lang: 'fa' | 'en'): Promise<string | null> {
    try {
      const url = `https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=3`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) return null;

      const data = await response.json();
      const firstPage = data?.pages?.[0];
      if (firstPage && firstPage.title) {
        return firstPage.title;
      }
    } catch (e) {}
    return null;
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
