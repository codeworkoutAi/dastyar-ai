import express from 'express';
import { isSafeBaseUrl, getGeminiClient, extractCleanErrorMessage, sanitizeErrorMessage, normalizeBaseUrl, parseCustomHeaders } from '../services/utils';
import { modelTestRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Test Connection & Benchmark Latency endpoint
router.post(['/api/models/test', '/api/ping'], modelTestRateLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    let { provider, customBaseUrl, customApiKey, customHeaders, modelName } = req.body;

    // Auto-detect native official providers from custom profiles based on Base URL
    if (provider === 'custom' && customBaseUrl) {
      const bUrl = customBaseUrl.toLowerCase();
      if (bUrl.includes('anthropic.com')) {
        provider = 'anthropic';
      } else if (bUrl.includes('generativelanguage.googleapis.com')) {
        provider = 'gemini';
      }
    }

    // Strict SSRF validation
    if (customBaseUrl && !isSafeBaseUrl(customBaseUrl)) {
      return res.status(400).json({
        success: false,
        statusType: 'network_error',
        error: 'آدرس پایه وارد شده (Base URL) نامعتبر یا به دلایل امنیتی غیرمجاز است.',
      });
    }

    if (provider === 'gemini') {
      let apiKey = customApiKey ? String(customApiKey).trim() : undefined;
      const targetModel = modelName || 'gemini-3.1-flash-lite';

      // Secure Backend Injection for Default Free Models during test
      if (!apiKey) {
        if (targetModel === 'gemini-1.5-flash' || targetModel === 'gemini-2.0-flash-exp' || targetModel === 'gemini-2.5-flash') {
          apiKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY;
        }
      }

      const ai = getGeminiClient(apiKey, false); // Forbid fallback to env for validation unless explicitly injected above
      
      const testCandidates = [
        targetModel,
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ].filter((v, i, a) => a.indexOf(v) === i);

      let response: any = null;
      let lastTestErr: any = null;
      let usedModel = targetModel;

      for (const tModel of testCandidates) {
        try {
          response = await ai.models.generateContent({
            model: tModel,
            contents: 'سلام، این یک آزمایش تست پینگ و سرعت است. لطفاً کلمه «متصل شد» را ارسال کن.',
          });
          usedModel = tModel;
          break;
        } catch (geminiErr: any) {
          lastTestErr = geminiErr;
          const errMsg = extractCleanErrorMessage(geminiErr);
          console.warn(`Test endpoint: ${tModel} unavailable (${errMsg.substring(0, 60)}), trying next candidate...`);
        }
      }

      if (!response) {
        const errorMsg = sanitizeErrorMessage(lastTestErr);
        const isAuth = errorMsg.includes('۴۰۱') || errorMsg.includes('۴۰۳') || errorMsg.includes('API_KEY_INVALID');
        return res.status(isAuth ? 401 : 500).json({
          success: false,
          statusCode: isAuth ? 401 : 500,
          statusType: isAuth ? 'auth_error' : 'network_error',
          error: isAuth ? 'کلید API نامعتبر است (401 Unauthorized)' : errorMsg,
        });
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        statusType: 'success',
        message: 'اتصال به هوش مصنوعی Gemini با موفقیت برقرار شد.',
        sampleResponse: response.text || 'متصل شد',
        latencyMs,
        modelUsed: usedModel,
      });
    } else {
      // DeepSeek / OpenAI / OpenRouter / OpenAI-compatible / Custom endpoint
      const baseUrl = normalizeBaseUrl(customBaseUrl, provider);
      if (!baseUrl) {
        return res.status(400).json({ 
          success: false, 
          statusType: 'network_error', 
          error: 'آدرس پایه اندپوینت (Base URL) وارد نشده است.' 
        });
      }

      let apiKey = customApiKey ? String(customApiKey).trim() : '';

      let model = modelName;
      if (!model) {
        if (provider === 'deepseek') model = 'deepseek-chat';
        else if (provider === 'openai') model = 'gpt-4o-mini';
        else if (provider === 'openrouter') model = 'meta-llama/llama-3.3-70b-instruct';
        else model = 'gpt-4o-mini';
      }

      // Secure Backend Injection for Default Free Models during test
      if (!apiKey && provider === 'custom') {
        const bUrl = baseUrl.toLowerCase();
        if (bUrl.includes('api.groq.com')) {
          const allowedGroqModels = ['qwen/qwen3.6-27b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'allam-2-7b', 'groq/compound'];
          if (allowedGroqModels.includes(model.toLowerCase())) {
            apiKey = process.env.DEFAULT_GROQ_KEY || process.env.GROQ_API_KEY || '';
          }
        }
      }

      if (!apiKey && provider !== 'custom') {
        return res.status(400).json({ 
          success: false, 
          statusType: 'auth_error', 
          error: 'لطفاً کلید دسترسی (API Key) خود را وارد کنید.' 
        });
      }

      const endpoint = provider === 'anthropic' ? `${baseUrl}/messages` : `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      
      if (apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      } else if (provider !== 'anthropic') {
        // Some proxies require Authorization header even if empty
        headers['Authorization'] = `Bearer dummy_key`;
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Persian AI Chatbox';
      }

      // Merge user custom headers
      const userHeaders = parseCustomHeaders(customHeaders);
      Object.assign(headers, userHeaders);

      // model assignment moved up

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          
          body: JSON.stringify(provider === 'anthropic' ? {
            model,
            messages: [{ role: 'user', content: 'Say "connected" in Persian (متصل شد)' }],
            max_tokens: 15,
          } : {
            model,
            messages: [{ role: 'user', content: 'Say "connected" in Persian (متصل شد)' }],
            temperature: 0.7,
            top_p: 0.8
          }),

        });
      } catch (fetchErr: any) {
        return res.status(502).json({
          success: false,
          statusCode: 502,
          statusType: 'network_error',
          error: 'خطا در برقراری ارتباط با سرور یا پروکسی (Network/Proxy Error)',
        });
      }

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        const errorText = await response.text();
        const status = response.status;
        let statusType: string = 'unknown_error';
        let errorMsg = '';

        if (!contentType.includes('application/json') && (errorText.includes('<html') || errorText.includes('captcha'))) {
          statusType = 'network_error';
          errorMsg = 'سرویس‌دهنده شما را بلاک کرده است (WAF/Captcha). لطفاً URL صحیح API را بررسی کنید.';
        } else if (status === 401) {
          statusType = 'auth_error';
          errorMsg = 'کلید API نامعتبر است (401 Unauthorized)';
        } else if (status === 403) {
          statusType = 'auth_error';
          errorMsg = 'دسترسی غیرمجاز یا مسدود شده (403 Forbidden)';
        } else if (status === 404) {
          statusType = 'not_found';
          errorMsg = 'مدل انتخابی در سرور یافت نشد (404 Not Found)';
        } else if (status === 429) {
          statusType = 'rate_limit';
          errorMsg = 'موجودی کلید API شما تمام شده یا محدودیت درخواست (Rate Limit) دارید. لطفاً پنل ارائه‌دهنده هوش مصنوعی خود را بررسی و شارژ کنید.';
        } else {
          statusType = 'network_error';
          errorMsg = `خطا در اتصال (${status}): ${sanitizeErrorMessage(errorText)}`;
        }

        return res.status(status).json({
          success: false,
          statusCode: status,
          statusType,
          error: errorMsg,
        });
      }

      const data = await response.json();
      const content =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.message?.reasoning_content ||
        'متصل شد';

      const latencyMs = Date.now() - startTime;
      let providerName = 'اندپوینت هوش مصنوعی';
      if (provider === 'deepseek') providerName = 'DeepSeek';
      else if (provider === 'openai') providerName = 'OpenAI';
      else if (provider === 'openrouter') providerName = 'OpenRouter';

      return res.json({
        success: true,
        statusType: 'success',
        message: `اتصال به ${providerName} با موفقیت برقرار شد.`,
        sampleResponse: content,
        latencyMs,
        modelUsed: model,
      });
    }
  } catch (err: any) {
    console.error('Test connection error:', err);
    return res.status(500).json({
      success: false,
      statusType: 'network_error',
      error: sanitizeErrorMessage(err),
    });
  }
});

export default router;

