const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Modify the provider determination
content = content.replace(
  /let provider = apiConfig\?\.provider \|\| 'gemini_default';[\s\S]*?const baseSystemPrompt/,
  `let provider = apiConfig?.activeProvider || 'openai';
    const baseSystemPrompt`
);

// We need to change the parts that used to read apiConfig.customApiKey, etc.
content = content.replace(/apiConfig\?\.customBaseUrl/g, `apiConfig?.[provider]?.baseUrl`);
content = content.replace(/apiConfig\?\.customApiKey/g, `apiConfig?.[provider]?.apiKey`);
content = content.replace(/apiConfig\.customApiKey/g, `apiConfig[provider]?.apiKey`);
content = content.replace(/apiConfig\?\.modelName/g, `apiConfig?.[provider]?.modelName`);
content = content.replace(/apiConfig\?\.customHeaders/g, `apiConfig?.custom?.customHeaders`);

fs.writeFileSync('server.ts', content);
