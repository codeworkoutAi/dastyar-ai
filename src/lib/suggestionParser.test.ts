import { describe, it, expect } from 'vitest';
import { parseFollowUpSuggestions, cleanSuggestionsFromText } from './suggestionParser';

describe('Follow-up Suggestions Parser', () => {
  it('parses valid suggestions block with custom question and 3 items', () => {
    const text = `
این پاسخ اصلی است و توضیحات را شامل می‌شود.

<suggestions>
کدام مسیر برای پروژه شما مناسب‌تر است تا دقیق‌تر جلو برویم؟
- ساخت فروشگاه با Next.js و Supabase
- اتصال دامنه ir به سرورها
- راه‌اندازی وردپرس روی هاست ایران
</suggestions>
    `;

    const parsed = parseFollowUpSuggestions(text);
    expect(parsed).not.toBeNull();
    expect(parsed?.question).toBe('کدام مسیر برای پروژه شما مناسب‌تر است تا دقیق‌تر جلو برویم؟');
    expect(parsed?.items.length).toBe(3);
    expect(parsed?.items[0]).toBe('ساخت فروشگاه با Next.js و Supabase');
    expect(parsed?.items[1]).toBe('اتصال دامنه ir به سرورها');
    expect(parsed?.items[2]).toBe('راه‌اندازی وردپرس روی هاست ایران');
  });

  it('provides default question if model omits the guide question', () => {
    const text = `
پاسخ کوتاه.
<suggestions>
- گزینه اول
- گزینه دوم
</suggestions>
    `;

    const parsed = parseFollowUpSuggestions(text);
    expect(parsed).not.toBeNull();
    expect(parsed?.question).toContain('کدام مسیر');
    expect(parsed?.items.length).toBe(2);
  });

  it('returns null if there are no suggestions tags or tag is empty', () => {
    expect(parseFollowUpSuggestions('یک متن معمولی بدون تگ')).toBeNull();
    expect(parseFollowUpSuggestions('<suggestions></suggestions>')).toBeNull();
    expect(parseFollowUpSuggestions('')).toBeNull();
  });

  it('cleanSuggestionsFromText completely strips suggestions block', () => {
    const text = 'متن اصلی\n\n<suggestions>\nسوال؟\n- مورد یک\n</suggestions>';
    expect(cleanSuggestionsFromText(text)).toBe('متن اصلی');
  });

  it('cleanSuggestionsFromText strips unclosed suggestions tag during streaming', () => {
    const streamingText = 'متن پاسخ در حال استریم...\n\n<suggestions>\nسوال ناتمام';
    expect(cleanSuggestionsFromText(streamingText)).toBe('متن پاسخ در حال استریم...');
  });
});
