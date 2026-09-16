import React, { useState, useEffect } from 'react';
import {
  Palette,
  Layout,
  Store,
  BookOpen,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Upload,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  FileText,
  MessageSquare,
  Tag
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProfessionCardItem {
  id: string;
  title: string;
  badge: string;
  accentColor: string; // amber, indigo, emerald, purple, slate
  image: string;
  desc: string;
  prompt: string;
  enabled: boolean;
  order: number;
}

interface FaqItem {
  q: string;
  a: string;
}

interface ManifestoReason {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

interface ManifestoData {
  badge: string;
  title: string;
  subtitle: string;
  reasons: ManifestoReason[];
}

interface StoreDesignData {
  heroTitle: string;
  heroSubtitle: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    link: string;
  };
}

interface BlogDesignData {
  headerTitle: string;
  headerSubtitle: string;
  trendingTags: string[];
}

interface CtaData {
  title: string;
  desc: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  theme: string; // dark, white, indigo, slate, emerald, amber
}

interface FooterSettingsData {
  brandTitle: string;
  brandDesc: string;
  supportEmail: string;
  telegramChannel: string;
  copyrightText: string;
}

interface GiftCardData {
  enabled: boolean;
  title: string;
  price: string;
  badge: string;
  tokenEstimate: string;
  messagesCount: string;
  desc: string;
  features: string[];
  ctaText: string;
}

interface HeroScenario {
  id: string;
  label: string;
  icon: string;
  model: string;
  modelBadge: string;
  userPrompt: string;
  aiResponse: string;
}

interface HeroData {
  featurePill: string;
  title: string;
  subtitle: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  demoScenarios: HeroScenario[];
}

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  tag: string;
  prompt: string;
}

interface PricingHeaderData {
  badge: string;
  title: string;
  subtitle: string;
  customTopupBanner: {
    enabled: boolean;
    title: string;
    desc: string;
    btnText: string;
  };
  securityNote?: {
    creditText: string;
    gatewayText: string;
  };
}

const COLOR_NAME_TO_HEX: Record<string, string> = {
  indigo: '#4f46e5',
  emerald: '#059669',
  purple: '#9333ea',
  amber: '#d97706',
  slate: '#475569',
};

const normalizeHexColor = (val?: string): string => {
  if (!val) return '#4f46e5';
  if (val.startsWith('#')) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
    if (/^#[0-9A-Fa-f]{3}$/.test(val)) {
      return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
    }
    return val;
  }
  return COLOR_NAME_TO_HEX[val] || '#4f46e5';
};

const PRESET_ACCENT_COLORS = [
  { hex: '#4f46e5', label: 'نیلی مدرن' },
  { hex: '#059669', label: 'زمردی بالینی' },
  { hex: '#d97706', label: 'کهربایی / طلایی' },
  { hex: '#9333ea', label: 'بنفش فاخر' },
  { hex: '#e11d48', label: 'سرخابی یاقوتی' },
  { hex: '#0284c7', label: 'آبی اقیانوسی' },
  { hex: '#475569', label: 'تیتانیوم خنثی' }
];

const HexColorPickerInput: React.FC<{
  value?: string;
  onChange: (hex: string) => void;
}> = ({ value, onChange }) => {
  const currentHex = normalizeHexColor(value);
  const [localInput, setLocalInput] = useState(currentHex);

  useEffect(() => {
    setLocalInput(normalizeHexColor(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim();
    if (!raw.startsWith('#') && raw.length > 0) raw = '#' + raw;
    setLocalInput(raw);
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
      onChange(raw.toLowerCase());
    }
  };

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f4f6fa] dark:bg-[#151924] border border-[#d8dce6] dark:border-[#212738]">
      {/* Interactive Swatch & Native Color Dialog (Photoshop style) */}
      <label 
        className="relative w-6 h-6 rounded-lg cursor-pointer shadow-xs border border-black/10 dark:border-white/10 shrink-0 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: currentHex }}
        title="انتخاب رنگ دلخواه از پالت جامع (Color Picker فتوشاپ)"
      >
        <input
          type="color"
          value={currentHex.length === 7 ? currentHex : '#4f46e5'}
          onChange={(e) => {
            setLocalInput(e.target.value);
            onChange(e.target.value);
          }}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
        />
      </label>

      {/* Hex text input */}
      <input
        type="text"
        value={localInput}
        onChange={handleInputChange}
        onBlur={() => {
          if (!/^#[0-9A-Fa-f]{6}$/.test(localInput)) {
            setLocalInput(currentHex);
          }
        }}
        placeholder="#4F46E5"
        maxLength={7}
        className="w-18 px-1.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded-md bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#262e40] text-[#0f1420] dark:text-white text-center focus:outline-none focus:border-blue-500"
        title="کد هگزادسیمال رنگ (مانند #4F46E5)"
      />

      {/* Quick palette presets */}
      <div className="hidden sm:flex items-center gap-1 pr-1 border-r border-[#d8dce6] dark:border-[#262e40]">
        {PRESET_ACCENT_COLORS.map((p) => (
          <button
            key={p.hex}
            type="button"
            onClick={() => {
              setLocalInput(p.hex);
              onChange(p.hex);
            }}
            className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
              currentHex.toLowerCase() === p.hex.toLowerCase()
                ? 'ring-2 ring-offset-1 ring-blue-500 scale-110'
                : 'opacity-70 hover:opacity-100 hover:scale-110'
            }`}
            style={{ backgroundColor: p.hex }}
            title={p.label}
          />
        ))}
      </div>
    </div>
  );
};

const CTA_THEME_OPTIONS = [
  { id: 'dark', label: 'تیره و سرمه‌ای شارپ (Dark Minimal)' },
  { id: 'white', label: 'سفید یخچالی متضاد (Light Inverse)' },
  { id: 'indigo', label: 'نیلی تکنولوژی (Deep Indigo)' },
  { id: 'emerald', label: 'زمردی و رشد (Emerald Green)' },
  { id: 'slate', label: 'تیتانیوم گرافیتی (Slate Titanium)' },
  { id: 'amber', label: 'طلایی لوکس (Amber Gold)' }
];

export const AdminDesignStudioTab: React.FC = () => {
  const { token } = useAuthStore();

  const [activeSection, setActiveSection] = useState<'landing' | 'store' | 'blog' | 'footer'>('landing');
  const [activeLandingSubTab, setActiveLandingSubTab] = useState<'hero' | 'manifesto' | 'professions' | 'gallery' | 'pricing' | 'faqs' | 'cta'>('hero');

  const [loading, setLoading] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Design state
  const [hero, setHero] = useState<HeroData | null>(null);
  const [manifesto, setManifesto] = useState<ManifestoData | null>(null);
  const [professions, setProfessions] = useState<ProfessionCardItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [pricingHeader, setPricingHeader] = useState<PricingHeaderData | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [cta, setCta] = useState<CtaData | null>(null);
  const [giftCard, setGiftCard] = useState<GiftCardData | null>(null);
  const [storeDesign, setStoreDesign] = useState<StoreDesignData | null>(null);
  const [blogDesign, setBlogDesign] = useState<BlogDesignData | null>(null);
  const [footerSettings, setFooterSettings] = useState<FooterSettingsData | null>(null);

  const fetchDesignData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-design', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در بارگذاری تنظیمات طراحی');
      const data = await res.json();
      setHero(data.hero || null);
      setManifesto(data.manifesto);
      setProfessions(data.professions || []);
      setGallery(data.gallery || []);
      setPricingHeader(data.pricingHeader || null);
      setFaqs(data.faqs || []);
      setCta(data.cta);
      setGiftCard(data.giftCard || null);
      setStoreDesign(data.store);
      setBlogDesign(data.blog);
      setFooterSettings(data.footer);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'عدم دسترسی یا خطای سرور' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignData();
  }, [token]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveSection = async (sectionKey: string, payload: any) => {
    setSavingSection(sectionKey);
    try {
      const res = await fetch(`/api/admin/site-design/${sectionKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ data: payload })
      });
      if (!res.ok) throw new Error('خطا در ذخیره‌سازی داده‌ها');
      showToast('success', 'تغییرات با موفقیت ذخیره و در سایت منتشر شد.');
    } catch (err: any) {
      showToast('error', err.message || 'خطا در ارتباط با سرور');
    } finally {
      setSavingSection(null);
    }
  };

  const handleResetSection = async (sectionKey: string) => {
    if (!window.confirm('آیا مطمئن هستید؟ این بخش به تنظیمات پیش‌فرض اولیه بازمی‌گردد.')) return;
    setSavingSection(sectionKey);
    try {
      const res = await fetch(`/api/admin/site-design/reset/${sectionKey}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در بازگردانی تنظیمات');
      const resData = await res.json();
      if (sectionKey === 'landing_hero') setHero(resData.data);
      else if (sectionKey === 'landing_manifesto') setManifesto(resData.data);
      else if (sectionKey === 'landing_professions') setProfessions(resData.data);
      else if (sectionKey === 'landing_gallery') setGallery(resData.data);
      else if (sectionKey === 'landing_pricing_header') setPricingHeader(resData.data);
      else if (sectionKey === 'landing_faqs') setFaqs(resData.data);
      else if (sectionKey === 'landing_cta') setCta(resData.data);
      else if (sectionKey === 'landing_gift_card') setGiftCard(resData.data);
      else if (sectionKey === 'store_design') setStoreDesign(resData.data);
      else if (sectionKey === 'blog_design') setBlogDesign(resData.data);
      else if (sectionKey === 'footer_settings') setFooterSettings(resData.data);

      showToast('success', 'تنظیمات این بخش به پیش‌فرض کارخانه بازگردانده شد.');
    } catch (err: any) {
      showToast('error', err.message || 'خطا در بازگردانی');
    } finally {
      setSavingSection(null);
    }
  };

  // Image Upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, onUrlReceived: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/admin/site-design/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            base64,
            folder: 'professions',
            filename: file.name.split('.')[0]
          })
        });
        const data = await res.json();
        if (data.success && data.url) {
          onUrlReceived(data.url);
          showToast('success', 'تصویر با موفقیت در سرور ذخیره شد.');
        } else {
          showToast('error', data.error || 'خطا در ذخیره تصویر');
        }
      } catch (err) {
        showToast('error', 'خطا در آپلود تصویر');
      }
    };
    reader.readAsDataURL(file);
  };

  // Move profession card up or down
  const moveProfession = (index: number, direction: 'up' | 'down') => {
    const newItems = [...professions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    // update orders
    newItems.forEach((item, idx) => (item.order = idx + 1));
    setProfessions(newItems);
  };

  const addProfession = () => {
    const newCard: ProfessionCardItem = {
      id: `prof_${Date.now()}`,
      title: 'عنوان تخصص جدید',
      badge: 'دسته‌بندی',
      accentColor: 'indigo',
      image: '/images/professions/academic.jpg',
      desc: 'توضیحات کوتاه درباره نحوه حل مسائل این حرفه با هوش مصنوعی.',
      prompt: 'متن پرامپت پیشنهادی و آماده برای تست در چت‌باکس...',
      enabled: true,
      order: professions.length + 1
    };
    setProfessions([...professions, newCard]);
  };

  const removeProfession = (id: string) => {
    if (!window.confirm('آیا از حذف این کارت اطمینان دارید؟')) return;
    setProfessions(professions.filter((p) => p.id !== id));
  };

  // FAQ helpers
  const addFaq = () => {
    setFaqs([...faqs, { q: 'پرسش جدید؟', a: 'پاسخ کامل به این پرسش...' }]);
  };

  const removeFaq = (index: number) => {
    if (!window.confirm('آیا از حذف این پرسش اطمینان دارید؟')) return;
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#717b91]">
        در حال بارگذاری اطلاعات طراحی و صفحات...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs (Landing / Store / Blog) */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#f0f2f7] dark:bg-[#131620] border border-[#e2e5eb] dark:border-[#1e2433]">
        <button
          type="button"
          onClick={() => setActiveSection('landing')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'landing'
              ? 'bg-white dark:bg-[#1f2536] text-[#0f1420] dark:text-white shadow-xs'
              : 'text-[#717b91] hover:text-[#0f1420] dark:hover:text-white'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>صفحه اصلی (Landing Page)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('store')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'store'
              ? 'bg-white dark:bg-[#1f2536] text-[#0f1420] dark:text-white shadow-xs'
              : 'text-[#717b91] hover:text-[#0f1420] dark:hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>ویترین فروشگاه (Store)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('blog')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'blog'
              ? 'bg-white dark:bg-[#1f2536] text-[#0f1420] dark:text-white shadow-xs'
              : 'text-[#717b91] hover:text-[#0f1420] dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>وبلاگ و اخبار (Blog)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('footer')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'footer'
              ? 'bg-white dark:bg-[#1f2536] text-[#0f1420] dark:text-white shadow-xs'
              : 'text-[#717b91] hover:text-[#0f1420] dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>فوتر و پاورقی (Footer)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. LANDING PAGE DESIGN & CMS                             */}
      {/* ======================================================== */}
      {activeSection === 'landing' && (
        <div className="space-y-6">
          {/* Sub-tabs for Landing (100% unified in order from top to bottom) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-[#e2e5eb] dark:border-[#1e2433] [scrollbar-width:none]">
            {[
              { id: 'hero', label: '۱. هیرو و دمو چت' },
              { id: 'manifesto', label: '۲. مانیفست ارزش‌ها' },
              { id: 'professions', label: '۳. پرسونای تخصصی', count: professions.length },
              { id: 'gallery', label: '۴. گالری تصویرساز', count: gallery.length },
              { id: 'pricing', label: '۵. تعرفه‌ها و هدیه' },
              { id: 'faqs', label: '۶. سوالات متداول', count: faqs.length },
              { id: 'cta', label: '۷. بنر پایانی CTA' },
            ].map((subItem) => {
              const isActive = activeLandingSubTab === subItem.id;
              return (
                <button
                  key={subItem.id}
                  type="button"
                  onClick={() => setActiveLandingSubTab(subItem.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#111622] text-white dark:bg-white dark:text-[#0a0c10] shadow-xs'
                      : 'text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#f0f2f7] dark:hover:bg-[#181d2a]'
                  }`}
                >
                  <span>{subItem.label}</span>
                  {typeof subItem.count === 'number' && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-black/5 dark:bg-white/10 text-inherit'
                    }`}>
                      {subItem.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SubTab 1: Hero & Demo Console */}
          {activeLandingSubTab === 'hero' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                    بخش هیرو (Hero) و سناریوهای کنسول چت
                  </h3>
                  <p className="text-[11px] text-[#717b91]">
                    تیتر اصلی لندینگ، نشان متنی بالای صفحه، دکمه‌های اقدام به عمل و مکالمات نمونه در کنسول چت.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSection('landing_hero', hero)}
                    disabled={savingSection === 'landing_hero'}
                    className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'landing_hero' ? 'در حال ذخیره...' : 'ذخیره بخش هیرو'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetSection('landing_hero')}
                    className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e] cursor-pointer"
                    title="بازگردانی به پیش‌فرض کارخانه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {hero && (
                <div className="space-y-4 bg-white dark:bg-[#0f121a] p-5 rounded-2xl border border-[#d8dce6] dark:border-[#1e2433]">
                  {/* Texts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#0f1420] dark:text-white block mb-1">
                        متن نشان بالای هیرو (Pill):
                      </label>
                      <input
                        type="text"
                        value={hero.featurePill || ''}
                        onChange={(e) => setHero({ ...hero, featurePill: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620] text-[#0f1420] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#0f1420] dark:text-white block mb-1">
                        تیتر اصلی لندینگ (Headline):
                      </label>
                      <input
                        type="text"
                        value={hero.title || ''}
                        onChange={(e) => setHero({ ...hero, title: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620] text-[#0f1420] dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0f1420] dark:text-white block mb-1">
                      زیرتیتر توضیحی (Subtitle):
                    </label>
                    <textarea
                      rows={2}
                      value={hero.subtitle || ''}
                      onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620] text-[#0f1420] dark:text-white leading-relaxed"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#e6e9f0] dark:border-[#1b202e]">
                    <div>
                      <label className="text-[11px] font-bold text-[#717b91] block mb-1">متن دکمه اصلی:</label>
                      <input
                        type="text"
                        value={hero.primaryBtnText || ''}
                        onChange={(e) => setHero({ ...hero, primaryBtnText: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#717b91] block mb-1">لینک دکمه اصلی:</label>
                      <input
                        type="text"
                        value={hero.primaryBtnLink || ''}
                        onChange={(e) => setHero({ ...hero, primaryBtnLink: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#717b91] block mb-1">متن دکمه دوم:</label>
                      <input
                        type="text"
                        value={hero.secondaryBtnText || ''}
                        onChange={(e) => setHero({ ...hero, secondaryBtnText: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#717b91] block mb-1">لینک دکمه دوم:</label>
                      <input
                        type="text"
                        value={hero.secondaryBtnLink || ''}
                        onChange={(e) => setHero({ ...hero, secondaryBtnLink: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Demo Scenarios */}
                  <div className="pt-4 border-t border-[#e6e9f0] dark:border-[#1b202e] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#0f1420] dark:text-white flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>سناریوهای کنسول دمو چت ({hero.demoScenarios?.length || 0})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newSc: HeroScenario = {
                            id: `sc_${Date.now()}`,
                            label: 'سناریوی جدید',
                            icon: 'Sparkles',
                            model: 'Claude 3.5 Sonnet',
                            modelBadge: 'هوشمند',
                            userPrompt: 'پیام نمونه کاربر...',
                            aiResponse: 'پاسخ نمونه هوش مصنوعی...'
                          };
                          setHero({
                            ...hero,
                            demoScenarios: [...(hero.demoScenarios || []), newSc]
                          });
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#eef1f6] dark:bg-[#181d2a] hover:bg-[#dfe3eb] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>افزودن سناریو</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {hero.demoScenarios?.map((sc, sIdx) => (
                        <div
                          key={sc.id || sIdx}
                          className="p-3.5 rounded-xl border border-[#e2e5eb] dark:border-[#1e2433] bg-[#fbfcfd] dark:bg-[#121622] space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 rounded-md bg-[#eef1f6] dark:bg-[#181d2a] flex items-center justify-center text-[10px] font-bold text-[#717b91]">
                                {sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={sc.label}
                                onChange={(e) => {
                                  const updated = [...hero.demoScenarios];
                                  updated[sIdx].label = e.target.value;
                                  setHero({ ...hero, demoScenarios: updated });
                                }}
                                className="px-2.5 py-1 text-xs font-bold rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#151924]"
                                placeholder="عنوان تب (مثلاً نگارش حقوقی)"
                              />
                              <input
                                type="text"
                                value={sc.model}
                                onChange={(e) => {
                                  const updated = [...hero.demoScenarios];
                                  updated[sIdx].model = e.target.value;
                                  setHero({ ...hero, demoScenarios: updated });
                                }}
                                className="px-2.5 py-1 text-xs rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#151924]"
                                placeholder="نام مدل"
                              />
                              <input
                                type="text"
                                value={sc.modelBadge}
                                onChange={(e) => {
                                  const updated = [...hero.demoScenarios];
                                  updated[sIdx].modelBadge = e.target.value;
                                  setHero({ ...hero, demoScenarios: updated });
                                }}
                                className="px-2.5 py-1 text-xs rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#151924]"
                                placeholder="برچسب (مثلاً رسمی)"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm('آیا از حذف این سناریو اطمینان دارید؟')) return;
                                const updated = hero.demoScenarios.filter((_, i) => i !== sIdx);
                                setHero({ ...hero, demoScenarios: updated });
                              }}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="حذف سناریو"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#717b91] block mb-0.5">پیام ورودی کاربر:</label>
                              <textarea
                                rows={2}
                                value={sc.userPrompt}
                                onChange={(e) => {
                                  const updated = [...hero.demoScenarios];
                                  updated[sIdx].userPrompt = e.target.value;
                                  setHero({ ...hero, demoScenarios: updated });
                                }}
                                className="w-full p-2 text-xs rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#151924]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#717b91] block mb-0.5">پاسخ خروجی هوش مصنوعی:</label>
                              <textarea
                                rows={2}
                                value={sc.aiResponse}
                                onChange={(e) => {
                                  const updated = [...hero.demoScenarios];
                                  updated[sIdx].aiResponse = e.target.value;
                                  setHero({ ...hero, demoScenarios: updated });
                                }}
                                className="w-full p-2 text-xs rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#151924]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SubTab A: Professions */}
          {activeLandingSubTab === 'professions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                    مدیریت داینامیک کارت‌های مشاغل و پرامپت‌ها
                  </h3>
                  <p className="text-[11px] text-[#717b91]">
                    کارت‌ها با گرید هوشمند و خودتنظیم (Fluid Intrinsic Grid) بر روی موبایل، تبلت و دسکتاپ نمایش داده می‌شوند.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addProfession}
                    className="px-3 py-1.5 rounded-lg bg-[#eef1f6] dark:bg-[#1e2433] hover:bg-[#dfe3ec] text-[#0f1420] dark:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن تخصص جدید</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSection('landing_professions', professions)}
                    disabled={savingSection === 'landing_professions'}
                    className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'landing_professions' ? 'در حال ذخیره...' : 'ذخیره کارت‌ها'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetSection('landing_professions')}
                    className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                    title="بازگردانی به پیش‌فرض کارخانه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {professions.map((card, idx) => (
                  <div
                    key={card.id}
                    className={`p-4 rounded-xl border transition-all ${
                      card.enabled
                        ? 'bg-white dark:bg-[#0f121a] border-[#d8dce6] dark:border-[#1e2433]'
                        : 'bg-[#f4f5f8] dark:bg-[#11141c] border-[#e2e5eb] dark:border-[#1a1e29] opacity-75'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Image Preview & Upload */}
                      <div className="w-full md:w-44 shrink-0 space-y-2">
                        <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-[#eef1f6] dark:bg-[#151923] border border-[#d8dce6] dark:border-[#1e2433]">
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-[#eef1f6] dark:bg-[#181d2a] hover:bg-[#dfe3eb] text-[11px] font-bold text-[#0f1420] dark:text-white cursor-pointer transition-colors text-center">
                          <Upload className="w-3 h-3" />
                          <span>تغییر تصویر</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, (url) => {
                                const updated = [...professions];
                                updated[idx].image = url;
                                setProfessions(updated);
                              })
                            }
                          />
                        </label>
                      </div>

                      {/* Content Form */}
                      <div className="flex-1 w-full space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-md bg-[#eef1f6] dark:bg-[#181d2a] flex items-center justify-center text-xs font-bold text-[#717b91]">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) => {
                                const updated = [...professions];
                                updated[idx].title = e.target.value;
                                setProfessions(updated);
                              }}
                              className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                              placeholder="عنوان حرفه یا گروه هدف"
                            />
                            <input
                              type="text"
                              value={card.badge}
                              onChange={(e) => {
                                const updated = [...professions];
                                updated[idx].badge = e.target.value;
                                setProfessions(updated);
                              }}
                              className="w-32 px-2.5 py-1 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                              placeholder="برچسب دسته"
                            />
                          </div>

                          {/* Controls (Up, Down, Toggle, Delete) */}
                          <div className="flex items-center gap-1">
                            {/* Hex Color Picker (Photoshop style + Hex code + Presets) */}
                            <HexColorPickerInput
                              value={card.accentColor}
                              onChange={(newHex) => {
                                const updated = [...professions];
                                updated[idx].accentColor = newHex;
                                setProfessions(updated);
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => moveProfession(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-[#717b91] hover:text-[#0f1420] dark:hover:text-white disabled:opacity-30"
                              title="حرکت به بالا"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveProfession(idx, 'down')}
                              disabled={idx === professions.length - 1}
                              className="p-1 rounded-md text-[#717b91] hover:text-[#0f1420] dark:hover:text-white disabled:opacity-30"
                              title="حرکت به پایین"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...professions];
                                updated[idx].enabled = !updated[idx].enabled;
                                setProfessions(updated);
                              }}
                              className="p-1 rounded-md text-[#717b91] hover:text-[#0f1420] dark:hover:text-white"
                              title={card.enabled ? 'مخفی کردن کارت' : 'نمایش کارت'}
                            >
                              {card.enabled ? (
                                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeProfession(card.id)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10"
                              title="حذف کارت"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <textarea
                            rows={2}
                            value={card.desc}
                            onChange={(e) => {
                              const updated = [...professions];
                              updated[idx].desc = e.target.value;
                              setProfessions(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
                            placeholder="توضیحات کوتاه حرفه..."
                          />
                        </div>

                        {/* Ready-to-Test Prompt */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#717b91] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>پرامپت آماده برای آزمایش در چت‌باکس:</span>
                          </label>
                          <textarea
                            rows={2}
                            value={card.prompt}
                            onChange={(e) => {
                              const updated = [...professions];
                              updated[idx].prompt = e.target.value;
                              setProfessions(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#161a26] text-[#0f1420] dark:text-white font-mono"
                            placeholder="متن پرامپت آماده..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab B: Manifesto */}
          {activeLandingSubTab === 'manifesto' && manifesto && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                    ویرایش بیانیه مانیفست و استدلال‌های تخصصی
                  </h3>
                  <p className="text-[11px] text-[#717b91]">
                    بخش شفافیت و دلایل تمرکز بر کارایی واقعی و حل مسائل روزمره.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSection('landing_manifesto', manifesto)}
                    disabled={savingSection === 'landing_manifesto'}
                    className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'landing_manifesto' ? 'در حال ذخیره...' : 'ذخیره بیانیه'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetSection('landing_manifesto')}
                    className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                    title="بازگردانی به پیش‌فرض کارخانه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                    برچسب بالای بیانیه
                  </label>
                  <input
                    type="text"
                    value={manifesto.badge}
                    onChange={(e) => setManifesto({ ...manifesto, badge: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                    تیتر اصلی مانیفست
                  </label>
                  <input
                    type="text"
                    value={manifesto.title}
                    onChange={(e) => setManifesto({ ...manifesto, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                    متن مقدمه و بیانیه
                  </label>
                  <textarea
                    rows={3}
                    value={manifesto.subtitle}
                    onChange={(e) => setManifesto({ ...manifesto, subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
                  />
                </div>

                {/* 3 Reasons */}
                <div className="pt-3 border-t border-[#e6e9f0] dark:border-[#1b202e] space-y-3">
                  <h4 className="text-xs font-bold text-[#0f1420] dark:text-white">
                    ۳ ستون استدلال منطقی و فنی
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {manifesto.reasons.map((r, rIdx) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg border border-[#e2e5eb] dark:border-[#1b202e] bg-[#f8f9fb] dark:bg-[#131722] space-y-2"
                      >
                        <input
                          type="text"
                          value={r.title}
                          onChange={(e) => {
                            const updatedReasons = [...manifesto.reasons];
                            updatedReasons[rIdx].title = e.target.value;
                            setManifesto({ ...manifesto, reasons: updatedReasons });
                          }}
                          className="w-full px-2 py-1 text-xs font-bold rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#0f121a] text-[#0f1420] dark:text-white"
                          placeholder="عنوان دلیل"
                        />
                        <textarea
                          rows={4}
                          value={r.desc}
                          onChange={(e) => {
                            const updatedReasons = [...manifesto.reasons];
                            updatedReasons[rIdx].desc = e.target.value;
                            setManifesto({ ...manifesto, reasons: updatedReasons });
                          }}
                          className="w-full px-2 py-1 text-[11px] rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#0f121a] text-[#525d75] dark:text-[#ccd3e0]"
                          placeholder="متن استدلال..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab C: FAQs */}
          {activeLandingSubTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                    مدیریت پرسش و پاسخ‌های متداول (FAQ)
                  </h3>
                  <p className="text-[11px] text-[#717b91]">
                    پاسخ‌های شفاف و اعتمادساز برای تصمیم‌گیری کاربران در صفحه اصلی.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addFaq}
                    className="px-3 py-1.5 rounded-lg bg-[#eef1f6] dark:bg-[#1e2433] hover:bg-[#dfe3ec] text-[#0f1420] dark:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن پرسش جدید</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSection('landing_faqs', faqs)}
                    disabled={savingSection === 'landing_faqs'}
                    className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'landing_faqs' ? 'در حال ذخیره...' : 'ذخیره پرسش‌ها'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetSection('landing_faqs')}
                    className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                    title="بازگردانی به پیش‌فرض کارخانه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3.5 rounded-xl border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#0f121a] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={faq.q}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[fIdx].q = e.target.value;
                          setFaqs(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="متن پرسش..."
                      />
                      <button
                        type="button"
                        onClick={() => removeFaq(fIdx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        title="حذف این سوال"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={faq.a}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[fIdx].a = e.target.value;
                        setFaqs(updated);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
                      placeholder="متن پاسخ جامع..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 4: Gallery */}
          {activeLandingSubTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                    گالری نمونه آثار استودیوی تصویرساز ({gallery.length})
                  </h3>
                  <p className="text-[11px] text-[#717b91]">
                    مدیریت آثار هنری، آپلود تصاویر جدید، ویرایش تگ دسته‌بندی و متن پرامپت انگلیسی برای کپی کاربران.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: GalleryItem = {
                        id: `g_${Date.now()}`,
                        src: '/images/gallery/journal-cover.jpg',
                        title: 'عنوان اثر جدید',
                        tag: 'هنر دیجیتال',
                        prompt: 'Ultra-detailed modern cinematic artwork, sharp focus, 8k...'
                      };
                      setGallery([...gallery, newItem]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#eef1f6] dark:bg-[#1e2433] hover:bg-[#dfe3ec] text-[#0f1420] dark:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن اثر جدید</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSection('landing_gallery', gallery)}
                    disabled={savingSection === 'landing_gallery'}
                    className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'landing_gallery' ? 'در حال ذخیره...' : 'ذخیره گالری'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetSection('landing_gallery')}
                    className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e] cursor-pointer"
                    title="بازگردانی به پیش‌فرض کارخانه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gallery.map((item, gIdx) => (
                  <div
                    key={item.id || gIdx}
                    className="p-4 rounded-xl border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#0f121a] flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-28 h-20 rounded-lg overflow-hidden bg-[#eef1f6] dark:bg-[#151923] shrink-0 relative border border-[#e2e5eb] dark:border-[#1e2433]">
                        <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#717b91]">اثر شماره {gIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm('آیا از حذف این اثر از گالری اطمینان دارید؟')) return;
                              setGallery(gallery.filter((_, i) => i !== gIdx));
                            }}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="حذف اثر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <label className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-md bg-[#eef1f6] dark:bg-[#181d2a] hover:bg-[#dfe3eb] text-[11px] font-bold text-[#0f1420] dark:text-white cursor-pointer transition-colors text-center w-full">
                          <Upload className="w-3 h-3" />
                          <span>تغییر تصویر</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, (url) => {
                                const updated = [...gallery];
                                updated[gIdx].src = url;
                                setGallery(updated);
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#717b91] block mb-0.5">عنوان اثر:</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...gallery];
                            updated[gIdx].title = e.target.value;
                            setGallery(updated);
                          }}
                          className="w-full px-2 py-1 text-xs font-bold rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                          placeholder="عنوان اثر"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#717b91] block mb-0.5">برچسب / دسته‌بندی:</label>
                        <input
                          type="text"
                          value={item.tag}
                          onChange={(e) => {
                            const updated = [...gallery];
                            updated[gIdx].tag = e.target.value;
                            setGallery(updated);
                          }}
                          className="w-full px-2 py-1 text-xs rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                          placeholder="تگ (مثلاً آموزش عالی)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#717b91] block mb-0.5">پرامپت انگلیسی (جهت کپی کاربر):</label>
                      <textarea
                        rows={2}
                        value={item.prompt}
                        onChange={(e) => {
                          const updated = [...gallery];
                          updated[gIdx].prompt = e.target.value;
                          setGallery(updated);
                        }}
                        dir="ltr"
                        className="w-full p-2 text-xs font-mono rounded-md border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 5: Pricing & Gift Card */}
          {activeLandingSubTab === 'pricing' && (
            <div className="space-y-6">
              {/* Part 1: Pricing Section Header & Topup Banner */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                      سربرگ بخش تعرفه‌ها و بنر شارژ دلخواه
                    </h3>
                    <p className="text-[11px] text-[#717b91]">
                      تنظیم عنوان و توضیحات بخش قیمت‌گذاری لندینگ و بنر شارژ با مبلغ دلخواه (Pay-As-You-Go).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSection('landing_pricing_header', pricingHeader)}
                      disabled={savingSection === 'landing_pricing_header'}
                      className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSection === 'landing_pricing_header' ? 'در حال ذخیره...' : 'ذخیره سربرگ تعرفه'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetSection('landing_pricing_header')}
                      className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e] cursor-pointer"
                      title="بازگردانی به پیش‌فرض کارخانه"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {pricingHeader && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#0f1420] dark:text-white block mb-1">
                          برچسب انگلیسی بالای تعرفه (Badge):
                        </label>
                        <input
                          type="text"
                          value={pricingHeader.badge || ''}
                          onChange={(e) => setPricingHeader({ ...pricingHeader, badge: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620] text-[#0f1420] dark:text-white font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#0f1420] dark:text-white block mb-1">
                          تیتر اصلی بخش تعرفه‌ها:
                        </label>
                        <input
                          type="text"
                          value={pricingHeader.title || ''}
                          onChange={(e) => setPricingHeader({ ...pricingHeader, title: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620] text-[#0f1420] dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0f1420] dark:text-white block mb-1">
                        زیرتیتر توضیحات تعرفه‌ها:
                      </label>
                      <textarea
                        rows={2}
                        value={pricingHeader.subtitle || ''}
                        onChange={(e) => setPricingHeader({ ...pricingHeader, subtitle: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620] text-[#0f1420] dark:text-white leading-relaxed"
                      />
                    </div>

                    {/* Custom Topup Banner Settings */}
                    <div className="pt-3 border-t border-[#e6e9f0] dark:border-[#1b202e] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#0f1420] dark:text-white">
                            بنر شارژ با مبلغ دلخواه (زیر کارت‌های تعرفه)
                          </h4>
                          <p className="text-[10px] text-[#717b91]">
                            امکان شارژ حساب بدون خرید بسته ثابت
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPricingHeader({
                            ...pricingHeader,
                            customTopupBanner: {
                              ...pricingHeader.customTopupBanner,
                              enabled: pricingHeader.customTopupBanner?.enabled === false ? true : false
                            }
                          })}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                            pricingHeader.customTopupBanner?.enabled !== false ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              pricingHeader.customTopupBanner?.enabled !== false ? 'translate-x-1' : 'translate-x-5.5'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-[#717b91] block mb-1">عنوان بنر شارژ دلخواه:</label>
                          <input
                            type="text"
                            value={pricingHeader.customTopupBanner?.title || ''}
                            onChange={(e) => setPricingHeader({
                              ...pricingHeader,
                              customTopupBanner: {
                                ...pricingHeader.customTopupBanner,
                                title: e.target.value
                              }
                            })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#717b91] block mb-1">متن دکمه بنر:</label>
                          <input
                            type="text"
                            value={pricingHeader.customTopupBanner?.btnText || ''}
                            onChange={(e) => setPricingHeader({
                              ...pricingHeader,
                              customTopupBanner: {
                                ...pricingHeader.customTopupBanner,
                                btnText: e.target.value
                              }
                            })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-[#f8f9fb] dark:bg-[#131620]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Part 2: Gift Card */}
              {giftCard && (
                <div className="space-y-4 pt-4 border-t border-[#e6e9f0] dark:border-[#1b202e]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                        مدیریت کارت هدیه ثبت‌نام (لندینگ)
                      </h3>
                      <p className="text-[11px] text-[#717b91]">
                        تنظیم و سفارشی‌سازی متن، امکانات و سهمیه توکن کارت رایگان هدیه در بخش تعرفه‌های صفحه اصلی.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveSection('landing_gift_card', giftCard)}
                        disabled={savingSection === 'landing_gift_card'}
                        className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingSection === 'landing_gift_card' ? 'در حال ذخیره...' : 'ذخیره کارت هدیه'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetSection('landing_gift_card')}
                        className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                        title="بازگردانی به پیش‌فرض کارخانه"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Fields (2 columns) */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
                  {/* Enabled toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9fb] dark:bg-[#131620] border border-[#e2e5eb] dark:border-[#1b202e]">
                    <div>
                      <h4 className="text-xs font-bold text-[#0f1420] dark:text-white">نمایش کارت هدیه در لندینگ</h4>
                      <p className="text-[11px] text-[#717b91]">در صورت غیرفعال بودن، کارت هدیه رایگان از بخش قیمت‌گذاری لندینگ حذف می‌شود.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGiftCard({ ...giftCard, enabled: !giftCard.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        giftCard.enabled !== false ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          giftCard.enabled !== false ? 'translate-x-1' : 'translate-x-6'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                        عنوان کارت
                      </label>
                      <input
                        type="text"
                        value={giftCard.title}
                        onChange={(e) => setGiftCard({ ...giftCard, title: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="مثال: هدیه ثبت‌نام"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                        برچسب نشان (Badge)
                      </label>
                      <input
                        type="text"
                        value={giftCard.badge}
                        onChange={(e) => setGiftCard({ ...giftCard, badge: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="مثال: هدیه بدون قیدوشرط"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                        متن قیمت / وضعیت
                      </label>
                      <input
                        type="text"
                        value={giftCard.price || 'رایگان'}
                        onChange={(e) => setGiftCard({ ...giftCard, price: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="مثال: رایگان"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                        متن دکمه اقدام
                      </label>
                      <input
                        type="text"
                        value={giftCard.ctaText}
                        onChange={(e) => setGiftCard({ ...giftCard, ctaText: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="مثال: شروع با اعتبار هدیه"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                        تخمین سهمیه توکن
                      </label>
                      <input
                        type="text"
                        value={giftCard.tokenEstimate}
                        onChange={(e) => setGiftCard({ ...giftCard, tokenEstimate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="مثال: ~۱۵۰,۰۰۰ توکن سهمیه"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                        تخمین تعداد پیام‌ها
                      </label>
                      <input
                        type="text"
                        value={giftCard.messagesCount}
                        onChange={(e) => setGiftCard({ ...giftCard, messagesCount: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                        placeholder="مثال: حدود ۱۵۰ تا ۲۰۰ پیام کامل"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                      متن توضیحات کارت
                    </label>
                    <textarea
                      rows={2}
                      value={giftCard.desc}
                      onChange={(e) => setGiftCard({ ...giftCard, desc: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                      placeholder="توضیح کوتاه کارت هدیه..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1.5">
                      امکانات و مزایای کارت هدیه (هر سطر یک ویژگی)
                    </label>
                    <textarea
                      rows={4}
                      value={Array.isArray(giftCard.features) ? giftCard.features.join('\n') : giftCard.features || ''}
                      onChange={(e) => setGiftCard({ ...giftCard, features: e.target.value.split('\n').filter(Boolean) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-mono leading-relaxed"
                      placeholder="دسترسی کامل به تمام مدل‌ها&#10;بدون نیاز به کارت بانکی&#10;تحلیل اسناد و جستجوی زنده وب"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#717b91] block">پیش‌نمایش زنده کارت هدیه:</span>
                  <div className="rounded-2xl p-6 bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] text-[#111622] dark:text-white shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="mb-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#eef1f6] dark:bg-[#181d2a] text-[#525d75] dark:text-[#9aa5bc]">
                          {giftCard.badge || 'هدیه بدون قیدوشرط'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold mb-2">
                        {giftCard.title || 'هدیه ثبت‌نام'}
                      </h3>

                      <div className="flex items-baseline gap-1.5 mb-4">
                        <span className="text-3xl font-black tracking-tight">
                          {giftCard.price || 'رایگان'}
                        </span>
                      </div>

                      {(giftCard.tokenEstimate || giftCard.messagesCount) && (
                        <div className="p-3 rounded-xl mb-4 text-xs space-y-1 bg-[#f8f9fb] dark:bg-[#131722] text-[#333c4e] dark:text-[#ccd3e0]">
                          {giftCard.tokenEstimate && <div className="font-bold">{giftCard.tokenEstimate}</div>}
                          {giftCard.messagesCount && <div className="text-[11px] opacity-80">{giftCard.messagesCount}</div>}
                        </div>
                      )}

                      {giftCard.desc && (
                        <p className="text-xs opacity-80 leading-relaxed mb-6">{giftCard.desc}</p>
                      )}

                      {giftCard.features && giftCard.features.length > 0 && (
                        <ul className="space-y-2 text-xs mb-6">
                          {giftCard.features.map((feat: string, fIdx: number) => (
                            <li key={fIdx} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10]">
                      {giftCard.ctaText || 'شروع با اعتبار هدیه'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Part 3: Digital Plans Notice */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong>بسته‌های تعرفه (برنزی، نقره‌ای، طلایی و...):</strong>
                  {' '}برای افزودن، ویرایش قیمت، عکس هدر، یا حذف هر بسته، می‌توانید به بخش «محصولات دیجیتال» در تب بالای پنل مدیریت مراجعه فرمایید.
                </span>
              </div>
            </div>
          </div>
        )}

          {/* SubTab D: CTA Banner */}
          {activeLandingSubTab === 'cta' && cta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                    مدیریت کارت پایانی دعوت به اقدام (CTA) و هدیه
                  </h3>
                  <p className="text-[11px] text-[#717b91]">
                    کارت دعوت به ثبت‌نام و شروع گفتگو در انتهای صفحه اصلی، همراه با انتخاب پالت رنگی اختصاصی.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSection('landing_cta', cta)}
                    disabled={savingSection === 'landing_cta'}
                    className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'landing_cta' ? 'در حال ذخیره...' : 'ذخیره کارت CTA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetSection('landing_cta')}
                    className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                    title="بازگردانی به پیش‌فرض کارخانه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                      تیتر کارت هدیه و ثبت‌نام
                    </label>
                    <input
                      type="text"
                      value={cta.title}
                      onChange={(e) => setCta({ ...cta, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                      پالت رنگی کارت پایانی (Theme)
                    </label>
                    <select
                      value={cta.theme || 'dark'}
                      onChange={(e) => setCta({ ...cta, theme: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                    >
                      {CTA_THEME_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                    متن توضیحات کارت هدیه
                  </label>
                  <textarea
                    rows={2}
                    value={cta.desc}
                    onChange={(e) => setCta({ ...cta, desc: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#e6e9f0] dark:border-[#1b202e]">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#0f1420] dark:text-white">
                      دکمه اصلی (Primary Action)
                    </label>
                    <input
                      type="text"
                      value={cta.primaryBtnText}
                      onChange={(e) => setCta({ ...cta, primaryBtnText: e.target.value })}
                      placeholder="متن دکمه (مثال: ورود به محیط چت)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                    />
                    <input
                      type="text"
                      value={cta.primaryBtnLink}
                      onChange={(e) => setCta({ ...cta, primaryBtnLink: e.target.value })}
                      placeholder="لینک دکمه (مثال: /chat)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#0f1420] dark:text-white">
                      دکمه دوم (Secondary Action)
                    </label>
                    <input
                      type="text"
                      value={cta.secondaryBtnText}
                      onChange={(e) => setCta({ ...cta, secondaryBtnText: e.target.value })}
                      placeholder="متن دکمه دوم (مثال: مشاهده فروشگاه)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                    />
                    <input
                      type="text"
                      value={cta.secondaryBtnLink}
                      onChange={(e) => setCta({ ...cta, secondaryBtnLink: e.target.value })}
                      placeholder="لینک دکمه دوم (مثال: /store)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STORE DESIGN & SHOWCASE                               */}
      {/* ======================================================== */}
      {activeSection === 'store' && storeDesign && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                طراحی هدر، بنرها و اطلاعیه فروشگاه
              </h3>
              <p className="text-[11px] text-[#717b91]">
                کنترل ظاهر و پیام‌های تخفیف و تبلیغات بالای کاتالوگ فروشگاه.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSection('store_design', storeDesign)}
                disabled={savingSection === 'store_design'}
                className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === 'store_design' ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection('store_design')}
                className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                title="بازگردانی به پیش‌فرض کارخانه"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                تیتر اصلی بالای فروشگاه
              </label>
              <input
                type="text"
                value={storeDesign.heroTitle}
                onChange={(e) => setStoreDesign({ ...storeDesign, heroTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                توضیحات و زیرتیتر فروشگاه
              </label>
              <textarea
                rows={2}
                value={storeDesign.heroSubtitle}
                onChange={(e) => setStoreDesign({ ...storeDesign, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
              />
            </div>

            {/* Announcement Banner */}
            <div className="pt-3 border-t border-[#e6e9f0] dark:border-[#1b202e] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0f1420] dark:text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>نوار اطلاعیه و تخفیف بالای محصولات (Announcement Bar)</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setStoreDesign({
                      ...storeDesign,
                      announcementBar: {
                        ...storeDesign.announcementBar,
                        enabled: !storeDesign.announcementBar.enabled
                      }
                    })
                  }
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                    storeDesign.announcementBar.enabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-500/10 border-slate-500/30 text-slate-500'
                  }`}
                >
                  {storeDesign.announcementBar.enabled ? 'فعال' : 'غیرفعال'}
                </button>
              </div>

              <input
                type="text"
                value={storeDesign.announcementBar.text}
                onChange={(e) =>
                  setStoreDesign({
                    ...storeDesign,
                    announcementBar: {
                      ...storeDesign.announcementBar,
                      text: e.target.value
                    }
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                placeholder="متن پیام تخفیف یا اطلاعیه..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BLOG DESIGN & LAYOUT                                  */}
      {/* ======================================================== */}
      {activeSection === 'blog' && blogDesign && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                طراحی هدر، تگ‌ها و ساختار وبلاگ
              </h3>
              <p className="text-[11px] text-[#717b91]">
                مدیریت تیتر، توضیحات و تگ‌های داغ در مجله هوش مصنوعی.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSection('blog_design', blogDesign)}
                disabled={savingSection === 'blog_design'}
                className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === 'blog_design' ? 'در حال ذخیره...' : 'ذخیره تنظیمات وبلاگ'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection('blog_design')}
                className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                title="بازگردانی به پیش‌فرض کارخانه"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                تیتر هدر مجله و وبلاگ
              </label>
              <input
                type="text"
                value={blogDesign.headerTitle}
                onChange={(e) => setBlogDesign({ ...blogDesign, headerTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                زیرتیتر و توضیحات وبلاگ
              </label>
              <textarea
                rows={2}
                value={blogDesign.headerSubtitle}
                onChange={(e) => setBlogDesign({ ...blogDesign, headerSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                تگ‌ها و کلیدواژه‌های داغ (با ویرگول جدا کنید)
              </label>
              <input
                type="text"
                value={blogDesign.trendingTags.join('، ')}
                onChange={(e) =>
                  setBlogDesign({
                    ...blogDesign,
                    trendingTags: e.target.value
                      .split(/,|،/)
                      .map((t) => t.trim())
                      .filter(Boolean)
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
                placeholder="هوش مصنوعی، فناوری، کدنویسی، سئو"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FOOTER SETTINGS & CUSTOMIZATION                       */}
      {/* ======================================================== */}
      {activeSection === 'footer' && footerSettings && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0f1420] dark:text-white">
                شخصی‌سازی فوتر و پاورقی سایت
              </h3>
              <p className="text-[11px] text-[#717b91]">
                کنترل متون معرفی، راه‌های ارتباطی و کپی‌رایت فوتر (نماد اعتماد اینماد جهت امنیت و انطباق قانونی حفظ می‌شود).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSection('footer_settings', footerSettings)}
                disabled={savingSection === 'footer_settings'}
                className="px-3 py-1.5 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === 'footer_settings' ? 'در حال ذخیره...' : 'ذخیره فوتر'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetSection('footer_settings')}
                className="p-1.5 rounded-lg text-[#717b91] hover:text-[#0f1420] dark:hover:text-white hover:bg-[#eef1f6] dark:hover:bg-[#1b202e]"
                title="بازگردانی به پیش‌فرض کارخانه"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                عنوان برند در فوتر
              </label>
              <input
                type="text"
                value={footerSettings.brandTitle}
                onChange={(e) => setFooterSettings({ ...footerSettings, brandTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                توضیحات معرفی و درباره ما در فوتر
              </label>
              <textarea
                rows={3}
                value={footerSettings.brandDesc}
                onChange={(e) => setFooterSettings({ ...footerSettings, brandDesc: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#525d75] dark:text-[#ccd3e0]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                  ایمیل پشتیبانی و تماس
                </label>
                <input
                  type="email"
                  value={footerSettings.supportEmail}
                  onChange={(e) => setFooterSettings({ ...footerSettings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                  لینک کانال یا پشتیبانی تلگرام
                </label>
                <input
                  type="text"
                  value={footerSettings.telegramChannel}
                  onChange={(e) => setFooterSettings({ ...footerSettings, telegramChannel: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0f1420] dark:text-white mb-1">
                متن کپی‌رایت انتهای فوتر
              </label>
              <input
                type="text"
                value={footerSettings.copyrightText}
                onChange={(e) => setFooterSettings({ ...footerSettings, copyrightText: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d8dce6] dark:border-[#1e2433] bg-white dark:bg-[#131722] text-[#0f1420] dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
