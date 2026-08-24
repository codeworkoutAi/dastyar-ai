const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/apiConfig\.provider/g, 'apiConfig.activeProvider');
  content = content.replace(/apiConfig\?\.provider/g, 'apiConfig?.activeProvider');
  content = content.replace(/apiConfig\.modelName/g, '(apiConfig[apiConfig.activeProvider]?.modelName)');
  content = content.replace(/apiConfig\?\.modelName/g, '(apiConfig[apiConfig.activeProvider]?.modelName)');
  fs.writeFileSync(filePath, content);
}

patchFile('src/App.tsx');
patchFile('src/components/Header.tsx');
