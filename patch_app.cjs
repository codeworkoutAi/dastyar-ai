const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove apiConfig state
content = content.replace(/  const \[apiConfig, setApiConfig\] = useState<ApiConfig>\(\(\) => loadApiConfig\(\)\);\n/g, '');
content = content.replace(/  useEffect\(\(\) => \{\n    saveApiConfig\(apiConfig\);\n  \}, \[apiConfig\]\);\n/g, '');

// Replace all usages of apiConfig
content = content.replace(/apiConfig\[apiConfig.activeProvider\]/g, 'settings.providers[settings.providers.activeProvider]');
content = content.replace(/apiConfig=\{apiConfig\}/g, 'settings={settings}');
content = content.replace(/apiConfig/g, 'settings');

// Fix SettingsModal props in App.tsx
// It used to have: apiConfig={settings} (after replace) and onSaveApiConfig={(cfg) => setApiConfig(cfg)}
// We need to clean this up.
content = content.replace(/        settings=\{settings\}\n        onSaveApiConfig=\{\(cfg\) => setSettings\(cfg\)\}\n        settings=\{settings\}\n        onSaveSettings=\{\(s\) => setSettings\(s\)\}/g, 
`        settings={settings}
        onSaveSettings={(s) => setSettings(s)}`);

content = content.replace(/import \{ ApiConfig, AppSettings, /g, 'import { AppSettings, ');
content = content.replace(/import \{ ApiConfig, /g, 'import { ');
content = content.replace(/import \{ loadApiConfig, /g, 'import { ');
content = content.replace(/, saveApiConfig/g, '');

fs.writeFileSync('src/App.tsx', content);

// Patch Header.tsx
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace(/apiConfig: ApiConfig;/g, 'settings: AppSettings;');
header = header.replace(/apiConfig,/g, 'settings,');
header = header.replace(/apiConfig\.activeProvider/g, 'settings.providers.activeProvider');
header = header.replace(/import \{ ApiConfig, /g, 'import { AppSettings, ');
fs.writeFileSync('src/components/Header.tsx', header);
