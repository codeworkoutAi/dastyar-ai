/**
 * Enhanced Smart Routing Intent Detection with weighted keywords and context awareness
 */

interface IntentWeights {
  vision: number;
  coding: number;
  general: number;
}

/**
 * Calculate weighted scores for each intent category
 */
export function detectSmartRoutingIntent(text: string, hasImageAttachment: boolean): 'vision' | 'coding' | 'general' {
  const weights: IntentWeights = {
    vision: 0,
    coding: 0,
    general: 0,
  };

  // Vision intent patterns (with negative patterns to avoid false positives)
  const visionPositivePatterns = [
    { pattern: /\b(عکس|تصویر|فیلم|ویدئو|ویدیو|فوتو|photo|image|picture|video)\b/gi, weight: 3 },
    { pattern: /\b(تحلیل|بررسی|توضیح|شرح).*(عکس|تصویر|فیلم)/gi, weight: 4 },
    { pattern: /\b(چی|چه).*(توی|در|داخل).*(عکس|تصویر|فیلم)/gi, weight: 5 },
    { pattern: /\bوضعیت.*فایل/gi, weight: 2 },
  ];

  const visionNegativePatterns = [
    { pattern: /\b(تصویر ذهنی|مفهوم|ایده|نظریه|کانسپت)\b/gi, weight: -5 },
    { pattern: /\b(نمایش|چاپ|لاگ|لوگ|console|print|render)\b/gi, weight: -3 },
    { pattern: /\breact.*image|image.*component|img.*tag\b/gi, weight: -4 },
  ];

  // Coding intent patterns (with higher weight for technical specificity)
  const codingPatterns = [
    { pattern: /\b(function|class|const|let|var|def|return|import|export)\b/gi, weight: 5 },
    { pattern: /\b(برنامه نویسی|برنامه‌نویسی|کدنویسی|پروگرامینگ)\b/gi, weight: 4 },
    { pattern: /\b(پایتون|جاوا|سی شارپ|جاوااسکریپت|ری‌اکت|typescript|python|javascript|java|c\+\+|php|go|rust)\b/gi, weight: 4 },
    { pattern: /\b(الگوریتم|ساختمان داده|دیباگ|تست|یونیت تست)\b/gi, weight: 3 },
    { pattern: /\b(api|endpoint|database|sql|query|schema|json|xml)\b/gi, weight: 3 },
    { pattern: /\b(error|exception|bug|issue|fix|debug|trace)\b/gi, weight: 3 },
    { pattern: /\b(فرانت|بک‌اند|backend|frontend|fullstack)\b/gi, weight: 2 },
    { pattern: /\b(کامپایل|بیلد|دیپلوی|build|compile|deploy)\b/gi, weight: 3 },
    { pattern: /(کد|code).*(بنویس|write|generate|create)/gi, weight: 4 },
    { pattern: /[{}()\[\];:=><]/g, weight: 0.5 }, // Special chars indicate code
  ];

  // Calculate vision score
  for (const { pattern, weight } of visionPositivePatterns) {
    const matches = text.match(pattern);
    if (matches) weights.vision += weight * matches.length;
  }

  for (const { pattern, weight } of visionNegativePatterns) {
    const matches = text.match(pattern);
    if (matches) weights.vision += weight * matches.length;
  }

  // Image attachment heavily suggests vision intent
  if (hasImageAttachment) {
    weights.vision += 10;
  }

  // Calculate coding score
  for (const { pattern, weight } of codingPatterns) {
    const matches = text.match(pattern);
    if (matches) weights.coding += weight * matches.length;
  }

  // Context-aware adjustments
  const wordCount = text.split(/\s+/).length;

  // Very short queries are less likely to be coding unless they contain explicit code
  if (wordCount < 5 && !/[{}()\[\];:=><]/.test(text)) {
    weights.coding *= 0.5;
  }

  // Questions about concepts/ideas are likely general, not coding
  if (/\b(چیست|چیه|یعنی چی|meaning|definition|توضیح بده|explain|what is)\b/gi.test(text)) {
    weights.coding *= 0.7;
    weights.general += 2;
  }

  // Debug logging (remove in production)
  console.log('[SmartRouting] Weights:', weights, 'Text:', text.substring(0, 50));

  // Decision logic with thresholds
  if (weights.vision > 5 || (hasImageAttachment && weights.vision > 0)) {
    return 'vision';
  }

  if (weights.coding > 5) {
    return 'coding';
  }

  return 'general';
}
