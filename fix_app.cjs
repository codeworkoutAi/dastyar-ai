const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/apiConfig\.activeProvider !== 'gemini_default' && apiConfig\.activeProvider !== 'gemini_custom_key'/g, 'false');
appContent = appContent.replace(/provider: 'gemini_default'/g, 'activeProvider: "openai"');
fs.writeFileSync('src/App.tsx', appContent);

let headerContent = fs.readFileSync('src/components/Header.tsx', 'utf8');
headerContent = headerContent.replace(/import {([^}]*)} from 'lucide-react';/g, (match, p1) => {
  let imports = p1.split(',').map(s => s.trim());
  if (!imports.includes('Code2')) imports.push('Code2');
  if (!imports.includes('Globe')) imports.push('Globe');
  return `import { ${imports.join(', ')} } from 'lucide-react';`;
});
headerContent = headerContent.replace(/apiConfig\.activeProvider === 'gemini_default'/g, 'false');
fs.writeFileSync('src/components/Header.tsx', headerContent);
