const fs = require('fs');

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

content = content.replace(/\(\['openai', 'anthropic', 'custom'\] as ApiProvider\[\]\)\.map/g, `(['gemini', 'openai', 'anthropic', 'custom'] as ApiProvider[]).map`);

content = content.replace(/tab === 'openai' \? 'OpenAI' : tab === 'anthropic' \? 'Anthropic' : 'Custom \/ OpenRouter'/, `tab === 'gemini' ? 'Google Gemini' : tab === 'openai' ? 'OpenAI' : tab === 'anthropic' ? 'Anthropic' : 'Custom / OpenRouter'`);

const geminiContent = `{activeTab === 'gemini' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">کلید دسترسی (API Key)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500"><Key className="w-4 h-4" /></div>
                  <input
                    type="password"
                    dir="ltr"
                    value={tempConfig.gemini?.apiKey || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, gemini: { ...tempConfig.gemini, apiKey: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="AIzaSy..."
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
                    value={tempConfig.gemini?.modelName || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, gemini: { ...tempConfig.gemini, modelName: e.target.value } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                    placeholder="gemini-2.5-flash"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'openai' && (`;

content = content.replace(/\{activeTab === 'openai' && \(/, geminiContent);

// Fix initial state
content = content.replace(/useState<ApiProvider>\(apiConfig.activeProvider \|\| 'openai'\)/, `useState<ApiProvider>(apiConfig.activeProvider || 'gemini')`);
content = content.replace(/setActiveTab\(apiConfig.activeProvider \|\| 'openai'\)/, `setActiveTab(apiConfig.activeProvider || 'gemini')`);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
