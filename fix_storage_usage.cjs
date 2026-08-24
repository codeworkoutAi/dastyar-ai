const fs = require('fs');
let content = fs.readFileSync('src/lib/storage.ts', 'utf8');

const getStorageUsageCode = `
export function getStorageUsage(): { 
  usedBytes: number; 
  usedKb: string; 
  usedMb: string; 
  totalKb: number; 
  percent: number; 
  conversationsCount: number; 
  messagesCount: number; 
  count: number; 
} {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        total += (key.length + val.length) * 2;
      }
    }
    const usedKbNum = total / 1024;
    const maxCapacityKb = 5 * 1024;
    const percentage = Math.min(100, Math.max(0, (usedKbNum / maxCapacityKb) * 100));
    const convs = loadConversations();
    const msgsCount = convs.reduce((acc, c) => acc + (c.messages ? c.messages.length : 0), 0);
    return {
      usedBytes: total,
      usedKb: usedKbNum.toFixed(1),
      usedMb: (usedKbNum / 1024).toFixed(2),
      totalKb: maxCapacityKb,
      percent: Math.round(percentage * 10) / 10,
      conversationsCount: convs.length,
      messagesCount: msgsCount,
      count: convs.length,
    };
  } catch {
    return {
      usedBytes: 0,
      usedKb: '0.0',
      usedMb: '0.00',
      totalKb: 5120,
      percent: 0,
      conversationsCount: 0,
      messagesCount: 0,
      count: 0,
    };
  }
}
`;

content = content + '\n' + getStorageUsageCode;
fs.writeFileSync('src/lib/storage.ts', content);

// Also remove `ApiConfig` from SettingsModal.tsx import since it no longer exists
let modalContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
modalContent = modalContent.replace(/import \{ AppSettings, Conversation, ApiConfig \} from '\.\.\/types';/g, "import { AppSettings, Conversation } from '../types';");
fs.writeFileSync('src/components/SettingsModal.tsx', modalContent);

