const fs = require('fs');
let blog = fs.readFileSync('src/pages/blog/Blog.tsx', 'utf8');
let tag = fs.readFileSync('src/pages/blog/TagArchive.tsx', 'utf8');

const reps = [
  ['className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans"', 'className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300 font-sans"'],
  ['className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800"', 'className="sticky top-0 z-40 bg-[#ebf0f8]/80 dark:bg-[#0a0b0e]/80 backdrop-blur-md clay-card-thick rounded-none border-0"'],
  ['bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl transition-shadow', 'clay-card-thick transition-shadow'],
  ['bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 sm:p-6 mb-6', 'clay-card-thick p-5 sm:p-6 mb-6'],
  ['bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-5', 'clay-card-thick p-4 sm:p-5'],
  ['bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm', 'clay-card-thick p-6 sm:p-8'],
  ['bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400', 'clay-btn-thick'],
  ['bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm', 'clay-card-thick'],
  ['bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800', 'clay-card-thick'],
  ['bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25', 'clay-btn-primary-thick']
];

for (let r of reps) {
  blog = blog.split(r[0]).join(r[1]);
  tag = tag.split(r[0]).join(r[1]);
}

fs.writeFileSync('src/pages/blog/Blog.tsx', blog);
fs.writeFileSync('src/pages/blog/TagArchive.tsx', tag);
console.log('Fixed Blog styles');
