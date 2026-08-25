import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  PaperclipLineDuotoneIcon,
  Microphone2BoldDuotoneIcon,
  Microphone2LineDuotoneIcon,
  StarsMinimalisticBoldDuotoneIcon,
  RestartCircleLineDuotoneIcon,
  CloudUploadLineDuotoneIcon,
  CameraLineDuotoneIcon,
  MusicNoteLineDuotoneIcon,
  VideocameraLineDuotoneIcon,
  DocumentTextLineDuotoneIcon,
  CpuBoltLineDuotoneIcon,
  StopCircleBoldDuotoneIcon
} from '@solar-icons/react';
import { 
  ArrowUp, 
  X,
  Globe
} from 'lucide-react';
import { toPersianDigits, isRtlText } from '../lib/persianUtils';
import { estimateTokenCount } from '../lib/tokenOptimizer';
import { Tooltip } from './Tooltip';
import { CameraCaptureModal } from './CameraCaptureModal';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface MessageInputProps {
  onSendMessage: (text: string, imageUrl?: string, imageUrls?: string[], webSearch?: boolean) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  enterToSend: boolean;
  usePersianDigits: boolean;
  onVideoAttached?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  enterToSend,
  usePersianDigits,
  onVideoAttached,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<{
    id: string; dataUrl: string; mimeType: string; name: string; size: string;
    status: 'processing' | 'ready'; progress: number;
  }[]>([]);
  // Backward compat derived values
  const imagePreview = attachments.find(a => a.status === 'ready')?.dataUrl ?? null;
  const attachedFileMeta = attachments.length > 0 ? { name: attachments[0].name, size: attachments[0].size } : null;
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [sentHistory, setSentHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  
  const holdTimeoutRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

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
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      // Support multiple files from clipboard
      const files = Array.from(e.clipboardData.files);
      files.forEach(file => {
        const fakeEvent = {
          target: { files: [file], value: '' }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(fakeEvent);
      });
    }
  };

  // Helper: add attachment with progress animation then mark ready
  const addAttachmentWithProgress = (id: string, dataUrl: string, mimeType: string, name: string, size: string) => {
    setAttachments(prev => [...prev, { id, dataUrl, mimeType, name, size, status: 'processing' as const, progress: 0 }]);
    const steps = 8;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const p = Math.min(100, Math.round((step / steps) * 100));
      setAttachments(prev => prev.map(a => a.id === id ? { ...a, progress: p } : a));
      if (step >= steps) {
        clearInterval(interval);
        setAttachments(prev => prev.map(a => a.id === id ? { ...a, status: 'ready' as const, progress: 100 } : a));
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachmentId = `att_${Date.now()}_${Math.random().toString(36).slice(2)}`;

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
        }
      };
      reader.readAsText(file);
    } 
    // 2. PDF Documents -> Extract text via PDF.js
    else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم فایل PDF بیش از حد مجاز است (حداکثر ۱۰ مگابایت).');
        e.target.value = '';
        return;
      }
      addAttachmentWithProgress(attachmentId, '', file.type, file.name, formatFileSize(file.size));
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
          removeAttachment(attachmentId);
          if (fullText.trim()) {
            setText((prev) => {
              const prefix = prev ? `${prev}\n\n` : '';
              return `${prefix}--- فایل: ${file.name} ---\n${fullText}\n---------------------\n`;
            });
          } else {
            alert('متنی در این فایل PDF یافت نشد.');
          }
        } catch (err) {
          console.error('PDF extract error:', err);
          alert('خطا در استخراج متن فایل PDF.');
          removeAttachment(attachmentId);
        }
      };
      extractPdfText();
    } 
    // 3. Images -> Compress/Downscale via Canvas (max 1200px, 0.8 quality)
    else if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم تصویر بیش از حد مجاز است (حداکثر ۱۰ مگابایت).');
        e.target.value = '';
        return;
      }
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
              if (width > MAX_DIM) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
            } else {
              if (height > MAX_DIM) { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const compressed = ctx ? (() => { ctx.drawImage(img, 0, 0, width, height); return canvas.toDataURL('image/jpeg', 0.8); })() : dataUrl;
            addAttachmentWithProgress(attachmentId, compressed, 'image/jpeg', file.name, formatFileSize(file.size));
            if (!text.trim()) setText('این تصویر را تحلیل کن و جزئیات آن را توضیح بده.');
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
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addAttachmentWithProgress(attachmentId, dataUrl, file.type, file.name, formatFileSize(file.size));
          if (!text.trim()) setText(`فایل صوتی ضمیمه شده: ${file.name}\nلطفاً این فایل صوتی را بررسی کن.`);
        }
      };
      reader.readAsDataURL(file);
    } 
    // 5. Video files (.mp4, .webm, .mov)
    else if (file.type.startsWith('video/')) {
      if (file.size > 25 * 1024 * 1024) {
        alert('حجم فایل ویدیویی بیش از حد مجاز است (حداکثر ۲۵ مگابایت).');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addAttachmentWithProgress(attachmentId, dataUrl, file.type, file.name, formatFileSize(file.size));
          if (!text.trim()) setText(`فایل ویدیویی ضمیمه شده: ${file.name}\nلطفاً این ویدیو را بررسی کن.`);
          onVideoAttached?.();
        }
      };
      reader.readAsDataURL(file);
    } 
    // 6. Generic Binary Documents
    else {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم فایل انتخابی بیش از حد مجاز است (حداکثر ۵ مگابایت).');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addAttachmentWithProgress(attachmentId, dataUrl, file.type, file.name, formatFileSize(file.size));
          if (!text.trim()) setText(`فایل ضمیمه شده: ${file.name}\nلطفاً محتوای این سند را بررسی کن.`);
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
    const attachmentId = `att_cam_${Date.now()}`;
    addAttachmentWithProgress(attachmentId, base64Image, 'image/jpeg', fileName, 'تصویر دوربین');
    if (!text.trim()) {
      setText('این تصویر را تحلیل کن و جزئیات آن را توضیح بده.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const attachmentId = `att_voice_${Date.now()}`;
          addAttachmentWithProgress(attachmentId, dataUrl, 'audio/webm', 'Voice Message.webm', formatFileSize(audioBlob.size));
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsHoldingMic(true);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('دسترسی به میکروفون مسدود است.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isHoldingMic) {
      mediaRecorderRef.current.stop();
      setIsHoldingMic(false);
    }
  };

  const handlePointerDownMic = () => {
    holdTimeoutRef.current = setTimeout(() => {
      startRecording();
    }, 300); // 300ms hold to start recording memo
  };

  const handlePointerUpMic = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (isHoldingMic) {
      stopRecording();
    } else {
      toggleVoiceRecording();
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
    const readyAttachments = attachments.filter(a => a.status === 'ready' && a.dataUrl);
    const hasContent = !!text.trim() || readyAttachments.length > 0;
    if (!hasContent || isStreaming) return;

    if (text.trim()) {
      setSentHistory(prev => [...prev, text.trim()]);
    }
    setHistoryIndex(-1);

    const imageUrls = readyAttachments.map(a => a.dataUrl);
    const firstImageUrl = imageUrls[0] || undefined;

    onSendMessage(
      text.trim() || 'یک فایل ضمیمه شده است. آن را تحلیل کن.',
      firstImageUrl,
      imageUrls.length > 0 ? imageUrls : undefined,
      webSearchEnabled
    );
    setText('');
    resetAttachments();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const slashCommands = [
    { cmd: '/خلاصه', text: 'متن زیر را در چند خط خلاصه کن:\n' },
    { cmd: '/ترجمه', text: 'متن زیر را به انگلیسی روان ترجمه کن:\n' },
    { cmd: '/کد', text: 'کد زیر را دیباگ کن و مشکلش را توضیح بده:\n' },
    { cmd: '/تصویر', text: '/image ' }
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowUp' && !text.trim() && sentHistory.length > 0) {
      e.preventDefault();
      const newIndex = sentHistory.length - 1;
      setHistoryIndex(newIndex);
      setText(sentHistory[newIndex]);
      return;
    }
    if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex >= sentHistory.length) {
        setHistoryIndex(-1);
        setText('');
      } else {
        setHistoryIndex(newIndex);
        setText(sentHistory[newIndex]);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        if (slashMenuOpen) {
          const filtered = slashCommands.filter(c => c.cmd.startsWith(slashQuery));
          if (filtered.length > 0) {
             const match = filtered[0];
             const words = text.split(' ');
             words.pop();
             setText(words.join(' ') + (words.length > 0 ? ' ' : '') + match.text);
             setSlashMenuOpen(false);
             return;
          }
        }
        if (enterToSend) {
          handleSend();
        }
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const words = val.split(/\s+/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('/')) {
       setSlashQuery(lastWord);
       setSlashMenuOpen(true);
    } else {
       setSlashMenuOpen(false);
    }
  };

  const isRtl = isRtlText(text);
  const canSend = (!!text.trim() || attachments.some(a => a.status === 'ready')) && !isStreaming;

  const estimatedTokens = useMemo(() => {
    // Each media attachment is ~300 tokens; text is calculated per-char
    const mediaTokens = attachments.length * 300;
    return estimateTokenCount(text, false) + mediaTokens;
  }, [text, attachments]);

  return (
    <div className="p-2.5 sm:p-4 md:p-5 bg-[var(--bg-main)]/90 border-t border-subtle backdrop-blur-md shrink-0">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Multi-File Attachment Preview Strip */}
        {attachments.length > 0 && (
          <div className="flex items-end gap-2 overflow-x-auto pb-1 animate-fadeIn scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex-shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-white/20 bg-[var(--card-bg)] shadow-md group"
              >
                {/* Thumbnail */}
                {att.mimeType.startsWith('image/') && att.dataUrl ? (
                  <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                ) : att.mimeType.startsWith('audio/') ? (
                  <div className="w-full h-full flex items-center justify-center bg-yellow-500/10">
                    <MusicNoteLineDuotoneIcon className="w-7 h-7 text-yellow-500" />
                  </div>
                ) : att.mimeType.startsWith('video/') ? (
                  <div className="w-full h-full flex items-center justify-center bg-purple-500/10">
                    <VideocameraLineDuotoneIcon className="w-7 h-7 text-purple-400" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500/10">
                    <DocumentTextLineDuotoneIcon className="w-7 h-7 text-blue-400" />
                  </div>
                )}

                {/* Progress Bar Overlay (during processing) */}
                {att.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-end pb-1 px-1">
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-text)] rounded-full transition-all duration-100"
                        style={{ width: `${att.progress}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/80 mt-0.5">{att.progress}%</span>
                  </div>
                )}

                {/* Filename tooltip on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[8px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {att.name}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                  aria-label="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>

                {/* Ready indicator */}
                {att.status === 'ready' && (
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
                )}
              </div>
            ))}

            {/* Clear all button when multiple */}
            {attachments.length > 1 && (
              <button
                type="button"
                onClick={resetAttachments}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-colors cursor-pointer self-center"
                aria-label="Remove all attachments"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
                  <PaperclipLineDuotoneIcon className="w-5 h-5 transition-transform duration-200" />
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
                    <CloudUploadLineDuotoneIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium">بارگذاری فایل</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleCameraClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer text-zinc-700 dark:text-slate-200"
                  >
                    <CameraLineDuotoneIcon className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
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
                <StarsMinimalisticBoldDuotoneIcon className="w-4 h-4" />
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
          {slashMenuOpen && slashCommands.filter(c => c.cmd.startsWith(slashQuery)).length > 0 && (
            <div className="absolute bottom-full right-0 mb-1 w-full max-w-[200px] bg-white dark:bg-[#1e1f20] border border-zinc-200 dark:border-[#333333] rounded-xl shadow-xl z-[60] flex flex-col p-0.5 animate-fadeIn">
              {slashCommands.filter(c => c.cmd.startsWith(slashQuery)).map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="flex flex-row items-center gap-1.5 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors text-right w-full"
                  onClick={() => {
                     const words = text.split(' ');
                     words.pop();
                     setText(words.join(' ') + (words.length > 0 ? ' ' : '') + c.text);
                     setSlashMenuOpen(false);
                     textareaRef.current?.focus();
                  }}
                >
                  <span className="font-bold text-[11px] text-sky-500 shrink-0 leading-none">{c.cmd}</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate leading-none mt-0.5">{c.text}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            dir={isRtl ? 'rtl' : 'ltr'}
            placeholder={isRecording ? 'در حال شنیدن صدای شما... (صحبت کنید)' : 'پیام خود را بنویسید...'}
            rows={1}
            disabled={isStreaming}
            className={`flex-1 w-full max-h-[150px] min-h-[40px] py-2.5 sm:py-3 px-1 sm:px-2 bg-transparent resize-none text-[length:var(--chat-font-size)] [font-family:var(--user-font-family)] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 border-0 border-none outline-none ring-0 shadow-none focus:ring-0 focus:outline-none focus:border-none focus:shadow-none appearance-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-60 leading-relaxed ${isRecording ? 'placeholder:text-red-500 dark:placeholder:text-red-400 placeholder:animate-pulse' : ''}`}
          />

          {/* Left actions (Mic, Clear, Send) */}
          <div className="flex items-center gap-1 pb-0.5 sm:pb-1 pr-1 border-0 border-none outline-none">
            <Tooltip content={webSearchEnabled ? 'جستجو در وب فعال است' : 'جستجو در وب'}>
                  <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer ${webSearchEnabled ? 'text-sky-500 bg-sky-500/10' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5'}`}
              >
                <Globe className="w-5 h-5" />
              </button>
            </Tooltip>

            {/* Clear text button */}
            {text.trim() && !isStreaming && (
              <Tooltip content="پاک کردن متن">
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 bg-transparent border-0 outline-none transition-all hover:bg-zinc-200 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
                  aria-label="Clear input"
                >
                  <RestartCircleLineDuotoneIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            )}

            {/* Voice dictation button */}
            {!text.trim() && !isStreaming && (
              <Tooltip content={isHoldingMic ? 'در حال ضبط ویس...' : isRecording ? 'توقف تایپ صوتی' : 'تایپ صوتی (کلیک) / ضبط ویس (نگه‌داشتن)'}>
                <button
                  type="button"
                  onPointerDown={handlePointerDownMic}
                  onPointerUp={handlePointerUpMic}
                  onPointerLeave={handlePointerUpMic}
                  disabled={isStreaming}
                  className={`w-10 h-10 flex items-center justify-center transition-all rounded-full bg-transparent border-0 outline-none active:scale-95 ${
                    isRecording || isHoldingMic
                      ? 'text-red-500 bg-red-100 dark:bg-red-500/10 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-slate-200 hover:bg-zinc-200 dark:hover:bg-white/5'
                  }`}
                  aria-label="Voice input"
                >
                  {isRecording ? <Microphone2BoldDuotoneIcon className="w-5 h-5 text-red-500" /> : <Microphone2LineDuotoneIcon className="w-5 h-5" />}
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
                  <StopCircleBoldDuotoneIcon className="w-4 h-4" />
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
                  <ArrowUp className="w-5 h-5" />
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
            <StarsMinimalisticBoldDuotoneIcon className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
            <span className="truncate sm:whitespace-normal">پاسخ‌های مدل‌های زبانی را بازبینی کنید. ممکن است خطاهایی وجود داشته باشد.</span>
          </div>

          {(text.trim() || imagePreview || attachedFileMeta) && (
            <div 
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[10px] select-none transition-colors ${estimatedTokens > 32000 ? 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20' : estimatedTokens > 8000 ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800/80 border-zinc-300/50 dark:border-white/10'}`}
              title="تخمین توکن‌های این پیام بر اساس طول نویسه‌ها و اسناد"
            >
              <CpuBoltLineDuotoneIcon className={`w-3 h-3 shrink-0 ${estimatedTokens > 32000 ? 'text-red-500' : estimatedTokens > 8000 ? 'text-amber-500' : 'text-sky-500'}`} />
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
