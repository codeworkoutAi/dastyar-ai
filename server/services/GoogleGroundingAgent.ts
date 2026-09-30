import { getGeminiClient } from './utils';

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

    try {
      console.log(`[GoogleGroundingAgent] Searching live Google for: "${query.substring(0, 100)}"...`);

      const apiKey = customApiKey
        || process.env.GEMINI_SEARCH_KEY
        || process.env.GEMINI_API_KEY
        || process.env.DEFAULT_GEMINI_KEY;

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

      const prompt = `شما یک دستیار جستجوی سریع هستید.
موضوع جستجو: "${searchQuery}"

وظیفه شما: 
فقط در اینترنت جستجو کنید و مهم‌ترین فکت‌ها، داده‌ها، قیمت‌ها یا اخبار زنده را در قالب چند بولت‌پوینتِ بسیار کوتاه (تیتروار) لیست کنید.
به هیچ وجه مقدمه، موخره یا پاراگراف طولانی ننویسید تا زمان پردازش حداقل شود. سرعت اولویت اول است!`;

      const model = process.env.GEMINI_GROUNDING_MODEL || 'gemini-3.6-flash';
      if (!process.env.GEMINI_GROUNDING_MODEL) {
        // Without this warning, an invalid fallback model fails inside `catch`, returns
        // an empty string, and web search silently turns off with no visible cause.
        console.warn('[GoogleGroundingAgent] GEMINI_GROUNDING_MODEL is not set — falling back to ' + model);
      }
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1, // Lower temperature for faster, deterministic output
        },
      });

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
      return '';
    }
  }
}
