import React, { useState, useEffect } from 'react';
import { 
  X, Save, Globe, Cpu, Key, Link as LinkIcon, 
  UserCircle, Palette, Wrench, AlertCircle, Trash2, Download, Upload
} from 'lucide-react';
import { AppSettings, Conversation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  conversations: Conversation[];
  onImportConversations: (imported: Conversation[]) => void;
  onClearAllConversations: () => void;
}

type TabType = 'providers' | 'persona' | 'appearance' | 'tools' | 'data';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  conversations,
  onImportConversations,
  onClearAllConversations,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('providers');
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
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
      const configObj = (tempSettings.providers[provider] as any) || {};
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

  const updateProvider = (provider: 'gemini' | 'openai' | 'anthropic' | 'custom', field: string, value: string) => {
    setTempSettings({
      ...tempSettings,
      providers: {
        ...tempSettings.providers,
        [provider]: {
          ...tempSettings.providers[provider],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col sm:flex-row overflow-hidden text-zinc-100 h-[85vh] sm:h-auto sm:max-h-[85vh]">
        
        {/* Sidebar Tabs */}
        <div className="w-full sm:w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-bold">تنظیمات سیستم</h2>
            <button onClick={onClose} className="sm:hidden p-2 hover:bg-zinc-800 rounded-full">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex sm:flex-col sm:p-3 p-2 gap-2 sm:gap-1 overflow-x-auto">
            <TabButton active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} icon={<Globe className="w-4 h-4 shrink-0" />} label="ارائه‌دهندگان" />
            <TabButton active={activeTab === 'persona'} onClick={() => setActiveTab('persona')} icon={<UserCircle className="w-4 h-4 shrink-0" />} label="شخصی‌سازی" />
            <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Palette className="w-4 h-4 shrink-0" />} label="ظاهر و قالب" />
            <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={<Wrench className="w-4 h-4 shrink-0" />} label="ابزارها" />
            <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Save className="w-4 h-4 shrink-0" />} label="داده‌ها" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            
            {activeTab === 'providers' && (
              <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Cpu className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-bold">ارائه‌دهنده فعال</h3>
                    <p className="text-xs text-zinc-400">مدلی که پیام‌ها به آن ارسال می‌شود.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                  <ProviderSelectBox 
                    id="gemini" 
                    title="Gemini" 
                    active={tempSettings.providers.activeProvider === 'gemini'} 
                    onClick={() => setTempSettings({...tempSettings, providers: {...tempSettings.providers, activeProvider: 'gemini'}})} 
                  />
                  <ProviderSelectBox 
                    id="openai" 
                    title="OpenAI" 
                    active={tempSettings.providers.activeProvider === 'openai'} 
                    onClick={() => setTempSettings({...tempSettings, providers: {...tempSettings.providers, activeProvider: 'openai'}})} 
                  />
                  <ProviderSelectBox 
                    id="anthropic" 
                    title="Anthropic" 
                    active={tempSettings.providers.activeProvider === 'anthropic'} 
                    onClick={() => setTempSettings({...tempSettings, providers: {...tempSettings.providers, activeProvider: 'anthropic'}})} 
                  />
                  <ProviderSelectBox 
                    id="custom" 
                    title="Custom (OpenRouter)" 
                    active={tempSettings.providers.activeProvider === 'custom'} 
                    onClick={() => setTempSettings({...tempSettings, providers: {...tempSettings.providers, activeProvider: 'custom'}})} 
                  />
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
                  <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                    تنظیمات {tempSettings.providers.activeProvider.charAt(0).toUpperCase() + tempSettings.providers.activeProvider.slice(1)}
                  </h4>
                  
                  <div className="space-y-4">
                    {tempSettings.providers.activeProvider === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">آدرس پایه (Base URL)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><LinkIcon className="w-4 h-4" /></div>
                          <input type="text" dir="ltr" value={tempSettings.providers.custom.baseUrl} onChange={(e) => updateProvider('custom', 'baseUrl', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 outline-none transition-all font-mono" placeholder="https://openrouter.ai/api/v1" />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">کلید دسترسی (API Key)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Key className="w-4 h-4" /></div>
                        <input type="password" dir="ltr" value={(tempSettings.providers as any)[tempSettings.providers.activeProvider].apiKey} onChange={(e) => updateProvider(tempSettings.providers.activeProvider, 'apiKey', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 outline-none transition-all font-mono" placeholder="sk-..." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">مدل انتخابی (Model)</label>
                      {tempSettings.providers.activeProvider === 'gemini' ? (
                        <div className="space-y-2">
                          <select 
                            value={['gemini-2.5-flash', 'gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-1.5-pro'].includes(tempSettings.providers.gemini.modelName) ? tempSettings.providers.gemini.modelName : 'custom'} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== 'custom') {
                                updateProvider('gemini', 'modelName', val);
                              } else {
                                updateProvider('gemini', 'modelName', ''); // Reset to empty for custom entry
                              }
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-blue-500 min-h-[44px]"
                          >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (همه‌فن‌حریف و سریع - پیش‌فرض)</option>
                            <option value="gemini-3.1-pro">Gemini 3.1 Pro (استدلال پیشرفته و کدنویسی)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (کانتکست طولانی و استدلال بالا)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (کانتکست طولانی و اسناد حجیم)</option>
                            <option value="custom">سفارشی / مدل دیگر...</option>
                          </select>
                          {(!['gemini-2.5-flash', 'gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-1.5-pro'].includes(tempSettings.providers.gemini.modelName)) && (
                            <input type="text" dir="ltr" value={tempSettings.providers.gemini.modelName} onChange={(e) => updateProvider('gemini', 'modelName', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition-all font-mono min-h-[44px]" placeholder="مثال: gemini-2.5-pro" />
                          )}
                        </div>
                      ) : (
                        <input type="text" dir="ltr" value={(tempSettings.providers as any)[tempSettings.providers.activeProvider].modelName} onChange={(e) => updateProvider(tempSettings.providers.activeProvider, 'modelName', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition-all font-mono min-h-[44px]" />
                      )}
                    </div>

                    {tempSettings.providers.activeProvider === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">هدرهای سفارشی (JSON)</label>
                        <textarea dir="ltr" value={tempSettings.providers.custom.customHeaders} onChange={(e) => updateProvider('custom', 'customHeaders', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition-all font-mono h-24 resize-none" placeholder='{"HTTP-Referer": "https://myapp.com"}' />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <button type="button" onClick={() => handleTestConnection(tempSettings.providers.activeProvider)} disabled={testing} className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center justify-center gap-2">
                      {testing ? <><div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin" /> بررسی ارتباط...</> : <><Globe className="w-4 h-4" /> تست اتصال</>}
                    </button>
                    {testResult && (
                      <div className={`flex-1 w-full p-2.5 rounded-xl text-sm flex items-start sm:items-center justify-start gap-2 ${testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
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
                  <label className="block text-sm font-medium text-zinc-300 mb-2">لحن پایه</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['friendly', 'formal', 'expert'].map((tone) => (
                      <button key={tone} onClick={() => setTempSettings({...tempSettings, persona: {...tempSettings.persona, tone: tone as any}})} className={`py-2 rounded-xl border text-sm font-medium transition-all ${tempSettings.persona.tone === tone ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                        {tone === 'friendly' ? 'دوستانه' : tone === 'formal' ? 'رسمی' : 'تخصصی'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">دستورالعمل سیستم (System Prompt)</label>
                  <textarea value={tempSettings.persona.systemPrompt} onChange={(e) => setTempSettings({...tempSettings, persona: {...tempSettings.persona, systemPrompt: e.target.value}})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 outline-none transition-all h-32 resize-none" placeholder="مثال: شما یک متخصص برنامه‌نویسی هستید..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 flex justify-between">
                    <span>خلاقیت (Temperature)</span>
                    <span className="text-blue-400 font-mono">{tempSettings.persona.temperature}</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={tempSettings.persona.temperature} onChange={(e) => setTempSettings({...tempSettings, persona: {...tempSettings.persona, temperature: parseFloat(e.target.value)}})} className="w-full accent-blue-500" />
                  <div className="flex justify-between text-xs text-zinc-500 mt-2">
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
                    <label className="block text-sm font-medium text-zinc-300 mb-2">فونت فارسی</label>
                    <select value={tempSettings.appearance.font} onChange={(e) => setTempSettings({...tempSettings, appearance: {...tempSettings.appearance, font: e.target.value}})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-blue-500">
                      <option value="vazir">وزیرمتن (Vazirmatn)</option>
                      <option value="estedad">استعداد (Estedad)</option>
                      <option value="sahel">ساحل (Sahel)</option>
                      <option value="shabnam">شبنم (Shabnam)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">پوسته</label>
                    <select value={tempSettings.appearance.theme} onChange={(e) => setTempSettings({...tempSettings, appearance: {...tempSettings.appearance, theme: e.target.value as any}})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-blue-500">
                      <option value="dark">تاریک (Dark)</option>
                      <option value="light">روشن (Light)</option>
                      <option value="system">خودکار (System)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 flex justify-between">
                    <span>اندازه قلم</span>
                    <span className="text-blue-400 font-mono">{tempSettings.appearance.fontSize}px</span>
                  </label>
                  <input type="range" min="12" max="24" step="1" value={tempSettings.appearance.fontSize} onChange={(e) => setTempSettings({...tempSettings, appearance: {...tempSettings.appearance, fontSize: parseInt(e.target.value, 10)}})} className="w-full accent-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div>
                    <div className="font-medium text-sm">اعداد فارسی</div>
                    <div className="text-xs text-zinc-400">نمایش تمام اعداد لاتین به صورت فارسی</div>
                  </div>
                  <ToggleSwitch checked={tempSettings.appearance.persianNumerals} onChange={(v) => setTempSettings({...tempSettings, appearance: {...tempSettings.appearance, persianNumerals: v}})} />
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold">ابزارهای جانبی</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">جستجوی زنده وب (Web Search)</div>
                      <div className="text-xs text-zinc-400">جستجوی آنلاین برای اطلاعات به‌روز</div>
                    </div>
                    <ToggleSwitch checked={tempSettings.tools.webSearch} onChange={(v) => setTempSettings({...tempSettings, tools: {...tempSettings.tools, webSearch: v}})} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">ارسال با Enter</div>
                      <div className="text-xs text-zinc-400">ارسال پیام با فشردن کلید Enter</div>
                    </div>
                    <ToggleSwitch checked={tempSettings.tools.enterToSend} onChange={(v) => setTempSettings({...tempSettings, tools: {...tempSettings.tools, enterToSend: v}})} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">نمایش آمار عملکرد</div>
                      <div className="text-xs text-zinc-400">محاسبه توکن‌ها و هزینه‌ها</div>
                    </div>
                    <ToggleSwitch checked={tempSettings.tools.showPerformanceMetrics} onChange={(v) => setTempSettings({...tempSettings, tools: {...tempSettings.tools, showPerformanceMetrics: v}})} />
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
                    <button className="flex-1 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 transition-colors">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Download className="w-5 h-5" /></div>
                      <div className="text-right">
                        <div className="font-medium text-sm">دریافت نسخه پشتیبان (Export)</div>
                        <div className="text-xs text-zinc-400">دانلود تمام گفتگوها و تنظیمات</div>
                      </div>
                    </button>
                    
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 transition-colors relative overflow-hidden">
                      <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleFileImport} 
                        className="hidden" 
                      />
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Upload className="w-5 h-5" /></div>
                      <div className="text-right">
                        <div className="font-medium text-sm">بازیابی نسخه پشتیبان (Import)</div>
                        <div className="text-xs text-zinc-400">فایل JSON پشتیبان خود را انتخاب کنید</div>
                      </div>
                    </button>
                  </div>
                  {importStatus && (
                    <div className={`p-3 rounded-xl text-sm font-medium ${importStatus.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {importStatus.message}
                    </div>
                  )}

                  <button onClick={onClearAllConversations} className="w-full p-4 bg-red-950/30 border border-red-900/50 hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors text-red-400">
                    <div className="p-2 bg-red-500/10 rounded-lg"><Trash2 className="w-5 h-5" /></div>
                    <div className="text-right">
                      <div className="font-medium text-sm text-red-400">پاک‌سازی تاریخچه گفتگوها</div>
                      <div className="text-xs text-red-500/70">این عملیات غیرقابل بازگشت است</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-300 hover:bg-zinc-900 transition-colors">انصراف</button>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Save className="w-4 h-4" /> ذخیره و اعمال
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
    className={`flex shrink-0 sm:w-full items-center gap-2 sm:gap-3 px-3 py-2 sm:py-3 rounded-xl transition-all text-xs sm:text-sm font-medium ${active ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const ProviderSelectBox = ({ id, title, active, onClick }: { id: string, title: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-2 sm:p-3 rounded-xl border text-center transition-all ${active ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'}`}
  >
    <div className="text-xs sm:text-sm font-bold truncate">{title}</div>
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
