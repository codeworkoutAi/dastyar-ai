import { describe, it, expect } from 'vitest';
import { toProductSlug } from './slugUtils';

describe('toProductSlug utility', () => {
  it('converts Persian titles to clean hypen-separated slugs', () => {
    const slug = toProductSlug('خرید اکانت قانونی هوش مصنوعی پیشرفته');
    expect(slug).toBe('خرید-اکانت-قانونی-هوش-مصنوعی-پیشرفته');
  });

  it('handles mixed English and Persian titles with punctuation', () => {
    const slug = toProductSlug('خرید اکانت قانونی Gemini Pro و Gemini Advanced فول اختصاصی!');
    expect(slug).toBe('خرید-اکانت-قانونی-gemini-pro-و-gemini-advanced-فول-اختصاصی');
  });

  it('handles titles with parentheses and special symbols', () => {
    const slug = toProductSlug('کردیت اختصاصی Claude و GPT (ویژه API، ادیتورها و n8n)');
    expect(slug).toBe('کردیت-اختصاصی-claude-و-gpt-ویژه-api-ادیتورها-و-n8n');
  });

  it('removes repeated hyphens and spaces and converts zwnj', () => {
    const slug = toProductSlug('   تست   عنوان    چند کلمه‌ای---خاص   ');
    expect(slug).toBe('تست-عنوان-چند-کلمه-ای-خاص');
  });

  it('returns empty string for null or non-string input', () => {
    expect(toProductSlug('')).toBe('');
    expect(toProductSlug(null as any)).toBe('');
    expect(toProductSlug(undefined as any)).toBe('');
  });
});
