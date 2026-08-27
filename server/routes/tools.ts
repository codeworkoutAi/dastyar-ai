import express from 'express';
import { isSafeBaseUrl, getGeminiClient, extractCleanErrorMessage, sanitizeErrorMessage, formatContentsForGemini, sleep, getPollinationsImageUrl, translateAndEnhanceImagePrompt, pcmToWavBuffer, normalizeBaseUrl, parseCustomHeaders } from '../services/utils';
import { SmartWebAgent } from '../services/WebSearchAgent';

const router = express.Router();

router.post('/api/fetch-models', async (req, res) => {
  try {
    const { baseUrl, apiKey, customHeaders } = req.body;
    if (!baseUrl) return res.status(400).json({ error: 'Base URL is required' });

    const headers: any = { 'Content-Type': 'application/json' };
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

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data ? data.data.map((m: any) => ({ id: m.id, name: m.name || m.id })) : [];
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
    const { prompt, aspectRatio = '1:1', negativePrompt } = req.body;
    if (!prompt) {
      console.warn('[ImageGen API] ❌ Error: Missing prompt');
      return res.status(400).json({ error: 'دستور ساخت تصویر الزامی است.' });
    }

    let fullPrompt = prompt;
    if (negativePrompt) {
      fullPrompt += ` --no ${negativePrompt}`;
    }

    const enhancedPrompt = await translateAndEnhanceImagePrompt(fullPrompt);
    const imageUrl = getPollinationsImageUrl(enhancedPrompt, aspectRatio);
    console.log('[ImageGen API] ✅ Image generated successfully URL:', imageUrl);
    res.json({ imageUrl, enhancedPrompt });
  } catch (err: any) {
    console.error('[ImageGen API] 💥 Error in image generation:', err);
    res.status(500).json({ error: sanitizeErrorMessage(err) });
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
