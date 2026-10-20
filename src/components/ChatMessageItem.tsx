import {
  DangerCircleOutlineIcon as AlertCircle,
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
  RestartLinearIcon,
  RefreshOutlineIcon as RotateCw,
  StarsMinimalisticBoldIcon as Sparkles,
  VolumeCrossLinearIcon,
  VolumeLoudLinearIcon,
  CloseOutlineIcon as X
} from '@solar-icons/react';
import React, { memo } from 'react';
import { isRtlText, toPersianDigits } from '../lib/persianUtils';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Tooltip } from './Tooltip';

export interface ChatMessageItemProps {
  msg: ChatMessage;
  isStreaming: boolean;
  usePersianDigits: boolean;
  showPerformanceMetrics: boolean;
  stripReasoning: boolean;
  isCopied: boolean;
  isSpeaking: boolean;
  isLoadingTts: boolean;
  feedbackType?: 'up' | 'down';
  isEditing: boolean;
  editingText: string;
  onEditMessage?: (id: string, text: string) => void;
  onRegenerate?: () => void;
  onDismissError?: () => void;
  onToggleMetrics?: (val: boolean) => void;
  onCopyMessage: (msg: ChatMessage) => void;
  onToggleSpeak: (msg: ChatMessage) => void;
  onExportSingleMessage: (msg: ChatMessage) => void;
  onFeedback: (msgId: string, type: 'up' | 'down') => void;
  onOpenLightbox: (media: { url: string; type: 'image' | 'video' }) => void;
  onDownloadMedia: (url: string, isVideo?: boolean) => void;
  onCancelEdit: () => void;
  onSaveEdit: (msgId: string, text: string) => void;
  onChangeEditText: (text: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = memo(({
  msg,
  isStreaming,
  usePersianDigits,
  showPerformanceMetrics,
  stripReasoning,
  isCopied,
  isSpeaking,
  isLoadingTts,
  feedbackType,
  isEditing,
  editingText,
  onEditMessage,
  onRegenerate,
  onDismissError,
  onToggleMetrics,
  onCopyMessage,
  onToggleSpeak,
  onExportSingleMessage,
  onFeedback,
  onOpenLightbox,
  onDownloadMedia,
  onCancelEdit,
  onSaveEdit,
  onChangeEditText,
}) => {
  const isUser = msg.role === 'user';

  return (
    <div
      id={`message-${msg.id}`}
      className={`group flex flex-col gap-1.5 ${
        isUser ? 'w-fit max-w-[85%] sm:max-w-[75%] mr-auto ml-0 self-end items-end' : 'w-full self-stretch'
      }`}
      dir="rtl"
    >
      {/* Message Bubble */}
      <div
        className={`relative chat-message-bubble transition-all text-right ${
          isUser
            ? 'bg-[var(--color-bubble-user-bg)] text-[var(--color-text-main)] rounded-bubble rounded-bl-sm px-4 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] border border-[var(--color-border-subtle)]'
            : msg.error
            ? 'border border-[var(--color-error-border)] rounded-card p-4 bg-[var(--color-error-bg)] text-[var(--color-error-text)]'
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
                  onClick={onDismissError}
                  className="text-[var(--color-error-text)]/60 hover:text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] p-1.5 rounded-btn transition-colors cursor-pointer shrink-0"
                  title="بستن پیام خطا"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 15-second visual countdown progress bar */}
            <div className="w-full bg-[var(--color-error-bg)] h-1 rounded-full overflow-hidden mt-0.5">
              <div className="bg-[var(--color-error-text)]/50 h-full rounded-full animate-error-progress" />
            </div>

            {!isStreaming && (
              <div className="pt-2 border-t border-red-500/20 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-red-400/70 font-normal">
                  این پیام پس از ۱۵ ثانیه به صورت خودکار پاک می‌شود
                </span>
                <button
                  onClick={onRegenerate}
                  className="bg-[var(--color-error-bg)] hover:bg-[var(--color-error-bg)]/80 text-[var(--color-error-text)] text-xs px-3.5 py-1.5 rounded-btn flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm active:scale-95 ml-auto"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>تلاش مجدد</span>
                </button>
              </div>
            )}
          </div>
        ) : isUser ? (
          isEditing ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={editingText}
                onChange={(e) => onChangeEditText(e.target.value)}
                dir="auto"
                rows={Math.min(6, Math.max(2, editingText.split('\n').length))}
                className="w-full p-3 rounded-input clay-input text-[length:var(--chat-font-size)] [font-family:var(--user-font-family)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-border-strong)] dark:focus:ring-[var(--color-border-strong)] resize-y leading-relaxed font-medium text-[var(--color-text-main)] dark:text-[var(--color-text-main)]"
                autoFocus
                placeholder="ویرایش پیام خود را اینجا بنویسید..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editingText.trim()) {
                      onSaveEdit(msg.id, editingText.trim());
                    }
                  } else if (e.key === 'Escape') {
                    onCancelEdit();
                  }
                }}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 rounded-btn text-xs bg-[var(--color-input-bg)] dark:bg-[var(--color-input-bg)] hover:bg-[var(--color-input-bg)]/80 dark:hover:bg-[var(--color-input-bg)]/80 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] font-medium transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={!editingText.trim() || isStreaming}
                  onClick={() => {
                    if (editingText.trim()) {
                      onSaveEdit(msg.id, editingText.trim());
                    }
                  }}
                  className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white px-3.5 py-1.5 rounded-btn font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
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
                        ? "rounded-card overflow-hidden relative group/media w-24 h-24 sm:w-28 sm:h-28 border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] shrink-0 shadow-sm"
                        : "rounded-card overflow-hidden relative group/media max-w-sm border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] shadow-sm";
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
                              <div className="p-3 bg-[var(--color-accent-primary)]/10 rounded-input text-[var(--color-accent-text)] shrink-0">
                                <FileText className="w-8 h-8" />
                              </div>
                              <div className="flex flex-col text-sm min-w-0">
                                <span className="font-bold truncate text-zinc-800 dark:text-zinc-200">سند ضمیمه شده</span>
                                <span className="text-xs opacity-70 truncate text-zinc-700 dark:text-zinc-400">آماده تحلیل</span>
                              </div>
                            </div>
                          )}
                          {/* Floating Media Actions */}
                          {isMedia && (
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-[var(--color-input-bg)]/80 backdrop-blur-md p-1 rounded-input opacity-0 group-hover/media:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => onOpenLightbox({ url, type: url.startsWith('data:video/') ? 'video' : 'image' })}
                                className="p-1 rounded-btn hover:bg-[var(--color-input-bg)]/20 text-[var(--color-text-main)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
                                title="نمایش تمام‌صفحه"
                              >
                                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDownloadMedia(url, url.startsWith('data:video/'))}
                                className="p-1 rounded-btn hover:bg-[var(--color-input-bg)]/20 text-[var(--color-text-main)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
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
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 my-2 rounded-card clay-card relative overflow-hidden group max-w-md w-full animate-fadeIn">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                <div className="relative z-10 w-12 h-12 rounded-input clay-surface flex items-center justify-center mb-4 border border-[var(--color-border-strong)]">
                  <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
                </div>
                <h4 className="relative z-10 font-medium text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                  در حال تولید تصویر...
                </h4>
                <div className="relative z-10 flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-badge bg-[var(--color-text-dim)] animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1.5 h-1.5 rounded-badge bg-[var(--color-text-dim)] animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-badge bg-[var(--color-text-dim)] animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            ) : msg.isStreaming && !msg.content ? (
              <div className="flex items-center gap-2 p-4 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] animate-pulse">
                <div className="w-2.5 h-2.5 bg-[var(--color-text-dim)] rounded-badge animate-bounce" />
                <div className="w-2.5 h-2.5 bg-[var(--color-text-dim)] rounded-badge animate-bounce [animation-delay:0.2s]" />
                <div className="w-2.5 h-2.5 bg-[var(--color-text-dim)] rounded-badge animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] mr-2">در حال پردازش و تولید پاسخ...</span>
              </div>
            ) : (
              <>
                {msg.imageUrl && (
                  <div className="max-w-md my-2">
                    <div className="rounded-card overflow-hidden relative group/media border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] w-full">
                      <img
                        src={msg.imageUrl}
                        alt="Generated"
                        className="w-full object-cover max-h-96 transition-transform duration-300 group-hover/media:scale-[1.02]"
                      />
                      {/* Floating Media Actions for AI Generated Image */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[var(--color-input-bg)]/80 backdrop-blur-md p-1 rounded-input opacity-0 group-hover/media:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onOpenLightbox({ url: msg.imageUrl!, type: 'image' })}
                          className="p-1.5 rounded-btn hover:bg-[var(--color-input-bg)]/20 text-[var(--color-text-main)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
                          title="نمایش تمام‌صفحه"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadMedia(msg.imageUrl!)}
                          className="p-1.5 rounded-btn hover:bg-[var(--color-input-bg)]/20 text-[var(--color-text-main)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
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
                    stripReasoning={stripReasoning}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Single Unified Bottom Container */}
      <div className="flex flex-col mt-1.5 pt-1.5 border-t border-[var(--card-border)]/40 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)]">
        {/* Row 1 (Stats Slider) */}
        {!isUser && !msg.error && (msg.modelUsed || showPerformanceMetrics) && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showPerformanceMetrics ? 'max-h-12 opacity-100 mb-1' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto [scrollbar-width:none] whitespace-nowrap text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-400 pb-1">
              {msg.modelUsed && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/20 text-[var(--color-accent-text)] font-mono select-none shrink-0" title="مدل پردازش‌کننده">
                  <Sparkles className="w-3 h-3" />
                  <span dir="ltr">{msg.modelUsed.replace(' (Auto)', '').split('/').pop()}</span>
                </div>
              )}

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md clay-surface shrink-0">
                <span className="text-[var(--color-text-dim)] font-sans">زمان:</span>
                <span className="font-mono text-[var(--color-text-main)] dark:text-[var(--color-text-main)]" dir="ltr">
                  {msg.metrics?.totalTimeMs ? `${(msg.metrics.totalTimeMs / 1000).toFixed(1)}s` : '1.4s'}
                </span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md clay-surface shrink-0">
                <span className="text-[var(--color-text-dim)] font-sans">توکن مصرفی:</span>
                <span className="font-mono text-[var(--color-text-main)] dark:text-[var(--color-text-main)]" dir="ltr">
                  {toPersianDigits(msg.metrics?.exactTotalTokens || msg.metrics?.approxTokens || 340)}
                </span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md clay-surface shrink-0">
                <span className="text-[var(--color-text-dim)] font-sans">هزینه:</span>
                <span className="font-mono text-[var(--color-accent-text)] dark:text-[var(--color-accent-text)]" dir="rtl">
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
              <Tooltip content={isCopied ? 'کپی شد!' : 'کپی'}>
                <button
                  onClick={() => onCopyMessage(msg)}
                  className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 clay-icon-btn/80 transition-colors cursor-pointer"
                  aria-label="کپی متن پیام"
                >
                  {isCopied ? (
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
                  className="p-1.5 rounded-btn text-[var(--color-text-main)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 dark:hover:bg-[var(--color-accent-primary)]/10 transition-colors cursor-pointer"
                  aria-label="بازگشت متن به کادر پیام"
                >
                  <RestartLinearIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            )}

            {!isUser && !msg.error && (
              <>
                <Tooltip content={isLoadingTts ? 'در حال آماده‌سازی صوت...' : isSpeaking ? 'توقف خوانش' : 'خواندن صوتی'}>
                  <button
                    onClick={() => onToggleSpeak(msg)}
                    className={`p-1.5 rounded-btn transition-colors cursor-pointer ${
                      isSpeaking || isLoadingTts
                        ? 'text-[var(--color-accent-text)] bg-[var(--color-accent-primary)]/15'
                        : 'text-[var(--color-text-main)] dark:text-[var(--color-text-main)] clay-icon-btn/80'
                    }`}
                    aria-label={isSpeaking ? 'توقف خوانش متن' : 'خواندن صوتی متن پیام'}
                  >
                    {isLoadingTts ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : isSpeaking ? (
                      <VolumeCrossLinearIcon className="w-4 h-4 animate-pulse" />
                    ) : (
                      <VolumeLoudLinearIcon className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>

                <Tooltip content="خروجی Markdown">
                  <button
                    onClick={() => onExportSingleMessage(msg)}
                    className="p-1.5 rounded-btn text-[var(--color-text-main)] hover:text-[var(--color-text-main)] clay-icon-btn/80 transition-colors cursor-pointer"
                    aria-label="دانلود خروجی متن به صورت فایل مارک‌داون"
                  >
                    <DownloadMinimalisticLinearIcon className="w-4 h-4" />
                  </button>
                </Tooltip>

                <Tooltip content="پاسخ خوب بود">
                  <button
                    onClick={() => onFeedback(msg.id, 'up')}
                    className={`p-1.5 rounded-btn transition-colors cursor-pointer ${
                      feedbackType === 'up'
                        ? 'text-[var(--color-accent-text)] bg-[var(--color-accent-primary)]/15'
                        : 'text-[var(--color-text-main)] dark:text-[var(--color-text-main)] clay-icon-btn/80'
                    }`}
                    aria-label="ثبت بازخورد مثبت برای پاسخ"
                  >
                    {feedbackType === 'up' ? <LikeBoldIcon className="w-4 h-4 text-[var(--color-accent-text)]" /> : <LikeLinearIcon className="w-4 h-4" />}
                  </button>
                </Tooltip>

                <Tooltip content="پاسخ بد بود">
                  <button
                    onClick={() => onFeedback(msg.id, 'down')}
                    className={`p-1.5 rounded-btn transition-colors cursor-pointer ${
                      feedbackType === 'down'
                        ? 'text-rose-400 bg-rose-500/15'
                        : 'text-[var(--color-text-main)] dark:text-[var(--color-text-main)] clay-icon-btn/80'
                    }`}
                    aria-label="ثبت بازخورد منفی برای پاسخ"
                  >
                    {feedbackType === 'down' ? <DislikeBoldIcon className="w-4 h-4 text-rose-400" /> : <DislikeLinearIcon className="w-4 h-4" />}
                  </button>
                </Tooltip>

                {!isStreaming && (
                  <Tooltip content="تولید مجدد پاسخ">
                    <button
                      onClick={onRegenerate}
                      className="p-1.5 rounded-btn text-[var(--color-text-main)] dark:text-[var(--color-text-main)] clay-icon-btn/80 transition-colors cursor-pointer"
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
                className="p-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)] clay-icon-btn/80 rounded-btn transition-colors cursor-pointer mr-auto shrink-0"
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
});

ChatMessageItem.displayName = 'ChatMessageItem';
