import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Sparkles,
  MessageSquare,
  Store,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Gift,
  Coins,
  Crown,
  CheckCircle2,
  Zap,
  Globe,
  Image as ImageIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Search,
  Check,
  Copy,
  Menu,
  X,
  FileText,
  SlidersHorizontal,
  Code2,
  Terminal,
  ExternalLink,
  CreditCard,
  Lock,
  Compass,
  FileCheck,
  GraduationCap,
  PenTool,
  Scale,
  TrendingUp,
  Stethoscope,
  Wallet,
  Smartphone,
  Monitor,
  Tablet,
  Download
} from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { CheckoutModal } from '../../components/CheckoutModal';
import { UsageAnalyticsSection } from '../../components/UsageAnalyticsSection';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';
import { useUIStore } from '../../store/uiStore';
import { isBazaarEnvironment } from '../../lib/bazaarUtils';

// Import content config
import {
  landingPageContent,
  landingDemoScenarios,
  landingGalleryImages,
  landingGallerySettings
} from '../../config/landingContent';
import type { LandingPageContent } from '../../config/landingContent';

function formatDemoAiResponse(response: string, scenarioId?: string): string {
  if (!response) return '';
  const trimmed = response.trim();
  if (trimmed.includes('```')) {
    return trimmed;
  }
  if (
    scenarioId === 'developer' ||
    scenarioId === 'coding' ||
    trimmed.startsWith('import ') ||
    trimmed.startsWith('export ') ||
    trimmed.startsWith('const ') ||
    trimmed.startsWith('function ') ||
    trimmed.includes('IntersectionObserver')
  ) {
    return `\`\`\`typescript\n${trimmed}\n\`\`\``;
  }
  return trimmed;
}

interface DemoScenario {
  id: string;
  label: string;
  icon: any;
  model: string;
  modelBadge: string;
  userPrompt: string;
  aiResponse: string;
}

// Use imported content config
const DEMO_SCENARIOS = landingDemoScenarios;

const ICON_MAP: Record<string, any> = {
  GraduationCap,
  Terminal,
  PenTool,
  Scale,
  TrendingUp,
  Stethoscope,
  Coins,
  Zap,
  ShieldCheck,
  Sparkles
};

const COLOR_NAME_TO_HEX: Record<string, string> = {
  indigo: '#4f46e5',
  emerald: '#059669',
  purple: '#9333ea',
  amber: '#d97706',
  slate: '#475569',
};

const resolveAccentHex = (accent?: string): string => {
  if (!accent) return '#475569';
  if (accent.startsWith('#')) return accent;
  return COLOR_NAME_TO_HEX[accent] || '#475569';
};

const getAccentStyles = (accent?: string) => {
  const hex = resolveAccentHex(accent);
  return {
    hex,
    badgeStyle: {
      backgroundColor: `${hex}1f`,
      color: hex,
      borderColor: `${hex}45`,
    },
    btnStyle: {
      backgroundColor: hex,
      color: '#ffffff',
    },
    cardStyle: {
      '--card-accent': hex,
    } as React.CSSProperties
  };
};

const getCtaThemeStyles = (theme?: string) => {
  switch (theme) {
    case 'indigo':
      return {
        card: 'bg-indigo-950 dark:bg-indigo-900 border border-indigo-700/40 text-white shadow-indigo-900/20',
        primaryBtn: 'bg-white text-indigo-950 hover:bg-indigo-50',
        secondaryBtn: 'border-white/20 hover:bg-white/10 text-white'
      };
    case 'emerald':
      return {
        card: 'bg-emerald-950 dark:bg-emerald-900 border border-emerald-700/40 text-white shadow-emerald-900/20',
        primaryBtn: 'bg-white text-emerald-950 hover:bg-emerald-50',
        secondaryBtn: 'border-white/20 hover:bg-white/10 text-white'
      };
    case 'amber':
      return {
        card: 'bg-amber-950 dark:bg-amber-900 border border-amber-700/40 text-white shadow-amber-900/20',
        primaryBtn: 'bg-white text-amber-950 hover:bg-amber-50',
        secondaryBtn: 'border-white/20 hover:bg-white/10 text-white'
      };
    case 'slate':
      return {
        card: 'bg-slate-900 dark:bg-slate-850 border border-slate-700/50 text-white shadow-slate-900/20',
        primaryBtn: 'bg-white text-slate-950 hover:bg-slate-100',
        secondaryBtn: 'border-white/20 hover:bg-white/10 text-white'
      };
    case 'white':
      return {
        card: 'bg-white dark:clay-input dark:border-[var(--card-border)] text-[#0f1420] dark:text-white ',
        primaryBtn: 'clay-surface hover:clay-surface dark:bg-white dark:hover:clay-surface text-white dark:text-[#0a0c10]',
        secondaryBtn: 'border-[var(--card-border)] dark:border-[var(--card-border)] hover:clay-surface dark:hover:clay-surface text-[#0f1420] dark:text-white'
      };
    case 'dark':
    default:
      return {
        card: 'clay-surface dark:bg-white text-white dark:text-[#0a0c10] ',
        primaryBtn: 'bg-white text-[#0a0c10] hover:clay-surface dark:clay-surface dark:text-white dark:hover:clay-surface',
        secondaryBtn: 'border-white/20 dark:border-[var(--card-border)] hover:bg-white/10 dark:hover:clay-surface text-inherit'
      };
  }
};

const MANIFESTO_CARD_THEMES = [
  {
    card: 'clay-surface-inset border border-black/[0.04] dark:border-white/[0.04]',
    iconColor: 'text-indigo-500 dark:text-indigo-400'
  },
  {
    card: 'clay-surface-inset border border-black/[0.04] dark:border-white/[0.04]',
    iconColor: 'text-rose-500 dark:text-rose-400'
  },
  {
    card: 'clay-surface-inset border border-black/[0.04] dark:border-white/[0.04]',
    iconColor: 'text-emerald-500 dark:text-emerald-400'
  }
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { setIsWalletOpen } = useUIStore();

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>(landingPageContent.demoScenarios[0]);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  // Animated 3D Gallery Carousel State & Auto-play (Infinite Seamless Loop)
  const [gallerySlide, setGallerySlide] = useState<number>(6); // Start at middle set
  const [isGalleryPaused, setIsGalleryPaused] = useState<boolean>(false);
  const [galleryTransition, setGalleryTransition] = useState<boolean>(true);

  // 3D Spotlight Professions Stage State & Typewriter
  const [activeProfessionIdx, setActiveProfessionIdx] = useState<number>(0);
  const [isProfessionsPaused, setIsProfessionsPaused] = useState<boolean>(false);
  const [typedPrompt, setTypedPrompt] = useState<string>('');
  const [copiedProfessionPrompt, setCopiedProfessionPrompt] = useState<boolean>(false);

// Use imported FAQ content
  const faqs = Array.isArray(landingPageContent.faqs)
    ? landingPageContent.faqs
    : ((landingPageContent.faqs as any)?.faqs || []);

  // Use imported content config
  const professionCards = Array.isArray(landingPageContent.professions)
    ? landingPageContent.professions
    : ((landingPageContent.professions as any)?.cards || []);

  const galleryImages = Array.isArray(landingPageContent.galleryImages)
    ? landingPageContent.galleryImages
    : ((landingPageContent.gallery as any)?.images || []);

  const packages = landingPageContent.pricing.plans;

  // Dynamic Live Content State (Managed via Admin CMS Studio)
  const [dynamicVisibility, setDynamicVisibility] = useState<any>({
    hero: true,
    features: true,
    manifesto: true,
    professions: true,
    gallery: true,
    analytics: true,
    pricing: true,
    faqs: true,
    cta: true
  });
  const [dynamicHero, setDynamicHero] = useState<any>(null);
  const [dynamicFeatures, setDynamicFeatures] = useState<any>(null);
  const [dynamicManifesto, setDynamicManifesto] = useState<any>(null);
  const [dynamicProfessions, setDynamicProfessions] = useState<any[]>(professionCards);
  const [dynamicProfessionsSettings, setDynamicProfessionsSettings] = useState<any>(null);
  const [dynamicGallery, setDynamicGallery] = useState<any[]>(galleryImages);
  const [dynamicGallerySettings, setDynamicGallerySettings] = useState<any>(null);
  const [dynamicPricingHeader, setDynamicPricingHeader] = useState<any>(null);
  const [dynamicFaqs, setDynamicFaqs] = useState<any[]>(faqs);
  const [dynamicFaqsSettings, setDynamicFaqsSettings] = useState<any>(null);
  const [dynamicCta, setDynamicCta] = useState<any>(null);
  const [dynamicGiftCard, setDynamicGiftCard] = useState<any>(null);
  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);
  const isBazaar = isBazaarEnvironment();

  useEffect(() => {
    fetch('/api/landing-content')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (data.visibility) setDynamicVisibility((prev: any) => ({ ...prev, ...data.visibility }));
        if (data.hero) setDynamicHero(data.hero);
        if (data.features) setDynamicFeatures(data.features);
        if (data.manifesto && data.manifesto.title) setDynamicManifesto(data.manifesto);
        if (data.professions) {
          const list = Array.isArray(data.professions)
            ? data.professions
            : (data.professions.cards || []);
          const activeOnes = list
            .filter((p: any) => p && p.enabled !== false)
            .map((p: any) => ({
              ...p,
              image: typeof p.image === 'string' ? p.image.replace(/\.(jpg|jpeg|png)$/i, '.webp') : p.image
            }));
          if (activeOnes.length > 0) setDynamicProfessions(activeOnes);
        }
        if (data.professionsSettings) setDynamicProfessionsSettings(data.professionsSettings);
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
          setDynamicGallery(data.gallery);
        }
        if (data.gallerySettings) setDynamicGallerySettings(data.gallerySettings);
        if (data.pricingHeader) setDynamicPricingHeader(data.pricingHeader);
        if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) setDynamicFaqs(data.faqs);
        if (data.faqsSettings) setDynamicFaqsSettings(data.faqsSettings);
        if (data.cta && data.cta.title) setDynamicCta(data.cta);
        if (data.giftCard) setDynamicGiftCard(data.giftCard);
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) setDynamicPlans(data.plans);
      })
      .catch((err) => console.warn('[Landing] Using local static fallback:', err));
  }, []);

  // SEO & GEO (Generative Engine Optimization) Initialization
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a
        }
      }))
    };

    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'دستیار هوشمند | پلتفرم هوش مصنوعی فارسی',
      url: 'https://dastyarai.com',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'All',
      inLanguage: 'fa-IR',
      description: 'دستیار هوشمند فارسی با پشتیبانی از مدل‌های Claude 3.5 Sonnet، GPT-4o، Gemini 2.0، استودیو تصویرساز Flux و پرداخت ریالی بدون فیلترشکن.',
      featureList: [
        'گفتگوی فارسی روان با برترین مدل‌های هوش مصنوعی جهان',
        'اتصال مستقیم بدون نیاز به فیلترشکن یا شماره مجازی',
        'دسترسی سریع و تست رایگان مدل‌های پیشرو هوش مصنوعی',
        'مدل پرداخت ریالی Pay-As-You-Go به اندازه مصرف واقعی کلمات',
        'تحلیل عمیق اسناد متنی، کتاب و فایل‌های PDF',
        'استودیوی تصویرساز هایپررئال با پرامپت فارسی',
        'سوییچ و روتینگ هوشمند بر اساس هدف کاربر'
      ],
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'IRR',
        lowPrice: '0',
        highPrice: '3490000',
        offerCount: '4'
      }
    };

    setPageSeo({
      title: 'دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته',
      description: 'چت با هوش مصنوعی رایگان فارسی با مدل‌های ChatGPT، Claude و Gemini. جستجوی زنده وب، تولید تصویر و فروشگاه ابزارهای AI بدون نیاز به فیلترشکن.',
      keywords: 'هوش مصنوعی فارسی, چت با هوش مصنوعی, چت جی پی تی بدون فیلترشکن, کلود فارسی, خرید توکن هوش مصنوعی, تولید تصویر هوش مصنوعی, هوش مصنوعی رایگان, دستیار هوشمند',
      canonical: 'https://dastyarai.com/',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [softwareSchema, faqSchema]
      }
    });
  }, []);

  // Auto-play interval for Gallery Carousel (pauses on hover)
  useEffect(() => {
    if (isGalleryPaused) return;
    const list = (dynamicGallery && dynamicGallery.length > 0) ? dynamicGallery : galleryImages;
    if (!list || list.length <= 1) return;
    const timer = setInterval(() => {
      setGalleryTransition(true);
      setGallerySlide((prev) => prev + 1);
    }, 3800);
    return () => clearInterval(timer);
  }, [isGalleryPaused, dynamicGallery]);

  // Re-enable smooth transition on the next animation frame after an invisible wrap
  useEffect(() => {
    if (!galleryTransition) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGalleryTransition(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [galleryTransition]);

  // Typewriter effect for active profession prompt
  useEffect(() => {
    const list = Array.isArray(dynamicProfessions) && dynamicProfessions.length > 0 ? dynamicProfessions : professionCards;
    if (!Array.isArray(list) || list.length === 0) return;
    const currentCard = list[activeProfessionIdx] || list[0];
    if (!currentCard?.prompt) return;
    const fullText = currentCard.prompt;
    setTypedPrompt('');
    setCopiedProfessionPrompt(false);

    let i = 0;
    const step = Math.max(1, Math.floor(fullText.length / 35));
    const timer = setInterval(() => {
      i += step;
      if (i >= fullText.length) {
        setTypedPrompt(fullText);
        clearInterval(timer);
      } else {
        setTypedPrompt(fullText.slice(0, i));
      }
    }, 25);

    return () => clearInterval(timer);
  }, [activeProfessionIdx, dynamicProfessions, professionCards]);

  // Auto-play interval for Professions Spotlight Stage
  useEffect(() => {
    if (isProfessionsPaused) return;
    const list = Array.isArray(dynamicProfessions) && dynamicProfessions.length > 0 ? dynamicProfessions : professionCards;
    if (!Array.isArray(list) || list.length <= 1) return;
    const timer = setInterval(() => {
      setActiveProfessionIdx((prev) => (prev + 1) % list.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isProfessionsPaused, dynamicProfessions, professionCards]);

  const copyProfessionPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedProfessionPrompt(true);
    setTimeout(() => setCopiedProfessionPrompt(false), 2500);
  };

  const copyPromptToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  // High-performance IntersectionObserver for entrance animations (Zero forced reflows)
  useEffect(() => {
    const selector = '.reveal-init, .reveal-from-right, .reveal-from-left, .reveal-pop';

    if (typeof IntersectionObserver === 'undefined') {
      const elements = document.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) elements[i].classList.add('reveal-active');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: '120px 0px 40px 0px',
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.classList.contains('reveal-active')) {
          observer.observe(el);
        }
      }
    };

    observeAll();
    const t1 = setTimeout(observeAll, 120);
    const t2 = setTimeout(observeAll, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [dynamicProfessions, dynamicGallery, dynamicPlans, dynamicFaqs]);

  return (
    <div className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] selection:clay-surface selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors overflow-x-hidden" dir="rtl">

      {/* ---------------- 1. Claymorphic Floating Header ---------------- */}
      <GlobalHeader />

      <main id="main-content" className="flex-1">
      {/* ---------------- 2. Hero Section (Thick 3D Claymorphism) ---------------- */}
      {dynamicVisibility.hero !== false && dynamicHero?.enabled !== false && (
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Top Feature Pill (Only rendered if configured) */}
        {Boolean(dynamicHero?.featurePill) && (
          <div className="reveal-pop inline-flex items-center gap-2.5 px-4 py-2 clay-pill-thick text-xs font-bold mb-6">
            <div className="w-5 h-5 rounded-full clay-crown-badge flex items-center justify-center text-[#df9f40] ">
              <Crown className="w-3 h-3 fill-[#df9f40]" />
            </div>
            <span className="text-[#0f1420] dark:text-[#e4e7ee]">
              {dynamicHero?.featurePill}
            </span>
          </div>
        )}

        {/* Headline (Refined, Proportional Typography) */}
        <h1
          className="text-2xl sm:text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 leading-[1.3] max-w-2xl py-2 px-1 mb-2"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          {dynamicHero?.title || (
            <>
              دسترسی مستقیم و بدون واسطه به <br className="hidden sm:inline" />
              <span className="text-[#2563eb] dark:text-white">برترین هوش‌های مصنوعی</span> جهان
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] max-w-xl font-normal leading-relaxed mb-8">
          {dynamicHero?.subtitle || 'بدون نیاز به خرید اشتراک‌های ماهانه دلاری یا دغدغه فیلترشکن؛ با پرچمداران Claude 3.5، GPT-4o و Gemini به فارسی گفتگو کنید و هزینه را به اندازه مصرف واقعی به تومان بپردازید.'}
        </p>

        {/* Infinite Scrolling Models Banner (Replacing Control Console) */}
        <div className="w-full max-w-5xl mx-auto mt-8 mb-12 relative">
          
          <style>{`
            @keyframes marquee-rtl {
              0% { transform: translateX(0); }
              100% { transform: translateX(50%); }
            }
            .animate-marquee-rtl {
              animation: marquee-rtl 25s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-marquee-rtl:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="clay-card-elevated p-4 sm:p-10 overflow-hidden flex flex-col items-center text-center relative">
            {/* Glow removed as requested */}

            {/* Banner Title */}
            <h2 className="text-xl sm:text-3xl font-black leading-[1.6] sm:leading-normal text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 dark:from-rose-400 dark:to-orange-400 py-2 px-1 mb-1 relative z-10" style={{ fontFamily: "'Estedad', sans-serif" }}>
              {dynamicHero?.bannerTitle || 'یک کلید برای تمام پرچمداران جهان'}
            </h2>
            <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] max-w-xl mx-auto mb-10 relative z-10 leading-relaxed">
              {dynamicHero?.bannerSubtitle || 'بدون نیاز به ده‌ها اکانت ارزی. پلتفرم ما جامع‌ترین درگاه را با پشتیبانی کامل از تمامی مدل‌های قدرتمند هوش مصنوعی در اختیار شما قرار می‌دهد.'}
            </p>

            {/* Marquee Track */}
            <div className="w-full overflow-hidden relative z-10 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="animate-marquee-rtl gap-4 sm:gap-6 pr-4">
                {/* Duplicated list for seamless loop */}
                {[...Array(2)].map((_, i) => (
                  <React.Fragment key={i}>
                    {/* GPT-4o */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl hero-model-chip transition-transform hover:-translate-y-0.5 cursor-pointer shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#10a37f] border border-black/5 dark:border-white/5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-90"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A6.0651 6.0651 0 0 0 19.0192 19.818a5.9847 5.9847 0 0 0 3.9977-2.9 6.0462 6.0462 0 0 0-.735-7.0968zM8.7505 18.2588a4.5078 4.5078 0 0 1-2.4828-4.2238l.0047-.1165 4.5492 2.627v5.253a4.5204 4.5204 0 0 1-2.0711-3.5397zm-3.518-7.9044a4.5078 4.5078 0 0 1 1.0506-4.739 4.4962 4.4962 0 0 1 3.5332-1.2828L5.2671 6.959v5.254l-4.5492-2.6264zm10.0526-7.234a4.5078 4.5078 0 0 1 4.2238 2.4828 4.4962 4.4962 0 0 1-.225 3.7388L14.7347 6.716 10.1855 4.089v-5.253a4.5078 4.5078 0 0 1 5.1016 1.8344zm3.4897 7.9044a4.5078 4.5078 0 0 1-1.0506 4.739 4.4962 4.4962 0 0 1-3.5332 1.2828l4.5492-2.6264V9.022l4.5492 2.6264zm-10.0526 7.234a4.5078 4.5078 0 0 1-4.2238-2.4828 4.4962 4.4962 0 0 1 .225-3.7388L9.2653 17.284 13.8145 19.911v5.253a4.5078 4.5078 0 0 1-5.1016-1.8344zM16.3262 10.038l-4.269 2.4646-4.269-2.4646V5.109l4.269 2.4646 4.269-2.4646v4.929z" /></svg>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>GPT-4o</div>
                        <div className="type-badge font-bold text-[#525d75] dark:text-[#9aa5bc]">OpenAI</div>
                      </div>
                    </div>
                    
                    {/* Claude 3.5 */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl hero-model-chip transition-transform hover:-translate-y-0.5 cursor-pointer shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#d97757] border border-black/5 dark:border-white/5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 opacity-90"><path d="M18.8 20.5H22L12 3H8.8L-0 20.5H3.2L12 4.6L18.8 20.5ZM12.2 16.5H15.4L13.8 13.3L12.2 16.5Z"/></svg>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>Claude 3.5</div>
                        <div className="type-badge font-bold text-[#525d75] dark:text-[#9aa5bc]">Anthropic</div>
                      </div>
                    </div>

                    {/* Gemini Flash */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl hero-model-chip transition-transform hover:-translate-y-0.5 cursor-pointer shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#4285f4] border border-black/5 dark:border-white/5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-90"><path d="M12.025 24C12.025 17.5 17.5 12.025 24 12.025C17.5 12.025 12.025 6.5 12.025 0C12.025 6.5 6.5 12.025 0 12.025C6.5 12.025 12.025 17.5 12.025 24Z"/></svg>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>Gemini 1.5</div>
                        <div className="type-badge font-bold text-[#525d75] dark:text-[#9aa5bc]">Google</div>
                      </div>
                    </div>

                    {/* Flux Studio */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl hero-model-chip transition-transform hover:-translate-y-0.5 cursor-pointer shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#ec4899] border border-black/5 dark:border-white/5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 opacity-90"><path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM15 11H11V15H9V11H7V9H9V7H11V9H15V11Z"/></svg>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>Flux 8K</div>
                        <div className="type-badge font-bold text-[#525d75] dark:text-[#9aa5bc]">Black Forest</div>
                      </div>
                    </div>

                    {/* DeepSeek */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl hero-model-chip transition-transform hover:-translate-y-0.5 cursor-pointer shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#2563eb] border border-black/5 dark:border-white/5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-90"><path d="M12 21.5c-5.238 0-9.5-4.262-9.5-9.5S6.762 2.5 12 2.5s9.5 4.262 9.5 9.5-4.262 9.5-9.5 9.5zm0-17C7.86 4.5 4.5 7.86 4.5 12s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zM12 17c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"/></svg>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>DeepSeek V3</div>
                        <div className="type-badge font-bold text-[#525d75] dark:text-[#9aa5bc]">DeepSeek</div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Action Button inside Banner */}
            <div className="mt-10 relative z-10">
              <Link
                to={dynamicHero?.bannerBtnLink || "/chat"}
                aria-label="شروع رایگان گفتگو با دستیار هوشمند"
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-3.5 clay-btn-primary-thick font-black text-sm overflow-hidden"
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <span>{dynamicHero?.bannerBtnText || 'شروع رایگان گفتگو'}</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
              </Link>
            </div>

          </div>
        </div>
      </section>
      )}

      {/* ---------------- 3. Bento Grid: Visual Features (Thick 3D Claymorphic) ---------------- */}
      {dynamicVisibility.features !== false && dynamicFeatures?.enabled !== false && (
      <section id="models" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="reveal-init text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 tracking-tight py-2 px-1 mb-1"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            امکانات پیشرفته و قابلیت‌های اصلی
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            تمام نیازمندی‌های حرفه‌ای هوش مصنوعی از ترجمه و نگارش تا کدنویسی و تولید تصویر در یک سیستم یکپارچه.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: Multi-Model Flagship (Double Column) */}
          <div className="reveal-from-right stagger-1 md:col-span-2 clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl clay-debossed-socket p-1 mb-5 inline-flex items-center justify-center">
                <div className="w-11 h-11 rounded-xl clay-indigo flex items-center justify-center text-white shadow-[0_4px_22px_rgba(99,102,241,0.65)]">
                  <Cpu className="w-5 h-5 text-indigo-100" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f1420] dark:text-white mb-2.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                دسترسی همزمان به برترین مدل‌های جهان
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
                سوییچ آسان میان Claude 3.5 Sonnet، GPT-4o، Google Gemini 2.0 و DeepSeek-V3. با قابلیت سوییچ هوشمند، سیستم به طور خودکار نوع سوال شما را تشخیص داده و کار را به خبره‌ترین مدل واگذار می‌کند.
              </p>
            </div>
            {/* Visual Model Grid with Inset Tray & Balanced Matte Clay Badges */}
            <div className="p-2 rounded-3xl clay-debossed-socket mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="h-full flex flex-col justify-center items-center p-3.5 rounded-2xl clay-indigo text-center text-white transition-transform hover:-translate-y-1">
                  <span className="block font-black text-xs text-white">Claude 3.5</span>
                  <span className="type-badge text-white/80 font-medium">استاد نگارش و ادبیات</span>
                </div>
                <div className="h-full flex flex-col justify-center items-center p-3.5 rounded-2xl clay-charcoal text-center text-white transition-transform hover:-translate-y-1">
                  <span className="block font-black text-xs text-white">GPT-4o</span>
                  <span className="type-badge text-white/80 font-medium">پرچم‌دار همه‌کاره</span>
                </div>
                <div className="h-full flex flex-col justify-center items-center p-3.5 rounded-2xl clay-gold-noglow text-center text-white transition-transform hover:-translate-y-1">
                  <span className="block font-black text-xs text-white">Gemini 2.0</span>
                  <span className="type-badge text-white/80 font-medium">تحلیل چندرسانه‌ای و سرعت</span>
                </div>
                <div className="h-full flex flex-col justify-center items-center p-3.5 rounded-2xl clay-rose-noglow text-center text-white transition-transform hover:-translate-y-1">
                  <span className="block font-black text-xs text-white">DeepSeek V3</span>
                  <span className="type-badge text-white/80 font-medium">کدنویسی و استدلال</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: No VPN & Shetab Banking */}
          <div className="reveal-from-left stagger-2 clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl clay-debossed-socket p-1 mb-5 inline-flex items-center justify-center">
                <div className="w-11 h-11 rounded-xl clay-btn-emerald-thick flex items-center justify-center text-white shadow-[0_4px_22px_rgba(16,185,129,0.65)]">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f1420] dark:text-white mb-2.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                بدون فیلترشکن و پرداخت ریالی
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                بدون نیاز به ویزاکارت یا نگرانی از قطع شدن ارتباط؛ با کلیه کارت‌های عضو شتاب کیف پول خود را شارژ کنید و فقط به اندازه مصرف کلمات هزینه بپردازید.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
              <span className="text-xs font-bold text-[#10b981] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتبار خریداری‌شده هرگز منقضی نمی‌شود</span>
              </span>
            </div>
          </div>

          {/* Bento Card 3: Deep Document Analysis */}
          <div className="reveal-from-right stagger-3 clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl clay-debossed-socket p-1 mb-5 inline-flex items-center justify-center">
                <div className="w-11 h-11 rounded-xl clay-gold flex items-center justify-center text-white shadow-[0_4px_18px_rgba(223,159,64,0.45)]">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f1420] dark:text-white mb-2.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                تحلیل اسناد و فایل‌های سنگین
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                آپلود مستقیم کتاب‌ها و مقالات علمی PDF تا سقف ۵۰ مگابایت، فایل‌های کدنویسی و فایل‌های اکسل جهت تلخیص، استخراج اطلاعات و پرسش و پاسخ.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 type-badge font-semibold text-[#717b91]">
              پشتیبانی از PDF، کدهای برنامه‌نویسی و اسناد متنی
            </div>
          </div>

          {/* Bento Card 4: High-End Image Studio Showcase (Double Column) */}
          <div className="reveal-from-left stagger-4 md:col-span-2 clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl clay-debossed-socket p-1 mb-5 inline-flex items-center justify-center">
                <div className="w-11 h-11 rounded-xl clay-rose flex items-center justify-center text-white shadow-[0_4px_18px_rgba(226,144,138,0.45)]">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f1420] dark:text-white mb-2.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                استودیوی تصویرساز هایپررئال با زبان فارسی
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
                ایده‌ها و توصیف‌های خود را به زبان فارسی بنویسید؛ سیستم پرامپت شما را از نظر هنری و نورپردازی بهینه نموده و با موتورهای پیشرفته Flux تصاویری با وضوح 8K تحویل می‌دهد.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/5 dark:border-white/5">
              <span className="text-xs font-medium text-[#717b91]">خلق آثار سینمایی، معماری، پرتره و حیات‌وحش</span>
              <a href="#gallery" className="text-xs font-bold text-[#df9f40] dark:text-[#f3b55c] hover:underline">
                مشاهده ۶ شاهکار گالری زیر ↓
              </a>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ---------------- 3.5. Manifesto & Targeted Professions ---------------- */}
      {(dynamicVisibility.manifesto !== false || dynamicVisibility.professions !== false) && (
      <section id="manifesto" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        {/* Dignified Manifesto Header & Content */}
        {dynamicVisibility.manifesto !== false && dynamicManifesto?.enabled !== false && (
        <div className="reveal-init clay-card-elevated p-6 sm:p-10 mb-14">
          <div className="max-w-3xl">
            <span className="inline-block px-3.5 py-1 clay-pill-thick type-badge font-bold text-blue-600 dark:text-zinc-200 mb-3.5">
              {dynamicManifesto?.badge || 'بیانیه شفافیت و فلسفه طراحی'}
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400 tracking-tight py-2 px-1 mb-2"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              {dynamicManifesto?.title || 'ابزار کار واقعی یا اسباب سرگرمی؟ چرا تمرکز ما بر کارایی و حل مسائل روزمره است'}
            </h2>
            <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
              {dynamicManifesto?.subtitle || 'امروزه بسیاری از سرویس‌ها به سمت قابلیت‌های جانبی و پرهزینه‌ای مانند ساخت تصاویر، کلیپ‌های ویدیویی یا ویرایش‌های پیچیده گرافیکی رفته‌اند. هرچند این قابلیت‌ها جذابیت‌های بصری دارند، اما تجربه کاربردی نشان می‌دهد:'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-black/5 dark:border-white/5">
            {(dynamicManifesto?.reasons || [
              {
                id: 'r1',
                icon: 'Coins',
                title: 'مصرف بسیار بالای اعتبار و هزینه‌های سنگین',
                desc: 'تولید یک کلیپ کوتاه چندثانیه‌ای یا تصویرسازی‌های سنگین، بخش عمده‌ای از اعتبار کاربر را به یک‌باره مصرف می‌کند؛ در حالی که همان میزان اعتبار می‌تواند پاسخگوی صدها پرسش علمی و پژوهشی باشد.'
              },
              {
                id: 'r2',
                icon: 'Zap',
                title: 'زمان انتظار طولانی و عدم قطعیت در خروجی',
                desc: 'فناوری‌های تولید ویدیو و پردازش‌های سنگین گرافیکی به دلیل ماهیت پیچیده، با تأخیرهای چنددقیقه‌ای و گاه نتایج غیردقیق همراه هستند که برای محیط‌های جدی کاری و تحصیلی بهینه نیستند.'
              },
              {
                id: 'r3',
                icon: 'ShieldCheck',
                title: 'تعهد ما به بازدهی و بهره‌وری پایدار',
                desc: 'ما تمام توان مهندسی خود را بر توسعه یک دستیار پایدار، با پاسخ‌دهی فوق‌سریع و درک عمیق زبان فارسی متمرکز کرده‌ایم تا هر ریال از اعتبار شما، مستقیماً صرف پیشرفت کار و صرفه‌جویی در زمان شود.'
              }
            ]).map((r: any, rIdx: number) => {
              const theme = MANIFESTO_CARD_THEMES[rIdx % MANIFESTO_CARD_THEMES.length];
              const ReasonIcon = (typeof r.icon === 'string' ? ICON_MAP[r.icon] : r.icon) || (rIdx === 0 ? Coins : rIdx === 1 ? Zap : ShieldCheck);
              return (
                <div
                  key={r.id || rIdx}
                  className={`p-5 rounded-2xl ${theme.card} ${rIdx === 0 ? 'reveal-from-right stagger-1' : rIdx === 1 ? 'reveal-pop stagger-2' : 'reveal-from-left stagger-3'}`}
                >
                  <div className={`w-9 h-9 rounded-xl clay-icon-debossed flex items-center justify-center ${theme.iconColor} mb-3`}>
                    <ReasonIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1420] dark:text-white mb-1.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {r.title}
                  </h3>
                  <p className="type-badge sm:text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* 6 Targeted Professions & Ready-to-Test Prompts */}
        {dynamicVisibility.professions !== false && dynamicProfessionsSettings?.enabled !== false && (
        <>
        <div className="reveal-init text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest block mb-1">
            TARGET AUDIENCE & USE CASES
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 tracking-tight py-2 px-1 mb-1"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوشمند؛ همراه تخصصی کدام حرفه‌هاست؟
          </h2>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
            برای هر تخصص، یک پرامپت آماده طراحی شده است؛ کافیست کلیک کنید تا پاسخ آن را مستقیماً در چت‌باکس بسنجید.
          </p>
        </div>

        {/* ---------------- 3D Spotlight Stage with Typewriter Animated Prompts ---------------- */}
        {(() => {
          const professionList = (Array.isArray(dynamicProfessions) && dynamicProfessions.length > 0)
            ? dynamicProfessions
            : professionCards;
          if (!Array.isArray(professionList) || professionList.length === 0) return null;
          const currentProfession = professionList[activeProfessionIdx] || professionList[0];
          if (!currentProfession) return null;
          const CurrentIcon = (currentProfession.icon && typeof currentProfession.icon === 'string'
            ? ICON_MAP[currentProfession.icon]
            : currentProfession.icon) || GraduationCap;

          return (
            <div className="space-y-6">
              {/* Main 3D Spotlight Stage Card */}
              <div
                className="reveal-pop stagger-2 relative clay-card-elevated p-6 sm:p-8 rounded-[32px] overflow-hidden transition-colors duration-300"
                onMouseEnter={() => setIsProfessionsPaused(true)}
                onMouseLeave={() => setIsProfessionsPaused(false)}
                onTouchStart={() => setIsProfessionsPaused(true)}
                onTouchEnd={() => setIsProfessionsPaused(false)}
              >
                {/* Stage Header with Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 clay-pill-thick text-xs font-bold">
                    <div className="w-2.5 h-2.5 rounded-full clay-gold-circle" />
                    <span>تخصص انتخابی: {currentProfession.badge}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveProfessionIdx((prev) => (prev - 1 + professionList.length) % professionList.length)}
                      className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95"
                      aria-label="تخصص قبلی"
                      title="تخصص قبلی"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProfessionIdx((prev) => (prev + 1) % professionList.length)}
                      className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95"
                      aria-label="تخصص بعدی"
                      title="تخصص بعدی"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Grid inside Spotlight Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                  {/* Preserved Visual Frame Image */}
                  <div className="lg:col-span-5 relative">
                    <div className="relative aspect-[16/11] overflow-hidden rounded-[24px] clay-card-thick p-1">
                      <img
                        key={currentProfession.image}
                        src={typeof currentProfession.image === 'string' ? currentProfession.image.replace(/\.(jpg|jpeg|png)$/i, '.webp') : currentProfession.image}
                        alt={currentProfession.title}
                        width={480}
                        height={330}
                        className="w-full h-full object-cover rounded-[20px] transition-all duration-700 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes('developer.webp')) {
                            target.src = '/images/professions/developer.webp';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Content & Typewriter Animated Prompt */}
                  <div className="lg:col-span-7 space-y-4 h-[350px] sm:h-[340px] flex flex-col justify-between">
                    <div className="h-[90px] sm:h-[100px] overflow-hidden">
                      <h3
                        className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white tracking-tight mb-2 flex items-center"
                        style={{ fontFamily: "'Estedad', sans-serif" }}
                      >
                        {currentProfession.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-2 flex items-start">
                        {currentProfession.desc}
                      </p>
                    </div>

                    {/* Typewriter Prompt Inset Box */}
                    <div className="clay-inset-thick p-4 sm:p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2563eb] dark:text-white">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <span>پرامپت تخصصی آماده برای آزمایش:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyProfessionPrompt(currentProfession.prompt)}
                          className="inline-flex items-center gap-1.5 type-badge font-bold clay-btn-thick px-3 py-1 rounded-xl text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white transition-all cursor-pointer"
                        >
                          {copiedProfessionPrompt ? (
                            <>
                              <Check className="w-3 h-3 text-[#10b981]" />
                              <span className="text-[#10b981] font-bold">کپی شد!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>کپی پرامپت</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Typewriter text with blinking cursor (Locked fixed height prevents any layout shift) */}
                      <div className="h-[96px] sm:h-[88px] bg-black/5 dark:bg-white/[0.04] p-3 sm:p-3.5 rounded-xl border border-black/5 dark:border-white/10 flex items-start overflow-hidden">
                        <p
                          className="text-xs sm:text-sm font-medium text-[#0f1420] dark:text-[#f1f5f9] leading-6 sm:leading-7 select-all text-right w-full m-0"
                          style={{ fontFamily: "'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif" }}
                        >
                          <span>{typedPrompt}</span>
                          <span className="inline-block w-1.5 h-4 clay-btn-primary dark:bg-blue-400 ms-1.5 animate-pulse align-middle rounded-sm" />
                        </p>
                      </div>
                    </div>

                    {/* Action Button: Directly Send Prompt to Chat (Flowing Glowing Dynamic CTA) */}
                    <div className="pt-2">
                      <Link
                        to={`/chat?prompt=${encodeURIComponent(currentProfession.prompt)}`}
                        className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl btn-flowing-glow text-sm font-black text-white  cursor-pointer select-none"
                        style={{ fontFamily: "'Estedad', 'Vazirmatn', sans-serif" }}
                      >
                        {/* Flowing shimmer light sweep reflection */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                        <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse shrink-0" />
                        <span className="tracking-tight">شروع گفتگو و آزمایش این پرامپت در چت‌باکس</span>
                        <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Miniature Cards Grid (Quick Jump to any of the 6 Professions) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.isArray(professionList) && professionList.map((p, idx) => {
                  if (!p) return null;
                  const isActive = activeProfessionIdx === idx;
                  const thumbAnim = idx % 2 === 0 ? 'reveal-from-right' : 'reveal-from-left';
                  const staggerClass = `stagger-${(idx % 6) + 1}`;
                  return (
                    <div key={p.id || idx} className={`${thumbAnim} ${staggerClass}`}>
                      <button
                        type="button"
                        onClick={() => setActiveProfessionIdx(idx)}
                        className={`w-full min-h-[48px] p-2.5 sm:p-2 rounded-2xl transition-all duration-300 text-right cursor-pointer flex items-center gap-2.5 active:scale-95 ${
                          isActive
                            ? 'clay-card-elevated border-2 border-[var(--card-border)] dark:border-white/50 scale-102 '
                            : 'clay-card-thick opacity-70 hover:opacity-100'
                        }`}
                      >
                      <img
                        src={(typeof p.image === 'string' ? p.image.replace(/\.(jpg|jpeg|png)$/i, '.webp') : p.image).replace('/images/professions/', '/images/professions/thumbs/')}
                        alt={p.title}
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes(p.image)) {
                            target.src = p.image;
                          } else if (!target.src.includes('developer.webp')) {
                            target.src = '/images/professions/thumbs/developer.webp';
                          }
                        }}
                      />
                      <div className="overflow-hidden">
                        <span className="block type-badge font-bold text-[#0f1420] dark:text-white truncate">
                          {p.badge}
                        </span>
                        <span className="block type-badge text-zinc-600 dark:text-zinc-400 font-medium truncate">
                          مشاهده پرامپت
                        </span>
                      </div>
                    </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        </>
        )}
      </section>
      )}

      {/* ---------------- 4. Hyperrealistic Image Gallery Showcase (ANIMATED 3D CLAY CAROUSEL) ---------------- */}
      {dynamicVisibility.gallery !== false && dynamicGallerySettings?.enabled !== false && (() => {
        const baseGallery = (dynamicGallery && dynamicGallery.length > 0) ? dynamicGallery : galleryImages;
        if (!Array.isArray(baseGallery) || baseGallery.length === 0) return null;
        const loopedGallery = [...baseGallery, ...baseGallery, ...baseGallery];
        const activeDotIndex = ((gallerySlide % baseGallery.length) + baseGallery.length) % baseGallery.length;

        const handleTransitionEnd = () => {
          const n = baseGallery.length;
          if (gallerySlide >= n * 2) {
            setGalleryTransition(false);
            setGallerySlide((prev) => prev - n);
          } else if (gallerySlide < n) {
            setGalleryTransition(false);
            setGallerySlide((prev) => prev + n);
          }
        };

        return (
          <section id="gallery" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
            <div className="reveal-init flex flex-col items-center gap-6 mb-12">
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    setGalleryTransition(true);
                    setGallerySlide((prev) => prev - 1);
                  }}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white cursor-pointer active:scale-95"
                  aria-label="اسلاید قبلی"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <Link
                  to="/chat"
                  className="inline-flex items-center justify-center gap-1.5 clay-btn-thick min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-[#2563eb] dark:text-white hover:brightness-110 active:scale-95 text-center"
                >
                  <span>ورود به استودیو</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setGalleryTransition(true);
                    setGallerySlide((prev) => prev + 1);
                  }}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95 shrink-0"
                  aria-label="تصویر بعدی"
                  title="تصویر بعدی"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Animated 3D Claymorphic Carousel Viewport */}
            <div
              className="reveal-init stagger-1 relative overflow-hidden w-full py-4 [--items-per-row:1] sm:[--items-per-row:2] lg:[--items-per-row:3]"
              onMouseEnter={() => setIsGalleryPaused(true)}
              onMouseLeave={() => setIsGalleryPaused(false)}
              onTouchStart={() => setIsGalleryPaused(true)}
              onTouchEnd={() => setIsGalleryPaused(false)}
            >
              <div
                dir="ltr"
                onTransitionEnd={handleTransitionEnd}
                className={`flex gap-6 ${galleryTransition ? 'transition-transform duration-700 ease-out' : ''}`}
                style={{
                  transform: `translateX(calc(-${gallerySlide} * (100% + 1.5rem) / var(--items-per-row, 1)))`
                }}
              >
                {loopedGallery.map((img: any, idx: number) => (
                  <div
                    key={idx}
                    dir="rtl"
                    className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] shrink-0 clay-card-thick overflow-hidden transition-all duration-300 flex flex-col justify-between hover:-translate-y-2 hover:"
                  >
                    {/* Preserved Image with Sculpted Frame */}
                    <div className="relative aspect-[4/3] overflow-hidden m-3 rounded-2xl clay-inset-thick">
                      <img
                        src={img.src}
                        alt={img.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes('journal-cover.webp')) {
                            target.src = '/images/gallery/journal-cover.webp';
                          }
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full clay-charcoal type-badge font-bold">
                        {img.tag}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#0f1420] dark:text-white mb-1.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                          {img.title}
                        </h3>
                        <p className="type-badge text-[#525d75] dark:text-[#9aa5bc] line-clamp-2 leading-relaxed font-mono" dir="ltr">
                          {img.prompt}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => copyPromptToClipboard(img.prompt, idx)}
                          className="inline-flex items-center gap-1.5 type-badge font-bold clay-btn-thick px-3 py-1.5 rounded-xl text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white transition-all cursor-pointer"
                        >
                          {copiedPromptIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#10b981]" />
                              <span className="text-[#10b981] font-bold">کپی شد!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>کپی پرامپت</span>
                            </>
                          )}
                        </button>

                        <Link to="/chat" className="type-badge font-black text-[#2563eb] dark:text-white hover:underline">
                          تست این سبک
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Indicator Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {baseGallery.map((_, dotIdx) => {
                const isActive = activeDotIndex === dotIdx;
                return (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => {
                      setGalleryTransition(true);
                      setGallerySlide(baseGallery.length + dotIdx);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 cursor-pointer transition-transform hover:scale-110"
                    aria-label={`رفتن به اسلاید ${dotIdx + 1}`}
                  >
                    <span
                      className={`block transition-all duration-300 ${
                        isActive
                          ? 'clay-btn-primary-thick !w-8 !h-3 !rounded-full'
                          : 'clay-btn-thick !w-3 !h-3 !rounded-full opacity-60 hover:opacity-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ---------------- 4.5. Usage & Consumption Transparency Section ---------------- */}
      {dynamicVisibility.analytics !== false && (
        <UsageAnalyticsSection />
      )}

      {/* ---------------- 5. Transparent Hybrid Pricing Section (Thick 3D Claymorphic) ---------------- */}
      {dynamicVisibility.pricing !== false && dynamicPricingHeader?.enabled !== false && (
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest block mb-1">
            {dynamicPricingHeader?.badge || 'PAY-AS-YOU-GO PRICING'}
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-400 dark:to-blue-400 tracking-tight py-2 px-1 mb-1"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            {dynamicPricingHeader?.title || 'تعرفه منعطف و شارژ آزاد به میزان دلخواه'}
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            {dynamicPricingHeader?.subtitle || 'بدون بسته‌های اجباری، بدون اشتراک ماهانه و بدون تاریخ انقضا. کیف پول خود را به هر میزانی که مایلید شارژ کنید و فقط به ازای توکن مصرفی هر گفتگو بپردازید.'}
          </p>
        </div>

        {/* Pay-As-You-Go Flexible Wallet Showcase (Replaces fixed packages) */}
        <div className="reveal-pop p-7 sm:p-10 rounded-3xl clay-card-thick max-w-5xl mx-auto transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Right Column: Copy & Highlights */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold clay-pill-thick text-emerald-600 dark:text-emerald-400">
                <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>انعطاف‌پذیری کامل در شارژ | Pay-As-You-Go</span>
              </div>

              <h3 className="text-xl sm:text-3xl font-black text-[#0f1420] dark:text-white leading-snug" style={{ fontFamily: "'Estedad', sans-serif" }}>
                شارژ با هر مبلغ دلخواه؛ پرداخت دقیقاً به اندازه مصرف
              </h3>

              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                دیگر نیازی به خرید بسته‌های اجباری، پرداخت هزینه‌های ماهانه سنگین یا نگرانی از تاریخ انقضا ندارید. در دستیار هوشمند، کیف پول خود را به هر میزانی که مایلید (حتی ۵۰,۰۰۰ تومان) شارژ کنید و فقط به ازای تک‌تک کلمات و توکن‌هایی که در هر گفتگو مصرف می‌کنید هزینه بپردازید.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="clay-surface p-3.5 rounded-2xl flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-[#0f1420] dark:text-white mb-0.5">اعتبار بدون تاریخ انقضا</div>
                    <div className="type-badge text-[#525d75] dark:text-[#9aa5bc]">موجودی کیف پول شما هرگز منقضی یا صفر نخواهد شد.</div>
                  </div>
                </div>

                <div className="clay-surface p-3.5 rounded-2xl flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-[#0f1420] dark:text-white mb-0.5">محاسبه دقیق بر اساس توکن</div>
                    <div className="type-badge text-[#525d75] dark:text-[#9aa5bc]">شفافیت ۱۰۰٪ و مشاهده هزینه و توکن مصرفی هر چت.</div>
                  </div>
                </div>

                <div className="clay-surface p-3.5 rounded-2xl flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-[#0f1420] dark:text-white mb-0.5">شارژ با مبالغ خرد</div>
                    <div className="type-badge text-[#525d75] dark:text-[#9aa5bc]">آزادی عمل برای شارژ از ۵۰,۰۰۰ تومان تا مبالغ دلخواه.</div>
                  </div>
                </div>

                <div className="clay-surface p-3.5 rounded-2xl flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-[#0f1420] dark:text-white mb-0.5">۱۵ چت رایگان روزانه</div>
                    <div className="type-badge text-[#525d75] dark:text-[#9aa5bc]">استفاده رایگان در هر چرخه ۴ ساعته برای همه کاربران.</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated) {
                      setIsWalletOpen(true);
                    } else {
                      setAuthModalOpen(true);
                    }
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl clay-btn-primary text-xs font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                  style={{ fontFamily: "'Estedad', sans-serif" }}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ورود و شارژ با مبلغ دلخواه</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="type-badge font-medium text-[#525d75] dark:text-[#9aa5bc]">
                  پشتیبانی از کلیه کارت‌های شتاب با درگاه امن بانکی
                </span>
              </div>
            </div>

            {/* Left Column: Visual 3D Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm p-6 sm:p-7 rounded-3xl clay-card-elevated space-y-5 border border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl clay-surface flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0f1420] dark:text-white">کیف پول هوشمند</div>
                      <div className="type-badge text-[#525d75] dark:text-[#9aa5bc]">موجودی لحظه‌ای کاربر</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full type-badge font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    فعال
                  </span>
                </div>

                <div className="clay-surface-inset p-4 rounded-2xl text-center space-y-1">
                  <div className="type-badge text-[#525d75] dark:text-[#9aa5bc] font-medium">نمونه موجودی قابل شارژ</div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0f1420] dark:text-white tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {toPersianDigits('50,000')} <span className="text-xs font-bold opacity-70">تومان</span>
                  </div>
                  <div className="type-badge text-emerald-600 dark:text-emerald-400 font-bold pt-0.5">
                    معادل ~{toPersianDigits('500,000')} توکن سهمیه مکالمه
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                    <span className="text-[#525d75] dark:text-[#9aa5bc]">مدل‌های اعتباری فعال:</span>
                    <span className="font-bold text-[#0f1420] dark:text-white">لونا، دیپ‌سیک، جمینای ۳.۸</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                    <span className="text-[#525d75] dark:text-[#9aa5bc]">حداقل مبلغ شارژ:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{toPersianDigits('5,000')} تومان</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#525d75] dark:text-[#9aa5bc]">سرعت فعال‌سازی:</span>
                    <span className="font-bold text-[#0f1420] dark:text-white">آنی و خودکار</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Security & Instant Credit Note in Sculpted Clay */}
        <div className="reveal-init mt-8 p-4 rounded-2xl clay-card-thick max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>شارژ آنی کیف پول بلافاصله پس از پرداخت شتاب</span>
          </div>
          <span className="hidden sm:inline opacity-40">•</span>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#2563eb] dark:text-[#f97316]" />
            <span>{isBazaar ? 'تسویه امن با درگاه رسمی بازارپی (کافه‌بازار)' : 'تسویه امن با درگاه‌های رسمی بانکی شاپرک'}</span>
          </div>
        </div>
      </section>
      )}

      {/* ---------------- 6. Extensive FAQ Section (10 Rich Questions in Claymorphic Style) ---------------- */}
      {dynamicVisibility.faqs !== false && dynamicFaqsSettings?.enabled !== false && (
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="reveal-init text-center mb-10 sm:mb-14">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest block mb-1">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-rose-500 dark:from-fuchsia-400 dark:to-rose-400 tracking-tight py-2 px-1 mb-1"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            پرسش‌ها و پاسخ‌های متداول
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            پاسخ جامع و شفاف به کلیه سوالات شما درباره نحوه استفاده، هزینه‌ها و امکانات هوش مصنوعی
          </p>
        </div>

        <div className="clay-card-thick p-2 sm:p-6 overflow-hidden reveal-from-bottom">
          <div className="flex flex-col">
            {dynamicFaqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              const isLast = i === dynamicFaqs.length - 1;
              
              // A vibrant palette for the questions with WCAG AA compliant contrast (ratio > 5.5:1)
              const palettes = [
                { text: 'text-indigo-800 dark:text-indigo-300', iconBg: 'bg-indigo-500/10 dark:bg-indigo-400/20' },
                { text: 'text-emerald-800 dark:text-emerald-300', iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/20' },
                { text: 'text-rose-800 dark:text-rose-300', iconBg: 'bg-rose-500/10 dark:bg-rose-400/20' },
                { text: 'text-amber-900 dark:text-amber-300', iconBg: 'bg-amber-500/10 dark:bg-amber-400/20' },
                { text: 'text-sky-800 dark:text-sky-300', iconBg: 'bg-sky-500/10 dark:bg-sky-400/20' },
                { text: 'text-violet-800 dark:text-violet-300', iconBg: 'bg-violet-500/10 dark:bg-violet-400/20' },
                { text: 'text-fuchsia-800 dark:text-fuchsia-300', iconBg: 'bg-fuchsia-500/10 dark:bg-fuchsia-400/20' },
              ];
              const theme = palettes[i % palettes.length];

              return (
                <div key={i} className={`flex flex-col ${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full py-5 px-3 sm:px-4 text-right flex items-center justify-between gap-4 cursor-pointer group transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                  >
                    <span 
                      className={`font-bold text-sm sm:text-base transition-all duration-300 ${theme.text} ${isOpen ? 'scale-[1.02] transform' : 'opacity-100'}`} 
                      style={{ fontFamily: "'Estedad', sans-serif" }}
                    >
                      {faq.q}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen ? theme.iconBg : 'bg-black/5 dark:bg-white/10 group-hover:dark:bg-white/20'
                    }`}>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 ' + theme.text : 'text-[#525d75] dark:text-[#9aa5bc]'
                        }`}
                      />
                    </div>
                  </button>
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 sm:px-4 pb-6 pt-1 text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-loose">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ---------------- 7. Cross Platform Downloads Section ---------------- */}
      <section id="downloads" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="reveal-init text-center mb-10 sm:mb-14">
          <span className="text-xs font-bold text-[#717b91] uppercase tracking-widest block mb-1">
            CROSS-PLATFORM EXPERIENCE
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 tracking-tight py-2 px-1 mb-1"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دسترسی آسان روی تمامی پلتفرم‌ها
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] max-w-2xl mx-auto">
            محیط دستیار هوشمند به صورت کاملا واکنش‌گرا و سازگار با تمامی دستگاه‌ها از جمله موبایل، دسکتاپ، تبلت و آیپد طراحی شده است. می‌توانید نسخه اندروید را دانلود کنید یا به صورت وب‌اپلیکیشن (PWA) روی آیفون و کامپیوتر نصب نمایید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
          
          {/* Mobile Card */}
          <div className="clay-card-thick p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center reveal-from-bottom border border-zinc-200 dark:border-zinc-800 transition-transform duration-300 hover:scale-[1.02]">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">نسخه موبایل (اندروید)</h3>
            <p className="text-sm opacity-80 mb-6 leading-relaxed flex-1">
              دارای اپلیکیشن اختصاصی با سرعت بالا و طراحی کاملاً یکپارچه، مناسب برای گوشی‌های اندرویدی.
            </p>
            <a 
              href="https://abrehamrahi.ir/o/public/r9yjoJaw/" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl clay-btn-primary bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              دانلود فایل APK
            </a>
            <p className="type-badge opacity-60 mt-3">نکته: در صورت نمایش پیام اخطار گوگل (Play Protect)، گزینه Install anyway را انتخاب کنید.</p>
          </div>

          {/* iOS & Tablet Card */}
          <div className="clay-card-thick p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center reveal-from-bottom border border-zinc-200 dark:border-zinc-800 transition-transform duration-300 hover:scale-[1.02]" style={{ transitionDelay: '100ms' }}>
            <div className="w-16 h-16 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
              <Tablet className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">آیفون و آیپد (iOS)</h3>
            <p className="text-sm opacity-80 mb-6 leading-relaxed flex-1">
              پشتیبانی کامل از تمامی دستگاه‌های اپل از طریق وب‌اپلیکیشن (PWA) با تجربه کاربری کاملا بومی.
            </p>
            <button 
              className="w-full py-3 px-4 rounded-xl clay-btn-secondary border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center gap-2 cursor-default"
            >
              Share &gt; Add to Home Screen
            </button>
            <p className="type-badge opacity-60 mt-3">از طریق مرورگر سافاری روی آیفون، این گزینه را انتخاب کنید.</p>
          </div>

          {/* Desktop Card */}
          <div className="clay-card-thick p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center reveal-from-bottom border border-zinc-200 dark:border-zinc-800 transition-transform duration-300 hover:scale-[1.02]" style={{ transitionDelay: '200ms' }}>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">ویندوز و مک (Desktop)</h3>
            <p className="text-sm opacity-80 mb-6 leading-relaxed flex-1">
              بدون نیاز به نصب شبیه‌ساز؛ با امکان افزودن میانبر مستقیم از مرورگر (Chrome / Edge) به نوار ابزار سیستم.
            </p>
            <div className="w-full py-3 px-4 rounded-xl clay-surface-inset border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold flex items-center justify-center gap-2">
              اجرای مستقیم در وب
            </div>
            <p className="type-badge opacity-60 mt-3">روی آیکون نصب در نوار آدرس مرورگر کلیک کنید.</p>
          </div>

        </div>
      </section>

      {/* ---------------- 8. Final Call to Action (Claymorphic CTA Banner) ---------------- */}
      {dynamicVisibility.cta !== false && dynamicCta?.enabled !== false && (
        <section id="cta" className="py-16 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-black/5 dark:border-white/5">
          <div className="clay-card-thick p-8 sm:p-14 rounded-3xl text-center relative overflow-hidden flex flex-col items-center border border-[var(--card-border)]  shadow-2xl">
            <div className="w-16 h-16 transition-transform hover:scale-105 flex items-center justify-center mb-6">
              <img
                src="/pwa-192x192.webp"
                alt="لوگوی دستیار هوشمند"
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/pwa-192x192.png';
                }}
              />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white py-2 px-1 mb-3" style={{ fontFamily: "'Estedad', sans-serif" }}>
              {dynamicCta?.title || 'همین حالا گفتگوی هوشمند را شروع کنید'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed mb-8 font-normal">
              {dynamicCta?.desc || 'ثبت‌نام در کمتر از ۳۰ ثانیه بدون نیاز به وارد کردن کارت بانکی؛ بلافاصله وارد محیط چت شوید و قدرت مدل‌های برتر هوش مصنوعی جهان را تجربه کنید.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
              <Link
                to={dynamicCta?.primaryBtnLink || '/chat'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl clay-btn-primary-thick text-white text-sm font-black shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                <span>{dynamicCta?.primaryBtnText || 'ورود به محیط چت'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              {dynamicCta?.secondaryBtnText && (
                <Link
                  to={dynamicCta?.secondaryBtnLink || (isBazaar ? '/chat' : '/store')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl clay-btn-thick text-[#0f1420] dark:text-[#f3f5f9] text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ fontFamily: "'Estedad', sans-serif" }}
                >
                  <span>{dynamicCta.secondaryBtnText}</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
      </main>

      <Footer />

      {/* Checkout Modal for Plan Products */}
      {selectedPlanForCheckout && !isBazaar && (
        <CheckoutModal
          product={selectedPlanForCheckout}
          isOpen={Boolean(selectedPlanForCheckout)}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}
    </div>
  );
};
