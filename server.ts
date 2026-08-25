import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

// In-Memory Response Cache for normalized identical queries (TTL: 1 hour)
interface CachedResponse {
  chunk: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  imageUrl?: string;
  timestamp: number;
}
const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 500;

function computeCacheKey(messages: Array<{ role: string; content: string; imageUrl?: string }>, model: string, systemPrompt?: string): string {
  const normalized = messages.map(m => ({
    r: m.role,
    c: (m.content || '').trim().toLowerCase(),
    img: m.imageUrl ? m.imageUrl.slice(0, 100) : ''
  }));
  const rawKey = JSON.stringify({ m: normalized, mod: model, s: (systemPrompt || '').trim() });
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function setCachedResponse(key: string, data: CachedResponse): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, data);
}

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

const app = express();
const PORT = 3000;

// Trust reverse proxy (Nginx / Cloud Run) for accurate IP resolution
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiter for test benchmark endpoint to prevent API quota drain and abuse
const modelTestRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 10, // Max 10 requests per IP per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: true,
  },
  message: {
    success: false,
    error: 'تعداد درخواست‌های تست مدل بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر دوباره تلاش کنید.',
  },
});

// SSRF Safe Base URL Validator
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

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const key = (customApiKey && String(customApiKey).trim()) || process.env.GEMINI_API_KEY;
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

// Helper to get Pollinations image URL
function getPollinationsImageUrl(prompt: string, aspectRatio = '1:1') {
  const encoded = encodeURIComponent(prompt);
  let dimW = 1024, dimH = 1024;
  if (aspectRatio === '16:9') { dimW = 1280; dimH = 720; }
  else if (aspectRatio === '9:16') { dimW = 720; dimH = 1280; }
  // Using model=flux for superior, artifact-free, professional quality
  return `https://image.pollinations.ai/prompt/${encoded}?width=${dimW}&height=${dimH}&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
}

function extractImagePrompt(text: string): string | null {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action_input?.prompt) return parsed.action_input.prompt;
      if (parsed.prompt) return parsed.prompt;
    }
  } catch (e) {}

  if (text.includes('dalle.text2im') || text.includes('action_input')) {
    const promptMatch = text.match(/"prompt"\s*:\s*"([^"]+)"/);
    if (promptMatch) return promptMatch[1];
  }
  return null;
}

let imageQuotaExceeded = false;

// Helper to translate and enhance image prompts into professional English prompts using Gemini with robust fallback
async function translateAndEnhanceImagePrompt(rawPrompt: string): Promise<string> {
  
  if (imageQuotaExceeded) {
    return `${rawPrompt}, highly detailed, 8k resolution, photorealistic, professional lighting, crisp focus, zero artifacts`;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `You are an expert AI art prompt engineer and master translator. Convert the following user request into a detailed, highly descriptive, flawless English image generation prompt optimized for Flux / Midjourney. Ensure high anatomical accuracy, crisp details, zero artifacts, perfect lighting, 8k resolution, and professional composition. Return ONLY the English prompt text, nothing else, no quotes, no markdown, no explanation. User request: "${rawPrompt}"`,
    });
    const enhanced = response.text?.trim();
    if (enhanced && enhanced.length > 3) {
      return enhanced;
    }
  } catch (e: any) {
    imageQuotaExceeded = true;
  }

  return `${rawPrompt}, highly detailed, 8k resolution, photorealistic, professional lighting, crisp focus, zero artifacts`;
}

// Helper to fetch live real-time web search results (Domestic Persian Feeds + Google News RSS / Web)
async function fetchLiveWebSearch(query: string): Promise<string | null> {
  if (!query || query.length < 2) return null;
  try {
    const isDomesticRequest = query.includes('ایران') || query.includes('داخلی') || query.includes('مهر') || query.includes('ایسنا') || query.includes('تسنیم') || query.includes('فارس') || query.includes('تابناک') || query.includes('خبرآنلاین') || query.includes('سایت');

    const items: string[] = [];

    // 1. If domestic Iranian news requested, fetch top domestic feeds in parallel directly from newsrooms
    if (isDomesticRequest) {
      const domesticSources = [
        { name: 'خبرگزاری ایسنا (ISNA)', url: 'https://www.isna.ir/rss' },
        { name: 'خبرگزاری مهر (Mehr)', url: 'https://www.mehrnews.com/rss' },
        { name: 'تابناک (Tabnak)', url: 'https://www.tabnak.ir/fa/rss/allnews' },
        { name: 'خبرآنلاین (Khabaronline)', url: 'https://www.khabaronline.ir/rss' }
      ];

      await Promise.allSettled(domesticSources.map(async (src) => {
        try {
          const res = await fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
          if (!res.ok) return;
          const xml = await res.text();
          const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>/g;
          let match;
          let count = 0;
          while ((match = regex.exec(xml)) !== null && count < 3) {
            const title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
            const link = match[2].trim();
            const date = match[3].trim();
            if (title && link) {
              items.push(`• [تیتر: ${title}] | [نام منبع: ${src.name}] | [لینک خبر: ${link}] | [زمان: ${date}]`);
              count++;
            }
          }
        } catch (e) {}
      }));
    }

    // 2. Fetch Google News RSS for international or topic-specific context
    const stopWords = [
      'رو', 'برای', 'من', 'بیار', 'بگو', 'چیست', 'کیست', 'چیه', 'لطفا', 'میشه', 'درباره', 'در مورد',
      'میخوام', 'بدونم', 'هست', 'جدید', 'آخرین', 'اخبار', 'خبر', 'خبرهای', 'رویداد', 'رویدادهای',
      'امروز', 'روز', 'لحظه', 'لحظه ای', 'سایت های خبری', 'سایت های', 'چک بکن', 'چک کن', 'news', 'latest'
    ];
    let cleaned = query.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    for (const sw of stopWords) {
      cleaned = cleaned.replace(new RegExp('\\b' + sw + '\\b', 'gi'), ' ').replace(new RegExp('(^|\\s)' + sw + '($|\\s)', 'gi'), ' ');
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    const isSpecificTopic = cleaned.length >= 2;
    const rssUrls = isSpecificTopic
      ? [
          `https://news.google.com/rss/search?q=${encodeURIComponent(cleaned)}&hl=fa&gl=IR&ceid=IR:fa`,
          'https://news.google.com/rss?hl=fa&gl=IR&ceid=IR:fa'
        ]
      : ['https://news.google.com/rss?hl=fa&gl=IR&ceid=IR:fa'];

    for (const rssUrl of rssUrls) {
      if (items.length >= 6) break;
      try {
        const res = await fetch(rssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3500)
        });
        if (!res.ok) continue;

        const xml = await res.text();
        const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>/g;
        let match;
        while ((match = regex.exec(xml)) !== null && items.length < 10) {
          let fullTitle = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          const date = match[3].trim();
          const sourceName = match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          
          if (fullTitle.endsWith(` - ${sourceName}`)) {
            fullTitle = fullTitle.slice(0, -(sourceName.length + 3)).trim();
          }

          const cleanSearchQuery = `${fullTitle} ${sourceName || ''}`.trim();
          const directLink = `https://www.google.com/search?q=${encodeURIComponent(cleanSearchQuery)}`;

          if (fullTitle) {
            items.push(`• [تیتر: ${fullTitle}] | [نام منبع: ${sourceName || 'خبرگزاری'}] | [لینک خبر: ${directLink}] | [زمان: ${date}]`);
          }
        }
        if (items.length > 0) break;
      } catch (e) {}
    }

    if (items.length > 0) {
      return items.join('\n');
    }
  } catch (e) {}
  return null;
}

// Helper for Universal Web Search (Programming code, documentation, guides, stackoverflow, general questions - like ChatGPT)
async function fetchUniversalWebSnippets(query: string): Promise<string | null> {
  if (!query || query.length < 2) return null;
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa,en-US;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(4500)
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const linkMatches = [...html.matchAll(/<a class="result__url"[^>]*href="([^"]*)"[^>]*>/g)];
    const snippetMatches = [...html.matchAll(/<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
    
    const items: string[] = [];
    for (let i = 0; i < Math.min(linkMatches.length, snippetMatches.length, 5); i++) {
      let rawUrl = linkMatches[i][1];
      if (rawUrl.includes('uddg=')) {
        const m = rawUrl.match(/uddg=([^&]+)/);
        if (m) rawUrl = decodeURIComponent(m[1]);
      }
      const snippet = snippetMatches[i][1]
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      if (rawUrl && snippet) {
        items.push(`• [منبع: ${rawUrl}]\n  مستندات و خلاصه راهکار: ${snippet}`);
      }
    }
    if (items.length > 0) {
      return items.join('\n\n');
    }
  } catch (e) {}
  return null;
}
// Helper to fetch live real-time product prices & shopping comparison from Torob API
async function fetchTorobProducts(query: string): Promise<string | null> {
  if (!query || query.length < 2) return null;
  try {
    const stopWords = ['قیمت', 'خرید', 'ترب', 'دیجی کالا', 'دیجیکالا', 'چنده', 'ارزان', 'تومان', 'فروشگاه', 'مشخصات', 'رو', 'برای', 'من', 'بیار', 'بگو', 'چیست', 'لطفا'];
    let cleanQuery = query.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    for (const sw of stopWords) {
      cleanQuery = cleanQuery.replace(new RegExp('\\b' + sw + '\\b', 'gi'), ' ').replace(new RegExp('(^|\\s)' + sw + '($|\\s)', 'gi'), ' ');
    }
    cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim() || query;

    const url = `https://api.torob.com/v4/base-product/search/?size=6&q=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const validProducts = (data.results || []).filter((x: any) => !x.is_adv);
    const targetProducts = validProducts.length > 0 ? validProducts : data.results;

    const items = targetProducts.slice(0, 5).map((p: any) => {
      const productKey = p.random_key || p.prk;
      const cleanUrl = productKey
        ? `https://torob.com/p/${productKey}/`
        : `https://torob.com/search/?query=${encodeURIComponent(p.name1 || cleanQuery)}`;
      return `• [نام کالا: ${p.name1}] | [قیمت: ${p.price_text || 'استعلام قیمت'}] | [موجودی: ${p.shop_text || 'در فروشگاه‌های آنلاین'}] | [لینک مقایسه و خرید در ترب: ${cleanUrl}]`;
    });
    return items.join('\n');
  } catch (e) {
    return null;
  }
}
function normalizeBaseUrl(url?: string, provider?: string): string {
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

function parseCustomHeaders(customHeaders?: string): Record<string, string> {
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
function extractCleanErrorMessage(err: any): string {
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
function sanitizeErrorMessage(err: any): string {
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
    return 'کلید دسترسی (API Key) نامعتبر است یا اشتباه وارد شده است (کد ۴۰۱). لطفاً کلید معتبر خود را در بخش تنظیمات وارد کنید.';
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
    return 'کلید دسترسی (API Key) نامعتبر است یا دسترسی لازم به این مدل را ندارد (کد ۴۰۳). لطفاً در تنظیمات کلید صحیح را وارد کنید.';
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
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Test Connection & Benchmark Latency endpoint
app.post(['/api/models/test', '/api/ping'], modelTestRateLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    const { provider, customBaseUrl, customApiKey, customHeaders, modelName } = req.body;

    // Strict SSRF validation
    if (customBaseUrl && !isSafeBaseUrl(customBaseUrl)) {
      return res.status(400).json({
        success: false,
        statusType: 'network_error',
        error: 'آدرس پایه وارد شده (Base URL) نامعتبر یا به دلایل امنیتی غیرمجاز است.',
      });
    }

    if (provider === 'gemini') {
      const apiKey = customApiKey ? String(customApiKey).trim() : undefined;
      const ai = getGeminiClient(apiKey);
      const targetModel = modelName || 'gemini-3.1-flash-lite';
      
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

      const apiKey = customApiKey ? String(customApiKey).trim() : '';
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
      };
      
      if (apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Persian AI Chatbox';
      }

      // Merge user custom headers
      const userHeaders = parseCustomHeaders(customHeaders);
      Object.assign(headers, userHeaders);

      let model = modelName;
      if (!model) {
        if (provider === 'deepseek') model = 'deepseek-chat';
        else if (provider === 'openai') model = 'gpt-4o-mini';
        else if (provider === 'openrouter') model = 'meta-llama/llama-3.3-70b-instruct';
        else model = 'gpt-5.4-mini';
      }

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
            max_tokens: 15,
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

      if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;
        let statusType: string = 'unknown_error';
        let errorMsg = '';

        if (status === 401) {
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
          errorMsg = 'سقف استفاده تکمیل شده است (429 Rate Limit)';
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

// Helper to format and normalize messages for Gemini API
function formatContentsForGemini(messages: any[]) {
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

// Helper sleep function for retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 3. Streaming Chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send immediate initial ping to establish connection with proxies/browsers
  res.write(': connected\n\n');

  let isEnded = false;
  let heartbeat: any = null;
  const abortController = new AbortController();

  const cleanup = () => {
    abortController.abort(); // Cancel outgoing requests if user disconnects
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const finishStream = () => {
    if (isEnded) return;
    isEnded = true;
    cleanup();
    try {
      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    } catch {}
  };

  const sendChunk = (data: {
    chunk?: string;
    error?: string;
    done?: boolean;
    modelUsed?: string;
    imageUrl?: string;
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  }) => {
    if (isEnded || res.writableEnded || res.destroyed) return;
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (e) {
      // Ignore write errors if client disconnected
    }
  };

  // Heartbeat ping every 15 seconds to prevent VPN/proxy/firewall timeout drops
  heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed && !isEnded) {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        cleanup();
      }
    } else {
      cleanup();
    }
  }, 15000);

  req.on('close', cleanup);
  res.on('finish', cleanup);
  res.on('error', cleanup);

  try {
    const { messages, apiConfig: rawApiConfig, settings } = req.body;

    // Normalize apiConfig from either `apiConfig` or `settings`
    const apiConfig = rawApiConfig || (settings ? {
      activeProvider: settings.providers?.activeProvider,
      gemini: settings.providers?.gemini,
      openai: settings.providers?.openai,
      anthropic: settings.providers?.anthropic,
      custom: settings.providers?.custom,
      systemInstruction: settings.persona?.systemPrompt,
      temperature: settings.persona?.temperature,
      webSearch: settings.tools?.webSearch,
    } : undefined);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      sendChunk({ error: 'پیامی برای ارسال یافت نشد.' });
      sendChunk({ done: true });
      return finishStream();
    }

    let provider = apiConfig?.activeProvider || 'gemini';

    // Prune history to last 6 messages max for high throughput and reduced prompt processing latency
    const prunedMessages = messages.slice(-6);

    // Generate real-time live date and time context (Solar Hijri, Gregorian & Islamic Hijri)
    const now = new Date();
    const faParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tehran',
    }).formatToParts(now);
    const faWeekday = faParts.find(p => p.type === 'weekday')?.value || '';
    const faDay = faParts.find(p => p.type === 'day')?.value || '';
    const faMonth = faParts.find(p => p.type === 'month')?.value || '';
    const faYear = faParts.find(p => p.type === 'year')?.value || '';
    const faFullDate = `${faWeekday}، ${faDay} ${faMonth} ${faYear}`;

    const faNumeric = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tehran',
    }).format(now);
    const faTime = new Intl.DateTimeFormat('fa-IR', { timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(now);
    const enDateFull = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tehran',
    }).format(now);
    const enNumeric = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    
    const islamicParts = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tehran',
    }).formatToParts(now);
    const islamicWeekday = islamicParts.find(p => p.type === 'weekday')?.value || '';
    const islamicDay = islamicParts.find(p => p.type === 'day')?.value || '';
    const islamicMonth = islamicParts.find(p => p.type === 'month')?.value || '';
    const islamicYear = islamicParts.find(p => p.type === 'year')?.value || '';
    const islamicDate = `${islamicWeekday}، ${islamicDay} ${islamicMonth} ${islamicYear}`;

    const islamicNumeric = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura-nu-arabext', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tehran',
    }).format(now);
    const timeContext = `[اطلاعات زمانی زنده: هم‌اکنون ${faFullDate} (${faNumeric})، ساعت ${faTime} به وقت ایران (معادل میلادی: ${enDateFull} [${enNumeric}] | قمری: ${islamicDate} [${islamicNumeric}]) است.]`;

    // Fetch real-time web search results if webSearch tool is enabled
    let liveWebContext = '';
    const lastUserMsg = prunedMessages.slice().reverse().find((m: any) => m.role === 'user');
    const userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

    // Check for Date & Calendar queries to render the gorgeous iOS-style Calendar Widget
    const isDateInquiry = userText && (
      userText.includes('امروز چه روز') ||
      userText.includes('تاریخ امروز') ||
      userText.includes('امروز چندمه') ||
      userText.includes('امروز چندم') ||
      userText.includes('امروز چه تاریخ') ||
      userText.includes('تقویم امروز') ||
      userText.includes('روز چندمه') ||
      userText.includes('امروز چنده') ||
      userText.includes('روز هفته')
    );

    if (isDateInquiry) {
      liveWebContext = `\n\n[اطلاعات زمانی و تقویمی زنده و معتبر (بر اساس مرجع رسمی تقویم ایران):
- تاریخ هجری شمسی: ${faFullDate} (عددی: ${faNumeric})
- ساعت رسمی ایران: ${faTime}
- تاریخ میلادی: ${enDateFull} (عددی: ${enNumeric})
- تاریخ هجری قمری: ${islamicDate} (عددی: ${islamicNumeric})

دستورالعمل حیاتی نمایش تقویم (ساختار ۱ کارت ویجت شیشه‌ای کاملاً یکپارچه):
کاربر درباره تاریخ امروز سوال پرسیده است. پاسخ خود را دقیقاً درون **یک بلوک نقل‌قول واحد (با قرار دادن علامت > در ابتدای تمامی خطوط)** به شکل زیر ارائه دهید:

> ### 📅 **تقویم و زمان رسمی امروز**
> 
> ### ☀️ **${faFullDate}**
> \`[ ${faNumeric} ]\` • *ساعت ${faTime} به وقت رسمی ایران*
> 
> ---
> 
> 🌍 **میلادی:** \`${enDateFull}\`  
> 🌙 **قمری:** **${islamicDate}** *( ${islamicNumeric} )*  
> 
> ---
> 
> 📌 **مناسبت‌های رسمی و تاریخی امروز:**
> * 🌸 ولادت حضرت رسول اکرم (ص) به روایت اهل سنت و آغاز هفته وحدت
> * 📜 سالروز اشغال ایران توسط قوای متفقین در جریان جنگ جهانی دوم (سال ۱۳۲۰)]`;
    }

    if (apiConfig?.webSearch && !isDateInquiry) {
      if (userText && userText.trim().length > 1) {
        const lower = userText.toLowerCase();

        // 1. Currency, Gold, Crypto, and Financial Market inquiries (MUST use Live Web/Financial Intelligence, NOT Torob)
        const isFinancialOrCurrencyQuery = userText.includes('دلار') || userText.includes('یورو') || userText.includes('ارز') ||
          userText.includes('تتر') || userText.includes('طلا') || userText.includes('سکه') ||
          userText.includes('بیت کوین') || userText.includes('رمز ارز') || userText.includes('کریپتو') ||
          userText.includes('بورس') || userText.includes('سهام') || userText.includes('نفت') ||
          userText.includes('بنزین') || userText.includes('مسکن') || userText.includes('اجاره');

        // 2. Physical consumer products / ecommerce shopping (Torob)
        const isPhysicalShoppingQuery = !isFinancialOrCurrencyQuery && (
          userText.includes('ترب') || userText.includes('دیجی کالا') || userText.includes('دیجیکالا') ||
          userText.includes('خرید کالا') || userText.includes('خرید آنلاین') ||
          userText.includes('گوشی') || userText.includes('موبایل') || userText.includes('لپ تاپ') ||
          userText.includes('تبلت') || userText.includes('هدفون') || userText.includes('ایرپاد') ||
          userText.includes('پاوربانک') || userText.includes('ساعت هوشمند') || userText.includes('تلویزیون') ||
          userText.includes('یخچال') || userText.includes('ps5') || userText.includes('کنسول') ||
          lower.includes('galaxy') || lower.includes('iphone') || lower.includes('s24') || lower.includes('s25') ||
          userText.includes('سامسونگ') || userText.includes('شیائومی') || userText.includes('آیفون')
        );
        
        if (isPhysicalShoppingQuery) {
          const torobResults = await fetchTorobProducts(userText);
          if (torobResults) {
            liveWebContext = `\n\n[اطلاعات زنده استعلام و مقایسه قیمت کالاها از موتور جستجوی ترب:\n${torobResults}\n\nدستورالعمل مهم نمایش قیمت و کالاها (ساختار کارتی زیبا و راست‌چین):
اطلاعات بالا قیمت‌های لحظه‌ای و زنده بازار از موتور جستجوی ترب هستند. لطفاً برای هر کالا یک کارت بسیار تمیز به شکل زیر بنویسید:
#### 🛍️ **[نام دقیق کالا]**
> **[قیمت استخراج‌شده: قیمت کالا]**
> * وضعیت موجودی: [تعداد فروشگاه‌های آنلاین موجود]
> 
> *🔍 [مشاهده و مقایسه قیمت‌ها در ترب](لینک مستقیم ترب)*

بین هر کارت یک خط جداکننده (---) بگذارید و هرگز نگویید به قیمت‌ها دسترسی ندارید.]`;
          }
        }

        const isNewsQuery = userText.includes('اخبار') || userText.includes('خبر') || userText.includes('رویداد') || userText.includes('تیتر') || userText.includes('اتفاقات');

        if (!liveWebContext && isNewsQuery) {
          const searchResults = await fetchLiveWebSearch(userText);
          if (searchResults) {
            liveWebContext = `\n\n[نتایج زنده جستجوی اینترنت و اخبار برای سوال کاربر:\n${searchResults}\n\nدستورالعمل حیاتی قالب‌بندی اخبار (ساختار ۱ کارت واحد برای هر خبر):
شما به نتایج زنده وب دسترسی دارید. برای هر خبر، تمام اجزا (تیتر، متن و منبع) را پیوسته و درون **یک بلوک نقل‌قول واحد (علامت > در تمام خطوط)** بنویسید تا در یک کارت منسجم قرار گیرند.
برای عنوان هر دسته‌بندی موضوعی، دقیقاً از ایموجی متناسب با همان موضوع استفاده کنید:
- اقتصاد، بازار و تحریم‌ها: 💰 یا 📈
- ورزش، مسابقات و فوتبال: ⚽ یا 🏆
- جامعه، شهر و امور اجتماعی: 🏙️ یا 👥
- سیاست، حقوق، بین‌الملل و قوانین: ⚖️ یا 📜
- علم، فناوری و هوش مصنوعی: 💻 یا 🤖
- پزشکی، سلامت و دارویی: 🩺 یا 🔬
- فرهنگ، هنر، سینما و موسیقی: 🎬 یا 🎭

نمونه ساختار:
#### [ایموجی متناسب با موضوع] **[عنوان دسته‌بندی موضوعی]**
> ### 📰 **[تیتر برجسته خبر]**
> [خلاصه کوتاه و روان از رویداد در یک یا دو جمله]
> 
> *📌 منبع: [نام خبرگزاری](لینک خبر) • زمان انتشار: ساعت و تاریخ*

بین هر خبر یک خط جداکننده (---) بگذارید.]`;
          }
        }

        // For programming, technical questions, bug fixing, documentation lookup, tutorials and general knowledge
        if (!liveWebContext) {
          const universalSnippets = await fetchUniversalWebSnippets(userText);
          if (universalSnippets) {
            liveWebContext = `\n\n[مستندات، راهنماها و نتایج زنده وب مرتبط با سوال کاربر:\n${universalSnippets}\n\nدستورالعمل هوش مصنوعی برای پاسخ‌دهی (مشابه ChatGPT با وب‌سرچ):
شما یک دستیار هوشمند، مهندس نرم‌افزار ارشد و متخصص مسلط به حل مسائل هستید. با ترکیب پایگاه دانش عمیق خود و مستندات زنده بالا از وب، پاسخی دقیق، جامع و ساختاریافته به زبان فارسی ارائه دهید.
اگر سوال مربوط به کدنویسی، خطا یا معماری برنامه است:
- قطعه کدهای کامل و کاربردی را در بلوک‌های کد استاندارد (با ذکر دقیق زبان مانند \`\`\`typescript یا \`\`\`python) بنویسید.
- نکات کلیدی، دلایل فنی و بهترین الگوها (Best Practices) را به صورت شفاف و مرحله‌به‌مرحله توضیح دهید.
- در صورت نیاز می‌توانید به لینک مستندات بالا ارجاع دهید.]`;
          }
        }
      }
    }

    const baseSystemPrompt = `شما «دستیار هوشمند» هستید؛ متمرکز، دقیق و مسلط به زبان فارسی. پاسخها را به فارسی شیوا، دستهبندیشده و ساختاریافته ارائه دهید. در موضوعات فنی و برنامهنویسی، کدهای استاندارد همراه با توضیحات موجز بنویسید. هرگز خود را با نام پلتفرمهای متفرقه معرفی نکنید.\n\n${timeContext}${liveWebContext}`;
    const systemInstruction = apiConfig?.systemInstruction ? `${apiConfig.systemInstruction}\n\n${timeContext}${liveWebContext}\n\nنکته نگارشی: همیشه اصول، مراحل و لیست‌های شماره‌دار را در خطوط مجزا تفکیک کن.` : baseSystemPrompt;

    // Check In-Memory Cache for normalized query
    const cacheKey = computeCacheKey(prunedMessages, apiConfig?.[provider]?.modelName || 'default', systemInstruction);
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      if (cached.chunk) {
        sendChunk({ chunk: cached.chunk });
      }
      if (cached.imageUrl) {
        sendChunk({ imageUrl: cached.imageUrl });
      }
      sendChunk({ done: true, usage: cached.usage });
      return finishStream();
    }

    if (provider === 'gemini') {
      const ai = getGeminiClient(apiConfig?.[provider]?.apiKey);
      let modelName = apiConfig?.[provider]?.modelName || 'gemini-3.1-flash-lite';

      // Format messages for Gemini API using robust helper on pruned history
      const formattedContents = formatContentsForGemini(prunedMessages);

      // Stream generation with intelligent retry and fallback on high demand (503 / 429)
      let streamedSuccessfully = false;
      let lastError: any = null;
      let hasSentAnyChunk = false;
      const candidateModels = [
        modelName,
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ].filter((v, i, a) => a.indexOf(v) === i);

      let geminiUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined = undefined;

      for (const candidate of candidateModels) {
        if (hasSentAnyChunk) break;

        let attempts = 0;
        const maxAttempts = candidate === modelName ? 3 : 1;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            const streamConfig: any = {
              systemInstruction: systemInstruction,
              temperature: typeof apiConfig?.temperature === 'number' ? apiConfig.temperature : 0.7,
              topP: 0.8,
              topK: 40,
            };

            if (typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0) {
              streamConfig.maxOutputTokens = apiConfig.maxTokens;
            }

            const streamResponse = await ai.models.generateContentStream({
              model: candidate,
              contents: formattedContents,
              config: streamConfig,
            });

            let fullText = '';
            for await (const chunk of streamResponse) {
              const text = chunk.text;
              if (text) {
                fullText += text;
                sendChunk({ chunk: text });
                hasSentAnyChunk = true;
              }

              // Capture official usageMetadata from Gemini stream
              const usageMeta = (chunk as any)?.usageMetadata;
              if (usageMeta) {
                geminiUsage = {
                  promptTokens: usageMeta.promptTokenCount,
                  completionTokens: usageMeta.candidatesTokenCount,
                  totalTokens: usageMeta.totalTokenCount,
                };
              }
            }

            // Check if user explicitly requested an image via command or if model generated a tool call / JSON action
            const lastUserMsg = prunedMessages[prunedMessages.length - 1]?.content || '';
            const isImageIntent = /^\/image\b|^\/تصویر\b/i.test(lastUserMsg);

            let targetImagePrompt: string | null = null;
            if (isImageIntent) {
              try {
                const jsonParsed = JSON.parse(lastUserMsg);
                if (jsonParsed.action_input) {
                  const inner = typeof jsonParsed.action_input === 'string' ? JSON.parse(jsonParsed.action_input) : jsonParsed.action_input;
                  if (inner.prompt) targetImagePrompt = inner.prompt;
                }
              } catch (e) {}

              if (!targetImagePrompt) {
                targetImagePrompt = lastUserMsg
                  .replace(/^\/(image|تصویر)\b/i, '')
                  .trim();
                if (!targetImagePrompt || targetImagePrompt.length < 2) {
                  targetImagePrompt = lastUserMsg;
                }
              }
            } else {
              targetImagePrompt = extractImagePrompt(fullText);
            }

            let generatedImageUrl: string | undefined = undefined;
            if (targetImagePrompt) {
              const enhancedPrompt = await translateAndEnhanceImagePrompt(targetImagePrompt);
              generatedImageUrl = getPollinationsImageUrl(enhancedPrompt);
              sendChunk({ imageUrl: generatedImageUrl });
            }

            // Cache full response in-memory for instant recall
            if (fullText) {
              setCachedResponse(cacheKey, {
                chunk: fullText,
                usage: geminiUsage,
                imageUrl: generatedImageUrl,
                timestamp: Date.now(),
              });
            }

            streamedSuccessfully = true;
            lastError = null;
            break;
          } catch (err: any) {
            lastError = err;
            const errMsg = extractCleanErrorMessage(err);
            const is503 =
              errMsg.includes('503') ||
              errMsg.includes('high demand') ||
              errMsg.includes('UNAVAILABLE') ||
              errMsg.includes('Service Unavailable');

            if (is503 && attempts < maxAttempts && !hasSentAnyChunk) {
              const delay = attempts * 500;
              console.warn(
                `Transient 503 spike on ${candidate} (attempt ${attempts}/${maxAttempts}), retrying in ${delay}ms...`
              );
              await sleep(delay);
              continue;
            }

            const cleanSummary = errMsg.length > 80 ? errMsg.substring(0, 80) + '...' : errMsg;
            console.warn(`Model ${candidate} unavailable (${cleanSummary}). Switching to next candidate...`);
            break;
          }
        }

        if (streamedSuccessfully) {
          break;
        }
      }

      if (!streamedSuccessfully) {
        if (!hasSentAnyChunk) {
           const errMsg = lastError ? extractCleanErrorMessage(lastError) : 'مدل هوش مصنوعی در دسترس نیست';
           let frontendMsg = '⚠️ خطا در ارتباط با مدل.';
           if (errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
             frontendMsg = '⚠️ محدودیت استفاده (Quota) به پایان رسیده است. لطفا کلید API معتبر وارد کنید.';
           } else if (errMsg.includes('503')) {
             frontendMsg = '⚠️ مدل هوش مصنوعی در حال حاضر با ترافیک بالا مواجه است (۵۰۳). لطفاً چند لحظه دیگر دوباره تلاش کنید.';
           } else {
             frontendMsg = `⚠️ خطا: ${errMsg}`;
           }
          sendChunk({
            error: frontendMsg,
          });
        }
      }

      sendChunk({ done: true, usage: geminiUsage });
      return finishStream();
    } else {
      // DeepSeek / OpenAI compatible / Custom endpoint streaming
      if (apiConfig?.[provider]?.baseUrl && !isSafeBaseUrl(apiConfig?.[provider]?.baseUrl)) {
        sendChunk({ error: 'آدرس پایه اندپوینت (Base URL) به دلایل امنیتی غیرمجاز است.' });
        sendChunk({ done: true });
        return finishStream();
      }

      const baseUrl = normalizeBaseUrl(apiConfig?.[provider]?.baseUrl, provider);
      if (!baseUrl) {
        sendChunk({ error: 'آدرس پایه اندپوینت (Base URL) نامعتبر است.' });
        sendChunk({ done: true });
        return finishStream();
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
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Persian AI Chatbox';
      }

      // Merge user custom headers
      const userHeaders = parseCustomHeaders(apiConfig?.custom?.customHeaders);
      Object.assign(headers, userHeaders);

      // Build payload with history sanitization from pruned history (last 6 messages)
      let hasUnsupportedMediaInCurrentTurn = false;
      const formattedMessages = [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        ...prunedMessages.map((m: any, index: number) => {
          const isCurrentTurn = index === prunedMessages.length - 1;
          const textContent = typeof m.content === 'string' ? m.content : '';

          // Gather all media URLs for this message (prefer imageUrls array, fallback to imageUrl)
          const allMediaUrls: string[] = isCurrentTurn
            ? (m.imageUrls && m.imageUrls.length > 0 ? m.imageUrls : m.imageUrl ? [m.imageUrl] : [])
            : [];

          const hasPastMedia = !isCurrentTurn && (m.imageUrl || (m.imageUrls && m.imageUrls.length > 0));
          if (hasPastMedia) {
            // Past turn: de-duplicate media to lightweight text placeholder
            const contentWithNote = textContent.includes('[تصویر/رسانه')
              ? textContent
              : `[تصویر/رسانه ضمیمه شده قبلی: بررسی و تحلیل شد]\n${textContent}`;
            return { role: m.role, content: contentWithNote };
          }

          if (allMediaUrls.length > 0) {
            const imageParts: any[] = [];
            for (const mediaUrl of allMediaUrls) {
              const matches = mediaUrl.match(/^data:(.+?);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const mimeType = matches[1];
                let cleanBase64 = matches[2];
                cleanBase64 = cleanBase64.replace(/^(?:data:[^;]+;base64,)+/, '').replace(/^base64[:,]/, '').trim();
                const isAudioOrVideo = mimeType.startsWith('audio/') || mimeType.startsWith('video/');
                if (isAudioOrVideo) {
                  hasUnsupportedMediaInCurrentTurn = true;
                  continue;
                }
                if (mimeType.startsWith('image/')) {
                  imageParts.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } });
                }
              }
            }
            if (imageParts.length > 0) {
              return {
                role: m.role,
                content: [
                  { type: 'text', text: textContent },
                  ...imageParts,
                ],
              };
            }
          }
          return {
            role: m.role,
            content: textContent,
          };
        }),
      ];

      if (hasUnsupportedMediaInCurrentTurn) {
         sendChunk({ error: 'این مدل فقط از متن و تصویر پشتیبانی می‌کند. لطفاً برای تحلیل مستقیم فایل صوتی یا ویدیویی از مدل‌های Gemini استفاده نمایید.' });
         sendChunk({ done: true });
         return finishStream();
      }

      let model = apiConfig?.[provider]?.modelName;
      if (!model) {
        if (provider === 'deepseek') model = 'deepseek-chat';
        else if (provider === 'openai') model = 'gpt-4o-mini';
        else if (provider === 'openrouter') model = 'meta-llama/llama-3.3-70b-instruct';
        else model = 'gpt-5.4-mini';
      }

      let response: any;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0 ? apiConfig.maxTokens : 1024,
            stream: true,
            stream_options: { include_usage: true },
          }),
        });
      } catch (fetchErr: any) {
        console.error('Fetch error to custom endpoint:', fetchErr);
        sendChunk({ error: sanitizeErrorMessage(fetchErr) });
        sendChunk({ done: true });
        return finishStream();
      }

      if (!response.ok) {
        let errorText = '';
        try {
           errorText = await response.text();
        } catch { }
        sendChunk({ error: sanitizeErrorMessage(errorText || `Status ${response.status}`) });
        sendChunk({ done: true });
        return finishStream();
      }

      if (!response.body) {
        sendChunk({ error: 'پاسخی از سرور دریافت نشد.' });
        sendChunk({ done: true });
        return finishStream();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let isReasoningPhase = false;
      let openaiUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined = undefined;

      let fullAccumulatedCustom = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            continue;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.slice(6);
              const parsed = JSON.parse(jsonStr);

              // Capture token usage if present
              if (parsed.usage) {
                openaiUsage = {
                  promptTokens: parsed.usage.prompt_tokens,
                  completionTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens,
                };
              }

              const delta = parsed.choices?.[0]?.delta;

              const reasoningChunk = delta?.reasoning_content;
              const contentChunk = delta?.content;

              if (reasoningChunk) {
                if (!isReasoningPhase) {
                  isReasoningPhase = true;
                  const reasonPrefix = '> 🧠 *استدلال عمیق DeepSeek R1:*\n> ';
                  fullAccumulatedCustom += reasonPrefix;
                  sendChunk({ chunk: reasonPrefix });
                }
                const formattedReason = reasoningChunk.replace(/\n/g, '\n> ');
                fullAccumulatedCustom += formattedReason;
                sendChunk({ chunk: formattedReason });
              } else if (contentChunk) {
                if (isReasoningPhase) {
                  isReasoningPhase = false;
                  fullAccumulatedCustom += '\n\n---\n\n';
                  sendChunk({ chunk: '\n\n---\n\n' });
                }
                fullAccumulatedCustom += contentChunk;
                sendChunk({ chunk: contentChunk });
              }
            } catch {
              // Non-fatal JSON parse error for partial chunks
            }
          }
        }
      }

      // Process any residual buffer
      if (buffer.trim()) {
        const remainingLines = buffer.split('\n');
        for (const line of remainingLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const contentChunk = parsed.choices?.[0]?.delta?.content;
              if (contentChunk) {
                fullAccumulatedCustom += contentChunk;
                sendChunk({ chunk: contentChunk });
              }
            } catch {}
          }
        }
      }

      // Cache full response in-memory for instant recall
      if (fullAccumulatedCustom) {
        setCachedResponse(cacheKey, {
          chunk: fullAccumulatedCustom,
          usage: openaiUsage,
          timestamp: Date.now(),
        });
      }

      sendChunk({ done: true, usage: openaiUsage });
      return finishStream();
    }
  } catch (err: any) {
    console.error('Streaming error in /api/chat/stream:', err);
    sendChunk({ error: sanitizeErrorMessage(err) });
    sendChunk({ done: true });
    return finishStream();
  }
});

// Fetch Models endpoint (Dynamic Synchronization)
app.post('/api/fetch-models', async (req, res) => {
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
app.post('/api/generate-image', async (req, res) => {
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
app.post('/api/enhance-prompt', async (req, res) => {
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
app.post('/api/tts', async (req, res) => {
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
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Persian AI Chatbox Server running on http://localhost:${PORT}`);
  });
}

start();
