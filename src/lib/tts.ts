// High-Quality Text-to-Speech (TTS) Engine with Persian & English Support
// Primary Engine: Neural Voice Stream via Server Audio Engine
// Fallback Engine: Client Web Speech API with Multi-sentence Chunking & Chrome GC Protection

function extractCleanAnswerForSpeech(rawContent: string): string {
  if (!rawContent || !rawContent.trim()) return '';

  let text = rawContent;

  // 1. Remove reasoning / thought blocks (<think>...</think> or [تفکر: ...])
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/\[تفکر:[\s\S]*?\]/gi, '');

  // 2. Remove code blocks completely
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 3. Remove inline code backticks while keeping inner text
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. Clean Markdown tables: remove table delimiter rows (|---|---|) and table pipe bars
  text = text.replace(/\|?\s*[-:]+[-| :]*\s*\|?/g, '');
  text = text.replace(/\|/g, '، ');

  // 5. Clean Markdown headers (#, ##, ###)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 6. Clean Markdown lists (*, -, +, 1., 2.) into natural pauses
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // 7. Clean Markdown bold, italic, strikethrough, blockquotes
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/~~(.*?)~~/g, '$1');
  text = text.replace(/^>\s*/gm, '');

  // 8. Clean Markdown links and images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/https?:\/\/\S+/g, '');

  // 9. Clean HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // 10. Clean emojis and decorative symbols
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ');
  text = text.replace(/[✨⭐🌟💫🔥🎉🚀💡📌🔹🔸✔️❌👉👈👇👆🤖💬❤️💙💚💛💜🖤]/g, ' ');

  // 11. Normalize spaces & newlines
  text = text.replace(/[-–—]{2,}/g, ' ');
  text = text.replace(/\.{3,}/g, '…');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n+/g, '\n');

  return text.trim();
}

function isPersianSpeechText(text: string): boolean {
  const persianCharMatch = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  return !!persianCharMatch && persianCharMatch.length > 0;
}

export interface SpeakController {
  stop: () => void;
}

// Global active audio & utterance tracking to prevent garbage collection and overlap
let currentActiveAudio: HTMLAudioElement | null = null;
let currentActiveBlobUrl: string | null = null;
let activeUtterances: SpeechSynthesisUtterance[] = [];
let isGlobalCancelled = false;

/**
 * High-Reliability Audio TTS:
 * First attempts server-side neural audio streaming (plays via HTML5 Audio).
 * If network, quota, or server error occurs, automatically and seamlessly falls back to client Web Speech API.
 */
export function speakText(
  rawContent: string,
  onStart: () => void,
  onEnd: () => void,
  onError: (err?: unknown) => void
): SpeakController {
  // 1. Clean previous playback
  stopAllPlayback();
  isGlobalCancelled = false;

  const cleanText = extractCleanAnswerForSpeech(rawContent);
  if (!cleanText) {
    onEnd();
    return { stop: () => {} };
  }

  const isPersian = isPersianSpeechText(cleanText);

  const controller: SpeakController = {
    stop: () => {
      isGlobalCancelled = true;
      stopAllPlayback();
      onEnd();
    },
  };

  // Attempt Primary Engine: Server-side Neural Audio API
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleanText,
      lang: isPersian ? 'fa' : 'en',
    }),
  })
    .then(async (res) => {
      if (isGlobalCancelled) return;
      if (!res.ok) {
        // Status 429 or 500: gracefully delegate to browser fallback without error alert
        fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
        return;
      }
      const blob = await res.blob();
      if (isGlobalCancelled) return;

      const blobUrl = URL.createObjectURL(blob);
      currentActiveBlobUrl = blobUrl;

      const audio = new Audio(blobUrl);
      currentActiveAudio = audio;

      audio.onplay = () => {
        if (!isGlobalCancelled) onStart();
      };

      audio.onended = () => {
        stopAllPlayback();
        if (!isGlobalCancelled) onEnd();
      };

      audio.onerror = () => {
        if (!isGlobalCancelled) {
          fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
        }
      };

      try {
        await audio.play();
      } catch {
        if (!isGlobalCancelled) {
          fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
        }
      }
    })
    .catch(() => {
      if (!isGlobalCancelled) {
        fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
      }
    });

  return controller;
}

function stopAllPlayback() {
  isGlobalCancelled = true;

  // Cleanup audio element
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
      currentActiveAudio.src = '';
      // Remove event listeners to prevent memory leaks
      currentActiveAudio.onplay = null;
      currentActiveAudio.onended = null;
      currentActiveAudio.onerror = null;
    } catch (e) {
      console.warn('[TTS] Audio cleanup error:', e);
    }
    currentActiveAudio = null;
  }

  // Revoke blob URL to free memory
  if (currentActiveBlobUrl) {
    try {
      URL.revokeObjectURL(currentActiveBlobUrl);
    } catch (e) {
      console.warn('[TTS] Blob URL cleanup error:', e);
    }
    currentActiveBlobUrl = null;
  }

  // Cancel Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[TTS] Speech synthesis cleanup error:', e);
    }
  }

  // Clear utterances array to prevent memory leaks
  activeUtterances = [];
}

/**
 * Fallback Web Speech API engine with sentence chunking & Chrome GC prevention
 */
function fallbackWebSpeech(
  cleanText: string,
  isPersian: boolean,
  onStart: () => void,
  onEnd: () => void,
  onError: (err?: unknown) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError(new Error('مرورگر شما از پخش صوتی پشتیبانی نمی‌کند.'));
    return;
  }

  window.speechSynthesis.cancel();

  // Split text into natural sentence chunks to prevent browser speech buffer freezing
  const sentences = cleanText
    .split(/([.\n!?؛،]+)/)
    .filter(Boolean);

  const chunks: string[] = [];
  let cur = '';
  for (const part of sentences) {
    if ((cur + part).length <= 150) {
      cur += part;
    } else {
      if (cur.trim()) chunks.push(cur.trim());
      cur = part;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  const speechChunks = chunks.length > 0 ? chunks : [cleanText.substring(0, 300)];

  // Pick optimal voice
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice: SpeechSynthesisVoice | null = null;

  if (isPersian) {
    selectedVoice =
      voices.find((v) => v.lang.toLowerCase().includes('fa') || v.lang.toLowerCase().includes('prs')) ||
      voices.find((v) => v.name.toLowerCase().includes('persian') || v.name.toLowerCase().includes('farsi') || v.name.includes('فارسی')) ||
      null;
  } else {
    selectedVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
  }

  let chunkIdx = 0;
  activeUtterances = [];

  const playChunk = () => {
    if (isGlobalCancelled || chunkIdx >= speechChunks.length) {
      if (!isGlobalCancelled) onEnd();
      return;
    }

    const chunk = speechChunks[chunkIdx];
    chunkIdx++;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = isPersian ? 'fa-IR' : 'en-US';
    utterance.rate = isPersian ? 0.95 : 1.0;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    activeUtterances.push(utterance);

    utterance.onstart = () => {
      if (chunkIdx === 1) onStart();
    };

    utterance.onend = () => {
      if (!isGlobalCancelled) {
        playChunk();
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || isGlobalCancelled) {
        return;
      }
      if (chunkIdx < speechChunks.length) {
        playChunk();
      } else {
        onEnd();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd();
    }
  };

  playChunk();
}
