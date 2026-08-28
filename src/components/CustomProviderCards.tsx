import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Link as LinkIcon, Key, RefreshCcw, Activity, X, Search } from 'lucide-react';
import { AppSettings, CustomProfile } from '../types';

interface CustomProviderCardsProps {
  tempSettings: AppSettings;
  setTempSettings: (settings: AppSettings) => void;
  cachedModels: {id: string, name?: string}[];
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

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profiles.map(profile => {
          const isActive = profile.id === activeProfileId;
          return (
            <div 
              key={profile.id}
              onClick={() => handleSelectActive(profile.id)}
              className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 overflow-hidden group ${
                isActive 
                  ? 'bg-zinc-800/60 border-zinc-500 shadow-md' 
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {isActive && (
                <div className="absolute top-4 left-4 w-2 h-2 bg-zinc-300 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-zinc-100 text-sm truncate pr-1 pl-6">{profile.name}</h5>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingProfileId(profile.id); }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteProfile(profile.id, e)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono truncate">
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate bg-zinc-900 px-1.5 py-0.5 rounded text-[11px]">{profile.modelName || 'بدون مدل'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono truncate">
                  <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" dir="ltr">{profile.baseUrl ? profile.baseUrl.replace(/^https?:\/\//, '') : 'بدون آدرس'}</span>
                </div>
              </div>
            </div>
          );
        })}
        
        <div 
          onClick={handleCreateNew}
          className="cursor-pointer rounded-2xl p-4 border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950/30 hover:bg-zinc-900/50 transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] text-zinc-500 hover:text-zinc-300"
        >
          <Plus className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">افزودن ارائه‌دهنده</span>
        </div>
      </div>

      {editingProfile && (
        <div className="mt-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 animate-fadeIn">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800/50">
            <h5 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> ویرایش پروفایل
            </h5>
            <button onClick={() => setEditingProfileId(null)} className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-900">بستن</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">نام پروفایل</label>
              <input 
                type="text" 
                value={editingProfile.name} 
                onChange={(e) => handleUpdateProfile(editingProfile.id, { name: e.target.value })} 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm focus:border-zinc-500 outline-none transition-all" 
                placeholder="مثال: سرور شخصی" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">آدرس پایه (Base URL)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><LinkIcon className="w-4 h-4" /></div>
                <input 
                  type="text" 
                  dir="ltr" 
                  value={editingProfile.baseUrl} 
                  onChange={(e) => handleUpdateProfile(editingProfile.id, { baseUrl: e.target.value })} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pr-9 pl-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono" 
                  placeholder="https://api.openai.com/v1" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">کلید دسترسی (API Key)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Key className="w-4 h-4" /></div>
                <input 
                  type="password" 
                  dir="ltr" 
                  value={editingProfile.apiKey} 
                  onChange={(e) => handleUpdateProfile(editingProfile.id, { apiKey: e.target.value })} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pr-9 pl-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono" 
                  placeholder="sk-..." 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">مدل انتخابی (Model)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    dir="ltr"
                    value={editingProfile.modelName} 
                    onChange={(e) => handleUpdateProfile(editingProfile.id, { modelName: e.target.value })} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono" 
                    placeholder="e.g. anthropic/claude-3-opus"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={async () => {
                    handleSelectActive(editingProfile.id);
                    await handleFetchModels(editingProfile);
                    setShowFetchedList(true);
                  }} 
                  disabled={fetchingModels} 
                  className="px-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center justify-center shrink-0 min-w-[40px]" 
                  title="دریافت لیست مدل‌ها (متنی)"
                >
                  {fetchingModels ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Read-only Text Area for Fetched Models (Collapsible) */}
            {showFetchedList && (
              <div className="animate-fadeIn bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3">
                <details className="group" open>
                  <summary className="flex items-center justify-between text-xs font-medium text-indigo-400 cursor-pointer select-none outline-none">
                    <span className="flex items-center gap-2">
                      <RefreshCcw className="w-3.5 h-3.5" /> لیست مدل‌های دریافت‌شده
                    </span>
                    <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-zinc-800/50">
                    <textarea 
                      readOnly
                      dir="ltr"
                      className={`w-full bg-zinc-950 border ${fetchError ? 'border-red-900/50 text-red-400' : 'border-zinc-800 text-zinc-300'} rounded-lg py-2 px-3 text-xs outline-none font-mono h-40 resize-y`}
                      value={fetchingModels ? 'در حال دریافت اطلاعات از سرور...' : (cachedModels.length > 0 ? cachedModels.map((m, i) => `${i + 1}. ${m.name}\n   ID: ${m.id}`).join('\n\n') : (fetchError || 'هیچ مدلی یافت نشد. لطفاً آدرس و کلید API را بررسی کنید.'))}
                    />
                    <div className="text-[10px] text-zinc-500 mt-2">آیدی مدل مورد نظر را از کادر بالا کپی کرده و در فیلد مدل بنویسید.</div>
                  </div>
                </details>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">هدرهای سفارشی (JSON)</label>
              <textarea 
                dir="ltr" 
                value={editingProfile.customHeaders} 
                onChange={(e) => handleUpdateProfile(editingProfile.id, { customHeaders: e.target.value })} 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm focus:border-zinc-500 outline-none transition-all font-mono h-20 resize-none" 
                placeholder='{"HTTP-Referer": "https://myapp.com"}' 
              />
            </div>
            
            <button 
              onClick={() => {
                setEditingProfileId(null);
                setShowFetchedList(false);
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-sm transition-colors mt-2"
            >
              تایید و بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
