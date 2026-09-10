import {
  AlertTriangle,
  ArrowRight,
  Check, Copy,
  Download,
  History,
  Image as ImageIcon,
  RotateCcw,
  Search,
  Send, Sliders,
  Sparkles,
  Trash2, Wand2,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { loadSettings } from '../lib/storage';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';



interface ImageHistory {
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  engine: string;
  timestamp: number;
}

const IMAGE_ENGINES = [
  { id: 'flux', name: 'Flux.1 Realism', tag: 'واقع‌گرایانه', desc: 'خروجی فوق‌العاده باکیفیت، طبیعی و پرجزئیات', tier: 'free' },
  { id: 'sana', name: 'Sana (NVIDIA)', tag: 'فوق‌سریع', desc: 'مدل نسل جدید انویدیا با رزولوشن بالا و سرعت آنی', tier: 'free' },
  { id: 'flux-anime', name: 'Flux Anime', tag: 'رایگان', desc: 'استایل انیمه و نقاشی دیجیتال', tier: 'free' },
  { id: 'flux-3d', name: 'Flux 3D', tag: 'رایگان', desc: 'رندرهای خیره‌کننده سه‌بعدی', tier: 'free' },
  { id: 'turbo', name: 'SDXL Turbo', tag: 'آنی', desc: 'تولید سریع تصاویر', tier: 'free' },
  { id: 'dalle-3', name: 'DALL-E 3', tag: 'ویژه', desc: 'نیازمند API Key (درک متن و هوش بالا)', tier: 'pro' },
  { id: 'imagen-3', name: 'Imagen 3 (Gemini)', tag: 'رسمی', desc: 'نیازمند API Key جمنای (کیفیت استودیو گوگل)', tier: 'pro' },
];

const STYLE_PRESETS = [
  { id: 'none', name: 'بدون استایل', icon: '✨', prompt: '' },
  { id: 'photo', name: 'فوتورئال', icon: '📸', prompt: 'highly detailed photorealistic 8k resolution, cinematic lighting, professional photography' },
  { id: 'cinematic', name: 'سینمایی', icon: '🎬', prompt: 'cinematic film still, anamorphic lens, dramatic moody lighting, 35mm photograph' },
  { id: 'anime', name: 'انیمه', icon: '🌸', prompt: 'vibrant anime style, studio ghibli aesthetic, highly detailed, beautiful illustration' },
  { id: '3d', name: 'رندر سه‌بعدی', icon: '🧸', prompt: 'octane render, unreal engine 5, 3d isometric clay style, smooth lighting' },
  { id: 'cyberpunk', name: 'سایبرپانک', icon: '🌃', prompt: 'cyberpunk neon lights, futuristic city, glowing holographic accents, dark moody atmosphere' },
];

const ASPECT_RATIOS = [
  { id: '1:1', name: 'مربع', icon: '◻️', w: 'w-6', h: 'h-6' },
  { id: '16:9', name: 'سینمایی', icon: '▭', w: 'w-7', h: 'h-4' },
  { id: '9:16', name: 'استوری', icon: '▯', w: 'w-4', h: 'h-7' },
];

// Helper to preload image before rendering in DOM with automatic fallback retry & secure proxy
function preloadImage(url: string, timeoutMs = 45000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (url.startsWith('data:')) {
      return resolve(url);
    }

    const img = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      img.src = '';
      reject(new Error('زمان انتظار برای تولید و بارگذاری تصویر به پایان رسید. لطفاً مجدداً تلاش فرمایید.'));
    }, timeoutMs);

    img.onload = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      resolve(url);
    };

    img.onerror = () => {
      if (isSettled) return;
      // If direct CDN connection fails (e.g. Iranian ISP TLS/cipher reset or filtering),
      // seamlessly load via our own server's secure proxy
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const proxyImg = new Image();
      proxyImg.onload = () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        resolve(proxyUrl);
      };
      proxyImg.onerror = () => {
        // As a final fallback attempt, try fresh seed via proxy
        const separator = url.includes('?') ? '&' : '?';
        const fallbackUrl = `${url.replace(/seed=\d+/, '')}${separator}seed=${Math.floor(Math.random() * 10000000)}`;
        const fallbackProxy = `/api/proxy-image?url=${encodeURIComponent(fallbackUrl)}`;
        const lastTry = new Image();
        lastTry.onload = () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          resolve(fallbackProxy);
        };
        lastTry.onerror = () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);
          reject(new Error('خطا در دریافت فایل تصویر از سرور. لطفاً مجدداً دکمه تولید را بزنید.'));
        };
        lastTry.src = fallbackProxy;
      };
      proxyImg.src = proxyUrl;
    };

    img.src = url;
  });
}

export function ImageGenStudio() {
  const { isImageStudioOpen: isOpen, setIsImageStudioOpen, imageStudioInitial, setImageStudioInitial } = useUIStore();
  const { insertImageToChat } = useChatStore();
  const initialPrompt = imageStudioInitial?.prompt;
  const initialEngine = imageStudioInitial?.engine;
  const onClose = () => {
    setIsImageStudioOpen(false);
    setImageStudioInitial(null);
  };
  const onInsertToChat = insertImageToChat;
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [engine, setEngine] = useState('flux');
  const [selectedStyle, setSelectedStyle] = useState('none');
  
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageHistory[]>([]);
  
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Gallery Enhancement States
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailImage, setSelectedDetailImage] = useState<ImageHistory | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Gallery Grid Density / Zoom State
  const [gridDensity, setGridDensity] = useState<'compact' | 'medium' | 'large'>(() => {
    try {
      return (localStorage.getItem('image_gen_grid_density') as any) || 'medium';
    } catch {
      return 'medium';
    }
  });

  const handleSetGridDensity = (density: 'compact' | 'medium' | 'large') => {
    setGridDensity(density);
    try {
      localStorage.setItem('image_gen_grid_density', density);
    } catch {}
  };

  // Settings
  const settings = loadSettings();
  const hasOpenAiKey = !!settings.providers.openai?.apiKey;

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) setPrompt(initialPrompt);
      if (initialEngine) setEngine(initialEngine);
      
      const saved = localStorage.getItem('image_gen_history');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [isOpen, initialPrompt, initialEngine]);

  const saveHistory = (item: ImageHistory) => {
    const newHistory = [item, ...history].slice(0, 60);
    setHistory(newHistory);
    localStorage.setItem('image_gen_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (confirm('آیا از پاک کردن تمام تصاویر گالری اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) {
      setHistory([]);
      localStorage.removeItem('image_gen_history');
      setSelectedDetailImage(null);
    }
  };

  const deleteSingleHistory = (timestamp: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = history.filter(item => item.timestamp !== timestamp);
    setHistory(updated);
    localStorage.setItem('image_gen_history', JSON.stringify(updated));
    if (selectedDetailImage?.timestamp === timestamp) {
      setSelectedDetailImage(null);
    }
  };

  const copyPromptText = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const remixPrompt = (item: ImageHistory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrompt(item.prompt);
    setEngine(item.engine);
    setImageUrl(item.url);
    setShowHistory(false);
    setSelectedDetailImage(null);
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'چند لحظه پیش';
    if (mins < 60) return `${mins} دقیقه پیش`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return `${days} روز پیش`;
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          apiKey: settings.providers.gemini?.apiKey || ''
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('لطفاً توصیف تصویر را وارد کنید.');
      return;
    }
    
    // Check Pro lock
    const selectedEngineConf = IMAGE_ENGINES.find(e => e.id === engine);
    if (selectedEngineConf?.tier === 'pro' && !hasOpenAiKey) {
      setError('برای استفاده از این مدل باید کلید OpenAI API را در تنظیمات وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);
    setShowHistory(false);
    
    // Apply style preset if not none
    let finalPrompt = prompt;
    const preset = STYLE_PRESETS.find(s => s.id === selectedStyle);
    if (preset && preset.id !== 'none' && preset.prompt) {
      finalPrompt = `${prompt}, ${preset.prompt}`;
    }

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
          engine,
          apiKey: engine === 'dalle-3' ? settings.providers.openai?.apiKey : engine === 'imagen-3' ? settings.providers.gemini?.apiKey : undefined,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'خطا در تولید تصویر');
      }
      if (data.imageUrl) {
        // Preload image in memory with fallback retry before showing
        const finalLoadedUrl = await preloadImage(data.imageUrl);
        setImageUrl(finalLoadedUrl);
        saveHistory({
          url: finalLoadedUrl,
          prompt,
          enhancedPrompt: data.enhancedPrompt,
          engine,
          timestamp: Date.now(),
        });
        if (window.innerWidth < 1024) {
          setIsMobileSettingsOpen(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered gallery items
  const filteredHistory = history.filter(item => {
    const matchesEngine = selectedFilter === 'all' || item.engine === selectedFilter;
    const matchesSearch = !searchQuery.trim() || 
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.enhancedPrompt && item.enhancedPrompt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesEngine && matchesSearch;
  });

  // Dynamic grid classes based on density selection
  const getGridClasses = () => {
    switch (gridDensity) {
      case 'compact':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5';
      case 'large':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6';
      case 'medium':
      default:
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-5';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 transition-all" dir="rtl">
      <div className="bg-[#f8f9fa] dark:bg-[#121212] w-full h-full sm:h-[90vh] sm:max-h-[900px] max-w-7xl sm:rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative border border-zinc-200 dark:border-white/10 animate-scaleIn">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-[#1e1f20]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-purple-500">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">
              {showHistory ? 'گالری تصاویر' : 'استودیوی تصویر'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setShowHistory(!showHistory); setSelectedDetailImage(null); }} 
              className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-purple-500 text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300'}`}
              title={showHistory ? 'بازگشت به بوم' : 'گالری'}
            >
              {showHistory ? <ArrowRight className="w-4 h-4" /> : <History className="w-4 h-4" />}
            </button>
            {!showHistory && (
              <button 
                onClick={() => setIsMobileSettingsOpen(!isMobileSettingsOpen)} 
                className={`p-2 rounded-full transition-colors ${isMobileSettingsOpen ? 'bg-purple-500 text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300'}`}
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- 1. SETTINGS SIDEBAR (RIGHT SIDE on Desktop in RTL, Drawer on Mobile) --- */}
        {!showHistory && (
          <div className={`
            fixed lg:static inset-y-0 right-0 w-[280px] sm:w-[320px] lg:w-80 bg-[#f8f9fa] dark:bg-[#121212] lg:bg-transparent
            border-l border-zinc-200 dark:border-white/10 shadow-2xl lg:shadow-none
            flex flex-col z-[70] transform transition-transform duration-300 ease-out
            ${isMobileSettingsOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            
            {/* Sidebar Header */}
            <div className="hidden lg:flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-purple-500">
                <Sliders className="w-5 h-5" />
                <h2 className="font-extrabold text-sm text-zinc-800 dark:text-white">تنظیمات استودیو</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-zinc-200/50 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Mobile Sidebar Close Button */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-purple-500">
                <Sliders className="w-4 h-4" />
                <h3 className="font-bold text-sm">تنظیمات</h3>
              </div>
              <button onClick={() => setIsMobileSettingsOpen(false)} className="p-2 bg-zinc-200/50 dark:bg-white/10 rounded-full cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-8 custom-scrollbar pb-24 lg:pb-5 text-right">
              
              {/* Visual Aspect Ratios */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> ابعاد تصویر
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.id}
                      onClick={() => setAspectRatio(ar.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                        aspectRatio === ar.id 
                          ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'bg-white dark:bg-[#1e1f20] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className={`border-2 rounded-sm flex items-center justify-center ${ar.w} ${ar.h} ${aspectRatio === ar.id ? 'border-current' : 'border-zinc-400 dark:border-zinc-500'}`}></div>
                      <span className="text-[10px] font-bold">{ar.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Engines */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> موتور پردازش
                </label>
                <div className="flex flex-col gap-2">
                  {IMAGE_ENGINES.map((eng) => {
                    const isLocked = eng.tier === 'pro' && !hasOpenAiKey;
                    const isSelected = engine === eng.id;

                    return (
                      <button
                        key={eng.id}
                        onClick={() => {
                          if (isLocked) {
                            alert('برای استفاده از این مدل باید کلید OpenAI API خود را در تنظیمات وارد کنید.');
                            return;
                          }
                          setEngine(eng.id);
                          if (window.innerWidth < 1024) setIsMobileSettingsOpen(false);
                        }}
                        className={`relative flex flex-col items-start p-3 sm:p-3.5 pr-3 pl-9 rounded-2xl border transition-all text-right cursor-pointer ${
                          isSelected
                            ? eng.tier === 'pro'
                              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                            : isLocked
                              ? 'bg-zinc-50 dark:bg-[#1e1f20]/50 border-zinc-200 dark:border-white/5 opacity-60 hover:opacity-80 grayscale'
                              : 'bg-white dark:bg-[#1e1f20] border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                        }`}
                      >
                        {isLocked && (
                          <div className="absolute top-3.5 left-3 bg-zinc-200 dark:bg-zinc-800 p-1.5 rounded-full text-zinc-700 dark:text-zinc-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          </div>
                        )}
                        {isSelected && !isLocked && (
                          <div className="absolute top-3.5 left-3 text-emerald-500">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-extrabold text-xs sm:text-sm ${isSelected ? '' : 'text-zinc-700 dark:text-zinc-200'}`}>{eng.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected
                              ? eng.tier === 'pro' ? 'bg-amber-200/50 dark:bg-amber-500/20' : 'bg-emerald-200/50 dark:bg-emerald-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-500'
                        }`}>
                            {eng.tag}
                          </span>
                        </div>
                        <p className={`text-[9px] sm:text-[10px] leading-relaxed line-clamp-1 ${isSelected ? 'opacity-90' : 'text-zinc-700 dark:text-zinc-400'}`}>{eng.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- 2. MAIN CONTENT AREA (CANVAS OR FULLSCREEN GALLERY) --- */}
        <div className="flex-1 relative flex flex-col bg-zinc-100 dark:bg-[#0a0a0a] overflow-hidden">
          
          {/* Top Navigation Bar */}
          {!showHistory ? (
            /* Canvas Top Bar */
            <div className="hidden lg:flex absolute top-4 left-4 right-4 justify-between items-center z-20 pointer-events-none">
              {/* Top Left: Gallery Button */}
              <div className="pointer-events-auto">
                <button 
                  onClick={() => setShowHistory(true)} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border bg-white/80 dark:bg-black/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-black transition-all shadow-sm cursor-pointer hover:border-purple-500/40"
                >
                  <History className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-bold">گالری من</span>
                  {history.length > 0 && (
                    <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      {history.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Top Right: Download Button */}
              {imageUrl && (
                <div className="pointer-events-auto">
                  <a
                    href={imageUrl}
                    download="persian-ai-image.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border bg-white/80 dark:bg-black/60 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-black transition-all shadow-sm hover:scale-105 cursor-pointer"
                    title="دانلود کیفیت اصلی"
                  >
                    <Download className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold">دانلود تصویر</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Gallery Fullscreen Header */
            <div className="p-3.5 lg:p-5 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md z-20 flex flex-col gap-3.5 animate-fadeIn">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                
                {/* Back to Canvas */}
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => { setShowHistory(false); setSelectedDetailImage(null); }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>بازگشت به استودیو</span>
                  </button>
                  
                  <div className="hidden md:flex items-center gap-2 text-zinc-700 dark:text-zinc-400 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>{history.length} اثر ذخیره‌شده</span>
                  </div>
                </div>

                {/* Right Actions: Size Slider / Density Selector + Search + Clear */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                  
                  {/* Grid Density Zoom Selector / Slider */}
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-1 rounded-xl shadow-xs">
                    <button
                      onClick={() => handleSetGridDensity('compact')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        gridDensity === 'compact'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-800 dark:text-zinc-200'
                      }`}
                      title="نمایش ریز (تراکم بالا)"
                    >
                      ریز
                    </button>
                    <button
                      onClick={() => handleSetGridDensity('medium')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        gridDensity === 'medium'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-800 dark:text-zinc-200'
                      }`}
                      title="نمایش استاندارد (متوسط)"
                    >
                      متوسط
                    </button>
                    <button
                      onClick={() => handleSetGridDensity('large')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        gridDensity === 'large'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-800 dark:text-zinc-200'
                      }`}
                      title="نمایش بزرگ (با جزئیات)"
                    >
                      بزرگ
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در پرامپت‌ها..." 
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pr-8 pl-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-700 dark:text-zinc-400 outline-none focus:border-purple-500 transition-colors"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-700 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="پاکسازی تمام تاریخچه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">پاکسازی</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Engine Filter Chips */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-0.5 text-right">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                    selectedFilter === 'all'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  همه مدل‌ها ({history.length})
                </button>
                {IMAGE_ENGINES.map((eng) => {
                  const count = history.filter(h => h.engine === eng.id).length;
                  if (count === 0 && selectedFilter !== eng.id) return null;
                  return (
                    <button
                      key={eng.id}
                      onClick={() => setSelectedFilter(eng.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                        selectedFilter === eng.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{eng.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Body Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-center justify-center relative min-h-[40vh] lg:min-h-[50vh] pb-36 lg:pb-40 custom-scrollbar">
            {showHistory ? (
              /* --- PRO GALLERY VIEW WITH DYNAMIC GRID DENSITY --- */
              <div className="w-full max-w-6xl h-full flex flex-col animate-fadeIn">
                {filteredHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-700 dark:text-zinc-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
                      {searchQuery || selectedFilter !== 'all' ? 'هیچ تصویری با این فیلتر یافت نشد.' : 'گالری تصاویر شما در حال حاضر خالی است.'}
                    </p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-500 mt-1">تصاویری که در استودیو خلق می‌کنید به صورت خودکار در اینجا ذخیره می‌شوند.</p>
                  </div>
                ) : (
                  <div className={`${getGridClasses()} pb-12 transition-all duration-300`}>
                    {filteredHistory.map((item) => {
                      const engineInfo = IMAGE_ENGINES.find(e => e.id === item.engine);
                      const isCopied = copiedId === `card_${item.timestamp}`;

                      return (
                        <div 
                          key={item.timestamp} 
                          onClick={() => setSelectedDetailImage(item)}
                          className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 cursor-pointer border border-zinc-200/80 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          <img 
                            src={item.url} 
                            alt={item.prompt} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            loading="lazy" 
                          />
                          
                          {/* Permanent Badges (Corner Tags) */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
                            <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/10 shadow-sm">
                              {engineInfo?.name || item.engine}
                            </span>
                          </div>

                          <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
                            <span className="text-[9px] text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-sans">
                              {getRelativeTime(item.timestamp)}
                            </span>
                          </div>

                          {/* Desktop Hover Overlay with Action Buttons */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 p-3 sm:p-4 flex flex-col justify-end text-right z-10">
                            <p className="text-white text-xs sm:text-sm font-medium line-clamp-2 mb-3 leading-relaxed">
                              {item.prompt}
                            </p>
                            
                            <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              {/* Remix Button */}
                              <button
                                onClick={(e) => remixPrompt(item, e)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md hover:scale-105 cursor-pointer"
                                title="بارگذاری مجدد در بوم استودیو"
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>ریمیکس</span>
                              </button>

                              {/* Copy Prompt */}
                              <button
                                onClick={(e) => copyPromptText(item.prompt, `card_${item.timestamp}`, e)}
                                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-md"
                                title="کپی پرامپت"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Download */}
                              <a
                                href={item.url}
                                download="persian-ai-image.png"
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-md"
                                title="دانلود تصویر"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>

                              {/* Delete */}
                              <button
                                onClick={(e) => deleteSingleHistory(item.timestamp, e)}
                                className="p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 transition-all cursor-pointer backdrop-blur-md mr-auto"
                                title="حذف تصویر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : imageUrl ? (
              /* --- SINGLE CANVAS IMAGE PREVIEW --- */
              <div className="relative group max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl animate-scaleIn ring-1 ring-white/10">
                <img 
                  src={imageUrl} 
                  alt="Generated" 
                  className="max-w-full max-h-[55vh] lg:max-h-[72vh] object-contain bg-black/10 backdrop-blur-3xl"
                  onError={() => {
                    setError('خطا در نمایش فایل تصویر. لطفاً مجدداً دکمه تولید را فشار دهید.');
                  }}
                />
                
                {/* Send to Chat Floating Overlay */}
                {onInsertToChat && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:translate-y-2 sm:group-hover:translate-y-0">
                    <button 
                      onClick={() => {
                        onInsertToChat(prompt, imageUrl);
                        onClose();
                      }}
                      className="flex items-center gap-2 px-5 py-3 bg-purple-600/95 hover:bg-purple-500 backdrop-blur-xl text-white rounded-2xl transition-all font-bold text-sm shadow-2xl border border-purple-400/30 hover:scale-105 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>ارسال به چت</span>
                    </button>
                  </div>
                )}
              </div>
            ) : loading ? (
              /* --- LOADING STATE --- */
              <div className="flex flex-col items-center justify-center space-y-6 text-purple-500 animate-pulse mt-10">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-purple-500/30 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.5)]">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin-slow" />
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="font-extrabold text-base sm:text-lg text-zinc-800 dark:text-white">در حال خلق شاهکار شما...</p>
                  <p className="text-xs sm:text-sm opacity-60 mt-1">این فرآیند ممکن است چند ثانیه طول بکشد</p>
                </div>
              </div>
            ) : (
              /* --- EMPTY CANVAS STATE --- */
              <div className="text-center opacity-40 flex flex-col items-center mt-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-zinc-700 dark:text-zinc-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-800 dark:text-white mb-2 tracking-tight">بوم خالی شما</h3>
                <p className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed px-4">
                  تخیلات خود را در کادر پایین بنویسید تا هوش مصنوعی آن را به یک شاهکار بصری تبدیل کند.
                </p>
              </div>
            )}
          </div>

          {/* --- FLOATING PROMPT BAR (Hidden in Fullscreen Gallery Mode) --- */}
          {!showHistory && (
            <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 bg-gradient-to-t from-zinc-100 via-zinc-100/95 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/95 to-transparent pt-12 z-20">
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                
                {/* Style Presets Carousel */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 px-1">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                        selectedStyle === style.id
                          ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{style.icon}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/20 mx-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Clean Borderless Prompt Box */}
              <div className="relative flex items-end gap-2 bg-white/75 dark:bg-[#18181b]/75 backdrop-blur-md p-2 rounded-2xl transition-all shadow-md">
                
                {/* Magic Enhance Button */}
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || loading || !prompt.trim()}
                  className="shrink-0 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:grayscale shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer"
                  title="ارتقای جادویی پرامپت با هوش مصنوعی"
                >
                  <Wand2 className={`w-5 h-5 ${enhancing ? 'animate-pulse' : ''}`} />
                </button>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="توصیف تصویر (فارسی یا انگلیسی)..."
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none resize-none text-sm lg:text-base py-2.5 px-3 max-h-24 sm:max-h-32 min-h-[44px] custom-scrollbar placeholder:text-zinc-700 dark:text-zinc-400 dark:placeholder:text-zinc-700 dark:text-zinc-500 text-zinc-800 dark:text-zinc-100"
                  rows={Math.min(3, prompt.split('\n').length || 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />

                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="shrink-0 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-sm hover:shadow hover:-translate-y-0.5 flex items-center justify-center cursor-pointer"
                  title="تولید تصویر"
                >
                  {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Settings Overlay Backdrop */}
      {isMobileSettingsOpen && !showHistory && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSettingsOpen(false)}
        />
      )}

      {/* --- 3. LIGHTBOX DETAIL MODAL (RESPONSIVE FOR ALL DEVICES) --- */}
      {selectedDetailImage && (
        <div 
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedDetailImage(null)}
        >
          <div 
            className="bg-[#18181b] border border-black/10 dark:border-white/10 w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-right animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side: Large Image Preview */}
            <div className="flex-1 bg-black/40 flex items-center justify-center p-4 min-h-[260px] sm:min-h-[380px] relative">
              <img 
                src={selectedDetailImage.url} 
                alt={selectedDetailImage.prompt} 
                className="max-w-full max-h-[45vh] md:max-h-[75vh] object-contain rounded-2xl shadow-xl"
              />
            </div>

            {/* Right Side: Metadata & Action Controls */}
            <div className="w-full md:w-80 lg:w-96 p-5 sm:p-6 flex flex-col justify-between border-t md:border-t-0 md:border-r border-black/10 dark:border-white/10 overflow-y-auto custom-scrollbar max-h-[45vh] md:max-h-[85vh]">
              <div className="space-y-4">
                
                {/* Top Bar with Close Button */}
                <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                      {IMAGE_ENGINES.find(e => e.id === selectedDetailImage.engine)?.name || selectedDetailImage.engine}
                    </span>
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-400">
                      {getRelativeTime(selectedDetailImage.timestamp)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedDetailImage(null)}
                    className="p-1.5 text-zinc-700 dark:text-zinc-400 hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Prompt Text with Copy Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400">پرامپت استفاده‌شده:</label>
                    <button
                      onClick={() => copyPromptText(selectedDetailImage.prompt, 'modal_prompt')}
                      className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                    >
                      {copiedId === 'modal_prompt' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی پرامپت</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm leading-relaxed max-h-36 overflow-y-auto custom-scrollbar select-text font-sans">
                    {selectedDetailImage.prompt}
                  </div>
                </div>

                {/* Enhanced prompt if exists */}
                {selectedDetailImage.enhancedPrompt && selectedDetailImage.enhancedPrompt !== selectedDetailImage.prompt && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> پرامپت ارتقایافته:
                    </label>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-400 bg-black/20 p-2.5 rounded-xl border border-black/5 dark:border-white/5 line-clamp-3">
                      {selectedDetailImage.enhancedPrompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2.5 pt-6 mt-4 border-t border-black/10 dark:border-white/10">
                {/* Remix in Studio */}
                <button
                  onClick={() => remixPrompt(selectedDetailImage)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>بارگذاری و ویرایش در بوم (Remix)</span>
                </button>

                {/* Send to Chat */}
                {onInsertToChat && (
                  <button
                    onClick={() => {
                      onInsertToChat(selectedDetailImage.prompt, selectedDetailImage.url);
                      setSelectedDetailImage(null);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-white/20 text-zinc-900 dark:text-zinc-100 text-sm font-bold transition-colors cursor-pointer border border-black/5 dark:border-white/5"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال به گفتگوی چت</span>
                  </button>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {/* Download */}
                  <a
                    href={selectedDetailImage.url}
                    download="persian-ai-image.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors border border-black/5 dark:border-white/5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود فایل</span>
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => deleteSingleHistory(selectedDetailImage.timestamp)}
                    className="flex items-center justify-center p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors border border-rose-500/20 cursor-pointer"
                    title="حذف این تصویر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
}
