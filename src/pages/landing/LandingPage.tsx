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
  Stethoscope
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Footer } from '../../components/Footer';
import { CheckoutModal } from '../../components/CheckoutModal';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';
import { useUIStore } from '../../store/uiStore';

interface DemoScenario {
  id: string;
  label: string;
  icon: any;
  model: string;
  modelBadge: string;
  userPrompt: string;
  aiResponse: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'contract',
    label: 'نگارش حقوقی و اداری',
    icon: FileText,
    model: 'Claude 3.5 Sonnet',
    modelBadge: 'قدرتمندترین مدل ادبی و استدلال',
    userPrompt: 'یک پیش‌نویس قرارداد محرمانگی اطلاعات (NDA) رسمی و حقوقی برای همکاری دو شرکت نرم‌افزاری تنظیم کن.',
    aiResponse: `**قرارداد عدم افشای اطلاعات محرمانه (NDA)**

**ماده ۱ - طرفین قرارداد:**
این توافق‌نامه فی‌مابین شرکت الف (افشاکننده) و شرکت ب (دریافت‌کننده) با شرایط ذیل منعقد می‌گردد:

**ماده ۲ - موضوع قرارداد:**
حفظ محرمانگی کامل کلیه داده‌های فنی، سورس‌کدها، مستندات معماری و اسرار تجاری مبادله‌شده.

**ماده ۳ - تعهدات دریافت‌کننده:**
دریافت‌کننده متعهد است بالاترین تدابیر امنیتی را اعمال نموده و بدون موافقت کتبی قبلی، هیچ بخشی از داده‌ها را در اختیار اشخاص ثالث قرار ندهد.`
  },
  {
    id: 'coding',
    label: 'کدنویسی و مهندسی نرم‌افزار',
    icon: Code2,
    model: 'DeepSeek-V3 / GPT-4o',
    modelBadge: 'متخصص الگوریتم و توسعه',
    userPrompt: 'یک سیستم ریت‌لیمیت برای کنترل سهمیه توکن‌ها بر اساس دقیقه در تایپ‌اسکریپت بنویس.',
    aiResponse: `\`\`\`typescript
interface TokenLimiter {
  maxTokensPerMinute: number;
  consumed: number;
  resetAt: number;
}

export function checkTokenQuota(limiter: TokenLimiter, tokensNeeded: number): boolean {
  const now = Date.now();
  if (now > limiter.resetAt) {
    limiter.consumed = 0;
    limiter.resetAt = now + 60_000;
  }
  if (limiter.consumed + tokensNeeded <= limiter.maxTokensPerMinute) {
    limiter.consumed += tokensNeeded;
    return true; // مجاز به پردازش
  }
  return false; // سهمیه این بازه تکمیل است
}
\`\`\``
  },
  {
    id: 'vision',
    label: 'استودیوی تصویرساز فارسی',
    icon: ImageIcon,
    model: 'Flux.1 Hyperreal',
    modelBadge: 'موتور گرافیکی هایپررئال',
    userPrompt: 'پرتره سینمایی یک سردار باستانی ایران با زره سایبرنتیک و شمشیر پلاسمایی فیروزه‌ای در شبی بارانی',
    aiResponse: `✨ **درخواست تحلیل شد و به پرامپت مهندسی‌شده تبدیل گردید:**
\`Cinematic portrait of an ancient Persian warrior in cybernetic high-tech battle armor, engraved golden Farvahar patterns, glowing cyan energy lines, holding plasma scimitar, atmospheric smoke, 8k photorealism\`

🖼️ تصویر با رزولوشن 8K و بیشترین جزئیات نوری در استودیو خلق گردید.`
  }
];

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
        card: 'bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] text-[#0f1420] dark:text-white shadow-xl',
        primaryBtn: 'bg-[#111622] hover:bg-[#202636] dark:bg-white dark:hover:bg-[#e4e7ee] text-white dark:text-[#0a0c10]',
        secondaryBtn: 'border-[#d8dce6] dark:border-[#1e2433] hover:bg-[#f8f9fb] dark:hover:bg-[#131722] text-[#0f1420] dark:text-white'
      };
    case 'dark':
    default:
      return {
        card: 'bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] shadow-xl',
        primaryBtn: 'bg-white text-[#0a0c10] hover:bg-[#eef1f6] dark:bg-[#0a0c10] dark:text-white dark:hover:bg-[#1a202d]',
        secondaryBtn: 'border-white/20 dark:border-[#0a0c10]/20 hover:bg-white/10 dark:hover:bg-[#0a0c10]/10 text-inherit'
      };
  }
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { setIsWalletOpen } = useUIStore();

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  // Animated 3D Gallery Carousel State & Auto-play
  const [gallerySlide, setGallerySlide] = useState<number>(0);
  const [isGalleryPaused, setIsGalleryPaused] = useState<boolean>(false);

  // 3D Spotlight Professions Stage State & Typewriter
  const [activeProfessionIdx, setActiveProfessionIdx] = useState<number>(0);
  const [isProfessionsPaused, setIsProfessionsPaused] = useState<boolean>(false);
  const [typedPrompt, setTypedPrompt] = useState<string>('');
  const [copiedProfessionPrompt, setCopiedProfessionPrompt] = useState<boolean>(false);

  // Comprehensive FAQ list (10 rich, practical questions)
  const faqs = [
    {
      q: 'اعتبار هدیه ۵۰,۰۰۰ تومانی اولیه چیست و چگونه دریافت می‌شود؟',
      a: 'به محض ثبت‌نام اولیه با شماره موبایل یا ایمیل، مبلغ ۵۰,۰۰۰ تومان اعتبار نقدی بلافاصله و به‌صورت خودکار به کیف پول شما شارژ می‌شود. با این اعتبار می‌توانید حدود ۱۵۰ تا ۲۰۰ پیام کامل با بهترین مدل‌های جهان (مانند Claude 3.5 و GPT-4o) ارسال نمایید و سرعت و هوش سیستم را بدون پرداخت هیچ هزینه‌ای بسنجید.'
    },
    {
      q: 'تفاوت سیستم پرداخت بر اساس مصرف واقعی (Pay-As-You-Go) با خرید اکانت‌های دلاری چیست؟',
      a: 'در خرید اشتراک‌های ماهانه خارجی، کاربر باید ماهیانه بیش از ۲۰ دلار (حدود ۱ میلیون و ۸۰۰ هزار تومان) پرداخت کند و با خطر مسدود شدن اکانت و دردسر فیلترشکن روبه‌رو است. در دستیار هوشمند، نیازی به پرداخت ماهانه سنگین نیست؛ با کارت بانکی شتاب حساب خود را شارژ می‌کنید و به ازای هر پیام، فقط هزینه چند تک‌تومانی توکن‌های ورودی و خروجی کسر می‌گردد. این اعتبار هیچ‌گاه منقضی نمی‌شود.'
    },
    {
      q: 'توکن چیست و هر پیام چقدر توکن مصرف می‌کند؟',
      a: 'توکن کوچک‌ترین واحد محاسباتی در مدل‌های هوش مصنوعی است (تقریباً هر ۱۰۰۰ توکن معادل ۷۵۰ کلمه انگلیسی یا حدود ۵۰۰ کلمه فارسی است). برای یک سوال و جواب متداول، بین ۲۰۰ تا ۸۰۰ توکن مصرف می‌شود که هزینه آن در مدل‌های اقتصادی معمولاً کمتر از ۱۰۰ تا ۲۰۰ تک‌تومان است.'
    },
    {
      q: 'آیا برای استفاده از دستیار هوشمند به فیلترشکن یا شماره خارجی نیاز است؟',
      a: 'خیر، به هیچ عنوان. سرورهای این پلتفرم مستقیماً به سریع‌ترین درگاه‌های رسمی متصل هستند و از داخل ایران بدون نیاز به فیلترشکن، با نهایت سرعت لود و تاخیر پینگ زیر ۳۰۰ میلی‌ثانیه کار می‌کنند. ثبت‌نام نیز با شماره همراه ایران یا ایمیل در چند ثانیه انجام می‌شود.'
    },
    {
      q: 'چه مدل‌هایی از هوش مصنوعی در دسترس هستند؟',
      a: 'شما به طور همزمان به پرچمداران هوش مصنوعی جهان دسترسی دارید: Claude 3.5 Sonnet (سلطان نگارش و کدنویسی)، GPT-4o (پرچمدار همه‌کاره OpenAI)، Gemini 2.0 Flash (فوق‌سریع گوگل)، DeepSeek-V3 (هوش استدلالی و ریاضیاتی)، Qwen 2.5 72B و استودیوی تصویرسازی هنری Flux.'
    },
    {
      q: 'سیستم سوییچ هوشمند (Smart Routing) چیست و چه کاربردی دارد؟',
      a: 'دستیار هوشمند مجهز به موتور تشخیص قصد کاربر (Intent Detection) است. اگر سوال کدنویسی بپرسید، سیستم درخواست را به بهترین مدل برنامه‌نویسی هدایت می‌کند؛ اگر درخواست نگارش متن رسمی یا ترجمه داشته باشید، از ادبی‌ترین مدل استفاده می‌کند؛ و اگر نیاز به جستجوی وب باشد، داده‌های زنده اینترنت را جستجو می‌کند.'
    },
    {
      q: 'آیا امکان آپلود و تحلیل فایل‌های PDF و کد وجود دارد؟',
      a: 'بله. می‌توانید فایل‌های کتاب و اسناد PDF، فایل‌های متنی، پروژه‌های کدنویسی (پایتون، جاوااسکریپت و...)، اکسل و تصاویر را آپلود کنید. هوش مصنوعی متن و ساختار فایل را استخراج کرده و به سوالات تحلیلی، ترجمه یا خلاصه مقالات با بالاترین دقت پاسخ می‌دهد.'
    },
    {
      q: 'استودیوی تصویرساز چگونه کار می‌کند و آیا زبان فارسی را می‌فهمد؟',
      a: 'بله، کاملاً. شما می‌توانید توصیف خود از تصویر مورد نظرتان را به زبان شیرین فارسی بنویسید. سیستم ابتدا پرامپت شما را از نظر هنری، زاویه دوربین، نورپردازی و رزولوشن غنی‌سازی کرده و سپس با موتورهای پیشرفته تصویرسازی (Flux و SDXL)، تصاویر هایپررئال 8K خلق می‌کند.'
    },
    {
      q: 'حریم خصوصی و امنیت گفتگوها چگونه تضمین می‌شود؟',
      a: 'تمامی تبادلات اطلاعاتی از طریق پروتکل رمزنگاری پیشرفته SSL صورت می‌پذیرد. تاریخچه گفتگوها در فضای امن ذخیره شده و به هیچ عنوان در اختیار اشخاص یا سازمان‌های ثالث قرار نمی‌گیرد و برای آموزش مدل‌های عمومی استفاده نمی‌شود.'
    },
    {
      q: 'نحوه شارژ حساب و درگاه‌های پرداخت چگونه است؟',
      a: 'شارژ حساب با تمام کارت‌های عضو شتاب از طریق درگاه‌های پرداخت معتبر شاپرکی امکان‌پذیر است. موجودی بلافاصله پس از پرداخت به کیف پول کاربر اضافه شده و صورت‌حساب دقیق و شفاف هر تراکنش در بخش مالی و داشبورد کاربری در دسترس است.'
    }
  ];

  const [copiedProfessionId, setCopiedProfessionId] = useState<string | null>(null);

  // 6 Targeted Professional Personas & Ready-to-Test Prompts
  const professionCards = [
    {
      id: 'academic',
      title: 'دانشجویان، اساتید و پژوهشگران',
      icon: GraduationCap,
      image: '/images/professions/academic.jpg',
      badge: 'پژوهش و دانشگاه',
      desc: 'تحلیل مقالات ISI، استخراج فصول و ساختار پایان‌نامه، ترجمه تخصصی روان و رفرنس‌دهی علمی.',
      prompt: 'یک ساختار استاندارد ۵ فصلی برای پروپوزال کارشناسی ارشد با موضوع "کاربرد هوش مصنوعی در بهینه‌سازی سیستم‌های مالی" تنظیم کن و فرضیات پژوهش را بنویس.'
    },
    {
      id: 'developer',
      title: 'برنامه‌نویسان و مهندسان نرم‌افزار',
      icon: Terminal,
      image: '/images/professions/developer.jpg',
      badge: 'فناوری و توسعه',
      desc: 'دیباگ سریع خطاهای کدنویسی، نگارش کوئری‌های SQL و معماری پروژه‌های نرم‌افزاری با استدلال عمیق.',
      prompt: 'یک کامپوننت React با تایپ‌اسکریپت برای پیاده‌سازی Infinite Scroll بنویس که با Intersection Observer کار کند و مدیریت خطای شبکه داشته باشد.'
    },
    {
      id: 'content',
      title: 'تولیدکنندگان محتوا و متخصصان سئو',
      icon: PenTool,
      image: '/images/professions/content.jpg',
      badge: 'تولید محتوا و سئو',
      desc: 'نگارش مقالات سئوشده ۲,۰۰۰ کلمه‌ای با لحن کاملاً فاخر و روان فارسی، سناریونویسی و ایده‌پردازی تقویم.',
      prompt: 'یک ساختار مقاله جامع ۲۰۰۰ کلمه‌ای سئوشده با تگ‌های H2 و H3 درباره "راهنمای جامع سئو معنایی (Semantic SEO) در سال ۲۰۲۶" تدوین کن.'
    },
    {
      id: 'legal',
      title: 'وکلا، کارشناسان حقوقی و مدیران قرارداد',
      icon: Scale,
      image: '/images/professions/legal.jpg',
      badge: 'حقوق و قراردادها',
      desc: 'تحلیل بندبه‌بند قراردادهای تجاری و پیمانکاری، کشف تعهدات و ریسک‌های پنهان، و تنظیم پیش‌نویس لوایح رسمی.',
      prompt: 'مهم‌ترین بندهای رفع تعهد و جریمه دیرکرد (Liquidated Damages) را در یک قرارداد توسعه نرم‌افزار همراه با تبصره فورس‌ماژور بنویس.'
    },
    {
      id: 'business',
      title: 'مدیران، استارتاپ‌ها و تحلیل‌گران بازار',
      icon: TrendingUp,
      image: '/images/professions/business.jpg',
      badge: 'کسب‌وکار و استراتژی',
      desc: 'تحلیل گزارش‌های فروش و اکسل، تدوین طرح کسب‌وکار (Business Plan) و مکاتبات رسمی تجاری.',
      prompt: 'یک ایمیل رسمی و متقاعدکننده به مدیرعامل یک شرکت همکار بنویس و پیشنهاد جلسه استراتژیک برای همکاری تجاری مشترک را مطرح کن.'
    },
    {
      id: 'medical',
      title: 'پزشکان، داروسازان و محققان سلامت',
      icon: Stethoscope,
      image: '/images/professions/medical.jpg',
      badge: 'پزشکی و سلامت',
      desc: 'خلاصه‌سازی پژوهش‌های بالینی و ژورنال‌های معتبر، ترجمه دقیق اصطلاحات و تنظیم مطالعات موردی.',
      prompt: 'جدیدترین پروتکل‌های بالینی در مدیریت دیابت نوع ۲ بر اساس استانداردهای ADA را به صورت دسته‌بندی‌شده و خلاصه بالینی شرح بده.'
    }
  ];

  // Professional Imagery for Studio Gallery (Manifesto-aligned)
  const galleryImages = [
    {
      src: '/images/gallery/journal-cover.jpg',
      title: 'طراحی جلد ژورنال علمی',
      tag: 'انتشارات پژوهشی',
      prompt: 'Minimalist abstract scientific journal cover art, elegant synaptic neural network pathways connecting soft glowing data nodes, deep navy slate and warm gold tones, refined clean scientific illustration, calm and uncluttered'
    },
    {
      src: '/images/gallery/tech-editorial.jpg',
      title: 'تصویر شاخص وبلاگ فناوری',
      tag: 'سئو و تولید محتوا',
      prompt: 'Clean modern isometric editorial tech blog illustration, minimalist floating geometric cubes and digital paper workflow diagrams, matte titanium finish, soft diffused studio light, uncluttered, professional aesthetic'
    },
    {
      src: '/images/gallery/legal-emblem.jpg',
      title: 'تندیس مفهومی حقوق و عدالت',
      tag: 'حقوقی و سازمانی',
      prompt: 'Minimalist modern 3D sculptural emblem of justice balance scales, matte dark stone and brushed gold brass accents, clean minimalist dark studio background, elegant corporate symbol, uncluttered'
    },
    {
      src: '/images/gallery/business-trends.jpg',
      title: 'تصویرسازی تحلیل رشد مالی',
      tag: 'گزارش‌های شرکتی',
      prompt: 'Minimalist 3D architectural financial analytics chart, subtle glowing upward curved graph line on dark navy slate pedestal, refined glass milestone cubes, corporate growth indicator, clean studio lighting, uncluttered'
    },
    {
      src: '/images/gallery/academic-book.jpg',
      title: 'طراحی جلد کتاب مرجع دانشگاهی',
      tag: 'آموزش عالی',
      prompt: 'Refined modern academic textbook cover art, minimalist abstract geometric composition of intersecting arches and steps representing knowledge and education, warm ivory and rich slate blue, elegant and serene'
    },
    {
      src: '/images/gallery/biotech-dna.jpg',
      title: 'تصویرسازی زیست‌فناوری و ژنتیک',
      tag: 'پزشکی و سلامت',
      prompt: 'Clean minimalist 3D medical visualization of a glowing DNA double helix structure, floating in pristine clinical atmosphere with soft cyan and white luminous glow, ultra-clean laboratory background, uncluttered'
    }
  ];

  // Pricing Packages with Persian Digits & Font Refinements
  const packages = [
    {
      title: 'هدیه ثبت‌نام',
      price: 'رایگان',
      rawPrice: 0,
      badge: 'هدیه بدون قیدوشرط',
      tokenEstimate: `~${toPersianDigits('150,000')} توکن سهمیه`,
      messagesCount: `حدود ${toPersianDigits('150')} تا ${toPersianDigits('200')} پیام کامل`,
      desc: 'بلافاصله پس از ثبت‌نام به کیف پول شما واریز می‌شود تا قدرت مدل‌ها را آزادانه آزمایش کنید.',
      features: ['دسترسی کامل به تمام مدل‌ها', 'بدون نیاز به کارت بانکی', 'تحلیل اسناد و جستجوی زنده وب'],
      isPopular: false,
      ctaText: 'شروع با اعتبار هدیه',
      ctaAction: () => (isAuthenticated ? navigate('/chat') : setAuthModalOpen(true))
    },
    {
      title: 'بسته برنزی (استارتر)',
      price: toPersianDigits('49,000'),
      rawPrice: 49000,
      badge: 'مقرون‌به‌صرفه',
      tokenEstimate: `~${toPersianDigits('400,000')} توکن سهمیه`,
      messagesCount: `حدود ${toPersianDigits('300')} تا ${toPersianDigits('400')} پاسخ هوشمند`,
      desc: 'انتخابی عالی برای پاسخ به سوالات درسی، نگارش ایمیل و خلاصه مقالات هفتگی.',
      features: ['دسترسی به Claude 3.5 و GPT-4o', 'بدون تاریخ انقضا', 'محاسبه شفاف و دقیق به اندازه مصرف'],
      isPopular: false,
      ctaText: 'خرید بسته برنزی',
      ctaAction: () => navigate('/dashboard')
    },
    {
      title: 'بسته نقره‌ای',
      price: toPersianDigits('149,000'),
      rawPrice: 149000,
      creditGranted: `${toPersianDigits('180,000')} تومان`,
      badge: `پرفروش‌ترین (${toPersianDigits('20')}٪ شارژ هدیه)`,
      tokenEstimate: `~${toPersianDigits('1,800,000')} توکن سهمیه`,
      messagesCount: `معادل بیش از ${toPersianDigits('1,500')} پاسخ مفصل`,
      desc: 'محبوب‌ترین انتخاب برای نویسندگان، پژوهشگران، وکلا و تولیدکنندگان محتوا.',
      features: [`${toPersianDigits('20')}٪ اعتبار رایگان اضافه`, 'تحلیل عمیق کتاب و اسناد PDF', 'استودیوی تصویرسازی بدون سقف', 'پشتیبانی در اولویت'],
      isPopular: true,
      ctaText: 'انتخاب بسته نقره‌ای',
      ctaAction: () => navigate('/dashboard')
    },
    {
      title: 'بسته طلایی (حرفه‌ای)',
      price: toPersianDigits('349,000'),
      rawPrice: 349000,
      creditGranted: `${toPersianDigits('450,000')} تومان`,
      badge: `بیشترین ارزش (${toPersianDigits('30')}٪ شارژ هدیه)`,
      tokenEstimate: `~${toPersianDigits('5,500,000')} توکن سهمیه`,
      messagesCount: `معادل بیش از ${toPersianDigits('5,000')} پیام عمیق`,
      desc: 'ویژه توسعه‌دهندگان، معماران نرم‌افزار، تحلیل‌گران داده و تیم‌های کاری.',
      features: [`${toPersianDigits('30')}٪ شارژ تشویقی نقدی`, 'بالاترین اولویت سرعت پردازش', 'کدنویسی پیچیده و تحلیل دیتاست', 'اعتبار بدون انقضا'],
      isPopular: false,
      ctaText: 'انتخاب بسته طلایی',
      ctaAction: () => navigate('/dashboard')
    }
  ];

  // Dynamic Live Content State (Managed via Admin CMS Studio)
  const [dynamicHero, setDynamicHero] = useState<any>(null);
  const [dynamicManifesto, setDynamicManifesto] = useState<any>(null);
  const [dynamicProfessions, setDynamicProfessions] = useState<any[]>(professionCards);
  const [dynamicGallery, setDynamicGallery] = useState<any[]>(galleryImages);
  const [dynamicPricingHeader, setDynamicPricingHeader] = useState<any>(null);
  const [dynamicFaqs, setDynamicFaqs] = useState<any[]>(faqs);
  const [dynamicCta, setDynamicCta] = useState<any>(null);
  const [dynamicGiftCard, setDynamicGiftCard] = useState<any>(null);
  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);

  useEffect(() => {
    fetch('/api/landing-content')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (data.hero) setDynamicHero(data.hero);
        if (data.manifesto && data.manifesto.title) setDynamicManifesto(data.manifesto);
        if (data.professions && Array.isArray(data.professions) && data.professions.length > 0) {
          const activeOnes = data.professions.filter((p: any) => p.enabled !== false);
          if (activeOnes.length > 0) setDynamicProfessions(activeOnes);
        }
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
          setDynamicGallery(data.gallery);
        }
        if (data.pricingHeader) {
          setDynamicPricingHeader(data.pricingHeader);
        }
        if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
          setDynamicFaqs(data.faqs);
        }
        if (data.cta && data.cta.title) {
          setDynamicCta(data.cta);
        }
        if (data.giftCard) {
          setDynamicGiftCard(data.giftCard);
        }
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setDynamicPlans(data.plans);
        }
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
        '۵۰٬۰۰۰ تومان اعتبار هدیه نقدی اولیه برای شروع',
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
      title: 'دستیار هوشمند | چت با هوش مصنوعی فارسی، Claude 3.5، GPT-4o و استودیو تصویرساز',
      description: 'پلتفرم جامع هوش مصنوعی فارسی بدون فیلترشکن. دسترسی مستقیم به Claude 3.5 Sonnet، GPT-4o، Gemini 2.0 Flash و استودیو تولید تصویر همراه با ۵۰٬۰۰۰ تومان اعتبار هدیه اولیه و پرداخت شتاب.',
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
      setGallerySlide((prev) => (prev + 1) % list.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isGalleryPaused, dynamicGallery]);

  // Typewriter effect for active profession prompt
  useEffect(() => {
    const list = dynamicProfessions && dynamicProfessions.length > 0 ? dynamicProfessions : professionCards;
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
  }, [activeProfessionIdx, dynamicProfessions]);

  // Auto-play interval for Professions Spotlight Stage
  useEffect(() => {
    if (isProfessionsPaused) return;
    const list = dynamicProfessions && dynamicProfessions.length > 0 ? dynamicProfessions : professionCards;
    if (!list || list.length <= 1) return;
    const timer = setInterval(() => {
      setActiveProfessionIdx((prev) => (prev + 1) % list.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isProfessionsPaused, dynamicProfessions]);

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

  return (
    <div className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] selection:bg-[#2563eb] selection:text-white transition-colors" dir="rtl">

      {/* ---------------- 1. Claymorphic Floating Header ---------------- */}
      <header className="sticky top-2 sm:top-3 z-50 max-w-6xl mx-2 sm:mx-4 md:mx-auto px-4 sm:px-6 h-16 flex items-center justify-between clay-card-thick backdrop-blur-xl transition-all">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-2xl clay-btn-primary-thick flex items-center justify-center font-bold text-sm shadow-md transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-sm sm:text-base font-black text-[#0f1420] dark:text-white tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
              دستیار هوشمند
            </span>
            <span className="text-[10px] text-[#525d75] dark:text-[#9aa5bc] font-medium">پلتفرم جامع هوش مصنوعی فارسی</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
          <Link to="/chat" className="px-3 py-1.5 rounded-xl hover:text-[#0f1420] dark:hover:text-white transition-all">
            چت‌باکس هوشمند
          </Link>
          <a href="#models" className="px-3 py-1.5 rounded-xl hover:text-[#0f1420] dark:hover:text-white transition-all">
            مدل‌ها و امکانات
          </a>
          <a href="#gallery" className="px-3 py-1.5 rounded-xl hover:text-[#0f1420] dark:hover:text-white transition-all">
            استودیو تصویر
          </a>
          <a href="#pricing" className="px-3 py-1.5 rounded-xl hover:text-[#0f1420] dark:hover:text-white transition-all">
            تعرفه‌ها و سهمیه
          </a>
          <a href="#faq" className="px-3 py-1.5 rounded-xl hover:text-[#0f1420] dark:hover:text-white transition-all">
            پرسش و پاسخ
          </a>
          <Link to="/store" className="px-3 py-1.5 rounded-xl hover:text-[#0f1420] dark:hover:text-white transition-all">
            فروشگاه
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {isAuthenticated ? (
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 clay-btn-primary-thick px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <span>ورود به چت</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex clay-btn-thick px-3.5 py-2 text-xs font-bold text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white cursor-pointer active:scale-95"
              >
                ورود
              </button>
              <Link
                to="/chat"
                className="inline-flex items-center gap-1.5 clay-btn-primary-thick px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <span>شروع با هدیه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden clay-btn-thick w-9 h-9 flex items-center justify-center text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white cursor-pointer"
            aria-label="منو"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 clay-card-thick md:hidden p-4 space-y-2.5 z-50">
            <Link
              to="/chat"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl clay-btn-primary-thick text-xs font-bold"
            >
              <span>ورود به چت‌باکس هوشمند</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <a href="#models" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
              مدل‌ها و امکانات
            </a>
            <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
              گالری استودیو تصویر
            </a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
              تعرفه‌ها و سهمیه توکن
            </a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
              پرسش و پاسخ جامع
            </a>
            <Link to="/store" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
              فروشگاه محصولات
            </Link>
          </div>
        )}
      </header>

      {/* ---------------- 2. Hero Section (Thick 3D Claymorphism) ---------------- */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full clay-pill-thick bg-white/90 dark:bg-[#141824]/90 text-xs font-bold mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-[#0f1420] dark:text-[#e4e7ee]">
            {dynamicHero?.featurePill || `${toPersianDigits('50,000')} تومان اعتبار نقدی هدیه | بدون نیاز به فیلترشکن و پرداخت ریالی`}
          </span>
        </div>

        {/* Headline (Refined, Proportional Typography) */}
        <h1
          className="text-2xl sm:text-3xl md:text-5xl font-black text-[#0f1420] dark:text-white leading-[1.3] max-w-2xl mb-4"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          {dynamicHero?.title || (
            <>
              دسترسی مستقیم و بدون واسطه به <br className="hidden sm:inline" />
              <span className="text-[#2563eb] dark:text-[#60a5fa]">برترین هوش‌های مصنوعی</span> جهان
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] max-w-xl font-normal leading-relaxed mb-8">
          {dynamicHero?.subtitle || 'بدون نیاز به خرید اشتراک‌های ماهانه دلاری یا دغدغه فیلترشکن؛ با پرچمداران Claude 3.5، GPT-4o و Gemini به فارسی گفتگو کنید و هزینه را به اندازه مصرف واقعی به تومان بپردازید.'}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-10 sm:mb-12">
          <Link
            to={dynamicHero?.primaryBtnLink || '/chat'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl clay-btn-primary-thick font-black text-xs sm:text-sm shadow-xl transition-all group active:scale-95 cursor-pointer"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span>{dynamicHero?.primaryBtnText || 'شروع گفتگو با ۵۰ هزار تومان هدیه'}</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <a
            href={dynamicHero?.secondaryBtnLink || '#pricing'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl clay-btn-thick font-bold text-xs sm:text-sm text-[#0f1420] dark:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>{dynamicHero?.secondaryBtnText || 'مشاهده بسته‌ها و تعرفه‌ها'}</span>
          </a>
        </div>

        {/* Hero Visual Mockup Console (Sculpted Thick Clay) */}
        <div className="w-full max-w-4xl clay-card-elevated overflow-hidden text-right">
          {/* Top Console Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 shadow-xs" />
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-xs" />
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-xs" />
              <span className="text-[11px] font-mono font-bold text-[#525d75] dark:text-[#9aa5bc] mr-2">محیط چت تعاملی دستیار هوشمند</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-[#525d75] dark:text-[#9aa5bc]">{activeScenario.model}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full clay-pill-thick bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                {activeScenario.modelBadge}
              </span>
            </div>
          </div>

          {/* Chips Selector */}
          <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3.5 border-b border-black/5 dark:border-white/5 overflow-x-auto [scrollbar-width:none]">
            {((dynamicHero?.demoScenarios && dynamicHero.demoScenarios.length > 0) ? dynamicHero.demoScenarios : DEMO_SCENARIOS).map((sc: any) => {
              const Icon = typeof sc.icon === 'function' ? sc.icon : Sparkles;
              const isActive = activeScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                      ? 'clay-btn-primary-thick !rounded-xl'
                      : 'clay-btn-thick !rounded-xl text-[#525d75] dark:text-[#9aa5bc]'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Console Body Area */}
          <div className="p-5 sm:p-7 space-y-4 text-xs sm:text-sm leading-relaxed">
            {/* User Message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-xl clay-card-thick !rounded-2xl !rounded-tr-xs p-4 sm:p-5 text-[#0f1420] dark:text-[#f3f5f9]">
                <p className="font-semibold leading-relaxed">{activeScenario.userPrompt}</p>
              </div>
              <div className="w-8 h-8 rounded-2xl clay-btn-thick flex items-center justify-center shrink-0 text-[#0f1420] dark:text-white font-black text-xs">
                شما
              </div>
            </div>

            {/* AI Response */}
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-2xl clay-btn-primary-thick flex items-center justify-center shrink-0 font-bold text-xs shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 max-w-2xl clay-card-thick !rounded-2xl !rounded-tl-xs p-5 sm:p-6 text-[#0f1420] dark:text-[#f3f5f9] whitespace-pre-wrap leading-relaxed shadow-lg">
                {activeScenario.aiResponse}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20">
            <span className="text-[11px] font-bold text-[#525d75] dark:text-[#9aa5bc]">پاسخ‌دهی آنی بدون تاخیر فیلترشکن</span>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 clay-btn-thick px-3 py-1.5 rounded-xl text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] hover:brightness-110"
            >
              <span>تست همین سناریو در چت‌باکس</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- 3. Bento Grid: Visual Features (Thick 3D Claymorphic) ---------------- */}
      <section id="models" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2
            className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight mb-3"
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
          <div className="md:col-span-2 clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl clay-btn-primary-thick flex items-center justify-center text-white mb-5 shadow-md">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f1420] dark:text-white mb-2.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                دسترسی همزمان به برترین مدل‌های جهان
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
                سوییچ آسان میان Claude 3.5 Sonnet، GPT-4o، Google Gemini 2.0 و DeepSeek-V3. با قابلیت سوییچ هوشمند، سیستم به طور خودکار نوع سوال شما را تشخیص داده و کار را به خبره‌ترین مدل واگذار می‌کند.
              </p>
            </div>
            {/* Visual Model Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-black/5 dark:border-white/5">
              <div className="p-3.5 rounded-2xl clay-card-thick text-center">
                <span className="block font-black text-xs text-[#0f1420] dark:text-white">Claude 3.5</span>
                <span className="text-[10px] text-[#717b91] font-medium">استاد نگارش و ادبیات</span>
              </div>
              <div className="p-3.5 rounded-2xl clay-card-thick text-center">
                <span className="block font-black text-xs text-[#0f1420] dark:text-white">GPT-4o</span>
                <span className="text-[10px] text-[#717b91] font-medium">پرچم‌دار همه‌کاره</span>
              </div>
              <div className="p-3.5 rounded-2xl clay-card-thick text-center">
                <span className="block font-black text-xs text-[#0f1420] dark:text-white">Gemini 2.0</span>
                <span className="text-[10px] text-[#717b91] font-medium">تحلیل چندرسانه‌ای و سرعت</span>
              </div>
              <div className="p-3.5 rounded-2xl clay-card-thick text-center">
                <span className="block font-black text-xs text-[#0f1420] dark:text-white">DeepSeek V3</span>
                <span className="text-[10px] text-[#717b91] font-medium">کدنویسی و ریاضیات عمیق</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: No VPN & Shetab Banking */}
          <div className="clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl clay-btn-emerald-thick flex items-center justify-center text-white mb-5 shadow-md">
                <ShieldCheck className="w-5 h-5" />
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
          <div className="clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl clay-btn-amber-thick flex items-center justify-center text-white mb-5 shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f1420] dark:text-white mb-2.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                تحلیل اسناد و فایل‌های سنگین
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                آپلود مستقیم کتاب‌ها و مقالات علمی PDF تا سقف ۵۰ مگابایت، فایل‌های کدنویسی و فایل‌های اکسل جهت تلخیص، استخراج اطلاعات و پرسش و پاسخ.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 text-[11px] font-semibold text-[#717b91]">
              پشتیبانی از PDF، کدهای برنامه‌نویسی و اسناد متنی
            </div>
          </div>

          {/* Bento Card 4: High-End Image Studio Showcase (Double Column) */}
          <div className="md:col-span-2 clay-card-thick p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl clay-btn-primary-thick flex items-center justify-center text-white mb-5 shadow-md">
                <ImageIcon className="w-5 h-5" />
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
              <a href="#gallery" className="text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] hover:underline">
                مشاهده ۶ شاهکار گالری زیر ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 3.5. Manifesto & Targeted Professions ---------------- */}
      <section id="manifesto" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        {/* Dignified Manifesto Header & Content */}
        <div className="clay-card-elevated p-6 sm:p-10 mb-14">
          <div className="max-w-3xl">
            <span className="inline-block px-3.5 py-1 rounded-full clay-pill-thick text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3.5">
              {dynamicManifesto?.badge || 'بیانیه شفافیت و فلسفه طراحی'}
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black text-[#0f1420] dark:text-white tracking-tight mb-4"
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
              const ReasonIcon = (typeof r.icon === 'string' ? ICON_MAP[r.icon] : r.icon) || (rIdx === 0 ? Coins : rIdx === 1 ? Zap : ShieldCheck);
              return (
                <div key={r.id || rIdx} className="p-5 rounded-2xl clay-card-thick">
                  <div className="w-9 h-9 rounded-xl clay-btn-thick flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] mb-3">
                    <ReasonIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1420] dark:text-white mb-1.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {r.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6 Targeted Professions & Ready-to-Test Prompts (IMAGES PRESERVED) */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-bold text-[#717b91] uppercase tracking-widest block mb-1">
            TARGET AUDIENCE & USE CASES
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight mb-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            دستیار هوشمند؛ همراه تخصصی کدام حرفه‌هاست؟
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            برای هر تخصص، یک پرامپت آماده طراحی شده است؛ کافیست کلیک کنید تا پاسخ آن را مستقیماً در چت‌باکس بسنجید.
          </p>
        </div>

        {/* ---------------- 3D Spotlight Stage with Typewriter Animated Prompts ---------------- */}
        {(() => {
          const professionList = dynamicProfessions && dynamicProfessions.length > 0 ? dynamicProfessions : professionCards;
          const currentProfession = professionList[activeProfessionIdx] || professionList[0];
          const CurrentIcon = (typeof currentProfession.icon === 'string' ? ICON_MAP[currentProfession.icon] : currentProfession.icon) || GraduationCap;

          return (
            <div className="space-y-6">
              {/* Category Quick Selector Bar (Puffy Clay Pills) */}
              <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
                {professionList.map((p, idx) => {
                  const Icon = (typeof p.icon === 'string' ? ICON_MAP[p.icon] : p.icon) || GraduationCap;
                  const isActive = activeProfessionIdx === idx;
                  return (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setActiveProfessionIdx(idx)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        isActive
                          ? 'clay-btn-primary-thick text-white shadow-lg scale-105'
                          : 'clay-btn-thick text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Main 3D Spotlight Stage Card */}
              <div
                className="relative clay-card-elevated p-6 sm:p-8 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-2xl"
                onMouseEnter={() => setIsProfessionsPaused(true)}
                onMouseLeave={() => setIsProfessionsPaused(false)}
                onTouchStart={() => setIsProfessionsPaused(true)}
                onTouchEnd={() => setIsProfessionsPaused(false)}
              >
                {/* Stage Header with Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clay-pill-thick bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    <CurrentIcon className="w-4 h-4" />
                    <span>تخصص انتخابی: {currentProfession.badge}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveProfessionIdx((prev) => (prev - 1 + professionList.length) % professionList.length)}
                      className="w-10 h-10 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                      aria-label="تخصص قبلی"
                      title="تخصص قبلی"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProfessionIdx((prev) => (prev + 1) % professionList.length)}
                      className="w-10 h-10 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
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
                    <div className="relative aspect-[16/11] overflow-hidden rounded-[24px] bg-[#eef1f6] dark:bg-[#151923] shadow-inner clay-card-thick p-1">
                      <img
                        key={currentProfession.image}
                        src={currentProfession.image}
                        alt={currentProfession.title}
                        className="w-full h-full object-cover rounded-[20px] transition-all duration-700 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Content & Typewriter Animated Prompt */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <h3
                        className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white tracking-tight mb-2"
                        style={{ fontFamily: "'Estedad', sans-serif" }}
                      >
                        {currentProfession.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                        {currentProfession.desc}
                      </p>
                    </div>

                    {/* Typewriter Prompt Inset Box */}
                    <div className="clay-inset-thick p-4 sm:p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2563eb] dark:text-[#60a5fa]">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <span>پرامپت تخصصی آماده برای آزمایش:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyProfessionPrompt(currentProfession.prompt)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold clay-btn-thick px-3 py-1 rounded-xl text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white transition-all cursor-pointer"
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

                      {/* Typewriter text with blinking cursor */}
                      <div className="min-h-[64px] sm:min-h-[72px] bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                        <p className="text-xs sm:text-sm font-mono text-[#0f1420] dark:text-white leading-relaxed select-all">
                          <span>{typedPrompt}</span>
                          <span className="inline-block w-1.5 h-4 bg-[#2563eb] dark:bg-[#60a5fa] ms-1 animate-pulse align-middle" />
                        </p>
                      </div>
                    </div>

                    {/* Action Button: Directly Send Prompt to Chat */}
                    <div className="pt-2">
                      <Link
                        to={`/chat?prompt=${encodeURIComponent(currentProfession.prompt)}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl clay-btn-primary-thick text-sm font-bold text-white shadow-xl hover:brightness-110 active:scale-95 transition-all"
                      >
                        <span>شروع گفتگو و آزمایش این پرامپت در چت‌باکس</span>
                        <ArrowLeft className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Miniature Cards Grid (Quick Jump to any of the 6 Professions) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {professionList.map((p, idx) => {
                  const isActive = activeProfessionIdx === idx;
                  return (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setActiveProfessionIdx(idx)}
                      className={`p-2 rounded-2xl transition-all duration-300 text-right cursor-pointer flex items-center gap-2.5 active:scale-95 ${
                        isActive
                          ? 'clay-card-elevated border-2 border-[#2563eb] dark:border-[#60a5fa] scale-102 shadow-md'
                          : 'clay-card-thick opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="block text-[11px] font-bold text-[#0f1420] dark:text-white truncate">
                          {p.badge}
                        </span>
                        <span className="block text-[9px] text-[#717b91] truncate">
                          مشاهده پرامپت
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ---------------- 4. Hyperrealistic Image Gallery Showcase (ANIMATED 3D CLAY CAROUSEL) ---------------- */}
      {(() => {
        const galleryList = (dynamicGallery && dynamicGallery.length > 0) ? dynamicGallery : galleryImages;
        return (
          <section id="gallery" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full clay-pill-thick text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>AI IMAGE STUDIO SHOWCASE • انیمیشن تعاملی</span>
                </div>
                <h2
                  className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight"
                  style={{ fontFamily: "'Estedad', sans-serif" }}
                >
                  آثار تولیدشده در استودیوی تصویرساز
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Carousel Navigation Buttons (Claymorphic) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGallerySlide((prev) => (prev - 1 + galleryList.length) % galleryList.length)}
                    className="w-10 h-10 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                    aria-label="تصویر قبلی"
                    title="تصویر قبلی"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGallerySlide((prev) => (prev + 1) % galleryList.length)}
                    className="w-10 h-10 rounded-2xl clay-btn-thick flex items-center justify-center text-[#0f1420] dark:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                    aria-label="تصویر بعدی"
                    title="تصویر بعدی"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <Link
                  to="/chat"
                  className="inline-flex items-center gap-1.5 clay-btn-thick px-4 py-2.5 rounded-xl text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] hover:brightness-110 active:scale-95"
                >
                  <span>ورود به استودیو</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Animated 3D Claymorphic Carousel Viewport */}
            <div
              className="relative overflow-hidden w-full py-4 [--items-per-row:1] sm:[--items-per-row:2] lg:[--items-per-row:3]"
              onMouseEnter={() => setIsGalleryPaused(true)}
              onMouseLeave={() => setIsGalleryPaused(false)}
              onTouchStart={() => setIsGalleryPaused(true)}
              onTouchEnd={() => setIsGalleryPaused(false)}
            >
              <div
                dir="ltr"
                className="flex transition-transform duration-700 ease-out gap-6"
                style={{
                  transform: `translateX(calc(-${gallerySlide} * (100% + 1.5rem) / var(--items-per-row, 1)))`
                }}
              >
                {galleryList.map((img: any, idx: number) => (
                  <div
                    key={idx}
                    dir="rtl"
                    className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] shrink-0 clay-card-thick overflow-hidden transition-all duration-300 flex flex-col justify-between hover:-translate-y-2 hover:shadow-xl"
                  >
                    {/* Preserved Image with Sculpted Frame */}
                    <div className="relative aspect-[4/3] overflow-hidden m-3 rounded-2xl bg-[#eef1f6] dark:bg-[#151923] shadow-inner">
                      <img
                        src={img.src}
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full clay-pill-thick bg-black/75 text-white text-[10px] font-bold backdrop-blur-md">
                        {img.tag}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#0f1420] dark:text-white mb-1.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                          {img.title}
                        </h3>
                        <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] line-clamp-2 leading-relaxed font-mono" dir="ltr">
                          {img.prompt}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => copyPromptToClipboard(img.prompt, idx)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold clay-btn-thick px-3 py-1.5 rounded-xl text-[#525d75] dark:text-[#9aa5bc] hover:text-[#0f1420] dark:hover:text-white transition-all cursor-pointer"
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

                        <Link to="/chat" className="text-[11px] font-black text-[#2563eb] dark:text-[#60a5fa] hover:underline">
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
              {galleryList.map((_, dotIdx) => {
                const isActive = gallerySlide === dotIdx;
                return (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setGallerySlide(dotIdx)}
                    className={`transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'clay-btn-primary-thick !w-8 !h-3 !rounded-full shadow-md'
                        : 'clay-btn-thick !w-3 !h-3 !rounded-full opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`رفتن به اسلاید ${dotIdx + 1}`}
                  />
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ---------------- 5. Transparent Hybrid Pricing Section (Thick 3D Claymorphic) ---------------- */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-[#717b91] uppercase tracking-widest block mb-1">
            {dynamicPricingHeader?.badge || 'TRANSPARENT PRICING'}
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight mb-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            {dynamicPricingHeader?.title || 'تعرفه‌ها بر اساس تومان و سهمیه توکن'}
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            {dynamicPricingHeader?.subtitle || 'بدون کسر ماهانه خودکار و بدون هزینه‌های مخفی. هر بسته مستقیماً به کیف پول شما اضافه می‌شود و تاریخ انقضا ندارد.'}
          </p>
        </div>

        {/* Pricing Grid (Dynamic Self-Healing Fluid Layout) */}
        {(() => {
          const freeCard = dynamicGiftCard ? {
            id: 'free-welcome',
            title: dynamicGiftCard.title || 'هدیه ثبت‌نام',
            price: dynamicGiftCard.price || 'رایگان',
            rawPrice: 0,
            badge: dynamicGiftCard.badge || 'هدیه بدون قیدوشرط',
            tokenEstimate: dynamicGiftCard.tokenEstimate || `~${toPersianDigits('150,000')} توکن سهمیه`,
            messagesCount: dynamicGiftCard.messagesCount || `حدود ${toPersianDigits('150')} تا ${toPersianDigits('200')} پیام کامل`,
            desc: dynamicGiftCard.desc || 'بلافاصله پس از ثبت‌نام به کیف پول شما واریز می‌شود تا قدرت مدل‌ها را آزادانه آزمایش کنید.',
            features: Array.isArray(dynamicGiftCard.features)
              ? dynamicGiftCard.features
              : typeof dynamicGiftCard.features === 'string'
                ? dynamicGiftCard.features.split('\n').filter(Boolean)
                : ['دسترسی کامل به تمام مدل‌ها', 'بدون نیاز به کارت بانکی', 'تحلیل اسناد و جستجوی زنده وب'],
            isPopular: false,
            image: null,
            ctaText: dynamicGiftCard.ctaText || 'شروع با اعتبار هدیه',
            ctaAction: () => (isAuthenticated ? navigate('/chat') : setAuthModalOpen(true))
          } : {
            id: 'free-welcome',
            title: 'هدیه ثبت‌نام',
            price: 'رایگان',
            rawPrice: 0,
            badge: 'هدیه بدون قیدوشرط',
            tokenEstimate: `~${toPersianDigits('150,000')} توکن سهمیه`,
            messagesCount: `حدود ${toPersianDigits('150')} تا ${toPersianDigits('200')} پیام کامل`,
            desc: 'بلافاصله پس از ثبت‌نام به کیف پول شما واریز می‌شود تا قدرت مدل‌ها را آزادانه آزمایش کنید.',
            features: ['دسترسی کامل به تمام مدل‌ها', 'بدون نیاز به کارت بانکی', 'تحلیل اسناد و جستجوی زنده وب'],
            isPopular: false,
            image: null,
            ctaText: 'شروع با اعتبار هدیه',
            ctaAction: () => (isAuthenticated ? navigate('/chat') : setAuthModalOpen(true))
          };

          const isFreeCardEnabled = dynamicGiftCard ? dynamicGiftCard.enabled !== false : true;

          let cardsToRender: any[] = packages;
          if (dynamicPlans && dynamicPlans.length > 0) {
            const dbCards = dynamicPlans.map((p) => {
              let featureList: string[] = [];
              if (p.features) {
                featureList = p.features.split('\n').map((s: string) => s.trim()).filter(Boolean);
              } else if (p.longDescription) {
                featureList = p.longDescription.split('\n').map((s: string) => s.trim()).filter(Boolean);
              } else if (p.description) {
                featureList = [p.description];
              }

              return {
                id: p.id,
                title: p.title,
                price: toPersianDigits(p.price ? p.price.toLocaleString() : '۰'),
                rawPrice: p.price || 0,
                badge: p.badge || (p.isPopular ? `پرفروش‌ترین (${toPersianDigits('20')}٪ شارژ هدیه)` : 'بسته ویژه'),
                tokenEstimate: p.tokenEstimate || `~${toPersianDigits('1,000,000')} توکن سهمیه`,
                messagesCount: '',
                desc: p.description || '',
                features: featureList,
                isPopular: Boolean(p.isPopular),
                image: p.image || null,
                ctaText: `خرید ${p.title}`,
                ctaAction: () => {
                  if (!isAuthenticated) {
                    setAuthModalOpen(true);
                  } else {
                    setSelectedPlanForCheckout(p);
                  }
                }
              };
            });
            cardsToRender = isFreeCardEnabled ? [freeCard, ...dbCards] : dbCards;
          } else {
            cardsToRender = isFreeCardEnabled ? packages : packages.filter(p => p.rawPrice > 0);
          }

          const count = cardsToRender.length;
          const gridLayoutClass = count === 1
            ? 'max-w-md mx-auto grid grid-cols-1 gap-6'
            : count === 2
              ? 'max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6'
              : count === 3
                ? 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : count === 4
                  ? 'max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
                  : 'max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6';

          return (
            <div className={`${gridLayoutClass} transition-all duration-300`}>
              {cardsToRender.map((pkg: any, idx: number) => (
                <div
                  key={pkg.id || idx}
                  className={`p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${pkg.isPopular
                      ? 'clay-card-elevated ring-2 ring-blue-500/50 -translate-y-2'
                      : 'clay-card-thick'
                    }`}
                >
                  <div>
                    {/* Optional Header Image / Media (Preserved) */}
                    {pkg.image && (
                      <div className="mb-4 w-full h-32 rounded-2xl overflow-hidden bg-[#eef1f6] dark:bg-[#151923] shadow-inner">
                        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}

                    <div className="mb-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold clay-pill-thick ${pkg.isPopular
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-black/5 dark:bg-white/10 text-[#525d75] dark:text-[#9aa5bc]'
                          }`}
                      >
                        {pkg.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black mb-2 text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                      {pkg.title}
                    </h3>

                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                        {pkg.price}
                      </span>
                      {pkg.rawPrice > 0 && <span className="text-xs font-bold opacity-70">تومان</span>}
                    </div>

                    {/* Token / Messages Box in Inset Clay */}
                    {pkg.tokenEstimate && (
                      <div
                        className="clay-inset-thick p-3.5 rounded-2xl mb-5 text-xs space-y-1"
                      >
                        <div className="font-black text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                          {pkg.tokenEstimate}
                        </div>
                        {pkg.messagesCount ? <div className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] font-medium">{pkg.messagesCount}</div> : null}
                      </div>
                    )}

                    {pkg.desc && (
                      <p className="text-xs opacity-80 leading-relaxed mb-6">{pkg.desc}</p>
                    )}

                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="space-y-2.5 text-xs mb-8">
                        {pkg.features.map((feat: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 shrink-0 text-[#10b981]" />
                            <span className="font-medium text-[#0f1420] dark:text-[#e4e7ee]">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={pkg.ctaAction}
                    className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 ${pkg.isPopular
                        ? 'clay-btn-primary-thick'
                        : 'clay-btn-thick text-[#0f1420] dark:text-white'
                      }`}
                    style={{ fontFamily: "'Estedad', sans-serif" }}
                  >
                    {pkg.ctaText}
                  </button>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Custom Amount Top-up Banner in Clay */}
        {dynamicPricingHeader?.customTopupBanner?.enabled !== false && (
          <div className="mt-10 p-6 sm:p-8 rounded-3xl clay-card-thick max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
            <div className="flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-2xl clay-btn-emerald-thick flex items-center justify-center shrink-0 shadow-md">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-[#0f1420] dark:text-white mb-1.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                  {dynamicPricingHeader?.customTopupBanner?.title || 'پلن‌های ثابت مناسب شما نیست؟ شارژ با هر مبلغ دلخواه'}
                </h4>
                <p className="text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  {dynamicPricingHeader?.customTopupBanner?.desc || 'کیف پول خود را به هر میزانی که مایلید (حداقل ۵,۰۰۰ تومان) شارژ کنید و فقط به ازای توکن‌های مصرفی کسر اعتبار شوید.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  setIsWalletOpen(true);
                } else {
                  setAuthModalOpen(true);
                }
              }}
              className="shrink-0 px-5 py-3 rounded-2xl clay-btn-emerald-thick text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              <CreditCard className="w-4 h-4" />
              <span>{dynamicPricingHeader?.customTopupBanner?.btnText || 'شارژ با مبلغ دلخواه'}</span>
            </button>
          </div>
        )}

        {/* Security & Instant Credit Note in Sculpted Clay */}
        <div className="mt-8 p-4 rounded-2xl clay-card-thick max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold text-[#525d75] dark:text-[#9aa5bc]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>شارژ آنی کیف پول بلافاصله پس از پرداخت شتاب</span>
          </div>
          <span className="hidden sm:inline opacity-40">•</span>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
            <span>تسویه امن با درگاه‌های رسمی بانکی شاپرک</span>
          </div>
        </div>
      </section>

      {/* ---------------- 6. Extensive FAQ Section (10 Rich Questions in Claymorphic Style) ---------------- */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-black/5 dark:border-white/5">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-xs font-bold text-[#717b91] uppercase tracking-widest block mb-1">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight mb-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            پرسش‌ها و پاسخ‌های متداول
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            پاسخ جامع و شفاف به کلیه سوالات شما درباره نحوه استفاده، هزینه‌ها و امکانات هوش مصنوعی
          </p>
        </div>

        <div className="space-y-4">
          {dynamicFaqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                className="clay-card-thick overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full p-5 text-right flex items-center justify-between gap-4 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {faq.q}
                  </span>
                  <div className="w-8 h-8 rounded-xl clay-btn-thick flex items-center justify-center shrink-0">
                    <ChevronDown
                      className={`w-4 h-4 text-[#525d75] dark:text-[#9aa5bc] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#2563eb] dark:text-[#60a5fa]' : ''
                        }`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed border-t border-black/5 dark:border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- 7. Final Call to Action (Thick Clay Mega Banner) ---------------- */}
      {(() => {
        const ctaData = dynamicCta || {
          title: `همین حالا با ${toPersianDigits('50,000')} تومان هدیه شروع کنید`,
          desc: 'ثبت‌نام در کمتر از ۳۰ ثانیه بدون نیاز به وارد کردن کارت بانکی؛ بلافاصله وارد محیط چت شوید و لذت کار با برترین مدل‌های جهان را تجربه کنید.',
          primaryBtnText: 'ورود به محیط چت',
          primaryBtnLink: '/chat',
          secondaryBtnText: 'مشاهده فروشگاه',
          secondaryBtnLink: '/store',
          theme: 'dark'
        };
        return (
          <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
            <div className="clay-card-elevated p-8 sm:p-14">
              <div className="max-w-xl mx-auto space-y-5">
                <h2 className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                  {ctaData.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                  {ctaData.desc}
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <Link
                    to={ctaData.primaryBtnLink || '/chat'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl clay-btn-primary-thick font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer"
                    style={{ fontFamily: "'Estedad', sans-serif" }}
                  >
                    <span>{ctaData.primaryBtnText || 'ورود به محیط چت'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <Link
                    to={ctaData.secondaryBtnLink || '/store'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl clay-btn-thick font-bold text-sm text-[#0f1420] dark:text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <Store className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
                    <span>{ctaData.secondaryBtnText || 'مشاهده فروشگاه'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ---------------- 8. Footer Component ---------------- */}
      <Footer />

      {/* Checkout Modal for Plan Products */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          product={selectedPlanForCheckout}
          isOpen={Boolean(selectedPlanForCheckout)}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}
    </div>
  );
};
