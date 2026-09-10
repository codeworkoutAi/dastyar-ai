import express from 'express';
import { Modality } from '@google/genai';
import { getGeminiClient, sanitizeErrorMessage, getPollinationsImageUrl, translateAndEnhanceImagePrompt } from '../services/utils';

const router = express.Router();

router.post('/api/fetch-models', async (req, res) => {
  try {
    const { baseUrl, apiKey, customHeaders } = req.body;
    if (!baseUrl) return res.status(400).json({ error: 'Base URL is required' });

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
      } catch (e) {}
    }

    // Try to normalize endpoint
    const endpoint = baseUrl.replace(/\/v1\/?$/, '') + '/v1/models';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, { headers, signal: controller.signal });
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
      } catch (e) {}
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
router.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', negativePrompt, engine, apiKey, settings } = req.body;
    if (!prompt) {
      console.warn('[ImageGen API] ❌ Error: Missing prompt');
      return res.status(400).json({ error: 'دستور ساخت تصویر الزامی است.' });
    }

    let fullPrompt = prompt;
    if (negativePrompt) {
      fullPrompt += ` --no ${negativePrompt}`;
    }

    const enhancedPrompt = await translateAndEnhanceImagePrompt(fullPrompt, settings?.providers?.gemini?.apiKey || apiKey);

    if (engine === 'dalle-3') {
      const openAiKey = apiKey || settings?.providers?.openai?.apiKey;
      if (!openAiKey) throw new Error('کلید API برای OpenAI تنظیم نشده است.');
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1024',
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'خطا در DALL-E 3');
      return res.json({ imageUrl: data.data[0].url, enhancedPrompt });
    }

    if (engine === 'imagen-3') {
      const geminiKey = apiKey || settings?.providers?.gemini?.apiKey;
      if (!geminiKey) throw new Error('کلید API برای جمنای تنظیم نشده است.');
      
      const ai = getGeminiClient(geminiKey);
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: enhancedPrompt,
        config: { numberOfImages: 1, aspectRatio: aspectRatio as any }
      });
      if (response.generatedImages && response.generatedImages[0].image.imageBytes) {
        const base64 = response.generatedImages[0].image.imageBytes;
        return res.json({ imageUrl: `data:image/jpeg;base64,${base64}`, enhancedPrompt });
      }
      throw new Error('خطا در دریافت تصویر از Imagen 3');
    }

    const imageUrl = getPollinationsImageUrl(enhancedPrompt, aspectRatio, engine);
    console.log('[ImageGen API] ✅ Image generated successfully URL:', imageUrl);
    res.json({ imageUrl, enhancedPrompt });
  } catch (err: any) {
    console.error('[ImageGen API] 💥 Error in image generation:', err);
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

    const upstreamRes = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

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

// 5. Enhance Prompt endpoint
router.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    if (!prompt) return res.status(400).json({ error: 'توصیف مورد نظر ارسال نشده است.' });
    
    const ai = getGeminiClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `You are an expert AI prompt engineer. Translate the user's short/simple idea (which could be in Persian or English) into a highly detailed, cinematic, and professional English prompt optimized for AI image generators like Midjourney or Flux. Add details about lighting, camera angle, mood, and texture. Return ONLY the English prompt, no extra text. User idea: "${prompt}"`,
    });
    
    const enhanced = response.text?.trim() || prompt;
    res.json({ enhancedPrompt: enhanced });
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
router.post('/api/tts', async (req, res) => {
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
      .replace(/\|?\s*[-:]+[-| :]*\s*\|?/g, '')
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

    const ai = getGeminiClient();
    
    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
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
      if (!rawBase64) {
        return res.status(422).json({ error: 'خروجی صوتی تولید نشد', fallback: true });
      }

      const pcmBuffer = Buffer.from(rawBase64, 'base64');
      const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);

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
    } catch (apiErr: any) {
      console.warn('[TTS API] Gemini TTS API exhausted or error, delegating to browser fallback:', apiErr.message || apiErr);
      return res.status(429).json({ error: 'محدودیت موقت مدل هوش مصنوعی', fallback: true });
    }
  } catch (err: any) {
    console.error('[TTS API] Error generating audio:', err);
    res.status(500).json({ error: 'خطا در ساخت فایل صوتی', fallback: true });
  }
});

// Setup Vite or Static File Serving

export default router;
