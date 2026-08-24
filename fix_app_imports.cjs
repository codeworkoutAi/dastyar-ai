const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/import \{ Conversation, ChatMessage, ApiConfig, AppSettings \} from '\.\/types';/g, "import { Conversation, ChatMessage, AppSettings } from './types';");
content = content.replace(/   loadsettings,\n   savesettings,\n/g, "");
content = content.replace(/   loadApiConfig,\n   saveApiConfig,\n/g, "");
content = content.replace(/loadsettings/g, "loadSettings");
content = content.replace(/savesettings/g, "saveSettings");

fs.writeFileSync('src/App.tsx', content);
