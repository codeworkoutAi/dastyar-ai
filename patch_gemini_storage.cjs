const fs = require('fs');

let content = fs.readFileSync('src/lib/storage.ts', 'utf8');

const defaultRegex = /export const DEFAULT_API_CONFIG: ApiConfig = \{[\s\S]*?\};/;
const newDefault = `export const DEFAULT_API_CONFIG: ApiConfig = {
  activeProvider: 'gemini',
  gemini: { apiKey: '', modelName: 'gemini-2.5-flash' },
  openai: { apiKey: '', modelName: 'gpt-4o-mini' },
  anthropic: { apiKey: '', modelName: 'claude-3-5-sonnet' },
  custom: { baseUrl: '', apiKey: '', modelName: '', customHeaders: '' },
  temperature: 0.7,
  maxTokens: 4096,
  systemInstruction: 'شما یک دستیار هوشمند، بسیار مطلع و مودب فارسی‌زبان هستید. همیشه پاسخ‌ها را به زبان فارسی روان، دقیق و با ساختاربندی خوانا و مرتب ارائه دهید. در صورتی که نیاز به کدنویسی یا اصطلاحات انگلیسی باشد، آن‌ها را در بلوک‌های کد مجزا یا پرانتز قرار دهید.',
  streamResponse: true,
};`;
content = content.replace(defaultRegex, newDefault);

content = content.replace(/activeProvider: apiConfig\.activeProvider,/, `activeProvider: apiConfig.activeProvider,\n        gemini: apiConfig.gemini,`);

fs.writeFileSync('src/lib/storage.ts', content);
