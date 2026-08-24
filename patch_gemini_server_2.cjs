const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/!isSafeBaseUrl\(apiConfig\.customBaseUrl\)/g, `!isSafeBaseUrl(apiConfig?.[provider]?.baseUrl)`);
fs.writeFileSync('server.ts', content);
