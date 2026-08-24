import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowUp, 
  Square, 
  Sparkles, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Plus, 
  UploadCloud, 
  Camera, 
  Music, 
  Film, 
  FileText,
  X,
  Cpu,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import { toPersianDigits, isRtlText } from '../lib/persianUtils';
import { estimateTokenCount } from '../lib/tokenOptimizer';
import { Tooltip } from './Tooltip';
import { CameraCaptureModal } from './CameraCaptureModal';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface MessageInputProps {
  onSendMessage: (text: string, imageUrl?: string) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  enterToSend: boolean;
  usePersianDigits: boolean;
  platformMode: 'windows' | 'android';
  onVideoAttached?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  enterToSend,
  usePersianDigits,
  platformMode: _platformMode,
  onVideoAttached,
}) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachedFileMeta, setAttachedFileMeta] = useState<{ name: string; size: string } | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [menuCoords, setMenuCoords] = useState({ bottom: 0, right: 0 });
  const baseTextRef = useRef('');

  // Position floating attachment menu above plus button
  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAttachmentMenuOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuCoords({
        bottom: window.innerHeight - rect.top + 8,
        right: window.innerWidth - rect.right,
      });
      setIsAttachmentMenuOpen(true);
    } else {
      setIsAttachmentMenuOpen(false);
    }
  };

  // Close attachment menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        (!toggleBtnRef.current || !toggleBtnRef.current.contains(event.target as Node))
      ) {
        setIsAttachmentMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAttachmentMenuOpen(false);
      }
    };
    if (isAttachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAttachmentMenuOpen]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const resetAttachments = () => {
    setImagePreview(null);
    setAttachedFileMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Text, Markdown, and Code files -> Extract client-side text
    if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|js|jsx|ts|tsx|css|html|csv|py|sql|sh|xml|yml|yaml)$/i)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setText((prev) => {
            const prefix = prev ? `${prev}\n\n` : '';
            return `${prefix}--- فایل: ${file.name} ---\n${content}\n---------------------\n`;
          });
          resetAttachments();
        }
      };
      reader.readAsText(file);
    } 
    // 2. PDF Documents -> Extract text via PDF.js
    else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم فایل PDF بیش از حد مجاز است (حداکثر ۱۰ مگابایت).');
        resetAttachments();
        e.target.value = '';
        return;
      }
      const extractPdfText = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          if (fullText.trim()) {
            setText((prev) => {
              const prefix = prev ? `${prev}\n\n` : '';
              return `${prefix}--- فایل: ${file.name} ---\n${fullText}\n---------------------\n`;
            });
            resetAttachments();
          } else {
            alert('متنی در این فایل PDF یافت نشد.');
            resetAttachments();
          }
        } catch (err) {
          console.error('PDF extract error:', err);
          alert('خطا در استخراج متن فایل PDF.');
          resetAttachments();
        }
      };
      extractPdfText();
    } 
    // 3. Images -> Compress/Downscale via Canvas (max 1200px, 0.8 quality)
    else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.8);
              setImagePreview(compressed);
            } else {
              setImagePreview(dataUrl);
            }
            setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });
            if (!text.trim()) {
              setText('این تصویر را تحلیل کن و جزئیات آن را توضیح بده.');
            }
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    } 
    // 4. Audio files (.mp3, .wav, .ogg, .m4a)
    else if (file.type.startsWith('audio/')) {
      if (file.size > 15 * 1024 * 1024) {
        alert('حجم فایل صوتی بیش از حد مجاز است (حداکثر ۱۵ مگابایت).');
        resetAttachments();
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });
          if (!text.trim()) {
            setText(`فایل صوتی ضمیمه شده: ${file.name}\nلطفاً این فایل صوتی را بررسی کن.`);
          }
        }
      };
      reader.readAsDataURL(file);
    } 
    // 5. Video files (.mp4, .webm, .mov)
    else if (file.type.startsWith('video/')) {
      if (file.size > 25 * 1024 * 1024) {
        alert('حجم فایل ویدیویی بیش از حد مجاز است (حداکثر ۲۵ مگابایت).');
        resetAttachments();
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });
          if (!text.trim()) {
            setText(`فایل ویدیویی ضمیمه شده: ${file.name}\nلطفاً این ویدیو را بررسی کن.`);
          }
          // Automatically switch model to Gemini for video processing
          onVideoAttached?.();
        }
      };
      reader.readAsDataURL(file);
    } 
    // 6. Generic Binary Documents
    else {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم فایل انتخابی بیش از حد مجاز است (حداکثر ۵ مگابایت).');
        resetAttachments();
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImagePreview(dataUrl);
          setAttachedFileMeta({ name: file.name, size: formatFileSize(file.size) });
          if (!text.trim()) {
            setText(`فایل ضمیمه شده: ${file.name}\nلطفاً محتوای این سند را بررسی کن.`);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Handle camera trigger depending on platform (Mobile vs PC)
  const handleCameraClick = () => {
    setIsAttachmentMenuOpen(false);
    
    // Check if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
      (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);

    if (isMobile) {
      // Mobile: trigger native camera input
      cameraInputRef.current?.click();
    } else {
      // PC / Desktop: open custom live webcam capture modal
      setIsCameraModalOpen(true);
    }
  };

  // Handle image captured from CameraCaptureModal
  const handleCameraModalCapture = (base64Image: string, fileName: string) => {
    setImagePreview(base64Image);
    setAttachedFileMeta({ name: fileName, size: 'تصویر دوربین' });
    if (!text.trim()) {
      setText('این تصویر را تحلیل کن و جزئیات آن را توضیح بده.');
    }
  };

  // Handle Speech Recognition for Persian
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('مرورگر شما از قابلیت تشخیص صوت پشتیبانی نمی‌کند. لطفاً از مرورگر گوگل کروم استفاده کنید.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);
      return;
    }

    try {
      baseTextRef.current = text;
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalSoFar = '';

      recognition.onstart = () => {
        setIsRecording(true);
        finalSoFar = '';
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          finalSoFar = final;
        }

        const currentSpoken = finalSoFar || interim;
        const sep = baseTextRef.current && !baseTextRef.current.endsWith(' ') && currentSpoken ? ' ' : '';
        const combined = baseTextRef.current ? `${baseTextRef.current}${sep}${currentSpoken}` : currentSpoken;
        setText(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('دسترسی به میکروفون مسدود شده است. لطفاً دسترسی به میکروفون را در تنظیمات مرورگر فعال نمایید.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      setIsRecording(false);
      alert('خطا در شروع تایپ صوتی. لطفاً دسترسی به میکروفون را بررسی فرمایید.');
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !imagePreview) || isStreaming) return;
    onSendMessage(text.trim() || 'این فایل پیوست شده را تحلیل کن.', imagePreview || undefined);
    setText('');
    resetAttachments();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (enterToSend && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const isRtl = isRtlText(text);
  const charCount = text.length;
  const canSend = (!!text.trim() || !!imagePreview) && !isStreaming;

  const estimatedTokens = useMemo(() => {
    return estimateTokenCount(text, Boolean(imagePreview || attachedFileMeta));
  }, [text, imagePreview, attachedFileMeta]);

  return (
    <div className="p-2.5 sm:p-4 md:p-5 bg-[var(--bg-main)]/90 border-t border-subtle backdrop-blur-md shrink-0">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Attachment Preview Thumbnail */}
        {imagePreview && (
          <div className="relative inline-flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border border-white/10 shadow-lg animate-fadeIn w-fit max-w-full">
            {imagePreview.startsWith('data:image/') ? (
              <img src={imagePreview} alt="Preview" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-white/20 shrink-0" />
            ) : imagePreview.startsWith('data:audio/') ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-yellow-500/10 flex items-center justify-center">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              </div>
            ) : imagePreview.startsWith('data:video/') ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-purple-500/10 flex items-center justify-center">
                <Film className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/20 shrink-0 bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
            )}
            <div className="flex flex-col text-xs text-inherit pr-1 min-w-0">
              <span className="font-bold text-[var(--accent-text)] truncate">
                {attachedFileMeta?.name || (
                  imagePreview.startsWith('data:image/') ? 'تصویر ضمیمه شده' : 
                  imagePreview.startsWith('data:audio/') ? 'فایل صوتی ضمیمه شده' : 
                  imagePreview.startsWith('data:video/') ? 'فایل ویدیویی ضمیمه شده' : 'فایل ضمیمه شده'
                )}
              </span>
              <span className="text-[10px] sm:text-[11px] opacity-70 truncate">
                {attachedFileMeta ? `حجم: ${attachedFileMeta.size} - آماده تحلیل` : 'آماده برای ارسال و تحلیل هوش مصنوعی'}
              </span>
            </div>
            <button
              type="button"
              onClick={resetAttachments}
              className="p-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors mr-2 sm:mr-3 cursor-pointer shrink-0"
              aria-label="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Frame */}
        <div className={`relative flex items-end gap-2 sm:gap-3 bg-zinc-100 dark:bg-zinc-800/90 rounded-[32px] p-1.5 sm:p-2 shadow-sm border border-zinc-200 dark:border-white/5 transition-all focus-within:ring-2 focus-within:ring-white/10 ${isStreaming ? 'opacity-80' : ''}`}>
          
          {/* Right actions (Attachment, Image Gen) */}
          <div className="flex items-center gap-0.5 pb-0.5 sm:pb-1 border-none outline-none">
            <div className="relative">
              <Tooltip content="افزودن پیوست">
                <button
                  type="button"
                  ref={toggleBtnRef}
                  onClick={handleMenuToggle}
                  disabled={isStreaming}
                  className={`w-10 h-10 flex items-center justify-center rounded-full bg-transparent border-0 outline-none transition-all cursor-pointer ${
                    isAttachmentMenuOpen 
                      ? 'text-zinc-900 dark:text-white bg-zinc-200 dark:bg-white/10' 
                      : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-slate-200 hover:bg-zinc-200 dark:hover:bg-white/5 active:scale-95'
                  }`}
                  aria-label="Add attachment"
                >
                  <Paperclip className="w-5 h-5 transition-transform duration-200" strokeWidth={2} />
                </button>
              </Tooltip>

              {/* Sleek Floating Dark Menu directly above button */}
              {isAttachmentMenuOpen && createPortal(
                <div 
                  ref={menuRef}
                  dir="rtl"
                  style={{ 
                    position: 'fixed', 
                    bottom: `${menuCoords.bottom}px`, 
                    right: `${menuCoords.right}px`, 
                    zIndex: 999999 
                  }}
                  className="w-44 bg-white dark:bg-[#1e1f20] border border-zinc-200 dark:border-[#333333] rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 origin-bottom-right animate-fadeIn"
                >
                  <button 
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsAttachmentMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer text-zinc-700 dark:text-slate-200"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium">بارگذاری فایل</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleCameraClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer text-zinc-700 dark:text-slate-200"
                  >
                    <Camera className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                    <span className="text-xs font-medium">دوربین</span>
                  </button>
                </div>,
                document.body
              )}
            </div>

            <Tooltip content={text.startsWith('/image ') ? 'لغو حالت ساخت تصویر' : 'ساخت تصویر با هوش مصنوعی'}>
              <button
                type="button"
                onClick={() => {
                  if (text.startsWith('/image ')) {
                    setText(text.replace('/image ', ''));
                  } else {
                    setText('/image ' + text);
                  }
                  textareaRef.current?.focus();
                }}
                disabled={isStreaming}
                className={`w-10 h-10 hidden xs:flex items-center justify-center transition-all rounded-full bg-transparent border-0 outline-none ${
                  text.startsWith('/image ')
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 scale-105 opacity-100'
                    : 'text-zinc-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-zinc-200 dark:hover:bg-white/5 active:scale-95'
                }`}
                aria-label="Generate Image"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </Tooltip>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="*/*"
            />
            
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
            />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            dir={isRtl ? 'rtl' : 'ltr'}
            placeholder={isRecording ? 'در حال شنیدن صدای شما... (صحبت کنید)' : 'پیام خود را بنویسید...'}
            rows={1}
            disabled={isStreaming}
            className={`flex-1 w-full max-h-[150px] min-h-[40px] py-2.5 sm:py-3 px-1 sm:px-2 bg-transparent resize-none text-[length:var(--chat-font-size)] [font-family:var(--user-font-family)] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 border-0 border-none outline-none ring-0 shadow-none focus:ring-0 focus:outline-none focus:border-none focus:shadow-none appearance-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-60 leading-relaxed ${isRecording ? 'placeholder:text-red-500 dark:placeholder:text-red-400 placeholder:animate-pulse' : ''}`}
          />

          {/* Left actions (Mic, Clear, Send) */}
          <div className="flex items-center gap-1 pb-0.5 sm:pb-1 pr-1 border-0 border-none outline-none">
            {/* Clear text button */}
            {text.trim() && !isStreaming && (
              <Tooltip content="پاک کردن متن">
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 bg-transparent border-0 outline-none transition-all hover:bg-zinc-200 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
                  aria-label="Clear input"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}

            {/* Voice dictation button */}
            {!text.trim() && !isStreaming && (
              <Tooltip content={isRecording ? 'توقف ضبط صدا' : 'تایپ صوتی به زبان فارسی'}>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  disabled={isStreaming}
                  className={`w-10 h-10 flex items-center justify-center transition-all rounded-full bg-transparent border-0 outline-none active:scale-95 ${
                    isRecording
                      ? 'text-red-500 bg-red-100 dark:bg-red-500/10 animate-pulse'
                      : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-slate-200 hover:bg-zinc-200 dark:hover:bg-white/5'
                  }`}
                  aria-label="Voice input"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </Tooltip>
            )}

            {/* Cancel generation button */}
            {isStreaming && (
              <Tooltip content="توقف تولید پاسخ">
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="w-10 h-10 flex items-center justify-center transition-all rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 bg-transparent border-0 outline-none animate-pulse cursor-pointer"
                  aria-label="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </Tooltip>
            )}

            {/* Send Button */}
            {!isStreaming && (
              <Tooltip content={canSend ? 'ارسال پیام' : 'متنی بنویسید یا فایلی پیوست کنید'}>
                <button
                  type="button"
                  id="send-message-btn"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`w-10 h-10 flex items-center justify-center transition-all rounded-full border-0 outline-none ${
                    canSend
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                      : 'bg-zinc-200 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  }`}
                  aria-label="Send Message"
                >
                  <ArrowUp className="w-5 h-5 stroke-[2]" />
                </button>
              </Tooltip>
            )}
            
            {/* Loading Indicator */}
            {isStreaming && (
              <div className="w-10 h-10 flex items-center justify-center border-0">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Footer info: Disclaimer and Token Footprint Estimator */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] opacity-75 select-none px-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
            <span className="truncate sm:whitespace-normal">پاسخ‌های مدل‌های زبانی را بازبینی کنید. ممکن است خطاهایی وجود داشته باشد.</span>
          </div>

          {(text.trim() || imagePreview || attachedFileMeta) && (
            <div 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-300/50 dark:border-white/10 font-mono text-[10px] select-none"
              title="تعداد تخمینی توکن‌های این پیام بر اساس تحلیل نویسه‌ها و رسانه"
            >
              <Cpu className="w-3 h-3 text-sky-500 shrink-0" />
              <span>~{usePersianDigits ? toPersianDigits(estimatedTokens) : estimatedTokens} توکن تخمینی</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Webcam Snap Modal for PC / Desktop */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraModalCapture}
      />
    </div>
  );
};
