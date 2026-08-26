import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Download, Image as ImageIcon, Send, Sliders, Trash2, Wand2, History, RotateCcw, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { loadSettings } from '../lib/storage';

interface ImageGenStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (prompt: string, imageUrl: string) => void;
}

interface ImageHistory {
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  engine: string;
  timestamp: number;
}

export const IMAGE_ENGINES = [
  { id: 'flux', name: 'Flux.1 Realism', tag: 'رایگان', desc: 'خروجی فوق‌العاده واقعی و طبیعی', tier: 'free' },
  { id: 'flux-anime', name: 'Flux Anime', tag: 'رایگان', desc: 'استایل انیمه و نقاشی دیجیتال', tier: 'free' },
  { id: 'flux-3d', name: 'Flux 3D', tag: 'رایگان', desc: 'رندرهای خیره‌کننده سه‌بعدی', tier: 'free' },
  { id: 'turbo', name: 'SDXL Turbo', tag: 'آنی', desc: 'تولید سریع تصاویر', tier: 'free' },
  { id: 'dalle-3', name: 'DALL-E 3', tag: 'ویژه', desc: 'نیازمند API Key (درک متن و هوش بالا)', tier: 'pro' },
];

export const STYLE_PRESETS = [
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

export function ImageGenStudio({ isOpen, onClose, onInsertToChat }: ImageGenStudioProps) {
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

  // Settings
  const settings = loadSettings();
  const hasOpenAiKey = !!settings.providers.openai?.apiKey;

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('image_gen_history');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [isOpen]);

  const saveHistory = (item: ImageHistory) => {
    const newHistory = [item, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('image_gen_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (confirm('آیا از پاک کردن تاریخچه تصاویر اطمینان دارید؟')) {
      setHistory([]);
      localStorage.removeItem('image_gen_history');
    }
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
          apiKey: engine === 'dalle-3' ? settings.providers.openai?.apiKey : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'خطا در تولید تصویر');
      }
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        saveHistory({
          url: data.imageUrl,
          prompt,
          enhancedPrompt: data.enhancedPrompt,
          engine,
          timestamp: Date.now(),
        });
        if (window.innerWidth < 1024) {
          setIsMobileSettingsOpen(false); // Close mobile settings on success
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: ImageHistory) => {
    setImageUrl(item.url);
    setPrompt(item.prompt);
    setEngine(item.engine);
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 transition-all" dir="rtl">
      <div className="bg-[#f8f9fa] dark:bg-[#121212] w-full h-full sm:h-[90vh] sm:max-h-[900px] max-w-7xl sm:rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative border border-zinc-200 dark:border-white/10 animate-scaleIn">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-[#1e1f20]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-purple-500">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">استودیوی تصویر</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 bg-zinc-100 dark:bg-white/5 rounded-full text-zinc-600 dark:text-zinc-300">
              <History className="w-4 h-4" />
            </button>
            <button onClick={() => setIsMobileSettingsOpen(!isMobileSettingsOpen)} className={`p-2 rounded-full transition-colors ${isMobileSettingsOpen ? 'bg-purple-500 text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300'}`}>
              <Sliders className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- MAIN CANVAS (Right side on Desktop, Top on Mobile) --- */}
        <div className="flex-1 relative flex flex-col bg-zinc-100 dark:bg-[#0a0a0a] overflow-hidden">
          
          {/* Desktop Top Bar (Absolute) */}
          <div className="hidden lg:flex absolute top-4 left-4 right-4 justify-between items-center z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border transition-all ${showHistory ? 'bg-purple-500/90 text-white border-purple-400' : 'bg-white/70 dark:bg-black/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-black'}`}>
                <History className="w-4 h-4" />
                <span className="text-sm font-bold">گالری من</span>
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex items-center justify-center relative min-h-[40vh] lg:min-h-[50vh] pb-32">
            {showHistory ? (
              <div className="w-full max-w-5xl h-full flex flex-col animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold flex items-center gap-2"><History className="w-5 h-5 text-purple-500"/> تاریخچه تصاویر</h3>
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs flex items-center gap-1 text-rose-500 hover:text-rose-400 px-3 py-1.5 rounded-lg bg-rose-500/10">
                      <Trash2 className="w-3.5 h-3.5" /> پاکسازی
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p>هیچ تصویری در گالری شما نیست.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {history.map((item, i) => (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 cursor-pointer border border-zinc-200 dark:border-white/10" onClick={() => loadFromHistory(item)}>
                        <img src={item.url} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                          <p className="text-white text-xs line-clamp-2 mb-1">{item.prompt}</p>
                          <span className="text-[9px] text-white/70 bg-white/20 w-fit px-2 py-0.5 rounded-full backdrop-blur-md">{item.engine}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : imageUrl ? (
              <div className="relative group max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl animate-scaleIn ring-1 ring-white/10">
                <img 
                  src={imageUrl} 
                  alt="Generated" 
                  className="max-w-full max-h-[55vh] lg:max-h-[75vh] object-contain bg-black/10 backdrop-blur-3xl"
                />
                
                {/* Image Actions Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/20 p-2 rounded-2xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:translate-y-4 sm:group-hover:translate-y-0 shadow-xl">
                  <a 
                    href={imageUrl} 
                    download="persian-ai-image.png" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors tooltip-trigger"
                    title="دانلود کیفیت اصلی"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  {onInsertToChat && (
                    <button 
                      onClick={() => {
                        onInsertToChat(prompt, imageUrl);
                        onClose();
                      }}
                      className="flex items-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-colors font-bold text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>ارسال به چت</span>
                    </button>
                  )}
                </div>
              </div>
            ) : loading ? (
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
              <div className="text-center opacity-40 flex flex-col items-center mt-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-zinc-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-800 dark:text-white mb-2 tracking-tight">بوم خالی شما</h3>
                <p className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed px-4">
                  تخیلات خود را در کادر پایین بنویسید تا هوش مصنوعی آن را به یک شاهکار بصری تبدیل کند.
                </p>
              </div>
            )}
          </div>

          {/* Floating Prompt Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 bg-gradient-to-t from-zinc-100 via-zinc-100/95 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/95 to-transparent pt-12 z-20">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              
              {/* Style Presets Carousel (Above Input) */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 px-1">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
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

              <div className="relative group flex items-end gap-2 bg-white dark:bg-[#1e1f20] p-2 lg:p-3 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-lg focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all">
                
                {/* Magic Enhance Button */}
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || loading || !prompt.trim()}
                  className="shrink-0 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl transition-all disabled:opacity-50 disabled:grayscale shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="ارتقای جادویی پرامپت"
                >
                  <Wand2 className={`w-5 h-5 ${enhancing ? 'animate-pulse' : ''}`} />
                </button>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="توصیف تصویر (فارسی یا انگلیسی)..."
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm lg:text-base py-3 px-2 max-h-24 sm:max-h-32 min-h-[48px] custom-scrollbar placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  rows={Math.min(3, prompt.split('\\n').length || 1)}
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
                  className="shrink-0 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center"
                >
                  {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180 sm:rotate-0" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- SETTINGS SIDEBAR (Left on Desktop, Drawer on Mobile) --- */}
        <div className={`
          fixed lg:static inset-y-0 left-0 w-[280px] sm:w-[320px] lg:w-80 bg-[#f8f9fa] dark:bg-[#121212] lg:bg-transparent
          border-r border-zinc-200 dark:border-white/10 shadow-2xl lg:shadow-none
          flex flex-col z-[70] transform transition-transform duration-300 ease-out
          ${isMobileSettingsOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          
          {/* Sidebar Header */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-purple-500">
              <Sliders className="w-5 h-5" />
              <h2 className="font-extrabold text-sm text-zinc-800 dark:text-white">تنظیمات استودیو</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-zinc-200/50 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mobile Sidebar Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-purple-500">
              <Sliders className="w-4 h-4" />
              <h3 className="font-bold text-sm">تنظیمات</h3>
            </div>
            <button onClick={() => setIsMobileSettingsOpen(false)} className="p-2 bg-zinc-200/50 dark:bg-white/10 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-8 custom-scrollbar pb-24 lg:pb-5">
            
            {/* Visual Aspect Ratios */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> ابعاد تصویر
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                      aspectRatio === ar.id 
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-white dark:bg-[#1e1f20] border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
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
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
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
                      className={`relative flex flex-col items-start p-3 sm:p-3.5 rounded-2xl border transition-all text-right ${
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
                        <div className="absolute top-3 left-3 bg-zinc-200 dark:bg-zinc-800 p-1.5 rounded-full text-zinc-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                      )}
                      {isSelected && !isLocked && (
                        <div className="absolute top-3 left-3">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-extrabold text-xs sm:text-sm ${isSelected ? '' : 'text-zinc-700 dark:text-zinc-200'}`}>{eng.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                          isSelected
                            ? eng.tier === 'pro' ? 'bg-amber-200/50 dark:bg-amber-500/20' : 'bg-emerald-200/50 dark:bg-emerald-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {eng.tag}
                        </span>
                      </div>
                      <p className={`text-[9px] sm:text-[10px] leading-relaxed line-clamp-1 ${isSelected ? 'opacity-90' : 'text-zinc-500 dark:text-zinc-400'}`}>{eng.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Settings Overlay Backdrop */}
        {isMobileSettingsOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileSettingsOpen(false)}
          />
        )}

      </div>
    </div>
  );
}
