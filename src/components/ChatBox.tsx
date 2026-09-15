import {
  DangerCircleOutlineIcon as AlertCircle,
  AltArrowDownOutlineIcon as ArrowDown,
  CheckCircleOutlineIcon as Check,
  CopyLinearIcon,
  DislikeBoldIcon,
  DislikeLinearIcon,
  DownloadOutlineIcon as Download,
  DownloadMinimalisticLinearIcon,
  EyeClosedOutlineIcon as EyeOff,
  EyeOutlineIcon as Eye,
  DocumentTextOutlineIcon as FileText,
  LikeBoldIcon,
  LikeLinearIcon,
  MaximizeSquareOutlineIcon as Maximize2,
  PenLinearIcon,
  RestartLinearIcon,
  RefreshOutlineIcon as RotateCw,
  StarsMinimalisticBoldIcon as Sparkles,
  VolumeCrossLinearIcon,
  VolumeLoudLinearIcon,
  CloseOutlineIcon as X,
  Code2OutlineIcon,
  StarsOutlineIcon,
  BrainOutlineIcon
} from '@solar-icons/react';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { isRtlText, toPersianDigits } from '../lib/persianUtils';
import { SpeakController, speakText } from '../lib/tts';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';

import { ChatMessage } from '../types';
import { ModelDetails } from './CustomProviderCards';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Tooltip } from './Tooltip';

export const getModelIntro = (modelName: string, details: ModelDetails) => {
  const lower = modelName.toLowerCase();
  
  if (lower.includes('lfm') || lower.includes('liquid')) {
    return {
      title: 'مدل نوین چندوجهی LFM (Liquid Foundation Model)',
      bio: 'من مدل هوشمند LFM از شرکت Liquid AI هستم. برای پردازش سریع، انجام محاسبات پویا و عملکرد بهینه در طیف گسترده‌ای از وظایف طراحی شده‌ام.',
      highlight: 'پاسخ‌دهی سریع و چندمنظوره',
    };
  }
  if (lower.includes('r1') || (details.isReasoning && lower.includes('deepseek'))) {
    return {
      title: 'مدل استدلال عمیق DeepSeek R1',
      bio: 'من مدل تخصصی استدلال DeepSeek R1 هستم. با استفاده از زنجیره تفکر گام‌به‌گام (Chain of Thought)، در حل مسائل پیچیده ریاضی، الگوریتم‌های سنگین و منطق عمیق تخصص دارم.',
      highlight: 'استدلال عمیق و منطق پیشرفته',
    };
  }
  if (lower.includes('deepseek') || lower.includes('v3')) {
    return {
      title: 'دستیار همه‌منظوره DeepSeek V3',
      bio: 'من مدل پرچمدار DeepSeek V3 هستم؛ دارای تخصص بالا در برنامه‌نویسی، نگارش متون روان فارسی و پاسخ‌دهی به پرسش‌های علمی و عمومی.',
      highlight: 'برنامه‌نویسی و دانش جامع',
    };
  }
  if (lower.includes('sonnet') || lower.includes('claude-3-5') || lower.includes('claude-3.5') || lower.includes('claude-3.7')) {
    return {
      title: 'دستیار ارشد Claude (Anthropic)',
      bio: 'من مدل Claude هستم؛ با درک عمیق ادبیات فارسی، توانایی استثنایی در کدنویسی، تحلیل اسناد و فایل‌های تصویری در خدمت شما هستم.',
      highlight: 'نگارش عالی و تحلیل عمیق',
    };
  }
  if (lower.includes('gpt-4o') || lower.includes('chatgpt') || lower.includes('gpt-5') || lower.includes('o3') || lower.includes('o1')) {
    return {
      title: 'مدل هوشمند پیشرفته OpenAI',
      bio: 'من مدل هوش مصنوعی چندوجهی OpenAI هستم؛ بهینه‌سازی‌شده برای تولید کد، حل مسئله، خلاصه‌سازی و درک متن و تصویر.',
      highlight: 'چندوجهی و حل مسئله',
    };
  }
  if (lower.includes('qwen') && (lower.includes('coder') || details.isCoding)) {
    return {
      title: 'توسعه‌دهنده تخصصی Qwen Coder',
      bio: 'من مدل Qwen Coder هستم؛ آموزش‌دیده بر روی تریلیون‌ها خط کد جهت معماری، ریفکتورینگ و حل چالش‌های برنامه‌نویسی در تمامی زبان‌ها.',
      highlight: 'برنامه‌نویسی اختصاصی و دیباگ',
    };
  }
  if (lower.includes('llama')) {
    return {
      title: 'مدل متن‌باز قدرتمند Meta Llama 3',
      bio: 'من مدل متن‌باز Llama از شرکت Meta هستم؛ توانمند در مکالمه طبیعی، درک زبان فارسی و پاسخگویی به گستره وسیعی از موضوعات.',
      highlight: 'زبان طبیعی و درک مفهومی',
    };
  }
  if (lower.includes('gemini') || lower.includes('gemma')) {
    return {
      title: 'مدل نسل جدید Google Gemini',
      bio: 'من مدل چندوجهی Google Gemini هستم؛ مجهز به حافظه طولانی، درک سریع چندرسانه‌ای و سرعت تولید بالا.',
      highlight: 'حافظه وسیع و سرعت بالا',
    };
  }

  return {
    title: details.providerLabel || modelName || 'دستیار هوش مصنوعی',
    bio: details.description || 'آماده پاسخگویی به سوالات، تحلیل متون، کدنویسی و پردازش درخواست‌های شما به زبان فارسی.',
    highlight: details.tags?.[0]?.label || 'پاسخ‌دهی همه‌منظوره',
  };
};

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
  let activeGlowColor = 'zinc';
  
  if (routingState === 'coding') {
    activeModel = modelCoding;
    ActiveIcon = Code2OutlineIcon;
    activeGlowColor = 'zinc';
  } else if (routingState === 'vision') {
    activeModel = modelVision;
    ActiveIcon = Eye;
    activeGlowColor = 'zinc';
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
      <div className="flex-1 h-[1.5px] mx-2 sm:mx-4 relative bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full shrink min-w-[30px] flex justify-start">
        {routingState && (
          <div className="h-full bg-zinc-500 dark:bg-zinc-400 rounded-full animate-fill-line-ltr w-0" />
        )}
      </div>

      {/* 2. Modality Node (Center) */}
      <div className={`w-6 h-6 sm:w-8 sm:h-8 z-20 shrink-0 flex items-center justify-center transition-all duration-500 delay-100 relative ${routingState ? 'scale-110 text-zinc-700 dark:text-zinc-300' : 'opacity-40 grayscale'}`}>
        <ActiveIcon className="w-full h-full" />
      </div>

      {/* Connection Line 2 (Modality to Model) */}
      <div className="flex-1 h-[1.5px] mx-2 sm:mx-4 relative bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full shrink min-w-[30px] flex justify-start">
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

export const ChatBox: React.FC = React.memo(() => {
  const { settings, updateSettings } = useSettingsStore();
  const { conversations, activeId, isStreaming, routingState, editMessage, regenerate, setActiveError } = useChatStore();
  const conversation = conversations.find((c) => c.id === activeId) || null;
  const usePersianDigits = settings.appearance.persianNumerals;
  const showPerformanceMetrics = settings.tools.showPerformanceMetrics;
  const onEditMessage = editMessage;
  const onRegenerate = regenerate;
  const onDismissError = () => setActiveError(null);
  const onToggleMetrics = (val: boolean) => updateSettings((s) => ({ ...s, tools: { ...s.tools, showPerformanceMetrics: val } }));

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
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';

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
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[22px] rounded-bl-[4px] px-5 py-3 shadow-sm'
                      : msg.error
                      ? 'border border-red-500/30 rounded-2xl p-4 bg-red-500/5 text-red-400'
                      : 'text-zinc-800 dark:text-zinc-200 border-none bg-transparent py-2'
                  }`}
                >
                  {msg.error ? (
                    <div className="flex flex-col gap-3 relative overflow-hidden animate-fadeIn">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                          <div>
                            <p className="font-bold mb-1 text-sm text-red-400">عدم برقراری ارتباط با مدل هوش مصنوعی</p>
                            <p className="text-[13px] leading-relaxed text-red-300/90">{msg.errorMessage || msg.content}</p>
                          </div>
                        </div>
                        {onDismissError && (
                          <button
                            type="button"
                            onClick={() => setActiveError(null)}
                            className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="بستن پیام خطا"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* 15-second visual countdown progress bar */}
                      <div className="w-full bg-red-500/10 h-1 rounded-full overflow-hidden mt-0.5">
                        <div className="bg-red-500/50 h-full rounded-full animate-error-progress" />
                      </div>

                      {!isStreaming && (
                        <div className="pt-2 border-t border-red-500/20 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-red-400/70 font-normal">
                            این پیام پس از ۱۵ ثانیه به صورت خودکار پاک می‌شود
                          </span>
                          <button
                            onClick={onRegenerate}
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm active:scale-95 ml-auto"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>تلاش مجدد</span>
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
                          className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[length:var(--chat-font-size)] [font-family:var(--user-font-family)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 resize-y leading-relaxed font-medium text-zinc-800 dark:text-zinc-200"
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
                            className="px-3 py-1.5 rounded-xl text-xs bg-black/5 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-400 font-medium transition-all cursor-pointer"
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
                        {(() => {
                          const urls = msg.imageUrl ? [msg.imageUrl] : [];
                          if (urls.length === 0) return null;
                          const isMulti = urls.length > 1;
                          return (
                            <div className="flex flex-wrap gap-2">
                              {urls.map((url, i) => {
                                const isMedia = url.startsWith('data:image/') || url.startsWith('data:video/');
                                const wrapperClass = (isMulti && isMedia)
                                  ? "rounded-2xl overflow-hidden relative group/media w-24 h-24 sm:w-28 sm:h-28 border border-zinc-300 dark:border-zinc-700 bg-black/40 shrink-0 shadow-sm"
                                  : "rounded-2xl overflow-hidden relative group/media max-w-sm border border-zinc-300 dark:border-zinc-700 bg-black/40 shadow-sm";
                                const imgClass = (isMulti && isMedia)
                                  ? "w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-[1.1]"
                                  : "w-full object-cover max-h-72 transition-transform duration-300 group-hover/media:scale-[1.02]";

                                return (
                                  <div key={i} className={wrapperClass}>
                                    {url.startsWith('data:image/') ? (
                                      <img src={url} alt={`Attached ${i + 1}`} className={imgClass} />
                                    ) : url.startsWith('data:audio/') ? (
                                      <div className="p-4 w-full flex flex-col gap-2">
                                        <span className="text-sm font-bold px-1 text-zinc-800 dark:text-zinc-200">فایل صوتی ضمیمه شده</span>
                                        <audio controls src={url} className="w-full max-w-sm rounded-lg" dir="ltr" />
                                      </div>
                                    ) : url.startsWith('data:video/') ? (
                                      <video controls={!isMulti} src={url} className={imgClass + " bg-black"} dir="ltr" />
                                    ) : (
                                      <div className="flex items-center gap-3 p-4">
                                        <div className="p-3 bg-blue-500/10 rounded-xl text-sky-400 shrink-0">
                                          <FileText className="w-8 h-8" />
                                        </div>
                                        <div className="flex flex-col text-sm min-w-0">
                                          <span className="font-bold truncate text-zinc-800 dark:text-zinc-200">سند ضمیمه شده</span>
                                          <span className="text-xs opacity-70 truncate text-zinc-700 dark:text-zinc-400">آماده تحلیل</span>
                                        </div>
                                      </div>
                                    )}
                                    {/* Floating Media Actions */}
                                    {(isMedia) && (
                                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl opacity-0 group-hover/media:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => setLightboxMedia({ url, type: url.startsWith('data:video/') ? 'video' : 'image' })}
                                          className="p-1 rounded-lg hover:bg-white/20 text-zinc-700 dark:text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                          title="نمایش تمام‌صفحه"
                                        >
                                          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadMedia(url, url.startsWith('data:video/'))}
                                          className="p-1 rounded-lg hover:bg-white/20 text-zinc-700 dark:text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                          title="دانلود"
                                        >
                                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {msg.content && (
                          <div
                            className={`whitespace-pre-wrap break-words overflow-wrap-anywhere ${
                              isRtlText(msg.content) ? 'text-right' : 'text-left'
                            }`}
                            dir={isRtlText(msg.content) ? 'rtl' : 'ltr'}
                            style={{ unicodeBidi: 'isolate', fontSize: 'var(--chat-font-size)' }}
                          >
                            {msg.content}
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col gap-3">
                      {msg.isStreaming && !msg.imageUrl && msg.isImageGen ? (
                        <div className="flex flex-col items-center justify-center p-6 sm:p-8 my-2 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group max-w-md w-full animate-fadeIn">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                          <div className="relative z-10 w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-lg mb-4 border border-zinc-300 dark:border-zinc-700">
                            <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
                          </div>
                          <h4 className="relative z-10 font-medium text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                            در حال تولید تصویر...
                          </h4>
                          <div className="relative z-10 flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      ) : msg.isStreaming && !msg.content ? (
                        <div className="flex items-center gap-2 p-4 text-zinc-700 dark:text-zinc-400 animate-pulse">
                          <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce" />
                          <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          <span className="text-xs text-zinc-700 dark:text-zinc-500 mr-2">در حال پردازش و تولید پاسخ...</span>
                        </div>
                      ) : (
                        <>
                          {msg.imageUrl && (
                            <div className="max-w-md my-2">
                              <div className="rounded-2xl overflow-hidden relative group/media border border-zinc-300 dark:border-zinc-700 bg-black/40 shadow-xl w-full">
                                <img
                                  src={msg.imageUrl}
                                  alt="Generated"
                                  className="w-full object-cover max-h-96 transition-transform duration-300 group-hover/media:scale-[1.02]"
                                />

                                {/* Floating Media Actions for AI Generated Image */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl opacity-0 group-hover/media:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => setLightboxMedia({ url: msg.imageUrl!, type: 'image' })}
                                    className="p-1.5 rounded-lg hover:bg-white/20 text-zinc-700 dark:text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    title="نمایش تمام‌صفحه"
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadMedia(msg.imageUrl!)}
                                    className="p-1.5 rounded-lg hover:bg-white/20 text-zinc-700 dark:text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    title="دانلود تصویر"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="min-h-[40px] transition-opacity duration-300 opacity-100">
                            <MarkdownRenderer
                              content={msg.content}
                              isStreaming={msg.isStreaming}
                              usePersianDigits={usePersianDigits}
                              stripReasoning={!settings.tools.reasoningMode}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Single Unified Bottom Container */}
                <div className="flex flex-col mt-1.5 pt-1.5 border-t border-zinc-200 dark:border-zinc-800/40 text-xs text-zinc-700 dark:text-zinc-400">
                  
                  {/* Row 1 (Stats Slider) */}
                  {!isUser && !msg.error && (msg.modelUsed || showPerformanceMetrics) && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showPerformanceMetrics ? 'max-h-12 opacity-100 mb-1' : 'max-h-0 opacity-0 mb-0'}`}>
                      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto [scrollbar-width:none] whitespace-nowrap text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-400 pb-1">
                        {msg.modelUsed && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono select-none shrink-0" title="مدل پردازش‌کننده">
                            <Sparkles className="w-3 h-3" />
                            <span dir="ltr">{msg.modelUsed.replace(' (Auto)', '')}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          <span className="text-zinc-500 font-sans">زمان:</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300" dir="ltr">
                            {msg.metrics?.totalTimeMs ? `${(msg.metrics.totalTimeMs / 1000).toFixed(1)}s` : '1.4s'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          <span className="text-zinc-500 font-sans">توکن مصرفی:</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300" dir="ltr">
                            {toPersianDigits(msg.metrics?.exactTotalTokens || msg.metrics?.approxTokens || 340)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          <span className="text-zinc-500 font-sans">هزینه:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400" dir="rtl">
                            {typeof msg.metrics?.costToman === 'number'
                              ? (msg.metrics.costToman === 0 ? 'رایگان' : `${toPersianDigits(msg.metrics.costToman.toLocaleString('fa-IR'))} تومان`)
                              : `$${msg.metrics?.estimatedCostUSD || '0.00012'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Row 2 (Actions): Copy, Audio, Download, Like, Dislike, Regenerate */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-400">
                      {!msg.error && (
                        <Tooltip content={copiedId === msg.id ? 'کپی شد!' : 'کپی'}>
                          <button
                            onClick={() => handleCopyMessage(msg)}
                            className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
                            aria-label="کپی متن پیام"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <CopyLinearIcon className="w-4 h-4" />
                            )}
                          </button>
                        </Tooltip>
                      )}

                      {isUser && !isStreaming && (
                        <Tooltip content="بازگشت متن به کادر پیام">
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('set-chat-input-text', { detail: { text: msg.content } }));
                            }}
                            className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                            aria-label="بازگشت متن به کادر پیام"
                          >
                            <RestartLinearIcon className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {!isUser && !msg.error && (
                        <>
                          <Tooltip content={loadingTtsId === msg.id ? 'در حال آماده‌سازی صوت...' : speakingId === msg.id ? 'توقف خوانش' : 'خواندن صوتی'}>
                            <button
                              onClick={() => handleToggleSpeak(msg)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                speakingId === msg.id || loadingTtsId === msg.id
                                  ? 'text-sky-400 bg-sky-500/15'
                                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/80'
                              }`}
                              aria-label={speakingId === msg.id ? 'توقف خوانش متن' : 'خواندن صوتی متن پیام'}
                            >
                              {loadingTtsId === msg.id ? (
                                <RotateCw className="w-4 h-4 animate-spin" />
                              ) : speakingId === msg.id ? (
                                <VolumeCrossLinearIcon className="w-4 h-4 animate-pulse" />
                              ) : (
                                <VolumeLoudLinearIcon className="w-4 h-4" />
                              )}
                            </button>
                          </Tooltip>

                          <Tooltip content="خروجی Markdown">
                            <button
                              onClick={() => handleExportSingleMessage(msg)}
                              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
                              aria-label="دانلود خروجی متن به صورت فایل مارک‌داون"
                            >
                              <DownloadMinimalisticLinearIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Tooltip content="پاسخ خوب بود">
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                feedback[msg.id] === 'up'
                                    ? 'text-emerald-400 bg-emerald-500/15'
                                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/80'
                              }`}
                              aria-label="ثبت بازخورد مثبت برای پاسخ"
                            >
                              {feedback[msg.id] === 'up' ? <LikeBoldIcon className="w-4 h-4 text-emerald-400" /> : <LikeLinearIcon className="w-4 h-4" />}
                            </button>
                          </Tooltip>

                          <Tooltip content="پاسخ بد بود">
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                feedback[msg.id] === 'down'
                                  ? 'text-rose-400 bg-rose-500/15'
                                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/80'
                              }`}
                              aria-label="ثبت بازخورد منفی برای پاسخ"
                            >
                              {feedback[msg.id] === 'down' ? <DislikeBoldIcon className="w-4 h-4 text-rose-400" /> : <DislikeLinearIcon className="w-4 h-4" />}
                            </button>
                          </Tooltip>

                          {!isStreaming && (
                            <Tooltip content="تولید مجدد پاسخ">
                              <button
                                onClick={onRegenerate}
                                className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
                                aria-label="تولید مجدد پاسخ هوش مصنوعی"
                              >
                                <RestartLinearIcon className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                    
                    {!isUser && !msg.error && onToggleMetrics && (
                      <Tooltip content={showPerformanceMetrics ? "مخفی‌سازی آمار" : "نمایش آمار"}>
                        <button
                          type="button"
                          onClick={() => onToggleMetrics(!showPerformanceMetrics)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 rounded-lg transition-colors cursor-pointer mr-auto shrink-0"
                          aria-label="تغییر وضعیت نمایش آمار"
                        >
                          {showPerformanceMetrics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </Tooltip>
                    )}
                  </div>
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
          className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-20 p-3 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xl border border-zinc-300 dark:border-zinc-700 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-105 cursor-pointer"
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
            className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-white transition-colors cursor-pointer"
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
              <img src={lightboxMedia.url} className="max-w-full max-h-[90dvh] object-contain rounded-xl shadow-2xl" alt="Preview" />
            ) : (
              <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[90dvh] object-contain rounded-xl shadow-2xl" />
            )}
            
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={() => handleDownloadMedia(lightboxMedia.url, lightboxMedia.type === 'video')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-white rounded-xl shadow-lg border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer text-sm"
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
