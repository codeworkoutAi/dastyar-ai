import { getGeminiClient } from './utils';

import fs from 'fs';
import path from 'path';

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

      // Read allowed domains from JSON
      let siteOperators = '';
      try {
        const domainsPath = path.join(process.cwd(), 'server', 'allowed_domains.json');
        if (fs.existsSync(domainsPath)) {
          let content = fs.readFileSync(domainsPath, 'utf8');
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
          }
          const jsonConfig = JSON.parse(content);
          
          let domains: string[] = [];
          if (Array.isArray(jsonConfig.allowed_domains)) {
            // Legacy flat format
            domains = jsonConfig.allowed_domains;
          } else {
            // Categorized format
            for (const key in jsonConfig) {
              if (Array.isArray(jsonConfig[key])) {
                domains.push(...jsonConfig[key]);
              }
            }
          }
          
          if (domains.length > 0) {
            // Dedup and format
            const uniqueDomains = [...new Set(domains.map(d => d.trim()).filter(d => d.length > 0))];
            if (uniqueDomains.length > 0) {
              siteOperators = uniqueDomains.map(d => `site:${d}`).join(' OR ');
            }
          }
        }
      } catch (err) {
        console.error('[GoogleGroundingAgent] Error reading allowed domains:', err);
      }

      const searchQuery = siteOperators ? `${query} ${siteOperators}` : query;

      const prompt = `شما یک دستیار جستجوی سریع هستید.
موضوع جستجو: "${searchQuery}"

وظیفه شما: 
فقط در اینترنت جستجو کنید و مهم‌ترین فکت‌ها، داده‌ها، قیمت‌ها یا اخبار زنده را در قالب چند بولت‌پوینتِ بسیار کوتاه (تیتروار) لیست کنید.
به هیچ وجه مقدمه، موخره یا پاراگراف طولانی ننویسید تا زمان پردازش حداقل شود. سرعت اولویت اول است!`;

      const model = process.env.GEMINI_GROUNDING_MODEL || 'gemini-3.6-flash';
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

      // Extract grounding sources if available
      const candidate = response.candidates?.[0];
      const groundingMetadata = (candidate as any)?.groundingMetadata;
      const webChunks: any[] = groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = [];

      for (const chunk of webChunks) {
        if (chunk?.web?.uri) {
          sources.push({ title: chunk.web.title || 'منبع وب', url: chunk.web.uri });
        }
      }

      let formattedContext = `\n\n[اطلاعات زنده و به‌روز استخراج‌شده از موتور جستجوی گوگل (Google Live Search):\n${summary.trim()}`;

      if (sources.length > 0) {
        const unique = Array.from(new Map(sources.map(s => [s.url, s])).values()).slice(0, 5);
        formattedContext += `\n\n📌 منابع:\n` + unique.map(s => `- [${s.title}](${s.url})`).join('\n');
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
