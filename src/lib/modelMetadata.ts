import { ModelDetails } from '../components/CustomProviderCards';

export interface ModelIntro {
  title: string;
  bio: string;
  highlight: string;
}

export const getModelIntro = (modelName: string, details: ModelDetails): ModelIntro => {
  const lower = modelName.toLowerCase();
  if (lower.includes('lfm') || lower.includes('liquid')) {
    return {
      title: 'مدل نوین چندوجهی LFM (Liquid Foundation Model)',
      bio: 'من مدل هوشمند LFM از شرکت Liquid AI هستم. برای پردازش سریع، انجام محاسبات پویا و عملکرد بهینه در طیف گسترده‌ای از وظایف طراحی شده‌ام.',
      highlight: 'پاسخ‌دهی سریع و چندمنظوره',
    };
  }
  if (lower.includes('r1') || (details.isReasoning && lower.includes('deepseek'))) {
    return {
      title: 'مدل استدلال عمیق DeepSeek R1',
      bio: 'من مدل تخصصی استدلال DeepSeek R1 هستم. با استفاده از زنجیره تفکر گام‌به‌گام (Chain of Thought)، در حل مسائل پیچیده ریاضی، الگوریتم‌های سنگین و منطق عمیق تخصص دارم.',
      highlight: 'استدلال عمیق و منطق پیشرفته',
    };
  }
  if (lower.includes('deepseek') || lower.includes('v3')) {
    return {
      title: 'دستیار همه‌منظوره DeepSeek V3',
      bio: 'من مدل پرچمدار DeepSeek V3 هستم؛ دارای تخصص بالا در برنامه‌نویسی، نگارش متون روان فارسی و پاسخ‌دهی به پرسش‌های علمی و عمومی.',
      highlight: 'برنامه‌نویسی و دانش جامع',
    };
  }
  if (lower.includes('sonnet') || lower.includes('claude-3-5') || lower.includes('claude-3.5') || lower.includes('claude-3.7')) {
    return {
      title: 'دستیار ارشد Claude (Anthropic)',
      bio: 'من مدل Claude هستم؛ با درک عمیق ادبیات فارسی، توانایی استثنایی در کدنویسی، تحلیل اسناد و فایل‌های تصویری در خدمت شما هستم.',
      highlight: 'نگارش عالی و تحلیل عمیق',
    };
  }
  if (lower.includes('gpt-4o') || lower.includes('chatgpt') || lower.includes('gpt-5') || lower.includes('o3') || lower.includes('o1')) {
    return {
      title: 'مدل هوشمند پیشرفته OpenAI',
      bio: 'من مدل هوش مصنوعی چندوجهی OpenAI هستم؛ بهینه‌سازی‌شده برای تولید کد، حل مسئله، خلاصه‌سازی و درک متن و تصویر.',
      highlight: 'چندوجهی و حل مسئله',
    };
  }
  if (lower.includes('qwen') && (lower.includes('coder') || details.isCoding)) {
    return {
      title: 'توسعه‌دهنده تخصصی Qwen Coder',
      bio: 'من مدل Qwen Coder هستم؛ آموزش‌دیده بر روی تریلیون‌ها خط کد جهت معماری، ریفکتورینگ و حل چالش‌های برنامه‌نویسی در تمامی زبان‌ها.',
      highlight: 'برنامه‌نویسی اختصاصی و دیباگ',
    };
  }
  if (lower.includes('llama')) {
    return {
      title: 'مدل متن‌باز قدرتمند Meta Llama 3',
      bio: 'من مدل متن‌باز Llama از شرکت Meta هستم؛ توانمند در مکالمه طبیعی، درک زبان فارسی و پاسخگویی به گستره وسیعی از موضوعات.',
      highlight: 'زبان طبیعی و درک مفهومی',
    };
  }
  if (lower.includes('gemini') || lower.includes('gemma')) {
    return {
      title: 'مدل نسل جدید Google Gemini',
      bio: 'من مدل چندوجهی Google Gemini هستم؛ مجهز به حافظه طولانی، درک سریع چندرسانه‌ای و سرعت تولید بالا.',
      highlight: 'حافظه وسیع و سرعت بالا',
    };
  }

  return {
    title: details.providerLabel || modelName || 'دستیار هوش مصنوعی',
    bio: details.description || 'آماده پاسخگویی به سوالات، تحلیل متون، کدنویسی و پردازش درخواست‌های شما به زبان فارسی.',
    highlight: details.tags?.[0]?.label || 'پاسخ‌دهی همه‌منظوره',
  };
};
