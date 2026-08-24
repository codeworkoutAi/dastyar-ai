const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/import \{ loadApiConfig, saveApiConfig \} from '\.\/lib\/storage';\n/g, '');
appContent = appContent.replace(/import \{ AppSettings, loadSettings/g, 'import { loadSettings');
// wait, the import looks like this:
// import { \n  loadConversations,\n  saveConversations,\n  loadActiveConversationId,\n  saveActiveConversationId,\n  loadSettings,\n  saveSettings,\n  loadApiConfig,\n  saveApiConfig,\n  createNewConversation\n} from './lib/storage';
appContent = appContent.replace(/  loadApiConfig,\n/g, '');
appContent = appContent.replace(/  saveApiConfig,\n/g, '');

// Fix line 144 which is root.setAttribute('data-size', settings.appearance.fontSize || 'base');
// fontSize is now a number in our AppSettings (e.g. 16) but we had it as 'sm' | 'base' | 'lg' before.
// Actually, our new AppSettings type has `fontSize: number`. So `toString()` is needed.
appContent = appContent.replace(/root.setAttribute\('data-size', settings\.appearance\.fontSize \|\| 'base'\);/g, "root.setAttribute('data-size', String(settings.appearance.fontSize || 'base'));");

fs.writeFileSync('src/App.tsx', appContent);

let modalContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
modalContent = modalContent.replace(/import \{ AppSettings, Conversation, ApiConfig \} from '\.\.\/types';/g, "import { AppSettings, Conversation } from '../types';");
fs.writeFileSync('src/components/SettingsModal.tsx', modalContent);

