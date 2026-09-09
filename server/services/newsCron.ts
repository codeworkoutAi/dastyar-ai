import cron from 'node-cron';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import db from '../db/database';
import { getGeminiClient, getPollinationsImageUrl } from './utils';
import { bot } from '../telegram/bot';

// Path for persistent news-cron log file
const LOG_FILE = path.join(process.cwd(), 'server', 'data', 'news-cron.log');

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
      const candidate = ogMatch[1].trim();
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
  const startMsg = `Starting news fetch task (Scheduled run at 08:00, 12:00, or 20:00 Asia/Tehran)...`;
  console.log(`[NewsCron] ${startMsg}`);
  appendCronLog('INFO', startMsg);

  try {
    const ai = getGeminiClient(); // Fails if no API key is set

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

    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
    let response: any = null;
    let usedModel = '';

    for (const model of candidateModels) {
      try {
        console.log(`[NewsCron] Generating article with model: ${model}...`);
        response = await ai.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
          ]
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
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData: { title?: string; content?: string; tags?: string[] };
    try {
      parsedData = JSON.parse(generatedText);
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
    appendCronLog('INFO', savedMsg, { id: info.lastInsertRowid, title: parsedData.title, tags: parsedData.tags });

    // Broadcast to Telegram
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    const proxyUrl = process.env.PROXY_URL || '';
    console.log(`[NewsCron] Telegram check — bot: ${bot ? 'initialized' : 'null'}, channelId: ${channelId || 'NOT SET'}, proxy: ${proxyUrl || 'none'}`);

    if (bot && channelId) {
      const rawBase = (process.env.WEBSITE_URL || process.env.WEB_URL || process.env.APP_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
      const baseUrl = (rawBase && !rawBase.includes('MY_APP_URL')) ? rawBase : 'http://localhost:3000';
      const articleUrl = `${baseUrl}/blog/${info.lastInsertRowid}`;

      // Convert Markdown links [text](url) to HTML <a href="url">text</a> for Telegram
      let safeContent = parsedData.content.substring(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      safeContent = safeContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

      const messageText = `📰 <b>${parsedData.title}</b>\n\n` +
                          `${safeContent}...\n\n` +
                          `🔗 <a href="${articleUrl}">مطالعه کامل مقاله در وب‌سایت</a>`;

      try {
        if (imageUrl && !imageUrl.includes('undefined')) {
          try {
            await bot.telegram.sendPhoto(channelId, imageUrl, {
              caption: messageText,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
                ]
              }
            });
            console.log('[NewsCron] News photo broadcasted to Telegram successfully.');
            appendCronLog('INFO', 'News photo broadcasted to Telegram successfully', { articleId: info.lastInsertRowid });
          } catch (photoErr: any) {
            console.warn('[NewsCron] sendPhoto failed, falling back to text message:', photoErr?.message || photoErr);
            appendCronLog('WARN', 'sendPhoto failed, falling back to text message', photoErr?.message || photoErr);

            await bot.telegram.sendMessage(channelId, messageText, {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
                ]
              }
            });
            console.log('[NewsCron] News text broadcasted to Telegram successfully.');
            appendCronLog('INFO', 'News text broadcasted to Telegram successfully', { articleId: info.lastInsertRowid });
          }
        } else {
          await bot.telegram.sendMessage(channelId, messageText, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
              ]
            }
          });
          console.log('[NewsCron] News text broadcasted to Telegram successfully.');
          appendCronLog('INFO', 'News text broadcasted to Telegram successfully', { articleId: info.lastInsertRowid });
        }
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

export function initNewsCron() {
  // Schedule to run exactly 3 times a day: 08:00 AM, 12:00 PM, and 20:00 (8:00 PM) (Asia/Tehran)
  cron.schedule('0 8,12,20 * * *', () => {
    fetchAndProcessNews();
  }, {
    timezone: 'Asia/Tehran'
  });

  const initMsg = 'Scheduled AI News fetcher initialized for 08:00, 12:00, 20:00 (Asia/Tehran).';
  console.log(`[NewsCron] ${initMsg}`);
  appendCronLog('INFO', initMsg);
}
