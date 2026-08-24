const fs = require('fs');

function patchApp(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // App.tsx has: if (apiConfig.activeProvider === 'gemini_default' || apiConfig.activeProvider === 'gemini_custom_key') {
  content = content.replace(/apiConfig\.activeProvider === 'gemini_default' \|\| apiConfig\.activeProvider === 'gemini_custom_key'/g, 'false'); // Remove old gemini checks
  fs.writeFileSync(filePath, content);
}

function patchHeader(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the switch statement inside getProviderIcon
  const switchRegex = /switch\s*\(\s*apiConfig\.activeProvider\s*\)\s*\{[\s\S]*?default:/;
  const newSwitch = `switch (apiConfig.activeProvider) {
    case 'openai':
      return <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-emerald-500" /></div>;
    case 'anthropic':
      return <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-amber-500" /></div>;
    case 'custom':
      return <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0"><Globe className="w-3.5 h-3.5 text-blue-500" /></div>;
    default:`;
  
  if (content.match(switchRegex)) {
    content = content.replace(switchRegex, newSwitch);
  }

  // Replace condition: if (apiConfig.activeProvider === 'gemini_default')
  content = content.replace(/apiConfig\.activeProvider === 'gemini_default'/g, 'false');

  fs.writeFileSync(filePath, content);
}

patchApp('src/App.tsx');
patchHeader('src/components/Header.tsx');
