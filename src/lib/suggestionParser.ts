export interface FollowUpSuggestionsData {
  question: string;
  items: string[];
}

/**
 * Parses <suggestions>...</suggestions> block from message text.
 * Expects:
 * <suggestions>
 * سوال راهنما (اختیاری)
 * - گزینه اول
 * - گزینه دوم
 * - گزینه سوم
 * </suggestions>
 */
export function parseFollowUpSuggestions(rawText: string): FollowUpSuggestionsData | null {
  if (!rawText) return null;

  const match = rawText.match(/<suggestions>([\s\S]*?)<\/suggestions>/i);
  if (!match || !match[1]) return null;

  const inner = match[1].trim();
  if (!inner) return null;

  const lines = inner.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let question = 'کدام مسیر برای شما مناسب‌تر است تا دقیق‌تر جلو برویم؟';
  const items: string[] = [];

  for (const line of lines) {
    if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^[۰-۹0-9]+[\.\-\)]/.test(line)) {
      const cleanItem = line.replace(/^[-*•۰-۹0-9\.\-\)]+\s*/, '').trim();
      if (cleanItem.length > 0 && cleanItem.length < 90) {
        items.push(cleanItem);
      }
    } else if (items.length === 0 && line.length > 2 && line.length < 120) {
      // First line before bullets is the guide question
      question = line.replace(/^[✦💡⚡️?؟\s]+/, '').trim();
    }
  }

  if (items.length === 0) return null;

  return {
    question: question || 'کدام مسیر برای شما مناسب‌تر است تا دقیق‌تر جلو برویم؟',
    items: items.slice(0, 3),
  };
}

/**
 * Completely removes any <suggestions> tags (including unclosed ones during streaming)
 * from visible text.
 */
export function cleanSuggestionsFromText(text: string): string {
  if (!text) return '';
  return text.replace(/<suggestions>[\s\S]*?(<\/suggestions>|$)/gi, '').trim();
}
