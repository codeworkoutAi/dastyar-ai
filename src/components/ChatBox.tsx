import {
  AltArrowDownOutlineIcon as ArrowDown,
  DownloadOutlineIcon as Download,
  CloseOutlineIcon as X
} from '@solar-icons/react';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { SpeakController, speakText } from '../lib/tts';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { ChatMessage } from '../types';
import { ChatMessageItem } from './ChatMessageItem';

export { getModelIntro } from '../lib/modelMetadata';

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
