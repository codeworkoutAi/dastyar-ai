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
  FileCheck
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Footer } from '../../components/Footer';
import { toPersianDigits } from '../../lib/persianUtils';
import { setPageSeo } from '../../lib/seo';

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

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

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

  // Professional English Prompts with Matching Masterpiece Images
  const galleryImages = [
    {
      src: '/images/gallery/tehran-2150.jpg',
      title: 'تهران در سال ۲۱۵۰',
      tag: 'معماری سایبرپانک',
      prompt: 'Cinematic photorealistic masterpiece of futuristic Tehran in year 2150, iconic Milad tower and Azadi monument reimagined in sleek neo-cyberpunk architecture, flying autonomous hovercrafts with neon light trails, misty atmospheric golden hour, 8k resolution, Octane render'
    },
    {
      src: '/images/gallery/persian-cyber-knight.jpg',
      title: 'سردار سایبرنتیک هخامنشی',
      tag: 'حماسی و کانسپت',
      prompt: 'Cinematic portrait of an ancient Persian warrior in cybernetic high-tech battle armor, engraved golden Farvahar patterns and glowing cyan energy lines, holding a sleek plasma scimitar sword, atmospheric smoke and rim lighting, dark background, ultra-detailed 8k'
    },
    {
      src: '/images/gallery/crystal-tree.jpg',
      title: 'درخت بلورین شب‌تاب',
      tag: 'طبیعت جادویی',
      prompt: 'Bioluminescent crystal tree in an enchanted dark forest at night, glowing amethyst and diamond branches, floating cyan fireflies and glowing dust, soft volumetric light rays, hyperrealistic cinematic fantasy nature photography, 8k resolution, octane render'
    },
    {
      src: '/images/gallery/space-fox.jpg',
      title: 'روباه فضانورد کیهانی',
      tag: 'علمی تخیلی سینمایی',
      prompt: 'Cinematic macro close-up portrait of a majestic cosmic space fox with fur woven from stardust and nebulae, wearing an intricate vintage astronaut helmet with brass fittings, deep space background with swirling galaxies and glittering constellations'
    },
    {
      src: '/images/gallery/crystal-cheetah.jpg',
      title: 'یوزپلنگ طلایی و بلورین',
      tag: 'حیات‌وحش مفهومی',
      prompt: 'Action shot of a sleek Asiatic cheetah made of shimmering gold and crystal running gracefully across desert sand dunes at sunset, warm cinematic golden hour light, flying sand dust, photorealistic wildlife masterpiece, 8k resolution'
    },
    {
      src: '/images/gallery/floating-sanctuary.jpg',
      title: 'قصر آسمانی و کهن',
      tag: 'معماری رویایی',
      prompt: 'A breathtaking ancient palace floating on a giant moss-covered celestial rock in the clouds, waterfalls pouring off the edge into golden sunset mist, ethereal floating architecture with Persian arches and domes, cherry blossom trees, 8k resolution'
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

  const copyPromptToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0c10] text-[#1a1f2c] dark:text-[#f1f3f7] selection:bg-[#252b3b] selection:text-white transition-colors" dir="rtl">
      
      {/* ---------------- 1. Architectural Header (Solid, No Gradient) ---------------- */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#0d1017]/95 border-b border-[#e2e5eb] dark:border-[#1e2433] backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] flex items-center justify-center font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm sm:text-base font-bold text-[#111622] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                دستیار هوشمند
              </span>
              <span className="text-[10px] text-[#717b91] font-medium">پلتفرم جامع هوش مصنوعی فارسی</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#525d75] dark:text-[#9aa5bc]">
            <Link to="/chat" className="hover:text-[#111622] dark:hover:text-white transition-colors">
              چت‌باکس هوشمند
            </Link>
            <a href="#models" className="hover:text-[#111622] dark:hover:text-white transition-colors">
              مدل‌ها و امکانات
            </a>
            <a href="#gallery" className="hover:text-[#111622] dark:hover:text-white transition-colors">
              استودیو تصویر
            </a>
            <a href="#pricing" className="hover:text-[#111622] dark:hover:text-white transition-colors">
              تعرفه‌ها و سهمیه
            </a>
            <a href="#faq" className="hover:text-[#111622] dark:hover:text-white transition-colors">
              پرسش و پاسخ
            </a>
            <Link to="/store" className="hover:text-[#111622] dark:hover:text-white transition-colors">
              فروشگاه
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 bg-[#111622] hover:bg-[#1f273b] dark:bg-white dark:hover:bg-[#e4e7ee] text-white dark:text-[#0a0c10] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>ورود به چت</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-[#525d75] dark:text-[#9aa5bc] hover:text-[#111622] dark:hover:text-white transition-colors cursor-pointer"
                >
                  ورود
                </button>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-1.5 bg-[#111622] hover:bg-[#1f273b] dark:bg-white dark:hover:bg-[#e4e7ee] text-white dark:text-[#0a0c10] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span>شروع با هدیه</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#525d75] dark:text-[#9aa5bc] hover:text-[#111622] dark:hover:text-white"
              aria-label="منو"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#e2e5eb] dark:border-[#1e2433] bg-white dark:bg-[#0d1017] px-4 py-4 space-y-3">
            <Link
              to="/chat"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-[#eef1f6] dark:bg-[#151923] text-xs font-bold"
            >
              <span>ورود به چت‌باکس هوشمند</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <a href="#models" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-1 text-xs text-[#525d75] dark:text-[#9aa5bc]">
              مدل‌ها و امکانات
            </a>
            <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-1 text-xs text-[#525d75] dark:text-[#9aa5bc]">
              گالری استودیو تصویر
            </a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-1 text-xs text-[#525d75] dark:text-[#9aa5bc]">
              تعرفه‌ها و سهمیه توکن
            </a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-1 text-xs text-[#525d75] dark:text-[#9aa5bc]">
              پرسش و پاسخ جامع
            </a>
            <Link to="/store" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-1 text-xs text-[#525d75] dark:text-[#9aa5bc]">
              فروشگاه محصولات
            </Link>
          </div>
        )}
      </header>

      {/* ---------------- 2. Hero Section (Clean Solid, Zero Gradient) ---------------- */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#121620] border border-[#d8dce6] dark:border-[#212838] shadow-xs text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span className="text-[#111622] dark:text-[#e4e7ee]">{toPersianDigits('50,000')} تومان اعتبار نقدی هدیه</span>
          <span className="text-[#9aa5bc]">|</span>
          <span className="text-[#525d75] dark:text-[#9aa5bc] font-normal">بدون نیاز به فیلترشکن و پرداخت ریالی</span>
        </div>

        {/* Headline */}
        <h1
          className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0f1420] dark:text-white leading-[1.25] sm:leading-[1.18] max-w-3xl mb-5"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          دسترسی مستقیم و بدون واسطه به <br />
          <span className="text-[#4b556b] dark:text-[#8895ad]">برترین هوش‌های مصنوعی</span> جهان
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#525d75] dark:text-[#9aa5bc] max-w-2xl font-normal leading-relaxed mb-8">
          بدون نیاز به خرید اشتراک‌های ماهانه دلاری یا دغدغه قطع شدن فیلترشکن؛ با پرچمداران Claude 3.5، GPT-4o و Gemini به فارسی گفتگو کنید، اسناد و کدهای حجیم را تحلیل نمایید و هزینه را به اندازه مصرف کلمات به تومان بپردازید.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-12">
          <Link
            to="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#111622] hover:bg-[#1e2638] dark:bg-white dark:hover:bg-[#e4e7ee] text-white dark:text-[#0a0c10] font-bold text-sm shadow-sm transition-all group"
          >
            <span>شروع گفتگو با ۵۰ هزار تومان هدیه</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-[#121620] hover:bg-[#eef1f6] dark:hover:bg-[#1a202d] text-[#333c4e] dark:text-[#ccd3e0] border border-[#d8dce6] dark:border-[#212838] font-bold text-sm transition-all"
          >
            <Coins className="w-4 h-4 text-[#717b91]" />
            <span>مشاهده بسته‌ها و تعرفه‌ها</span>
          </a>
        </div>

        {/* Hero Visual Mockup Console (Solid Architecture) */}
        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] shadow-lg overflow-hidden text-right">
          {/* Top Console Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[#e6e9f0] dark:border-[#1b202e] bg-[#f8f9fb] dark:bg-[#131620]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d0d5e2] dark:bg-[#2c3447]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#d0d5e2] dark:bg-[#2c3447]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#d0d5e2] dark:bg-[#2c3447]" />
              <span className="text-[11px] font-mono text-[#717b91] mr-2">محیط چت تعاملی دستیار هوشمند</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#525d75] dark:text-[#9aa5bc]">{activeScenario.model}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#e6e9f0] dark:bg-[#1d2332] text-[#333c4e] dark:text-[#ccd3e0] font-semibold">
                {activeScenario.modelBadge}
              </span>
            </div>
          </div>

          {/* Chips Selector */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-[#e6e9f0] dark:border-[#1b202e] bg-white dark:bg-[#0f121a] overflow-x-auto [scrollbar-width:none]">
            {DEMO_SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              const isActive = activeScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#111622] text-white dark:bg-white dark:text-[#0a0c10]'
                      : 'text-[#525d75] dark:text-[#9aa5bc] hover:bg-[#eef1f6] dark:hover:bg-[#161a25]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Console Body Area */}
          <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed bg-[#fdfdfe] dark:bg-[#0f121a]">
            {/* User Message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-xl bg-[#eef1f6] dark:bg-[#181d2a] rounded-2xl rounded-tr-xs p-3.5 sm:p-4 text-[#111622] dark:text-[#e4e7ee] border border-[#dce0eb] dark:border-[#212738]">
                <p className="font-medium">{activeScenario.userPrompt}</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#dce0eb] dark:bg-[#202636] flex items-center justify-center shrink-0 text-[#333c4e] dark:text-[#ccd3e0] font-bold text-xs">
                شما
              </div>
            </div>

            {/* AI Response */}
            <div className="flex items-start gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] flex items-center justify-center shrink-0 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 max-w-2xl bg-white dark:bg-[#131722] border border-[#d8dce6] dark:border-[#1e2433] rounded-2xl rounded-tl-xs p-4 sm:p-5 text-[#111622] dark:text-[#e4e7ee] whitespace-pre-wrap">
                {activeScenario.aiResponse}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-[#e6e9f0] dark:border-[#1b202e] bg-[#f8f9fb] dark:bg-[#131620]">
            <span className="text-[11px] text-[#717b91]">پاسخ‌دهی آنی بدون تاخیر فیلترشکن</span>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111622] dark:text-white hover:underline underline-offset-4"
            >
              <span>تست همین سناریو در چت‌باکس</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- 3. Bento Grid: Visual Features (Rich Content) ---------------- */}
      <section id="models" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[#e2e5eb] dark:border-[#1e2433]">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: Multi-Model Flagship (Double Column) */}
          <div className="md:col-span-2 rounded-2xl p-6 sm:p-7 bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#eef1f6] dark:bg-[#181d2a] flex items-center justify-center text-[#111622] dark:text-white mb-4">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-[#0f1420] dark:text-white mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
                دسترسی همزمان به برترین مدل‌های جهان
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
                سوییچ آسان میان Claude 3.5 Sonnet، GPT-4o، Google Gemini 2.0 و DeepSeek-V3. با قابلیت سوییچ هوشمند، سیستم به طور خودکار نوع سوال شما را تشخیص داده و کار را به خبره‌ترین مدل واگذار می‌کند.
              </p>
            </div>
            {/* Visual Model Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-[#e6e9f0] dark:border-[#1b202e]">
              <div className="p-3 rounded-xl bg-[#f8f9fb] dark:bg-[#131722] border border-[#e2e5eb] dark:border-[#1b202e] text-center">
                <span className="block font-bold text-xs text-[#0f1420] dark:text-white">Claude 3.5</span>
                <span className="text-[10px] text-[#717b91]">استاد نگارش و ادبیات</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f9fb] dark:bg-[#131722] border border-[#e2e5eb] dark:border-[#1b202e] text-center">
                <span className="block font-bold text-xs text-[#0f1420] dark:text-white">GPT-4o</span>
                <span className="text-[10px] text-[#717b91]">پرچم‌دار همه‌کاره</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f9fb] dark:bg-[#131722] border border-[#e2e5eb] dark:border-[#1b202e] text-center">
                <span className="block font-bold text-xs text-[#0f1420] dark:text-white">Gemini 2.0</span>
                <span className="text-[10px] text-[#717b91]">تحلیل چندرسانه‌ای و سرعت</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f9fb] dark:bg-[#131722] border border-[#e2e5eb] dark:border-[#1b202e] text-center">
                <span className="block font-bold text-xs text-[#0f1420] dark:text-white">DeepSeek V3</span>
                <span className="text-[10px] text-[#717b91]">کدنویسی و ریاضیات عمیق</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: No VPN & Shetab Banking */}
          <div className="rounded-2xl p-6 sm:p-7 bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#eef1f6] dark:bg-[#181d2a] flex items-center justify-center text-[#10b981] mb-4">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-[#0f1420] dark:text-white mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
                بدون فیلترشکن و پرداخت ریالی
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                بدون نیاز به ویزاکارت یا نگرانی از قطع شدن ارتباط؛ با کلیه کارت‌های عضو شتاب کیف پول خود را شارژ کنید و فقط به اندازه مصرف کلمات هزینه بپردازید.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e6e9f0] dark:border-[#1b202e]">
              <span className="text-xs font-semibold text-[#10b981] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتبار خریداری‌شده هرگز منقضی نمی‌شود</span>
              </span>
            </div>
          </div>

          {/* Bento Card 3: Deep Document Analysis */}
          <div className="rounded-2xl p-6 sm:p-7 bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#eef1f6] dark:bg-[#181d2a] flex items-center justify-center text-[#111622] dark:text-white mb-4">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-[#0f1420] dark:text-white mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
                تحلیل اسناد و فایل‌های سنگین
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed">
                آپلود مستقیم کتاب‌ها و مقالات علمی PDF تا سقف ۵۰ مگابایت، فایل‌های کدنویسی و فایل‌های اکسل جهت تلخیص، استخراج اطلاعات و پرسش و پاسخ.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e6e9f0] dark:border-[#1b202e] text-[11px] text-[#717b91]">
              پشتیبانی از PDF، کدهای برنامه‌نویسی و اسناد متنی
            </div>
          </div>

          {/* Bento Card 4: High-End Image Studio Showcase (Double Column) */}
          <div className="md:col-span-2 rounded-2xl p-6 sm:p-7 bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#eef1f6] dark:bg-[#181d2a] flex items-center justify-center text-[#111622] dark:text-white mb-4">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-[#0f1420] dark:text-white mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
                استودیوی تصویرساز هایپررئال با زبان فارسی
              </h3>
              <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc] leading-relaxed mb-6">
                ایده‌ها و توصیف‌های خود را به زبان فارسی بنویسید؛ سیستم پرامپت شما را از نظر هنری و نورپردازی بهینه نموده و با موتورهای پیشرفته Flux تصاویری با وضوح 8K تحویل می‌دهد.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e6e9f0] dark:border-[#1b202e]">
              <span className="text-xs text-[#717b91]">خلق آثار سینمایی، معماری، پرتره و حیات‌وحش</span>
              <a href="#gallery" className="text-xs font-bold text-[#111622] dark:text-white hover:underline">
                مشاهده ۶ شاهکار گالری زیر ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 4. Hyperrealistic Image Gallery Showcase ---------------- */}
      <section id="gallery" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[#e2e5eb] dark:border-[#1e2433]">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <span className="text-xs font-bold text-[#717b91] uppercase tracking-widest block mb-1">
              AI IMAGE STUDIO SHOWCASE
            </span>
            <h2
              className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight"
              style={{ fontFamily: "'Estedad', sans-serif" }}
            >
              آثار تولیدشده در استودیوی تصویرساز
            </h2>
          </div>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111622] dark:text-white hover:underline underline-offset-4"
          >
            <span>ورود به استودیو و تولید اثر جدید</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 Real High-Res Gallery Images with English Prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-square overflow-hidden bg-[#eef1f6] dark:bg-[#151923]">
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#0a0c10]/80 text-white text-[10px] font-semibold backdrop-blur-xs">
                  {img.tag}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1420] dark:text-white mb-1.5" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {img.title}
                  </h3>
                  <p className="text-[11px] text-[#525d75] dark:text-[#9aa5bc] line-clamp-2 leading-relaxed font-mono" dir="ltr">
                    {img.prompt}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e6e9f0] dark:border-[#1b202e] flex items-center justify-between">
                  <button
                    onClick={() => copyPromptToClipboard(img.prompt, idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#525d75] dark:text-[#9aa5bc] hover:text-[#111622] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedPromptIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        <span className="text-[#10b981] font-bold">پرامپت کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی پرامپت انگلیسی</span>
                      </>
                    )}
                  </button>

                  <Link to="/chat" className="text-[11px] font-bold text-[#111622] dark:text-white hover:underline">
                    تست این استایل
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 5. Transparent Hybrid Pricing Section (No Gradient) ---------------- */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[#e2e5eb] dark:border-[#1e2433]">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-[#717b91] uppercase tracking-widest block mb-1">
            TRANSPARENT PRICING
          </span>
          <h2
            className="text-2xl sm:text-4xl font-black text-[#0f1420] dark:text-white tracking-tight mb-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            تعرفه‌ها بر اساس تومان و سهمیه توکن
          </h2>
          <p className="text-xs sm:text-sm text-[#525d75] dark:text-[#9aa5bc]">
            بدون کسر ماهانه خودکار و بدون هزینه‌های مخفی. هر بسته مستقیماً به کیف پول شما اضافه می‌شود و تاریخ انقضا ندارد.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
                pkg.isPopular
                  ? 'bg-[#111622] text-white dark:bg-white dark:text-[#0a0c10] shadow-md border-2 border-[#111622] dark:border-white'
                  : 'bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] text-[#111622] dark:text-white shadow-xs'
              }`}
            >
              <div>
                <div className="mb-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      pkg.isPopular
                        ? 'bg-white/10 text-white dark:bg-[#0a0c10]/10 dark:text-[#0a0c10]'
                        : 'bg-[#eef1f6] dark:bg-[#181d2a] text-[#525d75] dark:text-[#9aa5bc]'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Estedad', sans-serif" }}>
                  {pkg.title}
                </h3>

                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {pkg.price}
                  </span>
                  {pkg.rawPrice > 0 && <span className="text-xs font-normal opacity-70">تومان</span>}
                </div>

                {/* Token / Messages Box */}
                <div
                  className={`p-3 rounded-xl mb-4 text-xs space-y-1 ${
                    pkg.isPopular
                      ? 'bg-white/10 dark:bg-[#0a0c10]/5'
                      : 'bg-[#f8f9fb] dark:bg-[#131722] text-[#333c4e] dark:text-[#ccd3e0]'
                  }`}
                >
                  <div className="font-bold" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {pkg.tokenEstimate}
                  </div>
                  <div className="text-[11px] opacity-80">{pkg.messagesCount}</div>
                </div>

                <p className="text-xs opacity-80 leading-relaxed mb-6">{pkg.desc}</p>

                <ul className="space-y-2.5 text-xs mb-8">
                  {pkg.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${pkg.isPopular ? 'text-[#10b981]' : 'text-[#10b981]'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={pkg.ctaAction}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  pkg.isPopular
                    ? 'bg-white text-[#0a0c10] hover:bg-[#eef1f6] dark:bg-[#0a0c10] dark:text-white dark:hover:bg-[#1a202d]'
                    : 'bg-[#111622] hover:bg-[#1f273b] text-white dark:bg-white dark:hover:bg-[#e4e7ee] dark:text-[#0a0c10]'
                }`}
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                {pkg.ctaText}
              </button>
            </div>
          ))}
        </div>

        {/* Security & Instant Credit Note */}
        <div className="mt-8 p-4 rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#525d75] dark:text-[#9aa5bc]">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>شارژ آنی کیف پول بلافاصله پس از پرداخت شتاب</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <CreditCard className="w-4 h-4 text-[#717b91]" />
            <span>تسویه امن با درگاه‌های رسمی بانکی شاپرک</span>
          </div>
        </div>
      </section>

      {/* ---------------- 6. Extensive FAQ Section (10 Rich Questions) ---------------- */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-[#e2e5eb] dark:border-[#1e2433]">
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

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                className="rounded-xl bg-white dark:bg-[#0f121a] border border-[#d8dce6] dark:border-[#1e2433] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f8f9fb] dark:hover:bg-[#131722] transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#0f1420] dark:text-white" style={{ fontFamily: "'Estedad', sans-serif" }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#717b91] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0f1420] dark:text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-[#525d75] dark:text-[#9aa5bc] leading-relaxed border-t border-[#e6e9f0] dark:border-[#1b202e]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- 7. Final Call to Action ---------------- */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="rounded-2xl p-8 sm:p-12 bg-[#111622] dark:bg-white text-white dark:text-[#0a0c10] shadow-xl">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "'Estedad', sans-serif" }}>
              همین حالا با {toPersianDigits('50,000')} تومان هدیه شروع کنید
            </h2>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
              ثبت‌نام در کمتر از ۳۰ ثانیه بدون نیاز به وارد کردن کارت بانکی؛ بلافاصله وارد محیط چت شوید و لذت کار با برترین مدل‌های جهان را تجربه کنید.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/chat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0a0c10] hover:bg-[#eef1f6] dark:bg-[#0a0c10] dark:text-white dark:hover:bg-[#1a202d] font-bold text-sm shadow-sm transition-all"
                style={{ fontFamily: "'Estedad', sans-serif" }}
              >
                <span>ورود به محیط چت</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/store"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 dark:border-[#0a0c10]/20 hover:bg-white/10 dark:hover:bg-[#0a0c10]/10 text-inherit font-bold text-sm transition-all"
              >
                <Store className="w-4 h-4" />
                <span>مشاهده فروشگاه</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 8. Footer Component ---------------- */}
      <Footer />
    </div>
  );
};
