const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// Remove the early return from its current position
content = content.replace(/  if \(!isOpen\) return null;\n\n/g, '');

// Place it right before the return statement of the component
// The component returns `( <div className="fixed ...`
content = content.replace(/  return \(\n    <div className="fixed/g, '  if (!isOpen) return null;\n\n  return (\n    <div className="fixed');

fs.writeFileSync('src/components/SettingsModal.tsx', content);
