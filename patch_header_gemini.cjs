const fs = require('fs');

let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const switchRegex = /switch\s*\(\s*apiConfig\.activeProvider\s*\)\s*\{/;
content = content.replace(switchRegex, `switch (apiConfig.activeProvider) {\n    case 'gemini':\n      return <div className="w-5 h-5 rounded-md gemini-gradient-bg flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5 text-white" /></div>;`);

if (!content.includes('Sparkles')) {
  content = content.replace(/import {([^}]*)} from 'lucide-react';/g, (match, p1) => {
    let imports = p1.split(',').map(s => s.trim());
    if (!imports.includes('Sparkles')) imports.push('Sparkles');
    return `import { ${imports.join(', ')} } from 'lucide-react';`;
  });
}

fs.writeFileSync('src/components/Header.tsx', content);
