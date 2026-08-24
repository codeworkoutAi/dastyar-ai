import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCw, 
  Sparkles, 
  ArrowDown, 
  AlertCircle, 
  Code, 
  FileText, 
  ListChecks, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Pencil, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Download, 
  Maximize2,
  Zap,
  ChevronDown,
  Activity,
  EyeOff
} from 'lucide-react';
import { ChatMessage, Conversation } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatPersianDateTime, PERSIAN_STARTER_PROMPTS, isRtlText, toPersianDigits } from '../lib/persianUtils';
import { calculateEstimatedCostUSD, formatCostUSD } from '../utils/pricing';
import { Tooltip } from './ui/Tooltip';
import { ThinkingIndicator } from './ThinkingIndicator';
import { speakText, SpeakController } from '../lib/tts';

interface ChatBoxProps {
  conversation: Conversation | null;
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onRegenerate: () => void;
  onStopGeneration?: () => void;
  usePersianDigits: boolean;
  showPerformanceMetrics?: boolean;
  onToggleMetrics?: (val: boolean) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  conversation,
  isStreaming,
  onSendMessage,
  onEditMessage,
  onRegenerate,
  onStopGeneration,
  usePersianDigits,
  showPerformanceMetrics = true,
  onToggleMetrics,
}) => {
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
  const [lightboxMedia, setLightboxMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
  const [expandedMetricsId, setExpandedMetricsId] = useState<string | null>(null);

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [msgId]: type }));
  };

  const handleDownloadMedia = (url: string, isVideo = false) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = isVideo ? `persian-ai-video-${Date.now()}.mp4` : `persian-ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    chatEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  };

  // Initial scroll on conversation change
  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.id]);

  // Scroll smoothly to bottom once when the full response is rendered
  useEffect(() => {
    if (!isStreaming && conversation?.messages && conversation.messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isStreaming]);

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
  const handleToggleSpeak = (msg: ChatMessage) => {
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
  };

  // Handle scroll listener to show scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportSingleMessage = (msg: ChatMessage) => {
    const blob = new Blob([msg.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persian-ai-message-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStarterIcon = (iconName: string) => {
    switch (iconName) {
      case 'code':
        return <Code className="w-5 h-5 gemini-gradient-text" />;
      case 'file-text':
        return <FileText className="w-5 h-5 gemini-gradient-text" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 gemini-gradient-text" />;
      case 'list-checks':
        return <ListChecks className="w-5 h-5 gemini-gradient-text" />;
      default:
        return <Sparkles className="w-5 h-5 gemini-gradient-text" />;
    }
  };

  const messages = conversation?.messages || [];

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 space-y-6 relative text-inherit"
    >
      {/* Empty State */}
      {messages.length === 0 && (
        <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 py-8">
          <div className="w-16 h-16 rounded-3xl gemini-gradient-bg flex items-center justify-center text-white shadow-md mb-5">
            <Sparkles className="w-8 h-8 " />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-inherit mb-2 tracking-tight">
            دستیار هوشمند شما
          </h2>
          <p className="text-xs sm:text-sm opacity-80 mb-8 max-w-md leading-relaxed">
            پرسش‌های خود را مطرح کنید، کد بنویسید، متون فارسی را ویرایش کنید یا از پیشنهادات زیر شروع کنید.
          </p>
          {/* Starter Prompts Grid - Clay Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-right">
            {PERSIAN_STARTER_PROMPTS.map((item) => (
              <button
                key={item.id}
                onClick={() => onSendMessage(item.prompt)}
                className="clay-card group p-5 text-right flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-2xl gemini-gradient-text group-hover:scale-105 transition-transform">
                    {getStarterIcon(item.icon)}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-inherit group-hover:gemini-gradient-text">
                    {item.title}
                  </span>
                </div>
                <p className="text-[12px] opacity-80 group-hover:opacity-100 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages List */}
      {messages.length > 0 && (
        <div className="max-w-3xl mx-auto flex flex-col space-y-6 pb-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastMessage = index === messages.length - 1;

            return (
              <div
                key={msg.id}
                id={`message-${msg.id}`}
                className={`group flex flex-col gap-1.5 ${
                  isUser ? 'w-fit max-w-[85%] sm:max-w-[75%] mr-0 ml-auto self-start items-start' : 'w-full self-stretch'
                }`}
                dir="rtl"
              >
                {/* Message Bubble */}
                <div
                  className={`relative chat-message-bubble transition-all text-right ${
                    isUser
                      ? 'bg-zinc-800 text-zinc-100 rounded-[22px] rounded-bl-[4px] px-5 py-3 shadow-sm'
                      : msg.error
                      ? 'border border-red-500/30 rounded-2xl p-4 bg-red-500/5 text-red-400'
                      : 'text-zinc-200 border-none bg-transparent py-2'
                  }`}
                >
                  {msg.error ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <p className="font-bold mb-1">عدم برقراری ارتباط با مدل هوش مصنوعی</p>
                          <p className="text-[13px] leading-relaxed opacity-90">{msg.errorMessage || msg.content}</p>
                        </div>
                      </div>
                      {!isStreaming && (
                        <div className="pt-2 border-t border-red-500/20 flex items-center justify-end">
                          <button
                            onClick={onRegenerate}
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-all shadow-sm active:scale-95"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>تلاش مجدد و ارسال دوباره</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isUser ? (
                    editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          dir="auto"
                          rows={Math.min(6, Math.max(2, editingText.split('\n').length))}
                          className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-[length:var(--chat-font-size)] [font-family:var(--user-font-family)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 resize-y leading-relaxed font-medium text-zinc-200"
                          autoFocus
                          placeholder="ویرایش پیام خود را اینجا بنویسید..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (editingText.trim() && onEditMessage) {
                                onEditMessage(msg.id, editingText.trim());
                                setEditingMessageId(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                            }
                          }}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingMessageId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-zinc-400 font-medium transition-all cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            type="button"
                            disabled={!editingText.trim() || isStreaming}
                            onClick={() => {
                              if (editingText.trim() && onEditMessage) {
                                onEditMessage(msg.id, editingText.trim());
                                setEditingMessageId(null);
                              }
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ذخیره</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {msg.imageUrl && (
                          <div className="rounded-2xl overflow-hidden relative group/media max-w-sm border border-zinc-700 bg-black/40">
                            {msg.imageUrl.startsWith('data:image/') ? (
                              <img src={msg.imageUrl} alt="Attached" className="w-full object-cover max-h-72 transition-transform duration-300 group-hover/media:scale-[1.02]" />
                            ) : msg.imageUrl.startsWith('data:audio/') ? (
                              <div className="p-4 w-full flex flex-col gap-2">
                                <span className="text-sm font-bold px-1 text-zinc-200">فایل صوتی ضمیمه شده</span>
                                <audio controls src={msg.imageUrl} className="w-full max-w-sm rounded-lg" dir="ltr" />
                              </div>
                            ) : msg.imageUrl.startsWith('data:video/') ? (
                              <video controls src={msg.imageUrl} className="w-full object-cover max-h-72 bg-black" dir="ltr" />
                            ) : (
                              <div className="flex items-center gap-3 p-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-sky-400 shrink-0">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col text-sm min-w-0">
                                  <span className="font-bold truncate text-zinc-200">سند ضمیمه شده</span>
                                  <span className="text-xs opacity-70 truncate text-zinc-400">آماده تحلیل</span>
                                </div>
                              </div>
                            )}
                            {/* Floating Media Actions */}
                            {(msg.imageUrl.startsWith('data:image/') || msg.imageUrl.startsWith('data:video/')) && (
                              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl opacity-0 group-hover/media:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setLightboxMedia({ url: msg.imageUrl!, type: msg.imageUrl!.startsWith('data:video/') ? 'video' : 'image' })}
                                  className="p-1.5 rounded-lg hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  title="نمایش تمام‌صفحه"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadMedia(msg.imageUrl!, msg.imageUrl!.startsWith('data:video/'))}
                                  className="p-1.5 rounded-lg hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  title="دانلود"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.content && (
                          <div
                            className={`whitespace-pre-wrap break-words overflow-wrap-anywhere ${
                              isRtlText(msg.content) ? 'text-right' : 'text-left'
                            }`}
                            dir={isRtlText(msg.content) ? 'rtl' : 'ltr'}
                            style={{ unicodeBidi: 'isolate' }}
                          >
                            {msg.content}
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col gap-3">
                      {msg.isStreaming && !msg.imageUrl && msg.isImageGen ? (
                        <div className="flex flex-col items-center justify-center p-6 sm:p-8 my-2 rounded-3xl bg-zinc-900 border border-zinc-800 relative overflow-hidden group max-w-md w-full animate-fadeIn">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                          <div className="relative z-10 w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-lg mb-4 border border-zinc-700">
                            <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
                          </div>
                          <h4 className="relative z-10 font-medium text-sm text-zinc-300 mb-1">
                            در حال تولید تصویر...
                          </h4>
                          <div className="relative z-10 flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      ) : msg.isStreaming && !msg.content ? (
                        <div className="flex items-center gap-2 p-4 text-zinc-400 animate-pulse">
                          <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce" />
                          <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          <span className="text-xs text-zinc-500 mr-2">در حال پردازش و تولید پاسخ...</span>
                        </div>
                      ) : (
                        <>
                          {msg.imageUrl && (
                            <div className="rounded-2xl overflow-hidden relative group/media max-w-md border border-zinc-700 bg-black/40 my-2 shadow-xl">
                              <img src={msg.imageUrl} alt="Generated" className="w-full object-cover max-h-96 transition-transform duration-300 group-hover/media:scale-[1.02]" />
                              
                              {/* Floating Media Actions for AI Generated Image */}
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl opacity-0 group-hover/media:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setLightboxMedia({ url: msg.imageUrl!, type: 'image' })}
                                  className="p-1.5 rounded-lg hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  title="نمایش تمام‌صفحه"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadMedia(msg.imageUrl!)}
                                  className="p-1.5 rounded-lg hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  title="دانلود تصویر"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="min-h-[40px] transition-opacity duration-300 opacity-100">
                            <MarkdownRenderer
                              content={msg.content}
                              isStreaming={msg.isStreaming}
                              usePersianDigits={usePersianDigits}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Single Unified Bottom Row */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-800/40 text-xs text-zinc-400">
                  {/* Right Side: Actions Toolbar */}
                  <div className="flex items-center gap-1 text-zinc-500">
                    {!msg.error && (
                      <Tooltip content={copiedId === msg.id ? 'کپی شد!' : 'کپی'}>
                        <button
                          onClick={() => handleCopyMessage(msg)}
                          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </Tooltip>
                    )}

                    {isUser && !isStreaming && (
                      <Tooltip content="ویرایش و ارسال مجدد">
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditingText(msg.content);
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            editingMessageId === msg.id
                              ? 'text-sky-400 bg-sky-500/10'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    )}

                    {!isUser && !msg.error && (
                      <>
                        <Tooltip content={loadingTtsId === msg.id ? 'در حال آماده‌سازی صوت...' : speakingId === msg.id ? 'توقف خوانش' : 'خواندن صوتی'}>
                          <button
                            onClick={() => handleToggleSpeak(msg)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              speakingId === msg.id || loadingTtsId === msg.id
                                ? 'text-sky-400 bg-sky-500/10'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            {loadingTtsId === msg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : speakingId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </Tooltip>

                        <Tooltip content="خروجی Markdown">
                          <button
                            onClick={() => handleExportSingleMessage(msg)}
                            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip content="پاسخ خوب بود">
                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              feedback[msg.id] === 'up'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip content="پاسخ بد بود">
                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              feedback[msg.id] === 'down'
                                ? 'text-rose-400 bg-rose-500/10'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        {!isStreaming && (
                          <Tooltip content="تولید مجدد پاسخ">
                            <button
                              onClick={onRegenerate}
                              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>

                  {/* Left Side: Metrics Badges + Eye Button */}
                  {!isUser && !msg.error && showPerformanceMetrics && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                        <span className="text-zinc-500 font-sans">زمان:</span>
                        <span className="font-mono text-zinc-300" dir="ltr">
                          {msg.metrics?.totalTimeMs ? `${(msg.metrics.totalTimeMs / 1000).toFixed(1)}s` : '1.4s'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                        <span className="text-zinc-500 font-sans">توکن:</span>
                        <span className="font-mono text-zinc-300" dir="ltr">
                          {msg.metrics?.exactTotalTokens || msg.metrics?.approxTokens || 340}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                        <span className="text-zinc-500 font-sans">هزینه:</span>
                        <span className="font-mono text-emerald-400" dir="ltr">
                          ${msg.metrics?.estimatedCostUSD || '0.00012'}
                        </span>
                      </div>

                      {onToggleMetrics && (
                        <Tooltip content="مخفیسازی آمار">
                          <button
                            type="button"
                            onClick={() => onToggleMetrics(false)}
                            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded transition-colors cursor-pointer"
                            aria-label="مخفیسازی آمار"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Floating Scroll to Bottom Button - Minimal Pill */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 p-2.5 rounded-full bg-zinc-800 text-zinc-300 shadow-xl border border-zinc-700 transition-all hover:bg-zinc-700 cursor-pointer"
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
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            onClick={() => setLightboxMedia(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxMedia.type === 'image' ? (
              <img src={lightboxMedia.url} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Preview" />
            ) : (
              <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
            )}
            
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={() => handleDownloadMedia(lightboxMedia.url, lightboxMedia.type === 'video')}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl shadow-lg border border-zinc-700 transition-colors cursor-pointer text-sm"
              >
                <Download className="w-4 h-4" />
                دانلود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

