import { GoogleGenAI } from '@google/genai';
import { getGeminiClient, getGeminiKeyFromPool, getPollinationsImageUrl, optimizeImageToWebpDataUrl } from './utils';

export interface GeneratedGuide {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  source: string;
  image?: string;
  suggestedTopic?: string;
}

export type GuideTemplateType = 'workflow' | 'deep_dive' | 'industry' | 'mistakes';

export interface GuideIdeaItem {
  topic: string;
  template: GuideTemplateType;
  categoryLabel: string;
}

export const PRACTICAL_GUIDE_IDEAS: GuideIdeaItem[] = [
  // 1. آموزش‌های عملی، پرامپت‌نویسی و حل مسئله (Workflows)
  {
    topic: 'مهندسی پرامپت پیشرفته: چگونه خروجی‌های دقیق، عمیق و بدون توهم دریافت کنیم؟',
    template: 'workflow',
    categoryLabel: 'آموزش پرامپت'
  },
  {
    topic: '۵ ترفند شگفت‌انگیز اکسل و تحلیل داده‌های مالی به کمک هوش مصنوعی',
    template: 'workflow',
    categoryLabel: 'اکسل و داده'
  },
  {
    topic: 'چگونه با ترکیب ابزارهای هوش مصنوعی یک پادکست کامل و باکیفیت تولید کنیم؟',
    template: 'workflow',
    categoryLabel: 'تولید محتوا'
  },
  {
    topic: 'راهنمای گام‌به‌گام بهینه‌سازی رزومه و نگارش انگیزش‌نامه بین‌المللی با AI',
    template: 'workflow',
    categoryLabel: 'شغلی و رزومه'
  },
  {
    topic: 'تکنیک‌های تسریع کدنویسی، دیباگ و مستندسازی پروژه‌های نرم‌افزاری با دستیارهای کد',
    template: 'workflow',
    categoryLabel: 'برنامه‌نویسی'
  },

  // 2. کالبدشکافی عمیق، مفاهیم پایه و آینده‌پژوهی (Deep Dives)
  {
    topic: 'ایجنت‌های خودکار هوش مصنوعی (AI Agents) دقیقاً چه تفاوتی با ابزارهای متنی دارند؟',
    template: 'deep_dive',
    categoryLabel: 'مفاهیم پایه'
  },
  {
    topic: 'آیا هوش مصنوعی واقعاً مفاهیم را درک می‌کند یا فقط احتمال واژه‌ها را حدس می‌زند؟',
    template: 'deep_dive',
    categoryLabel: 'کالبدشکافی'
  },
  {
    topic: 'هوش جامع مصنوعی (AGI) چیست و جهان چه زمانی به مرز آن نزدیک می‌شود؟',
    template: 'deep_dive',
    categoryLabel: 'آینده‌پژوهی'
  },
  {
    topic: 'مدل‌های استدلالی عمیق (Reasoning Models) چگونه محاسبات پیچیده را گام‌به‌گام حل می‌کنند؟',
    template: 'deep_dive',
    categoryLabel: 'معماری هوش مصنوعی'
  },
  {
    topic: 'چالش‌های حریم خصوصی، امنیت داده و مالکیت فکری در عصر استفاده همگانی از هوش مصنوعی',
    template: 'deep_dive',
    categoryLabel: 'امنیت و اخلاق'
  },

  // 3. کاربردهای واقعی در صنایع و کسب‌وکارها (AI in Action)
  {
    topic: 'انقلاب هوش مصنوعی در پزشکی: از تشخیص زودهنگام بیماری‌ها تا کشف داروهای جدید',
    template: 'industry',
    categoryLabel: 'پزشکی و سلامت'
  },
  {
    topic: 'تحول طراحی معماری، رندرینگ و مدل‌سازی سه‌بعدی به کمک هوش مصنوعی مولد',
    template: 'industry',
    categoryLabel: 'معماری و دیزاین'
  },
  {
    topic: 'چگونه هوش مصنوعی فرآیندهای مالی، مدیریت ریسک و ترید را متحول کرده است؟',
    template: 'industry',
    categoryLabel: 'مالی و اقتصاد'
  },
  {
    topic: 'کاربرد مدل‌های صوتی و زبانی در آموزش نوین و شبیه‌سازی مکالمه زبان‌های خارجی',
    template: 'industry',
    categoryLabel: 'آموزش و زبان'
  },
  {
    topic: 'آینده بازار کار و مهارت‌های ضروری که بقای شغلی شما را در عصر هوش مصنوعی تضمین می‌کنند',
    template: 'industry',
    categoryLabel: 'کسب‌وکار و اشتغال'
  },

  // 4. اشتباهات رایج، نقد و جعبه ابزار (Mistakes & Toolkits)
  {
    topic: '۵ اشتباه متداول که باعث می‌شود پاسخ‌های هوش مصنوعی سطحی و نامعتبر به نظر برسند',
    template: 'mistakes',
    categoryLabel: 'اشتباهات رایج'
  },
  {
    topic: 'جعبه ابزار ضروری هوش مصنوعی برای تولیدکنندگان محتوای دیجیتال و بازاریابان',
    template: 'mistakes',
    categoryLabel: 'جعبه ابزار'
  },
  {
    topic: 'چگونه کارهای تکراری اداری و مدیریت ایمیل‌ها را با ابزارهای هوش مصنوعی اتوماسیون کنیم؟',
    template: 'mistakes',
    categoryLabel: 'بهره‌وری اداری'
  }
];

const TEMPLATE_INSTRUCTIONS: Record<GuideTemplateType, string> = {
  workflow: `ساختار قالب «راهنمای گام‌به‌گام و ترفندهای عملی»:
- مقدمه گیرا و قلاب (بیان درد یا چالش واقعی که کاربران با آن مواجه‌اند).
- مقایسه روش سنتی زمان‌بر با راهکار نوین هوش مصنوعی.
- ۳ تا ۴ مرحله عملی همراه با توضیح دقیق و بدون حاشیه.
- حداقل ۲ کادر مجزا با فرمت زیر برای راهنمایی خواننده:
  > 💡 **نکته کلیدی:**
  > [توضیح کوتاه تکنیک یا روش هوشمندانه]
  
  > 📋 **نمونه پرامپت یا سناریوی عملی:**
  > «متن پرامپت آماده و بهینه همراه با جایگزین‌های [موضوع شما]...»
- ترفند ناگفته یا نکته حرفه‌ای (Pro-Tip) که افراد مبتدی از آن غافلند.
- نتیجه‌گیری و چالش کوچک برای اینکه خواننده همین امروز آن را امتحان کند.`,

  deep_dive: `ساختار قالب «کالبدشکافی عمیق و آینده‌پژوهی»:
- مقدمه جذاب با یک پرسش تکان‌دهنده، پارادوکس یا داستان کوتاه علمی.
- تشریح مفهوم به زبان بسیار ساده و ملموس، بدون استفاده از اصطلاحات نامفهوم ریاضی/فنی.
- بررسی عملکرد در پشت صحنه (این فناوری در باطن چگونه کار می‌کند؟).
- کادرهای اختصاصی تحلیل:
  > 🔍 **کالبدشکافی مفهوم:**
  > [توضیح تفاوت باور عمومی با واقعیت فنی]
  
  > ⚠️ **چالش‌ها و ملاحظات اخلاقی/امنیتی:**
  > [محدودیت‌ها، خطرات احتمالی و نقاط تاریک موضوع]
- چشم‌انداز آینده و تأثیر این پدیده بر زندگی انسان‌ها در ۵ سال آینده.
- نتیجه‌گیری متفکرانه و جمع‌بندی بدون کلیشه‌های تکراری.`,

  industry: `ساختار قالب «هوش مصنوعی در صنایع و کسب‌وکار»:
- قلاب آماری یا نقل‌قول از یک تحول چشمگیر در این صنعت.
- بررسی حوزه‌های تحول‌یافته (حداقل ۳ بخش کاربردی مجزا با تیترهای رسا).
- نمونه‌ها و سناریوهای عینی از پیاده‌سازی این فناوری در دنیای واقعی.
- کادرهای کاربردی:
  > 🏢 **سناریوی سازمانی:**
  > [نمونه یک استفاده موفق و افزایش بهره‌وری حاصل از آن]
  
  > 💡 **چگونه وارد این حوزه شویم؟**
  > [راهنمای سریع برای متخصصان و علاقه‌مندان به این صنعت]
- مهارت‌هایی که شاغلان این حوزه باید برای همراهی با این موج بیاموزند.
- چشم‌انداز و خلاصه پیام برای فعالان صنعت.`,

  mistakes: `ساختار قالب «اشتباهات رایج و جعبه‌ابزار»:
- چرا اغلب افراد نتیجه مطلوبی از هوش مصنوعی نمی‌گیرند؟ (ریشه‌یابی خطاها).
- تشریح ۵ اشتباه اساسی و رایج کاربران؛ برای هر اشتباه حتماً «اشتباه چیست؟» و «جایگزین درست چیست؟» قید شود.
- کادرهای راهنمایی سریع:
  > ⚠️ **اشتباه رایج:**
  > [رفتار اشتباه کاربر]
  
  > ✅ **روش اصولی و جایگزین:**
  > [دستورالعمل درست برای نتیجه‌گیری فوق‌العاده]
- چک‌لیست کاربردی پیش از شروع کار (به صورت بولت‌های کوتاه و کاربردی).
- نتیجه‌گیری و تشویق به تغییر زاویه دید نسبت به ابزارهای هوشمند.`
};

/**
 * Generates an authoritative, engaging, evergreen Persian educational article
 * on AI concepts, workflows, industry applications, and best practices.
 * 
 * Strict constraints (Layer Zero):
 * - NO model names (Gemini, Claude, GPT, OpenAI, DeepSeek, Mistral, etc.)
 * - NO banned phrases («بدون کارت بانکی»، «بدون فیلترشکن»)
 * - NO product pitches or forced chatbox callbacks (pure journalistic authority)
 * - Negative prompting against robotic AI cliches
 */
export async function generateEducationalGuide(
  customTopic?: string, 
  templateType?: GuideTemplateType
): Promise<GeneratedGuide> {
  let chosenTopic = '';
  let chosenTemplate: GuideTemplateType = templateType || 'workflow';

  if (customTopic && customTopic.trim().length > 0) {
    chosenTopic = customTopic.trim();
    if (!templateType) {
      // Auto-detect template based on topic keywords
      const t = chosenTopic.toLowerCase();
      if (t.includes('اشتباه') || t.includes('جعبه ابزار') || t.includes('نباید')) {
        chosenTemplate = 'mistakes';
      } else if (t.includes('چیست') || t.includes('تفاوت') || t.includes('آینده') || t.includes('مفهوم') || t.includes('agi') || t.includes('درک')) {
        chosenTemplate = 'deep_dive';
      } else if (t.includes('پزشکی') || t.includes('معماری') || t.includes('مالی') || t.includes('صنعت') || t.includes('بازار کار') || t.includes('کسب‌وکار')) {
        chosenTemplate = 'industry';
      } else {
        chosenTemplate = 'workflow';
      }
    }
  } else {
    const randomItem = PRACTICAL_GUIDE_IDEAS[Math.floor(Math.random() * PRACTICAL_GUIDE_IDEAS.length)];
    chosenTopic = randomItem.topic;
    chosenTemplate = templateType || randomItem.template;
  }

  const apiKey = process.env.DEFAULT_GEMINI_KEY || process.env.GEMINI_API_KEY || getGeminiKeyFromPool() || '';
  if (!apiKey) {
    throw new Error('کلید API برای تولید مقاله هوشمند تنظیم نشده است.');
  }

  const ai = getGeminiClient(apiKey, true);
  const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];

  const templateGuidance = TEMPLATE_INSTRUCTIONS[chosenTemplate] || TEMPLATE_INSTRUCTIONS.workflow;

  const prompt = `شما یک روزنامه‌نگار، پژوهشگر ارشد فناوری و مدرس برجسته در حوزه هوش مصنوعی هستید.
شما برای یک رسانه مرجع، وزین و تخصصی فناوری محتوا تولید می‌کنید. شما یک بازاریاب نیستید، به هیچ محصول خاصی وابسته نیستید و هدفتان صرفاً آموزش عمیق، افزایش آگاهی مخاطب و ارائه ارزش کاربردی و علمی است.

موضوع مقاله: «${chosenTopic}»

${templateGuidance}

قوانین و دستورالعمل‌های نگارش (بسیار حیاتی):
۱. لحن مقاله:
   - شیوا، خواندنی، صمیمی، حرفه‌ای و طبیعی (اصلاً شبیه به ترجمه ماشینی یا متن‌های خشک اداری نباشد).
   - خواننده باید حس کند در حال خواندن یک مقاله از مجلات برتر فناوری جهان مانند Wired یا MIT Technology Review است.

۲. ممنوعیت عبارات کلیشه‌ای (Negative Prompting):
   - از آوردن عبارات تکراری و خسته‌کننده رباتیک مانند «در دنیای پرشتاب امروز»، «در عصر دیجیتال»، «تحول شگرف و چشمگیر»، «در نتیجه می‌توان گفت»، «به طور کلی»، «در پایان باید گفت» اکیداً خودداری کنید.
   - شروع مقاله باید بدون هیچ کلیشه‌ای و مستقیماً با یک سوال تامل‌برانگیز، یک آمار جذاب یا یک داستان واقعی آغاز شود.

۳. عدم وجود هیچ‌گونه تبلیغات یا ارجاع به چت‌باکس:
   - مقاله کاملاً رسانه‌ای و عمومی است. هرگز به هیچ چت‌باکس اختصاصی یا خدمات خاصی ارجاع ندهید («در چت‌باکس ما بروید» یا «به دستیار آنلاین مراجعه کنید» کاملاً ممنوع است).

۴. قانون محدودیت نام مدل‌ها (Non-Negotiable Layer Zero):
   - هرگز و تحت هیچ شرایطی نام هیچ مدل تجاری یا شرکتی (مانند Gemini, ChatGPT, GPT, Claude, OpenAI, DeepSeek, Mistral, Meta, Google, Microsoft) را در متن نیاورید!
   - به جای آن‌ها صرفاً از عبارات عام و علمی استفاده کنید: «مدل‌های استدلالی هوش مصنوعی»، «مدل‌های زبانی بزرگ (LLM)»، «ابزارهای هوش مصنوعی مولد»، «موتورهای صوتی»، «دستیارهای کدنویسی هوشمند»، «ایجنت‌های مستقل هوش مصنوعی».

۵. عبارات ممنوعه پروژه:
   - دو عبارت «بدون کارت بانکی» و «بدون فیلترشکن» کاملاً ممنوع هستند و نباید در هیچ بخشی استفاده شوند.

۶. فرمت خروجی:
   صرفاً و منحصراً یک شیء معتبر JSON با ساختار زیر تولید کنید بدون هیچ پیشوند یا پسوند متنی خارج از JSON:
{
  "title": "یک عنوان جذاب، سئوشده، کلیک‌خور و خوش‌آهنگ فارسی (حداکثر ۶۵ کاراکتر)",
  "slug": "english-url-slug-seo-friendly",
  "summary": "خلاصه جذاب مقاله در دو جمله فارسی که خواننده را کنجکاو به مطالعه کند",
  "content": "متن کامل، عمیق و ساختارمند مقاله به فرمت مارک‌داون (با تیترهای ## و ###، نقل‌قول‌ها، باکس‌های کال‌اوت و بولت‌ها)",
  "tags": ["تگ ۱", "تگ ۲", "تگ ۳", "تگ ۴"]
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
  const rawTags = Array.isArray(parsed.tags) ? parsed.tags : ['هوش مصنوعی', 'آموزش', 'راهنما'];
  const tags = Array.from(new Set(['مقالات آموزشی', 'آموزش', ...rawTags]));
  const slug = (parsed.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `ai-guide-${Date.now()}`;

  // Generate a customized cover image prompt based on the template and topic
  let image = '/default-news-cover.webp';
  try {
    let visualTheme = 'artificial intelligence technology, glowing digital network, cozy modern workstation, sleek minimalist 3d illustration, clay style aesthetics';
    if (chosenTemplate === 'deep_dive') {
      visualTheme = 'futuristic neural brain glowing with synaptic light, quantum computing nodes, deep science aesthetics, deep navy and cyan glowing 3d render';
    } else if (chosenTemplate === 'industry') {
      visualTheme = 'modern smart automated enterprise, robotic automation and technology infrastructure, high-tech industry 3d isometric render, sleek glass and neon accents';
    } else if (chosenTemplate === 'mistakes') {
      visualTheme = 'digital diagnostic cybernetic interface, warning glowing shields and safety locks, high-tech cybersecurity abstract 3d clay concept';
    }

    const pollUrl = getPollinationsImageUrl(visualTheme);
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
    source: 'guide',
    image,
    suggestedTopic: chosenTopic
  };
}
