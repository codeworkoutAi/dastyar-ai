import { estimateTokenCount, calculateEstimatedCostUSD, formatCostUSD } from '../utils/pricing';
import { formatPersianErrorMessage } from '../lib/persianUtils';

import { create } from 'zustand';
import { Conversation, ChatMessage } from '../types';
import { loadConversations, saveConversations, loadActiveConversationId, saveActiveConversationId, createNewConversation, setCurrentUserScope, getCurrentUserScope } from '../lib/storage';
import { useSettingsStore } from './settingsStore';
import { useAuthStore, onAuthChange } from './authStore';
import { buildOptimizedContext } from '../lib/tokenOptimizer';

let abortController: AbortController | null = null;


interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  activeError: { message: string; timestamp: number; insufficientBalance?: boolean } | null;
  isStreaming: boolean;
  routingState: 'idle' | 'general' | 'vision' | 'coding';
  
  switchUserContext: (userId: number | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setActiveId: (id: string | null) => void;
  setActiveError: (error: { message: string; timestamp: number; insufficientBalance?: boolean } | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setRoutingState: (state: 'idle' | 'general' | 'vision' | 'coding') => void;
  
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updater: (conv: Conversation) => Conversation) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  createChat: (modelName?: string) => void;
  createCodingChat: (modelName?: string) => void;

  stopGeneration: () => void;
  sendMessage: (text: string, imageUrl?: string, webSearch?: boolean, fileContext?: string, imageEngine?: string) => Promise<void>;
  regenerate: () => void;
  editMessage: (messageId: string, newText: string) => void;
  insertImageToChat: (prompt: string, imageUrl: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: loadConversations(),
  activeId: loadActiveConversationId(),
  activeError: null,
  isStreaming: false,
  routingState: 'idle',

  switchUserContext: (userId) => {
    const prevScope = getCurrentUserScope();
    const guestConvs = prevScope === 'guest' && userId != null
      ? get().conversations.filter((c) => c.messages.length > 0)
      : [];
    const guestActiveId = prevScope === 'guest' && userId != null ? get().activeId : null;

    setCurrentUserScope(userId);
    const savedConvs = loadConversations();
    const existingIds = new Set(savedConvs.map((c) => c.id));
    const mergedConvs = guestConvs.length > 0
      ? [...guestConvs.filter((c) => !existingIds.has(c.id)), ...savedConvs]
      : savedConvs;

    if (guestConvs.length > 0) {
      saveConversations(mergedConvs);
    }

    const active = guestActiveId || loadActiveConversationId();
    const validActive = active && mergedConvs.some(c => c.id === active) ? active : (mergedConvs.length > 0 ? mergedConvs[0].id : null);
    if (guestActiveId && validActive) {
      saveActiveConversationId(validActive);
    }

    set({
      conversations: mergedConvs,
      activeId: validActive,
      activeError: null,
      isStreaming: false,
      routingState: 'idle'
    });
  },

  setConversations: (conversations) => {
    saveConversations(conversations);
    set({ conversations });
  },

  setActiveId: (id) => {
    saveActiveConversationId(id);
    set({ activeId: id, activeError: null });
  },

  setActiveError: (error) => set({ activeError: error }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setRoutingState: (routingState) => set({ routingState }),

  addConversation: (conv) => {
    const newConvs = [conv, ...get().conversations];
    saveConversations(newConvs);
    set({ conversations: newConvs });
  },

  updateConversation: (id, updater) => {
    const newConvs = get().conversations.map(c => c.id === id ? updater(c) : c);
    saveConversations(newConvs);
    set({ conversations: newConvs });
  },

  deleteConversation: (id) => {
    if (get().activeId === id && abortController) {
      abortController.abort();
      abortController = null;
      set({ isStreaming: false, routingState: 'idle' });
    }
    const newConvs = get().conversations.filter(c => c.id !== id);
    saveConversations(newConvs);
    set({ conversations: newConvs });
    if (get().activeId === id) {
      saveActiveConversationId(null);
      set({ activeId: null });
    }
  },
  
  clearAllConversations: () => {
    saveConversations([]);
    set({ conversations: [], activeId: null, activeError: null });
  },

  createChat: (modelName) => {
    const newConv = createNewConversation(modelName);
    const newConvs = [newConv, ...get().conversations];
    saveConversations(newConvs);
    saveActiveConversationId(newConv.id);
    set({ conversations: newConvs, activeId: newConv.id, activeError: null });
  },

  createCodingChat: (modelName) => {
    const newConv = createNewConversation(modelName);
    newConv.title = 'دستیار برنامه‌نویسی';
    const welcomeMsg: ChatMessage = {
      id: 'msg_code_' + crypto.randomUUID(),
      role: 'assistant' as any,
      content: '👨‍💻 سلام! من **دستیار تخصصی برنامه‌نویسی** شما هستم.\n\nمی‌توانید در زمینه‌های کدنویسی، دیباگ (ری‌اکت، پایتون، جاوااسکریپت، Go، C++، SQL و...) روی من حساب کنید.\n\nچه کدی رو می‌خوایم با هم بنویسیم؟',
      timestamp: Date.now(),
    };
    newConv.messages = [welcomeMsg];
    const newConvs = [newConv, ...get().conversations];
    saveConversations(newConvs);
    saveActiveConversationId(newConv.id);
    set({ conversations: newConvs, activeId: newConv.id, activeError: null });
  },

stopGeneration: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    set({ isStreaming: false, routingState: 'idle' });

    // Turn off get().isStreaming on active message
    if (get().activeId) {
      set({ conversations: get().conversations.map((conv) => {
          if (conv.id !== get().activeId) return conv;
          const updatedMessages = conv.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...conv, messages: updatedMessages };
        }) });
    }
  },

  // Send Message & Stream Response
  sendMessage: async (text: string, imageUrl?: string, webSearch?: boolean, fileContext?: string, imageEngine?: string) => {
    if ((!text.trim() && !imageUrl) || get().isStreaming) return;
    set({ activeError: null });

    let targetConv = (get().conversations.find((c) => c.id === get().activeId));
    if (!targetConv) {
      targetConv = createNewConversation((useSettingsStore.getState().settings.providers[useSettingsStore.getState().settings.providers.activeProvider]?.modelName));
      set({ conversations: [targetConv] });
    saveConversations([targetConv]);
      get().setActiveId(targetConv.id);
    }

    const userMessageId = 'msg_user_' + crypto.randomUUID();
    const assistantMessageId = 'msg_ai_' + crypto.randomUUID();

    const isImageGen = text.trim().startsWith('/image ');
    const promptText = isImageGen ? text.trim().replace('/image ', '') : text;

    let payloadSettings = JSON.parse(JSON.stringify(useSettingsStore.getState().settings));
    
    // Unpack active custom profile so backend (intent & chat) gets the correct baseUrl and modelName
    if (payloadSettings.providers.activeProvider === 'custom' && payloadSettings.providers.custom?.profiles) {
      const activeProfile = payloadSettings.providers.custom.profiles.find(
        (p: any) => p.id === payloadSettings.providers.custom.activeProfileId
      );
      if (activeProfile) {
        payloadSettings.providers.custom.baseUrl = activeProfile.baseUrl;
        payloadSettings.providers.custom.apiKey = activeProfile.apiKey;
        payloadSettings.providers.custom.modelName = activeProfile.modelName;
        payloadSettings.providers.custom.customHeaders = activeProfile.customHeaders;
      }
    }

    // Enforce minimal emoji usage via system prompt injection
    const antiEmojiRule = "\n\nCRITICAL RULE: DO NOT use emojis in your response under any circumstances, unless absolutely necessary for formatting a list. Maintain a highly professional and clean text structure.";
    if (payloadSettings.persona) {
      payloadSettings.persona.systemPrompt = (payloadSettings.persona.systemPrompt || '') + antiEmojiRule;
    }

    let finalModelUsed = (payloadSettings.providers as any)[payloadSettings.providers.activeProvider]?.modelName || 'gemini-2.5-pro';

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user' as any,
      content: promptText,
      fileContext: fileContext,
      imageUrl: imageUrl,
      timestamp: Date.now(),
    };

      const globalWebSearchOn = useSettingsStore.getState().settings.tools.webSearch;
      const initialHasWebIntent = !isImageGen && globalWebSearchOn && (webSearch === true || (webSearch === undefined && /اخبار|خبر|قیمت|آب و هوا|آب‌وهوا|مقاله|تحقیق|درباره|سرچ|جستجو|امروز|تاریخ|جدیدترین|آپدیت|به روز|به‌روز|دسترسی به وب|دسترسی به اینترنت|وصل به اینترنت|اینترنت داری|به اینترنت وصلی|آنلاین هستی|وب رو چک کن|دسترسی داری/i.test(promptText)));

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant' as any,
        content: isImageGen ? 'در حال ساخت تصویر با هوش مصنوعی...' : '',
        timestamp: Date.now(),
        modelUsed: isImageGen ? (imageEngine ? `image-generation: ${imageEngine}` : 'image-generation') : finalModelUsed,
        isStreaming: true,
        isImageGen,
        isWebSearch: initialHasWebIntent,
      };

    // Auto-update conversation title if it's the first message
    const isFirstMessage = targetConv.messages.length === 0 || targetConv.title === 'گفتگوی جدید';
    const newTitle = isFirstMessage ? (promptText.trim() || 'گفتگوی بدون عنوان').substring(0, 35) : targetConv.title;

    // Update conversation with user message and empty streaming assistant message
    const updatedMessages = [...targetConv.messages, userMessage, assistantMessage];

    set({ conversations: get().conversations.map((c) =>
        c.id === targetConv!.id
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
              modelUsed: (useSettingsStore.getState().settings.providers[useSettingsStore.getState().settings.providers.activeProvider]?.modelName),
            }
          : c
      ) });

    set({ isStreaming: true });
    const controller = new AbortController();
    abortController = controller;
    const requestStartTime = performance.now();
    let firstTokenTime: number | null = null;

    try {
      if (isImageGen) {
        const authToken = useAuthStore.getState().token;
        const imgHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) {
          imgHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: imgHeaders,
          body: JSON.stringify({ 
            prompt: promptText, 
            settings: payloadSettings,
            engine: imageEngine || 'imagen-3',
            apiKey: imageEngine === 'dalle-3' ? payloadSettings.providers.openai?.apiKey : imageEngine === 'imagen-3' ? payloadSettings.providers.gemini?.apiKey : undefined 
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        if (data.balanceAfter !== undefined) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setUser({ ...currentUser, walletBalance: data.balanceAfter });
          }
        }

        const totalTimeMs = Math.round(performance.now() - requestStartTime);

        set({ conversations: get().conversations.map((c) => {
            if (c.id !== targetConv!.id) return c;
            const updatedMessages = c.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: `🎨 تصویر ساخته شده بر اساس دستور: "${promptText}"`,
                  imageUrl: data.imageUrl,
                  isStreaming: false,
                  metrics: {
                    totalTimeMs,
                    ttftMs: totalTimeMs,
                  },
                };
              }
              return m;
            });
            return { ...c, messages: updatedMessages };
          }) });
        set({ isStreaming: false, routingState: 'idle' });
        return;
      }

      // 1. High-Speed Regex-Only Intent & Tool Detection (Unblocked Streaming)
      const globalWebSearchEnabled = useSettingsStore.getState().settings.tools.webSearch;
      const smartRoutingEnabled = useSettingsStore.getState().settings.tools.smartRouting;
      
      let detectedIntent = 'general';
      let detectedWebSearch = false;
      let detectedTool = 'none';

      // Tool Detection Heuristics (matches server/routes/intent.ts)
      if (/دلار|ارز|سکه|طلا|یورو|تتر|درهم|پوند/i.test(promptText) && /قیمت|نرخ|چند|چنده/i.test(promptText)) {
        detectedTool = 'currency';
      } else if (/دیجی‌کالا|دیجی کالا|digikala\.com|dkp-/i.test(promptText)) {
        detectedTool = 'digikala';
      } else if (/آب و هوا|آب‌وهوا|دما|هوا/i.test(promptText)) {
        detectedTool = 'weather';
      }

      // Smart Routing Intent Heuristics (coding / vision / general)
      if (isImageGen || !!imageUrl || (fileContext && fileContext.includes('تصویر'))) {
        detectedIntent = 'vision';
      } else if (/کد|برنامه|پایتون|جاوااسکریپت|فانکشن|کلاس|دیباگ|ارور|error|bug|react|node|css|html|sql|query|typescript|python|javascript|golang|rust|php|c\+\+|algorithm|الگوریتم/i.test(promptText)) {
        detectedIntent = 'coding';
      } else {
        detectedIntent = 'general';
      }

      // Comprehensive Persian Web Search Triggers (Client-side Heuristics)
      const clientWebTriggers = /اخبار|خبر|قیمت|آب و هوا|آب‌وهوا|مقاله|تحقیق|درباره|سرچ|جستجو|امروز|تاریخ|جدیدترین|آپدیت|به روز|به‌روز|دسترسی به وب|دسترسی به اینترنت|وصل به اینترنت|اینترنت داری|به اینترنت وصلی|آنلاین هستی|وب رو چک کن|دسترسی داری/i;
      const hasWebIntent = clientWebTriggers.test(promptText);

      if (webSearch !== undefined) {
        detectedWebSearch = webSearch;
      } else if (globalWebSearchEnabled && (hasWebIntent || detectedTool !== 'none')) {
        detectedWebSearch = true;
      } else {
        detectedWebSearch = false;
      }

      // KILL-SWITCH (Rule 7): Never allow web search if globally disabled
      if (!globalWebSearchEnabled) {
        detectedWebSearch = false;
      }

      console.log(`[Intent] regex-only: webSearch=${detectedWebSearch}, tool=${detectedTool}, intent=${detectedIntent}`);

      // Apply web search & tool setting
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.activeTool = detectedTool;

      if (webSearch !== undefined) {
        payloadSettings.tools.webSearch = webSearch;
      } else if (globalWebSearchEnabled && (detectedWebSearch || hasWebIntent)) {
        payloadSettings.tools.webSearch = true;
      } else {
        payloadSettings.tools.webSearch = false;
      }

      // KILL-SWITCH: Never allow web search if globally disabled
      if (!globalWebSearchEnabled) {
        payloadSettings.tools.webSearch = false;
      }

      // Sync isWebSearch flag on assistant message for UI web search status indicator
      const isSearchActive = !isImageGen && !!payloadSettings.tools.webSearch;
      set({
        conversations: get().conversations.map((c) =>
          c.id === targetConv!.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, isWebSearch: isSearchActive } : m
                ),
              }
            : c
        ),
      });

      // Apply Smart Routing
      if (smartRoutingEnabled) {
        get().setRoutingState(detectedIntent as any);

        const activeProv = useSettingsStore.getState().settings.providers.activeProvider || 'gemini';
        const roles = useSettingsStore.getState().settings.tools.routingRoles || {} as any;

        const rVisionProv = roles.visionProvider || activeProv;
        const rCodingProv = roles.codingProvider || activeProv;
        const rDefaultProv = roles.defaultProvider || activeProv;

        const defaultModelName = (useSettingsStore.getState().settings.providers as any)[activeProv]?.modelName || 'gemini-2.5-pro';
        const defaultVisionModel = activeProv === 'gemini' ? 'gemini-2.5-pro' : (roles.vision || defaultModelName);
        const defaultCodingModel = activeProv === 'gemini' ? 'gemini-2.5-pro' : (roles.coding || defaultModelName);

        const rVision = roles.vision || defaultVisionModel;
        const rCoding = roles.coding || defaultCodingModel;
        const rDefault = roles.default || defaultModelName;

        const applyProviderAndModel = (prov: string, modelOrProfileId: string) => {
          payloadSettings.providers.activeProvider = prov;
          if (prov === 'custom' && payloadSettings.providers.custom.profiles) {
            const profile = payloadSettings.providers.custom.profiles.find((p: any) => p.id === modelOrProfileId);
            if (profile) {
              payloadSettings.providers.custom.baseUrl = profile.baseUrl;
              payloadSettings.providers.custom.apiKey = profile.apiKey;
              payloadSettings.providers.custom.modelName = profile.modelName;
              payloadSettings.providers.custom.customHeaders = profile.customHeaders;
              payloadSettings.providers.custom.activeProfileId = profile.id;
              return profile.modelName || 'نامشخص';
            }
          }
          if ((payloadSettings.providers as any)[prov]) {
            (payloadSettings.providers as any)[prov].modelName = modelOrProfileId;
          }
          return modelOrProfileId;
        };

        if (detectedIntent === 'vision') {
            finalModelUsed = applyProviderAndModel(rVisionProv, rVision) + ' (هوشمند)';
        } else if (detectedIntent === 'coding') {
            finalModelUsed = applyProviderAndModel(rCodingProv, rCoding) + ' (هوشمند)';
        } else {
            finalModelUsed = applyProviderAndModel(rDefaultProv, rDefault) + ' (هوشمند)';
        }
      } else {
        get().setRoutingState('general');
      }

      // Update Assistant message model Used if smart routing changed it
      set({ conversations: get().conversations.map((c) => {
          if (c.id !== targetConv!.id) return c;
          const msgs = c.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, modelUsed: isImageGen ? (imageEngine ? `image-generation: ${imageEngine}` : 'image-generation') : finalModelUsed }
              : m
          );
          return { ...c, messages: msgs, modelUsed: (payloadSettings.providers as any)[payloadSettings.providers.activeProvider]?.modelName };
        }) });

      // Build optimized sliding context window:
      // - Retains active recent turns (last 6 messages)
      // - Compacts older messages outside window into a lightweight summary
      // - De-duplicates past base64 media payloads into lightweight text placeholders
      // - Keeps active user input and attached media intact in current turn
      const contextMessages = buildOptimizedContext(
        targetConv.messages,
        { content: text, imageUrl: imageUrl, fileContext: fileContext },
        { maxRecentTurns: 6 }
      );

      // Debug: Log webSearch value before sending to backend
      console.log('[Frontend] Sending to backend - webSearch:', payloadSettings.tools?.webSearch);

      const authToken = useAuthStore.getState().token;
      const streamHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        streamHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: streamHeaders,
        body: JSON.stringify({
          messages: contextMessages,
          settings: payloadSettings,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let serverErrorMsg = `خطای سرور (${response.status})`;
        try {
          const rawText = await response.text();
          try {
            const parsed = JSON.parse(rawText);
            if (parsed?.error) {
              serverErrorMsg = parsed.error;
            } else if (rawText) {
              serverErrorMsg += `: ${rawText}`;
            }
          } catch {
            if (rawText) serverErrorMsg += `: ${rawText}`;
          }
        } catch { }
        throw new Error(serverErrorMsg);
      }

      if (!response.body) {
        throw new Error('ارتباط با سرور قطع شد.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedContent = '';
      let streamHadError = false;

      // Coalesce token-driven React updates into at most one per animation frame.
      // Without this, a fast provider fires dozens of setState calls per frame and
      // starves the render loop, which is what made tokens look batched/buffered.
      let streamRafId: number | null = null;
      const flushStreamingContent = () => {
        if (streamRafId !== null) {
          cancelAnimationFrame(streamRafId);
          streamRafId = null;
        }
        set({ conversations: get().conversations.map((c) => {
          if (c.id !== targetConv!.id) return c;
          const msgs = c.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m
          );
          return { ...c, messages: msgs };
        }) });
      };
      const scheduleStreamingUpdate = () => {
        if (streamRafId !== null) return;
        streamRafId = requestAnimationFrame(() => {
          streamRafId = null;
          flushStreamingContent();
        });
      };
      let serverUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number; costToman?: number; balanceAfter?: number } | undefined = undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data: ')) continue;

            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.error) {
                streamHadError = true;
                const persianError = formatPersianErrorMessage(data.error);
                get().setActiveError({
                  message: persianError,
                  timestamp: Date.now(),
                  insufficientBalance: Boolean(data.insufficientBalance || data.error.includes('کیف پول') || data.error.includes('اعتبار'))
                });
                set({ conversations: get().conversations.map((c) => {
                    if (c.id !== targetConv!.id) return c;
                    // Remove empty assistant message so chat area stays 100% clean and pristine
                    const msgs = c.messages.filter((m) => m.id !== assistantMessageId);
                    return { ...c, messages: msgs };
                  }) });
              }

              if (data.chunk) {
                if (firstTokenTime === null) {
                  firstTokenTime = performance.now();
                }
                accumulatedContent += data.chunk;

                // Update UI at most once per frame (still live, but never floods React).
                scheduleStreamingUpdate();
              }

              if (data.usage) {
                serverUsage = data.usage;
                if (typeof data.usage.balanceAfter === 'number') {
                  useAuthStore.getState().setWalletBalance(data.usage.balanceAfter);
                }
              }

              if (data.imageUrl) {
                set({ conversations: get().conversations.map((c) => {
                    if (c.id !== targetConv!.id) return c;
                    const msgs = c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, imageUrl: data.imageUrl }
                        : m
                    );
                    return { ...c, messages: msgs };
                  }) });
              }

              if (data.done) {
                if (data.usage) {
                  serverUsage = data.usage;
                  if (typeof data.usage.balanceAfter === 'number') {
                    useAuthStore.getState().setWalletBalance(data.usage.balanceAfter);
                  }
                }
                break;
              }
            } catch (e) {
              // Ignore incomplete JSON chunks
            }
          }
        }
      } catch (readErr: any) {
        if (readErr.name === 'AbortError') {
          throw readErr; // Pass AbortError to outer catch for proper cleanup
        }
        console.warn('Stream read interrupted:', readErr);
        if (!accumulatedContent && !streamHadError) {
          throw readErr;
        }
      } finally {
        // Drop any pending frame; the final full content is written further below.
        if (streamRafId !== null) {
          cancelAnimationFrame(streamRafId);
          streamRafId = null;
        }

        // Always cancel reader to prevent memory leaks
        try {
          reader.cancel();
        } catch (e) {
          // Reader may already be cancelled
        }

        // Process any residual buffer if connection ended without trailing newline
        if (buffer.trim()) {
          const remainingLines = buffer.split('\n');
          for (const line of remainingLines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              if (jsonStr !== '[DONE]') {
                try {
                  const data = JSON.parse(jsonStr);
                  if (data.chunk) {
                    accumulatedContent += data.chunk;
                  }
                  if (data.usage) {
                    serverUsage = data.usage;
                  }
                } catch {}
              }
            }
          }
        }
      }

      // Calculate final benchmark metrics
      const requestEndTime = performance.now();
      const totalTimeMs = Math.max(1, Math.round(requestEndTime - requestStartTime));
      const ttftMs = firstTokenTime ? Math.max(1, Math.round(firstTokenTime - requestStartTime)) : totalTimeMs;
      
      // Calculate token metrics:
      // Prefer exact official upstream token counts if provided; otherwise fallback to Persian-compatible token heuristic.
      const charCount = accumulatedContent.length;
      const approxTokens = estimateTokenCount(accumulatedContent);
      const exactTotalTokens = serverUsage?.totalTokens;
      const promptTokens = serverUsage?.promptTokens ?? estimateTokenCount(text);
      const completionTokens = serverUsage?.completionTokens ?? approxTokens;
      const effectiveOutputTokens = completionTokens;
      const totalTokens = exactTotalTokens ?? (promptTokens + completionTokens);

      const tokensPerSec = totalTimeMs > 0 ? Math.round((effectiveOutputTokens / (totalTimeMs / 1000)) * 10) / 10 : 0;

      // Calculate USD cost based on model and token counts
      const rawCostUSD = calculateEstimatedCostUSD((useSettingsStore.getState().settings.providers[useSettingsStore.getState().settings.providers.activeProvider]?.modelName), promptTokens, completionTokens);
      const estimatedCostUSD = formatCostUSD(rawCostUSD);

      const finalMetrics = {
        ttftMs,
        totalTimeMs,
        tokensPerSec,
        charCount,
        exactTotalTokens: totalTokens,
        promptTokens,
        completionTokens,
        approxTokens,
        estimatedCostUSD,
        costToman: serverUsage?.costToman,
        balanceAfter: serverUsage?.balanceAfter,
      };

      if (typeof serverUsage?.balanceAfter === 'number') {
        useAuthStore.getState().setWalletBalance(serverUsage.balanceAfter);
      }

      // Mark streaming as completed with the FULL accumulated content and metrics (only if no stream error occurred)
      if (!streamHadError) {
        set({ conversations: get().conversations.map((c) => {
            if (c.id !== targetConv!.id) return c;
            const msgs = c.messages.map((m) =>
              m.id === assistantMessageId
                ? { 
                    ...m, 
                    content: accumulatedContent || m.content,
                    isStreaming: false,
                    metrics: finalMetrics
                  }
                : m
            );
            return { ...c, messages: msgs, updatedAt: Date.now() };
          }) });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Clean up empty assistant messages if aborted before they started typing
        set({ conversations: get().conversations.map((c) => {
            if (c.id !== targetConv!.id) return c;
            const msgs = c.messages.filter((m) => m.id !== assistantMessageId || m.content.trim().length > 0);
            return { ...c, messages: msgs };
        }) });
      } else {
        console.error('Error during streaming:', err);
        const userFacingError = formatPersianErrorMessage(err);
        get().setActiveError({ message: userFacingError, timestamp: Date.now() });

        set({ conversations: get().conversations.map((c) => {
            if (c.id !== targetConv!.id) return c;
            // Remove empty assistant message so chat area stays 100% clean and pristine
            const msgs = c.messages.filter((m) => m.id !== assistantMessageId);
            return { ...c, messages: msgs };
          }) });
      }
    } finally {
      set({ isStreaming: false, routingState: 'idle' });
      abortController = null;
    }
  },

  // Regenerate last response
  regenerate: () => {
    const activeConv = get().conversations.find((c) => c.id === get().activeId);
    if (!activeConv || activeConv.messages.length === 0 || get().isStreaming) return;

    // Find last user message
    const msgs = [...activeConv.messages];
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userText = msgs[lastUserIndex].content;
    const userImageUrl = msgs[lastUserIndex].imageUrl;
    // Remove messages after that user message
    const truncated = msgs.slice(0, lastUserIndex);

    // Use the shared updater so localStorage stays in sync (see subscriber below).
    get().updateConversation(activeConv.id, (c) => ({ ...c, messages: truncated }));

    setTimeout(() => {
      get().sendMessage(userText, userImageUrl);
    }, 50);
  },

  // Edit previous user message and resend from that point
  insertImageToChat: (prompt, imageUrl) => {
    const activeId = get().activeId;
    const activeConv = get().conversations.find((c) => c.id === activeId);
    if (!activeConv) return;
    
    const userMessageId = 'msg_user_' + crypto.randomUUID();
    const assistantMessageId = 'msg_ai_' + crypto.randomUUID();
    
    const newMessages: ChatMessage[] = [
      ...activeConv.messages,
        { id: userMessageId, role: 'user', content: '/image ' + prompt, timestamp: Date.now() },
        { id: assistantMessageId, role: 'assistant', content: '![' + prompt + '](' + imageUrl + ')', timestamp: Date.now(), isImageGen: true }
    ];
    
    const newConvs = get().conversations.map(c => c.id === activeId ? { ...c, messages: newMessages } : c);
    saveConversations(newConvs);
    set({ conversations: newConvs });
  },

  editMessage: (messageId: string, newText: string) => {
    const activeConv = get().conversations.find((c) => c.id === get().activeId);
    if (!activeConv || get().isStreaming || !newText.trim()) return;

    const msgs = [...activeConv.messages];
    const targetIndex = msgs.findIndex((m) => m.id === messageId);
    if (targetIndex === -1) return;

    // Truncate conversation to remove this user message and subsequent responses
    const truncated = msgs.slice(0, targetIndex);

    // Use the shared updater so localStorage stays in sync (see subscriber below).
    get().updateConversation(activeConv.id, (c) => ({ ...c, messages: truncated }));

    setTimeout(() => {
      get().sendMessage(newText.trim());
    }, 50);
  }
}));

// Global Subscriber: Automatically persist conversations to localStorage whenever they change
useChatStore.subscribe((state, prevState) => {
  if (prevState && state.conversations !== prevState.conversations) {
    saveConversations(state.conversations);
  }
});

// User Context Switcher: Automatically switch conversation context on login/logout
onAuthChange((userId) => {
  useChatStore.getState().switchUserContext(userId);
});
