const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/MessageInput.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We want to make the input container more like a pill, replace 'rounded-2xl' or similar with 'rounded-[32px]'
content = content.replace(/className="clay-input-box relative flex flex-col transition-all focus-within:ring-2 focus-within:ring-blue-500\/40"/g, 
  'className="bg-[var(--input-bg)] border border-[var(--border-subtle)] relative flex flex-col transition-all focus-within:border-[var(--border-strong)] rounded-[32px] overflow-hidden"');

// And we want the text area to not have huge padding bottom, let's adjust it
content = content.replace(/className={\`w-full px-5 pt-4 pb-14/g, 
  'className={`w-full px-6 pt-5 pb-16');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Input modified.');
