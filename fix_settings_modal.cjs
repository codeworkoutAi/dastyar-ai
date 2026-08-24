const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

content = content.replace(/const configObj = tempConfig\[provider\] \|\| \{\};/, 'const configObj = (tempConfig[provider] as any) || {};');

if (!content.includes('Globe,')) {
  content = content.replace(/import {([^}]*)} from 'lucide-react';/, (match, p1) => {
    return "import { Globe, " + p1 + "} from 'lucide-react';";
  });
}

fs.writeFileSync('src/components/SettingsModal.tsx', content);
