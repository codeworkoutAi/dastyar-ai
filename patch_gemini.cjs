const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const originalModelInput = `                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">مدل انتخابی (Model)</label>
                      <input type="text" dir="ltr" value={(tempSettings.providers as any)[tempSettings.providers.activeProvider].modelName} onChange={(e) => updateProvider(tempSettings.providers.activeProvider, 'modelName', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition-all font-mono" />
                    </div>`;

const newModelInput = `                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">مدل انتخابی (Model)</label>
                      {tempSettings.providers.activeProvider === 'gemini' ? (
                        <div className="space-y-2">
                          <select 
                            value={['gemini-3.7-flash', 'gemini-3.1-pro', 'gemini-3.5-flash-lite', 'gemini-1.5-pro'].includes(tempSettings.providers.gemini.modelName) ? tempSettings.providers.gemini.modelName : 'custom'} 
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
                            <option value="gemini-3.7-flash">Gemini 3.7 Flash (همه‌فن‌حریف و سریع - پیش‌فرض)</option>
                            <option value="gemini-3.1-pro">Gemini 3.1 Pro (استدلال پیشرفته و کدنویسی)</option>
                            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (فوق‌سریع و سبک)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (کانتکست طولانی و اسناد حجیم)</option>
                            <option value="custom">سفارشی / مدل دیگر...</option>
                          </select>
                          {(!['gemini-3.7-flash', 'gemini-3.1-pro', 'gemini-3.5-flash-lite', 'gemini-1.5-pro'].includes(tempSettings.providers.gemini.modelName)) && (
                            <input type="text" dir="ltr" value={tempSettings.providers.gemini.modelName} onChange={(e) => updateProvider('gemini', 'modelName', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition-all font-mono min-h-[44px]" placeholder="مثال: gemini-2.5-pro" />
                          )}
                        </div>
                      ) : (
                        <input type="text" dir="ltr" value={(tempSettings.providers as any)[tempSettings.providers.activeProvider].modelName} onChange={(e) => updateProvider(tempSettings.providers.activeProvider, 'modelName', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition-all font-mono min-h-[44px]" />
                      )}
                    </div>`;

code = code.replace(originalModelInput, newModelInput);
fs.writeFileSync('src/components/SettingsModal.tsx', code);
