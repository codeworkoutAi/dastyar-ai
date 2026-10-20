import {
  AltArrowDownOutlineIcon as ArrowDown,
  DownloadOutlineIcon as Download,
  CloseOutlineIcon as X,
  Code2OutlineIcon,
  EyeOutlineIcon as Eye,
  DocumentTextOutlineIcon as FileText,
  BrainOutlineIcon
} from '@solar-icons/react';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { SpeakController, speakText } from '../lib/tts';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { ChatMessage } from '../types';
import { ChatMessageItem } from './ChatMessageItem';

export { getModelIntro } from '../lib/modelMetadata';

export const SmartRoutingAnimation: React.FC<{ routingState: 'general' | 'coding' | 'vision' | 'idle' | null }> = ({ routingState }) => {
  const { settings } = useSettingsStore();
  const roles = (settings.tools as any).routingRoles || {};
  const profiles = settings.providers.custom.profiles || [];
  const activeProv = settings.providers.activeProvider || 'gemini';
  const defaultModelName = (settings.providers as any)[activeProv]?.modelName || 'gemini-2.5-pro';

  const getModelName = (id?: string, fallback?: string) => {
    if (!id) return fallback || defaultModelName;
    const p = profiles.find((x: any) => x.id === id);
    return p ? (p.modelName || p.name) : id;
  };

  const modelGeneral = getModelName(roles.default);
  const modelCoding = getModelName(roles.coding, activeProv === 'gemini' ? 'gemini-2.5-pro' : undefined);
  const modelVision = getModelName(roles.vision, activeProv === 'gemini' ? 'gemini-2.5-pro' : undefined);

  let activeModel = modelGeneral;
  let ActiveIcon = FileText;
  if (routingState === 'coding') {
    activeModel = modelCoding;
    ActiveIcon = Code2OutlineIcon;
  } else if (routingState === 'vision') {
    activeModel = modelVision;
    ActiveIcon = Eye;
  }

  // The animation will only fully light up if routingState is not null.
  // The user requested LTR (Left-to-Right) layout for this specific component.
  return (
    <div className="w-full flex justify-between items-center relative fade-in-up select-none h-full max-w-xl mx-auto" dir="ltr">
      {/* 1. Source Node (Brain) - Left Side */}
      <div className={`w-6 h-6 sm:w-8 sm:h-8 z-20 shrink-0 flex items-center justify-center transition-all duration-500 relative ${routingState ? 'text-zinc-700 dark:text-zinc-300' : 'opacity-40 grayscale'}`}>
        <BrainOutlineIcon className="w-full h-full" />
      </div>

      {/* Connection Line 1 (Brain to Modality) */}
      <div className="flex-1 h-[1.5px] mx-2 sm:mx-4 relative bg-zinc-200/40 rounded-full shrink min-w-[30px] flex justify-start">
        {routingState && (
          <div className="h-full bg-zinc-500 dark:bg-zinc-400 rounded-full animate-fill-line-ltr w-0" />
        )}
      </div>

      {/* 2. Modality Node (Center) */}
      <div className={`w-6 h-6 sm:w-8 sm:h-8 z-20 shrink-0 flex items-center justify-center transition-all duration-500 delay-100 relative ${routingState ? 'scale-110 text-zinc-700 dark:text-zinc-300' : 'opacity-40 grayscale'}`}>
        <ActiveIcon className="w-full h-full" />
      </div>

      {/* Connection Line 2 (Modality to Model) */}
      <div className="flex-1 h-[1.5px] mx-2 sm:mx-4 relative bg-zinc-200/40 rounded-full shrink min-w-[30px] flex justify-start">
        {routingState && (
          <div className="h-full bg-zinc-500 dark:bg-zinc-400 rounded-full animate-fill-line-ltr w-0" style={{ animationDelay: '0.4s' }} />
        )}
      </div>

      {/* 3. Target Model Node (Right Side) */}
      <div className={`h-6 sm:h-8 px-2 sm:px-3 z-20 shrink-0 flex items-center justify-center transition-all duration-500 delay-300 relative ${routingState ? 'scale-105 text-zinc-700 dark:text-zinc-300' : 'opacity-40 grayscale'}`}>
        <span className="font-extrabold text-[9px] sm:text-[10px] font-['Vazirmatn'] uppercase tracking-wider relative z-10">{activeModel}</span>
      </div>
    </div>
  );
};

export const ChatBox: React.FC = memo(() => {
  const { settings, updateSettings } = useSettingsStore();
  const { conversations, activeId, isStreaming, editMessage, regenerate, setActiveError } = useChatStore();
  const conversation = conversations.find((c) => c.id === activeId) || null;
  const usePersianDigits = settings.appearance.persianNumerals;
  const showPerformanceMetrics = settings.tools.showPerformanceMetrics;
  const onEditMessage = editMessage;
  const onRegenerate = regenerate;
  const onDismissError = useCallback(() => setActiveError(null), [setActiveError]);
  const onToggleMetrics = useCallback((val: boolean) => updateSettings((s) => ({ ...s, tools: { ...s.tools, showPerformanceMetrics: val } })), [updateSettings]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const ttsControllerRef = useRef<SpeakController | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingTtsId, setLoadingTtsId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const handleFeedback = useCallback((msgId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [msgId]: type }));
  }, []);

  const handleDownloadMedia = useCallback((url: string, isVideo = false) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = isVideo ? `persian-ai-video-${Date.now()}.mp4` : `persian-ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    chatEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  }, []);

  // Initial scroll on conversation change
  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.id, scrollToBottom]);

  // Scroll smoothly to bottom once when the full response is rendered
  useEffect(() => {
    if (!isStreaming && conversation?.messages && conversation.messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isStreaming, conversation?.messages]);

  // Stop TTS if unmounting or if conversation changes
  useEffect(() => {
    return () => {
      if (ttsControllerRef.current) {
        ttsControllerRef.current.stop();
        ttsControllerRef.current = null;
      }
      setSpeakingId(null);
      setLoadingTtsId(null);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [conversation?.id]);

  // Handle Text-to-Speech (reads ONLY the clean answer of each topic/message in Persian or English)
  const handleToggleSpeak = useCallback((msg: ChatMessage) => {
    // If currently speaking or loading this message, toggle off / stop
    if (speakingId === msg.id || loadingTtsId === msg.id) {
      if (ttsControllerRef.current) {
        ttsControllerRef.current.stop();
        ttsControllerRef.current = null;
      }
      setSpeakingId(null);
      setLoadingTtsId(null);
      return;
    }

    // Stop any previously playing audio
    if (ttsControllerRef.current) {
      ttsControllerRef.current.stop();
      ttsControllerRef.current = null;
    }

    setLoadingTtsId(msg.id);
    setSpeakingId(null);

    ttsControllerRef.current = speakText(
      msg.content,
      () => {
        setLoadingTtsId(null);
        setSpeakingId(msg.id);
      },
      () => {
        setLoadingTtsId(null);
        setSpeakingId(null);
        ttsControllerRef.current = null;
      },
      () => {
        setLoadingTtsId(null);
        setSpeakingId(null);
        ttsControllerRef.current = null;
      }
    );
  }, [speakingId, loadingTtsId]);

  // Handle scroll listener to show scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  }, []);

  const handleCopyMessage = useCallback((msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExportSingleMessage = useCallback((msg: ChatMessage) => {
    const blob = new Blob([msg.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persian-ai-message-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleSaveEdit = useCallback((msgId: string, text: string) => {
    if (onEditMessage) {
      onEditMessage(msgId, text);
    }
    setEditingMessageId(null);
  }, [onEditMessage]);

  const handleChangeEditText = useCallback((text: string) => {
    setEditingText(text);
  }, []);

  const handleOpenLightbox = useCallback((media: { url: string; type: 'image' | 'video' }) => {
    setLightboxMedia(media);
  }, []);

  const messages = conversation?.messages || [];

  return (
    <div className="relative flex-1 flex flex-col min-h-0 h-full w-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 text-inherit relative z-10 flex flex-col"
      >
        {/* Messages List */}
        {messages.length > 0 && (
          <div className="max-w-3xl mx-auto flex flex-col space-y-6 pb-4 w-full pt-4">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                isStreaming={isStreaming}
                usePersianDigits={usePersianDigits}
                showPerformanceMetrics={showPerformanceMetrics}
                stripReasoning={!settings.tools.reasoningMode}
                isCopied={copiedId === msg.id}
                isSpeaking={speakingId === msg.id}
                isLoadingTts={loadingTtsId === msg.id}
                feedbackType={feedback[msg.id]}
                isEditing={editingMessageId === msg.id}
                editingText={editingText}
                onEditMessage={onEditMessage}
                onRegenerate={onRegenerate}
                onDismissError={onDismissError}
                onToggleMetrics={onToggleMetrics}
                onCopyMessage={handleCopyMessage}
                onToggleSpeak={handleToggleSpeak}
                onExportSingleMessage={handleExportSingleMessage}
                onFeedback={handleFeedback}
                onOpenLightbox={handleOpenLightbox}
                onDownloadMedia={handleDownloadMedia}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onChangeEditText={handleChangeEditText}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Floating Scroll to Bottom Button - Minimal Pill */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-20 p-3 rounded-badge clay-surface text-[var(--color-text-main)] dark:text-[var(--color-text-main)] border border-[var(--color-border-strong)] transition-all clay-icon-btn hover:scale-105 cursor-pointer"
            aria-label="پیمایش به پایین"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Lightbox Modal */}
        {lightboxMedia && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setLightboxMedia(null)}
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-badge clay-surface clay-icon-btn text-white transition-colors cursor-pointer"
              onClick={() => setLightboxMedia(null)}
              aria-label="بستن پیش‌نمایش"
            >
              <X className="w-6 h-6" />
            </button>
            <div
              className="relative max-w-[90vw] max-h-[90dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxMedia.type === 'image' ? (
                <img src={lightboxMedia.url} className="max-w-full max-h-[90dvh] object-contain rounded-card" alt="Preview" />
              ) : (
                <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[90dvh] object-contain rounded-card" />
              )}
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => handleDownloadMedia(lightboxMedia.url, lightboxMedia.type === 'video')}
                  className="flex items-center gap-2 px-4 py-2 clay-btn text-white rounded-btn border border-[var(--color-border-strong)] transition-colors cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
                  دانلود
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ChatBox.displayName = 'ChatBox';
