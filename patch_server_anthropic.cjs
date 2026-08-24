const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const normalizeBaseUrlReplacer = `
  if (provider === 'deepseek') {
    if (!clean) return 'https://api.deepseek.com';
  } else if (provider === 'openai') {
    if (!clean) return 'https://api.openai.com/v1';
  } else if (provider === 'openrouter') {
    if (!clean) return 'https://openrouter.ai/api/v1';
  } else if (provider === 'anthropic') {
    if (!clean) return 'https://api.anthropic.com/v1';
  }
`;
content = content.replace(/if \(provider === 'deepseek'\) \{[\s\S]*?\} else if \(provider === 'openrouter'\) \{[\s\S]*?\}/, normalizeBaseUrlReplacer);

// For anthropic, the endpoint is /messages, not /chat/completions.
// Let's modify where `endpoint` is defined in /api/ping.
content = content.replace(/const endpoint = \`\$\{baseUrl\}\/chat\/completions\`;/g, `const endpoint = provider === 'anthropic' ? \`\$\{baseUrl\}/messages\` : \`\$\{baseUrl\}/chat/completions\`;`);

// For headers in /api/ping
const headersReplacer = `
      if (apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = \`Bearer \${apiKey}\`;
        }
      }
`;
content = content.replace(/if \(apiKey\) \{\s*headers\['Authorization'\] = \`Bearer \$\{apiKey\}\`;\s*\}/g, headersReplacer);

// For body in /api/ping
const bodyReplacer = `
          body: JSON.stringify(provider === 'anthropic' ? {
            model,
            messages: [{ role: 'user', content: 'Say "connected" in Persian (متصل شد)' }],
            max_tokens: 15,
          } : {
            model,
            messages: [{ role: 'user', content: 'Say "connected" in Persian (متصل شد)' }],
            max_tokens: 15,
          }),
`;
content = content.replace(/body: JSON\.stringify\(\{[\s\S]*?max_tokens: 15,\s*\}\),/g, bodyReplacer);

// Also we need to fix `/api/chat/stream` for Anthropic!
// In chat stream, endpoint is set around line 950.
// Wait, the regexes above used /g so they probably patched both /api/ping AND /api/chat/stream !! Let's verify.

fs.writeFileSync('server.ts', content);
