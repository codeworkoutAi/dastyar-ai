import cron from 'node-cron';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import db, { syncDatabase } from '../db/database';
import { getGeminiClient, getPollinationsImageUrl, optimizeImageToWebpDataUrl, getGeminiKeyFromPool } from './utils';
import { bot, getTelegramBot } from '../telegram/bot';

// Path for persistent news-cron log file
const LOG_FILE = path.join(process.cwd(), 'server', 'data', 'news-cron.log');

// Orders created in Telegram notifications carry a UTC `createdAt` from SQLite.
// Passing that straight to `new Date()` makes the engine read it as LOCAL time,
// shifting the displayed timestamp by the server's UTC offset (Render is UTC, so
// the admin sees a wrong time). Parse it as UTC explicitly and render in Tehran.
const TEHRAN_TZ = 'Asia/Tehran';

function formatTehranDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const raw: string = value instanceof Date ? value.toISOString() : String(value);
  // SQLite stores 'YYYY-MM-DD HH:MM:SS' in UTC with no zone marker.
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z'
    : raw;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('fa-IR', { timeZone: TEHRAN_TZ });
}
export function appendCronLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: any) {
  try {
    const dataDir = path.join(process.cwd(), 'server', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const now = new Date();
    const tehranTime = now.toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
    const isoTime = now.toISOString();

    let line = `[${isoTime}] [${tehranTime}] [${level}] ${message}`;
    if (details !== undefined) {
      const detailsStr = typeof details === 'string' ? details : (details instanceof Error ? (details.stack || details.message) : JSON.stringify(details));
      line += ` | ${detailsStr}`;
    }
    line += '\n';

    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('[NewsCron] Failed to write to log file:', e);
  }
}

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 15000,
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// Comprehensive list of reputable AI news feeds
const RSS_FEEDS = [
  'https://theverge.com/rss/ai-artificial-intelligence/index.xml',
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://venturebeat.com/category/ai/feed/',
  'https://www.artificialintelligence-news.com/feed/',
  'https://www.technologyreview.com/topic/artificial-intelligence/feed',
  'https://arstechnica.com/tag/ai/feed/',
  'https://www.wired.com/feed/tag/ai/latest/rss',
  'https://www.zdnet.com/topic/artificial-intelligence/rss.xml',
  'https://decrypt.co/feed',
  'https://openai.com/news/rss.xml'
];

export function sanitizeImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
  return cleaned;
}

/**
 * Scrapes the target article's real webpage to extract:
 * 1. High-resolution og:image or twitter:image
 * 2. Full article text from <p> tags instead of short RSS snippets
 */
async function fetchSourceArticleDetails(url: string): Promise<{ fullContent: string; ogImage: string }> {
  let fullContent = '';
  let ogImage = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      appendCronLog('WARN', `Source article HTTP error (${res.status}) for ${url}`);
      return { fullContent, ogImage };
    }

    const html = await res.text();

    // 1. Extract OpenGraph or Twitter Image
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"'>]+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"'>]+)["'][^>]+property=["']og:image:secure_url["']/i) ||
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"'>]+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"'>]+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"'>]+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"'>]+)["'][^>]+name=["']twitter:image["']/i) ||
      html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"'>]+)["']/i);

    if (ogMatch && ogMatch[1]) {
      const candidate = sanitizeImageUrl(ogMatch[1]);
      try {
        ogImage = new URL(candidate, url).href;
      } catch {
        ogImage = candidate;
      }
    }

    // 2. Clean HTML and extract full article paragraphs
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');

    const articleMatch = cleanHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    const targetBlock = articleMatch ? articleMatch[1] : cleanHtml;

    const paragraphs: string[] = [];
    const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = pRegex.exec(targetBlock)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      // Filter out short cookie notices, disclaimer banners or author bios
      if (text.length > 50 && !text.toLowerCase().includes('cookie') && !text.toLowerCase().includes('subscribe')) {
        paragraphs.push(text);
      }
    }

    if (paragraphs.length > 0) {
      fullContent = paragraphs.join('\n\n');
    }
  } catch (err: any) {
    appendCronLog('WARN', `Error scraping source article at ${url}`, err?.message || err);
  }

  return { fullContent, ogImage };
}

export async function fetchAndProcessNews() {
  const startMsg = `Starting news fetch task (Daily scheduled run at 08:00 AM Asia/Tehran)...`;
  console.log(`[NewsCron] ${startMsg}`);
  appendCronLog('INFO', startMsg);

  try {
    // Check site_settings table for news_auto_publish toggle (default to true)
    const settingRow = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('news_auto_publish') as { value: string } | undefined;
    const isAutoPublish = settingRow ? settingRow.value !== 'false' : true;
    if (!isAutoPublish) {
      const skipMsg = 'Automatic news publishing is disabled in site settings. Skipping news fetch task.';
      console.log(`[NewsCron] ${skipMsg}`);
      appendCronLog('INFO', skipMsg);
      return;
    }
    const apiKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY || getGeminiKeyFromPool() || '';
    const ai = getGeminiClient(apiKey, true);

    let targetItem: any = null;
    let selectedFeedUrl = '';

    // Shuffle feeds to ensure variety and try each until an unseen item is found
    const feedsToTry = [...RSS_FEEDS].sort(() => Math.random() - 0.5);

    for (const feedUrl of feedsToTry) {
      try {
        console.log(`[NewsCron] Fetching from ${feedUrl}...`);
        const feed = await parser.parseURL(feedUrl);
        if (!feed.items || feed.items.length === 0) continue;

        for (const item of feed.items) {
          if (!item.link) continue;
          // Check if we already processed this URL
          const existing = db.prepare('SELECT 1 FROM news WHERE sourceUrl = ?').get(item.link);
          if (!existing) {
            targetItem = item;
            selectedFeedUrl = feedUrl;
            break;
          }
        }

        if (targetItem) {
          const foundMsg = `Found new unseen item from ${selectedFeedUrl}: "${targetItem.title}"`;
          console.log(`[NewsCron] ${foundMsg}`);
          appendCronLog('INFO', foundMsg, { title: targetItem.title, link: targetItem.link });
          break;
        }
      } catch (feedErr: any) {
        const warnMsg = `Feed ${feedUrl} timed out or failed: ${feedErr?.message || feedErr}`;
        console.warn(`[NewsCron] ${warnMsg}`);
        appendCronLog('WARN', warnMsg);
      }
    }

    if (!targetItem) {
      const noItemMsg = 'No new unseen news items found across all available feeds.';
      console.log(`[NewsCron] ${noItemMsg}`);
      appendCronLog('INFO', noItemMsg);
      return;
    }

    // Extract original image and full article content from the source page
    console.log(`[NewsCron] Fetching full article details and original image from: ${targetItem.link}`);
    appendCronLog('INFO', `Scraping source page for full text and og:image: ${targetItem.link}`);
    const scraped = await fetchSourceArticleDetails(targetItem.link);

    // Resolve Image: prioritize real original image from the source page
    let imageUrl = '';
    let imageSource = 'none';

    if (scraped.ogImage) {
      imageUrl = scraped.ogImage;
      imageSource = 'page-og:image';
    } else if (targetItem.enclosure && targetItem.enclosure.url && targetItem.enclosure.type?.startsWith('image')) {
      imageUrl = targetItem.enclosure.url;
      imageSource = 'rss-enclosure';
    } else if (targetItem.mediaContent && targetItem.mediaContent.$ && targetItem.mediaContent.$.url) {
      imageUrl = targetItem.mediaContent.$.url;
      imageSource = 'rss-mediaContent';
    } else if (targetItem.mediaThumbnail && targetItem.mediaThumbnail.$ && targetItem.mediaThumbnail.$.url) {
      imageUrl = targetItem.mediaThumbnail.$.url;
      imageSource = 'rss-mediaThumbnail';
    } else {
      // Regex fallback from RSS content HTML
      const htmlContent = targetItem.contentEncoded || targetItem.content || '';
      const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"'>]+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
        imageSource = 'rss-inline-img';
      }
    }

    imageUrl = sanitizeImageUrl(imageUrl);

    // Absolute fallback: only if no image exists anywhere in the source or feed
    if (!imageUrl) {
      console.log('[NewsCron] No original image found anywhere, using AI fallback image...');
      appendCronLog('WARN', `No original image found for "${targetItem.title}", generating AI fallback image`);
      imageUrl = getPollinationsImageUrl(targetItem.title || 'Artificial Intelligence News', '1:1', 'turbo');
      imageSource = 'ai-generated-fallback';
    } else {
      console.log(`[NewsCron] Successfully extracted original image (${imageSource}): ${imageUrl}`);
      appendCronLog('INFO', `Successfully extracted original image (${imageSource})`, { imageUrl });
    }

    // Optimize and convert image to ultra-lightweight WebP data URL for instant, VPN-free loading
    if (imageUrl) {
      try {
        const webpDataUrl = await optimizeImageToWebpDataUrl(imageUrl, 800, 75);
        if (webpDataUrl) {
          imageUrl = webpDataUrl;
          console.log(`[NewsCron] Converted article image to ultra-lightweight WebP data URL (${(webpDataUrl.length / 1024).toFixed(1)} KB)`);
        }
      } catch (optErr: any) {
        console.warn('[NewsCron] WebP conversion failed, keeping original imageUrl:', optErr?.message || optErr);
      }
    }

    // Prepare content for Gemini: use scraped full content if richer than RSS snippet
    const rawRssContent = targetItem.contentEncoded || targetItem.contentSnippet || targetItem.content || '';
    const chosenContent = (scraped.fullContent && scraped.fullContent.length > rawRssContent.length)
      ? scraped.fullContent
      : rawRssContent;

    appendCronLog('INFO', `Content prepared for translation (${chosenContent.length} chars, source: ${scraped.fullContent.length > rawRssContent.length ? 'full-scraped-page' : 'rss-snippet'})`);

    // Persian-first prompt for professional journalism, comprehensive article and Persian SEO tags
    const systemPrompt = `شما یک روزنامه‌نگار و مترجم ارشد فناوری هستید که جدیدترین اخبار هوش مصنوعی را برای مخاطبان فارسی‌زبان ترجمه، تحلیل و بازنویسی می‌کنید.

دستورالعمل‌های بسیار مهم و اجباری:
۱. عنوان: یک عنوان جذاب، حرفه‌ای، دقیق و متناسب با اصول روزنامه‌نگاری به زبان فارسی بنویسید.
۲. متن کامل مقاله: کل متن خبر و جزئیات ارائه‌شده را به صورت جامع، دقیق و سلیس به زبان فارسی روان بازنویسی کنید. هیچ‌یک از آمارها، نقل‌قول‌ها، پس‌زمینه‌ها و بخش‌های اصلی را حذف نکنید و از خلاصه‌سازی مفرط اکیداً خودداری نمایید؛ مقاله باید کامل و غنی باشد.
۳. سئو و تگ‌های فارسی (دستور حیاتی): بین ۴ تا ۶ کلمه کلیدی و برچسب پرجستجوی فارسی مرتبط با هوش مصنوعی و موضوع خبر (مانند: «هوش مصنوعی»، «چت جی پی تی»، «اوپن ای آی»، «مدل زبانی»، «یادگیری عمیق»، «متا») استخراج کنید. همه تگ‌ها باید حتماً به خط و زبان فارسی باشند.
۴. پایان مقاله: انتهای متن را همیشه با دقیقاً همین عبارت به اتمام برسانید (URL را با لینک اصلی خبر جایگزین کنید):
\n\n*🔗 منبع خبر: [مشاهده مقاله اصلی](URL)*

خروجی باید صرفاً و اکیداً یک شیء معتبر JSON با ساختار زیر باشد بدون هرگونه متن اضافه یا تگ markdown:
{"title": "عنوان جذاب و دقیق فارسی", "content": "متن کامل و جامع مقاله به فارسی روان...\\n\\n*🔗 منبع خبر: [مشاهده مقاله اصلی](URL)*", "tags": ["هوش مصنوعی", "چت جی پی تی", "اوپن ای آی", "مدل زبانی"]}`;

    const userPrompt = `عنوان اصلی: ${targetItem.title}\nلینک منبع: ${targetItem.link}\nمتن مقاله:\n${chosenContent}`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    let response: any = null;
    let usedModel = '';

    for (const model of candidateModels) {
      try {
        console.log(`[NewsCron] Generating article with model: ${model}...`);
        response = await ai.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response?.text) {
          usedModel = model;
          break;
        }
      } catch (geminiErr: any) {
        const errMsg = `Model ${model} failed: ${geminiErr?.message || geminiErr}`;
        console.warn(`[NewsCron] ${errMsg}`);
        appendCronLog('WARN', errMsg);
      }
    }

    if (!response?.text) {
      const allFailMsg = 'All Gemini candidate models failed to generate content.';
      console.error(`[NewsCron] ${allFailMsg}`);
      appendCronLog('ERROR', allFailMsg);
      return;
    }

    let generatedText = response.text || '';
    let parsedData: { title?: string; content?: string; tags?: string[] };
    try {
      let cleaned = generatedText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      }
      try {
        parsedData = JSON.parse(cleaned);
      } catch {
        const fixed = cleaned.replace(/(?<!\\)\n/g, '\\n').replace(/(?<!\\)\r/g, '\\r').replace(/(?<!\\)\t/g, '\\t');
        parsedData = JSON.parse(fixed);
      }
    } catch (e) {
      const parseFailMsg = `Failed to parse JSON from Gemini response`;
      console.error(`[NewsCron] ${parseFailMsg}:`, generatedText);
      appendCronLog('ERROR', parseFailMsg, generatedText.substring(0, 500));
      return;
    }

    if (!parsedData.title || !parsedData.content) {
      const invalidStructMsg = 'Invalid JSON structure returned from Gemini (missing title or content)';
      console.error(`[NewsCron] ${invalidStructMsg}`);
      appendCronLog('ERROR', invalidStructMsg, parsedData);
      return;
    }

    // Save to database with ISO createdAt
    const nowIso = new Date().toISOString();
    const insertStmt = db.prepare('INSERT INTO news (title, content, image, sourceUrl, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
    const tagsJson = JSON.stringify(parsedData.tags || []);
    const info = insertStmt.run(parsedData.title, parsedData.content, imageUrl, targetItem.link, tagsJson, nowIso);

    const savedMsg = `News saved to database with ID: ${info.lastInsertRowid} using model ${usedModel}`;
    console.log(`[NewsCron] ${savedMsg}`);

    // Clear sitemap cache so the new article is immediately visible to crawlers
    const { clearSitemapCache } = await import('../seo/sitemap');
    clearSitemapCache();
    syncDatabase();

    appendCronLog('INFO', savedMsg, { id: info.lastInsertRowid, title: parsedData.title, tags: parsedData.tags });

    // Broadcast to Telegram
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    const proxyUrl = process.env.PROXY_URL || '';
    const currentBot = getTelegramBot() || bot;
    console.log(`[NewsCron] Telegram check — bot: ${currentBot ? 'initialized' : 'null'}, channelId: ${channelId || 'NOT SET'}, proxy: ${proxyUrl || 'none'}`);

    if (currentBot && channelId) {
      try {
        await sendNewsToTelegram(channelId, currentBot, {
          id: Number(info.lastInsertRowid),
          title: parsedData.title,
          content: parsedData.content,
          image: imageUrl
        });
      } catch (tgError: any) {
        const tgFailMsg = `Telegram broadcast failed: ${tgError?.message || tgError}`;
        console.error(`[NewsCron] ${tgFailMsg}`);
        appendCronLog('ERROR', tgFailMsg, tgError?.stack || tgError);
      }
    } else {
      appendCronLog('WARN', 'Telegram broadcast skipped because bot or TELEGRAM_CHANNEL_ID is not configured');
    }

  } catch (error: any) {
    const fatalMsg = `Fatal error during scheduled news fetch: ${error?.message || error}`;
    console.error(`[NewsCron] ${fatalMsg}`);
    appendCronLog('ERROR', fatalMsg, error?.stack || error);
  }
}

export async function getDefaultNewsCoverBuffer(): Promise<Buffer> {
  const defaultPath = path.join(process.cwd(), 'public', 'default-news-cover.webp');
  if (fs.existsSync(defaultPath)) {
    try {
      const buf = fs.readFileSync(defaultPath);
      if (buf && buf.length > 0) return buf;
    } catch (e) {
      console.warn('[NewsCron] Failed reading default-news-cover.webp:', e);
    }
  }

  try {
    const sharp = (await import('sharp')).default;
    const svg = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)" />
  <circle cx="400" cy="180" r="72" fill="url(#glow)" opacity="0.25" />
  <circle cx="400" cy="180" r="52" fill="url(#glow)" opacity="0.35" />
  <path d="M375 180 L400 155 L425 180 L400 205 Z" fill="#60a5fa" />
  <text x="400" y="285" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">Dastyar AI</text>
  <text x="400" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">دستیار هوش مصنوعی فارسی</text>
</svg>`;
    const buffer = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
    try {
      const pubDir = path.join(process.cwd(), 'public');
      if (fs.existsSync(pubDir)) {
        fs.writeFileSync(defaultPath, buffer);
      }
    } catch {}
    return buffer;
  } catch (err: any) {
    console.warn('[NewsCron] Failed to generate default cover buffer:', err?.message || err);
    return Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64');
  }
}

export async function sendNewsToTelegram(
  channelId: string,
  currentBot: any,
  article: { id: number; title: string; content: string; image: string }
): Promise<boolean> {
  const settingRow = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('news_auto_publish') as { value: string } | undefined;
  const isAutoPublish = settingRow ? settingRow.value !== 'false' : true;
  if (!isAutoPublish) {
    console.log(`[NewsCron] Telegram news broadcasting is disabled in settings. Skipping broadcast for Article #${article.id}.`);
    appendCronLog('INFO', `Telegram news broadcasting is disabled (Article #${article.id} skipped).`);
    return false;
  }

  const rawBase = (process.env.WEBSITE_URL || process.env.WEB_URL || process.env.APP_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
  const baseUrl = (rawBase && !rawBase.includes('MY_APP_URL')) ? rawBase : 'http://localhost:3000';
  const articleUrl = `${baseUrl}/blog/${article.id}`;

  let safeContent = article.content.substring(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  safeContent = safeContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const messageText = `📰 <b>${article.title}</b>\n\n` +
    `${safeContent}...`;

  const cleanImageUrl = sanitizeImageUrl(article.image);
  let photoSent = false;

  if (cleanImageUrl && !cleanImageUrl.includes('undefined')) {
    // Attempt 0: Base64 Data URL
    if (cleanImageUrl.startsWith('data:image/')) {
      try {
        const base64Data = cleanImageUrl.split(',')[1];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          await currentBot.telegram.sendPhoto(channelId, { source: buffer }, {
            caption: messageText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
              ]
            }
          });
          const sizeKB = Math.round(buffer.length / 1024);
          console.log(`[Telegram] sendPhoto with buffer (size=${sizeKB}KB)`);
          appendCronLog('INFO', `[Telegram] sendPhoto with buffer (size=${sizeKB}KB)`, { articleId: article.id });
          return true;
        }
      } catch (base64Err: any) {
        console.warn('[NewsCron] sendPhoto via base64 failed:', base64Err?.message || base64Err);
        appendCronLog('WARN', 'sendPhoto via base64 failed', base64Err?.message || base64Err);
      }
    }

    // Attempt 1: Direct photo URL
    if (!photoSent) {
      try {
        await currentBot.telegram.sendPhoto(channelId, cleanImageUrl, {
          caption: messageText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
            ]
          }
        });
        console.log(`[NewsCron] News photo broadcasted to Telegram successfully (Article #${article.id}).`);
        appendCronLog('INFO', 'News photo broadcasted to Telegram successfully', { articleId: article.id });
        return true;
      } catch (photoErr: any) {
        console.warn('[NewsCron] sendPhoto via URL failed, attempting buffer fallback:', photoErr?.message || photoErr);
        appendCronLog('WARN', 'sendPhoto via URL failed, attempting buffer fallback', photoErr?.message || photoErr);

        // Attempt 2: Server-side buffer download fallback
        try {
          const imgRes = await fetch(cleanImageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await currentBot.telegram.sendPhoto(channelId, { source: buffer }, {
              caption: messageText,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
                ]
              }
            });
            const sizeKB = Math.round(buffer.length / 1024);
            console.log(`[Telegram] sendPhoto with buffer (size=${sizeKB}KB)`);
            appendCronLog('INFO', `[Telegram] sendPhoto with buffer (size=${sizeKB}KB)`, { articleId: article.id });
            return true;
          }
        } catch (bufErr: any) {
          console.warn('[NewsCron] Buffer fallback also failed:', bufErr?.message || bufErr);
        }
      }
    }
  }

  // If no image provided or image attempts failed, send default brand cover
  try {
    const defaultBuffer = await getDefaultNewsCoverBuffer();
    if (defaultBuffer && defaultBuffer.length > 0) {
      await currentBot.telegram.sendPhoto(channelId, { source: defaultBuffer }, {
        caption: messageText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
          ]
        }
      });
      const sizeKB = Math.round(defaultBuffer.length / 1024);
      console.log(`[Telegram] sendPhoto with buffer (size=${sizeKB}KB)`);
      appendCronLog('INFO', `[Telegram] sendPhoto with buffer (size=${sizeKB}KB) (default cover)`, { articleId: article.id });
      return true;
    }
  } catch (defaultErr: any) {
    console.error(`[Telegram] sendPhoto failed: ${defaultErr?.message || defaultErr}, falling back to sendMessage`);
    appendCronLog('WARN', `[Telegram] sendPhoto failed: ${defaultErr?.message || defaultErr}, falling back to sendMessage`);
  }

  // Fallback to text message with link preview enabled so it keeps an article link preview
  try {
    await currentBot.telegram.sendMessage(channelId, messageText, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
        ]
      }
    });
    console.log(`[NewsCron] News text broadcasted to Telegram (Article #${article.id}).`);
    appendCronLog('INFO', 'News text broadcasted to Telegram (fallback)', { articleId: article.id });
    return true;
  } catch (msgErr: any) {
    console.error('[NewsCron] Telegram sendMessage fallback also failed:', msgErr);
    appendCronLog('ERROR', 'Telegram sendMessage fallback failed', msgErr);
    return false;
  }
}

export async function broadcastArticleById(articleId: number) {
  const article: any = db.prepare('SELECT id, title, content, image FROM news WHERE id = ?').get(articleId);
  if (!article) {
    throw new Error(`Article with ID ${articleId} not found`);
  }
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  const currentBot = getTelegramBot() || bot;
  if (!currentBot || !channelId) {
    throw new Error('Telegram bot or channelId not configured');
  }
  return await sendNewsToTelegram(channelId, currentBot, article);
}

export function initNewsCron() {
  // Schedule to run every day at exactly 08:00 AM (Asia/Tehran)
  cron.schedule('0 8 * * *', () => {
    console.log('[NewsCron] Triggering daily 08:00 AM news broadcast (Asia/Tehran)...');
    appendCronLog('INFO', 'Daily 08:00 AM news fetcher triggered.');
    fetchAndProcessNews();
  }, {
    timezone: 'Asia/Tehran'
  });

  // Stuck-order reconciliation: run every hour to find orders pending > 24h
  cron.schedule('0 * * * *', async () => {
    console.log('[NewsCron] Running stuck-order reconciliation check...');
    appendCronLog('INFO', 'Stuck-order reconciliation check triggered.');
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const stuckOrders = db.prepare(`
        SELECT o.id, o.userId, o.amount, o.createdAt, p.title as productTitle, u.telegramId, u.name
        FROM orders o
        LEFT JOIN products p ON o.productId = p.id
        LEFT JOIN users u ON o.userId = u.id
        WHERE o.paymentStatus = 'pending' AND o.createdAt < ?
      `).all(cutoff) as any[];

      if (stuckOrders.length > 0) {
        console.log(`[NewsCron] Found ${stuckOrders.length} stuck orders pending > 24h`);
        appendCronLog('WARN', `Found ${stuckOrders.length} stuck orders`, { orderIds: stuckOrders.map(o => o.id) });

        // Notify admin via Telegram
        const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;
        const currentBot = getTelegramBot() || bot;
        if (ADMIN_ID && currentBot) {
          for (const order of stuckOrders) {
            const msg = `⚠️ **سفارش معلق بیش از ۲۴ ساعت**\n\n` +
                        `📦 **محصول:** ${order.productTitle || 'نامشخص'}\n` +
                        `💰 **مبلغ:** ${Number(order.amount || 0).toLocaleString('fa-IR')} تومان\n` +
                        `🔢 **سفارش:** \`${order.id}\`\n` +
                        `👤 **کاربر:** ${order.name || 'نامشخص'} (\`${order.telegramId || 'بدون آیدی'}\`)\n` +
                        `⏰ **ایجاد شده:** ${formatTehranDateTime(order.createdAt)}\n\n` +
                        `لطفاً در پنل ادمین بررسی و اقدام کنید.`;
            try {
              await currentBot.telegram.sendMessage(ADMIN_ID, msg, { parse_mode: 'Markdown' });
            } catch (e) {
              console.error('[NewsCron] Failed to notify admin of stuck order:', e);
            }
          }
        }
      } else {
        console.log('[NewsCron] No stuck orders found.');
      }
    } catch (err) {
      console.error('[NewsCron] Stuck-order reconciliation error:', err);
      appendCronLog('ERROR', 'Stuck-order reconciliation failed', err);
    }
  }, {
    timezone: 'Asia/Tehran'
  });

  const initMsg = 'Scheduled AI News fetcher initialized for daily 08:00 AM (Asia/Tehran).';
  console.log(`[NewsCron] ${initMsg}`);
  appendCronLog('INFO', initMsg);
}
