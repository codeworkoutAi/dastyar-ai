import React, { useState, useMemo } from 'react';
import { AddOutlineIcon, PenOutlineIcon, TrashBinMinimalisticOutlineIcon, LinkOutlineIcon, KeyMinimalisticOutlineIcon, RefreshOutlineIcon, ChartOutlineIcon, MagnifierOutlineIcon, DownloadOutlineIcon, BrainOutlineIcon, StarOutlineIcon, CodeOutlineIcon, EyeOutlineIcon, BoltOutlineIcon, StarsOutlineIcon, DocumentTextOutlineIcon, LayersOutlineIcon, CopyOutlineIcon } from '@solar-icons/react';
import { AppSettings, CustomProfile } from '../types';

export interface ModelCapabilityTag {
 label: string;
 type: 'coding' | 'reasoning' | 'vision' | 'fast' | 'creative' | 'free' | 'chat';
}

export interface ModelDetails {
 providerLabel: string;
 isFree: boolean;
 isRecommended: boolean;
 isCoding: boolean;
 isReasoning: boolean;
 isVision: boolean;
 isFast: boolean;
 isCreative: boolean;
 contextFormatted: string | null;
 description: string;
 tags: ModelCapabilityTag[];
}

export const getModelDetails = (m: { id: string; name?: string; isFree?: boolean; isVision?: boolean; isCoding?: boolean;
 isReasoning?: boolean;
 isFast?: boolean;
 contextLength?: number | null;
 description?: string;
}): ModelDetails => {
 const idLower = (m.id || '').toLowerCase();
 const nameLower = (m.name || '').toLowerCase();
 const combined = `${idLower} ${nameLower}`;

 // 1. Is Free?
 const isFree =
 m.isFree === true ||
 combined.includes(':free') ||
 combined.includes('/free') ||
 combined.includes('free') ||
 combined.includes('رایگان');

 // 2. Provider Detection
 let providerLabel = 'سایر';
 if (combined.includes('claude') || combined.includes('anthropic')) {
 providerLabel = 'Anthropic';
 } else if (combined.includes('gpt') || combined.includes('openai') || combined.includes('o1') || combined.includes('o3') || combined.includes('o4') || combined.includes('chatgpt')) {
 providerLabel = 'OpenAI';
 } else if (combined.includes('gemini') || combined.includes('gemma') || combined.includes('google')) {
 providerLabel = 'Google';
 } else if (combined.includes('deepseek')) {
 providerLabel = 'DeepSeek';
 } else if (combined.includes('qwen') || combined.includes('qwq') || combined.includes('alibaba')) {
 providerLabel = 'Alibaba Qwen';
 } else if (combined.includes('mistral') || combined.includes('codestral') || combined.includes('pixtral') || combined.includes('devstral') || combined.includes('ministral')) {
 providerLabel = 'Mistral';
 } else if (combined.includes('llama') || combined.includes('meta')) {
 providerLabel = 'Meta';
 } else if (combined.includes('grok') || combined.includes('xai')) {
 providerLabel = 'xAI';
 } else if (combined.includes('glm') || combined.includes('zhipu') || combined.includes('chatglm')) {
 providerLabel = 'Zhipu AI';
 } else if (combined.includes('kimi') || combined.includes('moonshot')) {
 providerLabel = 'Moonshot Kimi';
 } else if (m.id && m.id.includes('/')) {
 const p = m.id.split('/')[0];
 providerLabel = p.charAt(0).toUpperCase() + p.slice(1);
 }

 // 3. Coding Detection (SOTA Champions + Dedicated Code Models)
 const isSonnet = combined.includes('sonnet');
 const isOpus = combined.includes('opus');
 const isClaudeGeneral = combined.includes('claude');
 const isGpt4OrBetter = combined.includes('gpt-4') || combined.includes('gpt-5') || combined.includes('o1') || combined.includes('o3') || combined.includes('o4');
 const isDeepSeekMajor = combined.includes('deepseek-r1') || combined.includes('deepseek-v3') || combined.includes('deepseek-chat') || combined.includes('deepseek-coder');
 const isQwenCoder = combined.includes('qwen') && (combined.includes('coder') || combined.includes('72b') || combined.includes('32b') || combined.includes('qwq'));
 const isMistralCode = combined.includes('codestral') || combined.includes('devstral') || combined.includes('large');
 const isLlamaMajor = combined.includes('llama') && (combined.includes('405b') || combined.includes('70b') || combined.includes('code'));
 const isGeminiPro = combined.includes('gemini') && (combined.includes('pro') || combined.includes('exp') || combined.includes('thinking'));

 const isCoding = Boolean(
 m.isCoding === true ||
 combined.includes('coder') ||
 combined.includes('code') ||
 combined.includes('starcoder') ||
 combined.includes('dev') ||
 isSonnet ||
 isOpus ||
 isGpt4OrBetter ||
 isDeepSeekMajor ||
 isQwenCoder ||
 isMistralCode ||
 isLlamaMajor ||
 isGeminiPro
 );

 // 4. Reasoning & Deep Logic Detection
 const isReasoning = Boolean(
 m.isReasoning === true ||
 combined.includes('deepseek-r1') ||
 combined.includes('r1') ||
 combined.includes('o1') ||
 combined.includes('o3') ||
 combined.includes('o4') ||
 combined.includes('reasoner') ||
 combined.includes('reasoning') ||
 combined.includes('qwq') ||
 combined.includes('thinking') ||
 combined.includes('thought') ||
 combined.includes('grok-3-think') ||
 combined.includes('kimi-k1.5') ||
 combined.includes('kimi-k2') ||
 isOpus
 );

 // 5. Vision / Multimodal Detection
 const isVision = Boolean(
 m.isVision === true ||
 isClaudeGeneral ||
 combined.includes('gpt-4o') ||
 combined.includes('gpt-4-turbo') ||
 combined.includes('gpt-4.5') ||
 combined.includes('gpt-5') ||
 combined.includes('gemini') ||
 combined.includes('vision') ||
 combined.includes('-vl') ||
 combined.includes('vl-') ||
 combined.includes('pixtral') ||
 combined.includes('llava') ||
 combined.includes('internvl') ||
 combined.includes('omni') ||
 combined.includes('glm-4v') ||
 combined.includes('minicpm-v') ||
 combined.includes('multimodal')
 );

 // 6. Fast & Lightweight Detection
 const isFast = Boolean(
 m.isFast === true ||
 combined.includes('haiku') ||
 combined.includes('flash') ||
 combined.includes('mini') ||
 combined.includes('lite') ||
 combined.includes('turbo') ||
 combined.includes('8b') ||
 combined.includes('7b') ||
 combined.includes('3b') ||
 combined.includes('1.5b') ||
 combined.includes('small') ||
 combined.includes('nemo') ||
 combined.includes('ministral')
 );

 // 7. Creative Writing / Narrative
 const isCreative = Boolean(
 combined.includes('fable') ||
 combined.includes('creative') ||
 combined.includes('story') ||
 combined.includes('novel') ||
 combined.includes('roleplay') ||
 combined.includes('wizard')
 );

 // 8. Recommended Flag
 const isRecommended = Boolean(
 isSonnet ||
 isOpus ||
 combined.includes('gpt-4o') ||
 combined.includes('gpt-5') ||
 combined.includes('o1') ||
 combined.includes('o3') ||
 combined.includes('deepseek-r1') ||
 combined.includes('deepseek-v3') ||
 combined.includes('gemini-1.5-pro') ||
 combined.includes('gemini-2.0-flash') ||
 combined.includes('gemini-2.5-pro') ||
 combined.includes('qwen-2.5-coder') ||
 combined.includes('qwen-2.5-72b') ||
 combined.includes('codestral')
 );

 // 9. Context Length Formatting
 let contextFormatted: string | null = null;
 if (m.contextLength) {
 if (m.contextLength >= 1000000) {
 contextFormatted = `${(m.contextLength / 1000000).toFixed(0)}M`;
 } else if (m.contextLength >= 1000) {
 contextFormatted = `${Math.round(m.contextLength / 1000)}K`;
 }
 } else if (combined.includes('gemini-1.5') || combined.includes('gemini-2.0') || combined.includes('gemini-2.5') || combined.includes('sonnet-5')) {
 contextFormatted = '1M-2M';
 } else if (combined.includes('claude-3-5') || combined.includes('claude-3.5') || combined.includes('claude-3-7') || combined.includes('claude-4') || combined.includes('opus')) {
 contextFormatted = '200K';
 } else if (combined.includes('gpt-4o') || combined.includes('gpt-5') || combined.includes('o1') || combined.includes('o3') || combined.includes('llama-3.1') || combined.includes('llama-3.3') || combined.includes('deepseek')) {
 contextFormatted = '128K';
 }

 // 10. Accurate Persian Model Descriptions
 let description = 'پاسخگویی به سوالات، ترجمه و تولید متن روان';

 if (isSonnet) {
 description = 'قهرمان بلامنازع جهان در برنامه‌نویسی، معماری کد و حل مسائل مهندسی همراه با درک تصویر';
 } else if (isOpus) {
 description = 'قدرتمندترین مدل آنتروپیک برای استدلال عمیق دانشگاهی، تحلیل پیچیده و کدنویسی پیشرفته';
 } else if (combined.includes('haiku')) {
 description = 'فوق‌العاده پرسرعت و سبک، بهینه برای مکالمات روزمره، خلاصه‌سازی و چت بلادرنگ';
 } else if (combined.includes('fable')) {
 description = 'تخصصی برای نگارش خلاق، داستان‌نویسی روان و تولید محتوای داستانی با لحن غنی';
 } else if (combined.includes('o1') || combined.includes('o3') || combined.includes('o4')) {
 description = 'تفکر عمیق گام‌به‌گام (Chain-of-Thought)، سرآمد در المپیادهای ریاضی، الگوریتم و منطق';
 } else if (combined.includes('gpt-4o') || combined.includes('gpt-4.5') || combined.includes('gpt-5')) {
 description = 'مدل همه‌کاره پرچم‌دار OpenAI، بسیار قدرتمند در برنامه‌نویسی، تحلیل چندوجهی و ابزارها';
 } else if (combined.includes('gpt-4o-mini') || combined.includes('gpt-3.5')) {
 description = 'مدل سریع، سبک و اقتصادی برای کارهای روزمره و مکالمات عمومی';
 } else if (combined.includes('deepseek-r1')) {
 description = 'مدل انقلابی با قدرت استدلال باز و زنجیره تفکر دقیق در ریاضی، منطق و برنامه‌نویسی';
 } else if (combined.includes('deepseek-v3') || combined.includes('deepseek-chat')) {
 description = 'مدل 671B پرچم‌دار با سرعت بسیار بالا، ارزان‌قیمت و توان عالی در برنامه‌نویسی و گفتگو';
 } else if (combined.includes('deepseek-coder') || combined.includes('codestral') || combined.includes('devstral') || combined.includes('qwen-coder') || combined.includes('qwen-2.5-coder')) {
 description = 'تخصصی تولید، بازنویسی، تست خودکار و رفع خطای کد در ده‌ها زبان برنامه‌نویسی';
 } else if (combined.includes('qwq')) {
 description = 'مدل استدلالی بازمتن علی‌بابا برای حل مسائل پیچیده منطقی و محاسباتی';
 } else if (combined.includes('qwen-2.5-vl') || combined.includes('pixtral') || combined.includes('llava')) {
 description = 'بینایی پیشرفته و درک عمیق تصاویر، نمودارهای آماری، جدول‌ها و اسناد فنی';
 } else if (combined.includes('qwen-2.5') || combined.includes('qwen2.5')) {
 description = 'تسلط فوق‌العاده بر زبان فارسی، دانش دانشنامه‌ای عمیق و پاسخ‌های جامع و طبیعی';
 } else if (combined.includes('gemini-1.5-pro') || combined.includes('gemini-2.0-pro') || combined.includes('gemini-2.5-pro')) {
 description = 'پنجره زمینه عظیم (تا ۲ میلیون توکن)، تحلیل چندوجهی اسناد و ویدیو و کدنویسی سازمانی';
 } else if (combined.includes('gemini') && (combined.includes('flash') || combined.includes('thinking'))) {
 description = 'سرعت فوق‌العاده بالا، درک همزمان تصویر و صوت، همراه با تفکر استدلالی پویا';
 } else if (combined.includes('llama-3.1-405b') || combined.includes('llama-3.3-70b') || combined.includes('llama-3.1-70b')) {
 description = 'قدرتمندترین غول بازمتن دنیا با حافظه ۱۲۸K، توان کدنویسی بالا و دانش گسترده';
 } else if (combined.includes('grok')) {
 description = 'مدل پرچم‌دار xAI با هوش تحلیلی بالا، درک داده‌های بلادرنگ و کدنویسی ممتاز';
 } else if (combined.includes('glm')) {
 description = 'مدل پیشرفته Zhipu AI با درک چندزبانه عالی، مهارت‌های چندوجهی و تحلیل متنی قوی';
 } else if (isReasoning) {
 description = 'تفکر عمیق تحلیلی، حل مسائل منطقی و محاسبات مرحله‌به‌مرحله';
 } else if (isCoding) {
 description = 'تولید، معماری، بررسی و اشکال‌زدایی کدهای نرم‌افزاری تخصصی';
 } else if (isVision) {
 description = 'تحلیل و درک چندوجهی تصاویر، اسناد، دیاگرام‌ها و متن';
 } else if (isFast) {
 description = 'فوق‌العاده سریع و بهینه برای پردازش بلادرنگ و مکالمه سبک';
 }

 // 11. Build Visual Tags List
 const tags: ModelCapabilityTag[] = [];

 if (isCoding) {
 tags.push({ label: 'برنامه‌نویسی', type: 'coding' });
 }
 if (isReasoning) {
 tags.push({ label: 'استدلالی', type: 'reasoning' });
 }
 if (isVision) {
 tags.push({ label: 'دیداری', type: 'vision' });
 }
 if (isFast) {
 tags.push({ label: 'فوق‌سریع', type: 'fast' });
 }
 if (isCreative) {
 tags.push({ label: 'نگارش خلاق', type: 'creative' });
 }
 if (tags.length === 0) {
 tags.push({ label: 'متنی / عمومی', type: 'chat' });
 }

 return {
 providerLabel,
 isFree,
 isRecommended,
 isCoding,
 isReasoning,
 isVision,
 isFast,
 isCreative,
 contextFormatted,
 description,
 tags,
 };
};

interface CustomProviderCardsProps {
 tempSettings: AppSettings;
 setTempSettings: (settings: AppSettings) => void;
 cachedModels: {
 id: string; name?: string; isFree?: boolean; provider?: string; isVision?: boolean; isCoding?: boolean;
 isReasoning?: boolean;
 isFast?: boolean;
 contextLength?: number | null;
 description?: string;
 }[];
 fetchingModels: boolean;
 handleFetchModels: (overrideConfig?: any) => Promise<void>;
 fetchError?: string | null;
}

export const CustomProviderCards: React.FC<CustomProviderCardsProps> = ({
 tempSettings,
 setTempSettings,
 cachedModels,
 fetchingModels,
 handleFetchModels,
 fetchError,
}) => {
 const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
 const [showFetchedList, setShowFetchedList] = useState(false);
 const [modelSearchQuery, setModelSearchQuery] = useState('');
 const [filterProvider, setFilterProvider] = useState<string>('all');
 const [activeTag, setActiveTag] = useState<'all' | 'coding' | 'vision' | 'reasoning' | 'fast' | 'free'>('all');

 const PROVIDER_CATEGORIES = [
 { id: 'all', label: 'همه سازندگان' },
 { id: 'anthropic', label: 'Anthropic (کلود)' },
 { id: 'openai', label: 'OpenAI (GPT/o-series)' },
 { id: 'deepseek', label: 'DeepSeek' },
 { id: 'google', label: 'Google (Gemini)' },
 { id: 'qwen', label: 'Alibaba Qwen' },
 { id: 'mistral', label: 'Mistral AI' },
 { id: 'meta', label: 'Meta (Llama)' },
 { id: 'xai', label: 'xAI (Grok)' },
 { id: 'zhipu', label: 'Zhipu AI (GLM)' },
 { id: 'other', label: 'سایر ارائه‌دهندگان' }
 ];

 const getProviderType = (m: { id: string; name?: string; provider?: string }) => {
 const meta = getModelDetails(m);
 const p = meta.providerLabel.toLowerCase();
 if (p.includes('anthropic')) return 'anthropic';
 if (p.includes('openai')) return 'openai';
 if (p.includes('deepseek')) return 'deepseek';
 if (p.includes('google')) return 'google';
 if (p.includes('qwen') || p.includes('alibaba')) return 'qwen';
 if (p.includes('mistral')) return 'mistral';
 if (p.includes('meta')) return 'meta';
 if (p.includes('xai') || p.includes('grok')) return 'xai';
 if (p.includes('zhipu') || p.includes('glm')) return 'zhipu';
 return 'other';
 };

 const tagCounts = useMemo(() => {
 let all = 0, coding = 0, vision = 0, reasoning = 0, fast = 0, free = 0;
 cachedModels.forEach(m => {
 all++;
 const meta = getModelDetails(m);
 if (meta.isFree) free++;
 if (meta.isCoding) coding++;
 if (meta.isVision) vision++;
 if (meta.isReasoning) reasoning++;
 if (meta.isFast) fast++;
 });
 return { all, coding, vision, reasoning, fast, free };
 }, [cachedModels]);

 const providerCounts = useMemo(() => {
 const counts: Record<string, number> = {
 all: 0, anthropic: 0, openai: 0, deepseek: 0, google: 0, qwen: 0, mistral: 0, meta: 0, xai: 0, zhipu: 0, other: 0
 };

 const searchStr = modelSearchQuery.toLowerCase();
 cachedModels
 .filter(m => (m.id + (m.name || '')).toLowerCase().includes(searchStr))
 .forEach(m => {
 counts.all++;
 const detectedProv = getProviderType(m);
 if (counts[detectedProv] !== undefined) {
 counts[detectedProv]++;
 } else {
 counts.other++;
 }
 });

 return counts;
 }, [cachedModels, modelSearchQuery]);

 const customConfig = tempSettings.providers.custom;
 const profiles = customConfig.profiles || [];
 const activeProfileId = customConfig.activeProfileId || profiles[0]?.id;

 const handleCreateNew = () => {
 const newId = 'profile-' + Date.now().toString(36);
 const newProfile: CustomProfile = {
 id: newId,
 name: 'پروفایل جدید',
 baseUrl: '',
 apiKey: '',
 modelName: '',
 customHeaders: '',
 };
 setTempSettings({
 ...tempSettings,
 providers: {
 ...tempSettings.providers,
 custom: {
 ...customConfig,
 profiles: [...profiles, newProfile],
 activeProfileId: profiles.length === 0 ? newId : activeProfileId
 }
 }
 });
 setEditingProfileId(newId);
 };

 const handleUpdateProfile = (id: string, updates: Partial<CustomProfile>) => {
 setTempSettings({
 ...tempSettings,
 providers: {
 ...tempSettings.providers,
 custom: {
 ...customConfig,
 profiles: profiles.map(p => p.id === id ? { ...p, ...updates } : p),
 ...(id === activeProfileId ? updates : {})
 }
 }
 });
 };

 const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 if (!confirm('آیا از حذف این پروفایل اطمینان دارید؟')) return;
 const filtered = profiles.filter(p => p.id !== id);
 const newActiveId = activeProfileId === id ? (filtered[0]?.id || '') : activeProfileId;
 const syncUpdates = activeProfileId === id && filtered.length > 0
 ? { baseUrl: filtered[0].baseUrl, apiKey: filtered[0].apiKey, modelName: filtered[0].modelName, customHeaders: filtered[0].customHeaders }
 : (activeProfileId === id ? { baseUrl: '', apiKey: '', modelName: '', customHeaders: '' } : {});

 setTempSettings({
 ...tempSettings,
 providers: {
 ...tempSettings.providers,
 custom: {
 ...customConfig,
 profiles: filtered,
 activeProfileId: newActiveId,
 ...syncUpdates
 }
 }
 });
 };

 const handleDuplicateProfile = (profile: CustomProfile, e: React.MouseEvent) => {
 e.stopPropagation();
 const newId = 'profile-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
 let baseName = profile.name || 'پروفایل';
 let newName = '';
 const copyMatch = baseName.match(/(.*?) \(کپی(?: (\d+))?\)$/);
 if (copyMatch) {
 baseName = copyMatch[1];
 const count = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
 newName = `${baseName} (کپی ${count})`;
 } else {
 newName = `${baseName} (کپی)`;
 }

 const newProfile: CustomProfile = {
 ...profile,
 id: newId,
 name: newName,
 };
 setTempSettings({
 ...tempSettings,
 providers: {
 ...tempSettings.providers,
 custom: {
 ...customConfig,
 profiles: [...profiles, newProfile],
 activeProfileId: activeProfileId
 }
 }
 });
 setEditingProfileId(newId);
 };

 const handleSelectActive = (id: string) => {
 const p = profiles.find(x => x.id === id);
 if (!p) return;
 setTempSettings({
 ...tempSettings,
 providers: {
 ...tempSettings.providers,
 custom: {
 ...customConfig,
 activeProfileId: id,
 baseUrl: p.baseUrl,
 apiKey: p.apiKey,
 modelName: p.modelName,
 customHeaders: p.customHeaders
 }
 }
 });
 };

 const editingProfile = profiles.find(p => p.id === editingProfileId);

 const handleExportModels = () => {
 if (cachedModels.length === 0) return;
 const textContent = cachedModels.map((m, i) => {
 const meta = getModelDetails(m);
 return `${i + 1}. ${m.name || m.id}\n شناسه: ${m.id}\n سازنده: ${meta.providerLabel}\n قابلیت‌ها: ${meta.tags.map(t => t.label).join('، ')}\n رایگان: ${meta.isFree ? 'بله' : 'خیر'}\n توضیح: ${meta.description}`;
 }).join('\n\n----------------------------------------\n\n');

 const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `ai-models-list-${new Date().toISOString().split('T')[0]}.txt`;
 a.click();
 URL.revokeObjectURL(url);
 };

 const filteredModelsList = useMemo(() => {
 let list = cachedModels.filter(m => {
 const meta = getModelDetails(m);

 // 1. Search query
 if (modelSearchQuery.trim()) {
 const q = modelSearchQuery.toLowerCase().trim();
 const matchesId = (m.id || '').toLowerCase().includes(q);
 const matchesName = (m.name || '').toLowerCase().includes(q);
 const matchesProv = meta.providerLabel.toLowerCase().includes(q);
 const matchesDesc = meta.description.toLowerCase().includes(q);
 if (!matchesId && !matchesName && !matchesProv && !matchesDesc) return false;
 }

 // 2. Provider dropdown
 if (filterProvider !== 'all') {
 const detectedProv = getProviderType(m);
 if (filterProvider === 'other') {
 const mainProvs = ['anthropic', 'openai', 'deepseek', 'google', 'qwen', 'mistral', 'meta', 'xai', 'zhipu'];
 if (mainProvs.includes(detectedProv)) return false;
 } else if (detectedProv !== filterProvider) {
 return false;
 }
 }

 // 3. Category Tag (Multi-Capability Non-exclusive)
 if (activeTag === 'free') {
 if (!meta.isFree) return false;
 } else if (activeTag === 'coding') {
 if (!meta.isCoding) return false;
 } else if (activeTag === 'vision') {
 if (!meta.isVision) return false;
 } else if (activeTag === 'reasoning') {
 if (!meta.isReasoning) return false;
 } else if (activeTag === 'fast') {
 if (!meta.isFast) return false;
 }

 return true;
 });

 // Stable Sort: Recommended first, then Free first, then Alphabetical
 return list.sort((a, b) => {
 const metaA = getModelDetails(a);
 const metaB = getModelDetails(b);

 if (metaA.isRecommended && !metaB.isRecommended) return -1;
 if (!metaA.isRecommended && metaB.isRecommended) return 1;

 if (metaA.isFree && !metaB.isFree) return -1;
 if (!metaA.isFree && metaB.isFree) return 1;

 const nameA = a.name || a.id || '';
 const nameB = b.name || b.id || '';
 return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
 });
 }, [cachedModels, modelSearchQuery, filterProvider, activeTag]);

 return (
 <div className="space-y-4 w-full">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {profiles.map(profile => {
 const isActive = profile.id === activeProfileId;
 return (
 <div key={profile.id}
 onClick={() => handleSelectActive(profile.id)}
 className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 overflow-hidden group ${
 isActive ? 'bg-blue-50/20  border-blue-500/60 dark:border-blue-500/50 shadow-md ring-1 ring-blue-500/20' : 'clay-modal/70 border-[var(--card-border)]  hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/90'
 }`}
 >
 <div className="flex justify-between items-center mb-2.5">
 <div className="flex items-center gap-2 min-w-0 flex-1 pl-2">
 {isActive && (
 <div className="w-2 h-2 shrink-0 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="پروفایل فعال" />
 )}
 <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate" title={profile.name}>
 {profile.name}
 </h5>
 </div>
 <div className="flex items-center gap-1 shrink-0">
 <button onClick={(e) => { e.stopPropagation(); setEditingProfileId(profile.id); }}
 className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 clay-icon-btn transition-colors"
 title="ویرایش"
 >
 <PenOutlineIcon className="w-3.5 h-3.5" />
 </button>
 <button onClick={(e) => handleDuplicateProfile(profile, e)}
 className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 clay-icon-btn transition-colors"
 title="کپی گرفتن"
 >
 <CopyOutlineIcon className="w-3.5 h-3.5" />
 </button>
 <button onClick={(e) => handleDeleteProfile(profile.id, e)}
 className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
 title="حذف"
 >
 <TrashBinMinimalisticOutlineIcon className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="space-y-2 mt-3 pt-2.5 border-t border-[var(--card-border)] ">
 <div className="flex items-center justify-between gap-2 text-xs">
 <div className="flex items-center gap-1.5 font-mono min-w-0 flex-1">
 <ChartOutlineIcon className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
 <span className="truncate clay-btn-secondary text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[11px]" title={profile.modelName}>
 {profile.modelName || 'بدون مدل'}
 </span>
 </div>
 {profile.isSystemDefault ? (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
 رایگان سیستم
 </span>
 ) : (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 shrink-0">
 شخصی
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate" dir="ltr">
 <LinkOutlineIcon className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
 <span className="truncate text-[10.5px]" title={profile.baseUrl}>
 {profile.baseUrl ? profile.baseUrl.replace(/^https?:\/\//, '') : 'بدون آدرس'}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 <div onClick={handleCreateNew}
 className="cursor-pointer rounded-2xl p-4 border border-dashed border-[var(--card-border)]  hover:border-zinc-600 clay-surface hover:clay-surface transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] text-zinc-700 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"
 >
 <AddOutlineIcon className="w-6 h-6 mb-2" />
 <span className="text-sm font-medium">افزودن ارائه‌دهنده</span>
 </div>
 </div>

 {editingProfile && (
 <div className="mt-4 p-5 rounded-2xl clay-card animate-fadeIn">
 <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--card-border)] ">
 <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
 <PenOutlineIcon className="w-4 h-4 text-blue-500" /> ویرایش پروفایل
 </h5>
 <button onClick={() => setEditingProfileId(null)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1 rounded-lg bg-zinc-200/60  transition-colors">بستن</button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">نام پروفایل</label>
 <input type="text" value={editingProfile.name} onChange={(e) => handleUpdateProfile(editingProfile.id, { name: e.target.value })} className="w-full clay-input rounded-xl py-2 px-3 text-sm focus:border-zinc-500 outline-none transition-all" placeholder="مثال: کلود / اوپن‌ای‌آی سازمانی" />
 </div>
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">آدرس پایه (Base URL)</label>
 <div className="relative">
 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-700 dark:text-zinc-500"><LinkOutlineIcon className="w-4 h-4" /></div>
 <input type="text" dir="ltr" value={editingProfile.baseUrl} onChange={(e) => handleUpdateProfile(editingProfile.id, { baseUrl: e.target.value })} className="w-full clay-input rounded-xl py-2 pr-9 pl-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono" placeholder="https://api.openai.com/v1 یا https://openrouter.ai/api/v1" />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">کلید دسترسی (API Key)</label>
 <div className="relative">
 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-700 dark:text-zinc-500"><KeyMinimalisticOutlineIcon className="w-4 h-4" /></div>
 <input type="password" dir="ltr" value={editingProfile.apiKey} onChange={(e) => handleUpdateProfile(editingProfile.id, { apiKey: e.target.value })} className="w-full clay-input rounded-xl py-2 pr-9 pl-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono" placeholder={editingProfile.isSystemDefault ?"(کلید پیش‌فرض رایگان فعال است - اختیاری)" :"sk-..."} />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">مدل انتخابی (Model)</label>
 <div className="flex gap-2">
 <div className="relative flex-1">
 <input type="text"
 dir="ltr"
 value={editingProfile.modelName} onChange={(e) => handleUpdateProfile(editingProfile.id, { modelName: e.target.value })} className="w-full clay-input rounded-xl py-2 px-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono" placeholder="e.g. anthropic/claude-sonnet-5 or openai/gpt-4o"
 />
 </div>
 <button type="button" onClick={async () => {
 handleSelectActive(editingProfile.id);
 await handleFetchModels(editingProfile);
 setShowFetchedList(true);
 }} disabled={fetchingModels} className="px-3 rounded-xl border border-zinc-300  clay-surface clay-icon-btn text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center shrink-0 min-w-[40px]" title="دریافت لیست هوشمند مدل‌ها از سرور"
 >
 {fetchingModels ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" /> : <RefreshOutlineIcon className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Fetched Models List (Collapsible with Search) */}
 {showFetchedList && (
 <div className="animate-fadeIn clay-card rounded-xl p-3">
 <details className="group" open>
 <summary className="flex items-center justify-between text-xs font-medium text-indigo-400 cursor-pointer select-none outline-none mb-2">
 <span className="flex items-center gap-2">
 <RefreshOutlineIcon className="w-3.5 h-3.5" /> لیست مدل‌های دریافت‌شده ({cachedModels.length})
 </span>
 <div className="flex items-center gap-3">
 <button type="button" onClick={(e) => { e.preventDefault(); handleExportModels(); }}
 disabled={cachedModels.length === 0}
 className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 title="خروجی گرفتن از کل لیست به صورت فایل متنی با مشخصات کامل"
 >
 <DownloadOutlineIcon className="w-3 h-3" /> <span className="text-[10px]">خروجی لیست</span>
 </button>
 <span className="text-zinc-700 dark:text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
 </div>
 </summary>
 <div className="pt-2 border-t border-[var(--card-border)] ">
 <div className="flex flex-col sm:flex-row gap-2 mb-2.5 mt-1">
 <div className="relative flex-1">
 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-700 dark:text-zinc-500">
 <MagnifierOutlineIcon className="w-3.5 h-3.5" />
 </div>
 <input
 type="text"
 placeholder="جستجوی مدل (نام، قابلیت، سازنده)..."
 value={modelSearchQuery}
 onChange={(e) => setModelSearchQuery(e.target.value)}
 className="w-full clay-input rounded-xl py-2 sm:py-1.5 pr-9 pl-3 text-xs focus:border-indigo-500/50 outline-none transition-all text-zinc-700 dark:text-zinc-300"
 />
 </div>
 <select
 value={filterProvider}
 onChange={(e) => setFilterProvider(e.target.value)}
 className="clay-input rounded-xl py-2 sm:py-1.5 px-3 text-xs focus:border-indigo-500/50 outline-none transition-all text-zinc-700 dark:text-zinc-400 font-medium"
 dir="rtl"
 >
 {PROVIDER_CATEGORIES.map(cat => (
 <option key={cat.id} value={cat.id}>{cat.label} ({providerCounts[cat.id] || 0})</option>
 ))}
 </select>
 </div>
 {/* Multi-Capability Interactive Filter Tags - 2 Columns on Mobile */}
 {cachedModels.length > 0 && (
 <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 mb-3" dir="rtl">
 <button type="button"
 onClick={() => setActiveTag('all')}
 className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[11px] font-medium cursor-pointer transition-colors border select-none w-full sm:w-auto truncate ${
 activeTag === 'all' ? 'bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-500 shadow-sm' : 'clay-surface text-zinc-700 dark:text-zinc-400 border-[var(--card-border)]  hover:border-zinc-300 '
 }`}
 >
 <LayersOutlineIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">همه مدل‌ها ({tagCounts.all})</span>
 </button>
 <button type="button"
 onClick={() => setActiveTag(activeTag === 'coding' ? 'all' : 'coding')}
 className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[11px] font-medium cursor-pointer transition-colors border select-none w-full sm:w-auto truncate ${
 activeTag === 'coding' ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40 shadow-sm' : 'clay-surface text-zinc-700 dark:text-zinc-400 border-[var(--card-border)]  hover:border-zinc-300 '
 }`}
 >
 <CodeOutlineIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">برنامه‌نویسی ({tagCounts.coding})</span>
 </button>
 <button type="button"
 onClick={() => setActiveTag(activeTag === 'vision' ? 'all' : 'vision')}
 className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[11px] font-medium cursor-pointer transition-colors border select-none w-full sm:w-auto truncate ${
 activeTag === 'vision' ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm' : 'clay-surface text-zinc-700 dark:text-zinc-400 border-[var(--card-border)]  hover:border-zinc-300 '
 }`}
 >
 <EyeOutlineIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">دیداری و تصویر ({tagCounts.vision})</span>
 </button>
 <button type="button"
 onClick={() => setActiveTag(activeTag === 'reasoning' ? 'all' : 'reasoning')}
 className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[11px] font-medium cursor-pointer transition-colors border select-none w-full sm:w-auto truncate ${
 activeTag === 'reasoning' ? 'bg-purple-500/25 text-purple-300 border-purple-500/40 shadow-sm' : 'clay-surface text-zinc-700 dark:text-zinc-400 border-[var(--card-border)]  hover:border-zinc-300 '
 }`}
 >
 <BrainOutlineIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">استدلال و تفکر ({tagCounts.reasoning})</span>
 </button>
 <button type="button"
 onClick={() => setActiveTag(activeTag === 'fast' ? 'all' : 'fast')}
 className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[11px] font-medium cursor-pointer transition-colors border select-none w-full sm:w-auto truncate ${
 activeTag === 'fast' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm' : 'clay-surface text-zinc-700 dark:text-zinc-400 border-[var(--card-border)]  hover:border-zinc-300 '
 }`}
 >
 <BoltOutlineIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">سریع و سبک ({tagCounts.fast})</span>
 </button>
 <button type="button"
 onClick={() => setActiveTag(activeTag === 'free' ? 'all' : 'free')}
 className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-[11px] font-medium cursor-pointer transition-colors border select-none w-full sm:w-auto truncate ${
 activeTag === 'free' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm' : 'clay-surface text-zinc-700 dark:text-zinc-400 border-[var(--card-border)]  hover:border-zinc-300 '
 }`}
 >
 <StarsOutlineIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">رایگان ({tagCounts.free})</span>
 </button>
 </div>
 )}

 <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar" dir="rtl">
 {fetchingModels ? (
 <div className="text-xs text-zinc-700 dark:text-zinc-400 text-center py-6">در حال دریافت و تحلیل هوشمند مدل‌ها از سرور...</div>
 ) : (
 <>
 {fetchError && (
 <div className="text-xs text-red-400 text-center py-4 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl">{fetchError}</div>
 )}
 {cachedModels.length === 0 && !fetchError ? (
 <div className="text-xs text-zinc-700 dark:text-zinc-400 text-center py-6">هیچ مدلی یافت نشد. دکمه بروزرسانی را بزنید.</div>
 ) : filteredModelsList.length === 0 && cachedModels.length > 0 ? (
 <div className="text-xs text-zinc-700 dark:text-zinc-500 text-center py-6">هیچ مدلی با فیلترها یا عبارت جستجوی فعلی یافت نشد.</div>
 ) : (
 filteredModelsList.map((m) => {
 const meta = getModelDetails(m);
 const isSelected = editingProfile.modelName === m.id;

 return (
 <div key={m.id}
 onClick={() => handleUpdateProfile(editingProfile.id, { modelName: m.id })}
 className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
 isSelected ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/50' : 'border-[var(--card-border)]  clay-surface hover:border-zinc-300  hover:clay-surface'
 }`}
 >
 {/* Top Row: Name + Star + Badges */}
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 truncate">
 <span className="text-xs text-zinc-900 dark:text-zinc-100 font-bold truncate">
 {m.name || m.id}
 </span>
 {meta.isRecommended && (
 <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0">
 <StarOutlineIcon className="w-2.5 h-2.5 fill-amber-400" /> پیشنهادی
 </span>
 )}
 {meta.contextFormatted && (
 <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0">
 {meta.contextFormatted}
 </span>
 )}
 </div>
 {/* Capability Badges (Multi-tag) */}
 <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
 {meta.isFree && (
 <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <StarsOutlineIcon className="w-2.5 h-2.5" /> رایگان
 </span>
 )}
 {meta.tags.map((t, idx) => {
 if (t.type === 'coding') {
 return (
 <span key={idx} className="flex items-center gap-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <CodeOutlineIcon className="w-2.5 h-2.5" /> {t.label}
 </span>
 );
 }
 if (t.type === 'reasoning') {
 return (
 <span key={idx} className="flex items-center gap-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <BrainOutlineIcon className="w-2.5 h-2.5" /> {t.label}
 </span>
 );
 }
 if (t.type === 'vision') {
 return (
 <span key={idx} className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <EyeOutlineIcon className="w-2.5 h-2.5" /> {t.label}
 </span>
 );
 }
 if (t.type === 'fast') {
 return (
 <span key={idx} className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <BoltOutlineIcon className="w-2.5 h-2.5" /> {t.label}
 </span>
 );
 }
 if (t.type === 'creative') {
 return (
 <span key={idx} className="flex items-center gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <StarsOutlineIcon className="w-2.5 h-2.5" /> {t.label}
 </span>
 );
 }
 return (
 <span key={idx} className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] px-1.5 py-0.5 rounded font-medium">
 <DocumentTextOutlineIcon className="w-2.5 h-2.5" /> {t.label}
 </span>
 );
 })}
 </div>
 </div>

 {/* Bottom Row: Description + Technical ID */}
 <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-400 pt-0.5">
 <span className="text-zinc-700 dark:text-zinc-400 truncate text-[11px] leading-relaxed">{meta.description}</span>
 <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-500 truncate mr-2 clay-surface px-1.5 py-0.5 rounded border border-[var(--card-border)] shrink-0" dir="ltr">
 {m.id}
 </span>
 </div>
 </div>
 );
 })
 )}
 </>
 )}
 </div>
 <div className="text-[10px] text-zinc-700 dark:text-zinc-500 mt-2.5 text-center">برای انتخاب مدل روی آن کلیک کنید.</div>
 </div>
 </details>
 </div>
 )}

 <div>
 <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-400 mb-1">هدرهای سفارشی (JSON)</label>
 <textarea dir="ltr" value={editingProfile.customHeaders} onChange={(e) => handleUpdateProfile(editingProfile.id, { customHeaders: e.target.value })} className="w-full clay-input rounded-xl py-2 px-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono h-20 resize-none" placeholder='{"HTTP-Referer":"https://myapp.com"}' />
 </div>
 <button onClick={() => {
 setEditingProfileId(null);
 setShowFetchedList(false);
 }}
 className="w-full py-2.5 rounded-xl clay-surface hover:bg-white text-zinc-900 font-medium text-sm transition-colors mt-2"
 >
 تایید و بستن
 </button>
 </div>
 </div>
 )}
 </div>
 );
};

