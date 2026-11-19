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

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'راهنمایی لازم ارائه شد.',
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
          <div className="w-9 h-9 rounded-xl clay-btn flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs sm:text-sm text-[var(--text-main)]">مشاور خرید هوش مصنوعی</h3>
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
                    ? 'clay-btn-primary text-white rounded-br-xs font-medium'
                    : 'flex-1 clay-surface border border-[var(--card-border)] rounded-bl-xs text-[var(--text-main)] shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

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
                          <span className="text-xs font-black text-[var(--color-accent-primary)] block mt-1 font-mono">
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
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-5 left-4 sm:left-5 z-50 animate-slideUpScale">
          <button
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl clay-btn-primary flex items-center gap-2 sm:gap-2.5 text-white font-bold text-xs sm:text-sm shadow-2xl hover:scale-105 transition-all cursor-pointer group"
            title="مشاوره رایگان خرید اکانت"
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-yellow-300 animate-pulse" />
            </div>
            <span>مشاور هوشمند خرید</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-emerald-500 text-[10px] text-white font-black">
              رایگان
            </span>
          </button>
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
