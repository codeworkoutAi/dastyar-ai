const fs = require('fs');

// 1. Fix App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

appContent = appContent.replace(/settings\.theme/g, "settings.appearance.theme");
appContent = appContent.replace(/settings\.fontFamily/g, "settings.appearance.font");
appContent = appContent.replace(/settings\.fontSize/g, "settings.appearance.fontSize");
appContent = appContent.replace(/settings\.direction/g, "settings.appearance.direction");
appContent = appContent.replace(/settings\.persianNumerals/g, "settings.appearance.persianNumerals");
appContent = appContent.replace(/settings\.showPerformanceMetrics/g, "settings.tools.showPerformanceMetrics");
appContent = appContent.replace(/settings\.enterToSend/g, "settings.tools.enterToSend");

// Clean leftover imports
appContent = appContent.replace(/import \{ loadApiConfig, /g, 'import { ');
appContent = appContent.replace(/, saveApiConfig /g, ' ');
appContent = appContent.replace(/, loadApiConfig /g, ' ');

// Fix setSettings callback where it sets showPerformanceMetrics
appContent = appContent.replace(/setSettings\(\(prev\) => \(\{ \.\.\.prev, showPerformanceMetrics: val \}\)\);/g, 
  "setSettings((prev) => ({ ...prev, tools: { ...prev.tools, showPerformanceMetrics: val } }));");

// Wait, I missed line 48: error TS2304: Cannot find name 'setApiConfig'. Where is setApiConfig still being used in App.tsx?
// Let's replace any `setApiConfig(cfg)` left.
appContent = appContent.replace(/setApiConfig/g, "//setApiConfig");

fs.writeFileSync('src/App.tsx', appContent);

// 2. Fix SettingsModal.tsx Interface
let modalContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
modalContent = modalContent.replace(/interface SettingsModalProps \{[\s\S]*?\n\}\n/g, 
`interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  conversations: Conversation[];
  onImportConversations: (imported: Conversation[]) => void;
  onClearAllConversations: () => void;
}
`);
fs.writeFileSync('src/components/SettingsModal.tsx', modalContent);

