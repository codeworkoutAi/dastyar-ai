import express from 'express';
import { Modality } from '@google/genai';
import db from '../db/database';
import { isSafeBaseUrl, getGeminiClient, sanitizeErrorMessage, getPollinationsImageUrl, translateAndEnhanceImagePrompt, generatePollinationsImage, getGeminiKeyFromPool, blacklistKey, extractCleanErrorMessage } from '../services/utils';
import { aiRouteLimiter } from '../middleware/rateLimiter';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
import { deductImageCost, refundImageCost, deductOrUseFreeImageQuota } from '../services/walletService';

const router = express.Router();

router.get('/api/server-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    res.json({ ip: data.ip, message: 'این آی‌پی خروجی سرور شما روی Render است. آن را در زرین‌پال وارد کنید.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/fetch-models', aiRouteLimiter, async (req, res) => {
  try {
    let { baseUrl, apiKey, customHeaders, profileId } = req.body;
    if (baseUrl && baseUrl.includes('[DYNAMIC_POOL]')) {
      return res.status(400).json({ error: 'کارت‌های رایگان پیش‌فرض توسط سیستم (استخر کلیدها) به صورت خودکار مدیریت می‌شوند و نیازی به دریافت لیست مدل به صورت دستی ندارند.' });
    }
    if (!baseUrl || typeof baseUrl !== 'string' || !isSafeBaseUrl(baseUrl)) {
      return res.status(400).json({ error: 'آدرس پایه ارائه‌دهنده نامعتبر یا غیرمجاز است.' });
    }

    // Look up stored API key for default profile if not explicitly passed
    if (!apiKey && profileId) {
      try {
        const row = db.prepare('SELECT apiKey FROM default_profiles WHERE id = ?').get(profileId) as any;
        if (row?.apiKey) apiKey = row.apiKey;
      } catch (err) {
        console.warn('[Tools] Could not load apiKey from default_profiles for profile:', profileId, (err as Error)?.message || err);
      }
    }

    // Fallback to server env keys for known providers if still empty
    if (!apiKey) {
      const bUrl = baseUrl.toLowerCase();
      if (bUrl.includes('api.groq.com')) {
        apiKey = process.env.DEFAULT_GROQ_KEY || process.env.GROQ_API_KEY || '';
      } else if (bUrl.includes('generativelanguage.googleapis.com')) {
        apiKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY || '';
      }
    }

    const headers: any = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    if (customHeaders) {
      try {
        const parsed = JSON.parse(customHeaders);
        Object.assign(headers, parsed);
      } catch (e) {
        console.warn('[Tools] Invalid customHeaders JSON:', (e as Error)?.message || e);
      }
    }

    // Smart and modular endpoint normalization for any OpenAI-compatible provider
    let endpoint = baseUrl.trim().replace(/\/+$/, '');
    endpoint = endpoint.replace(/\/chat\/completions$/, '').replace(/\/+$/, '');
    if (endpoint.endsWith('/models')) {
      // already points to models
    } else if (endpoint.endsWith('/openai') || endpoint.endsWith('/v1')) {
      endpoint = `${endpoint}/models`;
    } else {
      // Try /v1/models if standard OpenAI-compatible host without /v1
      endpoint = `${endpoint}/v1/models`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let response: Response;
    try {
      response = await fetch(endpoint, { headers, signal: controller.signal });
      if (response.status === 404 && endpoint.endsWith('/v1/models')) {
        // Fallback to /models if /v1/models returned 404
        const fallbackEndpoint = baseUrl.trim().replace(/\/+$/, '') + '/models';
        response = await fetch(fallbackEndpoint, { headers, signal: controller.signal });
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      if (text.includes('<html') || text.includes('captcha')) {
        throw new Error(`سرویس‌دهنده شما را بلاک کرده است (WAF/Captcha). لطفاً URL صحیح API را بررسی کنید.`);
      }
      throw new Error(`سرویس‌دهنده پاسخ نامعتبر (غیر JSON) ارسال کرد. URL را بررسی کنید.`);
    }

    if (!response.ok) {
      let errText = response.statusText;
      try {
        const errJson = await response.json();
        errText = errJson.error?.message || errJson.message || errText;
      } catch (e) {
        console.warn('[Tools] Could not parse error response JSON:', (e as Error)?.message || e);
      }
      throw new Error(`خطای سرور (${response.status}): ${errText}`);
    }

    const data = await response.json();
    let models = data.data ? data.data.map((m: any) => {
      const idStr = String(m.id || '').toLowerCase();
      const nameStr = String(m.name || '').toLowerCase();
      const combined = `${idStr} ${nameStr}`;

      const isFree = 
        idStr.endsWith(':free') || 
        idStr.includes('/free') ||
        (m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0") ||
        nameStr.includes('free') ||
        combined.includes('رایگان');
        
      let provider = 'سایر';
      if (m.id && m.id.includes('/')) {
        const p = m.id.split('/')[0];
        provider = p.charAt(0).toUpperCase() + p.slice(1);
      } else if (combined.includes('claude') || combined.includes('anthropic')) {
        provider = 'Anthropic';
      } else if (combined.includes('gpt') || combined.includes('openai') || combined.includes('o1') || combined.includes('o3') || combined.includes('o4')) {
        provider = 'OpenAI';
      } else if (combined.includes('gemini') || combined.includes('gemma') || combined.includes('google')) {
        provider = 'Google';
      } else if (combined.includes('deepseek')) {
        provider = 'DeepSeek';
      } else if (combined.includes('qwen') || combined.includes('qwq') || combined.includes('alibaba')) {
        provider = 'Alibaba Qwen';
      } else if (combined.includes('mistral') || combined.includes('codestral') || combined.includes('pixtral') || combined.includes('devstral')) {
        provider = 'Mistral';
      } else if (combined.includes('llama') || combined.includes('meta')) {
        provider = 'Meta';
      } else if (combined.includes('grok') || combined.includes('xai')) {
        provider = 'xAI';
      } else if (combined.includes('glm') || combined.includes('zhipu')) {
        provider = 'Zhipu AI';
      }

      // Determine capabilities
      const modalityStr = (m.architecture?.modality || '').toLowerCase();
      const inputMods: string[] = Array.isArray(m.architecture?.input_modalities) ? m.architecture.input_modalities : [];

      const isReasoning = Boolean(
        combined.includes('deepseek-r1') ||
        combined.includes('r1') ||
        combined.includes('o1') ||
        combined.includes('o3') ||
        combined.includes('o4') ||
        combined.includes('reasoner') ||
        combined.includes('reasoning') ||
        combined.includes('qwq') ||
        combined.includes('thinking') ||
        combined.includes('thought') ||
        combined.includes('grok-3-think') ||
        combined.includes('opus') ||
        (m.supported_parameters && m.supported_parameters.includes('reasoning'))
      );
      
      const isVision = Boolean(
        inputMods.includes('image') ||
        modalityStr.includes('image') || 
        modalityStr.includes('multimodal') ||
        combined.includes('vision') || 
        combined.includes('-vl') || 
        combined.includes('vl-') || 
        combined.includes('pixtral') ||
        combined.includes('llava') ||
        combined.includes('internvl') ||
        combined.includes('gpt-4o') ||
        combined.includes('gpt-4-turbo') ||
        combined.includes('gpt-4.5') ||
        combined.includes('gpt-5') ||
        combined.includes('claude') ||
        combined.includes('gemini') ||
        combined.includes('omni') ||
        combined.includes('glm-4v')
      );

      const isCoding = Boolean(
        combined.includes('coder') || 
        combined.includes('code') || 
        combined.includes('codestral') || 
        combined.includes('devstral') ||
        combined.includes('deepseek-coder') ||
        combined.includes('qwen-coder') ||
        combined.includes('starcoder') ||
        combined.includes('dev') ||
        combined.includes('sonnet') ||
        combined.includes('opus') ||
        combined.includes('claude') ||
        combined.includes('gpt-4o') ||
        combined.includes('gpt-4.5') ||
        combined.includes('gpt-5') ||
        combined.includes('o1') ||
        combined.includes('o3') ||
        combined.includes('o4') ||
        combined.includes('deepseek-v3') ||
        combined.includes('deepseek-chat') ||
        combined.includes('deepseek-r1') ||
        combined.includes('grok') ||
        (m.benchmarks && m.benchmarks.artificial_analysis && m.benchmarks.artificial_analysis.coding_index > 50)
      );

      const isFast = Boolean(
        combined.includes('haiku') ||
        combined.includes('flash') ||
        combined.includes('mini') ||
        combined.includes('lite') ||
        combined.includes('turbo') ||
        combined.includes('8b') ||
        combined.includes('7b') ||
        combined.includes('3b') ||
        combined.includes('1.5b') ||
        combined.includes('small') ||
        combined.includes('nemo')
      );

      const contextLength = m.context_length || m.top_provider?.context_length || null;

      return { 
        id: m.id, 
        name: isFree ? `🎁 ${m.name || m.id} [رایگان]` : (m.name || m.id),
        isFree: Boolean(isFree),
        provider,
        isReasoning,
        isVision,
        isCoding,
        isFast,
        contextLength,
        description: m.description || undefined
      };
    }) : [];

    // Sort free models to the top, then alphabetically
    models.sort((a: any, b: any) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      const strA = String(a.name || a.id || '');
      const strB = String(b.name || b.id || '');
      return strA.localeCompare(strB, undefined, { sensitivity: 'base' });
    });

    res.json({ models });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'ارتباط قطع شد (Timeout). لطفاً Base URL را بررسی کنید.' });
    } else {
      res.status(500).json({ error: sanitizeErrorMessage(err) });
    }
  }
});

// 4. Image Generation endpoint
router.post('/api/generate-image', aiRouteLimiter, async (req, res) => {
  let userId: number | null = null;
  let deductResult: any = null;
  const engine = req.body.engine || 'imagen-3';
  const isPaidEngine = engine === 'imagen-3' || engine === 'dalle-3';

  try {
    const { prompt, englishPrompt, aspectRatio = '1:1', negativePrompt, apiKey, settings } = req.body;
    if (!prompt && !englishPrompt) {
      console.warn('[ImageGen API] ❌ Error: Missing prompt');
      return res.status(400).json({ error: 'دستور ساخت تصویر الزامی است.' });
    }

    // Extract user from JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
        userId = decoded.id;
      } catch (err) {
        console.warn('[Tools/ImageGen] JWT verification failed:', (err as Error)?.message || err);
      }
    }

    if (isPaidEngine) {
      if (!userId) {
        return res.status(401).json({
          error: 'برای ساخت تصویر با کیفیت استودیویی (Google Imagen 3 / DALL-E 3)، لطفاً ابتدا وارد حساب کاربری خود شوید.'
        });
      }

      deductResult = deductOrUseFreeImageQuota(
        userId,
        engine,
        `ساخت تصویر استودیویی (${engine === 'dalle-3' ? 'DALL-E 3' : 'Google Imagen 3'})`
      );

      if (!deductResult.success) {
        return res.status(402).json({
          error: deductResult.error || 'موجودی کیف پول شما کافی نیست و سهمیه رایگان روزانه شما به پایان رسیده است. لطفاً کیف پول خود را شارژ کنید.'
        });
      }
    }

    let fullPrompt = (prompt || englishPrompt) as string;
    if (negativePrompt) {
      fullPrompt += ` --no ${negativePrompt}`;
    }

    let enhancedPrompt = englishPrompt && typeof englishPrompt === 'string' && englishPrompt.trim().length > 5
      ? englishPrompt.trim()
      : await translateAndEnhanceImagePrompt(fullPrompt, settings?.providers?.gemini?.apiKey || apiKey);

    if (engine === 'dalle-3' || engine === 'imagen-3') {
      let sysKey = apiKey;
      let sysBaseUrl = 'https://api.openai.com/v1';
      let sysModel = engine === 'dalle-3' ? 'dall-e-3' : 'gpt-image-2.5'; // Default mappings

      if (!sysKey) {
        // Fallback to Router.cheap/DB
        const sysProfile = db.prepare("SELECT apiKey, baseUrl FROM default_profiles WHERE isActive = 1 AND apiKey != '' AND (baseUrl LIKE '%router.cheap%' OR baseUrl LIKE '%openai%' OR baseUrl LIKE '%googleapis%') LIMIT 1").get() as any;
        if (sysProfile) {
          sysKey = sysProfile.apiKey;
          if (sysProfile.baseUrl) sysBaseUrl = sysProfile.baseUrl;
        } else {
          sysKey = engine === 'dalle-3' ? process.env.OPENAI_API_KEY : (process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY);
          if (engine === 'imagen-3' && !sysProfile) {
             sysBaseUrl = 'https://router.cheap/v1'; // Fallback assumptions
          }
        }
      }

      if (!sysKey) throw new Error(`کلید سیستم برای ساخت تصویر با ${engine} یافت نشد.`);

      // If the baseUrl is Router.cheap, we must use one of their supported image models
      if (sysBaseUrl.includes('router.cheap')) {
        sysModel = engine === 'imagen-3' ? 'gpt-image-2.5-flare' : 'gpt-image-2.5-sunburst'; // Use router.cheap specific models
      } else if (sysBaseUrl.includes('googleapis')) {
          // If the user actually provided a googleapis base URL and a gemini key, we use the Gemini SDK
          const ai = getGeminiClient(sysKey);
          let response;
          try {
            response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-image',
              contents: enhancedPrompt,
              config: { 
                 outputOptions: { mimeType: 'image/jpeg' } 
              } as any
            });
          } catch (err002: any) {
            console.warn('[ImageGen API] gemini-3.1-flash-image failed:', err002);
            // Fallback to 2.5 if 3.1 is not available for this specific key yet
            response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: enhancedPrompt,
              config: { 
                 outputOptions: { mimeType: 'image/jpeg' } 
              } as any
            });
          }
          
          const part = response?.candidates?.[0]?.content?.parts?.[0];
          if (part && part.inlineData && part.inlineData.data) {
            const base64 = part.inlineData.data;
            return res.json({
              imageUrl: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${base64}`,
              enhancedPrompt,
              costToman: deductResult?.costToman || 0,
              balanceAfter: deductResult?.balanceAfter
            });
          }
          throw new Error('خطا در دریافت تصویر از Imagen 3 / Gemini Image');
      }

      // Standard OpenAI / Router.cheap fetch
      const endpoint = sysBaseUrl.endsWith('/') ? `${sysBaseUrl}images/generations` : `${sysBaseUrl}/images/generations`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sysKey}` },
          body: JSON.stringify({
            model: sysModel,
            prompt: enhancedPrompt,
            n: 1,
            size: '1024x1024',
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      
      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error('دریافت پاسخ نامعتبر از سرور (احتمالاً ترافیک بالا یا خطای شبکه در Router.cheap)');
      }

      if (!response.ok) throw new Error(data.error?.message || `خطا در دریافت تصویر از ${sysBaseUrl}`);
      
      return res.json({
        imageUrl: data.data[0].url,
        enhancedPrompt,
        costToman: deductResult?.costToman || 0,
        balanceAfter: deductResult?.balanceAfter
      });
    }

    const { dataUrl, rawUrl } = await generatePollinationsImage(enhancedPrompt, aspectRatio, engine);
    console.log('[ImageGen API] ✅ Image generated successfully:', rawUrl);
    res.json({ imageUrl: dataUrl, rawImageUrl: rawUrl, enhancedPrompt, costToman: 0 });
  } catch (err: any) {
    console.error('[ImageGen API] 💥 Error in image generation:', err);
    // Refund the user if they were charged from wallet (not free quota) but generation failed
    if (deductResult && deductResult.success && !deductResult.isFree && userId && isPaidEngine) {
      refundImageCost(userId, deductResult.costToman, engine);
      console.log(`[ImageGen API] 💰 Refunded ${deductResult.costToman} Toman for failed ${engine} generation`);
    }
    res.status(500).json({ error: sanitizeErrorMessage(err) });
  }
});

// Secure image proxy to bypass TLS/cipher handshake issues and ISP filtering
router.get('/api/proxy-image', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).send('پارامتر url الزامی است.');
    }

    const parsed = new URL(rawUrl);
    const allowedHosts = ['image.pollinations.ai', 'pollinations.ai'];
    if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
      return res.status(403).send('دامنه درخواستی مجاز نیست.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const upstreamRes = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('خطا در دریافت تصویر از منبع.');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    const buffer = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[Image Proxy] Error:', err?.message || err);
    res.status(500).send('خطا در پراکسی تصویر.');
  }
});

// 5. Enhance Prompt endpoint (Enhances Persian in rich Persian, or English in English)
router.post('/api/enhance-prompt', aiRouteLimiter, async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'توصیف مورد نظر ارسال نشده است.' });
    }

    const isPersian = /[\u0600-\u06FF]/.test(prompt);

    const systemInstruction = isPersian
      ? `شما یک متخصص ارشد نگارش پرامپت هوش مصنوعی برای خلق تصاویر شاهکار هستید.
کاربر یک ایده یا توصیف اولیه به زبان فارسی داده است.
وظیفه شما این است که این ایده را به یک توصیف بسیار غنی، شفاف، زنده، با جزئیات بصری دقیق، نورپردازی هنری، زاویه دید، بافت و اتمسفر سینمایی به «زبان فارسی شیوا، سلیس و گیرا» بازنویسی و ارتقا دهید.
دستورالعمل‌های حیاتی:
۱. پاسخ باید کاملاً و صرفاً به زبان فارسی باشد (هیچ کلمه یا جمله‌ای به زبان انگلیسی ننویسید).
۲. ایده اصلی و ماهیت مدنظر کاربر را دقیقاً حفظ کنید و فقط جزئیات بصری، کادربندی و رنگ‌آمیزی آن را غنی‌تر و ادبی‌تر کنید.
۳. فقط متن بازنویسی‌شده نهایی را برگردانید؛ بدون هیچ‌گونه مقدمه، علامت نقل قول یا توضیح اضافی.

ایده کاربر: "${prompt}"`
      : `You are an expert AI art prompt engineer. Take the user's concept and expand it into a rich, vivid, cinematic prompt optimized for AI image generation with lighting, atmosphere, texture, and camera angle.
Return ONLY the expanded prompt text, nothing else.

User prompt: "${prompt}"`;

    let enhanced: string | null = null;

    // 1. Primary: Try Gemini
    try {
      const ai = getGeminiClient(apiKey);
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: systemInstruction,
          });
          const text = response.text?.trim();
          if (text && text.length > 5) {
            enhanced = text;
            break;
          }
        } catch (mErr) {
          // try next candidate
        }
      }
    } catch (geminiErr: any) {
      console.warn('[Enhance Prompt] Gemini error, trying Groq fallback:', geminiErr?.message || geminiErr);
    }

    // 2. Fallback: Try Groq (openai/gpt-oss-120b / openai/gpt-oss-20b)
    if (!enhanced) {
      const groqKey = process.env.DEFAULT_GROQ_KEY || process.env.GROQ_API_KEY;
      if (groqKey) {
        const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
        for (const model of groqModels) {
          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: systemInstruction }],
                temperature: 0.7,
                max_tokens: 350,
              }),
            });
            if (groqRes.ok) {
              const data = await groqRes.json();
              let text = data?.choices?.[0]?.message?.content?.trim();
              if (text) {
                text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').replace(/^["']|["']$/g, '').trim();
                if (text.length > 5) {
                  enhanced = text;
                  break;
                }
              }
            }
          } catch (groqErr: any) {
            // try next model
          }
        }
      }
    }

    res.json({ enhancedPrompt: enhanced || prompt });
  } catch (err: any) {
    console.error('[Enhance Prompt API] Error:', err);
    res.status(500).json({ error: 'خطا در بهبود توصیف تصویر.' });
  }
});

// In-memory cache for synthesized audio to protect rate limits and quotas
const ttsAudioCache = new Map<string, Buffer>();

// Helper to wrap raw 24kHz 16-bit mono PCM into standard WAV format
function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format = 1
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// 6. High-Quality Persian & Multilingual Text-to-Speech (TTS) endpoint
router.post('/api/tts', aiRouteLimiter, async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'متن برای تبدیل به صوت الزامی است.' });
    }

    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/\[تفکر:[\s\S]*?\]/gi, '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\|?\s*[-:]{3,}[-| :]*\s*\|?/g, '')
      .replace(/\|/g, '، ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/^>\s*/gm, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ')
      .replace(/[✨⭐🌟💫🔥🎉🚀💡📌🔹🔸✔️❌👉👈👇👆🤖💬❤️💙💚💛💜🖤]/g, ' ')
      .replace(/[-–—]{2,}/g, ' ')
      .replace(/\.{3,}/g, '…')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'متن قابل قرائتی یافت نشد.' });
    }

    // Limit text for a single synthesis call to prevent burning excessive tokens
    const textToSynthesize = cleanText.length > 800 ? cleanText.substring(0, 800) + '…' : cleanText;
    const cacheKey = `${lang || 'auto'}:${textToSynthesize}`;

    if (ttsAudioCache.has(cacheKey)) {
      const cachedWav = ttsAudioCache.get(cacheKey)!;
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', cachedWav.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cachedWav);
    }

    const triedKeys = new Set<string>();
    let wavBuffer: Buffer | null = null;
    let lastTtsError: any = null;
    const maxTtsAttempts = 4;
    const ttsCandidateModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview'];

    for (const ttsModel of ttsCandidateModels) {
      if (wavBuffer) break;

      for (let attempt = 0; attempt < maxTtsAttempts; attempt++) {
        let currentKey: string | null = null;
        try {
          currentKey = getGeminiKeyFromPool(Array.from(triedKeys), ttsModel);
        } catch (poolErr) {
          lastTtsError = poolErr;
        }
        if (!currentKey) {
          currentKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY || null;
        }
        if (!currentKey || triedKeys.has(currentKey)) break;

        triedKeys.add(currentKey);

        try {
          const ai = getGeminiClient(currentKey, false);
          const ttsResponse = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: textToSynthesize }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });

          const rawBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (rawBase64) {
            const audioBuffer = Buffer.from(rawBase64, 'base64');
            // Gemini 3.8 TTS returns a complete WAV file (RIFF header) for unary requests,
            // while older models returned raw PCM that needed a WAV header. Detect and handle both.
            const isAlreadyWav = audioBuffer.length > 4 && audioBuffer.slice(0, 4).toString('ascii') === 'RIFF';
            wavBuffer = isAlreadyWav ? audioBuffer : pcmToWavBuffer(audioBuffer, 24000, 1, 16);
            break;
          }
        } catch (apiErr: any) {
          lastTtsError = apiErr;
          const errMsg = extractCleanErrorMessage(apiErr);
          const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
          const is401 = errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Invalid API Key');
          const is403 = errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID');
          if (currentKey && (is429 || is401 || is403)) {
            blacklistKey(currentKey, is429 ? '429' : (is401 ? '401' : '403'), is429 ? 60 * 1000 : 24 * 60 * 60 * 1000, is429 ? ttsModel : undefined);
          }
          console.warn(`[TTS API] Key ${currentKey.slice(0, 8)}... failed on ${ttsModel} (attempt ${attempt + 1}): ${errMsg.slice(0, 80)}`);
        }
      }
    }

    if (!wavBuffer) {
      console.warn('[TTS API] All key/model attempts failed for TTS, delegating to browser fallback:', lastTtsError?.message || lastTtsError);
      return res.status(429).json({ error: 'محدودیت موقت در پردازش صوت هوش مصنوعی', fallback: true });
    }

    // Keep cache size bounded
    if (ttsAudioCache.size > 50) {
      const firstKey = ttsAudioCache.keys().next().value;
      if (firstKey) ttsAudioCache.delete(firstKey);
    }
    ttsAudioCache.set(cacheKey, wavBuffer);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', wavBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(wavBuffer);
  } catch (err: any) {
    console.error('[TTS API] Error generating audio:', err);
    res.status(500).json({ error: 'خطا در ساخت فایل صوتی', fallback: true });
  }
});

// Setup Vite or Static File Serving

export default router;
