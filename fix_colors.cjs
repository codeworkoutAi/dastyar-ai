const fs = require('fs');

const files = [
  'src/components/ChatBox.tsx',
  'src/components/ExportModal.tsx',
  'src/components/MarkdownRenderer.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/Sidebar.tsx',
  'src/components/MessageInput.tsx',
  'src/components/Header.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Teal
    content = content.replace(/text-teal-400/g, 'text-teal-600 dark:text-teal-400');
    content = content.replace(/border-teal-400/g, 'border-teal-600 dark:border-teal-400');
    
    // Blue
    content = content.replace(/text-blue-400/g, 'text-blue-600 dark:text-blue-400');
    content = content.replace(/border-blue-400/g, 'border-blue-600 dark:border-blue-400');
    
    // Marker blue
    content = content.replace(/marker:text-blue-500/g, 'marker:text-blue-600 dark:marker:text-blue-500');

    // Specific tweaks for SettingsModal which has a lot of teal/blue
    content = content.replace(/bg-blue-500\/20 text-blue-600 dark:text-blue-400/g, 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400');
    content = content.replace(/border-blue-500\/30/g, 'border-blue-600/30 dark:border-blue-500/30');
    content = content.replace(/ring-blue-500\/30/g, 'ring-blue-600/30 dark:ring-blue-500/30');
    content = content.replace(/ring-blue-500\/20/g, 'ring-blue-600/20 dark:ring-blue-500/20');
    
    // Also sky-300 / sky-200 in light mode
    content = content.replace(/dark:text-sky-300/g, 'text-sky-600 dark:text-sky-300');
    content = content.replace(/dark:text-sky-200/g, 'text-sky-700 dark:text-sky-200');
    
    // Some classes might already have text-blue-600 because I ran it partially? No it failed.
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
