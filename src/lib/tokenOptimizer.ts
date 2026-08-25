import { ChatMessage, Role } from '../types';

/**
 * Lightweight token estimator based on BPE tokenization heuristics for Persian, English, and Code.
 * - Persian/Arabic characters: ~1.8 chars / token
 * - Latin/English/Code characters: ~4.0 chars / token
 * - Numbers/Symbols: ~2.0 chars / token
 * - Media attachments: ~258 - 500 estimated tokens (standard vision patch grid)
 */
export function estimateTokenCount(text: string, hasMedia: boolean = false): number {
  if (!text && !hasMedia) return 0;

  let tokenCount = 0;
  if (text) {
    const persianChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const digitsAndSymbols = (text.match(/[0-9۰-۹\s\p{P}\p{S}]/gu) || []).length;
    const otherChars = Math.max(0, text.length - persianChars - latinChars - digitsAndSymbols);

    tokenCount += Math.ceil(persianChars / 1.8);
    tokenCount += Math.ceil(latinChars / 4.0);
    tokenCount += Math.ceil(digitsAndSymbols / 2.5);
    tokenCount += Math.ceil(otherChars / 2.0);
  }

  if (hasMedia) {
    tokenCount += 300; // Base vision token footprint
  }

  return Math.max(1, tokenCount);
}

export interface OptimizedContextMessage {
  role: Role;
  content: string;
  imageUrl?: string;
  imageUrls?: string[]; // NEW: multiple attachments
}

export interface ContextPruningOptions {
  maxRecentTurns?: number; // Number of recent message turns to retain raw (default 8)
  maxContextTokens?: number; // Approximate token limit budget
}

/**
 * Builds an optimized sliding context window:
 * 1. Prunes past raw base64 images/media into lightweight placeholders: `[تصویر ضمیمه شده قبلی: بررسی شد]`
 * 2. Retains the last N messages in high fidelity (sliding window).
 * 3. Compacts older messages outside the window into a concise background context summary.
 * 4. Ensures the latest turn contains the active user input and active media (if any).
 */
export function buildOptimizedContext(
  history: ChatMessage[],
  currentTurn: { content: string; imageUrl?: string; imageUrls?: string[] },
  options: ContextPruningOptions = {}
): OptimizedContextMessage[] {
  const maxRecent = options.maxRecentTurns ?? 8;
  const outbound: OptimizedContextMessage[] = [];

  // Filter out system messages (handled separately) and error messages
  const validHistory = history.filter((m) => m.role !== 'system' && !m.error && m.content?.trim());

  if (validHistory.length <= maxRecent) {
    // History is short enough: keep all turns, but de-duplicate media from past turns
    for (const msg of validHistory) {
      const sanitizedImageUrl = undefined; // Past turns do not re-transmit raw media
      let content = msg.content || '';

      if (msg.imageUrl && !content.includes('[تصویر/رسانه')) {
        content = `[تصویر/رسانه ضمیمه شده قبلی: بررسی شد]\n${content}`;
      }

      outbound.push({
        role: msg.role,
        content,
        imageUrl: sanitizedImageUrl,
      });
    }
  } else {
    // Long conversation: partition into older messages and recent active window
    const olderMessages = validHistory.slice(0, validHistory.length - maxRecent);
    const recentMessages = validHistory.slice(validHistory.length - maxRecent);

    // Generate compact rolling summary from older messages
    const topics: string[] = [];
    for (const oldMsg of olderMessages) {
      if (oldMsg.role === 'user') {
        const snippet = oldMsg.content.trim().replace(/\n+/g, ' ').substring(0, 60);
        if (snippet) {
          topics.push(`«${snippet}${oldMsg.content.length > 60 ? '...' : ''}»`);
        }
      }
    }

    const summaryText = topics.length > 0
      ? `[خلاصه پیشینه گفتگوهای قبلی: کاربر و دستیار در مورد موضوعات ${topics.slice(-4).join(' و ')} تبادل نظر کرده‌اند.]`
      : `[پیشینه گفتگوهای اولیه به دلیل بهینه‌سازی توکن فشرده‌سازی شد.]`;

    // Inject rolling summary as lightweight context anchor
    outbound.push({
      role: 'user',
      content: summaryText,
    });
    outbound.push({
      role: 'assistant',
      content: 'پیشینه گفتگو را به خاطر دارم و آماده ادامه گفتگو با شما هستم.',
    });

    // Add recent turns in high fidelity with de-duplicated media
    for (const msg of recentMessages) {
      let content = msg.content || '';
      if (msg.imageUrl && !content.includes('[تصویر/رسانه')) {
        content = `[تصویر/رسانه ضمیمه شده قبلی: بررسی شد]\n${content}`;
      }

      outbound.push({
        role: msg.role,
        content,
        imageUrl: undefined, // Never re-send past base64 payloads
      });
    }
  }

  // Append current active turn with current media intact
  outbound.push({
    role: 'user',
    content: currentTurn.content,
    imageUrl: currentTurn.imageUrl,
    imageUrls: currentTurn.imageUrls,
  });

  return outbound;
}
