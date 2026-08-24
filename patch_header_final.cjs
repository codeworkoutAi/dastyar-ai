const fs = require('fs');
let headerContent = fs.readFileSync('src/components/Header.tsx', 'utf8');
headerContent = headerContent.replace(/apiConfig\.activeProvider !== 'gemini_default'/g, 'true');
headerContent = headerContent.replace(/apiConfig\.activeProvider === 'gemini_default'/g, 'false');
fs.writeFileSync('src/components/Header.tsx', headerContent);
