const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/MessageInput.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'className="clay-input-box relative flex flex-col transition-all focus-within:ring-2 focus-within:ring-blue-500/40"', 
  'className="bg-[var(--input-bg)] border border-[var(--border-subtle)] relative flex flex-col transition-all focus-within:border-[var(--border-strong)] rounded-[32px] overflow-hidden"'
);

content = content.replace(
  'className={`w-full px-5 pt-4 pb-14 bg-transparent resize-none text-sm sm:text-base text-inherit placeholder:opacity-50 focus:outline-hidden disabled:opacity-60 leading-relaxed max-h-[180px]', 
  'className={`w-full px-6 pt-5 pb-16 bg-transparent resize-none text-sm sm:text-base text-inherit placeholder:opacity-50 focus:outline-hidden disabled:opacity-60 leading-relaxed max-h-[180px]'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Input modified successfully.');
