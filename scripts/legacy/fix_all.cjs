const fs = require('fs');
const glob = require('fs').readdirSync;

function processFile(path) {
  if(!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  let original = content;

  // Background replacements
  content = content.replace(/className="[^"]*bg-zinc-50 dark:bg-zinc-900[^"]*"/g, (match) => {
    return match.replace('bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100', 'clay-landing-bg');
  });
  content = content.replace(/className="[^"]*bg-zinc-50 dark:bg-zinc-950[^"]*"/g, (match) => {
    return match.replace('bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100', 'clay-landing-bg');
  });

  // Header replacements
  content = content.replace(/bg-white\/80 dark:bg-zinc-9[05]0\/80 backdrop-blur-md border-b border-zinc-200\/?8?0? dark:border-zinc-800/g, 'bg-[#ebf0f8]/80 dark:bg-[#0a0b0e]/80 backdrop-blur-md clay-card-thick rounded-none border-0');

  // Cards
  content = content.replace(/bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200\/?8?0? dark:border-zinc-800/g, 'clay-card-thick');
  content = content.replace(/bg-white dark:bg-zinc-900 border border-zinc-200\/?8?0? dark:border-zinc-800 rounded-3xl/g, 'clay-card-thick');
  content = content.replace(/bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200\/?8?0? dark:border-zinc-800/g, 'clay-card-thick');
  content = content.replace(/bg-white dark:bg-zinc-900 border border-zinc-200\/?8?0? dark:border-zinc-800 rounded-2xl/g, 'clay-card-thick');
  content = content.replace(/bg-white dark:bg-zinc-900 border border-zinc-200\/?8?0? dark:border-zinc-800/g, 'clay-card-thick');

  // Remove trailing shadows
  content = content.replace(/clay-card-thick shadow-xs/g, 'clay-card-thick');
  content = content.replace(/clay-card-thick shadow-sm/g, 'clay-card-thick');
  content = content.replace(/clay-card-thick shadow-md/g, 'clay-card-thick');
  content = content.replace(/clay-card-thick shadow-xl shadow-zinc-200\/40 dark:shadow-none/g, 'clay-card-thick');

  if(original !== content) {
    fs.writeFileSync(path, content);
    console.log('Fixed ' + path);
  }
}

const storeFiles = fs.readdirSync('src/pages/store').filter(f => f.endsWith('.tsx')).map(f => 'src/pages/store/' + f);
const blogFiles = fs.readdirSync('src/pages/blog').filter(f => f.endsWith('.tsx')).map(f => 'src/pages/blog/' + f);

[...storeFiles, ...blogFiles].forEach(processFile);

