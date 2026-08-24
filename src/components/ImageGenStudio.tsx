import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, Image as ImageIcon, Send, Sliders, Trash2, Wand2, History, RotateCcw } from 'lucide-react';
import { Tooltip } from './Tooltip';

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
  { id: 'midjourney', name: 'Midjourney v6', tag: 'سینمایی و هنری', desc: 'تولید تصاویر بسیار واقع‌گرایانه و هنری با نورپردازی فوق‌العاده' },
  { id: 'dalle-3', name: 'DALL-E 3 (OpenAI)', tag: 'دقیق و متنی', desc: 'درک فوق‌العاده پرامپت‌های پیچیده و قابلیت درج متن داخل تصویر' },
  { id: 'stable-diffusion', name: 'Stable Diffusion XL', tag: 'متن‌باز و حرفه‌ای', desc: 'انعطاف‌پذیری بسیار بالا با جزئیات هندسی و تکسچرهای دقیق' },
  { id: 'flux', name: 'Flux.1 Realism', tag: 'فوق واقع‌گرایانه', desc: 'نسل جدید مدل‌های تولید تصویر با جزئیات چهره و عکاسی بی‌نظیر' },
  { id: 'pollinations', name: 'Pollinations AI Fast', tag: 'سرعت بالا', desc: 'تولید آنی و رایگان بدون معطلی' },
];

export const STYLE_PRESETS = [
  { name: 'فوتورئال (Photorealistic)', prompt: 'highly detailed photorealistic 8k resolution, cinematic lighting, professional photography' },
  { name: 'سینمایی (Cinematic)', prompt: 'cinematic film still, anamorphic lens, dramatic moody lighting, 35mm photograph' },
  { name: 'انیمه / کارتونی (Anime)', prompt: 'vibrant anime style, studio ghibli aesthetic, highly detailed, beautiful illustration' },
  { name: 'رندر سه‌بعدی (3D Render)', prompt: 'octane render, unreal engine 5, 3d isometric clay style, smooth lighting' },
  { name: 'نقاشی رنگ روغن (Oil Painting)', prompt: 'classical oil painting on canvas, rich textured brushstrokes, museum art' },
  { name: 'سایبرپانک (Cyberpunk)', prompt: 'cyberpunk neon lights, futuristic city, glowing holographic accents, dark moody atmosphere' },
];

export const ASPECT_RATIOS = [
  { id: '1:1', name: 'مربع (1:1)', icon: 'square' },
  { id: '16:9', name: 'افقی / ویدیو (16:9)', icon: 'rectangle-horizontal' },
  { id: '9:16', name: 'عمودی / استوری (9:16)', icon: 'rectangle-vertical' },
  { id: '4:3', name: 'کلاسیک (4:3)', icon: 'monitor' },
  { id: '3:4', name: 'پرتره (3:4)', icon: 'smartphone' },
];

export const ImageGenStudio: React.FC<ImageGenStudioProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [engine, setEngine] = useState('midjourney');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [history, setHistory] = useState<ImageHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('image_gen_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const saveHistory = (newItem: ImageHistory) => {
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem('image_gen_history', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
    } catch (err: any) {
      setError(err.message || 'خطا در بهبود توصیف.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('لطفاً توصیف (پرامپت) تصویر را وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          aspectRatio,
          engine,
        }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
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
      } else {
        throw new Error('تصویری دریافت نشد.');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور ساخت تصویر.');
    } finally {
      setLoading(false);
    }
  };

  const applyStyle = (stylePrompt: string) => {
    setPrompt((prev) => (prev ? `${prev}, ${stylePrompt}` : stylePrompt));
  };

  const loadFromHistory = (item: ImageHistory) => {
    setPrompt(item.prompt);
    setEngine(item.engine);
    setImageUrl(item.url);
    setShowHistory(false);
  };

  const deleteFromHistory = (indexToDelete: number) => {
    const updated = history.filter((_, idx) => idx !== indexToDelete);
    setHistory(updated);
    localStorage.setItem('image_gen_history', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl clay-card bg-[var(--card-bg)] text-[var(--text-color)] shadow-2xl border border-white/20 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black tracking-tight truncate">استودیوی ساخت تصویر</h2>
              <p className="text-[11px] sm:text-xs opacity-70 truncate">موتورهای حرفه‌ای Midjourney، DALL-E 3، Stable Diffusion و Flux</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowHistory(true)}
              className="clay-btn p-2 rounded-xl hover:opacity-100 opacity-80 flex items-center gap-1.5 transition-all text-xs"
            >
              <History className="w-4 h-4" />
              <span className="font-bold hidden sm:inline">گالری</span>
            </button>
            <button
              onClick={onClose}
              className="clay-btn p-2 rounded-xl hover:opacity-100 opacity-80 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left / Settings Column */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Engine Selection */}
            <div>
              <label className="block text-xs font-bold mb-2 opacity-80 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>موتور هوش مصنوعی (Image Engine)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {IMAGE_ENGINES.map((eng) => (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setEngine(eng.id)}
                    className={`p-3 rounded-2xl text-right transition-all border flex flex-col gap-1 ${
                      engine === eng.id
                        ? 'bg-purple-600 text-white/80 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'clay-btn opacity-80 hover:opacity-100 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm">{eng.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${engine === eng.id ? 'bg-white/20 text-white/80' : 'bg-purple-500/20 text-purple-400'}`}>
                        {eng.tag}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 line-clamp-1">{eng.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-bold mb-2 opacity-80">نسبت تصویر (Aspect Ratio)</label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'clay-btn opacity-80 hover:opacity-100'
                    }`}
                  >
                    {ar.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <label className="block text-xs font-bold mb-2 opacity-80">سبک‌های آماده (Style Presets)</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((style, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyStyle(style.prompt)}
                    className="clay-btn px-3 py-1.5 rounded-xl text-xs opacity-80 hover:opacity-100 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold opacity-80">توصیف تصویر (Prompt) به انگلیسی یا فارسی</label>
                <div className="flex items-center gap-2">
                  {prompt && (
                    <button
                      type="button"
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                      className="text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-purple-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                      <span>{isEnhancing ? 'در حال بهبود...' : '🪄 بهبود هوشمند'}</span>
                    </button>
                  )}
                  {prompt && (
                    <button
                      type="button"
                      onClick={() => setPrompt('')}
                      className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>پاک کردن</span>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: یک جنگل جادویی با درختان درخشان و رودخانه کریستالی در شب..."
                rows={4}
                className="w-full p-4 rounded-2xl clay-input-box text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Negative Prompt input */}
            <div>
              <label className="block text-xs font-bold mb-2 opacity-80">نکات منفی / حذفیات (Negative Prompt) <span className="opacity-50 font-normal">(اختیاری)</span></label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="مثال: blurry, low quality, watermark, text"
                className="w-full p-3 rounded-xl clay-input-box text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Action Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="clay-btn-primary w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال خلق تصویر با {IMAGE_ENGINES.find(e => e.id === engine)?.name}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>تولید تصویر با کیفیت بالا</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400 text-xs border border-red-500/30">
                {error}
              </div>
            )}
          </div>

          {/* Right / Preview Column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-r border-white/10 pt-6 lg:pt-0 lg:pr-6">
            <div className="w-full aspect-square rounded-3xl clay-input-box flex flex-col items-center justify-center relative overflow-hidden shadow-inner border border-white/10">
              {loading ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold opacity-80">هوش مصنوعی در حال پردازش و رندر پیکسل‌هاست...</p>
                  <p className="text-[10px] opacity-50">معمولاً بین ۵ تا ۱۰ ثانیه طول می‌کشد.</p>
                </div>
               ) : imageUrl ? (
                <div className="relative w-full h-full flex flex-col justify-end">
                  <img src={imageUrl} alt="Generated Art" className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl animate-fadeIn" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 rounded-b-3xl">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-white/90 font-bold px-2 py-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>تصویر ساخته شده با هوش مصنوعی {IMAGE_ENGINES.find(e => e.id === engine)?.name || engine}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={imageUrl}
                        download="ai-masterpiece.jpg"
                        target="_blank"
                        rel="noreferrer"
                        className="clay-btn px-4 py-2 bg-white/20 hover:bg-white/30 text-white/80 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>دانلود</span>
                      </a>
                      {onInsertToChat && (
                        <button
                          onClick={() => {
                            onInsertToChat(prompt, imageUrl);
                            onClose();
                          }}
                          className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          <span>ارسال به چت</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center opacity-60">
                  <ImageIcon className="w-16 h-16 stroke-[1.5] text-purple-400 animate-pulse" />
                  <p className="text-sm font-bold">پیش‌نمایش تصویر خروجی</p>
                  <p className="text-xs max-w-xs">توصیف خود را وارد کرده و دکمه تولید را بزنید تا شاهکار هنری شما خلق شود.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-purple-400" />
              گالری تصاویر شما
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="clay-btn p-2 rounded-xl hover:opacity-100 opacity-80 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50 gap-3">
                <ImageIcon className="w-12 h-12" />
                <p>هیچ تصویری هنوز ساخته نشده است.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden clay-card">
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="text-[10px] text-white/90 line-clamp-3 leading-relaxed">
                        {item.prompt}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="clay-btn-primary p-2 rounded-xl"
                          title="استفاده مجدد (Remix)"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <a
                          href={item.url}
                          download={`ai-art-${idx}.jpg`}
                          target="_blank"
                          rel="noreferrer"
                          className="clay-btn bg-white/20 p-2 rounded-xl text-white/80"
                          title="دانلود"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFromHistory(idx); }}
                          className="clay-btn bg-rose-500/80 hover:bg-rose-500 p-2 rounded-xl text-white/80"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
