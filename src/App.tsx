import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, AppSettings } from './types';
import { 
  loadConversations, 
  saveConversations, 
  loadActiveConversationId, 
  saveActiveConversationId, 
  loadSettings, 
  saveSettings, 
  createNewConversation 
} from './lib/storage';
import { buildOptimizedContext } from './lib/tokenOptimizer';
import { calculateEstimatedCostUSD, formatCostUSD, estimateTokenCount } from './utils/pricing';
import { formatPersianErrorMessage } from './lib/persianUtils';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatBox } from './components/ChatBox';
import { MessageInput } from './components/MessageInput';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ImageGenStudio } from './components/ImageGenStudio';
import { UiGuideModal } from './components/UiGuideModal';
import { ErrorCapsule } from './components/ErrorCapsule';

export default function App() {
  // State initialization from localStorage
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveConversationId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => window.innerWidth >= 1024);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState<boolean>(false);
  const [isUiGuideOpen, setIsUiGuideOpen] = useState<boolean>(false);
  const [platformMode, setPlatformMode] = useState<'windows' | 'android'>('windows');
  const [videoNotice, setVideoNotice] = useState<string | null>(null);
  const [metricsNotice, setMetricsNotice] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<{ message: string; timestamp: number } | null>(null);
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const errorTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-dismiss failed / error message from chat after 15 seconds
  const scheduleErrorAutoDismiss = (convId: string, messageId: string, delayMs = 15000) => {
    if (errorTimersRef.current.has(messageId)) {
      clearTimeout(errorTimersRef.current.get(messageId)!);
    }
    const timer = setTimeout(() => {
      errorTimersRef.current.delete(messageId);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.filter((m) => m.id !== messageId)
          };
        })
      );
    }, delayMs);
    errorTimersRef.current.set(messageId, timer);
  };

  // Immediate manual dismiss of error message via (✕) button
  const handleDismissError = (messageId: string) => {
    if (errorTimersRef.current.has(messageId)) {
      clearTimeout(errorTimersRef.current.get(messageId)!);
      errorTimersRef.current.delete(messageId);
    }
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== messageId)
      }))
    );
  };

  // Auto-switch model to Gemini when video is attached
  const handleVideoAttached = () => {
    if (settings.providers.activeProvider !== 'gemini') {
      setSettings((prev) => ({
        ...prev,
        providers: {
          ...prev.providers,
          activeProvider: 'gemini',
          gemini: {
            ...prev.providers.gemini,
            modelName: 'gemini-3.1-flash-lite'
          }
        }
      }));
      setVideoNotice('مدل به صورت خودکار برای پردازش ویدیو روی Gemini تنظیم شد.');
      setTimeout(() => {
        setVideoNotice(null);
      }, 5000);
    }
  };

  // Synchronize active conversation
  useEffect(() => {
    if (conversations.length === 0) {
      const initialConv = createNewConversation((settings.providers[settings.providers.activeProvider]?.modelName));
      setConversations([initialConv]);
      setActiveId(initialConv.id);
      saveConversations([initialConv]);
      saveActiveConversationId(initialConv.id);
    } else if (!activeId || !conversations.find((c) => c.id === activeId)) {
      setActiveId(conversations[0].id);
      saveActiveConversationId(conversations[0].id);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  // Reactive system theme detection
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen for OS system theme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    // Modern API with fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handler);
      }
    };
  }, []);

  // Compute effective dark mode
  const effectiveIsDark =
    settings.appearance.theme === 'dark' ||
    (settings.appearance.theme === 'system' && systemIsDark);

  // Apply theme classes and attributes whenever settings or effectiveIsDark change
  useEffect(() => {
    saveSettings(settings);
    const root = document.documentElement;

    if (effectiveIsDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }

    root.setAttribute('data-theme-mode', settings.appearance.theme || 'system');
    root.setAttribute('data-font', settings.appearance.font || 'vazir');
    root.style.setProperty('--chat-font-size', `${settings.appearance.fontSize || 16}px`);
    root.style.setProperty('--chat-line-height', String(1.5 + (settings.appearance.fontSize || 16) / 50));

    // Apply direction
    root.setAttribute('dir', settings.appearance.direction === 'ltr' ? 'ltr' : 'rtl');
    root.setAttribute('lang', settings.appearance.direction === 'ltr' ? 'en' : 'fa');
  }, [settings, effectiveIsDark]);


  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0] || null;

  // New Chat Handler
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    const newConv = createNewConversation((settings.providers[settings.providers.activeProvider]?.modelName));
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  // Dedicated Coding Assistant Session Handler
  const handleNewCodingAssistant = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    const newConv = createNewConversation((settings.providers[settings.providers.activeProvider]?.modelName));
    newConv.title = 'دستیار برنامه‌نویسی';
    const welcomeMsg: ChatMessage = {
      id: 'msg_code_' + Date.now(),
      role: 'assistant',
      content: '👋 سلام! من **دستیار تخصصی برنامه‌نویسی** شما هستم.\n\nمی‌توانم در حل مسائل الگوریتمی، کدنویسی و دیباگ (پایتون، ری‌اکت، تایپ‌اسکریپت، جاوااسکریپت، Go، C++، SQL و...) همراه شما باشم.\n\nچه کدی یا پروژه‌ای مد نظر شماست؟',
      timestamp: Date.now(),
      modelUsed: (settings.providers[settings.providers.activeProvider]?.modelName) || 'gemini-2.5-flash',
    };
    newConv.messages = [welcomeMsg];
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Clear all conversations
  const handleClearAll = () => {
    const fresh = createNewConversation((settings.providers[settings.providers.activeProvider]?.modelName));
    setConversations([fresh]);
    setActiveId(fresh.id);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Turn off isStreaming on active message
    if (activeId) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeId) return conv;
          const updatedMessages = conv.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...conv, messages: updatedMessages };
        })
      );
    }
  };

  // Send Message & Stream Response
  const handleSendMessage = async (text: string, imageUrl?: string, imageUrls?: string[]) => {
    // Resolve effective media list (prefer imageUrls array, fallback to single imageUrl)
    const effectiveImageUrls = imageUrls && imageUrls.length > 0
      ? imageUrls
      : imageUrl
        ? [imageUrl]
        : undefined;
    const effectiveImageUrl = effectiveImageUrls?.[0]; // backward compat: first item

    if ((!text.trim() && !effectiveImageUrl) || isStreaming) return;
    setActiveError(null);

    let targetConv = activeConversation;
    if (!targetConv) {
      targetConv = createNewConversation((settings.providers[settings.providers.activeProvider]?.modelName));
      setConversations([targetConv]);
      setActiveId(targetConv.id);
    }

    const userMessageId = 'msg_user_' + Date.now();
    const assistantMessageId = 'msg_ai_' + (Date.now() + 1);

    const isImageGen = text.trim().startsWith('/image ');
    const promptText = isImageGen ? text.trim().replace('/image ', '') : text;

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      imageUrl: effectiveImageUrl,
      imageUrls: effectiveImageUrls,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: isImageGen ? '🎨 در حال ساخت تصویر با هوش مصنوعی...' : '',
      timestamp: Date.now(),
      modelUsed: (settings.providers[settings.providers.activeProvider]?.modelName) || 'gemini-2.5-flash',
      isStreaming: true,
      isImageGen,
    };

    // Auto-update conversation title if it's the first message
    const isFirstMessage = targetConv.messages.length === 0 || targetConv.title === 'گفتگوی جدید';
    const newTitle = isFirstMessage ? (promptText.trim() || 'ساخت تصویر').substring(0, 35) : targetConv.title;

    // Update conversation with user message and empty streaming assistant message
    const updatedMessages = [...targetConv.messages, userMessage, assistantMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConv!.id
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
              modelUsed: (settings.providers[settings.providers.activeProvider]?.modelName),
            }
          : c
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestStartTime = performance.now();
    let firstTokenTime: number | null = null;

    try {
      if (isImageGen) {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText, settings }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        const totalTimeMs = Math.round(performance.now() - requestStartTime);

        setConversations((prev) =>
          prev.map((c) => {
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
          })
        );
        setIsStreaming(false);
        return;
      }

      // Build optimized sliding context window:
      // - Retains active recent turns (last 6 messages)
      // - Compacts older messages outside window into a lightweight summary
      // - De-duplicates past base64 media payloads into lightweight text placeholders
      // - Keeps active user input and attached media intact in current turn
      const contextMessages = buildOptimizedContext(
        targetConv.messages,
        { content: text, imageUrl: effectiveImageUrl, imageUrls: effectiveImageUrls },
        { maxRecentTurns: 6 }
      );

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: contextMessages,
          settings,
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
        throw new Error('پاسخی از سرور دریافت نشد.');
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
                setActiveError({ message: persianError, timestamp: Date.now() });
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== targetConv!.id) return c;
                    // Remove empty assistant message so chat area stays 100% clean and pristine
                    const msgs = c.messages.filter((m) => m.id !== assistantMessageId);
                    return { ...c, messages: msgs };
                  })
                );
              }

              if (data.chunk) {
                if (firstTokenTime === null) {
                  firstTokenTime = performance.now();
                }
                accumulatedContent += data.chunk;
              }

              if (data.usage) {
                serverUsage = data.usage;
              }

              if (data.imageUrl) {
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== targetConv!.id) return c;
                    const msgs = c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, imageUrl: data.imageUrl }
                        : m
                    );
                    return { ...c, messages: msgs };
                  })
                );
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
      const rawCostUSD = calculateEstimatedCostUSD((settings.providers[settings.providers.activeProvider]?.modelName), promptTokens, completionTokens);
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
        setConversations((prev) =>
          prev.map((c) => {
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
          })
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Generation aborted by user
      } else {
        console.error('Error during streaming:', err);
        const userFacingError = formatPersianErrorMessage(err);
        setActiveError({ message: userFacingError, timestamp: Date.now() });

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConv!.id) return c;
            // Remove empty assistant message so chat area stays 100% clean and pristine
            const msgs = c.messages.filter((m) => m.id !== assistantMessageId);
            return { ...c, messages: msgs };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;
    
    // Find last user message
    const msgs = [...activeConversation.messages];
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

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: truncated } : c))
    );

    setTimeout(() => {
      handleSendMessage(userText, userImageUrl);
    }, 50);
  };

  // Edit previous user message and resend from that point
  const handleEditMessage = (messageId: string, newText: string) => {
    if (!activeConversation || isStreaming || !newText.trim()) return;

    const msgs = [...activeConversation.messages];
    const targetIndex = msgs.findIndex((m) => m.id === messageId);
    if (targetIndex === -1) return;

    // Truncate conversation to remove this user message and subsequent responses
    const truncated = msgs.slice(0, targetIndex);

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: truncated } : c))
    );

    setTimeout(() => {
      handleSendMessage(newText.trim());
    }, 50);
  };

  return (
    <div
      className="h-[100dvh] w-full max-w-[100vw] flex flex-col clay-app-bg transition-colors duration-200 overflow-hidden pb-[env(safe-area-inset-bottom)]"
      dir={settings.appearance.direction === 'ltr' ? 'ltr' : 'rtl'}
    >
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenUiGuide={() => setIsUiGuideOpen(true)}
        settings={settings}
        activeConversation={activeConversation}
        conversations={conversations}
        platformMode={platformMode}
        setPlatformMode={setPlatformMode}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={(id) => setActiveId(id)}
          onNewChat={handleNewChat}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onOpenCodingAssistant={handleNewCodingAssistant}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onTogglePin={handleTogglePin}
          onExportSingle={(conv) => {
            setActiveId(conv.id);
            setIsExportOpen(true);
          }}
          onClearAll={handleClearAll}
          usePersianDigits={settings.appearance.persianNumerals}
        />

        {/* Central Chat Area */}
        <main 
          id="main-chat-container"
          className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
            platformMode === 'android' 
              ? 'max-w-md mx-auto clay-card my-0 sm:my-3 sm:rounded-[2.5rem] border-2 shadow-2xl' 
              : 'bg-transparent'
          }`}
        >
          <ChatBox
            conversation={activeConversation}
            isStreaming={isStreaming}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onRegenerate={handleRegenerate}
            onStopGeneration={handleStopGeneration}
            onDismissError={handleDismissError}
            usePersianDigits={settings.appearance.persianNumerals}
            showPerformanceMetrics={settings.tools.showPerformanceMetrics !== false}
            onToggleMetrics={(val) => {
              setSettings((prev) => ({ ...prev, tools: { ...prev.tools, showPerformanceMetrics: val } }));
              if (!val) {
                setMetricsNotice('آمار و بنچمارک مخفی شد. برای فعال‌سازی مجدد به تنظیمات مراجعه کنید.');
                setTimeout(() => setMetricsNotice(null), 5000);
              }
            }}
          />

          {metricsNotice && (
            <div className="px-4 py-1.5 mx-auto -mb-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs rounded-full flex items-center gap-2 animate-fadeIn z-10 select-none shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
              <span>{metricsNotice}</span>
            </div>
          )}

          {videoNotice && (
            <div className="px-4 py-1.5 mx-auto -mb-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-full flex items-center gap-2 animate-fadeIn z-10 select-none shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{videoNotice}</span>
            </div>
          )}

          {/* Floating Glass Error Capsule */}
          <ErrorCapsule
            error={activeError}
            onDismiss={() => setActiveError(null)}
            onRetry={() => {
              setActiveError(null);
              handleRegenerate();
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            durationSeconds={15}
          />

          <MessageInput
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopGeneration={handleStopGeneration}
            enterToSend={settings.tools.enterToSend}
            usePersianDigits={settings.appearance.persianNumerals}
            platformMode={platformMode}
            onVideoAttached={handleVideoAttached}
          />
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => setSettings(s)}
        conversations={conversations}
        onImportConversations={(imported) => {
          setConversations(imported);
          if (imported.length > 0) setActiveId(imported[0].id);
        }}
        onClearAllConversations={handleClearAll}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        activeConversation={activeConversation}
        allConversations={conversations}
      />

      {/* Image Gen Studio Modal */}
      <ImageGenStudio
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onInsertToChat={(promptText, imageUrl) => {
          if (!activeConversation) return;
          const userMessageId = 'msg_user_' + Date.now();
          const assistantMessageId = 'msg_ai_' + (Date.now() + 1);

          const userMessage: ChatMessage = {
            id: userMessageId,
            role: 'user',
            content: `ساخت تصویر: ${promptText}`,
            timestamp: Date.now(),
          };

          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: `🎨 تصویر ساخته شده با استودیو: "${promptText}"`,
            imageUrl: imageUrl,
            timestamp: Date.now(),
            modelUsed: 'Image Studio',
            isStreaming: false,
          };

          const updatedMessages = [...activeConversation.messages, userMessage, assistantMessage];
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: updatedMessages, updatedAt: Date.now() } : c))
          );
        }}
      />

      {/* UI Visual Map Guide Modal */}
      <UiGuideModal
        isOpen={isUiGuideOpen}
        onClose={() => setIsUiGuideOpen(false)}
      />
    </div>
  );
}
