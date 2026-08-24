const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Key, Link as LinkIcon, Cpu, AlertCircle, Save } from 'lucide-react';
import { ApiConfig, ApiProvider, AppSettings, Conversation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: ApiConfig;
  onSaveApiConfig: (config: ApiConfig) => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  conversations: Conversation[];
  onImportConversations: (imported: Conversation[]) => void;
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiConfig,
  onSaveApiConfig,
}) => {
  const [tempConfig, setTempConfig] = useState<ApiConfig>(apiConfig);
  const [activeTab, setActiveTab] = useState<ApiProvider>(apiConfig.activeProvider || 'openai');

  useEffect(() => {
    if (isOpen) {
      setTempConfig(apiConfig);
      setActiveTab(apiConfig.activeProvider || 'openai');
    }
  }, [isOpen, apiConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Ensure activeProvider matches the selected tab when saving
    onSaveApiConfig({ ...tempConfig, activeProvider: activeTab });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تنظیمات هوش مصنوعی</h2>
              <p className="text-xs text-zinc-400">پیکربندی ارائه‌دهندگان و کلیدهای دسترسی</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50">
          {(['openai', 'anthropic', 'custom'] as ApiProvider[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={\`flex-1 py-4 px-4 text-sm font-semibold transition-all border-b-2 \${activeTab === tab ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}\`}
            >
              {tab === 'openai' ? 'OpenAI' : tab === 'anthropic' ? 'Anthropic' : 'Custom / OpenRouter'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-zinc-900">
          {activeTab === 'openai' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">کلید دسترسی (API Key)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Key className="w-4 h-4" /></div>
                  <input
                    type="password"
                    dir="ltr"
                    value={tempConfig.openai?.apiKey || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, openai: { ...tempConfig.openai, apiKey: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="sk-..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">مدل (Model)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Cpu className="w-4 h-4" /></div>
                  <input
                    type="text"
                    dir="ltr"
                    value={tempConfig.openai?.modelName || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, openai: { ...tempConfig.openai, modelName: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="gpt-4o-mini"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anthropic' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">کلید دسترسی (API Key)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Key className="w-4 h-4" /></div>
                  <input
                    type="password"
                    dir="ltr"
                    value={tempConfig.anthropic?.apiKey || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, anthropic: { ...tempConfig.anthropic, apiKey: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="sk-ant-..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">مدل (Model)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Cpu className="w-4 h-4" /></div>
                  <input
                    type="text"
                    dir="ltr"
                    value={tempConfig.anthropic?.modelName || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, anthropic: { ...tempConfig.anthropic, modelName: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="claude-3-5-sonnet"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">آدرس پایه (Base URL)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><LinkIcon className="w-4 h-4" /></div>
                  <input
                    type="text"
                    dir="ltr"
                    value={tempConfig.custom?.baseUrl || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, custom: { ...tempConfig.custom, baseUrl: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="https://openrouter.ai/api/v1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">کلید دسترسی (API Key)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Key className="w-4 h-4" /></div>
                  <input
                    type="password"
                    dir="ltr"
                    value={tempConfig.custom?.apiKey || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, custom: { ...tempConfig.custom, apiKey: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="Bearer token"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">مدل (Model)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Cpu className="w-4 h-4" /></div>
                  <input
                    type="text"
                    dir="ltr"
                    value={tempConfig.custom?.modelName || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, custom: { ...tempConfig.custom, modelName: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="meta-llama/llama-3.3-70b-instruct"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">هدرهای سفارشی (JSON)</label>
                <textarea
                  dir="ltr"
                  value={tempConfig.custom?.customHeaders || ''}
                  onChange={(e) => setTempConfig({ ...tempConfig, custom: { ...tempConfig.custom, customHeaders: e.target.value } })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono h-24 resize-none"
                  placeholder='{"HTTP-Referer": "https://myapp.com"}'
                />
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 flex gap-3 text-sm text-blue-300 mt-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="leading-relaxed">
              ارائه‌دهنده فعال شما بر اساس تب انتخاب شده هنگام فشردن دکمه ذخیره تعیین می‌شود. کلیدهای شما تنها در مرورگرتان ذخیره می‌شوند.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            ذخیره و اعمال
          </button>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/SettingsModal.tsx', content);
