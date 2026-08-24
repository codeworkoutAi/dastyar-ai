const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the buffered streamResponse with actual streaming
const oldStreamLogic = `
            let fullText = '';
            for await (const chunk of streamResponse) {
              const text = chunk.text;
              if (text) {
                fullText += text;
              }
            }
`;

const newStreamLogic = `
            let fullText = '';
            for await (const chunk of streamResponse) {
              const text = chunk.text;
              if (text) {
                fullText += text;
                sendChunk({ chunk: text });
                hasSentAnyChunk = true;
              }
            }
`;
code = code.replace(oldStreamLogic, newStreamLogic);

// Replace the sending logic for imageUrl to avoid suppressing text (since it's already sent)
const oldSendLogic = `
            if (targetImagePrompt) {
              console.log('[ImageGen] 🎯 Target image prompt identified:', targetImagePrompt);
              const enhancedPrompt = await translateAndEnhanceImagePrompt(targetImagePrompt);
              const imageUrl = getPollinationsImageUrl(enhancedPrompt);
              console.log('[ImageGen] 🖼️ Image generated successfully. Suppressing text output, sending imageUrl to client.');
              hasSentAnyChunk = true;
              sendChunk({ imageUrl });
            } else {
              hasSentAnyChunk = true;
              sendChunk({ chunk: fullText });
            }
`;

const newSendLogic = `
            if (targetImagePrompt) {
              console.log('[ImageGen] 🎯 Target image prompt identified:', targetImagePrompt);
              const enhancedPrompt = await translateAndEnhanceImagePrompt(targetImagePrompt);
              const imageUrl = getPollinationsImageUrl(enhancedPrompt);
              console.log('[ImageGen] 🖼️ Image generated successfully. Sending imageUrl to client.');
              sendChunk({ imageUrl });
            }
`;
code = code.replace(oldSendLogic, newSendLogic);

fs.writeFileSync('server.ts', code);
