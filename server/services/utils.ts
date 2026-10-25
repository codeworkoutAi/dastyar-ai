import { GoogleGenAI } from '@google/genai';
import db from '../db/database';

let currentGeminiKeyIndex = 0;

export function getGeminiKeyFromPool(): string | null {
  try {
    const row = db.prepare("SELECT value FROM site_settings WHERE key = 'gemini_keys_pool'").get() as any;
    if (row && row.value) {
      const keys = row.value.split('\n').map((k: string) => k.trim()).filter(Boolean);
      if (keys.length > 0) {
        currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % keys.length;
        return keys[currentGeminiKeyIndex];
      }
    }
  } catch (err) {
    console.error('Error fetching gemini keys pool:', err);
  }
  return null;
}

const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS/GCP/Azure instance metadata
  'metadata.google.internal',
]);

export function isSafeBaseUrl(targetUrl?: string): boolean {
  if (!targetUrl || typeof targetUrl !== 'string') return true;
  const trimmed = targetUrl.trim();
  if (!trimmed) return true;

  try {
    let urlToParse = trimmed;
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    const parsed = new URL(urlToParse);

    // Strictly enforce HTTPS protocol for all outbound custom API calls
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block exact dangerous hostnames
    if (FORBIDDEN_HOSTNAMES.has(hostname)) {
      return false;
    }

    // Block numeric representation bypasses (e.g. dword, hex, octal integer IP representations)
    if (/^\d+$/.test(hostname)) {
      return false;
    }

    // Block private/internal top-level domains & suffixes
    if (
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.home') ||
      hostname.endsWith('.corp')
    ) {
      return false;
    }

    // Block private and loopback IPv4 ranges:
    // 127.0.0.0/8 (Loopback)
    // 10.0.0.0/8 (Private - RFC 1918)
    // 172.16.0.0/12 (Private - RFC 1918: 172.16.x.x - 172.31.x.x)
    // 192.168.0.0/16 (Private - RFC 1918)
    // 169.254.0.0/16 (Link-local / Cloud metadata - RFC 3927)
    // 0.0.0.0/8 (Current network)
    // 100.64.0.0/10 (Carrier-grade NAT)
    // 198.18.0.0/15 (Benchmarking)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);
      const octet3 = parseInt(ipMatch[3], 10);
      const octet4 = parseInt(ipMatch[4], 10);

      // Validate byte ranges
      if (octet1 > 255 || octet2 > 255 || octet3 > 255 || octet4 > 255) return false;

      if (octet1 === 127) return false;
      if (octet1 === 10) return false;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
      if (octet1 === 192 && octet2 === 168) return false;
      if (octet1 === 169 && octet2 === 254) return false;
      if (octet1 === 0) return false;
      if (octet1 === 100 && octet2 >= 64 && octet2 <= 127) return false;
      if (octet1 === 198 && (octet2 === 18 || octet2 === 19)) return false;
    }

    // Block IPv6 loopback / unique local / link-local addresses
    if (
      hostname === '[::1]' ||
      hostname === '::1' ||
      hostname.startsWith('[fc') ||
      hostname.startsWith('[fd') ||
      hostname.startsWith('[fe80') ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fe80:')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getGeminiClient(customApiKey?: string, allowFallbackToEnv: boolean = true): GoogleGenAI {
  let key = customApiKey && String(customApiKey).trim();
  if (!key && allowFallbackToEnv) {
    key = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY;
  }
  if (!key) {
    throw new Error('کلید API جمینای تنظیم نشده است (GEMINI_API_KEY). لطفاً در بخش تنظیمات کلید خود را وارد کنید.');
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to get Pollinations image URL (legacy GET format for compatibility)
export function getPollinationsImageUrl(prompt: string, aspectRatio = '1:1', engine = 'flux') {
  let styledPrompt = prompt;
  if (engine === 'flux-anime') {
    styledPrompt = `${prompt}, masterpiece anime aesthetic, vibrant digital art, crisp anime illustration`;
  } else if (engine === 'flux-3d') {
    styledPrompt = `${prompt}, 3d octane render, unreal engine 5, isometric 3d style, smooth clay render, cinematic lighting`;
  } else if (engine === 'turbo') {
    styledPrompt = `${prompt}, fast rendering, high quality, crisp focus`;
  } else if (engine === 'sana') {
    styledPrompt = `${prompt}, ultra high resolution, highly detailed, photorealistic, pristine quality`;
  } else if (engine === 'albedobase-xl') {
    styledPrompt = `${prompt}, photorealistic, 8k uhd, highly detailed, realistic skin texture, cinematic lighting`;
  }

  const encoded = encodeURIComponent(styledPrompt);
  let dimW = 1024, dimH = 1024;
  if (aspectRatio === '16:9') { dimW = 1024; dimH = 576; }
  else if (aspectRatio === '9:16') { dimW = 576; dimH = 1024; }

  let modelParam = 'flux-realism';
  if (engine === 'turbo') modelParam = 'turbo';
  else if (engine === 'flux-anime') modelParam = 'flux-anime';
  else if (engine === 'flux-3d') modelParam = 'flux-3d';
  else if (engine === 'sana') modelParam = 'sana';
  else if (engine === 'albedobase-xl') modelParam = 'albedobase-xl';
  else if (engine === 'flux') modelParam = 'flux-realism';

  return `https://image.pollinations.ai/prompt/${encoded}?width=${dimW}&height=${dimH}&model=${modelParam}&nologo=true&seed=${Math.floor(Math.random() * 10000000)}`;
}

export interface PollinationsImageResult {
  dataUrl: string;
  rawUrl: string;
}

// Ultra-fast direct image generator using Pollinations API on the server side
export async function generatePollinationsImage(
  prompt: string,
  aspectRatio: string = '1:1',
  engine: string = 'flux'
): Promise<PollinationsImageResult> {
  let styledPrompt = prompt;
  if (engine === 'flux-anime') {
    styledPrompt = `${prompt}, masterpiece anime aesthetic, vibrant digital art, crisp anime illustration`;
  } else if (engine === 'flux-3d') {
    styledPrompt = `${prompt}, 3d octane render, unreal engine 5, isometric 3d style, smooth clay render, cinematic lighting`;
  } else if (engine === 'turbo') {
    styledPrompt = `${prompt}, fast rendering, high quality, crisp focus`;
  } else if (engine === 'sana') {
    styledPrompt = `${prompt}, ultra high resolution, highly detailed, photorealistic, pristine quality`;
  } else if (engine === 'albedobase-xl') {
    styledPrompt = `${prompt}, photorealistic, 8k uhd, highly detailed, realistic skin texture, cinematic lighting`;
  }

  let dimW = 1024, dimH = 1024;
  if (aspectRatio === '16:9') { dimW = 1024; dimH = 576; }
  else if (aspectRatio === '9:16') { dimW = 576; dimH = 1024; }

  let modelParam = 'flux-realism';
  if (engine === 'turbo') modelParam = 'turbo';
  else if (engine === 'flux-anime') modelParam = 'flux-anime';
  else if (engine === 'flux-3d') modelParam = 'flux-3d';
  else if (engine === 'sana') modelParam = 'sana';
  else if (engine === 'albedobase-xl') modelParam = 'albedobase-xl';
  else if (engine === 'flux') modelParam = 'flux-realism';

  const seed = Math.floor(Math.random() * 10000000);
  const encodedPrompt = encodeURIComponent(styledPrompt);
  
  const rawUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimW}&height=${dimH}&model=${modelParam}&nologo=true&seed=${seed}`;

  // Return instantly and let the client-side preloadImage handle the actual fetching and timeout
  return {
    dataUrl: rawUrl,
    rawUrl: rawUrl
  };
}

// Helper to translate and enhance image prompts into professional English prompts
export async function translateAndEnhanceImagePrompt(rawPrompt: string, apiKey?: string): Promise<string> {
  const trimmed = (rawPrompt || '').trim();
  if (!trimmed) return '';

  const isPersian = /[\u0600-\u06FF]/.test(trimmed);

  // If prompt is already mostly in English without Persian characters, keep it intact
  if (!isPersian && trimmed.length > 5) {
    return trimmed;
  }

  const systemInstruction = `You are a master AI image prompt engineer and translator.
Convert the user's Persian image description into a highly detailed, cinematic, and professional English prompt optimized for state-of-the-art AI image generators (Flux.1 / SDXL).
Rules:
1. Understand the core subject, style, and mood accurately (e.g. pencil sketch, ancient warrior, cherry blossoms, cyberpunk, etc.).
2. Translate and expand with descriptive visual details, lighting, atmosphere, texture, and artistic technique.
3. Return ONLY the final English prompt text. No quotes, no markdown fences, no Persian, no preamble or explanation.

Persian description: "${trimmed}"`;

  // 1. Primary: Try Gemini with customApiKey (if provided by user)
  if (apiKey) {
    try {
      const ai = getGeminiClient(apiKey, false);
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: systemInstruction,
          });
          const enhanced = response.text?.trim();
          if (enhanced && enhanced.length > 5 && !/[\u0600-\u06FF]/.test(enhanced)) {
            return enhanced;
          }
        } catch (mErr: any) {
          // try next candidate
        }
      }
    } catch (e: any) {
      // fallback to system profile
    }
  }

  // 2. Secondary: Try active system profile from database (default_profiles)
  try {
    const profile = db.prepare("SELECT apiKey, baseUrl, modelName FROM default_profiles WHERE isActive = 1 AND apiKey != '' AND (modelName LIKE '%gemini%' OR baseUrl LIKE '%googleapis%' OR baseUrl LIKE '%groq%' OR baseUrl LIKE '%router.cheap%') ORDER BY CASE WHEN modelName LIKE '%gemini%' THEN 0 ELSE 1 END LIMIT 1").get() as any;
    if (profile?.apiKey) {
      let baseUrl = (profile.baseUrl || '').replace(/\/+$/, '');
      if (!baseUrl.endsWith('/chat/completions')) {
        baseUrl = `${baseUrl}/chat/completions`;
      }
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.apiKey}`,
        },
        body: JSON.stringify({
          model: profile.modelName,
          messages: [{ role: 'user', content: systemInstruction }],
          temperature: 0.5,
          max_tokens: 300,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        let text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').replace(/^["']|["']$/g, '').trim();
          if (text.length > 5 && !/[\u0600-\u06FF]/.test(text)) {
            return text;
          }
        }
      }
    }
  } catch (dbErr) {
    console.warn('[translateAndEnhanceImagePrompt] Database system profile error:', dbErr);
  }

  // 3. Fallback: Try Groq from environment if configured
  const groqKey = process.env.DEFAULT_GROQ_KEY || process.env.GROQ_API_KEY;
  if (groqKey) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'allam-2-7b'];
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
            temperature: 0.5,
            max_tokens: 350,
          }),
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          let text = data?.choices?.[0]?.message?.content?.trim();
          if (text) {
            text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').replace(/^["']|["']$/g, '').trim();
            if (text.length > 5 && !/[\u0600-\u06FF]/.test(text)) {
              return text;
            }
          }
        }
      } catch (groqErr: any) {}
    }
  }

  // 4. Clean fallback without forcing "photorealistic" which ruins non-photo styles
  return `${trimmed}, highly detailed, sharp focus, 8k resolution, award winning composition`;
}



// Helper to fetch live real-time web search results (Domestic Persian Feeds + Google News RSS / Web)



export function normalizeBaseUrl(url?: string, provider?: string): string {
  let clean = (url || '').trim();

  if (provider === 'deepseek') {
    if (!clean) return 'https://api.deepseek.com';
  } else if (provider === 'openai') {
    if (!clean) return 'https://api.openai.com/v1';
  } else if (provider === 'openrouter') {
    if (!clean) return 'https://openrouter.ai/api/v1';
  } else if (provider === 'anthropic') {
    if (!clean) return 'https://api.anthropic.com/v1';
  }

  if (!clean) return '';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  clean = clean.replace(/\/+$/, '');
  // Strip /chat/completions if entered by mistake
  clean = clean.replace(/\/chat\/completions$/, '');
  return clean;
}

export function parseCustomHeaders(customHeaders?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!customHeaders || typeof customHeaders !== 'string') return headers;
  const trimmed = customHeaders.trim();
  if (!trimmed) return headers;

  // Try JSON first
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string' || typeof value === 'number') {
            headers[key] = String(value);
          }
        }
        return headers;
      }
    } catch {
      // Fallback to line-by-line
    }
  }

  // Parse line-by-line format: "Header-Name: Header-Value"
  const lines = trimmed.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (key && val) {
        headers[key] = val;
      }
    }
  }
  return headers;
}

// Helper to recursively extract the innermost error message from nested JSON or ApiError
export function extractCleanErrorMessage(err: any): string {
  if (!err) return '';
  let msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);

  for (let i = 0; i < 5; i++) {
    if (typeof msg === 'string' && (msg.includes('{') || msg.startsWith('ApiError:'))) {
      const jsonStart = msg.indexOf('{');
      const jsonEnd = msg.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const jsonPart = msg.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonPart);
          if (parsed?.error?.message && typeof parsed.error.message === 'string') {
            msg = parsed.error.message;
          } else if (parsed?.message && typeof parsed.message === 'string') {
            msg = parsed.message;
          } else if (parsed?.error?.status) {
            msg = parsed.error.status;
          } else {
            break;
          }
        } catch {
          break;
        }
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return typeof msg === 'string' ? msg : JSON.stringify(msg);
}

// Helper to sanitize and translate errors into friendly Persian messages
export function sanitizeErrorMessage(err: any): string {
  if (!err) return 'خطای نامشخص در ارتباط با سرور.';
  const rawMsg = extractCleanErrorMessage(err);
  const msg = rawMsg || (typeof err === 'string' ? err : err.message || '');
  const lower = msg.toLowerCase();

  // Location / Region Restriction & Sanctions
  if (
    lower.includes('location is not supported') ||
    lower.includes('location_not_supported') ||
    lower.includes('region not supported') ||
    lower.includes('country not supported') ||
    lower.includes('unsupported country') ||
    lower.includes('geographical restriction') ||
    lower.includes('geo-restriction') ||
    lower.includes('blocked region')
  ) {
    return 'دسترسی به این مدل از این موقعیت مکانی با محدودیت منطقه‌ای (تحریم) مواجه است. لطفاً ارتباط سرور/فیلترشکن را بررسی کرده یا از مدل‌های دیگر (مانند DeepSeek یا OpenRouter) استفاده فرمایید.';
  }

  // 402 / Insufficient Balance
  if (msg.includes('Insufficient Balance') || msg.includes('insufficient_quota') || msg.includes('402')) {
    return 'موجودی یا اعتبار حساب کاربری شما کافی نیست (Insufficient Balance). لطفاً حساب خود را در پورتال ارائه‌دهنده بررسی و شارژ فرمایید.';
  }

  // 401 / Unauthorized & Invalid API Key
  if (msg.includes('Authentication Fails') || msg.includes('Invalid API Key') || msg.includes('invalid_api_key') || msg.includes('401') || msg.includes('Unauthorized')) {
    return 'کلید دسترسی سرور (System API Key) به این ارائه‌دهنده نامعتبر است (کد ۴۰۱). لطفاً در پنل ادمین بررسی کنید.';
  }

  // 400 / Bad Request
  if (msg.includes('400') || msg.includes('Bad Request') || msg.includes('invalid_request_error') || msg.includes('INVALID_ARGUMENT')) {
    return 'درخواست ارسالی توسط مدل پذیرفته نشد (کد ۴۰۰). لطفاً پیام یا تنظیمات مدل را بررسی کنید.';
  }

  // 503 / High Demand & Service Unavailable
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('Service Unavailable') || msg.includes('server_error') || msg.includes('overloaded')) {
    return 'سرورهای هوش مصنوعی در حال حاضر با حجم بالایی از درخواست‌ها مواجه هستند (کد ۵۰۳). لطفاً چند لحظه بعد دکمه «تلاش مجدد» را بزنید.';
  }

  // 429 / Rate Limit & Quota Exhausted
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('Rate limit') || msg.includes('exceeded your request quota') || msg.includes('rate_limit_exceeded')) {
    return 'سقف مجاز تعداد درخواست‌ها در دقیقه (Rate Limit) برای این مدل تکمیل شده است (کد ۴۲۹). لطفاً چند ثانیه صبر کرده و دکمه «تلاش مجدد» را بزنید یا در تنظیمات مدل دیگری مانند Gemini Flash Lite را انتخاب فرمایید.';
  }

  // 403 / Permission Denied
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return 'دسترسی کلید سرور (System API Key) به این مدل محدود شده است یا نامعتبر می‌باشد (کد ۴۰۳). لطفاً پنل ادمین را بررسی کنید.';
  }

  // 404 / Model Not Found or Not Available
  if (
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('Model Not Exist') ||
    msg.includes('model_not_found') ||
    msg.includes('not available') ||
    msg.includes('is not available') ||
    msg.includes('unknown model') ||
    msg.includes('invalid model')
  ) {
    return 'مدل انتخابی در سرویس‌دهنده در دسترس نیست یا نام آن تغییر کرده است. لطفاً از طریق آیکون تنظیمات ⚙️ مدل دیگری را انتخاب فرمایید.';
  }

  // Network / Fetch failed / Offline / Connection Timeout
  if (
    msg.includes('fetch failed') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('NetworkError') ||
    msg.includes('network error') ||
    msg.includes('timeout') ||
    msg.includes('und_err_connect_timeout') ||
    msg.includes('ConnectTimeoutError') ||
    msg.includes('socket hang up')
  ) {
    return 'ارتباط با اینترنت یا سرویس‌دهنده هوش مصنوعی برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کرده و دکمه «تلاش مجدد» را بزنید.';
  }

  // 500 / Internal Server Error
  if (msg.includes('500') || msg.includes('internal_server_error')) {
    return 'خطای داخلی سرور ارائه‌دهنده هوش مصنوعی (کد ۵۰۰). لطفاً چند لحظه بعد دوباره تلاش کنید.';
  }

  return msg.length > 250 ? msg.substring(0, 250) + '...' : msg;
}

// 1. Health check

export function formatContentsForGemini(messages: any[]) {
  const rawContents: { role: string; parts: any[] }[] = [];

  for (let idx = 0; idx < messages.length; idx++) {
    const m = messages[idx];
    const isCurrentTurn = idx === messages.length - 1;
    const parts: any[] = [];
    const textContent = typeof m.content === 'string' ? m.content.trim() : '';
    if (textContent) {
      parts.push({ text: textContent });
    }

    // Process all media attachments for current turn (supports multiple)
    const mediaUrls: string[] = isCurrentTurn
      ? (m.imageUrls && m.imageUrls.length > 0 ? m.imageUrls : m.imageUrl ? [m.imageUrl] : [])
      : [];

    if (mediaUrls.length > 0) {
      for (const mediaUrl of mediaUrls) {
        const matches = mediaUrl.match(/^data:(.+?);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          let cleanBase64 = matches[2];
          cleanBase64 = cleanBase64.replace(/^(?:data:[^;]+;base64,)+/, '').replace(/^base64[:,]/, '').trim();
          if (cleanBase64) {
            parts.push({ inlineData: { mimeType, data: cleanBase64 } });
          }
        }
      }
    } else if (!isCurrentTurn && (m.imageUrl || (m.imageUrls && m.imageUrls.length > 0))) {
      // De-duplicate past media: replace heavy base64 in past turns with lightweight textual placeholder
      if (!textContent.includes('[تصویر/رسانه')) {
        parts.push({ text: '[تصویر/رسانه ضمیمه شده قبلی: بررسی و تحلیل شد]' });
      }
    }

    // Ensure at least one part exists
    if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    rawContents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    });
  }

  // Ensure strict alternating roles starting with 'user'
  const alternatingContents: { role: string; parts: any[] }[] = [];
  for (const item of rawContents) {
    if (alternatingContents.length === 0) {
      if (item.role === 'model') {
        continue;
      }
      alternatingContents.push(item);
    } else {
      const last = alternatingContents[alternatingContents.length - 1];
      if (last.role === item.role) {
        last.parts.push(...item.parts);
      } else {
        alternatingContents.push(item);
      }
    }
  }

  // Fallback if empty
  if (alternatingContents.length === 0) {
    alternatingContents.push({
      role: 'user',
      parts: [{ text: 'سلام' }],
    });
  }

  return alternatingContents;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write('RIFF', 0);
  // file length minus 8 bytes of RIFF description
  header.writeUInt32LE(36 + dataSize, 4);
  // WAVE identifier
  header.write('WAVE', 8);
  // format chunk identifier
  header.write('fmt ', 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (1 is PCM)
  header.writeUInt16LE(1, 20);
  // channel count
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate
  header.writeUInt32LE(byteRate, 28);
  // block align
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitDepth, 34);
  // data chunk identifier
  header.write('data', 36);
  // data chunk length
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Downloads an image from URL or converts a base64 buffer,
 * resizes to maximum width/height (default 800px), compresses with WebP (quality 75),
 * and returns an ultra-lightweight data:image/webp;base64 string.
 */
export async function optimizeImageToWebpDataUrl(input: string | Buffer, maxWidth = 800, quality = 75): Promise<string | null> {
  try {
    const sharp = (await import('sharp')).default;
    let imageBuffer: Buffer;

    if (Buffer.isBuffer(input)) {
      imageBuffer = input;
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('data:image/webp;base64,')) {
        return trimmed;
      }
      if (trimmed.startsWith('data:image/')) {
        const commaIdx = trimmed.indexOf(',');
        if (commaIdx !== -1) {
          imageBuffer = Buffer.from(trimmed.slice(commaIdx + 1), 'base64');
        } else {
          return null;
        }
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const response = await fetch(trimmed, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
          console.warn(`[ImageOptimizer] Failed to fetch image (${response.status}): ${trimmed}`);
          return null;
        }
        const arrayBuf = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
      } else {
        return null;
      }
    } else {
      return null;
    }

    const webpBuffer = await sharp(imageBuffer)
      .resize({ width: maxWidth, height: maxWidth, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();

    return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
  } catch (err: any) {
    console.warn('[ImageOptimizer] WebP conversion failed:', err?.message || err);
    return null;
  }
}
