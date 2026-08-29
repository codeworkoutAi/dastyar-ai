import { estimateTokenCount, calculateEstimatedCostUSD, formatCostUSD } from '../utils/pricing';
import { formatPersianErrorMessage } from '../lib/persianUtils';
import { detectSmartRoutingIntent } from '../lib/smartRouting';
import { detectWebSearchNeed } from '../lib/autoWebSearch';
import { create } from 'zustand';
import { Conversation, ChatMessage } from '../types';
import { loadConversations, saveConversations, loadActiveConversationId, saveActiveConversationId, createNewConversation } from '../lib/storage';
import { useSettingsStore } from './settingsStore';
import { buildOptimizedContext } from '../lib/tokenOptimizer';

let abortController: AbortController | null = null;
const errorTimers = new Map<string, NodeJS.Timeout>();

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  activeError: { message: string; timestamp: number } | null;
  isStreaming: boolean;
  routingState: 'idle' | 'general' | 'vision' | 'coding';
  
  setConversations: (conversations: Conversation[]) => void;
  setActiveId: (id: string | null) => void;
  setActiveError: (error: { message: string; timestamp: number } | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setRoutingState: (state: 'idle' | 'general' | 'vision' | 'coding') => void;
  
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updater: (conv: Conversation) => Conversation) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  createChat: (modelName?: string) => void;
  createCodingChat: (modelName?: string) => void;

  stopGeneration: () => void;
  sendMessage: (text: string, imageUrl?: string, webSearch?: boolean, fileContext?: string) => Promise<void>;
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
      id: 'msg_code_' + Date.now(),
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
  sendMessage: async (text: string, imageUrl?: string, webSearch?: boolean, fileContext?: string) => {
    if ((!text.trim() && !imageUrl) || get().isStreaming) return;
    set({ activeError: null });

    let targetConv = (get().conversations.find((c) => c.id === get().activeId));
    if (!targetConv) {
      targetConv = createNewConversation((useSettingsStore.getState().settings.providers[useSettingsStore.getState().settings.providers.activeProvider]?.modelName));
      set({ conversations: [targetConv] });
    saveConversations([targetConv]);
      get().setActiveId(targetConv.id);
    }

    const userMessageId = 'msg_user_' + Date.now();
    const assistantMessageId = 'msg_ai_' + (Date.now() + 1);

    const isImageGen = text.trim().startsWith('/image ');
    const promptText = isImageGen ? text.trim().replace('/image ', '') : text;

    // Smart Auto Web Search: Automatically detect if query needs web assistance
    const globalWebSearchEnabled = useSettingsStore.getState().settings.tools.webSearch;
    const autoWebDecision = detectWebSearchNeed(promptText);
    const shouldAutoEnableWebSearch = globalWebSearchEnabled && autoWebDecision.shouldSearch && webSearch === undefined;

    if (shouldAutoEnableWebSearch) {
      console.log(`[AutoWebSearch] Enabled: ${autoWebDecision.reason} (${autoWebDecision.category})`);
    }

    let payloadSettings = JSON.parse(JSON.stringify(useSettingsStore.getState().settings));

    // Apply web search setting: explicit user override > auto-detection > default off
    if (webSearch !== undefined) {
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.webSearch = webSearch;
    } else if (shouldAutoEnableWebSearch) {
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.webSearch = true;
      // Add trusted domains for better search results
      if (autoWebDecision.domains) {
        payloadSettings.tools.webSearchDomains = autoWebDecision.domains;
      }
    } else {
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.webSearch = false; // explicitly disable if auto is off or global is off
    }

    let finalModelUsed = (useSettingsStore.getState().settings.providers as any)[useSettingsStore.getState().settings.providers.activeProvider]?.modelName || 'gemini-2.5-pro';

    if (useSettingsStore.getState().settings.tools.smartRouting && !isImageGen) {
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

      // Use enhanced smart routing with weighted intent detection
      const intent = detectSmartRoutingIntent(text, !!imageUrl);
      get().setRoutingState(intent);

      // Helper to apply profile to provider config
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

      if (intent === 'vision') {
          const actualName = applyProviderAndModel(rVisionProv, rVision);
          finalModelUsed = actualName + ' (هوشمند)';
      } else if (intent === 'coding') {
          const actualName = applyProviderAndModel(rCodingProv, rCoding);
          finalModelUsed = actualName + ' (هوشمند)';
      } else {
          const actualName = applyProviderAndModel(rDefaultProv, rDefault);
          finalModelUsed = actualName + ' (هوشمند)';
      }
    } else {
      get().setRoutingState('general');
    }

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user' as any,
      content: promptText,
      fileContext: fileContext,
      imageUrl: imageUrl,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant' as any,
      content: isImageGen ? 'در حال ساخت تصویر با هوش مصنوعی...' : '',
      timestamp: Date.now(),
      modelUsed: isImageGen ? 'image-generation' : finalModelUsed,
      isStreaming: true,
      isImageGen,
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
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText, settings: payloadSettings }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
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

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          serverErrorMsg += `: ${rawText}`;
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
      let serverUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined = undefined;

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
                get().setActiveError({ message: persianError, timestamp: Date.now() });
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

                // Update UI incrementally
                set({ conversations: get().conversations.map((c) => {
                    if (c.id !== targetConv!.id) return c;
                    const msgs = c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedContent }
                        : m
                    );
                    return { ...c, messages: msgs };
                  }) });
              }

              if (data.usage) {
                serverUsage = data.usage;
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
                }
                break;
              }
            } catch (e) {
              // Ignore incomplete JSON chunks
            }
          }
        }
      } catch (readErr: any) {
        if (readErr.name !== 'AbortError') {
          console.warn('Stream read interrupted:', readErr);
          if (!accumulatedContent && !streamHadError) {
            throw readErr;
          }
        }
      } finally {
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
      };

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
        // Generation aborted by user
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
    if (!(get().conversations.find((c) => c.id === get().activeId)) || (get().conversations.find((c) => c.id === get().activeId)).messages.length === 0 || get().isStreaming) return;
    
    // Find last user message
    const msgs = [...(get().conversations.find((c) => c.id === get().activeId)).messages];
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

    set({ conversations: get().conversations.map((c) => (c.id === (get().conversations.find((c) => c.id === get().activeId)).id ? { ...c, messages: truncated } : c)) });

    setTimeout(() => {
      get().sendMessage(userText, userImageUrl);
    }, 50);
  },

  // Edit previous user message and resend from that point
  insertImageToChat: (prompt, imageUrl) => {
    const activeId = get().activeId;
    const activeConv = get().conversations.find((c) => c.id === activeId);
    if (!activeConv) return;
    
    const userMessageId = 'msg_user_' + Date.now();
    const assistantMessageId = 'msg_ai_' + (Date.now() + 1);
    
    const newMessages = [
      ...activeConv.messages,
        { id: userMessageId, role: 'user' as any, content: '/image ' + prompt, timestamp: Date.now() },
        { id: assistantMessageId, role: 'assistant' as any, content: '![' + prompt + '](' + imageUrl + ')', timestamp: Date.now(), isImageGen: true }
    ];
    
    const newConvs = get().conversations.map(c => c.id === activeId ? { ...c, messages: newMessages } : c);
    saveConversations(newConvs);
    set({ conversations: newConvs });
  },

  editMessage: (messageId: string, newText: string) => {
    if (!(get().conversations.find((c) => c.id === get().activeId)) || get().isStreaming || !newText.trim()) return;

    const msgs = [...(get().conversations.find((c) => c.id === get().activeId)).messages];
    const targetIndex = msgs.findIndex((m) => m.id === messageId);
    if (targetIndex === -1) return;

    // Truncate conversation to remove this user message and subsequent responses
    const truncated = msgs.slice(0, targetIndex);

    set({ conversations: get().conversations.map((c) => (c.id === (get().conversations.find((c) => c.id === get().activeId)).id ? { ...c, messages: truncated } : c)) });

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
