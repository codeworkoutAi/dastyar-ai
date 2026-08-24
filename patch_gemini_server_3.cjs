const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/let provider = apiConfig\?\.activeProvider \|\| 'openai';/, `let provider = apiConfig?.activeProvider || 'gemini';`);
fs.writeFileSync('server.ts', content);
