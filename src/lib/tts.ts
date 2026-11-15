// High-Quality Text-to-Speech (TTS) Engine with Persian & English Support
// Primary Engine: Neural Voice Stream via Server Audio Engine (Google Gemini 3.8 Flash Lite TTS & 3.1 Flash TTS Preview)
// Architecture: Chunked & Continuous Streaming with Background Prefetching (Gapless Web Audio API)
// Fallback Engine: Client Web Speech API with Multi-sentence Chunking & Voice Matching

export function extractCleanAnswerForSpeech(rawContent: string): string {
  if (!rawContent || !rawContent.trim()) return '';

  let text = rawContent;

  // 1. Remove reasoning / thought blocks (<think>...</think> or [تفکر: ...]) and suggestions
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/\[تفکر:[\s\S]*?\]/gi, '');
  text = text.replace(/<suggestions>[\s\S]*?(<\/suggestions>|$)/gi, '');

  // 2. Remove code blocks completely
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 3. Remove inline code backticks while keeping inner text
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. Clean Markdown tables: remove table delimiter rows (|---|---|) and table pipe bars
  text = text.replace(/\|?\s*[-:]{3,}[-| :]*\s*\|?/g, '');
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

export function isPersianSpeechText(text: string): boolean {
  const persianCharMatch = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  return !!persianCharMatch && persianCharMatch.length > 0;
}

/**
 * Splits text into natural sentence-boundary chunks of optimal size (600-800 characters)
 * for gapless prefetching and instantaneous playback.
 */
export function splitTextIntoSpeechChunks(text: string, maxChunkLen = 750): string[] {
  if (!text || text.length <= maxChunkLen) {
    return text ? [text] : [];
  }

  // Split text by sentence punctuation (. ! ؟ ? \n)
  const parts = text.split(/([.!?؟\n]+)/).filter(Boolean);

  const chunks: string[] = [];
  let cur = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if ((cur + part).length <= maxChunkLen) {
      cur += part;
    } else {
      if (cur.trim()) chunks.push(cur.trim());
      // If a single part without punctuation exceeds maxChunkLen, split by commas/semicolons
      if (part.length > maxChunkLen) {
        const subParts = part.split(/([،,؛;]+)/).filter(Boolean);
        cur = '';
        for (const sub of subParts) {
          if ((cur + sub).length <= maxChunkLen) {
            cur += sub;
          } else {
            if (cur.trim()) chunks.push(cur.trim());
            cur = sub;
          }
        }
      } else {
        cur = part;
      }
    }
  }

  if (cur.trim()) {
    chunks.push(cur.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxChunkLen)];
}

export interface SpeakController {
  stop: () => void;
}

// Global active audio tracking to prevent overlapping playback and memory leaks
let activeAudioContext: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeAudioElement: HTMLAudioElement | null = null;
let activeBlobUrl: string | null = null;
let activeUtterances: SpeechSynthesisUtterance[] = [];
let activeAbortController: AbortController | null = null;
let isUserCancelled = false;

function getOrCreateAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!activeAudioContext || activeAudioContext.state === 'closed') {
      activeAudioContext = new AudioCtx();
    }
    if (activeAudioContext.state === 'suspended') {
      activeAudioContext.resume().catch(() => {});
    }
    return activeAudioContext;
  } catch {
    return null;
  }
}

function stopCurrentPlayback() {
  // Abort any in-flight chunk downloads
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  // Stop active Web Audio node
  if (activeSourceNode) {
    try {
      activeSourceNode.onended = null;
      activeSourceNode.stop(0);
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }

  // Stop HTMLAudioElement
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
      activeAudioElement.onplay = null;
      activeAudioElement.onended = null;
      activeAudioElement.onerror = null;
    } catch {}
    activeAudioElement = null;
  }

  // Revoke Blob URL
  if (activeBlobUrl) {
    try {
      URL.revokeObjectURL(activeBlobUrl);
    } catch {}
    activeBlobUrl = null;
  }

  // Cancel Web Speech
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  activeUtterances = [];
}

/**
 * Scenario 2 Engine: Chunked & Continuous Streaming Text-to-Speech
 * - Splits any length text into natural sentence chunks (600-750 chars).
 * - Plays Chunk 0 within ~1 second.
 * - Concurrently prefetches Chunk N+1 in the background while Chunk N is actively playing.
 * - Provides seamless, gapless continuous audio playback for texts of any length.
 */
export function speakText(
  rawContent: string,
  onStart: () => void,
  onEnd: () => void,
  onError: (err?: unknown) => void
): SpeakController {
  // 1. Reset state and stop existing playback
  isUserCancelled = false;
  stopCurrentPlayback();

  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  // Synchronously prime AudioContext during the user's click gesture (unlocks iOS/Chrome autoplay)
  const ctx = getOrCreateAudioContext();

  const cleanText = extractCleanAnswerForSpeech(rawContent);
  if (!cleanText) {
    onEnd();
    return { stop: () => {} };
  }

  const isPersian = isPersianSpeechText(cleanText);
  const chunks = splitTextIntoSpeechChunks(cleanText, 700);

  if (chunks.length === 0) {
    onEnd();
    return { stop: () => {} };
  }

  const controller: SpeakController = {
    stop: () => {
      isUserCancelled = true;
      stopCurrentPlayback();
      onEnd();
    },
  };

  // Helper to fetch and decode a single chunk into an AudioBuffer
  async function fetchAndDecodeChunk(chunkText: string): Promise<AudioBuffer | null> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chunkText,
        lang: isPersian ? 'fa' : 'en',
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`TTS_SERVER_${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (signal.aborted || isUserCancelled) return null;

    if (ctx) {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      return await ctx.decodeAudioData(arrayBuffer);
    }
    return null;
  }

  // Pre-fetch cache: Map of chunk index -> Promise<AudioBuffer | null>
  const prefetchPromises = new Map<number, Promise<AudioBuffer | null>>();

  function prefetchChunk(index: number) {
    if (index >= chunks.length || prefetchPromises.has(index)) return;
    prefetchPromises.set(
      index,
      fetchAndDecodeChunk(chunks[index]).catch((err) => {
        if (!signal.aborted && !isUserCancelled) {
          console.warn(`[TTS] Prefetch chunk ${index} failed:`, err?.message || err);
        }
        return null;
      })
    );
  }

  let currentPlayingIndex = 0;
  let hasCalledStart = false;

  async function playNextChunk() {
    if (isUserCancelled || signal.aborted) {
      return;
    }

    if (currentPlayingIndex >= chunks.length) {
      // All chunks finished!
      if (!isUserCancelled) {
        onEnd();
      }
      return;
    }

    const chunkIdx = currentPlayingIndex;
    currentPlayingIndex++;

    // Ensure this chunk is fetching/fetched
    prefetchChunk(chunkIdx);

    // Immediately trigger prefetch for NEXT chunk so it downloads while current chunk is playing!
    prefetchChunk(chunkIdx + 1);

    try {
      const audioBuffer = await prefetchPromises.get(chunkIdx)!;
      if (isUserCancelled || signal.aborted) return;

      if (!audioBuffer || !ctx) {
        // If server failed on first chunk, try fallback Web Speech
        if (chunkIdx === 0) {
          fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
          return;
        }
        // If a subsequent chunk failed, finish cleanly
        onEnd();
        return;
      }

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      activeSourceNode = source;

      source.onended = () => {
        activeSourceNode = null;
        if (!isUserCancelled && !signal.aborted) {
          playNextChunk();
        }
      };

      source.start(0);

      if (!hasCalledStart && !isUserCancelled) {
        hasCalledStart = true;
        onStart();
      }
    } catch (playErr) {
      if (isUserCancelled || signal.aborted) return;
      if (chunkIdx === 0) {
        fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
      } else {
        onEnd();
      }
    }
  }

  // Kick off chunk 0 immediately
  playNextChunk();

  return controller;
}

/**
 * Fallback Web Speech API engine with sentence chunking & voice matching
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

  const voices = window.speechSynthesis.getVoices();
  let selectedVoice: SpeechSynthesisVoice | null = null;

  if (isPersian) {
    selectedVoice =
      voices.find((v) => v.lang.toLowerCase().includes('fa') || v.lang.toLowerCase().includes('prs')) ||
      voices.find((v) => v.name.toLowerCase().includes('persian') || v.name.toLowerCase().includes('farsi') || v.name.includes('فارسی')) ||
      null;

    // If text is Persian and device has NO Persian voice installed, do not play muffled English voice
    if (!selectedVoice && voices.length > 0) {
      onError(new Error('سیستم شما فاقد صدای فارسی برای خواندن صوتی است.'));
      return;
    }
  } else {
    selectedVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
  }

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

  let chunkIdx = 0;
  activeUtterances = [];

  const playChunk = () => {
    if (isUserCancelled || chunkIdx >= speechChunks.length) {
      if (!isUserCancelled) onEnd();
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
      if (!isUserCancelled) {
        playChunk();
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || isUserCancelled) {
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
