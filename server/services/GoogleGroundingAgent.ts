import { getGeminiClient, blacklistKey, getGeminiKeyFromPool } from './utils';

export interface GroundingSource {
  title?: string;
  url?: string;
}

export class GoogleGroundingAgent {
  /**
   * Performs a live web search using Google's native Search Grounding capability.
   * This works as a universal "Researcher" agent that retrieves real-time information
   * for ANY main model (Gemini, Claude, GPT, Llama, etc.) via RAG injection.
   *
   * Uses GEMINI_SEARCH_KEY if available, otherwise falls back to GEMINI_API_KEY.
   */
  public static async search(query: string, customApiKey?: string): Promise<string> {
    if (!query || query.trim().length === 0) return '';

    let apiKey = customApiKey
      || process.env.GEMINI_SEARCH_KEY
      || process.env.GEMINI_API_KEY
      || process.env.DEFAULT_GEMINI_KEY;

    const primaryModel = process.env.GEMINI_GROUNDING_MODEL || 'gemini-3.5-flash-lite';

    if (!apiKey) {
      apiKey = getGeminiKeyFromPool([], primaryModel) || undefined;
    }

    try {
      console.log(`[GoogleGroundingAgent] Searching live Google for: "${query.substring(0, 100)}"...`);

      const ai = getGeminiClient(apiKey, true);

      // NOTE: no `site:` operator and no allowlist on purpose.
      //
      // This used to OR-join every category of `server/allowed_domains.json` into one
      // `site:` filter, which *forced* a foreign-policy question to retrieve pages from
      // tgju.org (gold/currency) and coingecko.com. Those pages were injected as
      // "منابع" and the model faithfully cited them — the model was not hallucinating,
      // we were feeding it the wrong sources. Gemini Search Grounding already ranks
      // results by relevance to the query, so restricting domains only made recall
      // worse. Search the open web and let the engine do the filtering.
      const searchQuery = query;

      let nowTehran = '';
      try {
        nowTehran = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          timeZone: 'Asia/Tehran',
          dateStyle: 'full',
        }).format(new Date());
      } catch {
        nowTehran = new Date().toISOString().split('T')[0];
      }

      const prompt = `شما یک دستیار جستجوی وب سریع هستید.
امروز: ${nowTehran}
موضوع جستجو: "${searchQuery}"

وظیفه شما: 
فقط با ابزار موتور جستجوی گوگل در اینترنت جستجو کنید و تازه‌ترین و دقیق‌ترین فکت‌ها، داده‌ها، قیمت‌ها یا اخبار زنده را در قالب چند بولت‌پوینتِ کوتاه و کلیدی لیست کنید.
به هیچ وجه مقدمه، موخره یا پاراگراف طولانی ننویسید تا زمان پردازش حداقل شود.`;

      const timeoutMs = parseInt(process.env.GEMINI_GROUNDING_TIMEOUT_MS || '15000', 10);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`GoogleGroundingAgent timeout after ${timeoutMs}ms`)), timeoutMs)
      );

      let response: any = null;
      try {
        response = await Promise.race([
          ai.models.generateContent({
            model: primaryModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 0.1, // Lower temperature for faster, deterministic output
            },
          }),
          timeoutPromise,
        ]);
      } catch (primaryErr: any) {
        if (primaryModel !== 'gemini-3.6-flash' && !String(primaryErr?.message || '').includes('timeout')) {
          console.warn(`[GoogleGroundingAgent] Model ${primaryModel} failed, trying fallback gemini-3.6-flash:`, primaryErr?.message || primaryErr);
          response = await Promise.race([
            ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
              },
            }),
            timeoutPromise,
          ]);
        } else {
          throw primaryErr;
        }
      }

      const summary = response.text || '';
      if (!summary || summary.trim().length === 0) {
        console.warn('[GoogleGroundingAgent] Empty response from Google Search Grounding.');
        return '';
      }

      // Extract grounding sources if available.
      // `groundingSupports` is the authoritative relevance signal: it tells us which
      // span of the answer was actually derived from which chunk. Sources that do not
      // appear in any support were NOT used, so they must not be offered to the model
      // as citable — that is what used to produce irrelevant citations.
      const candidate = response.candidates?.[0];
      const groundingMetadata = (candidate as any)?.groundingMetadata;
      const webChunks: any[] = groundingMetadata?.groundingChunks || [];
      const supports: any[] = groundingMetadata?.groundingSupports || [];
      const sources: GroundingSource[] = [];

      for (const chunk of webChunks) {
        if (chunk?.web?.uri) {
          sources.push({ title: chunk.web.title || 'منبع وب', url: chunk.web.uri });
        }
      }

      // Map chunk index -> supporting text, so each source carries the evidence behind it.
      const evidence = new Map<number, string[]>();
      for (const support of supports) {
        const text = typeof support?.segment?.text === 'string' ? support.segment.text.trim() : '';
        const indices: number[] = Array.isArray(support?.groundingChunkIndices)
          ? support.groundingChunkIndices
          : [];
        for (const index of indices) {
          if (!evidence.has(index)) evidence.set(index, []);
          if (text) evidence.get(index)!.push(text);
        }
      }

      let formattedContext = `\n\n[اطلاعات زنده و به‌روز استخراج‌شده از موتور جستجوی گوگل (Google Live Search):\n${summary.trim()}`;

      if (sources.length > 0) {
        // Keep only sources the engine actually grounded its answer in. If the model did
        // not return groundingSupports (older API behaviour), fall back to every source
        // rather than silently dropping all citations.
        const usedIndices = evidence.size > 0
          ? new Set([...evidence.keys()])
          : new Set(sources.map((_, i) => i));

        // Deduplicate by normalized URL, by normalized outlet name, and by domain
        // (max one link per media outlet) so the model never sees a padded list
        // that it would then echo back as duplicate citations.
        const seenUrls = new Set<string>();
        const seenTitles = new Set<string>();
        const seenDomains = new Set<string>();
        const unique = sources
          .map((s, index) => ({ source: s, index }))
          .filter(({ index }) => usedIndices.has(index))
          .filter(({ source: s }) => {
            const urlKey = s.url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
            const titleKey = s.title.replace(/[\s\u00a0\u200c]+/g, ' ').trim().toLowerCase();
            const domain = urlKey.split('/')[0];
            if (!urlKey || seenUrls.has(urlKey) || seenTitles.has(titleKey) || seenDomains.has(domain)) return false;
            seenUrls.add(urlKey);
            seenTitles.add(titleKey);
            seenDomains.add(domain);
            return true;
          })
          .slice(0, 5);

        if (unique.length > 0) {
          const lines = unique.map(({ source: s, index }) => {
            const snippet = (evidence.get(index) || []).join(' ').slice(0, 300);
            return snippet ? `- [${s.title}](${s.url}) — شواهد: ${snippet}` : `- [${s.title}](${s.url})`;
          });
          formattedContext += `\n\n📌 **منابع (فقط همین‌ها پشتوانهٔ پاسخ بالا هستند):**\n${lines.join('\n')}`;
        }
      }

      formattedContext += `\n]`;
      console.log(`[GoogleGroundingAgent] Done. ${summary.length} chars, ${sources.length} sources.`);
      return formattedContext;

    } catch (error: any) {
      console.error('[GoogleGroundingAgent] Grounding search failed:', error?.message || error);
      const errMsg = String(error?.message || error);
      const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      const is401 = errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Invalid API Key');
      const is403 = errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID');
      if (apiKey && (is429 || is401 || is403)) {
        blacklistKey(apiKey, is429 ? '429' : (is401 ? '401' : '403'), undefined, is429 ? primaryModel : undefined);
      }
      return '';
    }
  }
}
