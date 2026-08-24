const fs = require('fs');

// Patch App.tsx
let contentApp = fs.readFileSync('src/App.tsx', 'utf8');
contentApp = contentApp.replace(/if\s*\(apiConfig\.activeProvider === 'gemini_default'\s*\|\|\s*apiConfig\.activeProvider === 'gemini_custom_key'\)/g, 'if (false)');
fs.writeFileSync('src/App.tsx', contentApp);

// Patch Header.tsx
let contentHeader = fs.readFileSync('src/components/Header.tsx', 'utf8');
contentHeader = contentHeader.replace(/apiConfig\.activeProvider === 'gemini_default'/g, 'false');
contentHeader = contentHeader.replace(/<Bot /g, '<Code2 ');
contentHeader = contentHeader.replace(/<Globe /g, '<Globe ');
if (!contentHeader.includes('Code2')) {
  contentHeader = contentHeader.replace(/import {/, 'import { Code2, Globe,');
}
fs.writeFileSync('src/components/Header.tsx', contentHeader);
