const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Fix headers in /api/chat/stream
const streamHeadersReplacer = `
      if (apiConfig?.[provider]?.apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = String(apiConfig[provider].apiKey).trim();
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = \`Bearer \${String(apiConfig[provider]?.apiKey).trim()}\`;
        }
      }
`;
// Replace the old authorization header block
content = content.replace(/if \(apiConfig\?\.\[provider\]\?\.apiKey\) \{\s*headers\['Authorization'\] = \`Bearer \$\{String\(apiConfig\[provider\]\?\.apiKey\)\.trim\(\)\}\`;\s*\}/g, streamHeadersReplacer);

// 2. Format Anthropic body
// Currently, formattedMessages includes system instruction as `{ role: 'system', content: systemInstruction }`
// Anthropic requires `system` as a top-level string property and does NOT allow `role: 'system'` inside messages.
// And Anthropic's image payload is different, it needs `{ type: 'image', source: { type: 'base64', media_type: mimeType, data: cleanBase64 } }` instead of `{ type: 'image_url', image_url: { url: ... } }`.
// Since the prompt says "Support all 4 endpoints (GoogleGenAI, OpenAI, Anthropic, and Custom baseURL)", I need to implement Anthropic correctly.
// Let's modify the body building part.

const buildBodyReplacer = `
      let requestBody: any = {};
      if (provider === 'anthropic') {
        const anthropicMessages = prunedMessages.map((m: any, index: number) => {
          const isCurrentTurn = index === prunedMessages.length - 1;
          const textContent = typeof m.content === 'string' ? m.content : '';
          
          // Anthropic role can only be 'user' or 'assistant'.
          const role = m.role === 'assistant' ? 'assistant' : 'user';

          if (m.imageUrl && isCurrentTurn) {
            const matches = m.imageUrl.match(/^data:(.+?);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mimeType = matches[1];
              let cleanBase64 = matches[2].replace(/^(?:data:[^;]+;base64,)+/, '').replace(/^base64[:,]/, '').trim();
              if (mimeType.startsWith('image/')) {
                return {
                  role,
                  content: [
                    { type: 'text', text: textContent || 'تصویر:' },
                    { type: 'image', source: { type: 'base64', media_type: mimeType, data: cleanBase64 } }
                  ]
                };
              }
            }
          }
          return { role, content: textContent };
        });

        requestBody = {
          model: model || 'claude-3-5-sonnet-20241022',
          messages: anthropicMessages,
          system: systemInstruction,
          max_tokens: typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0 ? apiConfig.maxTokens : 1024,
          temperature: typeof apiConfig?.temperature === 'number' ? apiConfig.temperature : 0.7,
          stream: true,
        };
      } else {
        requestBody = {
          model: model || 'gpt-4o-mini',
          messages: formattedMessages,
          stream: true,
          temperature: typeof apiConfig?.temperature === 'number' ? apiConfig.temperature : 0.7,
          max_tokens: typeof apiConfig?.maxTokens === 'number' && apiConfig.maxTokens > 0 ? apiConfig.maxTokens : 1024,
        };
      }
`;

// Replace `const requestBody = { ... }` in /api/chat/stream
content = content.replace(/const requestBody = \{\s*model,\s*messages: formattedMessages,\s*stream: true,\s*temperature:[\s\S]*?max_tokens:[\s\S]*?\} as any;/g, buildBodyReplacer);

// Let's also patch the stream reader if Anthropic response format differs.
// OpenAI format emits: `data: {"choices":[{"delta":{"content":"..."}}]}`
// Anthropic emits: `data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}`

const streamParserReplacer = `
                let chunkText = '';
                if (parsed.choices?.[0]?.delta?.content) {
                  chunkText = parsed.choices[0].delta.content;
                } else if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  chunkText = parsed.choices[0].delta.reasoning_content;
                } else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  chunkText = parsed.delta.text;
                }

                if (chunkText) {
                  fullText += chunkText;
                  sendChunk({ chunk: chunkText });
                }
`;

content = content.replace(/if \(parsed\.choices\?\.\[0\]\?\.delta\?\.content\) \{[\s\S]*?sendChunk\(\{ chunk: parsed\.choices\[0\]\.delta\.reasoning_content \}\);\s*\}/g, streamParserReplacer);


fs.writeFileSync('server.ts', content);
