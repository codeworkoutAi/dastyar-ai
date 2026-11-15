// High-Quality Text-to-Speech (TTS) Engine with Persian & English Support
// Primary Engine: Neural Voice Stream via Server Audio Engine (Google Gemini 3.1 Flash TTS Preview)
// Playback Engine: Web Audio API (AudioContext) with HTMLAudioElement fallback
// Fallback Engine: Client Web Speech API with Multi-sentence Chunking & Voice Matching

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

function isPersianSpeechText(text: string): boolean {
  const persianCharMatch = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  return !!persianCharMatch && persianCharMatch.length > 0;
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
  // Stop Web Audio node
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
 * High-Reliability Audio TTS:
 * First attempts server-side neural audio streaming via Web Audio API (falls back to HTML5 Audio).
 * If network, quota, or server error occurs, seamlessly falls back to client Web Speech API.
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

  // Synchronously prime AudioContext during the user's click gesture (unlocks iOS/Chrome autoplay)
  const ctx = getOrCreateAudioContext();

  const cleanText = extractCleanAnswerForSpeech(rawContent);
  if (!cleanText) {
    onEnd();
    return { stop: () => {} };
  }

  const isPersian = isPersianSpeechText(cleanText);

  const controller: SpeakController = {
    stop: () => {
      isUserCancelled = true;
      stopCurrentPlayback();
      onEnd();
    },
  };

  // 2. Fetch server-side neural audio
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleanText,
      lang: isPersian ? 'fa' : 'en',
    }),
  })
    .then(async (res) => {
      if (isUserCancelled) return;
      if (!res.ok) {
        fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      if (isUserCancelled) return;

      // Primary Playback Engine: Web Audio API (AudioContext)
      if (ctx) {
        try {
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          if (isUserCancelled) return;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          activeSourceNode = source;

          source.onended = () => {
            activeSourceNode = null;
            if (!isUserCancelled) {
              onEnd();
            }
          };

          source.start(0);
          if (!isUserCancelled) {
            onStart();
          }
          return;
        } catch (webaudioErr) {
          console.warn('[TTS] Web Audio decoding failed, attempting HTMLAudioElement fallback:', webaudioErr);
        }
      }

      // Secondary Playback Engine: HTML5 Audio with Blob URL
      try {
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const blobUrl = URL.createObjectURL(blob);
        activeBlobUrl = blobUrl;

        const audio = new Audio(blobUrl);
        activeAudioElement = audio;

        audio.onplay = () => {
          if (!isUserCancelled) onStart();
        };

        audio.onended = () => {
          activeAudioElement = null;
          if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
            activeBlobUrl = null;
          }
          if (!isUserCancelled) onEnd();
        };

        audio.onerror = () => {
          if (!isUserCancelled) {
            fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
          }
        };

        await audio.play();
      } catch (playErr) {
        if (!isUserCancelled) {
          fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
        }
      }
    })
    .catch(() => {
      if (!isUserCancelled) {
        fallbackWebSpeech(cleanText, isPersian, onStart, onEnd, onError);
      }
    });

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
