import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, User, ShoppingBag, 
  ChevronLeft, MessageSquare, ShieldCheck, Zap, RefreshCw, ArrowLeft,
  Maximize2, Minimize2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toPersianDigits } from '../../lib/persianUtils';
import { useSettingsStore } from '../../store/settingsStore';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  products?: {
    id: number;
    title: string;
    price: number;
    badge?: string;
    category?: string;
    deliveryTime?: string;
  }[];
}

const QUICK_QUESTIONS = [
  'برای برنامه‌نویسی و پایتون کدوم اکانت بهتره؟',
  'تفاوت اکانت اختصاصی با اشتراکی چیه؟',
  'نحوه تحویل و گارانتی به چه صورته؟',
  'بهترین ابزار برای طراحی تصویر و بنر چیه؟'
];

const GrokBotFace: React.FC<{ isHovered: boolean; isBlinking: boolean; isLoading: boolean }> = ({
  isHovered,
  isBlinking,
  isLoading
}) => {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none">
      {/* Eye Left */}
      <div 
        className={`w-2.5 h-4.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9),0_0_18px_rgba(6,182,212,0.6)] transition-all duration-200 transform ${
          isBlinking ? 'scale-y-[0.1]' : isHovered ? 'scale-y-75 -rotate-12 -translate-y-0.5' : 'scale-y-100'
        } ${isLoading ? 'animate-pulse' : ''}`}
        style={{ marginRight: '6px' }}
      />
      
      {/* Eye Right */}
      <div 
        className={`w-2.5 h-4.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9),0_0_18px_rgba(6,182,212,0.6)] transition-all duration-200 transform ${
          isBlinking ? 'scale-y-[0.1]' : isHovered ? 'scale-y-75 rotate-12 -translate-y-0.5' : 'scale-y-100'
        } ${isLoading ? 'animate-pulse' : ''}`}
        style={{ marginLeft: '6px' }}
      />

      {/* Happy Smile when hovered */}
      {isHovered && (
        <div className="absolute bottom-0 w-3.5 h-1.5 border-b-2 border-cyan-400 rounded-full animate-fade-in shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
      )}
    </div>
  );
};

const SPEECH_PROMPTS = [
  {
    title: 'سلام! دنبال چه اکانتی هستی؟ 👋',
    subtitle: 'مشاوره رایگان و انتخاب هوشمند ابزار',
    chips: [
      { label: '💻 برنامه‌نویسی', prompt: 'برای برنامه‌نویسی و پایتون کدوم اکانت بهتره؟' },
      { label: '🎨 تولید تصویر', prompt: 'بهترین ابزار برای طراحی تصویر و بنر چیه؟' }
    ]
  },
  {
    title: 'تخفیف‌ها و اکانت‌های ویژه ✨',
    subtitle: 'تحویل فوری روی ایمیل شخصی با گارانتی',
    chips: [
      { label: '⚡ تحویل فوری', prompt: 'کدام محصولات تحویل آنی و فوری دارند؟' },
      { label: '🛡️ تفاوت پلن‌ها', prompt: 'تفاوت اکانت اختصاصی با اشتراکی چیه؟' }
    ]
  }
];

interface ShoppingAdvisorWidgetProps {
  currentProductId?: number;
  defaultOpen?: boolean;
  isEmbedded?: boolean;
  onSelectProduct?: (product: any) => void;
}

export const ShoppingAdvisorWidget: React.FC<ShoppingAdvisorWidgetProps> = ({
  currentProductId,
  defaultOpen = false,
  isEmbedded = false,
  onSelectProduct
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  // Auto-detect product ID from URL if user is viewing a product page
  const routeProductId = React.useMemo(() => {
    const match = location.pathname.match(/\/store\/product\/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }, [location.pathname]);

  const activeProductId = currentProductId || routeProductId;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shopping_advisor_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('shopping_advisor_expanded', String(next));
      } catch {}
      return next;
    });
  };
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Grok-Bot Companion State
  const [isBotHovered, setIsBotHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);

  // Periodic Blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Proactive Speech Bubble Timer
  useEffect(() => {
    if (isEmbedded || isOpen || isBubbleDismissed) return;

    const timer = setTimeout(() => {
      setShowSpeechBubble(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [isOpen, isEmbedded, isBubbleDismissed]);

  // Auto-hide speech bubble after 8 seconds unless hovered
  useEffect(() => {
    if (!showSpeechBubble || isBotHovered) return;
    const hideTimer = setTimeout(() => {
      setShowSpeechBubble(false);
      setBubbleIndex(prev => (prev + 1) % SPEECH_PROMPTS.length);
    }, 8000);
    return () => clearTimeout(hideTimer);
  }, [showSpeechBubble, isBotHovered]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'سلام! 👋 من مشاور هوشمند فروشگاه هستم. برای چه کاری (برنامه‌نویسی، تولید محتوا، طراحی عکس، ترید یا کارهای دانشگاهی) نیاز به ابزار یا اکانت هوش مصنوعی دارید تا بهترین گزینه را به شما پیشنهاد دهم؟'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isEmbedded]);

  useEffect(() => {
    if (isOpen && !isEmbedded) {
      inputRef.current?.focus();
    }
  }, [isOpen, isEmbedded]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messagesRef.current.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/store/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          currentProductId: activeProductId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ارتباط با مشاور هوشمند');
      }

      const botContent = (data.reply || 'راهنمایی لازم ارائه شد.')
        .replace(/\*\*([^*]+)\*\*/g, '($1)')
        .replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1($2)$3')
        .replace(/\*\*/g, '');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botContent,
        products: data.products && data.products.length > 0 ? data.products : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'متأسفانه در حال حاضر ارتباط برقرار نشد. لطفاً چند لحظه دیگر دوباره پیام دهید یا برای راهنمایی فوری به تلگرام ما پیام دهید.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Global event listener to open advisor widget from anywhere in the app
  useEffect(() => {
    const handleOpen = (e?: any) => {
      setIsOpen(true);
      if (e?.detail?.prompt) {
        handleSendMessage(e.detail.prompt);
      }
    };
    window.addEventListener('open-advisor-widget', handleOpen);
    return () => window.removeEventListener('open-advisor-widget', handleOpen);
  }, [activeProductId]);

  // Listen for ?advisor=open or ?prompt= in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('advisor') === 'open') {
      setIsOpen(true);
      const incomingPrompt = params.get('prompt');
      params.delete('advisor');
      if (incomingPrompt) {
        params.delete('prompt');
        handleSendMessage(incomingPrompt);
      }
      const newQuery = params.toString();
      const newUrl = location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location.search, location.pathname, activeProductId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProductClick = (prod: any) => {
    if (onSelectProduct) {
      onSelectProduct(prod);
    } else {
      navigate(`/store/product/${prod.id}`);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptParam = params.get('prompt');
    if (promptParam && promptParam.trim()) {
      if (!isOpen && !isEmbedded) setIsOpen(true);
      handleSendMessage(promptParam.trim());
      params.delete('prompt');
      const newQuery = params.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Chat Body Content
  const chatContent = (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--card-bg)] text-[var(--text-main)]">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 !rounded-full rounded-full aspect-square bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center shrink-0 border border-indigo-400/40 shadow-xs">
            <GrokBotFace isHovered={false} isBlinking={isBlinking} isLoading={loading} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs sm:text-sm text-[var(--text-main)]">دستیار هوشمند خرید Dastyar</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-dim)]">پاسخگوی آنلاین و راهنمای انتخاب اکانت</p>
          </div>
        </div>
        {!isEmbedded && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleExpanded}
              className="w-8 h-8 rounded-full clay-icon-btn flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors hidden sm:flex cursor-pointer"
              title={isExpanded ? 'کوچک‌نمایی پنجره' : 'بزرگ‌نمایی پنجره'}
              aria-label={isExpanded ? 'کوچک‌نمایی' : 'بزرگ‌نمایی'}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full clay-icon-btn flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              title="بستن پنجره مشاور"
              aria-label="بستن پنجره مشاور"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 custom-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex items-start gap-2.5 ${m.role === 'user' ? 'max-w-[85%]' : 'w-full'} min-w-0`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot size={14} />
                </div>
              )}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-7 min-w-0 break-words [overflow-wrap:anywhere] ${
                  m.role === 'user'
                    ? 'bg-[var(--bubble-user-bg)] text-[var(--text-main)] border border-[var(--border-strong)] rounded-bl-xs font-medium shadow-xs'
                    : 'flex-1 clay-surface border border-[var(--card-border)] rounded-br-xs text-[var(--text-main)] shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {m.content.replace(/\*\*([^*]+)\*\*/g, '($1)').replace(/\*\*/g, '')}
                </p>

                {/* Recommended Products Inside Bot Bubble */}
                {m.products && m.products.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[var(--card-border)]/60 space-y-2.5">
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 block">
                      پیشنهاد متناسب با نیاز شما:
                    </span>
                    {m.products.map(prod => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl clay-card border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:scale-[1.01] transition-transform"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-[var(--text-main)]">{prod.title}</h4>
                            {prod.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-black text-[var(--color-accent-primary)] block mt-1 font-price">
                            {usePersianDigits ? toPersianDigits(prod.price.toLocaleString('fa-IR')) : prod.price.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                        <button
                          onClick={() => handleProductClick(prod)}
                          className="px-3.5 py-1.5 clay-btn-primary font-bold text-xs rounded-xl shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 transition-all w-full sm:w-auto"
                        >
                          <ShoppingBag size={13} />
                          <span>مشاهده و خرید</span>
                          <ArrowLeft size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs p-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
              <Bot size={13} />
            </div>
            <div className="flex items-center gap-1 p-2.5 rounded-2xl clay-surface text-xs font-bold text-[var(--text-muted)]">
              <span className="inline-block animate-bounce">●</span>
              <span className="inline-block animate-bounce [animation-delay:0.2s]">●</span>
              <span className="inline-block animate-bounce [animation-delay:0.4s]">●</span>
              <span className="ms-1.5 text-[11px]">در حال بررسی کاتالوگ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      {messages.length <= 2 && (
        <div className="p-2 px-3 border-t border-[var(--card-border)]/40 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0 bg-[var(--card-bg)]/50">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full clay-btn shrink-0 text-[var(--text-main)] hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 border-t border-[var(--card-border)] bg-[var(--card-bg)] shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="سوال خود درباره انتخاب اکانت یا ابزار را بنویسید..."
            className="flex-1 clay-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm outline-none transition-all placeholder:text-[var(--text-dim)]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl clay-btn-primary flex items-center justify-center text-white shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:scale-105 transition-all cursor-pointer"
            aria-label="ارسال پیام"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  // If embedded in a dedicated page
  if (isEmbedded) {
    return (
      <div className="w-full h-[620px] max-h-[80vh] clay-card-thick rounded-3xl overflow-hidden shadow-xl border border-[var(--card-border)] flex flex-col">
        {chatContent}
      </div>
    );
  }

  // Floating Widget Mode
  return (
    <>
      {/* Floating Grok-Bot Interactive Companion */}
      {!isOpen && (
        <div 
          className="fixed bottom-5 left-4 sm:left-6 z-50 select-none flex flex-col items-start"
          onMouseEnter={() => {
            setIsBotHovered(true);
            if (!isBubbleDismissed) setShowSpeechBubble(true);
          }}
          onMouseLeave={() => setIsBotHovered(false)}
        >
          {/* Smart Speech Bubble */}
          {showSpeechBubble && (
            <div className="mb-3 w-[260px] sm:w-[290px] p-3.5 rounded-2xl clay-card-thick backdrop-blur-2xl bg-white/95 dark:bg-zinc-900/95 shadow-2xl border border-indigo-200/80 dark:border-indigo-600/40 animate-slideUpScale relative">
              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeechBubble(false);
                  setIsBubbleDismissed(true);
                }}
                className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full clay-surface flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs cursor-pointer transition-colors"
                title="بستن پیام"
              >
                <X size={12} />
              </button>

              <div className="cursor-pointer" onClick={() => setIsOpen(true)}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">مشاور آنلاین هوش مصنوعی</span>
                </div>
                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 mb-0.5">
                  {SPEECH_PROMPTS[bubbleIndex].title}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2.5 font-medium">
                  {SPEECH_PROMPTS[bubbleIndex].subtitle}
                </p>
              </div>

              {/* Quick Action Chips */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/10">
                {SPEECH_PROMPTS[bubbleIndex].chips.map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(true);
                      handleSendMessage(chip.prompt);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl clay-btn text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-center truncate cursor-pointer shadow-xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Speech Bubble Arrow Down */}
              <div className="absolute -bottom-2 left-6 w-3.5 h-3.5 rotate-45 bg-white dark:bg-zinc-900 border-r border-b border-indigo-200/80 dark:border-indigo-600/40" />
            </div>
          )}

          {/* Grok-Bot Main Orb Trigger */}
          <div className="relative animate-grok-float">
            {/* Outer Pulsing Halo Ring */}
            <div className="absolute -inset-1.5 !rounded-full rounded-full border-2 border-indigo-500/40 dark:border-indigo-400/30 animate-grok-ring pointer-events-none" />

            {/* Glowing Online Status Beacon */}
            <div className="absolute -top-0.5 -right-0.5 z-20 w-4 h-4 !rounded-full rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 shadow-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>

            {/* Main Interactive Bot Button - Guaranteed 100% Circular & High Contrast */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 !rounded-full rounded-full aspect-square bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 border-2 border-indigo-400/60 dark:border-indigo-400/40 shadow-[0_10px_30px_rgba(79,70,229,0.45)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.7)] flex items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-300 transform hover:scale-110 active:scale-95 group z-10"
              title="گفتگو با مشاور هوشمند خرید"
            >
              {/* Internal Glass Highlight */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-full" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-indigo-500/20 to-transparent pointer-events-none rounded-b-full" />

              {/* GrokBot Interactive Cyber Face */}
              <GrokBotFace 
                isHovered={isBotHovered} 
                isBlinking={isBlinking} 
                isLoading={loading} 
              />
            </button>
          </div>
        </div>
      )}

      {/* Floating Drawer / Card */}
      {isOpen && (
        <div 
          className={`fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-50 w-[calc(100vw-24px)] sm:w-[460px] ${
            isExpanded ? 'sm:!w-[680px]' : ''
          } h-[85dvh] sm:h-[600px] ${
            isExpanded ? 'sm:!h-[680px]' : ''
          } max-h-[88vh] clay-modal rounded-3xl overflow-hidden shadow-2xl border border-[var(--card-border)] animate-slideUpScale flex flex-col transition-all duration-300 ease-in-out`}
        >
          {chatContent}
        </div>
      )}
    </>
  );
};
