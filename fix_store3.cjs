const fs = require('fs');
let content = fs.readFileSync('src/pages/store/StoreFront.tsx', 'utf8');

// Header buttons
content = content.replace(
  'p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors shrink-0',
  'p-2 clay-btn-thick shrink-0'
);
content = content.replace(
  'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-bold transition-colors',
  'hidden sm:flex items-center gap-1.5 px-3 py-1.5 clay-btn-thick text-sm font-bold'
);

// Badges
content = content.replace(
  'absolute top-3.5 right-3.5 text-[11px] font-bold px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 rounded-lg shadow-sm backdrop-blur-sm',
  'absolute top-3.5 right-3.5 text-[11px] font-bold px-2.5 py-1 clay-charcoal'
);

// Image placeholders
content = content.replace(
  'w-full h-48 bg-zinc-100 dark:bg-zinc-800 relative flex-shrink-0 overflow-hidden',
  'w-full h-48 clay-inset-thick relative flex-shrink-0 overflow-hidden rounded-b-none border-t-0 border-l-0 border-r-0'
);

fs.writeFileSync('src/pages/store/StoreFront.tsx', content);
