import { GoogleGenAI } from '@google/genai';
import { getGeminiClient, getGeminiKeyFromPool, getPollinationsImageUrl, optimizeImageToWebpDataUrl } from './utils';

export interface GeneratedGuide {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  image?: string;
  suggestedTopic?: string;
}

export const PRACTICAL_GUIDE_IDEAS = [
  'نحوه نوشتن پرامپت حرفه‌ای و بدون خطا برای کارهای روزمره',
  '۵ ترفند شگفت‌انگیز اکسل و تحلیل داده با هوش مصنوعی',
  'راهنمای گام‌به‌گام نوشتن رزومه و انگیزش‌نامه برنده با هوش مصنوعی',
  'بهترین روش‌های یادگیری زبان انگلیسی و مکالمه به کمک هوش مصنوعی',
  'چگونه مقاله‌ها و کتاب‌های طولانی را در چند دقیقه دقیق خلاصه کنیم؟',
  'برنامه‌ریزی هفتگی، اولویت‌بندی کارها و افزایش بهره‌وری فردی با AI',
  'تکنیک‌های ایده‌پردازی و نگارش محتوای جذاب برای شبکه‌های اجتماعی',
  'روش خطایابی و بهینه‌سازی کدهای برنامه‌نویسی برای مبتدیان و حرفه‌ای‌ها',
  'آموزش ساخت ایمیل‌های رسمی، اداری و تجاری با لحن کاملاً حرفه‌ای',
  'روش‌های حل مسائل ریاضی، آمار و حسابداری با راهنمایی گام‌به‌گام هوش مصنوعی'
];

/**
 * Generates a deeply engaging, conversational Persian educational article
 * on using AI in daily life, work, learning, and productivity.
 * 
 * Strict constraints (Layer Zero):
 * - NO model names (Gemini, Claude, GPT, OpenAI, DeepSeek, Mistral, etc.)
 * - NO banned phrases («بدون کارت بانکی»، «بدون فیلترشکن»)
 * - Friendly, clear, conversational Persian («زبان محاوره‌ای تمیز و روان»)
 * - Ready-to-use copy-paste prompts in blockquotes
 */
export async function generateEducationalGuide(customTopic?: string): Promise<GeneratedGuide> {
  const chosenTopic = customTopic && customTopic.trim().length > 0 
    ? customTopic.trim() 
    : PRACTICAL_GUIDE_IDEAS[Math.floor(Math.random() * PRACTICAL_GUIDE_IDEAS.length)];

  const apiKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY || getGeminiKeyFromPool() || '';
  if (!apiKey) {
    throw new Error('کلید API برای تولید مقاله هوشمند تنظیم نشده است.');
  }

  const ai = getGeminiClient(apiKey, true);
  const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];

  const prompt = `شما یک نویسنده و مربی متخصص، فوق‌العاده صمیمی و خوش‌بیان در حوزه کاربردهای عملی هوش مصنوعی در زندگی روزمره هستید.
وظیفه شما نگارش یک مقاله آموزشی عمیق، خواندنی، کاربردی و جذاب به زبان فارسی درباره موضوع زیر است:

موضوع مقاله: «${chosenTopic}»

قوانین و دستورالعمل‌های بسیار مهم و غیرقابل‌مذاکره:
۱. لحن مقاله: صمیمی، شیوا، روان، کاربردی و جذاب (زبان محاوره‌ای تمیز و خواندنی، بدون واژه‌های سنگین و بدون ترجمه ماشینی). طوری بنویسید که خواننده احساس کند با یک دوست کاربلد و مهربان گپ می‌زند.
۲. ساختار مقاله:
   - یک عنوان بسیار جذاب، کلیک‌خور و خوش‌آهنگ به فارسی (حداکثر ۷۰ کاراکتر).
   - یک مقدمه کوتاه و دلنشین که خواننده را کنجکاو کند و ضرورت این مهارت را نشان دهد.
   - ۳ تا ۴ بخش اصلی با تیترهای رسا (## و ###) همراه با توضیحات مرحله‌به‌مرحله و مثال‌های کاملاً واقعی و ملموس.
   - در هر بخش، حتماً حداقل یک کادر پرامپت آماده و حرفه‌ای برای کپی-پیست قرار دهید به این شکل:
     > 💡 **پرامپت آماده برای کپی:**
     > «متن پرامپت کاربردی همراه با متغیرهایی مثل [موضوع شما]...»
   - بخش اشتباهات رایج یا ترفندهای ناگفته (نکاتی که اغلب کاربران از آن بی‌خبرند).
   - نتیجه‌گیری و تشویق خواننده به امتحان کردن این پرامپت‌ها در چت آنلاین Dastyar AI.
۳. محدودیت نام مدل‌ها (بسیار حیاتی):
   هرگز و تحت هیچ شرایطی نام هیچ مدل یا شرکتی (مانند Gemini, ChatGPT, GPT, Claude, OpenAI, DeepSeek, Mistral) را در متن نیاورید! صرفاً از عبارات عام مانند «دستیار هوش مصنوعی»، «چت‌بات هوشمند»، «ابزار هوش مصنوعی» استفاده کنید.
۴. عبارات ممنوعه: عبارت‌های «بدون کارت بانکی» و «بدون فیلترشکن» اکیداً ممنوع هستند و نباید تحت هیچ عنوان در هیچ‌جای متن ذکر شوند.
۵. خروجی صرفاً و منحصراً باید یک شیء JSON با ساختار زیر باشد و هیچ متن اضافه یا کدبلاک اضافه‌ای خارج از JSON ارسال نشود:
{
  "title": "عنوان جذاب فارسی",
  "slug": "english-url-slug-seo-friendly",
  "summary": "خلاصه جذاب در یک یا دو جمله فارسی",
  "content": "متن کامل مقاله به فرمت مارک‌داون غنی همراه با پرامپت‌ها و مثال‌ها",
  "tags": ["آموزش", "راهنما", "کاربرد هوش مصنوعی", "مهارت دیجیتال"]
}`;

  let response: any = null;
  let lastErr: any = null;

  for (const model of candidateModels) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });
      if (response && response.text) break;
    } catch (err: any) {
      lastErr = err;
      console.warn(`[GuideGenerator] Model ${model} failed:`, err?.message || err);
    }
  }

  if (!response || !response.text) {
    throw new Error(`خطا در تولید مقاله توسط مدل هوش مصنوعی: ${lastErr?.message || 'پاسخی دریافت نشد'}`);
  }

  let parsed: any;
  try {
    let cleanText = response.text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    parsed = JSON.parse(cleanText);
  } catch (parseErr: any) {
    console.error('[GuideGenerator] Failed to parse JSON response:', response.text);
    throw new Error('خطا در تبدیل خروجی ساختاریافته هوش مصنوعی به داده معتبر.');
  }

  const title = (parsed.title || chosenTopic).trim();
  const summary = (parsed.summary || '').trim();
  const content = (parsed.content || '').trim();
  const tags = Array.isArray(parsed.tags) ? parsed.tags : ['آموزش', 'راهنما', 'کاربرد هوش مصنوعی'];
  const slug = (parsed.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `ai-guide-${Date.now()}`;

  // Generate an optional cover image WebP or fallback to default
  let image = '/default-news-cover.webp';
  try {
    const imagePrompt = `clean modern minimalist digital workspace, artificial intelligence education, cozy study atmosphere, high aesthetic illustration, 3d clay style, subtle glowing details`;
    const pollUrl = getPollinationsImageUrl(imagePrompt);
    const webpData = await optimizeImageToWebpDataUrl(pollUrl, 800);
    if (webpData && webpData.startsWith('data:image/webp;base64,')) {
      image = webpData;
    }
  } catch (imgErr) {
    console.warn('[GuideGenerator] Image generation fallback to default cover:', imgErr);
    image = '/default-news-cover.webp';
  }

  return {
    title,
    slug,
    summary,
    content,
    tags,
    image,
    suggestedTopic: chosenTopic
  };
}
