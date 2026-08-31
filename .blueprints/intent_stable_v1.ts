import express from 'express';
import { isSafeBaseUrl, getGeminiClient, normalizeBaseUrl, parseCustomHeaders } from '../services/utils';

const router = express.Router();

router.post('/api/chat/detect-intent', async (req, res) => {
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
    const userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

    if (!userText || userText.trim().length === 0) {
      return res.json({ webSearch: false, intent: 'general' });
    }

    const systemPrompt = `You are a highly accurate AI router. Output ONLY a raw JSON object.
Schema: {"webSearch": boolean, "intent": "coding" | "vision" | "general"}

Rules for "webSearch" (Definitive Triggers):
- Set to TRUE if the user asks for: live internet data, recent news, current weather, up-to-date prices, recent events, deep research on specific topics, fact-checking, or writing comprehensive articles about trends (e.g. "AI in 2025/2026", "history of...").
- Set to FALSE if the request is a simple greeting, basic math, pure coding without needing external library documentation, or summarizing/translating text provided by the user.

Examples:
- "قیمت دلار چنده؟" -> {"webSearch": true, "intent": "general"}
- "یک مقاله درباره آینده برنامه‌نویسی با هوش مصنوعی بنویس" -> {"webSearch": true, "intent": "general"}
- "سلام، حالت چطوره؟" -> {"webSearch": false, "intent": "general"}
- "کد ریکت برای دکمه بنویس" -> {"webSearch": false, "intent": "coding"}
- "آب و هوای تهران" -> {"webSearch": true, "intent": "general"}

Do not wrap in markdown. Raw JSON only.`;

    const promptText = `User Message: "${userText}"`;

    if (provider === 'gemini') {
      const ai = getGeminiClient(apiConfig?.[provider]?.apiKey);
      let modelName = apiConfig?.[provider]?.modelName || 'gemini-3.1-flash-lite';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + promptText }] }
        ],
        config: {
          temperature: 0.1,
          topP: 0.8,
        }
      });
      
      const text = response.text || '';
      return res.json(parseLLMJsonResponse(text, userText));

    } else {
      // DeepSeek / OpenAI / Custom
      if (apiConfig?.[provider]?.baseUrl && !isSafeBaseUrl(apiConfig?.[provider]?.baseUrl)) {
        return res.json({ webSearch: false, intent: 'general' });
      }

      const baseUrl = normalizeBaseUrl(apiConfig?.[provider]?.baseUrl, provider);
      if (!baseUrl) {
        return res.json({ webSearch: false, intent: 'general' });
      }

      const endpoint = provider === 'anthropic' ? `${baseUrl}/messages` : `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiConfig?.[provider]?.apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = String(apiConfig[provider].apiKey).trim();
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${String(apiConfig[provider]?.apiKey).trim()}`;
        }
      } else {
        if (provider === 'custom') {
          const requestedModel = apiConfig?.[provider]?.modelName || '';
          const allowedGroqModels = ['qwen/qwen3.6-27b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'allam-2-7b', 'groq/compound'];
          const allowedGeminiModels = ['gemini-3.1-flash-lite', 'gemini-1.5-flash'];
          const groqKey = process.env.DEFAULT_GROQ_KEY || process.env.GROQ_API_KEY;
          const geminiKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY;
          
          if (allowedGroqModels.includes(requestedModel.toLowerCase()) && groqKey) {
            headers['Authorization'] = `Bearer ${groqKey}`;
          } else if (allowedGeminiModels.includes(requestedModel.toLowerCase()) && geminiKey) {
            headers['Authorization'] = `Bearer ${geminiKey}`;
          }
        }
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Persian AI Chatbox';
      }

      const userHeaders = parseCustomHeaders(apiConfig?.custom?.customHeaders);
      Object.assign(headers, userHeaders);

      let model = apiConfig?.[provider]?.modelName;
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
          max_tokens: 150,
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
        return res.json({ webSearch: false, intent: 'general' });
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
    return res.json({ webSearch: false, intent: 'general' });
  }
});

function parseLLMJsonResponse(text: string, userText: string) {
  let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (cleanText.startsWith('\`\`\`json')) {
    cleanText = cleanText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
  } else if (cleanText.startsWith('\`\`\`')) {
    cleanText = cleanText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
  }

  // DEFINITIVE SOLUTION: Hybrid Heuristics Override
  // To bypass unpredictable free LLM models, we enforce a definitive regex fallback.
  const definitiveWebSearchTriggers = /اخبار|خبر|قیمت|آب و هوا|آب‌وهوا|مقاله|تحقیق|درباره|سرچ|جستجو|امروز|تاریخ|جدیدترین|آپدیت|به روز|به‌روز/i;
  const isDefinitiveWebSearch = definitiveWebSearchTriggers.test(userText);

  try {
    const parsed = JSON.parse(cleanText);
    return {
      webSearch: isDefinitiveWebSearch || !!parsed.webSearch,
      intent: ['coding', 'vision', 'general'].includes(parsed.intent) ? parsed.intent : 'general'
    };
  } catch (e) {
    console.error('[Intent Router] Failed to parse JSON:', text);
    return { webSearch: isDefinitiveWebSearch, intent: 'general' };
  }
}

export default router;
