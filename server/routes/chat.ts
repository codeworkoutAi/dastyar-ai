import express from 'express';
import { isSafeBaseUrl, getGeminiClient, extractCleanErrorMessage, sanitizeErrorMessage, formatContentsForGemini, sleep, getPollinationsImageUrl, translateAndEnhanceImagePrompt, normalizeBaseUrl, parseCustomHeaders } from '../services/utils';
import { SmartWebAgent } from '../services/WebSearchAgent';
import { responseCache, CACHE_TTL_MS, computeCacheKey, setCachedResponse } from '../services/CacheService';
const router = express.Router();

router.post('/api/chat/stream', async (req, res) => {
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

    // Auto-detect native official providers from custom profiles based on Base URL
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

    // Benchmark / Safe High-Concurrency Load Simulation Mode
    if (provider === 'benchmark' || req.headers['x-benchmark-sim'] === 'true' || apiConfig?.model === 'benchmark-simulation') {
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

    if (apiConfig?.webSearch && !isDateInquiry) {
      console.log('[Backend] Web search enabled, executing SmartWebAgent...');
      if (userText && userText.trim().length > 1) {
        liveWebContext = await SmartWebAgent.processQuery(userText, settings?.tools?.webSearchDomains, apiConfig);
        console.log('[Backend] Web search result length:', liveWebContext?.length || 0);
      }
    } else {
      console.log('[Backend] Web search disabled. apiConfig.webSearch:', apiConfig?.webSearch, 'isDateInquiry:', isDateInquiry);
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
          const webSearchWrapper = `\n\n<web_search_results>\n${liveWebContext}\n</web_search_results>\n\n<instructions>\nاخطار مهم: پاسخ خود را دقیقاً و منحصراً بر اساس اطلاعات داخل تگ بالا ارائه بده. تو موظفی تمام اعداد، آمار و جزئیات دقیق (مانند دما، رطوبت، سرعت باد، قیمت‌ها، تاریخ‌ها و پیش‌بینی‌ها) را به طور کامل از متن استخراج و گزارش کنی. حق خلاصه‌سازیِ داده‌های مهم را نداری و باید یک گزارش جامع و ساختاریافته ارائه دهی.\n</instructions>`;
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
              tools: apiConfig?.webSearch ? [{ googleSearch: {} }] : undefined,
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
              generatedImageUrl = getPollinationsImageUrl(enhancedPrompt, '1:1', 'flux');
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
        else model = 'gpt-4o-mini';
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
            max_tokens: typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0 ? apiConfig.maxTokens : 16384,
            max_completion_tokens: typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0 ? apiConfig.maxTokens : 16384,
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
