import express from 'express';
import rateLimit from 'express-rate-limit';
import db from '../db/database';
import { isSafeBaseUrl, getGeminiClient, extractCleanErrorMessage, sanitizeErrorMessage, formatContentsForGemini, sleep, getPollinationsImageUrl, translateAndEnhanceImagePrompt, normalizeBaseUrl, parseCustomHeaders } from '../services/utils';
import { GoogleGroundingAgent } from '../services/GoogleGroundingAgent';
import { WikipediaAgent } from '../services/WikipediaAgent';
import { ToolsAgent } from '../services/ToolsAgent';
import { SpecializedKnowledgeService } from '../services/SpecializedKnowledgeService';
import { responseCache, CACHE_TTL_MS, computeCacheKey, setCachedResponse } from '../services/CacheService';
import { hasSufficientBalance, deductChatCost, calculateModelCostUsd, getUserWallet } from '../services/walletService';
import { keyRotator } from '../services/keyRotator';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
const router = express.Router();

const chatStreamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 streaming requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تعداد درخواست‌های گفت‌وگو بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.' }
});

router.post('/api/chat/stream', chatStreamLimiter, async (req, res) => {
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
    } catch { }
  };

  const sendChunk = (data: {
    chunk?: string;
    error?: string;
    done?: boolean;
    modelUsed?: string;
    imageUrl?: string;
    imageUrls?: string[];
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    insufficientBalance?: boolean;
    quotaExceeded?: boolean;
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

    // Extract authenticated user if token provided
    let userId: number | null = null;
    let userRole: string = 'user';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.id) userId = decoded.id;
        if (decoded?.role) userRole = decoded.role;
      } catch (e) {}
    }

    if (!userId) {
      sendChunk({ error: 'برای ارسال پیام و استفاده از چت‌باکس، لطفاً وارد حساب کاربری خود شوید.' });
      sendChunk({ done: true });
      return finishStream();
    }
    let provider = apiConfig?.activeProvider || 'gemini';
    let customProfileId = apiConfig?.custom?.activeProfileId;
    let model = req.body.model || apiConfig?.[provider]?.modelName || '';
    
    // Capture if client provided their own key before we mutate apiConfig with system pool keys
    const clientProvidedKey = Boolean(apiConfig?.[provider]?.apiKey && apiConfig[provider].apiKey.trim() !== '');

    // Auto-detect native official providers from custom profiles based on Base URL
    let isFreeModel = false;
    let targetBaseUrl = '';
    let targetModel = model;
    let targetApiKey = '';
    let resolvedSystemProfile = null;
    let usedPoolKey = '';
    
    if (provider === 'custom' && customProfileId) {
      // 1. Try to fetch from DB if it's a system default
      const profileResult = db.prepare('SELECT * FROM default_profiles WHERE id = ?').get(customProfileId) as any;
      if (profileResult) {
        resolvedSystemProfile = profileResult;
        targetBaseUrl = profileResult.baseUrl;
        targetModel = profileResult.modelName;
        targetApiKey = profileResult.apiKey;
        
        if (targetApiKey === '[AUTO_POOL]') {
          const poolKey = keyRotator.getNextKey();
          if (poolKey) {
            targetApiKey = poolKey.apiKey;
            targetBaseUrl = poolKey.baseUrl;
            usedPoolKey = poolKey.apiKey;

            // Resolve dynamic model mapping based on the selected Base URL
            if (targetModel.startsWith('{')) {
              try {
                const modelMap = JSON.parse(targetModel);
                if (modelMap[targetBaseUrl]) {
                  targetModel = modelMap[targetBaseUrl];
                }
              } catch (e) {
                console.error('[Chat] Failed to parse dynamic model mapping:', e);
              }
            }
          } else {
            sendChunk({ error: 'ظرفیت کلیدهای عمومی در حال حاضر پر شده است. لطفاً چند دقیقه دیگر تلاش کنید.' });
            sendChunk({ done: true });
            return finishStream();
          }
        }
        // No process.env fallbacks here anymore! Keys MUST be managed via the Database / Admin Panel.
        
        // Override apiConfig with the resolved values so the rest of the file uses the correct dynamic keys/urls
        if (!apiConfig[provider]) apiConfig[provider] = {};
        apiConfig[provider].baseUrl = targetBaseUrl;
        apiConfig[provider].modelName = targetModel;
        apiConfig[provider].apiKey = targetApiKey;
        apiConfig[provider].id = customProfileId; // Ensure injected key works

        if (profileResult.name?.includes('رایگان') || profileResult.name?.toLowerCase().includes('free') || profileResult.name?.includes('[AUTO]')) {
          isFreeModel = true;
        }
      }
    }
    const hasCustomUserKey = clientProvidedKey;
    // Check 24-hour rolling window limit for Free Models
    if (isFreeModel && !hasCustomUserKey && userRole !== 'admin') {
      const now = Date.now();
      const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
      const identifier = userId ? `user:${userId}` : `ip:${req.ip}`;
      
      const limitStr = userId ? 
        (db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_limit_user'").get() as any)?.value || '15' :
        (db.prepare("SELECT value FROM site_settings WHERE key = 'free_daily_limit_guest'").get() as any)?.value || '5';
      
      const windowLimit = parseInt(limitStr, 10);
      
      // Get current window usage
      let usage = db.prepare("SELECT count, windowStart FROM free_daily_usage WHERE id = ? AND date = 'window'").get(identifier) as any;
      if (!usage || !usage.windowStart || (now - usage.windowStart >= WINDOW_MS)) {
        db.prepare("INSERT OR REPLACE INTO free_daily_usage (id, date, count, windowStart) VALUES (?, 'window', 0, ?)").run(identifier, now);
        usage = { count: 0, windowStart: now };
      }
      
      if (usage.count >= windowLimit) {
        // Free quota exhausted! Check if user has wallet balance to seamlessly switch to Paid card
        const userWallet = userId ? getUserWallet(userId) : null;
        if (userWallet && userWallet.walletBalance > 0) {
          // Seamless auto-switch to paid card!
          isFreeModel = false;
          let paidRoleId = 'paid_default';
          const currentModel = (targetModel || model || '').toLowerCase();
          if (customProfileId === 'free_coding' || currentModel.includes('deepseek') || currentModel.includes('claude')) {
            paidRoleId = 'paid_coding';
          } else if (customProfileId === 'free_vision' || currentModel.includes('vision') || currentModel.includes('flash') || currentModel.includes('gemini')) {
            paidRoleId = 'paid_vision';
          }
          const paidProfile = db.prepare('SELECT * FROM default_profiles WHERE id = ?').get(paidRoleId) as any;
          if (paidProfile) {
            customProfileId = paidProfile.id;
            targetModel = paidProfile.modelName;
            model = paidProfile.modelName;
            targetBaseUrl = paidProfile.baseUrl;
            targetApiKey = paidProfile.apiKey;
            if (apiConfig?.custom) {
              apiConfig.custom.baseUrl = paidProfile.baseUrl;
              apiConfig.custom.modelName = paidProfile.modelName;
              apiConfig.custom.apiKey = targetApiKey;
              apiConfig.custom.id = paidProfile.id;
            }
          }
        } else {
          // Calculate remaining cooldown time
          const msLeft = Math.max(0, (usage.windowStart + WINDOW_MS) - now);
          const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000));
          const minsLeft = Math.max(1, Math.ceil((msLeft % (60 * 60 * 1000)) / (60 * 1000)));
          const timeLeftStr = hoursLeft > 0 ? `${hoursLeft} ساعت و ${minsLeft} دقیقه` : `${minsLeft} دقیقه`;
          
          sendChunk({
            error: `سهمیه ${windowLimit} پیام رایگان شما به پایان رسیده است. ⏱️ سهمیه بعدی شما حدود ${timeLeftStr} دیگر فعال خواهد شد. در صورت تمایل می‌توانید با شارژ کیف پول خود به هر میزان دلخواه، با مدل‌های پیشرفته اعتباری به گفتگو ادامه دهید.`,
            insufficientBalance: true,
            quotaExceeded: true,
            done: true
          });
          return finishStream();
        }
      } else {
        // Increment usage immediately to prevent race conditions
        db.prepare("UPDATE free_daily_usage SET count = count + 1 WHERE id = ? AND date = 'window'").run(identifier);
      }
    }

    if (!isFreeModel && userId && !hasCustomUserKey) {
      const userWallet = getUserWallet(userId);
      if (userWallet.walletBalance <= 0) {
        sendChunk({
          error: 'اعتبار کیف پول شما برای استفاده از مدل‌های اعتباری کافی نیست. لطفاً کیف پول خود را شارژ کنید.',
          insufficientBalance: true,
          done: true
        });
        return finishStream();
      }
    }

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

    // Benchmark / Safe High-Concurrency Load Simulation Mode (Only in development or if explicitly enabled)
    const allowBenchmark = process.env.NODE_ENV !== 'production' || process.env.ENABLE_BENCHMARK === 'true';
    if (allowBenchmark && (provider === 'benchmark' || req.headers['x-benchmark-sim'] === 'true' || apiConfig?.model === 'benchmark-simulation')) {
      const sampleWords = [
        'درود!', 'این', 'یک', 'پاسخ', 'آزمایشی', 'برای', 'سنجش', 'پایداری', 'و', 'تست',
        'فشار', 'سرور', 'در', 'شرایط', 'بارگذاری', 'سنگین', 'است.', 'ارتباط', 'استریم',
        'با', 'موفقیت', 'برقرار', 'شد', 'و', 'بسته‌های', 'داده', 'در', 'حال', 'انتقال', 'هستند.'
      ];
      for (const word of sampleWords) {
        if (isEnded) break;
        sendChunk({ chunk: word + ' ' });
        await sleep(20);
      }
      sendChunk({ done: true, modelUsed: 'benchmark-simulation' });
      return finishStream();
    }

    // Context window strategy: Keep last 8 recent turns (16 messages = 8 user + 8 assistant)
    // This aligns with frontend's buildOptimizedContext() maxRecentTurns=8
    const MAX_RECENT_MESSAGES = 16;
    const prunedMessages = messages.slice(-MAX_RECENT_MESSAGES);

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
> *(لطفاً در صورتی که به اینترنت دسترسی دارید یا مناسبت‌های امروز را می‌دانید، آنها را با ایموجی لیست کنید؛ در غیر این صورت بنویسید: بدون جستجوی زنده در اینترنت، جزئیات مناسبت‌های امروز در دسترس نیست)*]`;
    }

    const activeTool = settings?.tools?.activeTool;

    if (!isDateInquiry) {
      if (activeTool === 'weather') {
        console.log('[Backend] Executing Weather Tool...');
        liveWebContext = await ToolsAgent.getWeather(userText);
      } else if (activeTool === 'currency') {
        console.log('[Backend] Executing Currency Tool...');
        liveWebContext = await ToolsAgent.getCurrency();
      } else if (activeTool === 'digikala') {
        console.log('[Backend] Executing Digikala Tool...');
        liveWebContext = await ToolsAgent.getDigikalaProduct(userText);
      } else if (apiConfig?.webSearch) {
        if (userText && userText.trim().length > 1) {
          // 1. Specialized Knowledge Grounding (Religions/Quran/Bible, Ganjoor Poetry, Cinema, Sports, Health/Psychology, Botany)
          let specializedContext = '';
          try {
            specializedContext = await SpecializedKnowledgeService.resolveSpecializedKnowledge(userText);
            if (specializedContext) {
              console.log('[Backend] Specialized knowledge grounding context retrieved');
            }
          } catch (skErr) {
            console.warn('[Backend] Specialized knowledge grounding error:', skErr);
          }

          // 2. Automatic Wikipedia Encyclopedic Grounding (Persian & English)
          let wikiContext = '';
          const isEncyclopedic = WikipediaAgent.isEncyclopedicQuery(userText);
          const hasWikiIntent = /ویکی|دانشنامه|wiki/i.test(userText);

          if (isEncyclopedic || hasWikiIntent) {
            console.log('[Backend] Query is encyclopedic/factual, fetching from Wikipedia...');
            try {
              const wikiRes = await WikipediaAgent.searchAndSummarize(userText);
              if (wikiRes.found) {
                wikiContext = WikipediaAgent.formatForContext(wikiRes);
                console.log(`[Backend] Wikipedia summary found for "${wikiRes.title}" (${wikiRes.lang})`);
              }
            } catch (wErr) {
              console.warn('[Backend] Wikipedia fetch error:', wErr);
            }
          }

          // 3. Google Search Grounding (Live Web & News)
          console.log('[Backend] Executing Google Grounding Agent (Universal RAG for all providers)...');
          const googleContext = await GoogleGroundingAgent.search(userText);
          console.log('[Backend] Google Grounding result length:', googleContext?.length || 0);

          const contextParts = [specializedContext, wikiContext, googleContext].filter(Boolean);
          liveWebContext = contextParts.join('\n\n');
        }
      } else {
        console.log('[Backend] Web search & tools disabled.');
      }
    }
    const baseSystemPrompt = `شما «دستیار هوشمند» هستید؛ متمرکز، دقیق و مسلط به زبان فارسی. پاسخ‌ها را به فارسی شیوا، دسته‌بندی‌شده و ساختاریافته ارائه دهید. در موضوعات فنی و برنامه‌نویسی، کدهای استاندارد همراه با توضیحات موجز بنویسید. هرگز خود را با نام پلتفرم‌های متفرقه معرفی نکنید.\n\n${timeContext}`;
    
    const systemInstruction = apiConfig?.systemInstruction ? `${apiConfig.systemInstruction}\n\n${timeContext}\n\nنکته نگارشی: همیشه اصول، مراحل و لیست‌های شماره‌دار را در خطوط مجزا تفکیک کن. حتماً اصول نگارش فارسی و **نیم‌فاصله‌ها** را رعایت کن (مثلاً: می‌رود، برنامه‌نویسی، بخش‌ها).` : `${baseSystemPrompt}\n\nنکته نگارشی: حتماً اصول نگارش فارسی و **نیم‌فاصله‌ها** (Zero-Width Non-Joiner) را با دقت تمام رعایت کن (مثال: می‌رود، برنامه‌نویسی، دسته‌بندی‌شده، کتاب‌ها).`;

    // Inject liveWebContext into the LAST user message instead of system prompt
    // This ensures that models (especially via OpenRouter/Custom providers) don't ignore it.
    if (liveWebContext && prunedMessages.length > 0) {
      const lastMsgIndex = prunedMessages.map((m: any) => m.role).lastIndexOf('user');
      if (lastMsgIndex !== -1) {
        if (isDateInquiry) {
          prunedMessages[lastMsgIndex].content = `${prunedMessages[lastMsgIndex].content}\n\n${liveWebContext}`;
        } else {
          const webSearchWrapper = `\n\n<context_data>\n${liveWebContext}\n</context_data>\n\n<instructions>\nاخطار مهم: پاسخ خود را دقیقاً و منحصراً بر اساس اطلاعات داخل تگ بالا ارائه بده. تو موظفی تمام داده‌ها، اعداد، آمار و جزئیات مرتبط با درخواست کاربر را به طور کامل از متن بالا استخراج و گزارش کنی.\n**قانون بسیار مهم برای منابع:** اگر در اطلاعات بالا منابعی (منابع:) ذکر شده است، آن‌ها را حتماً در انتهای پاسخ خود دقیقاً به صورت خطی و پشت سر هم (مثلاً: منابع: [منبع ۱] • [منبع ۲]) نمایش بده. به هیچ وجه از لیست‌های عمودی یا Bullet points برای منابع استفاده نکن!\n</instructions>`;
          prunedMessages[lastMsgIndex].content = `${prunedMessages[lastMsgIndex].content}${webSearchWrapper}`;
        }
      }
    }

    // Check In-Memory Cache for normalized query
    const cacheKey = computeCacheKey(prunedMessages, apiConfig?.[provider]?.modelName || 'default', systemInstruction);
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      if (cached.chunk) {
        sendChunk({ chunk: cached.chunk });
      }
      if (cached.imageUrls && cached.imageUrls.length > 0) {
        sendChunk({ imageUrls: cached.imageUrls });
      } else if (cached.imageUrl) {
        sendChunk({ imageUrl: cached.imageUrl });
      }
      sendChunk({ done: true, usage: cached.usage });
      return finishStream();
    }

    if (provider === 'gemini') {
      let userKey = apiConfig?.[provider]?.apiKey;
      let modelName = apiConfig?.[provider]?.modelName || 'gemini-3.1-flash-lite';

      // Secure Backend Injection for Default Free Models
      if (!userKey || userKey.trim() === '') {
        const profileId = apiConfig?.custom?.activeProfileId || apiConfig?.custom?.id || apiConfig?.gemini?.id;
        if (profileId) {
          const row = db.prepare('SELECT apiKey FROM default_profiles WHERE id = ? AND isActive = 1').get(profileId) as any;
          if (row?.apiKey) userKey = row.apiKey;
        }
        if (!userKey && modelName) {
          const row = db.prepare('SELECT apiKey FROM default_profiles WHERE modelName = ? AND isActive = 1').get(modelName) as any;
          if (row?.apiKey) userKey = row.apiKey;
        }
        // Environment fallback for free Gemini models removed. Free keys must go in the DB pool.
      }

      const ai = getGeminiClient(userKey, false); // Do NOT fallback to env master key for chat generation

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

      let geminiUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number; costToman?: number; balanceAfter?: number } | undefined = undefined;
      let accumulatedGeminiText = '';
      let successfulCandidate = '';

      for (const candidate of candidateModels) {
        if (hasSentAnyChunk) break;

        let attempts = 0;
        const maxAttempts = candidate === modelName ? 3 : 1;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            const streamConfig: any = {
              // No native googleSearch here — we use GoogleGroundingAgent (RAG) to support ALL providers universally
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

            // Check if user explicitly requested an image via command
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
              } catch (e) { }

              if (!targetImagePrompt) {
                targetImagePrompt = lastUserMsg
                  .replace(/^\/(image|تصویر)\b/i, '')
                  .trim();
                if (!targetImagePrompt || targetImagePrompt.length < 2) {
                  targetImagePrompt = lastUserMsg;
                }
              }
            }

            let generatedImageUrl: string | undefined = undefined;
            if (targetImagePrompt) {
              const enhancedPrompt = await translateAndEnhanceImagePrompt(targetImagePrompt);
              const rawUrl = getPollinationsImageUrl(enhancedPrompt, '1:1', 'flux');
              generatedImageUrl = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
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

      if (userId && !hasCustomUserKey && accumulatedGeminiText) {
        if (!geminiUsage || !geminiUsage.totalTokens) {
          const promptEstimate = Math.ceil(JSON.stringify(prunedMessages).length / 4);
          const completionEstimate = Math.ceil(accumulatedGeminiText.length / 4);
          geminiUsage = {
            promptTokens: promptEstimate,
            completionTokens: completionEstimate,
            totalTokens: promptEstimate + completionEstimate,
          };
        }
        if (isFreeModel) {
          geminiUsage = { ...geminiUsage, costToman: 0 };
        } else {
          const costUsd = calculateModelCostUsd(successfulCandidate, geminiUsage.promptTokens || 0, geminiUsage.completionTokens || 0);
          const deductResult = deductChatCost(
            userId,
            successfulCandidate,
            geminiUsage.promptTokens || 0,
            geminiUsage.completionTokens || 0,
            costUsd
          );
          geminiUsage = {
            ...geminiUsage,
            costToman: deductResult.costToman,
            balanceAfter: deductResult.balanceAfter,
          };
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
      let injectedKey = '';

      if (apiConfig?.[provider]?.apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = String(apiConfig[provider].apiKey).trim();
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${String(apiConfig[provider]?.apiKey).trim()}`;
        }
      } else {
        // Secure Backend Injection for Default Free Models from DB or Env
        const requestedModel = apiConfig?.[provider]?.modelName || '';
        const profileId = apiConfig?.custom?.activeProfileId || apiConfig?.custom?.id || apiConfig?.[provider]?.id;

        if (profileId) {
          const row = db.prepare('SELECT apiKey FROM default_profiles WHERE id = ? AND isActive = 1').get(profileId) as any;
          if (row?.apiKey) injectedKey = row.apiKey;
        }
        if (!injectedKey && requestedModel) {
          const row = db.prepare('SELECT apiKey FROM default_profiles WHERE modelName = ? AND isActive = 1').get(requestedModel) as any;
          if (row?.apiKey) injectedKey = row.apiKey;
        }

        if (injectedKey) {
          if (provider === 'anthropic') {
            headers['x-api-key'] = injectedKey;
            headers['anthropic-version'] = '2023-06-01';
          } else {
            headers['Authorization'] = `Bearer ${injectedKey}`;
          }
        }
        // Environment fallback for custom free models (Groq/Gemini) removed. Free keys must go in the DB pool.
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio';
        headers['X-Title'] = 'Persian AI Chatbox';
      }

      // Merge user custom headers
      const userHeaders = parseCustomHeaders(apiConfig?.custom?.customHeaders);
      
      // Security: Prevent client from overriding system-injected default credentials
      if (injectedKey) {
        delete (userHeaders as Record<string, string>)['authorization'];
        delete (userHeaders as Record<string, string>)['Authorization'];
        delete (userHeaders as Record<string, string>)['x-api-key'];
        delete (userHeaders as Record<string, string>)['X-Api-Key'];
      }
      
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
        else model = 'gpt-4o-mini';
      }

      let response: any;
      const abortController = new AbortController();
      let streamTimeoutId: NodeJS.Timeout;

      const resetStreamTimeout = () => {
        clearTimeout(streamTimeoutId);
        streamTimeoutId = setTimeout(() => abortController.abort(), 60000); // 60s timeout
      };

      try {
        const requestBody: any = {
          model,
          messages: formattedMessages,
          temperature: 0.7,
          top_p: 0.8,
          stream: true,
          stream_options: { include_usage: true },
        };

        const isGroq = endpoint.includes('api.groq.com');
        const safeDefaultTokens = isGroq ? 4096 : 8192;
        requestBody.max_tokens = typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0 ? apiConfig.maxTokens : safeDefaultTokens;

        if (endpoint.includes('api.openai.com')) {
          requestBody.max_completion_tokens = requestBody.max_tokens;
          delete requestBody.max_tokens;
        }

        resetStreamTimeout();

        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });
        
      } catch (fetchErr: any) {
        clearTimeout(streamTimeoutId!);
        console.error('Fetch error to custom endpoint:', fetchErr);
        sendChunk({ error: sanitizeErrorMessage(fetchErr) });
        sendChunk({ done: true });
        return finishStream();
      }

      if (!response.ok) {
        clearTimeout(streamTimeoutId!);
        let errorText = '';
        try {
          errorText = await response.text();
        } catch { }

        if ((response.status === 429 || response.status === 401 || response.status === 402 || response.status === 403 || response.status === 404) && usedPoolKey) {
          keyRotator.reportRateLimit(usedPoolKey, 300); // 5 minutes cooldown for failures
        }

        let cleanError = sanitizeErrorMessage(errorText || `Status ${response.status}`);
        if (response.status === 401) {
          cleanError = 'کلید API برای این مدل نامعتبر است یا در دیتابیس (پنل ادمین) به درستی تنظیم نشده است.';
        } else if (response.status === 402) {
           cleanError = 'موجودی حساب API ارائه‌دهنده برای این مدل به پایان رسیده است.';
        }

        sendChunk({ error: cleanError });
        sendChunk({ done: true });
        return finishStream();
      }

      if (!response.body) {
        clearTimeout(streamTimeoutId!);
        sendChunk({ error: 'پاسخی از سرور دریافت نشد.' });
        sendChunk({ done: true });
        return finishStream();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let isReasoningPhase = false;
      let openaiUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number; costToman?: number; balanceAfter?: number } | undefined = undefined;
      let fullAccumulatedCustom = '';
      let requestedModel = '';

      try {
        while (true) {
          resetStreamTimeout();
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
                  const reasonPrefix = '```reasoning\n';
                  fullAccumulatedCustom += reasonPrefix;
                  sendChunk({ chunk: reasonPrefix });
                }
                fullAccumulatedCustom += reasoningChunk;
                sendChunk({ chunk: reasoningChunk });
              } else if (contentChunk) {
                if (isReasoningPhase) {
                  isReasoningPhase = false;
                  const reasonSuffix = '\n```\n\n';
                  fullAccumulatedCustom += reasonSuffix;
                  sendChunk({ chunk: reasonSuffix });
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
      } catch (readErr: any) {
        if (readErr.name !== 'AbortError') {
          console.error('Stream read error from provider:', readErr);
          sendChunk({ error: 'ارتباط با سرور مدل هوش مصنوعی قطع شد.' });
        } else {
          sendChunk({ error: 'مهلت زمان پاسخ‌گویی به پایان رسید (Timeout).' });
        }
      } finally {
        clearTimeout(streamTimeoutId!);
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
            } catch { }
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

      if (userId && !hasCustomUserKey && fullAccumulatedCustom) {
        if (!openaiUsage || !openaiUsage.totalTokens) {
          const promptEstimate = Math.ceil(JSON.stringify(prunedMessages).length / 4);
          const completionEstimate = Math.ceil(fullAccumulatedCustom.length / 4);
          openaiUsage = {
            promptTokens: promptEstimate,
            completionTokens: completionEstimate,
            totalTokens: promptEstimate + completionEstimate,
          };
        }
        if (isFreeModel) {
          openaiUsage = { ...openaiUsage, costToman: 0 };
        } else {
          const modelName = requestedModel || apiConfig?.[provider]?.modelName || 'custom';
          const costUsd = calculateModelCostUsd(modelName, openaiUsage.promptTokens || 0, openaiUsage.completionTokens || 0);
          const deductResult = deductChatCost(
            userId,
            modelName,
            openaiUsage.promptTokens || 0,
            openaiUsage.completionTokens || 0,
            costUsd
          );
          openaiUsage = {
            ...openaiUsage,
            costToman: deductResult.costToman,
            balanceAfter: deductResult.balanceAfter,
          };
        }
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

export default router;
