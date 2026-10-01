import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import React, { useState, useEffect } from 'react';
import { CloseOutlineIcon, DisketteOutlineIcon, GlobalOutlineIcon, CpuOutlineIcon, UserCircleOutlineIcon, PaletteOutlineIcon, SettingsOutlineIcon, InfoCircleOutlineIcon, TrashBinMinimalisticOutlineIcon, DownloadOutlineIcon, UploadOutlineIcon, StarsOutlineIcon, UserOutlineIcon } from '@solar-icons/react';
import { AppSettings, Conversation, FontFamily, ThemeMode, CustomProfile } from '../types';
import { getModelDetails } from './CustomProviderCards';
import { EyeOutlineIcon, CodeOutlineIcon, BrainOutlineIcon } from '@solar-icons/react';

type TabType = 'providers' | 'persona' | 'appearance' | 'tools' | 'data';

interface VisualRoleSelectProps {
 roleType: 'default' | 'coding' | 'vision';
 value: string;
 onChange: (id: string) => void;
 profiles: CustomProfile[];
 cachedModels: any[];
}

export const VisualRoleSelect: React.FC<VisualRoleSelectProps> = ({
 roleType,
 value,
 onChange,
 profiles,
 cachedModels,
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const containerRef = React.useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const getProfileMeta = (p: CustomProfile) => {
 const matched = cachedModels.find(m => m.id === p.modelName || m.name === p.modelName);
 if (matched) return getModelDetails(matched);
 return getModelDetails({ id: p.modelName || '', name: p.name });
 };

 const selectedProfile = profiles.find(p => p.id === value);
 const selectedMeta = selectedProfile ? getProfileMeta(selectedProfile) : null;

 const sortedProfiles = React.useMemo(() => {
 return [...profiles].sort((a, b) => {
 const metaA = getProfileMeta(a);
 const metaB = getProfileMeta(b);

 let scoreA = 0;
 let scoreB = 0;

 if (roleType === 'vision') {
 if (metaA.isVision) scoreA += 10;
 if (metaB.isVision) scoreB += 10;
 } else if (roleType === 'coding') {
 if (metaA.isCoding) scoreA += 10;
 if (metaB.isCoding) scoreB += 10;
 } else {
 if (metaA.isRecommended) scoreA += 5;
 if (metaB.isRecommended) scoreB += 5;
 if (metaA.isFast) scoreA += 3;
 if (metaB.isFast) scoreB += 3;
 }

 return scoreB - scoreA;
 });
 }, [profiles, cachedModels, roleType]);

 const getRoleIcon = () => {
 if (roleType === 'vision') return <EyeOutlineIcon className="w-4 h-4 text-amber-400" />;
 if (roleType === 'coding') return <CodeOutlineIcon className="w-4 h-4 text-cyan-400" />;
 return <StarsOutlineIcon className="w-4 h-4 text-indigo-400" />;
 };

 return (
 <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[60]' : 'z-10'}`}>
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-right select-none cursor-pointer ${
 isOpen
 ? 'clay-surface border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
 : 'clay-surface border-[var(--card-border)] hover:border-zinc-300  hover:clay-surface/60'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0 flex-1">
 <div className="p-1.5 rounded-lg clay-card shrink-0">
 {getRoleIcon()}
 </div>
 {selectedProfile ? (
 <div className="flex flex-col min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">{selectedProfile.name}</span>
 {selectedMeta && (
 <span className="type-badge px-1.5 py-0.5 rounded clay-surface text-zinc-700 dark:text-zinc-400 font-medium">
 {selectedMeta.providerLabel}
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-700 dark:text-zinc-400 font-mono truncate" dir="ltr">
 <span className="truncate type-badge text-zinc-700 dark:text-zinc-400">{selectedProfile.modelName || 'بدون مدل'}</span>
 </div>
 </div>
 ) : (
 <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-500 font-normal">-- انتخاب پروفایل مناسب --</span>
 )}
 </div>

 <div className="flex items-center gap-2 mr-2 shrink-0">
 {selectedMeta && selectedMeta.tags.slice(0, 2).map((t, idx) => (
 <span
 key={idx}
 className={`hidden sm:inline-block type-badge px-2 py-0.5 rounded-full font-medium ${
 t.type === 'coding'
 ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
 : t.type === 'vision'
 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
 : t.type === 'reasoning'
 ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
 : 'clay-surface text-zinc-700 dark:text-zinc-300'
 }`}
 >
 {t.label}
 </span>
 ))}
 <span className={`text-zinc-700 dark:text-zinc-500 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
 </div>
 </button>

 {isOpen && (
 <div className="absolute z-[70] w-full mt-2 clay-card  rounded-2xl max-h-72 overflow-y-auto p-1.5 animate-fadeIn space-y-1">
 <div className="px-3 py-1.5 type-badge text-zinc-700 dark:text-zinc-400 border-b border-[var(--card-border)] font-medium flex items-center justify-between">
 <span>پروفایل‌های موجود ({profiles.length})</span>
 <span className="text-zinc-700 dark:text-zinc-400">مرتب‌شده بر اساس سازگاری با نقش</span>
 </div>

 {profiles.length === 0 ? (
 <div className="p-4 text-center text-xs text-zinc-700 dark:text-zinc-500">هیچ پروفایلی یافت نشد. لطفاً ابتدا در بالا پروفایل بسازید.</div>
 ) : (
 sortedProfiles.map(p => {
 const meta = getProfileMeta(p);
 const isSelected = p.id === value;
 const isRecommendedForRole =
 (roleType === 'vision' && meta.isVision) ||
 (roleType === 'coding' && meta.isCoding) ||
 (roleType === 'default' && meta.isRecommended);

 return (
 <div
 key={p.id}
 onClick={() => {
 onChange(p.id);
 setIsOpen(false);
 }}
 className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
 isSelected
 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
 : isRecommendedForRole
 ? 'clay-surface/80 border-zinc-300 hover:border-zinc-600 text-zinc-800 dark:text-zinc-200'
 : 'clay-surface border-[var(--card-border)]/60 hover:clay-surface/50 text-zinc-700 dark:text-zinc-400 opacity-80 hover:opacity-100'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0 flex-1">
 <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'clay-surface text-zinc-700 dark:text-zinc-400'}`}>
 {meta.isVision && roleType === 'vision' ? (
 <EyeOutlineIcon className="w-3.5 h-3.5 text-amber-400" />
 ) : meta.isCoding && roleType === 'coding' ? (
 <CodeOutlineIcon className="w-3.5 h-3.5 text-cyan-400" />
 ) : meta.isReasoning ? (
 <BrainOutlineIcon className="w-3.5 h-3.5 text-purple-400" />
 ) : (
 <StarsOutlineIcon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-400" />
 )}
 </div>
 <div className="flex flex-col min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{p.name}</span>
 {isRecommendedForRole && (
 <span className="type-badge text-amber-400 flex items-center gap-0.5 font-medium">
 ⭐ پیشنهادی
 </span>
 )}
 </div>
 <span className="type-badge text-zinc-700 dark:text-zinc-400 font-mono truncate" dir="ltr">{p.modelName || 'بدون مدل'}</span>
 </div>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 {meta.isFree && (
 <span className="type-badge px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">رایگان</span>
 )}
 <span className="type-badge px-1.5 py-0.5 rounded clay-surface text-zinc-700 dark:text-zinc-300 font-mono">
 {meta.providerLabel}
 </span>
 {isSelected && <span className="text-indigo-400 text-xs font-bold mr-1">✓</span>}
 </div>
 </div>
 );
 })
 )}
 </div>
 )}
 </div>
 );
};

// Custom Combobox Component
export const SearchableCombobox = ({ value, onChange, options, placeholder, className }: any) => {
 const [isOpen, setIsOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const wrapperRef = React.useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const filteredOptions = options.filter((opt: any) => {
 const search = searchTerm.toLowerCase();
 const nameMatch = opt.name ? opt.name.toLowerCase().includes(search) : false;
 const idMatch = opt.id ? opt.id.toLowerCase().includes(search) : false;
 return nameMatch || idMatch;
 });

 return (
 <div ref={wrapperRef} className="relative w-full">
 <input
 type="text"
 dir="ltr"
 value={isOpen ? searchTerm : value}
 onChange={(e) => {
 if (isOpen) setSearchTerm(e.target.value);
 else onChange(e.target.value);
 }}
 onClick={() => { setIsOpen(true); setSearchTerm(''); }}
 placeholder={placeholder}
 className={className}
 />
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
 <svg className="w-4 h-4 text-zinc-700 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </div>
 {isOpen && (
 <div className="absolute z-50 w-full mt-1 clay-card  rounded-xl max-h-60 overflow-auto">
 {filteredOptions.length === 0 ? (
 <div className="p-3 text-sm text-zinc-700 dark:text-zinc-400 text-center">موردی یافت نشد</div>
 ) : (
 filteredOptions.map((opt: any) => (
 <div
 key={opt.id}
 className="p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm font-mono border-b border-[var(--card-border)]/50 last:border-0 truncate text-left transition-colors"
 onClick={() => {
 onChange(opt.id);
 setIsOpen(false);
 }}
 >
 {opt.name || opt.id}
 </div>
 ))
 )}
 </div>
 )}
 </div>
 );
};

export const SettingsModal: React.FC = () => {
 const { isSettingsOpen: isOpen, setIsSettingsOpen } = useUIStore();
 const { settings, setSettings } = useSettingsStore();
 const { setConversations, clearAllConversations } = useChatStore();
 const { user, updateUser } = useAuthStore();
 const onClose = () => setIsSettingsOpen(false);
 const onSaveSettings = setSettings;
 const onImportConversations = (imported: Conversation[]) => setConversations(imported);
 const onClearAllConversations = clearAllConversations;

 const onFactoryReset = () => {
 if (window.confirm('آیا مطمئن هستید که می‌خواهید تمام تنظیمات و پروفایل‌ها به حالت اولیه بازگردد؟ این عملیات غیرقابل بازگشت است و تاریخچه چت‌های شما حفظ می‌شود، اما تنظیمات API پاک می‌شود.')) {
 localStorage.removeItem('persian_ai_settings_v2');
 window.location.reload();
 }
 };

 const [activeTab, setActiveTab] = useState<TabType>('providers');
 const [tempSettings, setTempSettings] = useState<AppSettings>(settings);

 // (Profile update logic moved to UserDashboard)

 const [testing, setTesting] = useState(false);
 const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

 const [cachedModels, setCachedModels] = useState<{
 id: string;
 name?: string;
 isFree?: boolean;
 provider?: string;
 isVision?: boolean;
 isCoding?: boolean;
 isReasoning?: boolean;
 isFast?: boolean;
 contextLength?: number | null;
 description?: string;
 }[]>(() => {
 try { return JSON.parse(localStorage.getItem('chatbox_models') || '[]'); } catch { return []; }
 });
 const [fetchingModels, setFetchingModels] = useState(false);

 const handleFetchModels = async (overrideConfig?: any) => {
 const provider = tempSettings.providers.activeProvider;
 let config = tempSettings.providers[provider] as any;

 if (provider === 'custom') {
 const activeProfile = config.profiles?.find((p: any) => p.id === config.activeProfileId);
 if (activeProfile) {
 config = activeProfile;
 }
 }

 // Use override config if provided (to bypass React state delays)
 if (overrideConfig) {
 config = { ...config, ...overrideConfig };
 }

 const baseUrl = config.baseUrl || (provider === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.openai.com');

 console.log('[DEBUG] Fetch Models overrideConfig:', overrideConfig);
 console.log('[DEBUG] Fetch Models config:', config);
 console.log('[DEBUG] Fetch Models payload:', { baseUrl, apiKey: !!config.apiKey, customHeaders: config.customHeaders });

 const startTime = performance.now();
 setFetchingModels(true);
 // setCachedModels([]); // Preserve previous models in case of error

 try {
 const res = await fetch('/api/fetch-models', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 baseUrl,
 apiKey: config.apiKey,
 customHeaders: config.customHeaders
 })
 });
 const data = await res.json();
 const latencyMs = Math.round(performance.now() - startTime);
 if (res.ok && data.models) {
 setCachedModels(data.models);
 localStorage.setItem('chatbox_models', JSON.stringify(data.models));
 setTestResult({ success: true, message: `تعداد ${data.models.length} مدل با موفقیت دریافت شد.`, latencyMs });
 } else {
 setTestResult({ success: false, message: data.error || 'خطا در دریافت مدل‌ها', latencyMs });
 }
 } catch (e) {
 const latencyMs = Math.round(performance.now() - startTime);
 setTestResult({ success: false, message: 'خطای شبکه در اتصال به سرور', latencyMs });
 } finally {
 setFetchingModels(false);
 }
 };
 const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

 const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 const content = e.target?.result as string;
 const parsed = JSON.parse(content);
 if (Array.isArray(parsed)) {
 onImportConversations(parsed);
 setImportStatus({ success: true, message: 'اطلاعات با موفقیت بازیابی شد.' });
 } else {
 setImportStatus({ success: false, message: 'فایل نامعتبر است (باید آرایه باشد).' });
 }
 } catch (err) {
 setImportStatus({ success: false, message: 'خطا در خواندن فایل JSON.' });
 }
 setTimeout(() => setImportStatus(null), 3000);
 };
 reader.readAsText(file);
 event.target.value = ''; // Reset
 };

 const analysisFeedback = React.useMemo(() => {
 if (!tempSettings.tools.smartRouting) return null;
 const { default: def, coding, vision } = tempSettings.tools.routingRoles || {};
 const profiles = tempSettings.providers.custom.profiles || [];
 const getProfile = (id: string) => profiles.find(p => p.id === id);
 const defP = getProfile(def || '');
 const codP = getProfile(coding || '');
 const visP = getProfile(vision || '');

 const getProfileMeta = (p?: CustomProfile) => {
 if (!p || !p.modelName) return null;
 const matched = cachedModels.find(m => m.id === p.modelName || m.name === p.modelName);
 if (matched) return getModelDetails(matched);
 return getModelDetails({ id: p.modelName, name: p.name });
 };

 const visMeta = getProfileMeta(visP);
 const codMeta = getProfileMeta(codP);


 const feedback = [];

 if (visP && visMeta && !visMeta.isVision) {
 feedback.push(`⚠️ هشداری دوستانه: به نظر می‌رسد مدل «${visP.modelName || visP.name}» قابلیت دیدن عکس و فایل (Vision) را ندارد. پیشنهاد ما استفاده از مدل‌های دارای قابلیت دیداری (مانند Claude، GPT-4o یا Gemini) است.`);
 }
 if (codP && codMeta && !codMeta.isCoding) {
 feedback.push(`⚠️ پیشنهاد: مدل «${codP.modelName || codP.name}» ممکن است در کدهای پیچیده ضعیف عمل کند. بهتر است از مدل‌های قدرتمندی مثل Claude Sonnet/Opus، DeepSeek R1/V3، GPT-4o یا Qwen Coder استفاده کنید.`);
 }
 if (feedback.length === 0 && defP && codP && visP) {
 return {
 type: 'success',
 messages: ["✅ ترکیب شما عالی است! تمام نقش‌های هوشمند (پردازش تصویر، برنامه‌نویسی و گفتگو) با مدل‌های سازگار و تخصصی تنظیم شده‌اند."]
 };
 } else if (feedback.length > 0) {
 return {
 type: 'warning',
 messages: feedback
 };
 }
 return null;
 }, [tempSettings.tools.smartRouting, tempSettings.tools.routingRoles, tempSettings.providers.custom.profiles, cachedModels]);
 const [feedbackVisible, setFeedbackVisible] = useState(true);

 useEffect(() => {
 if (analysisFeedback) {
 setFeedbackVisible(true);
 }
 }, [analysisFeedback]);

 const [isSmartRoutingExpanded, setIsSmartRoutingExpanded] = useState(false);

 useEffect(() => {
 if (analysisFeedback && feedbackVisible) {
 const timer = setTimeout(() => {
 setFeedbackVisible(false);
 }, 15000);
 return () => clearTimeout(timer);
 }
 }, [analysisFeedback, feedbackVisible]);

 const fileInputRef = React.useRef<HTMLInputElement>(null);
 useEffect(() => {
 if (isOpen) {
 setTempSettings(settings);
 setActiveTab('providers');
 setTestResult(null);
 }
 }, [isOpen, settings]);

 if (!isOpen) return null;

 const handleTestConnection = async (provider: 'gemini' | 'openai' | 'anthropic' | 'custom') => {
 setTesting(true);
 setTestResult(null);
 try {
 let configObj = (tempSettings.providers[provider] as any) || {};
 if (provider === 'custom') {
 const activeProfile = configObj.profiles?.find((p: any) => p.id === configObj.activeProfileId);
 if (activeProfile) {
 configObj = activeProfile;
 }
 }
 const res = await fetch('/api/ping', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 provider,
 customBaseUrl: configObj.baseUrl,
 customApiKey: configObj.apiKey,
 customHeaders: configObj.customHeaders,
 modelName: configObj.modelName
 })
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setTestResult({ success: true, message: 'اتصال با موفقیت برقرار شد', latencyMs: data.latencyMs });
 } else {
 setTestResult({ success: false, message: data.error || 'خطا در اتصال' });
 }
 } catch (e) {
 setTestResult({ success: false, message: 'خطا در برقراری ارتباط با سرور' });
 } finally {
 setTesting(false);
 }
 };

 const handleSave = () => {
 onSaveSettings(tempSettings);
 onClose();
 };



 return (
 <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
 <div className="w-full sm:w-[95vw] md:w-full max-w-4xl clay-modal flex flex-col sm:flex-row overflow-hidden text-zinc-900 dark:text-zinc-100 h-[92dvh] sm:h-auto sm:max-h-[85dvh]">

 {/* Sidebar Tabs */}
 <div className="w-full sm:w-64 bg-transparent border-b sm:border-b-0 sm:border-l border-[var(--card-border)] flex flex-col shrink-0">
 <div className="px-4 py-3 sm:p-5 border-b border-[var(--card-border)] flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
 <SettingsOutlineIcon className="w-4 h-4 sm:w-5 sm:h-5" />
 </div>
 <h2 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">تنظیمات سیستم</h2>
 </div>
 <button onClick={onClose} className="sm:hidden p-1.5 clay-icon-btn rounded-full text-zinc-700 dark:text-zinc-400">
 <CloseOutlineIcon className="w-5 h-5" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto flex sm:flex-col sm:p-3 p-2 gap-2 sm:gap-1 overflow-x-auto">
 <TabButton active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} icon={<GlobalOutlineIcon className="w-4 h-4 shrink-0" />} label="ارائه‌دهندگان" />
 <TabButton active={activeTab === 'persona'} onClick={() => setActiveTab('persona')} icon={<UserCircleOutlineIcon className="w-4 h-4 shrink-0" />} label="شخصی‌سازی" />
 <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<PaletteOutlineIcon className="w-4 h-4 shrink-0" />} label="ظاهر و قالب" />
 <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={<SettingsOutlineIcon className="w-4 h-4 shrink-0" />} label="ابزارها" />
 <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<DisketteOutlineIcon className="w-4 h-4 shrink-0" />} label="داده‌ها" />
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col overflow-hidden">
 <div className="flex-1 overflow-y-auto p-3.5 sm:p-8">

 {activeTab === 'providers' && (
 <div className="space-y-6 sm:space-y-8 animate-fadeIn">
 <div className="flex items-center gap-3 mb-4 sm:mb-6">
 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><CpuOutlineIcon className="w-5 h-5" /></div>
 <div>
 <h3 className="text-lg font-bold">پروفایل‌های ارائه‌دهندگان (API Profiles)</h3>
 <p className="text-xs text-zinc-700 dark:text-zinc-400">مدیریت کلیدهای دسترسی و انتخاب مدل پیش‌فرض</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-6 sm:mb-8">
 <div className="bg-blue-500/10 text-blue-400 p-4 rounded-xl text-sm leading-relaxed">
 در این بخش می‌توانید مسیریابی هوشمند (Smart Routing) را تنظیم کنید تا چت‌باکس به طور خودکار بهترین مدل را برای پیام‌های مختلف انتخاب کند. پروفایل‌ها و مدل‌های پایه توسط مدیر سیستم تنظیم می‌شوند.
 </div>
 </div>

 {/* Smart Routing Block (Collapsible) */}
 <div className="clay-card rounded-2xl p-4 sm:p-5 mt-4 transition-all">
 <div className="flex items-center justify-between">
 <button type="button" onClick={() => setIsSmartRoutingExpanded(!isSmartRoutingExpanded)} className="flex items-center gap-3 text-right group w-full outline-none">
 <div className={`p-1.5 rounded-lg border border-zinc-300  clay-surface text-zinc-700 dark:text-zinc-400 transition-transform ${isSmartRoutingExpanded ? 'rotate-180' : ''}`}>
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </div>
 <div>
 <div className="font-medium text-sm text-indigo-400 flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
 <StarsOutlineIcon className="w-4 h-4" /> مسیریابی هوشمند (Smart Routing)
 </div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400 mt-1">ارسال پیام‌ها بر اساس نوع محتوا به پروفایل‌های مختلف</div>
 </div>
 </button>
 <div className="shrink-0 mr-4">
 <ToggleSwitch checked={tempSettings.tools.smartRouting} onChange={(v) => { setTempSettings({ ...tempSettings, tools: { ...tempSettings.tools, smartRouting: v } }); if (v) setIsSmartRoutingExpanded(true); }} />
 </div>
 </div>

 {isSmartRoutingExpanded && (
 <>
 <div className="pt-5 mt-5 border-t border-[var(--card-border)]/50 grid grid-cols-1 gap-4 animate-fadeIn relative z-20">
 {/* Default Model */}
 <div className="relative z-30">
 <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
 <span>مدل پیش‌فرض (مکالمه عمومی و سریع)</span>
 </label>
 <VisualRoleSelect
 roleType="default"
 value={tempSettings.tools.routingRoles?.default || ''}
 onChange={(val) => setTempSettings({
 ...tempSettings,
 tools: {
 ...tempSettings.tools,
 routingRoles: {
 ...(tempSettings.tools.routingRoles || { default: '', coding: '', vision: '' }),
 defaultProvider: 'custom',
 default: val
 }
 }
 })}
 profiles={tempSettings.providers.custom.profiles || []}
 cachedModels={cachedModels}
 />
 </div>

 {/* Coding Model */}
 <div className="relative z-20">
 <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
 <span>مدل تخصصی برنامه‌نویسی (Coding Expert)</span>
 </label>
 <VisualRoleSelect
 roleType="coding"
 value={tempSettings.tools.routingRoles?.coding || ''}
 onChange={(val) => setTempSettings({
 ...tempSettings,
 tools: {
 ...tempSettings.tools,
 routingRoles: {
 ...(tempSettings.tools.routingRoles || { default: '', coding: '', vision: '' }),
 codingProvider: 'custom',
 coding: val
 }
 }
 })}
 profiles={tempSettings.providers.custom.profiles || []}
 cachedModels={cachedModels}
 />
 </div>

 {/* Vision Model */}
 <div className="relative z-10">
 <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
 <span>مدل پردازش تصویر و اسناد چندوجهی (Vision)</span>
 </label>
 <VisualRoleSelect
 roleType="vision"
 value={tempSettings.tools.routingRoles?.vision || ''}
 onChange={(val) => setTempSettings({
 ...tempSettings,
 tools: {
 ...tempSettings.tools,
 routingRoles: {
 ...(tempSettings.tools.routingRoles || { default: '', coding: '', vision: '' }),
 visionProvider: 'custom',
 vision: val
 }
 }
 })}
 profiles={tempSettings.providers.custom.profiles || []}
 cachedModels={cachedModels}
 />
 </div>
 </div>

 {analysisFeedback && feedbackVisible && (
 <div className={`mt-4 p-4 rounded-xl border relative flex flex-col gap-2 pl-10 ${
 analysisFeedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
 }`}>
 <button type="button"
 onClick={() => setFeedbackVisible(false)} className={`absolute top-3 left-3 p-1 rounded-md transition-colors ${
 analysisFeedback.type === 'success' ? 'hover:bg-emerald-500/20 text-emerald-500' : 'hover:bg-yellow-500/20 text-yellow-500'
 }`}
 >
 <CloseOutlineIcon className="w-4 h-4" />
 </button>
 {analysisFeedback.messages.map((msg, i) => (
 <div key={i} className="text-xs font-medium leading-relaxed">{msg}</div>
 ))}
 </div>
 )}
 </>
 )}
 </div>

 <div className="mt-4 p-4 rounded-xl border flex flex-col gap-2 bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400 z-0">
 <div className="flex items-start gap-3">
 <div className="shrink-0 pt-0.5">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <div>
 <div className="text-sm font-bold mb-1">راهنمای انتخاب مدل هوش مصنوعی</div>
 <div className="text-xs font-medium leading-relaxed opacity-90">
 مدل‌های سبک (مانند Mini یا Flash) سرعت بسیار بالایی دارند، اما ممکن است در تحلیل داده‌های پیچیده اینترنت (مثل آب و هوا یا آمار) بخش‌هایی از جزئیات را نادیده بگیرند. برای اطمینان از دریافت پاسخ‌ها و تحلیل‌های عمیق، کامل و دقیق، استفاده از مدل‌های پیشرفته (مانند Pro، Plus یا Ultra) پیشنهاد می‌شود.
 </div>
 </div>
 </div>
 </div>

 <div className="clay-card rounded-2xl p-4 sm:p-5 mt-4">

 <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
 <button type="button" onClick={() => handleTestConnection('custom')} disabled={testing} className="w-auto px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm border border-zinc-300 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-2">
 {testing ? <><div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin" /> بررسی ارتباط...</> : <><GlobalOutlineIcon className="w-4 h-4" /> تست اتصال</>}
 </button>
 {testResult && (
 <div className={`flex-1 w-full p-2.5 rounded-xl text-sm flex items-start sm:items-center justify-start gap-2 ${testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
 <InfoCircleOutlineIcon className="w-4 h-4 shrink-0" />
 <span className="leading-relaxed font-mono">{testResult.success ? `${testResult.message} - ${testResult.latencyMs}ms` : `خطا: ${testResult.message}`}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'persona' && (
 <div className="space-y-6 animate-fadeIn">
 <h3 className="text-lg font-bold">شخصیت و لحن دستیار</h3>
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">لحن پایه</label>
 <div className="grid grid-cols-3 gap-3">
 {['friendly', 'formal', 'expert'].map((tone) => (
 <button key={tone} onClick={() => setTempSettings({ ...tempSettings, persona: { ...tempSettings.persona, tone: tone as any } })} className={`py-2 px-2 rounded-xl text-sm font-bold transition-all ${tempSettings.persona.tone === tone ? 'clay-btn-primary' : 'clay-btn-secondary'}`}>
 {tone === 'friendly' ? 'دوستانه' : tone === 'formal' ? 'رسمی' : 'تخصصی'}
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">دستورالعمل سیستم (System Prompt)</label>
 <textarea value={tempSettings.persona.systemPrompt} onChange={(e) => setTempSettings({ ...tempSettings, persona: { ...tempSettings.persona, systemPrompt: e.target.value } })} className="w-full clay-card rounded-xl py-3 px-4 text-sm focus:border-zinc-400 dark:focus:border-zinc-500 outline-none transition-all h-32 resize-none" placeholder="مثال: شما یک متخصص برنامه‌نویسی هستید..." />
 </div>
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex justify-between">
 <span>خلاقیت (Temperature)</span>
 <span className="text-blue-400 font-mono">{tempSettings.persona.temperature}</span>
 </label>
 <input type="range" min="0" max="1" step="0.1" value={tempSettings.persona.temperature} onChange={(e) => setTempSettings({ ...tempSettings, persona: { ...tempSettings.persona, temperature: parseFloat(e.target.value) } })} className="w-full accent-blue-500" />
 <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-500 mt-2">
 <span>دقیق و منطقی</span>
 <span>خلاق و متنوع</span>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'appearance' && (
 <div className="space-y-6 animate-fadeIn">
 <h3 className="text-lg font-bold">ظاهر و قالب</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">فونت فارسی</label>
 <select value={tempSettings.appearance.font} onChange={(e) => setTempSettings({ ...tempSettings, appearance: { ...tempSettings.appearance, font: e.target.value as FontFamily } })} className="w-full clay-card rounded-xl py-2.5 px-3 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 font-medium">
 <option value="hybrid">✨ ترکیب هوشمند (پیش‌فرض مدرن)</option>
 <option value="vazir">وزیرمتن (Vazirmatn)</option>
 <option value="estedad">استعداد (Estedad)</option>
 <option value="sahel">ساحل (Sahel)</option>
 <option value="mikhak">میخک (Mikhak)</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">پوسته</label>
 <select value={tempSettings.appearance.theme} onChange={(e) => setTempSettings({ ...tempSettings, appearance: { ...tempSettings.appearance, theme: e.target.value as ThemeMode } })} className="w-full clay-card rounded-xl py-2.5 px-3 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500">
 <option value="dark">تاریک (Dark)</option>
 <option value="light">روشن (Light)</option>
 <option value="system">خودکار (System)</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex justify-between">
 <span>اندازه قلم</span>
 <span className="text-blue-400 font-mono">{tempSettings.appearance.fontSize}px</span>
 </label>
 <input type="range" min="12" max="24" step="1" value={tempSettings.appearance.fontSize} onChange={(e) => setTempSettings({ ...tempSettings, appearance: { ...tempSettings.appearance, fontSize: parseInt(e.target.value, 10) } })} className="w-full accent-blue-500" />
 </div>
 <div className="flex items-center justify-between p-4 clay-card rounded-xl">
 <div>
 <div className="font-medium text-sm">اعداد فارسی</div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">نمایش تمام اعداد لاتین به صورت فارسی</div>
 </div>
 <ToggleSwitch checked={tempSettings.appearance.persianNumerals} onChange={(v) => setTempSettings({ ...tempSettings, appearance: { ...tempSettings.appearance, persianNumerals: v } })} />
 </div>
 </div>
 )}

 {activeTab === 'tools' && (
 <div className="space-y-6 animate-fadeIn">
 <h3 className="text-lg font-bold">ابزارهای جانبی</h3>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-4 clay-card rounded-xl">
 <div>
 <div className="font-medium text-sm">جستجوی زنده وب (Web Search)</div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">جستجوی آنلاین برای اطلاعات به‌روز</div>
 </div>
 <ToggleSwitch
 checked={tempSettings.tools.webSearch}
 onChange={(v) => {
 setTempSettings({ ...tempSettings, tools: { ...tempSettings.tools, webSearch: v } });
 const msg = v ? 'امکان جستجو در وب روشن شد' : 'امکان جستجو در وب غیرفعال شد';
 // Show a native alert for simplicity, or we can use custom toast if preferred, but alert is robust
 // Let's use a small DOM injection for a nice toast if alert is too intrusive, but wait, a simple alert is fine.
 // Wait, alert blocks the UI. Let's just create a quick custom toast.
 const toast = document.createElement('div');
 toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 clay-surface text-zinc-800 dark:text-zinc-200 border border-zinc-300  px-5 py-3 rounded-2xl z-[9999] text-sm animate-fadeIn flex items-center gap-2';
 toast.innerHTML = `<span class="${v ? 'text-emerald-400' : 'text-zinc-700 dark:text-zinc-400'}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></span> ${msg}`;
 document.body.appendChild(toast);
 setTimeout(() => {
 toast.style.opacity = '0';
 toast.style.transition = 'opacity 0.5s ease';
 setTimeout(() => toast.remove(), 500);
 }, 2500);
 }}
 />
 </div>
 <div className="flex items-center justify-between p-4 clay-card rounded-xl">
 <div>
 <div className="font-medium text-sm flex items-center gap-2">
 <span>تفکر عمیق (Deep Thinking/Reasoning)</span>
 <span className="px-1.5 py-0.5 rounded type-badge font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">جدید</span>
 </div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">تحلیل عمیق و استدلال مرحله‌به‌مرحله قبل از پاسخ (در مدل‌های پشتیبانی شده)</div>
 </div>
 <ToggleSwitch checked={!!tempSettings.tools.reasoningMode} onChange={(v) => {
 setTempSettings({ ...tempSettings, tools: { ...tempSettings.tools, reasoningMode: v } });
 }} />
 </div>

 <div className="flex items-center justify-between p-4 clay-card rounded-xl">
 <div>
 <div className="font-medium text-sm">ارسال با Enter</div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">ارسال پیام با فشردن کلید Enter</div>
 </div>
 <ToggleSwitch checked={tempSettings.tools.enterToSend} onChange={(v) => setTempSettings({ ...tempSettings, tools: { ...tempSettings.tools, enterToSend: v } })} />
 </div>



 <div className="flex items-center justify-between p-4 clay-card rounded-xl">
 <div>
 <div className="font-medium text-sm">نمایش عملکرد</div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">محاسبه توکن‌ها و هزینه‌ها</div>
 </div>
 <ToggleSwitch checked={tempSettings.tools.showPerformanceMetrics} onChange={(v) => setTempSettings({ ...tempSettings, tools: { ...tempSettings.tools, showPerformanceMetrics: v } })} />
 </div>
 </div>
 </div>
 )}

 {activeTab === 'data' && (
 <div className="space-y-6 animate-fadeIn">
 <h3 className="text-lg font-bold">مدیریت داده‌ها و حریم خصوصی</h3>
 <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-300 leading-relaxed">
 تمامی چت‌ها و کلیدهای API شما فقط در مرورگر (Local Storage) ذخیره می‌شوند. برای جلوگیری از پاک شدن اطلاعات هنگام پاک کردن تاریخچه مرورگر، مرتباً نسخه پشتیبان تهیه کنید.
 </div>
 <div className="space-y-3">

 <div className="flex flex-col sm:flex-row gap-3">
 <button className="flex-1 p-4 clay-card hover:border-zinc-300  rounded-xl flex items-center gap-3 transition-colors">
 <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><DownloadOutlineIcon className="w-5 h-5" /></div>
 <div className="text-right">
 <div className="font-medium text-sm">دریافت نسخه پشتیبان (Export)</div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">دانلود تمام گفتگوها و تنظیمات</div>
 </div>
 </button>

 <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-4 clay-card hover:border-zinc-300  rounded-xl flex items-center gap-3 transition-colors relative overflow-hidden">
 <input
 type="file"
 accept=".json"
 ref={fileInputRef}
 onChange={handleFileImport}
 className="hidden"
 />
 <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><UploadOutlineIcon className="w-5 h-5" /></div>
 <div className="text-right">
 <div className="font-medium text-sm">بازیابی نسخه پشتیبان (Import)</div>
 <div className="text-xs text-zinc-700 dark:text-zinc-400">فایل JSON پشتیبان خود را انتخاب کنید</div>
 </div>
 </button>
 </div>
 {importStatus && (
 <div className={`p-3 rounded-xl text-sm font-medium ${importStatus.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
 {importStatus.message}
 </div>
 )}

 <button onClick={onClearAllConversations} className="w-full p-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-0 rounded-xl flex items-center gap-3 transition-colors text-red-600 dark:text-red-400">
 <div className="p-2 bg-red-500/10 rounded-lg"><TrashBinMinimalisticOutlineIcon className="w-5 h-5" /></div>
 <div className="text-right">
 <div className="font-medium text-sm text-red-600 dark:text-red-400">پاک‌سازی تاریخچه گفتگوها</div>
 <div className="text-xs text-red-600/70 dark:text-red-400/70">این عملیات غیرقابل بازگشت است</div>
 </div>
 </button>

 <button onClick={onFactoryReset} className="w-full p-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-0 rounded-xl flex items-center gap-3 transition-colors text-red-600 dark:text-red-400 mt-3">
 <div className="p-2 bg-red-500/10 rounded-lg"><SettingsOutlineIcon className="w-5 h-5" /></div>
 <div className="text-right">
 <div className="font-medium text-sm text-red-600 dark:text-red-400">بازگردانی تنظیمات اولیه (Factory Reset)</div>
 <div className="text-xs text-red-600/70 dark:text-red-400/70">همه تنظیمات مرورگر شما پاک شده و به حالت پیش‌فرض بازمی‌گردد</div>
 </div>
 </button>
 </div>
 </div>
 )}

 </div>

 {/* Footer */}
 <div className="p-4 border-t border-[var(--card-border)] bg-transparent flex justify-end gap-3 shrink-0 rounded-b-3xl">
 <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all clay-btn-secondary">انصراف</button>
 <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 clay-btn-primary">
 <DisketteOutlineIcon className="w-4 h-4" /> ذخیره و اعمال
 </button>
 </div>
 </div>

 </div>
 </div>
 );
};

// UI Helpers
const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
 <button
 onClick={onClick}
 className={`flex shrink-0 sm:w-full items-center gap-2 sm:gap-3 px-3 py-2 sm:py-3 rounded-xl transition-all text-xs sm:text-sm font-bold ${active ? 'clay-btn-primary' : 'clay-btn-secondary opacity-70 hover:opacity-100'}`}
 >
 {icon} <span>{label}</span>
 </button>
);



const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
 <button
 type="button"
 onClick={() => onChange(!checked)}
 className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-zinc-700'}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? '-translate-x-6' : '-translate-x-1'}`} />
 </button>
);
