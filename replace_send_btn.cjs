const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/MessageInput.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /className=\{\`flex items-center justify-center p-2\.5 sm:px-5 sm:py-2\.5 transition-all \$\{\n\s*text\.trim\(\)\n\s*\? 'clay-btn-primary font-bold cursor-pointer'\n\s*: 'clay-btn opacity-40 cursor-not-allowed rounded-2xl'\n\s*\}\`\}/g,
  `className={\`flex items-center justify-center p-2.5 sm:px-5 sm:py-2 transition-all rounded-full \${
                      text.trim()
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 font-medium cursor-pointer'
                        : 'bg-[var(--border-subtle)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                    }\`}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Send button modified successfully.');
