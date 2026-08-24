const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/index.css');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('@theme')) {
  const themeInjection = `@theme {
  --color-subtle: var(--border-subtle);
  --color-strong: var(--border-strong);
}

`;
  
  content = content.replace('@layer base {', themeInjection + '@layer base {');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added @theme');
} else {
  console.log('Already has @theme');
}
