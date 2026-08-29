/**
 * Smart Auto Web Search Detection
 * Automatically detects when AI models need web assistance for accurate responses
 */

export interface WebSearchDecision {
  shouldSearch: boolean;
  reason: string;
  domains?: string[]; // Trusted domains to prioritize
  category: string;
}

/**
 * Detect if a query needs web search assistance
 */
export function detectWebSearchNeed(query: string): WebSearchDecision {
  const lowerQuery = query.toLowerCase();

  // 1. Explicit search commands (e.g. "جستجو کن", "search the web")
  if (/(search|جستجو|بگرد|پیدا کن|سرچ|look up|google)/i.test(lowerQuery)) {
    return {
      shouldSearch: true,
      reason: 'Explicit search command',
      category: 'explicit',
    };
  }

  // 2. Skip conversational, generative, or local coding tasks
  const noSearchPatterns = [
    /(ترجمه|معنی|به انگلیسی|به فارسی|تلفظ)/i,
    /(ایده|انشا|خلاصه|تایپ|نامه|محتوا|متن|کپشن)/i,
    /^(write|بنویس|create|بساز|دیباگ|چرا ارور|refactor|توضیح|explain)/i,
    /^(hi|hello|سلام|صبح|عصر|چطوری|خوبی|ممنون|مرسی|تشکر|خداحافظ)/i,
  ];
  
  if (noSearchPatterns.some(pattern => pattern.test(lowerQuery))) {
    return {
      shouldSearch: false,
      reason: 'Model can handle this locally (Generative/Conversational)',
      category: 'none',
    };
  }

  // 3. Dynamic procedural detection: Time-sensitive, live data, or factual questions
  const requiresLiveInformation = /(امروز|الان|جدیدترین|آخرین|قیمت|نرخ|نتیجه|اخبار|خبر|آب و هوا|هواشناسی|امسال|ساعت|now|today|latest|current|price|news|weather|time)/i.test(lowerQuery);
  
  const isQuestion = /(چیست|کیست|کجاست|چرا|چگونه|چطور|چه|کی|کجا|چند|آیا|what|who|where|when|why|how)/i.test(lowerQuery) || lowerQuery.includes('؟') || lowerQuery.includes('?');

  if (requiresLiveInformation || (isQuestion && lowerQuery.split(/\s+/).length > 2)) {
    return {
      shouldSearch: true,
      reason: 'Dynamic factual or time-sensitive query',
      category: 'dynamic',
    };
  }

  return {
    shouldSearch: false,
    reason: 'Simple query - model knowledge sufficient',
    category: 'none',
  };
}
