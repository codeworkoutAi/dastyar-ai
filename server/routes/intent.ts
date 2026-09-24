import express from 'express';
import { isSafeBaseUrl, getGeminiClient, normalizeBaseUrl, parseCustomHeaders } from '../services/utils';
import { modelDiscovery } from '../services/modelDiscovery';
import { aiRouteLimiter } from '../middleware/rateLimiter';
import db from '../db/database';
import { keyRotator } from '../services/keyRotator';

const router = express.Router();

router.post('/api/chat/detect-intent', aiRouteLimiter, async (req, res) => {
  let userText = '';
  try {
    const { messages, apiConfig: rawApiConfig, settings } = req.body;

    const apiConfig = rawApiConfig || (settings ? {
      activeProvider: settings.providers?.activeProvider,
      gemini: settings.providers?.gemini,
      openai: settings.providers?.openai,
      anthropic: settings.providers?.anthropic,
      custom: settings.providers?.custom,
    } : undefined);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.json({ webSearch: false, intent: 'general' });
    }

    let provider = apiConfig?.activeProvider || 'gemini';

    if (provider === 'custom' && apiConfig?.custom?.baseUrl) {
      const bUrl = apiConfig.custom.baseUrl.toLowerCase();
      if (bUrl.includes('anthropic.com')) {
        provider = 'anthropic';
        apiConfig.anthropic = { ...apiConfig.custom };
      } else if (bUrl.includes('generativelanguage.googleapis.com')) {
        provider = 'gemini';
        apiConfig.gemini = { ...apiConfig.custom };
      }
    }

    const lastUserMsg = messages.slice().reverse().find((m: any) => m.role === 'user');
    userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

    if (!userText || userText.trim().length === 0) {
      return res.json({ webSearch: false, intent: 'general' });
    }

    const systemPrompt = `You are a highly accurate AI router. Output ONLY a raw JSON object.
Schema: {"webSearch": boolean, "tool": "none" | "weather" | "currency" | "digikala", "intent": "coding" | "vision" | "general" | "blocked"}

Rules for "intent":
- "blocked": if the user asks for inappropriate content (pornography, explicit violence, illegal acts) or completely irrelevant non-programming topics (e.g., cooking recipes, personal advice).
- Otherwise, use "coding", "vision", or "general" as appropriate.

Rules for "tool":
- "weather": if the user asks for the current weather, temperature, or climate of a city.
- "currency": if the user asks for the current price of Dollar, Euro, Gold (طلا), or Coin (سکه).
- "digikala": if the user provides a Digikala link (digikala.com) or a DKP (product ID), or explicitly asks for the price/details of a product on Digikala.
- "none": if neither of the above apply.

Rules for "webSearch" (Definitive Triggers):
- Set to TRUE ONLY if the user EXPLICITLY asks for: today's live news, current events from recent days, or up-to-date prices (other than currency/gold/digikala).
- Set to FALSE for ALL general knowledge questions, history, science, coding, fact-checking, writing articles, or deep research on static topics. The AI must rely on its internal knowledge for these to save resources.
- Set to FALSE if a specific "tool" is selected (like weather, currency, or digikala).
- Set to FALSE if the request is a simple greeting, basic math, pure coding, or summarizing text provided by the user.

Examples:
- "دستور پخت قرمه‌سبزی" -> {"webSearch": false, "tool": "none", "intent": "blocked"}
- "یک سایت پورن معرفی کن" -> {"webSearch": false, "tool": "none", "intent": "blocked"}
- "قیمت دلار چنده؟" -> {"webSearch": false, "tool": "currency", "intent": "general"}
- "یک مقاله درباره آینده هوش مصنوعی بنویس" -> {"webSearch": false, "tool": "none", "intent": "general"}
- "پایتخت فرانسه کجاست؟" -> {"webSearch": false, "tool": "none", "intent": "general"}
- "آب و هوای تهران" -> {"webSearch": false, "tool": "weather", "intent": "general"}
- "قیمت این محصول دیجی کالا https://www.digikala.com/product/dkp-12345/" -> {"webSearch": false, "tool": "digikala", "intent": "general"}
- "سلام" -> {"webSearch": false, "tool": "none", "intent": "general"}
- "کد ریکت بنویس" -> {"webSearch": false, "tool": "none", "intent": "coding"}

Do not wrap in markdown. Raw JSON only.`;

    const promptText = `User Message: "${userText}"`;

    if (provider === 'gemini') {
      const ai = getGeminiClient(apiConfig?.[provider]?.apiKey);
      // We force a fast, non-thinking model for Intent Routing to prevent <think> tags from breaking JSON
      let modelName = process.env.GEMINI_INTENT_MODEL || 'gemini-3.6-flash';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + promptText }] }
        ],
        config: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 50,
        }
      });
      
      const text = response.text || '';
      return res.json(parseLLMJsonResponse(text, userText));

    } else {
      // DeepSeek / OpenAI / Custom
      let targetBaseUrl = apiConfig?.[provider]?.baseUrl || '';
      let targetModel = apiConfig?.[provider]?.modelName || '';
      let targetApiKey = apiConfig?.[provider]?.apiKey || '';

      if (provider === 'custom') {
        const profileId = apiConfig?.custom?.activeProfileId || apiConfig?.custom?.id;
        if (profileId) {
          const profileResult = db.prepare('SELECT * FROM default_profiles WHERE id = ?').get(profileId) as any;
          if (profileResult) {
            targetBaseUrl = profileResult.baseUrl;
            targetModel = profileResult.modelName;
            targetApiKey = profileResult.apiKey;

            if (targetApiKey === '[AUTO_POOL]') {
              const poolKey = keyRotator.getNextKey();
              if (poolKey) {
                targetApiKey = poolKey.apiKey;
                targetBaseUrl = poolKey.baseUrl;
                // Auto-detect best model for the slot
                targetModel = await modelDiscovery.getBestModelForRole(poolKey, profileId, 'gpt-4o-mini');
              }
            }
          }
        }
      }

      if (targetBaseUrl && !isSafeBaseUrl(targetBaseUrl)) {
        return res.json({ webSearch: false, intent: 'general' });
      }

      const baseUrl = normalizeBaseUrl(targetBaseUrl, provider);
      if (!baseUrl) {
        return res.json({ webSearch: false, intent: 'general' });
      }

      const endpoint = provider === 'anthropic' ? `${baseUrl}/messages` : `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (targetApiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = String(targetApiKey).trim();
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${String(targetApiKey).trim()}`;
        }
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Persian AI Chatbox';
      }

      const userHeaders = parseCustomHeaders(apiConfig?.custom?.customHeaders);
      Object.assign(headers, userHeaders);

      let model = targetModel;
      if (!model) {
        if (provider === 'deepseek') model = 'deepseek-chat';
        else if (provider === 'openai') model = 'gpt-4o-mini';
        else if (provider === 'openrouter') model = 'meta-llama/llama-3.3-70b-instruct';
        else model = 'gpt-4o-mini';
      }

      let reqBody: any;
      if (provider === 'anthropic') {
        reqBody = {
          model,
          messages: [{ role: 'user', content: promptText }],
          system: systemPrompt,
          max_tokens: 800,
          temperature: 0.1
        };
      } else {
        reqBody = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText }
          ],
          temperature: 0.1,
          max_tokens: 150,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        return res.json(parseLLMJsonResponse('', userText));
      }

      const data = await response.json();
      let text = '';
      if (provider === 'anthropic') {
        text = data.content?.[0]?.text || '';
      } else {
        text = data.choices?.[0]?.message?.content || '';
      }

      return res.json(parseLLMJsonResponse(text, userText));
    }
  } catch (err) {
    console.error('[Intent Router] Error:', err);
    return res.json(parseLLMJsonResponse('', userText));
  }
});

function parseLLMJsonResponse(text: string, userText: string) {
  // Strip <think> tags that some models inject
  let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  if (cleanText.startsWith('\`\`\`json')) {
    cleanText = cleanText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
  } else if (cleanText.startsWith('\`\`\`')) {
    cleanText = cleanText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
  }

  // DEFINITIVE SOLUTION: Hybrid Heuristics Override
  // To bypass unpredictable free LLM models, we enforce a definitive regex fallback.
  const definitiveWebSearchTriggers = /اخبار|خبر|قیمت|آب و هوا|آب‌وهوا|مقاله|تحقیق|درباره|سرچ|جستجو|امروز|تاریخ|جدیدترین|آپدیت|به روز|به‌روز|دسترسی به وب|دسترسی به اینترنت|وصل به اینترنت|اینترنت داری|به اینترنت وصلی|آنلاین هستی|وب رو چک کن|دسترسی داری|ویکی|دانشنامه|کیست|چیست|کی بود|چه کسی بود|چه بود|تاریخچه|بیوگرافی|زندگینامه|تعریف|سوره|آیه|قرآن|انجیل|تورات|کتاب مقدس|شعر|شاعر|بیت|غزل|قصیده|دیوان|حافظ|سعدی|مولانا|فردوسی|خیام|گنجور|فیلم|سریال|کارگردان|بازیگر|سینما|اسکار|فوتبال|باشگاه|استقلال|پرسپولیس|لیگ|روانشناسی|روان‌درمانی|دارو|عوارض|گیاه|باغبانی|آبیاری/i;
  let isDefinitiveWebSearch = definitiveWebSearchTriggers.test(userText);
  let heuristicTool = 'none';

  if (/آب و هوا|آب‌وهوا|دما|هوا/i.test(userText)) {
    heuristicTool = 'weather';
    isDefinitiveWebSearch = false; // Override web search if specific tool is matched
  } else if (/دلار|ارز|سکه|طلا|یورو/i.test(userText) && /قیمت/i.test(userText)) {
    heuristicTool = 'currency';
    isDefinitiveWebSearch = false; // Override web search if specific tool is matched
  } else if (/دیجی‌کالا|دیجی کالا|digikala\.com|dkp-/i.test(userText)) {
    heuristicTool = 'digikala';
    isDefinitiveWebSearch = false;
  }

  try {
    const parsed = JSON.parse(cleanText);
    const resolvedTool = (parsed.tool && parsed.tool !== 'none') ? parsed.tool : heuristicTool;
    return {
      webSearch: resolvedTool === 'none' ? (isDefinitiveWebSearch || !!parsed.webSearch) : false,
      tool: resolvedTool,
      intent: ['coding', 'vision', 'general'].includes(parsed.intent) ? parsed.intent : 'general'
    };
  } catch (e) {
    console.error('[Intent Router] Failed to parse JSON:', text);
    return { 
      webSearch: heuristicTool === 'none' ? isDefinitiveWebSearch : false, 
      tool: heuristicTool, 
      intent: 'general' 
    };
  }
}

export default router;
