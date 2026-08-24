const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/if \(provider === 'gemini_default' \|\| provider === 'gemini_custom_key'\)/g, `if (provider === 'gemini')`);
content = content.replace(/const ai = getGeminiClient\(provider === 'gemini_custom_key' \? apiConfig\?\.\[provider\]\?\.apiKey : undefined\);/g, `const ai = getGeminiClient(apiConfig?.[provider]?.apiKey);`);
content = content.replace(/apiConfig\.customBaseUrl/g, `apiConfig?.[provider]?.baseUrl`);

// Test endpoints fallback for gemini (in check-models)
content = content.replace(/if \(provider === 'gemini_default' \|\| provider === 'gemini_custom_key'\)/g, `if (provider === 'gemini')`);
content = content.replace(/const ai = getGeminiClient\(provider === 'gemini_custom_key' \? apiKey : undefined\);/g, `const ai = getGeminiClient(apiKey);`);

fs.writeFileSync('server.ts', content);
