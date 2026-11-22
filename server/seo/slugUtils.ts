/**
 * Generates a clean, SEO-friendly URL slug supporting both Persian and English characters.
 */
export function toProductSlug(title: string): string {
  if (!title || typeof title !== 'string') return '';
  return title
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200b]/g, '-') // Replace zero-width non-joiners with hyphen
    .replace(/[،؛,\.;:!?/\\|]/g, '-') // Replace punctuation including Persian comma with hyphen
    .replace(/[^\u0600-\u06FF\w\s-]/g, '') // Keep Persian letters, Latin letters, numbers, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace whitespace and underscores with hyphen
    .replace(/-+/g, '-') // Deduplicate hyphens
    .replace(/^-|-$/g, ''); // Trim leading and trailing hyphens
}
