const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/export type ApiProvider = 'openai' \| 'anthropic' \| 'custom';/, `export type ApiProvider = 'gemini' | 'openai' | 'anthropic' | 'custom';`);

content = content.replace(/export interface ApiConfig \{[\s\S]*?\n\}/, `export interface ApiConfig {
  activeProvider: ApiProvider;
  gemini: { apiKey: string; modelName: string };
  openai: { apiKey: string; modelName: string };
  anthropic: { apiKey: string; modelName: string };
  custom: { baseUrl: string; apiKey: string; modelName: string; customHeaders: string };
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  streamResponse: boolean;
}`);

fs.writeFileSync('src/types.ts', content);
