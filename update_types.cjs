const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/export type ApiProvider =[^;]+;/, `export type ApiProvider = 'openai' | 'anthropic' | 'custom';`);

const oldApiConfigRegex = /export interface ApiConfig \{[\s\S]*?\n\}/;
const newApiConfig = `export interface ApiConfig {
  activeProvider: ApiProvider;
  openai: { apiKey: string; modelName: string };
  anthropic: { apiKey: string; modelName: string };
  custom: { baseUrl: string; apiKey: string; modelName: string; customHeaders: string };
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  streamResponse: boolean;
}`;

content = content.replace(oldApiConfigRegex, newApiConfig);

fs.writeFileSync('src/types.ts', content);
