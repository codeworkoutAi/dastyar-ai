const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/      <SettingsModal\n        isOpen=\{isSettingsOpen\}\n        onClose=\{\(\) => setIsSettingsOpen\(false\)\}\n        settings=\{settings\}\n        onSaveApiConfig=\{\(cfg\) => setApiConfig\(cfg\)\}\n        settings=\{settings\}\n        onSaveSettings=\{\(s\) => setSettings\(s\)\}/g,
`      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => setSettings(s)}`);

fs.writeFileSync('src/App.tsx', content);
