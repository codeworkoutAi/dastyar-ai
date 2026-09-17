const fs = require('fs');
let content = fs.readFileSync('src/pages/store/StoreFront.tsx', 'utf8');

// Banner
content = content.replace(
  'className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm shadow-sm group hover:shadow-md transition-all"',
  'className="mb-8 p-6 clay-card-thick flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"'
);

// Success banner
content = content.replace(
  'className="mb-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale"',
  'className="mb-8 p-4 clay-card-thick !border-emerald-500/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale"'
);
content = content.replace(
  'className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shrink-0 w-full sm:w-auto cursor-pointer"',
  'className="px-4 py-2 clay-btn-thick !text-emerald-600 dark:!text-emerald-400 text-sm font-bold shrink-0 w-full sm:w-auto cursor-pointer"'
);

// Error banner
content = content.replace(
  'className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale"',
  'className="mb-8 p-4 clay-card-thick !border-red-500/50 flex flex-col sm:flex-row items-center gap-4 animate-slideUpScale"'
);

// Remove specific text colors that override clay-landing-bg
content = content.replace(/ text-zinc-[0-9]+ dark:text-zinc-[0-9]+/g, '');
content = content.replace(/ text-zinc-[0-9]+/g, '');

fs.writeFileSync('src/pages/store/StoreFront.tsx', content);
