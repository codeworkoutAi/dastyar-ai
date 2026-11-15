import { describe, it, expect } from 'vitest';
import { extractCleanAnswerForSpeech, isPersianSpeechText, splitTextIntoSpeechChunks } from './tts';

describe('TTS Unit Tests', () => {
  it('extractCleanAnswerForSpeech strips markdown, code blocks and thinking tags', () => {
    const raw = `
<think>Thinking about greeting</think>
# سلام کاربر گرامی!
این یک **متن آزمایشی** است با [لینک](https://example.com).
\`\`\`javascript
console.log("hello");
\`\`\`
موفق باشید. 😊🚀
    `;
    const clean = extractCleanAnswerForSpeech(raw);
    expect(clean).not.toContain('<think>');
    expect(clean).not.toContain('console.log');
    expect(clean).not.toContain('#');
    expect(clean).not.toContain('**');
    expect(clean).not.toContain('https://example.com');
    expect(clean).not.toContain('😊');
    expect(clean).toContain('سلام کاربر گرامی!');
    expect(clean).toContain('این یک متن آزمایشی است');
  });

  it('isPersianSpeechText accurately identifies Persian characters', () => {
    expect(isPersianSpeechText('سلام')).toBe(true);
    expect(isPersianSpeechText('Hello world')).toBe(false);
    expect(isPersianSpeechText('این یک متن انگلیسی نیست.')).toBe(true);
  });

  it('splitTextIntoSpeechChunks returns 1 chunk for short text', () => {
    const shortText = 'سلام. این یک متن کوتاه است.';
    const chunks = splitTextIntoSpeechChunks(shortText, 700);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(shortText);
  });

  it('splitTextIntoSpeechChunks splits long text at natural sentence boundaries', () => {
    const sentence1 = 'بخش اول این پیام حاوی اطلاعات کلیدی درباره هوش مصنوعی و کاربردهای آن در صنعت است. '.repeat(10);
    const sentence2 = 'بخش دوم شامل توضیحات بیشتر و جزئیات تکمیلی در رابطه با شبکه‌های عصبی عمیق می‌باشد. '.repeat(10);
    const fullText = `${sentence1}\n${sentence2}`;

    expect(fullText.length).toBeGreaterThan(1500);

    const chunks = splitTextIntoSpeechChunks(fullText, 700);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(750);
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it('splitTextIntoSpeechChunks handles Persian commas if single sentence exceeds limit', () => {
    const longClause = 'کلمه '.repeat(200);
    const textWithCommas = `${longClause}، ${longClause}`;
    const chunks = splitTextIntoSpeechChunks(textWithCommas, 700);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});
