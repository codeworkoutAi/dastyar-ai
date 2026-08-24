const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/.*console\.log\(\'\[ImageGen\].*\n/g, '');
content = content.replace(/.*console\.log\(\`\[ImageGen API\].*\n/g, '');

fs.writeFileSync('server.ts', content);
