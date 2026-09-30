export class ToolsAgent {
  private static readonly TIMEOUT = 10000;

  /**
   * NOTE: there is deliberately no `getWeather()`.
   *
   * It used to scrape wttr.in and was the only source for weather questions. Google
   * Search Grounding now covers weather as part of the normal live layer, which is more
   * current and actually cited, so the scraper only added latency plus a silent failure
   * mode. Weather questions fall through to Grounding, and the intent router's "weather"
   * tool no longer disables the live layer (see chatStore.ts).
   */

  /**
   * Scrapes free market currency and gold rates from tgju.org
   */
  static async getCurrency(): Promise<string> {
    try {
      console.log(`[ToolsAgent] Fetching currency from TGJU...`);
      const response = await fetch('https://www.tgju.org/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) return '';

      const html = await response.text();
      let results = '[ابزار قیمت ارز و طلا (بازار آزاد ایران)]\n';
      
      // Helper to extract by data-market-row id
      const extract = (id: string, name: string) => {
        const r1 = new RegExp(`data-price="([^"]+)"[^>]*data-market-row="${id}"`, 'i');
        const r2 = new RegExp(`data-market-row="${id}"[^>]*data-price="([^"]+)"`, 'i');
        const match = html.match(r1) || html.match(r2);
        
        if (match) {
          const val = match[1].trim();
          results += `- ${name}: ${val} ریال\n`;
        }
      };

      extract('price_dollar_rl', 'دلار آمریکا (آزاد)');
      extract('price_eur', 'یورو');
      extract('price_aed', 'درهم امارات');
      extract('price_try', 'لیر ترکیه');
      extract('sekee', 'سکه امامی');
      extract('sekeb', 'سکه بهار آزادی');
      extract('half', 'نیم سکه');
      extract('quarter', 'ربع سکه');
      extract('geram18', 'طلای 18 عیار (گرم)');
      extract('mesghal', 'مثقال طلا');

      return results;
    } catch (error) {
      console.error('[ToolsAgent] Currency Scraping Error:', error);
      return '';
    }
  }

  static async getDigikalaProduct(query: string): Promise<string> {
    try {
      console.log(`[ToolsAgent] Fetching Digikala product for query: ${query}`);
      // Extract numeric PID from Digikala URL or query
      const pidMatch = query.match(/(?:dkp-|product\/)(\d+)/i) || query.match(/\b(\d{5,9})\b/);
      const pid = pidMatch ? pidMatch[1] : null;

      if (!pid) {
        return '[ابزار دیجی‌کالا]\nشناسه محصول (DKP) یا لینک معتبر دیجی‌کالا در درخواست شما یافت نشد.';
      }

      const response = await fetch(`https://api.digikala.com/v1/product/${pid}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.81 Safari/537.36'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Digikala API status: ${response.status}`);
      }

      const data = await response.json();
      const product = data?.data?.product;
      
      if (!product) {
        return '[ابزار دیجی‌کالا]\nمحصول مورد نظر یافت نشد یا در دسترس نیست.';
      }

      const title = product.title_fa || product.title_en || 'نامشخص';
      const status = product.status; // 'marketable' or 'out_of_stock'
      const price = product.default_variant?.price?.selling_price;
      const discount = product.default_variant?.price?.discount_percent;
      const rrp_price = product.default_variant?.price?.rrp_price;
      const seller = product.default_variant?.seller?.title;
      const rating = product.rating?.rate;
      const count = product.rating?.count;

      let result = `[ابزار دیجی‌کالا]\n`;
      result += `- نام محصول: ${title}\n`;
      result += `- شناسه (DKP): ${pid}\n`;
      
      if (status === 'marketable' && price) {
        result += `- وضعیت: موجود\n`;
        result += `- فروشنده: ${seller || 'نامشخص'}\n`;
        result += `- قیمت فروش: ${Number(price).toLocaleString('fa-IR')} ریال\n`;
        if (discount > 0) {
          result += `- قیمت اصلی: ${Number(rrp_price).toLocaleString('fa-IR')} ریال (درصد تخفیف: ${discount}٪)\n`;
        }
      } else {
        result += `- وضعیت: ناموجود\n`;
      }

      if (rating) {
        result += `- امتیاز کاربران: ${rating} از ۵ (تعداد نظرات: ${count})\n`;
      }
      
      const properties = product.review?.attributes?.map((attr: any) => `${attr.title}: ${attr.values?.map((v:any)=>v.title).join(', ')}`) || [];
      if (properties.length > 0) {
        result += `- ویژگی‌های کلیدی:\n  * ${properties.slice(0, 5).join('\n  * ')}\n`;
      }

      return result;
    } catch (error) {
      console.error('[ToolsAgent] Error fetching Digikala:', error);
      return '[ابزار دیجی‌کالا]\nمتاسفانه ارتباط با سرور دیجی‌کالا برقرار نشد. لطفا بعدا تلاش کنید.';
    }
  }

  /**
   * Fetches encyclopedic summaries from Wikipedia (Persian / English)
   */
  static async getWikipedia(query: string): Promise<string> {
    const { WikipediaAgent } = await import('./WikipediaAgent');
    const res = await WikipediaAgent.searchAndSummarize(query);
    return WikipediaAgent.formatForContext(res);
  }

  /**
   * Fetches domain-specific knowledge from SpecializedKnowledgeService
   * (Religions, Quran, Bible, Ganjoor Poetry, Cinema, Sports, Health, Botany)
   */
  static async getSpecializedKnowledge(query: string): Promise<string> {
    const { SpecializedKnowledgeService } = await import('./SpecializedKnowledgeService');
    return SpecializedKnowledgeService.resolveSpecializedKnowledge(query);
  }
}


