import cron from 'node-cron';
import Parser from 'rss-parser';
import db from '../db/database';
import { getGeminiClient, getPollinationsImageUrl } from './utils';
import { bot } from '../telegram/bot';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 12000,
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

const RSS_FEEDS = [
  'https://www.artificialintelligence-news.com/feed/',
  'https://theverge.com/rss/ai-artificial-intelligence/index.xml',
  'https://venturebeat.com/category/ai/feed/',
  'https://techcrunch.com/category/artificial-intelligence/feed/'
];

export async function fetchAndProcessNews() {
  console.log('[NewsCron] Starting scheduled news fetch...');
  try {
    const ai = getGeminiClient(); // Fails if no API key is set
    
    let targetItem: any = null;
    let selectedFeedUrl = '';

    // Shuffle feeds to ensure variety and try each until a working feed with an unseen item is found
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
          console.log(`[NewsCron] Found new unseen item from ${selectedFeedUrl}: "${targetItem.title}"`);
          break;
        }
      } catch (feedErr: any) {
        console.warn(`[NewsCron] Feed ${feedUrl} timed out or failed, trying next feed:`, feedErr?.message || feedErr);
      }
    }

    if (!targetItem) {
      console.log('[NewsCron] No new unseen news items found across all available feeds.');
      return;
    }

    console.log(`[NewsCron] Processing news item: ${targetItem.title}`);
    
    // Construct the prompt for Gemini
    const systemPrompt = `You are a professional technology journalist translating and rewriting AI news for a Persian audience.
Read the following English news title and snippet.
Write a highly engaging, fluent, and professional Persian news article based on it.
Create a catchy, clickbait-style (but accurate) Persian title.
CRITICAL INSTRUCTION: Extract 3 to 5 key important AI-related tags (like model names, company names, or core concepts like "Generative AI") in English from the article.

Important: Always end the article content with this exact line, replacing URL with the provided source link:
\n\n*🔗 منبع خبر: [مشاهده مقاله اصلی](URL)*

Output the result strictly in valid JSON format with "title", "content", and "tags" keys. Do not include markdown formatting like \`\`\`json.
Example: {"title": "عنوان جذاب فارسی", "content": "متن کامل مقاله به زبان فارسی روان... \\n\\n*🔗 منبع خبر: [مشاهده مقاله اصلی](URL)*", "tags": ["OpenAI", "ChatGPT", "Artificial Intelligence"]}`;

    const userPrompt = `Title: ${targetItem.title}\nSource Link: ${targetItem.link}\nContent: ${targetItem.contentEncoded || targetItem.contentSnippet || targetItem.content || ''}`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
    let response: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`[NewsCron] Generating article with model: ${model}...`);
        response = await ai.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
          ]
        });
        if (response?.text) break;
      } catch (geminiErr: any) {
        console.warn(`[NewsCron] Model ${model} failed (${geminiErr?.status || geminiErr?.message}), trying fallback...`);
      }
    }

    if (!response?.text) {
      console.error('[NewsCron] All Gemini models failed to generate content.');
      return;
    }

    let generatedText = response.text || '';
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(generatedText);
    } catch (e) {
      console.error('[NewsCron] Failed to parse JSON from Gemini:', generatedText);
      return;
    }

    if (!parsedData.title || !parsedData.content) {
      console.error('[NewsCron] Invalid JSON structure from Gemini.');
      return;
    }

    // Attempt to extract original image from RSS feed
    let imageUrl = '';
    
    if (targetItem.enclosure && targetItem.enclosure.url && targetItem.enclosure.type?.startsWith('image')) {
      imageUrl = targetItem.enclosure.url;
    } else if (targetItem.mediaContent && targetItem.mediaContent.$ && targetItem.mediaContent.$.url) {
      imageUrl = targetItem.mediaContent.$.url;
    } else if (targetItem.mediaThumbnail && targetItem.mediaThumbnail.$ && targetItem.mediaThumbnail.$.url) {
      imageUrl = targetItem.mediaThumbnail.$.url;
    } else {
      // Regex fallback: try to find an <img> tag in the HTML content
      const htmlContent = targetItem.contentEncoded || targetItem.content || '';
      const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"'>]+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // Fallback to AI generation if no image was found in the feed
    if (!imageUrl) {
      console.log('[NewsCron] No original image found, generating AI image fallback...');
      imageUrl = getPollinationsImageUrl(targetItem.title || 'Artificial Intelligence News', '1:1', 'turbo');
    } else {
      console.log('[NewsCron] Successfully extracted original image from RSS feed.');
    }

    // Save to database
    const insertStmt = db.prepare('INSERT INTO news (title, content, image, sourceUrl, tags) VALUES (?, ?, ?, ?, ?)');
    const info = insertStmt.run(parsedData.title, parsedData.content, imageUrl, targetItem.link, JSON.stringify(parsedData.tags || []));
    
    console.log(`[NewsCron] News saved to database with ID: ${info.lastInsertRowid}`);

    // Broadcast to Telegram
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
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
          } catch (photoErr) {
            console.warn('[NewsCron] sendPhoto failed, falling back to text message:', photoErr);
            await bot.telegram.sendMessage(channelId, messageText, {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📖 مطالعه کامل مقاله در سایت', url: articleUrl }]
                ]
              }
            });
            console.log('[NewsCron] News text broadcasted to Telegram successfully.');
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
        }
      } catch (tgError) {
        console.error('[NewsCron] Telegram broadcast failed:', tgError);
      }
    }

  } catch (error) {
    console.error('[NewsCron] Error during scheduled news fetch:', error);
  }
}

export function initNewsCron() {
  // Schedule to run every hour at minute 0 (Tehran Time)
  cron.schedule('0 * * * *', () => {
    fetchAndProcessNews();
  }, {
    timezone: 'Asia/Tehran'
  });
  console.log('[NewsCron] Scheduled AI News fetcher initialized to run EVERY HOUR (Asia/Tehran).');
}
