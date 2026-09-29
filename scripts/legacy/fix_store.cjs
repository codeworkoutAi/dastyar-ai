const fs = require('fs');
let content = fs.readFileSync('src/pages/store/StoreFront.tsx', 'utf8');

content = content.replace(
  'className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-colors duration-300"', 
  'className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300"'
);

content = content.replace(
  'className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800"', 
  'className="sticky top-0 z-40 bg-[#ebf0f8]/80 dark:bg-[#0a0b0e]/80 backdrop-blur-md clay-card-thick rounded-none border-0"'
);

content = content.replace(
  'className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"',
  'className="group flex flex-col clay-card-thick overflow-hidden cursor-pointer transition-all hover:-translate-y-1"'
);

content = content.replace(
  'opacity-50 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800',
  'opacity-60 clay-card-thick'
);
content = content.replace(
  'opacity-60 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800',
  'opacity-60 clay-card-thick'
);

content = content.replace(
  'className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity"',
  'className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 clay-btn-thick text-xs sm:text-sm font-bold"'
);

// We'll fix the category buttons manually if needed.
fs.writeFileSync('src/pages/store/StoreFront.tsx', content);
console.log('Fixed StoreFront');
